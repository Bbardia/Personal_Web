import { REMOTE_URL } from './loadEdition'

const rawSubscribeUrl: unknown = import.meta.env.VITE_BARDI_REPORT_SUBSCRIBE_URL
const configuredSubscribeUrl = (typeof rawSubscribeUrl === 'string' ? rawSubscribeUrl : '').trim()

const withScheme = (url: string) => (!/^https?:\/\//i.test(url) ? `https://${url}` : url)

const subscribeFromLatest = (latestUrl: string) => {
  try {
    const url = new URL(latestUrl)
    url.pathname = '/subscribe'
    url.search = ''
    url.hash = ''
    return url.toString()
  } catch {
    return ''
  }
}

export const SUBSCRIBE_URL = configuredSubscribeUrl
  ? withScheme(configuredSubscribeUrl)
  : subscribeFromLatest(REMOTE_URL)

export type SubscribeStatus = 'subscribed' | 'already_subscribed'

export interface SubscribeResult {
  ok: boolean
  status?: SubscribeStatus
  message: string
}

export const subscribeToBardiReport = async (email: string): Promise<SubscribeResult> => {
  if (!SUBSCRIBE_URL) {
    return { ok: false, message: 'Subscription is not available yet.' }
  }

  const response = await fetch(SUBSCRIBE_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })

  const data = (await response.json().catch(() => null)) as Partial<SubscribeResult> | null
  const message = typeof data?.message === 'string' ? data.message : 'Please try again.'

  if (!response.ok || data?.ok !== true) return { ok: false, message }

  return {
    ok: true,
    status: data.status === 'already_subscribed' ? 'already_subscribed' : 'subscribed',
    message,
  }
}
