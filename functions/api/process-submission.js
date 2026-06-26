export async function onRequest(context) {
  const { env, request } = context

  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { submissionId } = await request.json()
  if (!submissionId) return json({ error: '缺少 submissionId' }, 400)

  const SUPABASE_URL = env.SUPABASE_URL
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY
  const BUCKET = env.SUPABASE_BUCKET || 'box-score-submissions'
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY

  const sbHeaders = {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  }

  // ── 1. 取得 submission 記錄
  const subRes = await fetch(
    `${SUPABASE_URL}/rest/v1/submissions?id=eq.${submissionId}&select=*`,
    { headers: sbHeaders }
  )
  const subs = await subRes.json()
  if (!subs.length) return json({ error: 'Submission 不存在' }, 404)
  const sub = subs[0]

  // ── 2. 更新狀態為 parsing
  await updateSubmission(SUPABASE_URL, sbHeaders, submissionId, { status: 'parsing' })

  // ── 3. 產生 5 張截圖的 signed read URLs
  const signRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}`,
    {
      method: 'POST',
      headers: sbHeaders,
      body: JSON.stringify({ expiresIn: 300, paths: sub.image_paths }),
    }
  )
  const signedItems = await signRes.json()
  const imageUrls = signedItems.map(item =>
    item.signedURL ? `${SUPABASE_URL}${item.signedURL}` : null
  ).filter(Boolean)

  if (imageUrls.length < 5) {
    await failSubmission(SUPABASE_URL, sbHeaders, submissionId, '截圖 signed URL 產生失敗')
    return json({ error: '截圖讀取失敗，請重新上傳' }, 500)
  }

  // ── 4. 呼叫 Claude Vision
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `你是 MLB The Show box score 解析器。
給你 5 張截圖（順序不固定），請：
1. 先判斷每張圖的角色：line_score（總比分+逐局）、batting（打擊成績）、pitching（投手成績）
2. 根據使用者提供的玩家隊伍對應，將打擊和投手數據正確歸屬給各玩家
3. 只解析截圖中實際存在的資訊，不推測、不補全
4. 若某欄位不清楚，標記 needsReview: true 並列入 uncertainties
5. 若某張截圖根本無法辨識為 box score，設定 fatalError: true
6. 打擊成績截圖的表格「沒有」HR 欄位。HR 資料在截圖下方 BATTING 區塊，例：「HR: Jackson Chourio 2, Brice Turang」，代表 Chourio 打了 2 支、Turang 打了 1 支全壘打。必須從這裡讀取全壘打數量，填入 notes.hr（count 為該球員的全壘打數）。

