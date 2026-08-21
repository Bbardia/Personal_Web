const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
}

const MAX_SUBSCRIBE_BODY_BYTES = 1024
const EMAIL_RE = /^(?=.{1,254}$)[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_API = 'https://api.resend.com'
const memoryRateLimits = new Map()

export class SubscribeRateLimiter {
  constructor() {
    this.record = null
  }

  async fetch(request) {
    const { limit, windowSeconds } = await request.json().catch(() => ({}))
    if (!Number.isFinite(limit) || !Number.isFinite(windowSeconds)) {
      return Response.json({ limited: true, retryAfter: 60 }, { status: 400 })
    }

    const now = Date.now()
    const record = this.record?.resetAt > now
      ? this.record
      : { count: 0, resetAt: now + windowSeconds * 1000 }

    if (record.count >= limit) {
      return Response.json({ limited: true, retryAfter: Math.ceil((record.resetAt - now) / 1000) })
    }

    this.record = { count: record.count + 1, resetAt: record.resetAt }
    return Response.json({ limited: false })
  }
}

const json = (data, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  })

const ok = (status, message) => json({ ok: true, status, message })
const fail = (error, message, status = 400, extraHeaders = {}) =>
  json({ ok: false, error, message }, status, extraHeaders)

const normalizeEmail = (value) => {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return null
  return email
}

const clientIp = (request) =>
  request.headers.get('CF-Connecting-IP') ||
  request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
  'unknown'

const hash = async (value) => {
  const input = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', input)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const checkRateLimit = async (prefix, value, limit, windowSeconds, env) => {
  if (!value) return { limited: false }

  const now = Date.now()
  const keyHash = await hash(value)
  const storageKey = `rl:${prefix}:${keyHash}`

  if (env?.SUBSCRIBE_RATE_LIMITER_DO?.idFromName) {
    try {
      const id = env.SUBSCRIBE_RATE_LIMITER_DO.idFromName(`${prefix}:${keyHash}`)
      const stub = env.SUBSCRIBE_RATE_LIMITER_DO.get(id)
      const response = await stub.fetch('https://rate-limit.local/', {
        method: 'POST',
        body: JSON.stringify({ limit, windowSeconds }),
      })
      if (response.ok) {
        const result = await response.json()
        if (result?.limited) {
          return { limited: true, retryAfter: result.retryAfter || windowSeconds }
        }
      }
    } catch (err) {
      console.warn('[rate-limit:do]', err)
    }
  }

  if (env?.SUBSCRIBE_RATE_LIMITS?.get && env?.SUBSCRIBE_RATE_LIMITS?.put) {
    try {
      const stored = await env.SUBSCRIBE_RATE_LIMITS.get(storageKey, { type: 'json' })
      const kvRecord = stored?.resetAt > now ? stored : { count: 0, resetAt: now + windowSeconds * 1000 }

      if (kvRecord.count >= limit) {
        return { limited: true, retryAfter: Math.ceil((kvRecord.resetAt - now) / 1000) }
      }

      const ttl = Math.max(60, Math.ceil((kvRecord.resetAt - now) / 1000))
      await env.SUBSCRIBE_RATE_LIMITS.put(
        storageKey,
        JSON.stringify({ count: kvRecord.count + 1, resetAt: kvRecord.resetAt }),
        { expirationTtl: ttl },
      )
    } catch (err) {
      console.warn('[rate-limit:kv]', err)
    }
  }

  const memoryKey = `${prefix}:${keyHash}`
  const memory = memoryRateLimits.get(memoryKey)
  const record = memory?.resetAt > now ? memory : { count: 0, resetAt: now + windowSeconds * 1000 }

  if (record.count >= limit) {
    return { limited: true, retryAfter: Math.ceil((record.resetAt - now) / 1000) }
  }

  memoryRateLimits.set(memoryKey, { count: record.count + 1, resetAt: record.resetAt })
  if (memoryRateLimits.size > 1000) {
    for (const [key, value] of memoryRateLimits) {
      if (value.resetAt <= now) memoryRateLimits.delete(key)
    }
  }

  if (!globalThis.caches) return { limited: false }

  const cache = caches.default
  const key = new Request(`https://bardi-report.local/rl/${prefix}/${keyHash}`)
  const cached = await cache.match(key)
  let cacheRecord = { count: 0, resetAt: now + windowSeconds * 1000 }

  if (cached) {
    try {
      const parsed = await cached.json()
      if (typeof parsed.count === 'number' && typeof parsed.resetAt === 'number') {
        cacheRecord = parsed.resetAt > now ? parsed : cacheRecord
      }
    } catch {
      cacheRecord = { count: 0, resetAt: now + windowSeconds * 1000 }
    }
  }

  if (cacheRecord.count >= limit) {
    return { limited: true, retryAfter: Math.ceil((cacheRecord.resetAt - now) / 1000) }
  }

  const next = { count: cacheRecord.count + 1, resetAt: cacheRecord.resetAt }
  const ttl = Math.max(1, Math.ceil((next.resetAt - now) / 1000))
  await cache.put(
    key,
    new Response(JSON.stringify(next), {
      headers: { 'Cache-Control': `public, max-age=${ttl}` },
    }),
  )

  return { limited: false }
}

const checkIpRateLimit = async (request, env) => {
  const ip = clientIp(request)

  if (env.SUBSCRIBE_RATE_LIMITER?.limit) {
    const { success } = await env.SUBSCRIBE_RATE_LIMITER.limit({ key: ip })
    if (!success) return { limited: true, retryAfter: 60 }
  }

  return checkRateLimit('ip', ip, 8, 60, env)
}

