export async function onRequest(context) {
  const { env, request } = context
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return json({ error: '缺少 id' }, 400)

  const SUPABASE_URL = env.SUPABASE_URL
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY
  const headers = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/submissions?id=eq.${id}&select=status,game_id,error_message,needs_review,duplicate_candidates`,
    { headers }
  )
  const rows = await res.json()
  const sub = rows[0]
  if (!sub) return json({ error: '找不到提交記錄' }, 404)

  if (sub.status === 'committed' && sub.game_id) {
    const gRes = await fetch(
      `${SUPABASE_URL}/rest/v1/games?id=eq.${sub.game_id}&select=winner_player_id,game_sides(player_id,home_away,team_name,runs)`,
      { headers }
    )
    const [game] = await gRes.json()
    const sides = game?.game_sides ?? []
    const home = sides.find(s => s.home_away === 'home')
    const away = sides.find(s => s.home_away === 'away')

    return json({
      status: 'committed',
      game: {
        homePlayer: cap(home?.player_id),
        awayPlayer: cap(away?.player_id),
        homeTeam: home?.team_name,
        awayTeam: away?.team_name,
        homeScore: home?.runs,
        awayScore: away?.runs,
        winner: cap(game?.winner_player_id),
      },
      warnings: [
        ...(sub.needs_review ? ['AI 對部分數據不確定，建議事後核對'] : []),
        ...((sub.duplicate_candidates?.length ?? 0) > 0 ? ['偵測到可能重複的比賽，請確認'] : []),
      ],
    })
  }

  if (sub.status === 'failed') {
    return json({ status: 'failed', error: sub.error_message })
  }

  return json({ status: sub.status })
}

const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
