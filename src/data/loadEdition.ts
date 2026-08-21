/**
 * Loads the latest Bardi Report edition for the website.
 *
 * Source of truth (once live): a Cloudflare bucket holding the most-recent
 * edition as JSON. The Raspberry Pi that sends the newsletter uploads it there
 * after each broadcast (that part is wired up in the sport-report repo later).
 *
 * Until that bucket exists — or any time the fetch fails — this falls back to
 * the bundled sample in ./bardiReport so the site always renders.
 *
 * SETUP when the bucket is ready:
 *   1. Make the object publicly readable and give the bucket a CORS rule that
 *      allows GET from this site's origin (or "*").
 *   2. Set VITE_BARDI_REPORT_URL to the object URL (e.g. the R2 public URL or a
 *      custom domain like https://reports.bardia.dev/latest.json). For the
 *      GitHub Pages build, add it to the `npm run build` step's env in
 *      .github/workflows/deploy.yml.
 *
 * The normaliser accepts the sport-report archive shape (snake_case) directly,
 * so the Pi can upload the exact file it already produces — no transform needed.
 */

import { latestEdition } from './bardiReport'
import type { BardiCategory, BardiEdition, BardiStory } from './bardiReport'

const configuredUrl: unknown = import.meta.env.VITE_BARDI_REPORT_URL
export const REMOTE_URL = (typeof configuredUrl === 'string' ? configuredUrl : '').trim()
export const HAS_REMOTE = REMOTE_URL.length > 0

export type EditionSource = 'remote' | 'fallback'
export interface LoadedEdition {
  edition: BardiEdition
  source: EditionSource
}

type RawRecord = Record<string, unknown>

const isObject = (v: unknown): v is RawRecord =>
  typeof v === 'object' && v !== null

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback

const optStr = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim().length > 0 ? v : undefined

const KNOWN_CATEGORIES: readonly BardiCategory[] = [
  'SWITZERLAND',
  'NEWS',
  'TECH',
  'STARTUP',
  'INNOVATION',
  'TRAINING',
]

const asCategory = (v: unknown): BardiCategory => {
  const s = typeof v === 'string' ? v.toUpperCase() : ''
  return (KNOWN_CATEGORIES as readonly string[]).includes(s)
    ? (s as BardiCategory)
    : 'NEWS'
}

const normalizeStory = (input: unknown): BardiStory | null => {
  if (!isObject(input)) return null
  const headline = str(input.headline)
  const summary = str(input.summary)
  if (!headline || !summary) return null
  return {
    headline,
    category: asCategory(input.category),
    summary,
    sourceUrl: str(input.sourceUrl ?? input.source_url),
    sourceName: str(input.sourceName ?? input.source_name, 'source'),
    imageUrl: optStr(input.imageUrl ?? input.image_url),
    videoUrl: optStr(input.videoUrl ?? input.video_url),
  }
}

/** Map an arbitrary payload to a BardiEdition, or null if it's unusable. */
export const normalizeEdition = (input: unknown): BardiEdition | null => {
  if (!isObject(input)) return null
  const date = str(input.date)
  if (!date) return null

  const rawStories = Array.isArray(input.stories) ? input.stories : []
  const stories = rawStories
    .map(normalizeStory)
    .filter((s): s is BardiStory => s !== null)
  if (stories.length === 0) return null

  const quote = isObject(input.quote) ? input.quote : {}
  return {
    date,
    subject: str(input.subject, 'Bardi Report'),
    intro: str(input.intro),
    stories,
    outro: str(input.outro),
    quote: { text: str(quote.text), author: str(quote.author) },
  }
}

const fetchRemoteEdition = async (): Promise<LoadedEdition> => {
  try {
    const res = await fetch(REMOTE_URL, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const edition = normalizeEdition(await res.json())
    if (!edition) throw new Error('payload missing required fields')
    return { edition, source: 'remote' }
  } catch (err) {
    console.warn(
      '[Bardi Report] could not load the live edition; using bundled sample.',
      err,
    )
    return { edition: latestEdition, source: 'fallback' }
  }
}

// Resolve once per session and share the result across the page + teaser.
let cache: Promise<LoadedEdition> | null = null

export const loadLatestEdition = (): Promise<LoadedEdition> => {
  if (!cache) {
    cache = HAS_REMOTE
      ? fetchRemoteEdition()
      : Promise.resolve<LoadedEdition>({ edition: latestEdition, source: 'fallback' })
  }
  return cache
}
