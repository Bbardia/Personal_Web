import { useEffect, useState } from 'react'
import {
  Code, Calculator, Box, Grid3x3, Cpu, FileText,
  Eye, Brain, Activity, Scan, Cog, HeartPulse,
  GitBranch, Container, Terminal, Search, BookOpen, BarChart3,
  Atom, Cloud, Circle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { categories, stats } from '../../data/skills'
import { useInView } from '../../hooks/useIntersectionObserver'
import styles from './Skills.module.css'

/* counts "10+"-style values up from 0 once the stats bar scrolls into view */
function StatValue({ value, color, active }: { value: string; color: string; active: boolean }) {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const match = /^(\d+)(.*)$/.exec(value)
    if (!active || !match) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const end = Number(match[1])
    const suffix = match[2]
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(`${Math.round(end * eased)}${suffix}`)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, value])

  return (
    <span className={styles.statValue} style={{ color }}>
      {display}
    </span>
  )
}

const iconMap: Record<string, LucideIcon> = {
  code: Code,
  calculator: Calculator,
  box: Box,
  'grid-3x3': Grid3x3,
  cpu: Cpu,
  'file-text': FileText,
  eye: Eye,
  brain: Brain,
  activity: Activity,
  scan: Scan,
  cog: Cog,
  'heart-pulse': HeartPulse,
  'git-branch': GitBranch,
  container: Container,
  terminal: Terminal,
  search: Search,
  'book-open': BookOpen,
  'bar-chart-3': BarChart3,
  atom: Atom,
  cloud: Cloud,
}

export default function Skills() {
  const [activeIndex, setActiveIndex] = useState(0)
  const { ref: statsRef, isVisible: statsInView } = useInView(0.4)

  const activeCat = categories[activeIndex]

  return (
    <section id="skills" className={styles.skills}>
      <div className={styles.sectionHeader}>
        <div className={styles.accentLine} />
        <h2 className={styles.titleText}>SKILLS &amp; TOOLS</h2>
        <p className={styles.subtitleText}>
          Engineering expertise across software, simulation &amp; research
        </p>
      </div>

      {/* Category Tiles */}
      <div className={styles.tilesRow}>
        {categories.map((cat, i) => {
          const isActive = activeIndex === i
          const FirstIcon = iconMap[cat.skills[0].icon] || Circle
          return (
            <button
              key={cat.label}
              type="button"
              className={`${styles.tile} ${isActive ? styles.tileActive : ''}`}
              style={{
                borderColor: isActive ? cat.color : undefined,
                '--tile-color': cat.color,
              } as React.CSSProperties}
              aria-pressed={isActive}
              onClick={() => setActiveIndex(i)}
              onFocus={() => setActiveIndex(i)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <FirstIcon size={24} color={cat.color} />
              <span className={styles.tileLabel}>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* Skills Panel — keyed wrapper crossfades when the category changes */}
      <div className={styles.skillsPanel}>
        <div key={activeCat.label} className={styles.panelSwap}>
          <span className={styles.panelLabel} style={{ color: activeCat.color }}>
            {activeCat.label}
          </span>
          <div className={styles.skillRow}>
            {activeCat.skills.map((skill) => {
              const Icon = iconMap[skill.icon] || Circle
              return (
                <div key={skill.name} className={styles.skillCard}>
                  <Icon size={28} color={skill.color} />
                  <span className={styles.skillLabel}>{skill.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Decorative Divider */}
      <div className={styles.decorativeDivider}>
        <div className={styles.decoLineSegment} style={{ width: 60, background: 'var(--accent-red)' }} />
        <div className={styles.decoTriangle} style={{ borderBottomColor: 'var(--accent-cyan)', transform: 'rotate(15deg)' }} />
        <div className={styles.decoLineSegment} style={{ width: 80, background: 'var(--accent-lime)' }} />
        <div className={styles.decoDot} style={{ background: 'var(--accent-orange)' }} />
        <div className={styles.decoLineSegment} style={{ width: 60, background: 'var(--accent-purple)' }} />
        <div className={styles.decoTriangle} style={{ borderBottomColor: 'var(--accent-red)', transform: 'rotate(-20deg)' }} />
        <div className={styles.decoLineSegment} style={{ width: 70, background: 'var(--accent-cyan)' }} />
      </div>

      {/* Stats Bar */}
      <div ref={statsRef as React.RefObject<HTMLDivElement>} className={styles.statsBar}>
        {stats.map((stat, i) => {
          const content = (
            <>
              <StatValue value={stat.value} color={stat.color} active={statsInView} />
              <span className={styles.statLabel}>{stat.label}</span>
            </>
          )
          return (
            <div key={stat.label} style={{ display: 'contents' }}>
              {i > 0 && <div className={styles.statDivider} />}
              {'href' in stat && stat.href ? (
                <a
                  href={stat.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.statItem} ${styles.statLink}`}
                >
                  {content}
                </a>
              ) : (
                <div className={styles.statItem}>{content}</div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
