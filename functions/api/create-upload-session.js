export async function onRequest(context) {
  const { env, request } = context

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const { submittedBy, token, rawUserInput } = await request.json()

  // Token 驗證
  const PLAYER_TOKENS = JSON.parse(env.PLAYER_TOKENS || '{}')
  if (!submittedBy || PLAYER_TOKENS[submittedBy] !== token) {
    return json({ error: 'Token 錯誤' }, 401)
  }

  const SUPABASE_URL = env.SUPABASE_URL
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY
  const BUCKET = env.SUPABASE_BUCKET || 'box-score-submissions'
  const sbHeaders = {
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  }

  // 預定義 5 張截圖路徑
  const submissionId = crypto.randomUUID()
  const paths = [0, 1, 2, 3, 4].map(i => `${submissionId}/${i}.jpg`)

  // 建立 submission 記錄
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Prefer': 'return=representation' },
    body: JSON.stringify({
      id: submissionId,
      submitted_by: submittedBy.toLowerCase(),
      raw_user_input: rawUserInput,
      image_paths: paths,
      status: 'received',
    }),
  })
  if (!dbRes.ok) {
    const err = await dbRes.text()
    return json({ error: `DB 建立失敗：${err}` }, 500)
  }

  // 為每張截圖產生 signed upload URL
  const uploadUrls = []
  for (const path of paths) {
    const signRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/upload/${BUCKET}/${path}`,
      { method: 'POST', headers: sbHeaders, body: '{}' }
    )
    if (!signRes.ok) {
      return json({ error: `無法產生上傳 URL：${path}` }, 500)
    }
    const { signedURL, token: uploadToken } = await signRes.json()
    uploadUrls.push({
      index: paths.indexOf(path),
      path,
      uploadUrl: `${SUPABASE_URL}${signedURL}`,
      token: uploadToken,
    })
  }

  return json({ submissionId, uploadUrls })
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
