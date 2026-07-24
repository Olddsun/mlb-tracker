export async function onRequest(context) {
  const { env, request, waitUntil } = context

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = env.SUPABASE_URL
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY
  const BUCKET = env.SUPABASE_BUCKET || 'box-score-submissions'
  const sbHeaders = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

  let formData
  try { formData = await request.formData() } catch {
    return json({ error: '請求格式錯誤' }, 400)
  }

  const submittedBy = formData.get('submittedBy')
  const token = formData.get('token')
  const rawUserInput = formData.get('rawUserInput')

  // ── Token 驗證
  const PLAYER_TOKENS = JSON.parse(env.PLAYER_TOKENS || '{}')
  if (!submittedBy || PLAYER_TOKENS[submittedBy] !== token) {
    return json({ error: 'Token 錯誤' }, 401)
  }

  // ── 讀取圖片 buffer（張數不限，讀到沒有 image_i 為止；在回應前讀完，背景才能用）
  const imageBuffers = []
  for (let i = 0; ; i++) {
    const file = formData.get(`image_${i}`)
    if (!file) break
    imageBuffers.push(await file.arrayBuffer())
  }
  if (imageBuffers.length === 0) return json({ error: '請至少上傳 1 張截圖' }, 400)

  // ── 建立 submission
  const submissionId = crypto.randomUUID()
  const imagePaths = imageBuffers.map((_, i) => `${submissionId}/${i}.jpg`)

  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      id: submissionId,
      submitted_by: submittedBy.toLowerCase(),
      raw_user_input: rawUserInput,
      image_paths: imagePaths,
      status: 'received',
    }),
  })
  if (!dbRes.ok) return json({ error: '建立記錄失敗，請稍後重試' }, 500)

  // ── 並行上傳所有截圖
  const uploadResults = await Promise.all(
    imageBuffers.map((buf, i) =>
      fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${imagePaths[i]}`, {
        method: 'POST',
        headers: { ...sbHeaders, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
        body: buf,
      })
    )
  )
  const failedIdx = uploadResults.findIndex(r => !r.ok)
  if (failedIdx >= 0) {
    await failSub(SUPABASE_URL, sbHeaders, submissionId, `截圖 ${failedIdx + 1} 上傳失敗`)
    return json({ error: `截圖 ${failedIdx + 1} 上傳失敗，請重試` }, 500)
  }

  await updateSub(SUPABASE_URL, sbHeaders, submissionId, { status: 'uploaded' })

  // ── 立刻回傳，背景繼續處理
  waitUntil(processGame(env, submissionId, imageBuffers, rawUserInput, submittedBy.toLowerCase()))

  return json({ submissionId, status: 'processing' })
}

// ── 背景處理：Claude Vision + 驗證 + 寫 DB ────────────────────

async function processGame(env, submissionId, imageBuffers, rawUserInput, submittedBy) {
  const SUPABASE_URL = env.SUPABASE_URL
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY
  const sbHeaders = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

  try {
    await updateSub(SUPABASE_URL, sbHeaders, submissionId, { status: 'parsing' })

    // 轉 base64
    const imageBase64s = imageBuffers.map(buf => bufToBase64(buf))

    // 先用 Haiku（快、便宜）解析並過硬性驗證；沒過就換 Sonnet（準）重跑一次
    const attempt = async (model) => {
      const p = await parseWithModel(env, model, imageBase64s, rawUserInput, imageBuffers.length)
      if (p.fatalError) throw new Error(p.fatalErrorMessage || '截圖無法辨識')
      const v = validateGame(p)
      if (v) throw new Error(v)
      return p
    }
    let parsed, usedModel
    try {
      parsed = await attempt('claude-haiku-4-5')
      usedModel = 'haiku'
    } catch (haikuErr) {
      // Haiku 看錯 / 格式錯 / 驗證不過 → 用 Sonnet 補救；再失敗才真的失敗（往上拋給 catch）
      parsed = await attempt('claude-sonnet-4-6')
      usedModel = 'sonnet'
    }

    await updateSub(SUPABASE_URL, sbHeaders, submissionId, {
      parsed_game_json: parsed,
      needs_review: parsed.needsReview ?? false,
      uncertainties: parsed.uncertainties ?? [],
      player_a: parsed.home_player,
      team_a: parsed.home_team,
      player_b: parsed.away_player,
      team_b: parsed.away_team,
    })

    // 重複偵測
    const duplicates = await detectDuplicates(SUPABASE_URL, sbHeaders, parsed)

    // 寫入正式 DB
    const gameId = await writeGame(SUPABASE_URL, sbHeaders, parsed, submissionId, submittedBy)

    await updateSub(SUPABASE_URL, sbHeaders, submissionId, {
      status: 'committed',
      game_id: gameId,
      duplicate_candidates: duplicates,
    })
  } catch (e) {
    await failSub(SUPABASE_URL, sbHeaders, submissionId, e.message)
  }
}

// ── Claude Vision 解析（可指定模型）────────────────────────────

async function parseWithModel(env, model, imageBase64s, rawUserInput, imageCount) {
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: `你是 MLB The Show 的 box score 解析器，任務是把截圖裡的數字「一字不差」地讀出來。給你 ${imageCount} 張截圖（順序不固定，可能來自兩隊）。嚴格照下列規則：

【判讀原則】
- 只讀截圖上實際看得到的數字，逐格對齊欄位讀，絕不推測或估算。
- 讀完先在心中核對加總；對不起來就回頭重看那張圖，不要硬湊數字。
- 真的看不清楚的欄位，設 needsReview: true 並在 uncertainties 說明是哪裡，不要填猜的值。
- 完全無法辨識的圖，設 fatalError: true。

【每張圖角色】line_score（最上方比分+逐局）、batting（打擊表）、pitching（投手表）。兩隊的 batting/pitching 各自獨立，依玩家隊伍對應歸屬。

【逐局比分 line_score】
- 上面那隊是客隊(away)、下面那隊是主隊(home)。
- ⚠️ 逐局那排最左邊的「第 1 局」常被隊名面板擋住 —— R（總分）才是準的。把讀到的各局加起來若小於 R，差額就是被擋住的局（通常在第 1 局）；務必讓逐局加總 = R。
- 可能是延長賽（超過 9 局），有幾欄就讀幾欄。主隊贏球沒打下半局會顯示 "X"。

【打擊表 batting】欄位固定為 AB、R、H、RBI、BB、SO、AVG，逐欄對齊讀。最下方 TOTALS 列是對帳基準：各打者 H 加總要等於 TOTALS 的 H、R 加總等於 TOTALS 的 R，不符就重讀。
- ⚠️ 打擊表沒有 HR 欄位！全壘打要從表格下方「BATTING」區塊的「HR:」那行讀：列出的每個名字算 1 轟，同一名字出現多次或標「名字 2」就是多轟，據此填該打者的 hr。沒列到的人 hr = 0。
- 盜壘從 BASERUNNING 的「SB:」讀（可含次數）。

【投手表 pitching】欄位為 IP、H、R、ER、BB、SO、ERA，逐欄對齊。投手名字後括號是勝敗註記：(W, 6-3)→decision "W"、record "6-3"；(L, 0-2)→"L"、"0-2"；(SV, 7)→"SV"、"7"；(HLD)→"HLD"。
- IP 是棒球格式（7.1 代表 7⅓局、0.2 代表 ⅔局、9.0 代表 9 局），原樣保留字串，絕不換算成小數。
- 對帳：每隊投手的失分(R)加總，必須等於「對手」的總得分，不符就重讀。

【其他】player_of_game 從賽後畫面（Player of the Game）讀。所有名字保留原始拼寫，含重音字與 Jr./II/III 等後綴。

回傳純 JSON，不加任何說明文字。`,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `玩家隊伍對應：${rawUserInput}\n以下是 ${imageCount} 張截圖（順序不固定）：` },
          ...imageBase64s.map(b64 => ({
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: b64 },
          })),
          { type: 'text', text: `回傳以下 JSON 格式：
{
  "image_roles": [{"index":0,"role":"batting","team":"Yankees","confidence":"high"}],
  "home_player": "scott",
  "away_player": "alvin",
  "home_team": "Yankees",
  "away_team": "Dodgers",
  "home_score": 5,
  "away_score": 3,
  "winner": "scott",
  "player_of_game": {"name":"Aaron Judge","team":"Yankees"},
  "innings": {"home":["0","2","0","0","1","0","2","0","0"],"away":["0","0","0","0","0","0","0","0","X"]},
  "batting": {"home":[{"name":"Aaron Judge","pos":"RF","ab":4,"r":1,"h":2,"rbi":1,"bb":0,"so":1,"hr":1}],"away":[]},
  "pitching": {"home":[{"name":"Max Fried","decision":"W","record":"19-5","ip":"9.0","h":5,"r":0,"er":0,"bb":0,"so":3}],"away":[]},
  "notes": {"hr":["Aaron Judge"],"sb":[{"name":"Trea Turner","count":2}],"errors":["Brandon Marsh"]},
  "needsReview": false,
  "uncertainties": [],
  "fatalError": false,
  "fatalErrorMessage": null
}` },
        ],
      }],
    }),
  })

  if (!claudeRes.ok) {
    const err = await claudeRes.text()
    throw new Error(`Claude API ${claudeRes.status}: ${err.slice(0, 200)}`)
  }
  const claudeData = await claudeRes.json()
  const raw = claudeData.content[0].text.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(raw)   // 格式錯會 throw，交由上層決定是否換模型補救
}

// ── 驗證 ──────────────────────────────────────────────────────

function validateGame(p) {
  if (p.winner === p.home_player && p.home_score <= p.away_score) return '勝負與比分不一致'
  if (p.winner === p.away_player && p.away_score <= p.home_score) return '勝負與比分不一致'
  const sum = arr => arr.reduce((s, v) => { const n = parseInt(v); return s + (isNaN(n) ? 0 : n) }, 0)
  if (p.innings?.home && sum(p.innings.home) !== p.home_score) return `主場逐局加總（${sum(p.innings.home)}）與總分（${p.home_score}）不符`
  if (p.innings?.away && sum(p.innings.away) !== p.away_score) return `客場逐局加總（${sum(p.innings.away)}）與總分（${p.away_score}）不符`
  for (const pi of [...(p.pitching?.home ?? []), ...(p.pitching?.away ?? [])]) {
    if (pi.ip && !/^\d+\.[012]$/.test(String(pi.ip))) return `${pi.name} 局數格式錯誤（${pi.ip}）`
  }
  return null
}

async function detectDuplicates(SUPABASE_URL, headers, p) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/games?played_at=eq.${today}&sport=eq.mlb&select=id,game_sides(player_id)`,
      { headers }
    )
    const games = await res.json()
    return games.filter(g => {
      const players = new Set((g.game_sides || []).map(s => s.player_id))
      return players.has(p.home_player) && players.has(p.away_player)
    }).map(g => g.id)
  } catch { return [] }
}