回傳純 JSON，不要任何說明文字。`,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `玩家隊伍對應：${sub.raw_user_input}\n\n以下是 5 張 box score 截圖（順序不固定）：` },
            ...imageUrls.map(url => ({
              type: 'image',
              source: { type: 'url', url },
            })),
            {
              type: 'text',
              text: `請回傳以下 JSON 格式：
{
  "image_roles": [{"index": 0, "role": "batting", "team": "Yankees", "confidence": "high"}],
  "home_player": "scott",
  "away_player": "alvin",
  "home_team": "Yankees",
  "away_team": "Dodgers",
  "home_score": 5,
  "away_score": 3,
  "winner": "scott",
  "player_of_game": {"name": "Aaron Judge", "team": "Yankees"},
  "innings": {
    "home": ["0","2","0","0","1","0","2","0","0"],
    "away": ["0","0","0","0","0","0","0","0","X"]
  },
  "batting": {
    "home": [{"name": "Aaron Judge", "pos": "RF", "ab": 4, "r": 1, "h": 2, "rbi": 1, "bb": 0, "so": 1, "hr": 1}],
    "away": []
  },
  "pitching": {
    "home": [{"name": "Max Fried", "decision": "W", "record": "19-5", "ip": "9.0", "h": 5, "r": 0, "er": 0, "bb": 0, "so": 3}],
    "away": []
  },
  "notes": {
    "hr": [{"name": "Aaron Judge", "count": 1}],
    "sb": [{"name": "Trea Turner", "count": 2}],
    "errors": ["Brandon Marsh"]
  },
  "needsReview": false,
  "uncertainties": [],
  "fatalError": false,
  "fatalErrorMessage": null
}`,
            },
          ],
        },
      ],
    }),
  })

  if (!claudeRes.ok) {
    const err = await claudeRes.text()
    await failSubmission(SUPABASE_URL, sbHeaders, submissionId, `Claude API 錯誤：${err}`)
    return json({ error: 'AI 解析服務異常，請稍後重試' }, 500)
  }

  const claudeData = await claudeRes.json()
  let parsed
  try {
    const raw = claudeData.content[0].text.replace(/```json\n?|\n?```/g, '').trim()
    parsed = JSON.parse(raw)
  } catch (e) {
    await failSubmission(SUPABASE_URL, sbHeaders, submissionId, 'Claude 回傳格式錯誤')
    return json({ error: 'AI 解析結果格式錯誤，請重新上傳' }, 500)
  }

  // ── 5. 無法識別截圖
  if (parsed.fatalError) {
    await failSubmission(SUPABASE_URL, sbHeaders, submissionId, parsed.fatalErrorMessage || '截圖無法辨識')
    return json({ error: `截圖無法辨識：${parsed.fatalErrorMessage || '請確認上傳正確的 box score'}` }, 422)
  }

  // ── 6. 把 notes.hr 回填到 batting 行（截圖無 HR 欄位，AI 只能從 notes 拿）
  const hrMap = new Map()
  for (const entry of (parsed.notes?.hr ?? [])) {
    // 支援舊格式 string 和新格式 {name, count}
    const name = typeof entry === 'string' ? entry : entry.name
    const count = typeof entry === 'string' ? 1 : (entry.count ?? 1)
    hrMap.set(name, (hrMap.get(name) || 0) + count)
  }
  for (const side of ['home', 'away']) {
    for (const b of (parsed.batting?.[side] ?? [])) {
      if (!b.hr && hrMap.has(b.name)) b.hr = hrMap.get(b.name)
    }
  }

  // ── 7. 儲存解析結果到 submission
  await updateSubmission(SUPABASE_URL, sbHeaders, submissionId, {
    parsed_game_json: parsed,
    needs_review: parsed.needsReview ?? false,
    uncertainties: parsed.uncertainties ?? [],
    player_a: parsed.home_player,
    team_a: parsed.home_team,
    player_b: parsed.away_player,
    team_b: parsed.away_team,
  })

  // ── 9. 硬性驗證
  const validationError = validateGame(parsed)
  if (validationError) {
    await failSubmission(SUPABASE_URL, sbHeaders, submissionId, validationError)
    return json({ error: validationError }, 422)
  }

  // ── 10. 重複比賽偵測
  const duplicates = await detectDuplicates(SUPABASE_URL, sbHeaders, parsed)

  // ── 11. 寫入正式 DB
  try {
    const gameId = await writeGame(SUPABASE_URL, sbHeaders, parsed, submissionId, sub.submitted_by)

    await updateSubmission(SUPABASE_URL, sbHeaders, submissionId, {
      status: 'committed',
      game_id: gameId,
      duplicate_candidates: duplicates,
    })

    return json({
      success: true,
      game: {
        homePlayer: capitalize(parsed.home_player),
        awayPlayer: capitalize(parsed.away_player),
        homeTeam: parsed.home_team,
        awayTeam: parsed.away_team,
        homeScore: parsed.home_score,
        awayScore: parsed.away_score,
        winner: capitalize(parsed.winner),
      },
      warnings: [
        ...(parsed.needsReview ? ['AI 對部分數據不確定，建議事後核對'] : []),
        ...(duplicates.length > 0 ? [`偵測到可能重複的比賽（${duplicates.length} 筆），請確認`] : []),
      ],
    })
  } catch (e) {
    await failSubmission(SUPABASE_URL, sbHeaders, submissionId, e.message)
    return json({ error: `寫入失敗：${e.message}` }, 500)
  }
}

// ── 硬性驗證
function validateGame(p) {
  // winner 比分一致
  if (p.winner === p.home_player && p.home_score <= p.away_score) return '勝負與比分不一致'
  if (p.winner === p.away_player && p.away_score <= p.home_score) return '勝負與比分不一致'

  // innings 加總
  const sumInnings = (arr) => arr.reduce((s, v) => {
    const n = parseInt(v); return s + (isNaN(n) ? 0 : n)
  }, 0)
  if (p.innings?.home && sumInnings(p.innings.home) !== p.home_score) return `主場逐局加總（${sumInnings(p.innings.home)}）與總分（${p.home_score}）不符`
  if (p.innings?.away && sumInnings(p.innings.away) !== p.away_score) return `客場逐局加總（${sumInnings(p.innings.away)}）與總分（${p.away_score}）不符`

  // IP 格式
  const allPitchers = [...(p.pitching?.home ?? []), ...(p.pitching?.away ?? [])]
  for (const pitcher of allPitchers) {
    if (pitcher.ip && !/^\d+\.[012]$/.test(String(pitcher.ip))) {
      return `投手 ${pitcher.name} 的局數格式錯誤（${pitcher.ip}）`
    }
  }

  return null
}

// ── 重複偵測
async function detectDuplicates(SUPABASE_URL, headers, parsed) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/games?played_at=eq.${new Date().toISOString().slice(0,10)}&sport=eq.mlb&select=id,legacy_id,winner_player_id,game_sides(player_id,runs)`,
      { headers }
    )
    const games = await res.json()
    return games.filter(g => {
      const sides = g.game_sides || []
      const players = new Set(sides.map(s => s.player_id))
      return players.has(parsed.home_player) && players.has(parsed.away_player)
    }).map(g => g.id)
  } catch { return [] }
}

