export async function onRequest(context) {
  const { env } = context

  const SUPABASE_URL = env.SUPABASE_URL
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !KEY) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500 })
  }

  const headers = {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  }

  // 一次 query 取回所有資料（PostgREST 巢狀 select）＋玩家表（顯示名對照）
  const [res, playersRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/games` +
      `?select=*,game_sides(*,batting_lines(*),pitching_lines(*)),game_notes(*)` +
      `&order=played_at.desc,legacy_id.desc`,
      { headers }
    ),
    fetch(`${SUPABASE_URL}/rest/v1/players?select=id,display_name&order=id.asc`, { headers }),
  ])

  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ error: err }), { status: 500 })
  }

  const rows = await res.json()
  const playerRows = playersRes.ok ? await playersRes.json() : []
  const nameOf = (id) => playerRows.find(p => p.id === id)?.display_name || capitalize(id)

  const games = rows.map(game => {
    // game_notes HR → player name 計數 map（AI 提交時 batting_lines.hr 為 0，從這裡補）
    const hrMap = new Map()
    for (const note of (game.game_notes || [])) {
      if (note.note_type === 'hr') hrMap.set(note.player_name, (hrMap.get(note.player_name) || 0) + (note.count || 1))
    }

    // sides：away 在前、home 在後（與原本 games.json 一致）
    const sides = [...game.game_sides]
      .sort((a, b) => (a.home_away === 'away' ? -1 : 1))
      .map(side => ({
        player:   nameOf(side.player_id),
        team:     side.team_name,
        teamFull: side.team_full,
        homeAway: side.home_away,
        runs:     side.runs,
        hits:     side.hits,
        errors:   side.errors,
        innings:  side.innings,
        stats:    side.stats || null,   // NBA 2K 球隊整場數據（MLB 為 null）
        batting: [...side.batting_lines]
          .sort((a, b) => a.batting_order - b.batting_order)
          .map(b => {
            const hr = b.hr > 0 ? b.hr : (hrMap.get(b.name) || 0)
            return {
              name: b.name,
              pos:  b.pos || '',
              ab: b.ab, r: b.r, h: b.h,
              rbi: b.rbi, bb: b.bb, so: b.so,
              ...(hr > 0 ? { hr } : {}),
            }
          }),
        pitching: [...side.pitching_lines]
          .sort((a, b) => a.pitching_order - b.pitching_order)
          .map(p => ({
            name:     p.name,
            decision: p.decision || '',
            record:   p.record   || '',
            ip: p.ip,
            h: p.h, r: p.r, er: p.er, bb: p.bb, so: p.so,
          })),
      }))

    return {
      id:     game.id,          // 一律用真正的 UUID（原本對匯入資料回傳 legacy_id，導致刪除失敗）
      sport:  game.sport || 'mlb',
      date:   game.played_at,
      winner: nameOf(game.winner_player_id),
      playerOfGame: game.player_of_game_name
        ? { name: game.player_of_game_name, team: game.player_of_game_team }
        : null,
      sides,
      notes: buildNotes(game.game_notes),
    }
  })

  return new Response(
    JSON.stringify({ players: playerRows.map(p => p.display_name), games }),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  )
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function buildNotes(notes) {
  const result = { hr: [], sb: [], errors: [] }
  for (const n of (notes || [])) {
    if (n.note_type === 'hr') {
      // 每筆 count=1，一個名字一筆
      result.hr.push(n.player_name)
    } else if (n.note_type === 'sb') {
      result.sb.push({ name: n.player_name, count: n.count })
    } else if (n.note_type === 'error') {
      result.errors.push(n.player_name)
    }
  }
  return result
}
