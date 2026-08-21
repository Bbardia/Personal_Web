import * as THREE from 'three'

/* ─── SAGA · shared data ──────────────────────────────────────────────
   One world, six dioramas, one camera rail. Acts own a slice of scroll:
   the first TRAVEL fraction of each slice flies the camera from the
   previous hold point to this act's hold point; the rest dwells on the
   tableau (with a slow push-in). Everything reads scroll each frame —
   nothing depends on accumulated state, so fast scrolling can't break it. */

export const PAGES = 12
/** fraction of each act's scroll slice spent flying (rest = hold) */
export const TRAVEL = 0.36

export interface ActPalette {
  bg: string
  fog: string
  fogDensity: number
  hemiSky: string
  hemiGround: string
  hemiInt: number
  /** point light (lava / orb / underlight); int 0 disables */
  key: { color: string; int: number; pos: [number, number, number] }
  /** point light (brazier / candle); int 0 disables */
  accent: { color: string; int: number; pos: [number, number, number] }
  /** directional (dawn sun / rim); int 0 disables */
  sun: { color: string; int: number; pos: [number, number, number] }
  /** ambient drift particles near the camera */
  drift: { color: string; speed: number; opacity: number; additive: boolean }
}

export interface Act {
  id: string
  /** [start, end] fraction of total scroll */
  scroll: [number, number]
  /** diorama group position (world) */
  origin: [number, number, number]
  /** camera position while dwelling on the tableau (world) */
  holdPos: [number, number, number]
  /** what the camera looks at while dwelling (world) */
  subject: [number, number, number]
  palette: ActPalette
}

export const ACTS: Act[] = [
  {
    id: 'prologue',
    scroll: [0, 0.13],
    origin: [0, 0, 0],
    holdPos: [0, 1.8, 6.5],
    subject: [0, 1.2, -2],
    palette: {
      bg: '#232b3d', fog: '#33405c', fogDensity: 0.035,
      hemiSky: '#8fa3c7', hemiGround: '#2c3040', hemiInt: 0.75,
      key: { color: '#ffb36b', int: 0, pos: [0, 3, 0] },
      accent: { color: '#ffb36b', int: 0, pos: [0, 2, 0] },
      sun: { color: '#ffb36b', int: 1.15, pos: [-30, 6, -20] },
      drift: { color: '#cdd5e0', speed: 0.12, opacity: 0.35, additive: false },
    },
  },
  {
    id: 'dragon',
    scroll: [0.13, 0.32],
    origin: [-16, -10, -30],
    holdPos: [-11.4, -7.9, -23.6],
    subject: [-16, -8.2, -33],
    palette: {
      bg: '#120705', fog: '#1a0c06', fogDensity: 0.045,
      hemiSky: '#8a4a24', hemiGround: '#140806', hemiInt: 0.8,
      key: { color: '#ff5a1f', int: 65, pos: [-16, -8.4, -26.5] },
      accent: { color: '#ff8c3a', int: 22, pos: [-19, -6.5, -33] },
      sun: { color: '#ff8c3a', int: 0.9, pos: [-16, -2, -42] },
      drift: { color: '#ffb347', speed: -0.3, opacity: 0.5, additive: true },
    },
  },
  {
    id: 'wizard',
    scroll: [0.32, 0.51],
    origin: [18, 8, -60],
    holdPos: [14.5, 9.2, -52.5],
    subject: [18, 8.8, -60],
    palette: {
      bg: '#0a1024', fog: '#0c1226', fogDensity: 0.03,
      hemiSky: '#24356b', hemiGround: '#0a0d1a', hemiInt: 0.6,
      key: { color: '#66d9ff', int: 40, pos: [18, 10.5, -60] },
      accent: { color: '#ffab4d', int: 16, pos: [15.5, 8.5, -57] },
      sun: { color: '#6677cc', int: 0.75, pos: [10, 14, -48] },
      drift: { color: '#ffd9a0', speed: 0.05, opacity: 0.16, additive: true },
    },
  },
  {
    id: 'demon',
    scroll: [0.51, 0.7],
    origin: [-4, -4, -95],
    holdPos: [-4, -2.6, -86.5],
    subject: [-4, -2.4, -96],
    palette: {
      bg: '#0d0406', fog: '#180408', fogDensity: 0.04,
      hemiSky: '#5a1a20', hemiGround: '#120405', hemiInt: 0.65,
      key: { color: '#d41f2c', int: 60, pos: [-4, -2.2, -93.5] },
      accent: { color: '#ff7a20', int: 32, pos: [-3.5, -0.4, -93.6] },
      sun: { color: '#ff6a2a', int: 1.1, pos: [-4, 1, -104] },
      drift: { color: '#ff5c1a', speed: -0.5, opacity: 0.45, additive: true },
    },
  },
  {
    id: 'shadow',
    scroll: [0.7, 0.87],
    origin: [0, -18, -125],
    holdPos: [0, -16.4, -117],
    subject: [0, -16.8, -125],
    palette: {
      bg: '#05050c', fog: '#060512', fogDensity: 0.055,
      hemiSky: '#3a2c5e', hemiGround: '#08060f', hemiInt: 0.65,
      key: { color: '#a89aff', int: 38, pos: [0, -14.2, -122] },
      accent: { color: '#b9a8ff', int: 14, pos: [-2.5, -16, -127] },
      sun: { color: '#a89aff', int: 1.0, pos: [8, -10, -114] },
      drift: { color: '#b9a8ff', speed: 0.1, opacity: 0.22, additive: true },
    },
  },
  {
    id: 'epilogue',
    scroll: [0.87, 1],
    origin: [24, 4, -140],
    holdPos: [24, 5.6, -132.5],
    subject: [24, 5.4, -146],
    palette: {
      bg: '#3f2d24', fog: '#7a5a44', fogDensity: 0.018,
      hemiSky: '#ffd9b0', hemiGround: '#5a4a3c', hemiInt: 0.85,
      key: { color: '#ffce7a', int: 0, pos: [24, 6, -150] },
      accent: { color: '#ffce7a', int: 0, pos: [24, 5, -145] },
      sun: { color: '#ffd27a', int: 1.55, pos: [24, 8, -170] },
      drift: { color: '#ffffff', speed: 0.4, opacity: 0.65, additive: false },
    },
  },
]

