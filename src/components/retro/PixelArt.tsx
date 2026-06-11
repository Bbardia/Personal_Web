import styles from './PixelArt.module.css'

/* Pixel-art sprites drawn with box-shadow — one shadow per 'X' pixel. */

const PACMAN_OPEN = [
  '....XXXXX....',
  '..XXXXXXXXX..',
  '.XXXXXXXXXXX.',
  '.XXXXXXXXXX..',
  'XXXXXXXXX....',
  'XXXXXXX......',
  'XXXXX........',
  'XXXXXXX......',
  'XXXXXXXXX....',
  '.XXXXXXXXXX..',
  '.XXXXXXXXXXX.',
  '..XXXXXXXXX..',
  '....XXXXX....',
]

const PACMAN_CLOSED = [
  '....XXXXX....',
  '..XXXXXXXXX..',
  '.XXXXXXXXXXX.',
  '.XXXXXXXXXXX.',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  'XXXXXXXXX....',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  '.XXXXXXXXXXX.',
  '.XXXXXXXXXXX.',
  '..XXXXXXXXX..',
  '....XXXXX....',
]

const GHOST = [
  '.....XXXX.....',
  '...XXXXXXXX...',
  '..XXXXXXXXXX..',
  '.XXX..XX..XXX.',
  '.XXX..XX..XXX.',
  'XXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXX',
  'XX.XX.XX.XX.XX',
]

const DINO_A = [
  '..........XXXXXX',
  '..........X.XXXX',
  '..........XXXXXX',
  '..........XXXX..',
  '..........XXXXX.',
  'X........XXXX...',
  'XX......XXXXX...',
  'XXX....XXXXXXXX.',
  'XXXX..XXXXXXX...',
  '.XXXXXXXXXXXX...',
  '..XXXXXXXXXXX...',
  '...XXXXXXXXX....',
  '....XXXXXXX.....',
  '.....XX..XX.....',
]

const DINO_B = [
  '..........XXXXXX',
  '..........X.XXXX',
  '..........XXXXXX',
  '..........XXXX..',
  '..........XXXXX.',
  'X........XXXX...',
  'XX......XXXXX...',
  'XXX....XXXXXXXX.',
  'XXXX..XXXXXXX...',
  '.XXXXXXXXXXXX...',
  '..XXXXXXXXXXX...',
  '...XXXXXXXXX....',
  '....XXXXXXX.....',
  '....XX....XX....',
]

function spriteShadow(map: string[], px: number, color: string): string {
  const shadows: string[] = []
  map.forEach((row, y) => {
    ;[...row].forEach((cell, x) => {
      // shadows are offset by one pixel so none lands at 0,0 (which would hide behind the box)
      if (cell === 'X') shadows.push(`${(x + 1) * px}px ${(y + 1) * px}px 0 0 ${color}`)
    })
  })
  return shadows.join(', ')
}

interface SpriteProps {
  map: string[]
  color: string
  px?: number
}

function Sprite({ map, color, px = 3 }: SpriteProps) {
  return (
    <div
      className={styles.sprite}
      style={{ width: map[0].length * px, height: map.length * px }}
    >
      <i
        className={styles.spritePixels}
        style={{
          width: px,
          height: px,
          top: -px,
          left: -px,
          boxShadow: spriteShadow(map, px, color),
        }}
      />
    </div>
  )
}

/* Two stacked sprite frames toggled by CSS for a simple walk/chomp cycle. */
function AnimatedSprite({ frames, color, px = 3 }: { frames: [string[], string[]]; color: string; px?: number }) {
  return (
    <div className={styles.flip}>
      <Sprite map={frames[0]} color={color} px={px} />
      <div className={styles.flipFrameB}>
        <Sprite map={frames[1]} color={color} px={px} />
      </div>
    </div>
  )
}

export default function RetroSprites() {
  return (
    <div className={styles.sprites} aria-hidden="true">
      <div className={styles.chase}>
        <AnimatedSprite frames={[PACMAN_OPEN, PACMAN_CLOSED]} color="#54FF7E" />
        <div className={styles.bob}>
          <Sprite map={GHOST} color="#2FBF5C" />
        </div>
      </div>

      <div className={styles.ghostDrift}>
        <div className={styles.bob}>
          <Sprite map={GHOST} color="#1D7A3A" />
        </div>
      </div>

      <div className={styles.dinoRun}>
        <AnimatedSprite frames={[DINO_A, DINO_B]} color="#2FBF5C" />
      </div>
    </div>
  )
}
