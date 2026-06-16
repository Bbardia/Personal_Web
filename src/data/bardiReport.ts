/**
 * Data for the "Bardi Report" newsletter reader.
 *
 * The shape mirrors one archived edition from the sport-report generator
 * (Bbardia/sport-report → archive/<date>.json), using camelCase to match the
 * rest of src/data. When real editions are synced in later, a small
 * snake_case → camelCase mapping is all that's needed.
 *
 * `latestEdition` below is a representative sample used as the OFFLINE FALLBACK.
 * At runtime the site tries to load the real latest edition from a Cloudflare
 * bucket (see ./loadEdition.ts) and only uses this sample when that's
 * unavailable (e.g. before the bucket is live, or if the fetch fails).
 */

export type BardiCategory =
  | 'SWITZERLAND'
  | 'NEWS'
  | 'TECH'
  | 'STARTUP'
  | 'INNOVATION'
  | 'TRAINING'

export interface BardiStory {
  headline: string
  category: BardiCategory
  summary: string
  sourceUrl: string
  sourceName: string
  imageUrl?: string
  videoUrl?: string
}

export interface BardiEdition {
  /** ISO date 'YYYY-MM-DD' */
  date: string
  subject: string
  intro: string
  stories: BardiStory[]
  outro: string
  quote: { text: string; author: string }
}

/** Chip colours, ported 1:1 from the email template. */
export const CATEGORY_COLORS: Record<BardiCategory, { bg: string; fg: string }> = {
  SWITZERLAND: { bg: '#DA291C', fg: '#FFFFFF' },
  NEWS: { bg: '#14181F', fg: '#FFFFFF' },
  TECH: { bg: '#2563EB', fg: '#FFFFFF' },
  STARTUP: { bg: '#FF4D2E', fg: '#FFFFFF' },
  INNOVATION: { bg: '#059669', fg: '#FFFFFF' },
  TRAINING: { bg: '#7C3AED', fg: '#FFFFFF' },
}

/** 'YYYY-MM-DD' → 'Friday, June 12, 2026' (parsed as a local date, no TZ shift). */
export const formatEditionDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1100&q=60`

export const latestEdition: BardiEdition = {
  date: '2026-06-12',
  subject: 'Bardi Report — Wearables that see injuries coming, and Swiss rehab tech scales up',
  intro:
    "Happy Friday. This edition is heavy on the theme that keeps me up at night: " +
    "moving rehab from the clinic to anywhere a camera or sensor can reach. Six stories, " +
    'one mantra, and a couple of things worth arguing about over coffee.',
  quote: {
    text: 'The score takes care of itself when you take care of the work.',
    author: 'Bill Walsh',
  },
  stories: [
    {
      headline: 'Champions League final shatters global streaming records',
      category: 'NEWS',
      summary:
        'A late winner capped a final that drew the largest live-streamed audience in the ' +
        "competition's history, with mobile viewing overtaking traditional broadcast for the first time.",
      sourceUrl: 'https://www.espn.com/soccer/',
      sourceName: 'ESPN',
      imageUrl: UNSPLASH('1522778119026-d647f0596c20'),
    },
    {
      headline: 'Swiss startup raises CHF 12M to put a physiotherapist in your phone',
      category: 'SWITZERLAND',
      summary:
        'A Zurich-based team closed a Series A to scale camera-based movement assessment for ' +
        'post-op patients — no wearables, no clinic visit, just a phone propped against the wall.',
      sourceUrl: 'https://www.swissinfo.ch/eng/sci-tech/',
      sourceName: 'SWI swissinfo',
      imageUrl: UNSPLASH('1527668752968-14dc70a27c95'),
    },
    {
      headline: 'New wearable flags hamstring risk days before it happens',
      category: 'TECH',
      summary:
        'Researchers report a sensor-plus-model pipeline that spots the neuromuscular fatigue ' +
        'signature preceding hamstring strains, giving coaches a 48–72 hour warning window.',
      sourceUrl: 'https://www.nature.com/subjects/biomedical-engineering',
      sourceName: 'Nature',
      imageUrl: UNSPLASH('1510017803434-a899398421b3'),
      videoUrl: 'https://www.youtube.com/results?search_query=wearable+injury+prevention',
    },
    {
      headline: 'Markerless motion capture finally hits clinical-grade accuracy',
      category: 'INNOVATION',
      summary:
        'A peer-reviewed benchmark puts multi-camera markerless tracking within a degree of ' +
        'marker-based gold standards for lower-limb kinematics — the validation gait labs were waiting for.',
      sourceUrl: 'https://spectrum.ieee.org/',
      sourceName: 'IEEE Spectrum',
      imageUrl: UNSPLASH('1581090700227-1e37b190418e'),
    },
    {
      headline: 'The 3×/week protocol that rebuilds ACL confidence, not just strength',
      category: 'TRAINING',
      summary:
        'A new return-to-sport review argues that psychological readiness lags physical recovery ' +
        'by months, and lays out a simple progression that trains the brake as hard as the engine.',
      sourceUrl: 'https://bjsm.bmj.com/',
      sourceName: 'BJSM',
      imageUrl: UNSPLASH('1571019613454-1cb2f99b2d8b'),
    },
    {
      headline: 'Rehab-tech founders are quietly winning the boring-but-huge market',
      category: 'STARTUP',
      summary:
        'While consumer fitness apps fight for attention, a wave of startups selling into clinics and ' +
        'insurers is building durable revenue on reimbursement codes. Less glamour, far better retention.',
      sourceUrl: 'https://techcrunch.com/category/health/',
      sourceName: 'TechCrunch',
      imageUrl: UNSPLASH('1556761175-5973dc0f32e7'),
    },
  ],
  outro:
    "That's the lot. If one of these sparked a thought — reply and tell me I'm wrong. " +
    'See you Tuesday. — Bardi',
}
