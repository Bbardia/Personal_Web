import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Navbar from './components/layout/Navbar'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Projects from './components/sections/Projects'
import Skills from './components/sections/Skills'
import StyleGallery from './components/sections/StyleGallery'
import NewsletterTeaser from './components/sections/NewsletterTeaser'
import Contact from './components/sections/Contact'
import RetroPage from './components/retro/RetroPage'
import NewsletterPage from './components/newsletter/NewsletterPage'
import NovaLoader from './components/nova/NovaLoader'
import SagaLoader from './components/saga/SagaLoader'
import { useInView } from './hooks/useIntersectionObserver'
import type { SelectableStyleId } from './data/styles'

// three.js is heavy — only people who enter Nova or the Saga download it
const NovaPage = lazy(() => import('./components/nova/NovaPage'))
const SagaPage = lazy(() => import('./components/saga/SagaPage'))

function FadeInSection({ children, instant }: { children: React.ReactNode; instant?: boolean }) {
  const { ref, isVisible } = useInView(0.1)
  // instant: no .fadeIn class at all, so the per-child stagger selectors
  // (:global(.fadeIn…)) can't re-hide content either
  if (instant) {
    return <div>{children}</div>
  }
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`fadeIn ${isVisible ? 'visible' : ''}`}
    >
      {children}
    </div>
  )
}

type ActiveView = 'classic' | SelectableStyleId | 'newsletter'

const viewFromHash = (): ActiveView => {
  if (window.location.hash === '#retro') return 'retro'
  if (window.location.hash === '#nova') return 'nova'
  if (window.location.hash === '#saga') return 'saga'
  if (window.location.hash === '#newsletter') return 'newsletter'
  return 'classic'
}

/* Session-scoped: the hint re-arms on every new visit, but stays quiet
   once the visitor has seen the Style section in this session */
const styleHintSeen = () => {
  try {
    return sessionStorage.getItem('styleHintSeen') === '1'
  } catch {
    return true
  }
}

function App() {
  const [activeView, setActiveView] = useState<ActiveView>(viewFromHash)
  // Returning from a world skips the scroll-reveals — the landing viewport would
  // otherwise sit opacity-0 (black) until observers fire and the fade completes.
  const [skipReveals, setSkipReveals] = useState(false)
  // 'pending': nav link pulses → 'revealed': style card pulses → 'done' on later visits
  const [styleHint, setStyleHint] = useState<'pending' | 'revealed' | 'done'>(() =>
    styleHintSeen() ? 'done' : 'pending',
  )

  const revealStyleHint = () => {
    try {
      sessionStorage.setItem('styleHintSeen', '1')
    } catch {
      // private browsing: the hint just shows again next visit
    }
    setStyleHint('revealed')
  }

  useEffect(() => {
    const onHashChange = () => {
      const next = viewFromHash()
      // covers the browser-Back exit path, which bypasses returnToClassic
      if (next === 'classic') setSkipReveals(true)
      setActiveView(next)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const enterStyle = (id: SelectableStyleId) => {
    window.location.hash = id
  }

  // Remembers where the newsletter page was opened from, so its Back button
  // returns there: 'menu' (top nav) → top of page; 'teaser' (in-page card) →
  // the teaser section.
  const newsletterSource = useRef<'menu' | 'teaser'>('menu')

  const openNewsletter = (source: 'menu' | 'teaser') => {
    newsletterSource.current = source
    window.location.hash = 'newsletter'
  }

  // return to the classic page and scroll to the given target
  const returnToClassic = (scrollTarget: 'top' | string, focusSelector?: string) => {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setSkipReveals(true)
    setActiveView('classic')
    setTimeout(() => {
      // exiting a world is a system response (and reachable via Escape) — snap, never animate
      if (scrollTarget === 'top') window.scrollTo({ top: 0, behavior: 'instant' })
      else document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'instant' })
      if (focusSelector) {
        requestAnimationFrame(() => {
          document.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true })
        })
      }
    }, 0)
  }

  const exitStyle = () => {
    const styleId =
      activeView === 'retro' || activeView === 'nova' || activeView === 'saga'
        ? activeView
        : null
    returnToClassic('style', styleId ? `[data-style-id="${styleId}"]` : undefined)
  }
  const exitNewsletter = () =>
    returnToClassic(newsletterSource.current === 'menu' ? 'top' : 'newsletter-teaser')

  if (activeView === 'retro') {
    return <RetroPage onExit={exitStyle} />
  }

  if (activeView === 'nova') {
    return (
      <Suspense fallback={<NovaLoader />}>
        <NovaPage onExit={exitStyle} />
      </Suspense>
    )
  }

  if (activeView === 'saga') {
    return (
      <Suspense fallback={<SagaLoader />}>
        <SagaPage onExit={exitStyle} />
      </Suspense>
    )
  }

  if (activeView === 'newsletter') {
    return <NewsletterPage onExit={exitNewsletter} />
  }

  return (
    <>
      <Navbar
        pulseStyleLink={styleHint === 'pending'}
        onOpenNewsletter={() => openNewsletter('menu')}
      />
      <main>
        <Hero />
        <FadeInSection instant={skipReveals}><About /></FadeInSection>
        <FadeInSection instant={skipReveals}><Projects /></FadeInSection>
        <FadeInSection instant={skipReveals}><Skills /></FadeInSection>
        <FadeInSection instant={skipReveals}>
          <NewsletterTeaser onOpen={() => openNewsletter('teaser')} />
        </FadeInSection>
        <FadeInSection instant={skipReveals}>
          <StyleGallery
            onSelect={enterStyle}
            hintActive={styleHint === 'pending'}
            pulseCard={styleHint === 'revealed'}
            onHintSeen={revealStyleHint}
          />
        </FadeInSection>
        <FadeInSection instant={skipReveals}><Contact /></FadeInSection>
      </main>
    </>
  )
}

export default App
