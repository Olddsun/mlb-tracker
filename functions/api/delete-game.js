// 刪除一場比賽（含 game_sides / batting_lines / pitching_lines / game_notes，靠 DB 的 ON DELETE CASCADE）
// submissions.game_id 沒有 cascade，先解除連結再刪 games。
export async function onRequestPost(context) {
  const { env, request } = context
  const SUPABASE_URL = env.SUPABASE_URL
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY
  const headers = { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }

  let body
  try { body = await request.json() } catch { return json({ error: '格式錯誤' }, 400) }
  const id = body && body.id
  if (!id || typeof id !== 'string') return json({ error: '缺少比賽 id' }, 400)

  // 1. 解除 submissions 對這場的連結（該表對 games 無 cascade，否則刪 games 會被外鍵擋下）
  const unlink = await fetch(`${SUPABASE_URL}/rest/v1/submissions?game_id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ game_id: null }),
  })
  if (!unlink.ok) {
    const t = await unlink.text()
    return json({ error: `解除提交連結失敗：${t.slice(0, 160)}` }, 500)
  }

  // 2. 刪 games（cascade 掉 game_sides / batting_lines / pitching_lines / game_notes）
  //    用 return=representation 才能知道實際刪了幾筆，避免「刪 0 筆卻回成功」
  const del = await fetch(`${SUPABASE_URL}/rest/v1/games?id=eq.${id}`, {
    method: 'DELETE',
    headers: { ...headers, 'Prefer': 'return=representation' },
  })
  if (!del.ok) {
    const t = await del.text()
    return json({ error: `刪除失敗：${t.slice(0, 160)}` }, 500)
  }
  const rows = await del.json().catch(() => [])
  if (!Array.isArray(rows) || rows.length === 0) {
    return json({ error: '找不到這場比賽（可能已被刪除）' }, 404)
  }

  return json({ ok: true })
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } })
}