const parseSubscribeBody = async (request) => {
  const length = Number(request.headers.get('content-length') || '0')
  if (length > MAX_SUBSCRIBE_BODY_BYTES) return { error: 'too_large' }

  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > MAX_SUBSCRIBE_BODY_BYTES) {
    return { error: 'too_large' }
  }

  let body
  try {
    body = JSON.parse(text)
  } catch {
    return { error: 'bad_json' }
  }

  const email = normalizeEmail(body?.email)
  return email ? { email } : { error: 'invalid_email' }
}

const resendFetch = async (env, path, init = {}) => {
  const response = await fetch(`${RESEND_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })

  let body = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  return { response, body }
}

const encodedContact = (email) => encodeURIComponent(email)

const getContact = async (env, email) => {
  const result = await resendFetch(env, `/contacts/${encodedContact(email)}`)
  if (result.response.status === 404) return null
  if (!result.response.ok) throw new Error(`Resend contact lookup failed: ${result.response.status}`)
  return result.body
}

const listContactSegments = async (env, email) => {
  const result = await resendFetch(env, `/contacts/${encodedContact(email)}/segments`)
  if (!result.response.ok) throw new Error(`Resend segment lookup failed: ${result.response.status}`)
  return Array.isArray(result.body?.data) ? result.body.data : []
}

const isInSegment = (segments, segmentId) => segments.some((segment) => segment?.id === segmentId)

const addContactToSegment = async (env, email) => {
  const result = await resendFetch(
    env,
    `/contacts/${encodedContact(email)}/segments/${encodeURIComponent(env.BARDI_REPORT_RESEND_SEGMENT_ID)}`,
    { method: 'POST' },
  )
  if (!result.response.ok) throw new Error(`Resend add-to-segment failed: ${result.response.status}`)
}

const createContact = async (env, email) =>
  resendFetch(env, '/contacts', {
    method: 'POST',
    body: JSON.stringify({
      email,
      unsubscribed: false,
      segments: [{ id: env.BARDI_REPORT_RESEND_SEGMENT_ID }],
    }),
  })

const errorText = (body) => JSON.stringify(body || {}).toLowerCase()

const subscribe = async (request, env) => {
  if (!env.RESEND_API_KEY || !env.BARDI_REPORT_RESEND_SEGMENT_ID) {
    return fail('not_configured', 'Subscription service is not configured yet.', 503)
  }

  const ipLimit = await checkIpRateLimit(request, env)
  if (ipLimit.limited) {
    return fail('too_many_requests', 'Too many tries. Please wait a minute.', 429, {
      'Retry-After': String(ipLimit.retryAfter || 60),
    })
  }

  const parsed = await parseSubscribeBody(request)
  if (parsed.error === 'too_large') return fail('too_large', 'Request is too large.', 413)
  if (parsed.error === 'bad_json') return fail('bad_json', 'Send a JSON body.', 400)
  if (parsed.error === 'invalid_email') return fail('invalid_email', 'Enter a valid email address.', 400)

  const email = parsed.email
  const emailLimit = await checkRateLimit('email', email, 3, 600, env)
  if (emailLimit.limited) {
    return fail('too_many_requests', 'Please wait before trying this email again.', 429, {
      'Retry-After': String(emailLimit.retryAfter || 600),
    })
  }

  try {
    const contact = await getContact(env, email)

    if (contact) {
      const segments = await listContactSegments(env, email)
      if (isInSegment(segments, env.BARDI_REPORT_RESEND_SEGMENT_ID)) {
        return ok('already_subscribed', 'This email is already subscribed.')
      }
      await addContactToSegment(env, email)
      return ok('subscribed', 'You are subscribed.')
    }

    const created = await createContact(env, email)
    if (created.response.ok) return ok('subscribed', 'You are subscribed.')

    if ([409, 422].includes(created.response.status) || errorText(created.body).includes('already')) {
      await addContactToSegment(env, email)
      return ok('already_subscribed', 'This email is already subscribed.')
    }

    if (created.response.status === 429) {
      return fail('resend_rate_limited', 'Subscription service is busy. Try again soon.', 429)
    }

    throw new Error(`Resend create-contact failed: ${created.response.status}`)
  } catch (err) {
    console.error('[subscribe]', err)
    return fail('subscribe_failed', 'Could not subscribe right now. Please try again.', 502)
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    if (pathname === '/subscribe') {
      if (request.method !== 'POST') return fail('method_not_allowed', 'Method not allowed.', 405)
      return subscribe(request, env)
    }

    if (pathname !== '/latest.json') return fail('not_found', 'Not found.', 404)

    if (request.method === 'GET') {
      const obj = await env.REPORTS.get('latest.json')
      if (!obj) return fail('no_edition', 'No edition yet.', 404)
      return new Response(obj.body, {
        headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      })
    }

    if (request.method === 'PUT') {
      if (request.headers.get('Authorization') !== `Bearer ${env.WRITE_TOKEN}`) {
        return fail('unauthorized', 'Unauthorized.', 401)
      }
      const body = await request.text()
      try {
        JSON.parse(body)
      } catch {
        return fail('invalid_json', 'Invalid JSON.', 400)
      }
      await env.REPORTS.put('latest.json', body, { httpMetadata: { contentType: 'application/json' } })
      return json({ ok: true })
    }

    return fail('method_not_allowed', 'Method not allowed.', 405)
  },
}