async function writeGame(SUPABASE_URL, headers, p, submissionId, submittedBy) {
  const ph = { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
  const h = { ...headers, 'Content-Type': 'application/json' }

  const gameRes = await fetch(`${SUPABASE_URL}/rest/v1/games`, {
    method: 'POST', headers: ph,
    body: JSON.stringify({
      played_at: new Date().toISOString().slice(0, 10),
      sport: 'mlb',
      winner_player_id: (p.winner || '').toLowerCase(),
      player_of_game_name: p.player_of_game?.name ?? null,
      player_of_game_team: p.player_of_game?.team ?? null,
      submitted_by: submittedBy,
      submission_id: submissionId,
      source: 'ai_submission',
    }),
  })
  if (!gameRes.ok) throw new Error(`games 寫入失敗：${await gameRes.text()}`)
  const gameBody = await gameRes.json()
  const game = Array.isArray(gameBody) ? gameBody[0] : gameBody
  if (!game?.id) throw new Error('games 寫入失敗：無回傳 ID')
  const gameId = game.id

  for (const isHome of [true, false]) {
    const batting = isHome ? p.batting?.home : p.batting?.away
    const pitching = isHome ? p.pitching?.home : p.pitching?.away

    const sideRes = await fetch(`${SUPABASE_URL}/rest/v1/game_sides`, {
      method: 'POST', headers: ph,
      body: JSON.stringify({
        game_id: gameId,
        player_id: (isHome ? p.home_player : p.away_player).toLowerCase(),
        team_name: isHome ? p.home_team : p.away_team,
        team_full: isHome ? p.home_team : p.away_team,
        home_away: isHome ? 'home' : 'away',
        runs: isHome ? p.home_score : p.away_score,
        hits: (batting ?? []).reduce((s, b) => s + (b.h ?? 0), 0),
        errors: 0,
        innings: isHome ? (p.innings?.home ?? []) : (p.innings?.away ?? []),
      }),
    })
    if (!sideRes.ok) throw new Error(`game_sides 寫入失敗：${await sideRes.text()}`)
    const sideBody = await sideRes.json()
    const side = Array.isArray(sideBody) ? sideBody[0] : sideBody
    if (!side?.id) throw new Error('game_sides 寫入失敗：無回傳 ID')

    if (batting?.length) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/batting_lines`, {
        method: 'POST', headers: h,
        body: JSON.stringify(batting.map((b, i) => ({
          game_side_id: side.id, batting_order: i + 1,
          name: b.name, pos: b.pos || null,
          ab: b.ab ?? 0, r: b.r ?? 0, h: b.h ?? 0,
          rbi: b.rbi ?? 0, bb: b.bb ?? 0, so: b.so ?? 0, hr: b.hr ?? 0,
        }))),
      })
      if (!r.ok) throw new Error(await r.text())
    }

    if (pitching?.length) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/pitching_lines`, {
        method: 'POST', headers: h,
        body: JSON.stringify(pitching.map((pi, i) => ({
          game_side_id: side.id, pitching_order: i + 1,
          name: pi.name, decision: pi.decision || null, record: pi.record || null,
          ip: pi.ip, h: pi.h ?? 0, r: pi.r ?? 0, er: pi.er ?? 0,
          bb: pi.bb ?? 0, so: pi.so ?? 0,
        }))),
      })
      if (!r.ok) throw new Error(await r.text())
    }
  }

  const notes = p.notes ?? {}
  const toArr = v => Array.isArray(v) ? v : (v ? [v] : [])
  const noteRows = [
    ...toArr(notes.hr).map(name => ({ game_id: gameId, note_type: 'hr', player_name: String(name), count: 1 })),
    ...toArr(notes.sb).map(sb => ({
      game_id: gameId, note_type: 'sb',
      player_name: typeof sb === 'string' ? sb : sb.name,
      count: typeof sb === 'string' ? 1 : (sb.count ?? 1),
    })),
    ...toArr(notes.errors).map(name => ({ game_id: gameId, note_type: 'error', player_name: String(name), count: 1 })),
  ]
  if (noteRows.length) {
    await fetch(`${SUPABASE_URL}/rest/v1/game_notes`, { method: 'POST', headers: h, body: JSON.stringify(noteRows) })
  }

  return gameId
}

// ── Helpers ───────────────────────────────────────────────────

function bufToBase64(buf) {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

const updateSub = (url, h, id, data) =>
  fetch(`${url}/rest/v1/submissions?id=eq.${id}`, {
    method: 'PATCH', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })

const failSub = (url, h, id, msg) =>
  updateSub(url, h, id, { status: 'failed', error_message: msg })

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
