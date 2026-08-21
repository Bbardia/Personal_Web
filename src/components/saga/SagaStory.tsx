import { useInView } from '../../hooks/useIntersectionObserver'
import { LINKS, PAGES, STORY, type StoryPanel } from './sagaData'
import styles from './SagaPage.module.css'

/* HTML story layer — rides inside drei's <Scroll html>. Panels sit at their
   act's scroll fraction and reveal with the same IntersectionObserver
   pattern the rest of the site uses (no per-frame DOM writes needed). */

function Panel({ panel, isPrologue = false }: { panel: StoryPanel; isPrologue?: boolean }) {
  const { ref, isVisible } = useInView(0.4)
  const sideClass =
    panel.side === 'left' ? styles.panelLeft : panel.side === 'right' ? styles.panelRight : ''
  // dvh, not vh: drei translates the html layer by the container's real
  // height, and on phones (URL bar never collapses in inner-div scroll)
  // 100vh overshoots it ~12% — enough to push the last panels forever
  // out of reach
  return (
    <section
      className={`${styles.panel} ${sideClass}`}
      style={{ top: `${panel.at * PAGES * 100}dvh` }}
    >
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={`${styles.panelInner} ${isVisible ? styles.panelVisible : ''}`}
      >
        {panel.kicker && <span className={styles.kicker}>{panel.kicker}</span>}
        {panel.title &&
          (isPrologue ? (
            <h1 className={`${styles.megaTitle} ${styles.prologueTitle}`}>
              {panel.title}
            </h1>
          ) : (
            <h2 className={panel.side === 'center' ? styles.megaTitle : styles.actTitle}>
              {panel.title}
            </h2>
          ))}
        <p className={styles.storyLine}>{panel.lines.join(' ')}</p>
        {panel.proof && (
          <div aria-label={`Real-world chapter: ${panel.proof.project}`}>
            <span className={styles.proofLabel}>
              REAL-WORLD CHAPTER · {panel.proof.project}
            </span>
            <p className={styles.proofText}>
              <strong>Role:</strong> {panel.proof.role}
              <br />
              <strong>Outcome:</strong> {panel.proof.outcome}
            </p>
            {panel.proof.cta && (
              <a
                className={styles.projectLink}
                href={panel.proof.cta.href}
                target={panel.proof.cta.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
              >
                {panel.proof.cta.label} ↗
              </a>
            )}
          </div>
        )}
        {panel.wonWith && (
          <ul className={styles.wonWith}>
            {panel.wonWith.map((w) => (
              <li key={w} className={styles.wonWithItem}>
                {w}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

interface SagaStoryProps {
  onExit: () => void
}

export default function SagaStory({ onExit }: SagaStoryProps) {
  const { ref, isVisible } = useInView(0.4)
  return (
    <main className={styles.story} style={{ height: `${PAGES * 100}dvh` }}>
      {STORY.map((panel, index) => (
        <Panel key={panel.at} panel={panel} isPrologue={index === 0} />
      ))}

      {/* the road goes ever on — links live at the very end of the scroll */}
      <section
        className={`${styles.panel} ${styles.endingPanel}`}
        style={{ top: `${0.95 * PAGES * 100}dvh` }}
      >
        {/* inert until revealed: otherwise the first Tab focuses these
            off-screen links and the browser scrolls drei's hidden wrapper,
            permanently desyncing story from camera */}
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`${styles.panelInner} ${styles.endingInner} ${
            isVisible ? styles.panelVisible : ''
          }`}
          inert={!isVisible}
        >
          <nav className={styles.questLinks} aria-label="Contact">
            {LINKS.map((l) => (
              <a
                key={l.label}
                className={styles.questLink}
                href={l.href}
                target={l.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <button className={styles.returnBtn} onClick={onExit}>
            CLOSE THE BOOK ✕
          </button>
          <p className={styles.credits}>
            Forged with CC0 steel · characters by Kay Lousberg · beasts &amp; keeps by
            Quaternius · sword by hat_my_guy
          </p>
        </div>
      </section>
    </main>
  )
}