/* Camera rail: hold points joined by authored midpoints so consecutive
   acts swing direction (dive into the lair, climb the tower, sink into
   the void, rise into dawn) instead of flying a straight line. */
const RAIL: [number, number, number][] = [
  [0, 2.6, 14], // approach
  ACTS[0].holdPos,
  [-6, 0.5, -12], // dive down-left
  ACTS[1].holdPos,
  [2, -2, -44], // swoop up out of the cave
  ACTS[2].holdPos,
  [6, 2, -76], // drop off the tower
  ACTS[3].holdPos,
  [-2, -8, -108], // sink
  ACTS[4].holdPos,
  [10, -6, -134], // rise
  ACTS[5].holdPos,
]

export const railCurve = new THREE.CatmullRomCurve3(
  RAIL.map((p) => new THREE.Vector3(...p)),
  false,
  'centripetal',
)
railCurve.updateArcLengths()

/* arc-length u of each act's hold point, found by dense sampling once */
export const HOLD_U: number[] = (() => {
  const N = 600
  const samples: THREE.Vector3[] = []
  for (let i = 0; i <= N; i++) samples.push(railCurve.getPointAt(i / N))
  return ACTS.map((act) => {
    const hp = new THREE.Vector3(...act.holdPos)
    let best = 0
    let bestD = Infinity
    for (let i = 0; i <= N; i++) {
      const d = samples[i].distanceToSquared(hp)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    return best / N
  })
})()

/** act index for a scroll offset */
export const actAt = (offset: number): number => {
  for (let i = ACTS.length - 1; i >= 0; i--) {
    if (offset >= ACTS[i].scroll[0]) return i
  }
  return 0
}

export interface ActProgress {
  /** act index */
  i: number
  /** 0..1 within the act's scroll slice */
  t: number
  /** 0..1 within the hold (dwell) phase; 0 while still travelling */
  hold: number
}

/** stateless per-frame progress for a scroll offset */
export const progressAt = (offset: number, i: number): ActProgress => {
  const [s0, s1] = ACTS[i].scroll
  const t = THREE.MathUtils.clamp((offset - s0) / (s1 - s0), 0, 1)
  const hold = THREE.MathUtils.clamp((t - TRAVEL) / (1 - TRAVEL), 0, 1)
  return { i, t, hold }
}

/** Arc-length position on the camera rail for a scroll offset. */
export const railUAt = (offset: number, i = actAt(offset)): number => {
  const { t, hold } = progressAt(offset, i)
  const previous = i === 0 ? 0 : HOLD_U[i - 1]
  const u =
    t < TRAVEL
      ? THREE.MathUtils.lerp(previous, HOLD_U[i], THREE.MathUtils.smoothstep(t, 0, TRAVEL))
      : HOLD_U[i] + hold * 0.006
  return Math.min(u, 1)
}

/* ─── story copy ────────────────────────────────────────────────────── */

export interface StoryPanel {
  /** scroll fraction where the panel sits (its center) */
  at: number
  /** scroll length over which it is visible */
  len: number
  side: 'left' | 'right' | 'center'
  title?: string
  kicker?: string
  lines: string[]
  /** plain-language bridge from the fantasy metaphor to portfolio evidence */
  proof?: {
    project: string
    role: string
    outcome: string
    cta?: { label: string; href: string }
  }
  /** small caps list under the text (skills / weapons used) */
  wonWith?: string[]
}

export const STORY: StoryPanel[] = [
  {
    at: 0.055, len: 0.1, side: 'center',
    kicker: 'A KNIGHT’S SAGA',
    title: 'BARDIA AMIRYAVARI',
    lines: [
      'A knight-errant wanders before he’s worthy. I drifted from a bakery counter to a biomedical lab.',
      'Now I build rehabilitation robotics, pose-estimation systems, and movement technology. These are the four battles that forged me.',
    ],
  },
  {
    at: 0.245, len: 0.13, side: 'left',
    kicker: 'ACT I · THE DRAGON',
    title: 'Trial of Iron & Fire',
    lines: [
      'The first beast was IRON. It hissed steam and spat fire,',
      'and it would obey no one, until it obeyed me.',
    ],
    proof: {
      project: 'Mechatronics & Robotics',
      role: 'Designed mechanical systems in SolidWorks, then iterated them into working prototypes.',
      outcome: 'Turned complex hardware into machines that could be tested, refined, and trusted.',
    },
    wonWith: ['Mechatronics', 'Robotics', 'SolidWorks', 'Years of burnt fingers'],
  },
  {
    at: 0.435, len: 0.13, side: 'right',
    kicker: 'ACT II · THE WIZARD',
    title: 'Trial of the Unseen',
    lines: [
      'The second foe fought with sight itself, magic that saw',
      'every joint and sinew. So I stole not his staff, but his study.',
    ],
    proof: {
      project: 'Pose Estimation',
      role: 'Developed Python and computer-vision pipelines that turn camera footage into joint-level movement data.',
      outcome: 'Made real-time movement analysis practical for rehabilitation work.',
    },
    wonWith: ['Computer Vision', 'Machine Learning', 'Pose Estimation', 'Python'],
  },
  {
    at: 0.625, len: 0.13, side: 'left',
    kicker: 'ACT III · THE DEMON KING',
    title: 'The Great War',
    lines: [
      'The third battle was never mine alone. Recovery takes people, clinicians,',
      'and engineers moving together, one careful step at a time.',
    ],
    proof: {
      project: 'Robotic Rehabilitation & Sensopro Coordination',
      role: 'Translated biomechanics into practical training and rehabilitation tools with the people who use them.',
      outcome: 'Built technology designed to support repeatable movement practice and useful feedback.',
      cta: { label: 'Visit Sensopro', href: 'https://sensopro.swiss/ch-en/' },
    },
    wonWith: ['Robotic Rehabilitation', 'Sensopro Coordination', 'Biomechanics'],
  },
  {
    at: 0.8, len: 0.12, side: 'left',
    kicker: 'ACT IV · THE SHADOW',
    title: 'The Last Duel',
    lines: [
      'The last foe wore my armor and knew my guard. Doubt cannot be slain, only outgrown.',
      'Lower the blade and the helmet lifts: a biomedical engineer who just keeps building.',
    ],
    proof: {
      project: 'Engineering Practice & Research',
      role: 'Combined biomedical engineering, software, research, and hands-on prototyping across 10+ projects.',
      outcome: 'Five-plus years of learning across disciplines, with three publications along the road.',
      cta: {
        label: 'View publications',
        href: 'https://scholar.google.com/citations?user=ZtBT1EcAAAAJ&hl=en',
      },
    },
    wonWith: ['5+ years', '10+ projects', '3 publications'],
  },
  {
    at: 0.9, len: 0.06, side: 'center',
    kicker: 'EPILOGUE',
    title: 'The Next Quest',
    lines: [
      'The road ahead leads toward biomedical robotics, computer vision, and human movement.',
      'If that is where you are building, let’s begin the next chapter together.',
    ],
  },
]

export const LINKS = [
  { label: 'GitHub', href: 'https://github.com/bbardia' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/bardia-amiryavari' },
  { label: 'Scholar', href: 'https://scholar.google.com/citations?user=ZtBT1EcAAAAJ&hl=en' },
  { label: 'CV', href: '/CV.pdf' },
]
