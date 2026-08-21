import { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Canvas } from '@react-three/fiber'
import { ScrollControls, Scroll } from '@react-three/drei'
import NovaScene from './NovaScene'
import NovaChapters, { CHAPTERS } from './NovaChapters'
import styles from './NovaPage.module.css'

interface NovaPageProps {
  onExit: () => void
}

/* WebGL can fail (old GPU, disabled contexts) — show the journey as plain text instead */
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

function StaticFallback({ onExit }: NovaPageProps) {
  return (
    <div className={styles.staticFallback}>
      <h1 className={styles.fallbackTitle}>BARDIA</h1>
      <p className={styles.fallbackText}>
        This style needs WebGL, which your browser disabled. The classic site has
        everything though.
      </p>
      <button className={styles.fallbackExit} onClick={onExit}>
        BACK TO CLASSIC
      </button>
    </div>
  )
}

export default function NovaPage({ onExit }: NovaPageProps) {
  const [chapter, setChapter] = useState(0)
  const scrollElRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  const handleScrollEl = useCallback((el: HTMLElement) => {
    scrollElRef.current = el
  }, [])

  const flyTo = useCallback((index: number) => {
    const el = scrollElRef.current
    if (!el) return
    // drei's scroll container maps offset over (scrollHeight - clientHeight),
    // so derive the chapter position from its own metrics
    const max = el.scrollHeight - el.clientHeight
    el.scrollTo({ top: (max * index) / (CHAPTERS.length - 1), behavior: 'smooth' })
  }, [])

  return (
    <div className={styles.nova}>
      <CanvasErrorBoundary fallback={<StaticFallback onExit={onExit} />}>
        <Canvas
          dpr={[1, 1.8]}
          camera={{ position: [0, 0, 7], fov: 62 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <ScrollControls pages={CHAPTERS.length} damping={0.22}>
            <Suspense fallback={null}>
              <NovaScene onChapterChange={setChapter} onScrollEl={handleScrollEl} />
            </Suspense>
            <Scroll html>
              <NovaChapters onExit={onExit} />
            </Scroll>
          </ScrollControls>
        </Canvas>
      </CanvasErrorBoundary>

      {createPortal(
        <div className={styles.hud}>
          <button className={styles.exit} onClick={onExit}>
            EXIT ✕
          </button>

          <nav className={styles.dots} aria-label="Chapters">
            {CHAPTERS.map((label, i) => (
              <button
                key={label}
                className={`${styles.dot} ${i === chapter ? styles.dotActive : ''}`}
                title={label}
                aria-label={`Chapter ${i + 1}: ${label}`}
                onClick={() => flyTo(i)}
              />
            ))}
          </nav>

          <span className={`${styles.hint} ${chapter === 0 ? '' : styles.hintHidden}`}>
            SCROLL TO FLY
            <span className={styles.hintArrow}>▾</span>
          </span>
        </div>,
        document.body,
      )}
    </div>
  )
}
