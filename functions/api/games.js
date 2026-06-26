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

  // 一次 query 取回所有資料（PostgREST 巢狀 select）
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/games` +
    `?select=*,game_sides(*,batting_lines(*),pitching_lines(*)),game_notes(*)` +
    `&sport=eq.mlb` +
    `&order=played_at.desc,legacy_id.desc`,
    { headers }
  )

  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ error: err }), { status: 500 })
  }

  const rows = await res.json()

  const games = rows.map(game => {
    // sides：away 在前、home 在後（與原本 games.json 一致）
    const sides = [...game.game_sides]
      .sort((a, b) => (a.home_away === 'away' ? -1 : 1))
      .map(side => ({
        player:   capitalize(side.player_id),
        team:     side.team_name,
        teamFull: side.team_full,
        homeAway: side.home_away,
        runs:     side.runs,
        hits:     side.hits,
        errors:   side.errors,
        innings:  side.innings,
        batting: [...side.batting_lines]
          .sort((a, b) => a.batting_order - b.batting_order)
          .map(b => ({
            name: b.name,
            pos:  b.pos || '',
            ab: b.ab, r: b.r, h: b.h,
            rbi: b.rbi, bb: b.bb, so: b.so,
            ...(b.hr > 0 ? { hr: b.hr } : {}),
          })),
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
      id:     game.legacy_id || game.id,
      date:   game.played_at,
      winner: capitalize(game.winner_player_id),
      playerOfGame: game.player_of_game_name
        ? { name: game.player_of_game_name, team: game.player_of_game_team }
        : null,
      sides,
      notes: buildNotes(game.game_notes),
    }
  })

  return new Response(
    JSON.stringify({ players: ['Scott', 'Alvin', 'Vincent'], games }),
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
