import { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Canvas } from '@react-three/fiber'
import { Scroll, ScrollControls, useProgress } from '@react-three/drei'
import SagaScene from './SagaScene'
import SagaStory from './SagaStory'
import SagaLoader from './SagaLoader'
import SagaCrest from './SagaCrest'
import { ACTS, LINKS, PAGES, STORY } from './sagaData'
import { prefersReducedMotion } from './sagaAssets'
import styles from './SagaPage.module.css'

interface SagaPageProps {
  onExit: () => void
}

const ACT_NAMES = ['PROLOGUE', 'THE DRAGON', 'THE WIZARD', 'THE DEMON KING', 'THE SHADOW', 'EPILOGUE']

/* WebGL can fail (old GPU, disabled contexts) — tell the tale as text */
class CanvasErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function StaticFallback({
  onExit,
  onResume,
}: SagaPageProps & { onResume?: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <main className={styles.staticFallback}>
      <div className={styles.fallbackEyebrow}>TEXT EDITION · THE COMPLETE TALE</div>
      <h1 ref={titleRef} tabIndex={-1} className={styles.fallbackTitle}>
        A KNIGHT’S SAGA
      </h1>
      {STORY.map((p) => (
        <div key={p.at} className={styles.fallbackAct}>
          {p.kicker && <span className={styles.kicker}>{p.kicker}</span>}
          {p.title && <h2 className={styles.fallbackActTitle}>{p.title}</h2>}
          {p.lines.map((line) => (
            <p key={line} className={styles.fallbackText}>
              {line}
            </p>
          ))}
          {p.proof && (
            <div aria-label={`Real-world chapter: ${p.proof.project}`}>
              <span className={styles.proofLabel}>
                REAL-WORLD CHAPTER · {p.proof.project}
              </span>
              <p className={styles.proofText}>
                <strong>Role:</strong> {p.proof.role}
                <br />
                <strong>Outcome:</strong> {p.proof.outcome}
              </p>
              {p.proof.cta && (
                <a
                  className={styles.projectLink}
                  href={p.proof.cta.href}
                  target={p.proof.cta.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                >
                  {p.proof.cta.label} ↗
                </a>
              )}
            </div>
          )}
          {p.wonWith && (
            <ul className={styles.wonWith}>
              {p.wonWith.map((item) => (
                <li key={item} className={styles.wonWithItem}>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <div className={styles.fallbackLinks}>
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            className={styles.questLink}
            target={l.href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
          >
            {l.label}
          </a>
        ))}
      </div>
      <div className={styles.fallbackActions}>
        {onResume && (
          <button className={styles.fallbackResume} onClick={onResume}>
            RETURN TO 3D
          </button>
        )}
        <button className={styles.fallbackExit} onClick={onExit}>
          BACK TO CLASSIC
        </button>
      </div>
    </main>
  )
}

export default function SagaPage({ onExit }: SagaPageProps) {
  const [act, setAct] = useState(0)
  const [textMode, setTextMode] = useState(false)
  const [reducedMotion] = useState(prefersReducedMotion)
  const scrollElRef = useRef<HTMLElement | null>(null)
  const scrollCleanupRef = useRef<(() => void) | null>(null)
  const hudRef = useRef<HTMLDivElement>(null)
  // the lazy chunk's Suspense loader ends before the 3.8MB of models arrive —
  // keep the boot screen up while DefaultLoadingManager still has work
  const { active: loading } = useProgress()

  const rideTo = useCallback((index: number) => {
    const el = scrollElRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    // Land on the authored story beat rather than halfway through the fight.
    const target = STORY[index]?.at ?? ACTS[index].scroll[0]
    el.scrollTo({
      top: max * target,
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }, [reducedMotion])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit()
        return
      }
      if (document.activeElement !== scrollElRef.current) return

      let next: number | null = null
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        next = Math.min(ACTS.length - 1, act + 1)
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        next = Math.max(0, act - 1)
      } else if (e.key === 'Home') {
        next = 0
      } else if (e.key === 'End') {
        next = ACTS.length - 1
      }

      if (next !== null) {
        e.preventDefault()
        rideTo(next)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [act, onExit, rideTo])

  const handleScrollEl = useCallback((el: HTMLElement) => {
    if (scrollElRef.current === el) return
    scrollCleanupRef.current?.()
    scrollElRef.current = el
    el.tabIndex = 0
    el.setAttribute('role', 'region')
    el.setAttribute(
      'aria-label',
      'Interactive 3D portfolio story. Scroll, or use arrow and page keys to move between chapters.',
    )

    const updateProgress = () => {
      const max = Math.max(1, el.scrollHeight - el.clientHeight)
      hudRef.current?.style.setProperty('--saga-progress', `${el.scrollTop / max}`)
    }
    el.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()
    scrollCleanupRef.current = () => el.removeEventListener('scroll', updateProgress)

    requestAnimationFrame(() => el.focus({ preventScroll: true }))
  }, [])

  useEffect(() => () => scrollCleanupRef.current?.(), [])

  if (textMode) {
    return <StaticFallback onExit={onExit} onResume={() => setTextMode(false)} />
  }

  return (
    <div className={styles.saga}>
      <CanvasErrorBoundary fallback={<StaticFallback onExit={onExit} />}>
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 2.6, 14], fov: 55 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gl.domElement.setAttribute('aria-hidden', 'true')}
        >
          <ScrollControls
            pages={PAGES}
            damping={reducedMotion ? 0.01 : 0.45}
            maxSpeed={reducedMotion ? Infinity : 0.38}
          >
            <Suspense fallback={null}>
              <SagaScene onActChange={setAct} onScrollEl={handleScrollEl} />
            </Suspense>
            <Scroll html>
              <SagaStory onExit={onExit} />
            </Scroll>
          </ScrollControls>
        </Canvas>
      </CanvasErrorBoundary>

      {loading && <SagaLoader />}

      {createPortal(
        <div ref={hudRef} className={styles.hud}>
          <div className={styles.brand} aria-hidden="true">
            <SagaCrest className={styles.brandCrest} />
            <span className={styles.brandCopy}>
              <strong>A KNIGHT’S SAGA</strong>
              <small>AN INTERACTIVE PORTFOLIO</small>
            </span>
          </div>

          <button className={styles.exit} onClick={onExit}>
            EXIT ✕
          </button>

          <nav className={styles.dots} aria-label="Acts">
            <span className={styles.progressTrack} aria-hidden="true">
              <span className={styles.progressFill} />
            </span>
            {ACT_NAMES.map((label, i) => (
              <button
                key={label}
                className={`${styles.dot} ${i === act ? styles.dotActive : ''}`}
                title={label}
                aria-label={`Act ${i + 1}: ${label}`}
                aria-current={i === act ? 'step' : undefined}
                onClick={() => rideTo(i)}
              >
                <span className={styles.dotCore} aria-hidden="true" />
                <span className={styles.dotLabel} aria-hidden="true">{label}</span>
              </button>
            ))}
          </nav>

          <div key={act} className={styles.chapterStamp} aria-live="polite">
            <span>CHAPTER {String(act + 1).padStart(2, '0')} / {String(ACT_NAMES.length).padStart(2, '0')}</span>
            <strong>{ACT_NAMES[act]}</strong>
          </div>

          <span className={styles.hint} hidden={act !== 0}>
            SCROLL TO RIDE
            <span className={styles.hintArrow}>▾</span>
          </span>

          <button className={styles.readMode} onClick={() => setTextMode(true)}>
            READ STORY
          </button>
        </div>,
        document.body,
      )}
    </div>
  )
}
