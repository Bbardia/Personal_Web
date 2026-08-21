import { categories } from '../../data/skills'
import { projects } from '../../data/projects'
import { useInView } from '../../hooks/useIntersectionObserver'
import styles from './NovaPage.module.css'

export const CHAPTERS = ['IDENTITY', 'ORIGIN', 'TOPICS', 'WORK', 'CONTACT'] as const

const topics = categories[0].skills.map((skill) => skill.name)

function Reveal({ children }: { children: React.ReactNode }) {
  const { ref, isVisible } = useInView(0.35)
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`${styles.reveal} ${isVisible ? styles.revealVisible : ''}`}
    >
      {children}
    </div>
  )
}

interface NovaChaptersProps {
  onExit: () => void
}

export default function NovaChapters({ onExit }: NovaChaptersProps) {
  return (
    <div className={styles.chapters}>
      <section className={styles.chapter}>
        <Reveal>
          <span className={styles.eyebrow}>01 / IDENTITY</span>
          <h1 className={styles.mega}>BARDIA</h1>
          <p className={styles.statement}>
            Biomedical engineer crafting the interface between bodies and machines.
          </p>
        </Reveal>
      </section>

      <section className={`${styles.chapter} ${styles.chapterLeft}`}>
        <Reveal>
          <span className={styles.eyebrow}>02 / ORIGIN</span>
          <h2 className={styles.big}>
            From a bakery counter
            <br />
            to medtech R&amp;D.
          </h2>
          <p className={styles.body}>
            Career drift is a superpower — every detour adds a tool. Today I engineer
            ML-powered rehabilitation and coordination systems at Sensopro.
          </p>
        </Reveal>
      </section>

      <section className={styles.chapter}>
        <Reveal>
          <span className={styles.eyebrow}>03 / TOPICS</span>
          <h2 className={styles.big}>Obsessed with how bodies move.</h2>
          <ul className={styles.chips}>
            {topics.map((topic) => (
              <li key={topic} className={styles.chip}>
                {topic}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className={`${styles.chapter} ${styles.chapterWork}`}>
        <Reveal>
          <span className={styles.eyebrow}>04 / WORK</span>
          <h2 className={styles.big}>Selected work.</h2>
          <ul className={styles.workList}>
            {projects.map((project) => (
              <li key={project.title} className={styles.workItem}>
                <strong>{project.title}</strong>
                <span>{project.description}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className={styles.chapter}>
        <Reveal>
          <span className={styles.eyebrow}>05 / CONTACT</span>
          <h2 className={styles.big}>Let&apos;s build what&apos;s next.</h2>
          <div className={styles.ctaRow}>
            <a href="/CV.pdf" download className={styles.ctaPrimary}>
              DOWNLOAD CV
            </a>
            <a
              href="https://github.com/bbardia"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaGhost}
            >
              GITHUB
            </a>
            <a
              href="https://www.linkedin.com/in/bardia-amiryavari"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaGhost}
            >
              LINKEDIN
            </a>
            <a href="mailto:bardiaamiryavari@gmail.com" className={styles.ctaGhost}>
              EMAIL
            </a>
          </div>
          <button className={styles.exitInline} onClick={onExit}>
            EXIT TO CLASSIC ↩
          </button>
        </Reveal>
      </section>
    </div>
  )
}
