const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })
    if (pathname !== '/latest.json') return json({ error: 'not found' }, 404)

    // Public read
    if (request.method === 'GET') {
      const obj = await env.REPORTS.get('latest.json')
      if (!obj) return json({ error: 'no edition yet' }, 404)
      return new Response(obj.body, {
        headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      })
    }

    // Authenticated write (from the Pi)
    if (request.method === 'PUT') {
      if (request.headers.get('Authorization') !== `Bearer ${env.WRITE_TOKEN}`)
        return json({ error: 'unauthorized' }, 401)
      const body = await request.text()
      try { JSON.parse(body) } catch { return json({ error: 'invalid json' }, 400) }
      await env.REPORTS.put('latest.json', body, { httpMetadata: { contentType: 'application/json' } })
      return json({ ok: true })
    }

    return json({ error: 'method not allowed' }, 405)
  },
}
