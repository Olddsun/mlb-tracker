// GET /api/players — 玩家清單（提交頁下拉選單用）
export async function onRequest(context) {
  const { env, request } = context
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/players?select=id,display_name&order=id.asc`, {
    headers: { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  })
  if (!res.ok) return json({ error: '讀取玩家清單失敗' }, 500)
  const rows = await res.json()
  return json({ players: rows.map(r => ({ id: r.id, name: r.display_name })) })
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
