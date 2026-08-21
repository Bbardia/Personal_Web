import { useState, useRef } from 'react'
import {
  Code, Calculator, Box, Grid3x3, Cpu, FileText,
  Eye, Brain, Activity, Scan, Cog, HeartPulse,
  GitBranch, Container, Terminal, Search, BookOpen, BarChart3,
  Circle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { categories, stats } from '../../data/skills'
import styles from './Skills.module.css'

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
}

export default function Skills() {
  const [activeIndex, setActiveIndex] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

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
            <div
              key={cat.label}
              className={`${styles.tile} ${isActive ? styles.tileActive : ''}`}
              style={{
                borderColor: isActive ? cat.color : undefined,
                '--tile-color': cat.color,
              } as React.CSSProperties}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <FirstIcon size={24} color={cat.color} />
              <span className={styles.tileLabel}>{cat.label}</span>
            </div>
          )
        })}
      </div>

      {/* Skills Panel */}
      <div
        ref={panelRef}
        className={`${styles.skillsPanel} ${styles.skillsPanelOpen}`}
      >
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
      <div className={styles.statsBar}>
        {stats.map((stat, i) => {
          const content = (
            <>
              <span className={styles.statValue} style={{ color: stat.color }}>
                {stat.value}
              </span>
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