// ── 寫入 DB
async function writeGame(SUPABASE_URL, headers, p, submissionId, submittedBy) {
  const postHeaders = { ...headers, 'Prefer': 'return=representation' }

  // games
  const gameRes = await fetch(`${SUPABASE_URL}/rest/v1/games`, {
    method: 'POST',
    headers: postHeaders,
    body: JSON.stringify({
      played_at: new Date().toISOString().slice(0, 10),
      sport: 'mlb',
      winner_player_id: p.winner,
      player_of_game_name: p.player_of_game?.name ?? null,
      player_of_game_team: p.player_of_game?.team ?? null,
      submitted_by: submittedBy,
      submission_id: submissionId,
      source: 'ai_submission',
    }),
  })
  if (!gameRes.ok) throw new Error(await gameRes.text())
  const [game] = await gameRes.json()
  const gameId = game.id

  // 兩個 side
  for (const [side, isHome] of [[p.batting?.home, true], [p.batting?.away, false]]) {
    const playerId = isHome ? p.home_player : p.away_player
    const teamName = isHome ? p.home_team : p.away_team
    const innings = isHome ? p.innings?.home : p.innings?.away

    const sideRes = await fetch(`${SUPABASE_URL}/rest/v1/game_sides`, {
      method: 'POST',
      headers: postHeaders,
      body: JSON.stringify({
        game_id: gameId,
        player_id: playerId,
        team_name: teamName,
        team_full: teamName,
        home_away: isHome ? 'home' : 'away',
        runs: isHome ? p.home_score : p.away_score,
        hits: (side ?? []).reduce((s, b) => s + (b.h ?? 0), 0),
        errors: 0,
        innings: innings ?? [],
      }),
    })
    if (!sideRes.ok) throw new Error(await sideRes.text())
    const [gameSide] = await sideRes.json()
    const sideId = gameSide.id

    // batting
    const batters = (side ?? []).map((b, i) => ({
      game_side_id: sideId, batting_order: i + 1,
      name: b.name, pos: b.pos || null,
      ab: b.ab ?? 0, r: b.r ?? 0, h: b.h ?? 0,
      rbi: b.rbi ?? 0, bb: b.bb ?? 0, so: b.so ?? 0, hr: b.hr ?? 0,
    }))
    if (batters.length) {
      const bRes = await fetch(`${SUPABASE_URL}/rest/v1/batting_lines`, {
        method: 'POST', headers, body: JSON.stringify(batters),
      })
      if (!bRes.ok) throw new Error(await bRes.text())
    }

    // pitching
    const pitchers = (isHome ? p.pitching?.home : p.pitching?.away) ?? []
    const pitcherRows = pitchers.map((pi, i) => ({
      game_side_id: sideId, pitching_order: i + 1,
      name: pi.name,
      decision: pi.decision || null,
      record: pi.record || null,
      ip: pi.ip,
      h: pi.h ?? 0, r: pi.r ?? 0, er: pi.er ?? 0,
      bb: pi.bb ?? 0, so: pi.so ?? 0,
    }))
    if (pitcherRows.length) {
      const pRes = await fetch(`${SUPABASE_URL}/rest/v1/pitching_lines`, {
        method: 'POST', headers, body: JSON.stringify(pitcherRows),
      })
      if (!pRes.ok) throw new Error(await pRes.text())
    }
  }

  // game_notes
  const notes = p.notes ?? {}
  const noteRows = [
    ...(notes.hr ?? []).map(entry => {
      const name = typeof entry === 'string' ? entry : entry.name
      const count = typeof entry === 'string' ? 1 : (entry.count ?? 1)
      return { game_id: gameId, note_type: 'hr', player_name: name, count }
    }),
    ...(notes.sb ?? []).map(sb => ({ game_id: gameId, note_type: 'sb', player_name: sb.name, count: sb.count ?? 1 })),
    ...(notes.errors ?? []).map(name => ({ game_id: gameId, note_type: 'error', player_name: name, count: 1 })),
  ]
  if (noteRows.length) {
    await fetch(`${SUPABASE_URL}/rest/v1/game_notes`, {
      method: 'POST', headers, body: JSON.stringify(noteRows),
    })
  }

  return gameId
}

async function updateSubmission(SUPABASE_URL, headers, id, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/submissions?id=eq.${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  })
}

async function failSubmission(SUPABASE_URL, headers, id, msg) {
  await updateSubmission(SUPABASE_URL, headers, id, { status: 'failed', error_message: msg })
}

const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
