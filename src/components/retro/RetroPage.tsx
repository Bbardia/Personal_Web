import { useEffect } from 'react'
import RetroSprites from './PixelArt'
import styles from './RetroPage.module.css'

const topics = [
  'MACHINE LEARNING',
  'COMPUTER VISION',
  'POSE ESTIMATION',
  'BIOMECHANICS',
  'PYTHON',
  'MATLAB',
  'REACT',
  'ELECTRON',
  'DEVOPS',
]

const questLog = [
  { text: 'SENSOPRO -- BIOMEDICAL ENGINEER', note: 'ACTIVE' },
  { text: '3 PUBLICATIONS + RESEARCH', note: null },
  { text: '5+ YRS XP / 10+ PROJECTS', note: null },
]

interface RetroPageProps {
  onExit: () => void
}

export default function RetroPage({ onExit }: RetroPageProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  return (
    <div className={styles.crt}>
      <RetroSprites />
      <main className={styles.frame}>
        <header className={styles.titleRow}>
          <h1 className={styles.title}>BARDIA.EXE</h1>
          <span className={styles.cursor} />
        </header>

        <div className={styles.lines}>
          <p className={styles.line}>&gt; CLASS: BIOMEDICAL ENGINEER</p>
          <p className={styles.line}>&gt; SPECIALTY: ML-POWERED REHAB TECH</p>
          <p className={styles.line}>&gt; ORIGIN STORY: BAKERY -&gt; MEDTECH. TRUE STORY.</p>
        </div>

        <h2 className={styles.heading}>[TOPICS]</h2>
        <ul className={styles.tags}>
          {topics.map((topic) => (
            <li key={topic} className={styles.tag}>
              {topic}
            </li>
          ))}
        </ul>

        <h2 className={styles.heading}>[QUEST LOG]</h2>
        <ul className={styles.quests}>
          {questLog.map((quest) => (
            <li key={quest.text} className={styles.quest}>
              <span className={styles.questMark}>*</span> {quest.text}
              {quest.note && <span className={styles.questNote}>[{quest.note}]</span>}
            </li>
          ))}
        </ul>

        <h2 className={styles.heading}>[INVENTORY]</h2>
        <a href="/CV.pdf" download className={styles.cvLink}>
          <span className={styles.cvMark}>[+]</span> CV.PDF -- PRESS TO DOWNLOAD
        </a>

        <button className={styles.exit} onClick={onExit}>
          PRESS [ESC] TO EXIT &gt;&gt;
        </button>
      </main>
    </div>
  )
}
