// Función serverless de Vercel: guarda toda la liga como un JSON en Upstash Redis.
// GET  /api/data            -> público, devuelve los datos
// PUT  /api/data            -> solo admin (cabecera x-admin-password), guarda los datos
// GET  /api/data?auth=1     -> comprueba la contraseña
const URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

async function redis(cmd) {
  const r = await fetch(URL, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` }, body: JSON.stringify(cmd) })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'redis')
  return j.result
}

export default async function handler(req, res) {
  const pass = process.env.ADMIN_PASSWORD
  const isAdmin = Boolean(pass) && req.headers['x-admin-password'] === pass
  res.setHeader('Cache-Control', 'no-store')
  try {
    if (req.query.auth) return res.status(isAdmin ? 200 : 401).json({ ok: isAdmin })
    if (req.method === 'GET') {
      const v = await redis(['GET', 'league'])
      return res.status(200).json(v ? JSON.parse(v) : {})
    }
    if (req.method === 'PUT') {
      if (!isAdmin) return res.status(401).json({ error: 'No autorizado' })
      const b = req.body
      if (!b || !Array.isArray(b.sports) || !Array.isArray(b.teams) || !Array.isArray(b.matches))
        return res.status(400).json({ error: 'Datos no válidos' })
      await redis(['SET', 'league', JSON.stringify(b)])
      return res.status(200).json({ ok: true })
    }
    res.status(405).json({ error: 'Método no permitido' })
  } catch {
    res.status(500).json({ error: 'Error de almacenamiento: ¿está conectada la base Redis?' })
  }
}
