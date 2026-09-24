// 解析模型：Haiku 4.5 讀手機拍電視的九列打擊表會整列錯位（同一組截圖上傳四次、錯的格子都一樣），
// 2026-09-25 起改用 Sonnet 5，並靠 validateMlbTables 的硬性對帳把讀錯的擋下來（讀不準頂多重傳，不會寫錯資料）。
// 注意 thinking / output_config 兩個參數 Haiku 不支援，改回 Haiku 要一併拿掉。
const PARSE_MODEL = 'claude-sonnet-5'

// 數字欄位統一轉整數（模型偶爾回字串、缺欄位當 0）
const toInt = v => { const n = typeof v === 'number' ? v : parseInt(v); return isNaN(n) ? 0 : n }

export async function onRequest(context) {
  const { request } = context
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const ct = request.headers.get('content-type') || ''
  // JSON = 使用者按「確認記錄」的第二階段；multipart = 上傳截圖解析的第一階段
  return ct.includes('application/json') ? commitPhase(context) : parsePhase(context)
}

// ── 階段一：上傳截圖 → AI 解析 → 存起來等使用者確認（尚未寫入正式資料）
async function parsePhase(context) {
  const { env, request } = context

  const SUPABASE_URL = env.SUPABASE_URL
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY
  const BUCKET = env.SUPABASE_BUCKET || 'box-score-submissions'
  const sbHeaders = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

  let formData
  try { formData = await request.formData() } catch {
    return json({ error: '請求格式錯誤' }, 400)
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

  // ── 同步解析後存起來、回傳給前端審核（尚未寫入正式資料，等使用者指定玩家＋確認）
  const result = await processGame(env, submissionId, imageBuffers)
  if (!result.ok) return json({ status: 'failed', error: result.error })
  return json({
    status: 'parsed', submissionId, game: result.game, duplicates: result.duplicates,
    needsReview: result.needsReview, uncertainties: result.uncertainties,
  })
}

// ── 階段二：使用者確認後，把已解析的結果寫入正式資料 ────────────────
async function commitPhase(context) {
  const { env, request } = context
  const SUPABASE_URL = env.SUPABASE_URL
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY
  const sbHeaders = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

  let body
  try { body = await request.json() } catch { return json({ error: '格式錯誤' }, 400) }
  const submissionId = body && body.submissionId
  if (!submissionId) return json({ error: '缺少 submissionId' }, 400)

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/submissions?id=eq.${submissionId}&select=parsed_game_json,submitted_by,status,game_id,needs_review,duplicate_candidates`,
    { headers: sbHeaders }
  )
  const [sub] = await res.json()
  if (!sub) return json({ error: '找不到提交記錄' }, 404)
  if (sub.status === 'committed' && sub.game_id) {   // 已記錄過（重複點確認）→ 直接回成功
    return json({ ok: true, game: toDisplayGame(sub.parsed_game_json), warnings: buildWarnings(sub) })
  }
  const parsed = sub.parsed_game_json
  if (!parsed) return json({ error: '沒有可記錄的資料，請重新上傳' }, 400)

  // ── 玩家指定：核對畫面選好「兩隊各是誰」才能記錄（可以是既有玩家或新名字）
  const homePlayer = String(body.homePlayer || '').trim()
  const awayPlayer = String(body.awayPlayer || '').trim()
  if (!homePlayer || !awayPlayer) return json({ error: '請先指定兩隊各是哪位玩家' }, 400)
  if (homePlayer.length > 20 || awayPlayer.length > 20) return json({ error: '玩家名稱太長（上限 20 字）' }, 400)
  const homeId = homePlayer.toLowerCase()
  const awayId = awayPlayer.toLowerCase()
  if (homeId === awayId) return json({ error: '兩隊不能是同一位玩家' }, 400)

  // 確保 players 表有這兩位：新玩家自動建立，既有玩家跳過（不覆蓋原本的顯示名）
  const upRes = await fetch(`${SUPABASE_URL}/rest/v1/players?on_conflict=id`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify([
      { id: homeId, display_name: homePlayer },
      { id: awayId, display_name: awayPlayer },
    ]),
  })
  if (!upRes.ok) return json({ error: `玩家建立失敗：${(await upRes.text()).slice(0, 200)}` }, 500)

  parsed.home_player = homeId
  parsed.away_player = awayId
  parsed.home_player_name = homePlayer
  parsed.away_player_name = awayPlayer
  parsed.winner = parsed.home_score > parsed.away_score ? parsed.home_player : parsed.away_player

  // 先把玩家指定寫回 submission 再寫正式資料，中斷重試時畫面才有名字
  await updateSub(SUPABASE_URL, sbHeaders, submissionId, {
    parsed_game_json: parsed,
    player_a: parsed.home_player, team_a: parsed.home_team,
    player_b: parsed.away_player, team_b: parsed.away_team,
  })

  // 防重複寫入：若這筆 submission 已經寫過 game（快速連點/兩個分頁），直接回既有結果
  const existRes = await fetch(`${SUPABASE_URL}/rest/v1/games?submission_id=eq.${submissionId}&select=id`, { headers: sbHeaders })
  const existing = await existRes.json()
  if (Array.isArray(existing) && existing.length) {
    await updateSub(SUPABASE_URL, sbHeaders, submissionId, { status: 'committed', game_id: existing[0].id })
    return json({ ok: true, game: toDisplayGame(parsed), warnings: buildWarnings(sub) })
  }

  try {
    const gameId = await writeGame(SUPABASE_URL, sbHeaders, parsed, submissionId)
    await updateSub(SUPABASE_URL, sbHeaders, submissionId, { status: 'committed', game_id: gameId })
    return json({ ok: true, game: toDisplayGame(parsed), warnings: buildWarnings(sub) })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}

// ── 背景處理：Claude Vision + 驗證 + 寫 DB ────────────────────

async function processGame(env, submissionId, imageBuffers) {
  const SUPABASE_URL = env.SUPABASE_URL
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY
  const sbHeaders = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

  try {
    await updateSub(SUPABASE_URL, sbHeaders, submissionId, { status: 'parsing' })

    // 轉 base64
    const imageBase64s = imageBuffers.map(buf => bufToBase64(buf))

    // 解析 → 逐局補正 → 硬性驗證（打擊／投手表逐欄加總對 TOTALS、勝敗投手唯一…），沒過就如實回報、不寫入
    const parsed = await parseWithModel(env, imageBase64s)
    const validationError = prepareParsed(parsed)
    if (validationError) throw new Error(validationError)

    const duplicates = await detectDuplicates(SUPABASE_URL, sbHeaders, parsed)

    // 存起來、狀態回 'uploaded'（DB CHECK 沒有 'parsed'），等使用者按確認才寫入正式資料
    await updateSub(SUPABASE_URL, sbHeaders, submissionId, {
      parsed_game_json: parsed,
      needs_review: parsed.needsReview ?? false,
      uncertainties: parsed.uncertainties ?? [],
      duplicate_candidates: duplicates,
      status: 'uploaded',
      team_a: parsed.home_team,
      team_b: parsed.away_team,
    })

    return {
      ok: true, game: toDisplayGame(parsed), duplicates,
      needsReview: parsed.needsReview ?? false,
      uncertainties: Array.isArray(parsed.uncertainties) ? parsed.uncertainties : [],
    }
  } catch (e) {
    await failSub(SUPABASE_URL, sbHeaders, submissionId, e.message)
    return { ok: false, error: e.message }
  }
}

// ── Claude Vision 解析 ─────────────────────────────────────────

async function parseWithModel(env, imageBase64s) {
  const imageCount = imageBase64s.length
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: PARSE_MODEL,
      max_tokens: 16000,                       // thinking 也算在裡面，太小 JSON 會被截斷
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },     // 讀表格靠的是看圖，不用想太久；high 會拖長回應時間
      system: `你是對戰遊戲 box score 截圖解析器，任務是把截圖裡的數字「一字不差」地讀出來。給你 ${imageCount} 張截圖（順序不固定）。嚴格照下列規則：

【第一步：判斷運動】
- 棒球 box score（比分逐局表／打擊表／投手表）→ sport = "mlb"（MLB The Show）
- NBA 2K「球隊比較」整場數據畫面（兩隊 logo 分列左右、中間一欄逐列數據對比）→ sport = "nba2k"

【判讀原則】（通用）
- 只讀截圖上實際看得到的數字，逐格對齊欄位讀，絕不推測或估算。
- 讀完先在心中核對加總；對不起來就回頭重看那張圖，不要硬湊數字。
- 真的看不清楚的欄位，設 needsReview: true 並在 uncertainties 說明是哪裡，不要填猜的值。
- 完全無法辨識的圖，設 fatalError: true。

【籃球 nba2k】
- 畫面左側是客隊（比分下方標「客隊」）、右側是主隊（標「主隊」）；隊名在最上方左右兩欄（例 Knicks、Spurs）。
- 中間欄逐列讀：得分、投籃命中（命中/出手 與 %）、三分球、罰球、快攻得分、禁區內得分、二次進攻得分、板凳球員得分、助攻、進攻籃板、防守籃板、抄截、阻攻、失誤（括號內是對手藉失誤得到的分數）、球隊犯規、灌籃、最大領先、持球時間、剩餘暫停數。
- 對帳：每隊 得分 = 2×投籃命中數 + 三分命中數 + 罰球命中數（三分已含在投籃命中內），不符就重讀。

【棒球 mlb — 每張圖角色】line_score（最上方比分+逐局）、batting（打擊表）、pitching（投手表）。兩隊的 batting/pitching 各自獨立，依截圖上的隊伍名稱歸屬（你不知道玩家是誰，只要分清楚兩支隊伍即可）。

【逐局比分 line_score】
- 上面那隊是客隊(away)、下面那隊是主隊(home)。主客只看逐局表的上下順序，不要用 logo、隊名出現的先後或其他畫面判斷。
- 逐局表最上面那排是「局數編號」，每一欄都要對照編號讀。延長賽時畫面會往右捲、只顯示最後 9 局（例如編號 3、4、…、11，第 1–2 局不在畫面上）。innings 只填畫面上看得到的欄、不要自己補被捲掉的局；把最右邊那欄的局數編號填進 last_inning_number（正常 9 局賽是 9、11 局延長賽是 11），程式會據此推算被捲掉的局數。
  主隊贏球沒打下半局會顯示 "X"，照填 "X"（當 0 算）。
- 逐局表右側的 R、H、E 三欄照隊伍填進 line_score（R 要等於該隊總分；H 是全隊安打數，程式會拿來跟打擊表對帳；E 是失誤數）。
- ⚠️ 逐局那排最左邊的「第 1 局」常被隊名面板擋住 —— R（總分）才是準的。

★ 記錄比分前，兩隊都要各做一次「累計驗算」，這是最重要的一步：
  1. 從第 1 局開始，逐局把該局得分往後累加，寫出每一局結束時的累計分數。
     例：逐局 0,2,0,1 → 累計 0,2,2,3。
  2. 最後一局的累計分數，必須等於該隊 R 欄的總分。
  3. 對得上 → 這隊的逐局與總分都可信，照讀到的填。
  4. 對不上 →
     - 累計「小於」R：代表有某一局沒讀到（最常見是被隊名面板擋住的第 1 局；延長賽被捲掉的前幾局則不用補，填好 last_inning_number 即可）。
       回頭把每一局重看一次，確認到底是哪一局漏掉、補上正確的數字，讓累計 = R。
       真的看不出是哪一局，才把差額補在第 1 局，並設 needsReview: true、
       在 uncertainties 寫「第 X 局被擋住，用總分回推」。
     - 累計「大於」R：代表某一局讀多了（常見是把兩位數看錯、或欄位對錯格）。
       務必回頭重讀，不可以直接改 R 去遷就，也不可以隨便刪掉某局的分數。
  5. 兩隊各自都要通過這個驗算，才可以輸出 innings 與 home_score / away_score。
- 交叉檢查：勝負要與 R 一致，對不上就重讀。

【打擊表 batting】欄位固定為 AB、R、H、RBI、BB、SO、AVG。
- ⚠️ 逐列讀法：先鎖定一位打者的名字，沿「同一列」往右讀完 AB→SO 七個數字，才換下一位。截圖是手機拍電視、常有角度，數字那幾欄看起來會比名字略高或略低——一律以名字所在那一列為準，不可以拿上一列或下一列的數字來用。九位打者讀完後，再讀最下方的 TOTALS 列。
- TOTALS 列是對帳基準，六欄都要對：各打者的 AB、R、H、RBI、BB、SO 逐欄加總，必須分別等於 TOTALS 的 AB、R、H、RBI、BB、SO；任何一欄對不上就整張表重讀。把 TOTALS 列的六個數字原樣填進 batting_totals。
- ⚠️ 打擊表沒有 HR 欄位！全壘打要從表格下方「BATTING」區塊的「HR:」那行讀：列出的每個名字算 1 轟，同一名字出現多次或標「名字 2」就是多轟，據此填該打者的 hr。沒列到的人 hr = 0。
- 盜壘從 BASERUNNING 的「SB:」讀（可含次數）。

【投手表 pitching】欄位為 IP、H、R、ER、BB、SO、ERA，同樣以名字那一列為準逐列讀。投手名字後括號是勝敗註記：(W, 6-3)→decision "W"、record "6-3"；(L, 0-2)→"L"、"0-2"；(SV, 7)→"SV"、"7"；(HLD, 12)→"HLD"、"12"；(BS, 4)→"BS"（救援失敗）、"4"。沒有括號的投手 decision 填 null。只有 BS 一個註記時就填 "BS"，不可以改成 W。
- 同一位投手可能同時有兩個註記（例如 (BS, 2)(W, 3-1)：救援失敗後隊友又逆轉贏球）：decision 填 W 或 L 那個（勝敗優先），record 填它後面的戰績。
- 整場只會有一位 W（在贏的那隊）和一位 L（在輸的那隊），讀到兩位 W 或兩位 L 就是讀錯了。
- TOTALS 列同樣是對帳基準：各投手的 IP、H、R、ER、BB、SO 逐欄加總要等於 TOTALS（IP 用棒球算法：7.1 + 1.2 = 9.0），把 TOTALS 列填進 pitching_totals。
- 交叉對帳：每隊投手的 H 加總 = 對手打擊表的 H 加總、SO 加總 = 對手打擊表的 SO 加總；每位投手的 ER 不可能大於 R。
- IP 是棒球格式（7.1 代表 7⅓局、0.2 代表 ⅔局、9.0 代表 9 局），原樣保留字串，絕不換算成小數。
- 對帳：每隊投手的失分(R)加總，必須等於「對手」的總得分，不符就重讀。

【其他】player_of_game 從賽後畫面（Player of the Game）讀。所有名字保留原始拼寫，含重音字與 Jr./II/III 等後綴。

回傳純 JSON，不加任何說明文字。`,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `以下是 ${imageCount} 張截圖（順序不固定）：` },
          ...imageBase64s.map(b64 => ({
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: b64 },
          })),
          { type: 'text', text: `回傳純 JSON。棒球（sport = "mlb"）格式：
{
  "sport": "mlb",
  "image_roles": [{"index":0,"role":"batting","team":"Yankees","confidence":"high"}],
  "home_team": "Yankees",
  "away_team": "Dodgers",
  "home_score": 5,
  "away_score": 3,
  "player_of_game": {"name":"Aaron Judge","team":"Yankees"},
  "last_inning_number": 9,
  "line_score": {"home":{"r":5,"h":9,"e":0},"away":{"r":3,"h":7,"e":1}},
  "innings": {"home":["0","2","0","0","1","0","2","0","0"],"away":["0","0","0","0","0","0","0","0","X"]},
  "batting": {"home":[{"name":"Aaron Judge","pos":"RF","ab":4,"r":1,"h":2,"rbi":1,"bb":0,"so":1,"hr":1}],"away":[]},
  "batting_totals": {"home":{"ab":34,"r":5,"h":9,"rbi":5,"bb":2,"so":7},"away":{"ab":33,"r":3,"h":7,"rbi":3,"bb":1,"so":9}},
  "pitching": {"home":[{"name":"Max Fried","decision":"W","record":"19-5","ip":"9.0","h":5,"r":0,"er":0,"bb":0,"so":3}],"away":[]},
  "pitching_totals": {"home":{"ip":"9.0","h":7,"r":3,"er":3,"bb":1,"so":9},"away":{"ip":"8.0","h":9,"r":5,"er":5,"bb":2,"so":7}},
  "notes": {"hr":["Aaron Judge"],"sb":[{"name":"Trea Turner","count":2}],"errors":["Brandon Marsh"]},
  "needsReview": false,
  "uncertainties": [],
  "fatalError": false,
  "fatalErrorMessage": null
}

籃球（sport = "nba2k"）格式（沒有 innings/batting/pitching/notes/player_of_game，改回傳 team_stats）：
{
  "sport": "nba2k",
  "image_roles": [{"index":0,"role":"team_compare","team":"","confidence":"high"}],
  "home_team": "Spurs",
  "away_team": "Knicks",
  "home_score": 90,
  "away_score": 58,
  "team_stats": {
    "away": {"fgm":27,"fga":50,"tpm":0,"tpa":12,"ftm":4,"fta":4,"fastbreak":8,"paint":48,"second_chance":4,"bench":4,"ast":14,"oreb":4,"dreb":9,"stl":6,"blk":0,"to":5,"to_points":10,"fouls":1,"dunks":5,"biggest_lead":2,"possession":"13:14","timeouts":2},
    "home": {"fgm":40,"fga":49,"tpm":10,"tpa":16,"ftm":0,"fta":0,"fastbreak":15,"paint":56,"second_chance":0,"bench":19,"ast":27,"oreb":0,"dreb":20,"stl":3,"blk":0,"to":6,"to_points":13,"fouls":4,"dunks":13,"biggest_lead":32,"possession":"10:44","timeouts":2}
  },
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
  if (claudeData.stop_reason === 'refusal') throw new Error('AI 拒絕處理這組截圖，請確認上傳的是 box score 畫面')
  if (claudeData.stop_reason === 'max_tokens') throw new Error('AI 輸出被截斷，請重新上傳')
  // 開了 thinking 之後 content 第一塊可能是 thinking，要找 text 那塊
  const textBlock = (claudeData.content || []).find(b => b.type === 'text')
  if (!textBlock) throw new Error('AI 沒有回傳結果，請重新上傳')
  const raw = textBlock.text.replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(raw)   // 格式錯會 throw，上層會如實回報失敗
}

// 解析結果的前處理：致命錯誤 → 運動別 → 逐局補正 → 硬性驗證。回傳錯誤訊息或 null
function prepareParsed(p) {
  if (!p || typeof p !== 'object') return '讀不到解析結果，請重新上傳'
  if (p.fatalError) return p.fatalErrorMessage || '截圖無法辨識，請重拍清楚一點再上傳'
  p.sport = p.sport === 'nba2k' ? 'nba2k' : 'mlb'
  if (p.sport === 'mlb') reconcileInnings(p)   // 第 1 局常被隊名擋住／延長賽前幾局被捲掉 → 用總分補回
  return validateGame(p)
}

// ── 逐局自動校正 ──────────────────────────────────────────────
// 總分 R 是最可信的（大字、好讀）。逐局那排最左的第 1 局常被隊名面板擋住沒截到，
// 導致逐局加總「少」於總分 —— 把差額補回第 1 局，讓記錄的總分維持正確。
// 若逐局加總「多」於總分（可能真的看錯），不動它，交給 validateGame 擋下。
function reconcileInnings(p) {
  const sum = arr => arr.reduce((s, v) => { const n = parseInt(v); return s + (isNaN(n) ? 0 : n) }, 0)
  const note = msg => { p.needsReview = true; p.uncertainties = [...(Array.isArray(p.uncertainties) ? p.uncertainties : []), msg] }
  // 延長賽畫面會往右捲、只顯示最後 9 局：用最右欄的局數編號推算被捲掉的局數，前面補 "0" 佔位，
  // 局數才會正確（戰報靠 innings.length > 9 判斷延長賽），差額也才會補在真正的第 1 局。
  // 兩隊被捲掉的局數一定相同，所以只在兩隊可見欄數一樣時才補；欄數不一樣代表某一隊少讀了一格
  // （例如漏掉主隊的 "X"），硬補會把整排往右推錯一格，寧可不補、只提醒核對
  const home = p.innings?.home, away = p.innings?.away
  const bothArrays = Array.isArray(home) && Array.isArray(away) && home.length && away.length
  if (bothArrays && home.length !== away.length) note(`兩隊逐局欄數不同（主隊 ${home.length} 欄、客隊 ${away.length} 欄），請對照截圖確認`)
  const last = parseInt(p.last_inning_number)
  const hidden = (bothArrays && home.length === away.length && !isNaN(last) && last > home.length) ? last - home.length : 0
  for (const side of ['home', 'away']) {
    let innings = p.innings?.[side]
    const total = side === 'home' ? p.home_score : p.away_score
    if (!Array.isArray(innings) || !innings.length || typeof total !== 'number') continue
    if (hidden > 0) { innings = [...Array(hidden).fill('0'), ...innings]; p.innings[side] = innings }
    const diff = total - sum(innings)
    if (diff > 0) {
      const first = parseInt(innings[0])
      innings[0] = String((isNaN(first) ? 0 : first) + diff)   // 差額補回第 1 局
      // 補值等於「累計驗算沒過、由程式回推」，要讓使用者知道並核對，不能靜靜改掉
      const label = side === 'home' ? '主隊' : '客隊'
      note(hidden > 0
        ? `${label}第 1–${hidden} 局不在畫面上（截圖從第 ${hidden + 1} 局開始），這 ${hidden} 局共 ${diff} 分先記在第 1 局，請對照截圖確認`
        : `${label}逐局加總比總分少 ${diff} 分，已把差額補在第 1 局，請對照截圖確認`)
    }
  }
}

// ── 驗證 ──────────────────────────────────────────────────────

function validateGame(p) {
  if (typeof p.home_score !== 'number' || typeof p.away_score !== 'number') return '讀不到比分，請重新上傳'
  if (!p.home_team || !p.away_team) return '讀不到隊伍名稱，請重新上傳'
  if (p.home_score === p.away_score) return '兩隊比分相同，判讀可能有誤，請重新上傳'
  if (p.sport === 'nba2k') return validateNba(p)
  const sum = arr => arr.reduce((s, v) => { const n = parseInt(v); return s + (isNaN(n) ? 0 : n) }, 0)
  if (p.innings?.home && sum(p.innings.home) !== p.home_score) return `主場逐局加總（${sum(p.innings.home)}）與總分（${p.home_score}）不符`
  if (p.innings?.away && sum(p.innings.away) !== p.away_score) return `客場逐局加總（${sum(p.innings.away)}）與總分（${p.away_score}）不符`
  for (const pi of [...(p.pitching?.home ?? []), ...(p.pitching?.away ?? [])]) {
    if (pi.ip && !/^\d+\.[012]$/.test(String(pi.ip))) return `${pi.name} 局數格式錯誤（${pi.ip}）`
  }
  return validateMlbTables(p)
}

// 打擊表／投手表的硬性對帳。以前只驗逐局加總，整列讀錯位（每個人拿到上一列的數字）也能通過，
// 因為安打總數剛好沒變。現在逐欄對 TOTALS、對總分、對對手的表，任何一項不合就不讓它過。
function validateMlbTables(p) {
  const num = toInt
  const sumOf = (rows, k) => (rows ?? []).reduce((s, r) => s + num(r[k]), 0)
  const outs = ip => { const [full, part] = String(ip ?? '0.0').split('.'); return num(full) * 3 + num(part) }
  const outsOf = rows => (rows ?? []).reduce((s, pi) => s + outs(pi.ip), 0)
  const ipStr = o => `${Math.floor(o / 3)}.${o % 3}`
  const sides = [
    { key: 'home', opp: 'away', label: '主隊', team: p.home_team, score: p.home_score, oppScore: p.away_score },
    { key: 'away', opp: 'home', label: '客隊', team: p.away_team, score: p.away_score, oppScore: p.home_score },
  ]
  for (const s of sides) {
    const name = `${s.label} ${s.team}`
    const bat = p.batting?.[s.key] ?? []
    const oppBat = p.batting?.[s.opp] ?? []
    const pit = p.pitching?.[s.key] ?? []
    const lsR = p.line_score?.[s.key]?.r
    if (lsR != null && num(lsR) !== s.score) return `${name} 逐局表 R（${num(lsR)}）與總分（${s.score}）不符`

    if (bat.length) {
      // 打者可能超過 9 人（代打），表格要往下捲才看得到；沒拍到就會在這裡對不上
      const missingHint = '可能有打者沒拍到（表格要往下捲）或整列讀錯位，請補拍後重傳'
      const totals = p.batting_totals?.[s.key]
      for (const k of ['ab', 'r', 'h', 'rbi', 'bb', 'so']) {
        if (totals && totals[k] != null && sumOf(bat, k) !== num(totals[k]))
          return `${name} 打擊表 ${k.toUpperCase()} 逐人加總（${sumOf(bat, k)}）與 TOTALS（${num(totals[k])}）不符：${missingHint}`
      }
      if (sumOf(bat, 'r') !== s.score) return `${name} 打者得分加總（${sumOf(bat, 'r')}）與總分（${s.score}）不符：${missingHint}`
      if (sumOf(bat, 'rbi') > s.score) return `${name} 打點加總（${sumOf(bat, 'rbi')}）超過總分（${s.score}）`
      const lsH = p.line_score?.[s.key]?.h
      if (lsH != null && sumOf(bat, 'h') !== num(lsH)) return `${name} 安打加總（${sumOf(bat, 'h')}）與逐局表 H（${num(lsH)}）不符`
    }

    if (pit.length) {
      if (sumOf(pit, 'r') !== s.oppScore) return `${name} 投手失分加總（${sumOf(pit, 'r')}）與對手總分（${s.oppScore}）不符`
      for (const pi of pit) if (num(pi.er) > num(pi.r)) return `${pi.name} 自責分（${num(pi.er)}）超過失分（${num(pi.r)}）`
      const totals = p.pitching_totals?.[s.key]
      for (const k of ['h', 'r', 'er', 'bb', 'so']) {
        if (totals && totals[k] != null && sumOf(pit, k) !== num(totals[k]))
          return `${name} 投手表 ${k.toUpperCase()} 逐人加總（${sumOf(pit, k)}）與 TOTALS（${num(totals[k])}）不符，可能有整列讀錯位`
      }
      if (totals && totals.ip != null && outsOf(pit) !== outs(totals.ip))
        return `${name} 投手表 IP 逐人加總（${ipStr(outsOf(pit))}）與 TOTALS（${totals.ip}）不符，可能有整列讀錯位`
      if (oppBat.length) {
        if (sumOf(pit, 'so') !== sumOf(oppBat, 'so')) return `${name} 投手三振加總（${sumOf(pit, 'so')}）與對手打者被三振數（${sumOf(oppBat, 'so')}）不符`
        if (sumOf(pit, 'h') !== sumOf(oppBat, 'h')) return `${name} 投手被安打加總（${sumOf(pit, 'h')}）與對手安打數（${sumOf(oppBat, 'h')}）不符`
      }
    }
  }

  // 主客順序：客隊投手面對的是主隊打者（下半局），主隊贏球不用打最後的下半局、再見安打也提早結束，
  // 所以「客隊投手的出局數」永遠 ≤「主隊投手的出局數」。反過來就是主客標反了（兩邊相等時看不出來）
  const homeOuts = outsOf(p.pitching?.home), awayOuts = outsOf(p.pitching?.away)
  if (homeOuts && awayOuts && awayOuts > homeOuts)
    return `客隊投手合計局數（${ipStr(awayOuts)}）比主隊投手（${ipStr(homeOuts)}）還多，主客可能標反了`

  // 勝敗投手：贏的那隊恰好一位 W、不能有 L；輸的那隊恰好一位 L、不能有 W（只驗有上傳投手表的那隊）
  const homeWon = p.home_score > p.away_score
  const decisions = side => (p.pitching?.[side] ?? []).map(x => String(x.decision || '').toUpperCase())
  const winSide = homeWon ? 'home' : 'away', loseSide = homeWon ? 'away' : 'home'
  const wd = decisions(winSide), ld = decisions(loseSide)
  if (wd.length) {
    const w = wd.filter(d => d === 'W').length
    if (w !== 1) return `贏的那隊勝投（W）標記有 ${w} 位，應該恰好 1 位`
    if (wd.includes('L')) return '贏的那隊出現敗投（L）標記'
  }
  if (ld.length) {
    const l = ld.filter(d => d === 'L').length
    if (l !== 1) return `輸的那隊敗投（L）標記有 ${l} 位，應該恰好 1 位`
    if (ld.includes('W')) return '輸的那隊出現勝投（W）標記'
  }
  return null
}

// NBA 2K 對帳：得分 = 2×投籃命中 + 三分命中 + 罰球命中（三分已含在投籃命中內）
function validateNba(p) {
  for (const side of ['away', 'home']) {
    const s = p.team_stats?.[side]
    const label = side === 'home' ? '主隊' : '客隊'
    if (!s) return `讀不到${label}的球隊數據，請重新上傳`
    const total = side === 'home' ? p.home_score : p.away_score
    const calc = 2 * (s.fgm ?? 0) + (s.tpm ?? 0) + (s.ftm ?? 0)
    if (calc !== total) return `${label}得分（${total}）與命中數推算（${calc}）不符，請重新上傳`
  }
  return null
}

// 解析階段還不知道玩家是誰，改用「今天已有同兩隊對戰」偵測重複（隊伍每場隨機選，撞隊即高度可疑）
async function detectDuplicates(SUPABASE_URL, headers, p) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/games?played_at=eq.${today}&sport=eq.${p.sport === 'nba2k' ? 'nba2k' : 'mlb'}&select=id,game_sides(team_name)`,
      { headers }
    )
    const games = await res.json()
    const home = (p.home_team || '').toLowerCase()
    const away = (p.away_team || '').toLowerCase()
    return games.filter(g => {
      const teams = new Set((g.game_sides || []).map(s => (s.team_name || '').toLowerCase()))
      return teams.has(home) && teams.has(away)
    }).map(g => g.id)
  } catch { return [] }
}

async function writeGame(SUPABASE_URL, headers, p, submissionId) {
  const ph = { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
  const h = { ...headers, 'Content-Type': 'application/json' }

  const gameRes = await fetch(`${SUPABASE_URL}/rest/v1/games`, {
    method: 'POST', headers: ph,
    body: JSON.stringify({
      played_at: new Date().toISOString().slice(0, 10),
      sport: p.sport === 'nba2k' ? 'nba2k' : 'mlb',
      winner_player_id: (p.winner || '').toLowerCase(),
      player_of_game_name: p.player_of_game?.name ?? null,
      player_of_game_team: p.player_of_game?.team ?? null,
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

    const sideRow = {
      game_id: gameId,
      player_id: (isHome ? p.home_player : p.away_player).toLowerCase(),
      team_name: isHome ? p.home_team : p.away_team,
      team_full: isHome ? p.home_team : p.away_team,
      home_away: isHome ? 'home' : 'away',
      runs: isHome ? p.home_score : p.away_score,
      hits: (batting ?? []).reduce((s, b) => s + (b.h ?? 0), 0),
      errors: toInt(p.line_score?.[isHome ? 'home' : 'away']?.e),   // 逐局表的 E
      innings: isHome ? (p.innings?.home ?? []) : (p.innings?.away ?? []),
    }
    if (p.sport === 'nba2k') sideRow.stats = (isHome ? p.team_stats?.home : p.team_stats?.away) ?? {}
    const sideRes = await fetch(`${SUPABASE_URL}/rest/v1/game_sides`, {
      method: 'POST', headers: ph,
      body: JSON.stringify(sideRow),
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

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

// 把解析後的 JSON 轉成前端審核/成功畫面用的形狀
function toDisplayGame(p) {
  if (!p) return null
  const homeName = p.home_player_name || cap(p.home_player)
  const awayName = p.away_player_name || cap(p.away_player)
  return {
    sport: p.sport === 'nba2k' ? 'nba2k' : 'mlb',
    homePlayer: homeName, awayPlayer: awayName,
    homeTeam: p.home_team, awayTeam: p.away_team,
    homeScore: p.home_score, awayScore: p.away_score,
    winner: p.winner ? (p.winner === p.home_player ? homeName : awayName) : '',
    playerOfGame: p.player_of_game || null,
    homeBatting: p.batting?.home ?? [], awayBatting: p.batting?.away ?? [],
    homePitching: p.pitching?.home ?? [], awayPitching: p.pitching?.away ?? [],
    teamStats: p.team_stats || null,
  }
}

function buildWarnings(sub) {
  return [
    ...(sub.needs_review ? ['AI 對部分數據不太確定，記錄後建議再核對一次'] : []),
    ...(((sub.duplicate_candidates?.length) ?? 0) > 0 ? ['這場好像記過了（今天已有同兩隊的比賽紀錄）'] : []),
  ]
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

// 供 scripts/test-submit-validate.mjs 匯入做回歸測試（Cloudflare 只會用 onRequest）
export { validateGame, reconcileInnings, prepareParsed }
