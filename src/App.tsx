import { lazy, Suspense, useEffect, useState } from 'react'
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
import { useInView } from './hooks/useIntersectionObserver'
import type { SelectableStyleId } from './data/styles'

// three.js is heavy — only people who enter Nova download it
const NovaPage = lazy(() => import('./components/nova/NovaPage'))

function FadeInSection({ children }: { children: React.ReactNode }) {
  const { ref, isVisible } = useInView(0.1)
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
    const onHashChange = () => setActiveView(viewFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const enterStyle = (id: SelectableStyleId) => {
    window.location.hash = id
  }

  const openNewsletter = () => {
    window.location.hash = 'newsletter'
  }

  // return to the classic page and scroll back to where the visitor left
  const returnToClassic = (anchorId: string) => {
    history.replaceState(null, '', window.location.pathname + window.location.search)
    setActiveView('classic')
    setTimeout(() => document.getElementById(anchorId)?.scrollIntoView(), 0)
  }

  const exitStyle = () => returnToClassic('style')
  const exitNewsletter = () => returnToClassic('newsletter-teaser')

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

  if (activeView === 'newsletter') {
    return <NewsletterPage onExit={exitNewsletter} />
  }

  return (
    <>
      <Navbar pulseStyleLink={styleHint === 'pending'} />
      <main>
        <Hero />
        <FadeInSection><About /></FadeInSection>
        <FadeInSection><Projects /></FadeInSection>
        <FadeInSection><Skills /></FadeInSection>
        <FadeInSection><NewsletterTeaser onOpen={openNewsletter} /></FadeInSection>
        <FadeInSection>
          <StyleGallery
            onSelect={enterStyle}
            hintActive={styleHint === 'pending'}
            pulseCard={styleHint === 'revealed'}
            onHintSeen={revealStyleHint}
          />
        </FadeInSection>
        <FadeInSection><Contact /></FadeInSection>
      </main>
    </>
  )
}

export default App
