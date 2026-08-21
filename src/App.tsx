import Navbar from './components/layout/Navbar'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Projects from './components/sections/Projects'
import Skills from './components/sections/Skills'
import Contact from './components/sections/Contact'
import { useInView } from './hooks/useIntersectionObserver'

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

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FadeInSection><About /></FadeInSection>
        <FadeInSection><Projects /></FadeInSection>
        <FadeInSection><Skills /></FadeInSection>
        <FadeInSection><Contact /></FadeInSection>
      </main>
    </>
  )
}

export default App
