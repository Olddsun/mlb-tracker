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

  // ── 讀取圖片 buffer（在回應前讀完，背景才能用）
  const imageBuffers = []
  for (let i = 0; i < 5; i++) {
    const file = formData.get(`image_${i}`)
    if (!file) return json({ error: `缺少第 ${i + 1} 張截圖` }, 400)
    imageBuffers.push(await file.arrayBuffer())
  }

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

  // ── 並行上傳 5 張截圖
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

    // Claude Vision
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: `你是 MLB The Show box score 解析器。給你 5 張截圖（順序不固定），請：
1. 判斷每張圖角色：line_score（總比分+逐局）、batting（打擊成績）、pitching（投手成績）
2. 根據玩家隊伍對應，將數據正確歸屬給各玩家
3. 只解析截圖中實際存在的資訊，不推測
4. 若欄位不清楚，設 needsReview: true 並列入 uncertainties
5. 若有截圖完全無法辨識，設 fatalError: true
回傳純 JSON，不加任何說明文字。`,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: `玩家隊伍對應：${rawUserInput}\n以下是 5 張截圖（順序不固定）：` },
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
    let parsed
    try {
      const raw = claudeData.content[0].text.replace(/```json\n?|\n?```/g, '').trim()
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('Claude 回傳格式錯誤')
    }

    if (parsed.fatalError) throw new Error(parsed.fatalErrorMessage || '截圖無法辨識')

    await updateSub(SUPABASE_URL, sbHeaders, submissionId, {
      parsed_game_json: parsed,
      needs_review: parsed.needsReview ?? false,
      uncertainties: parsed.uncertainties ?? [],
      player_a: parsed.home_player,
      team_a: parsed.home_team,
      player_b: parsed.away_player,
      team_b: parsed.away_team,
    })

    // 硬性驗證
    const validationError = validateGame(parsed)
    if (validationError) throw new Error(validationError)

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
