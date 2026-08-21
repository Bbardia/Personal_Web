import { useEffect } from 'react'
import { portfolioStyles } from '../../data/styles'
import type { PortfolioStyle, SelectableStyleId } from '../../data/styles'
import { useInView } from '../../hooks/useIntersectionObserver'
import styles from './StyleGallery.module.css'

interface StyleGalleryProps {
  onSelect: (id: SelectableStyleId) => void
  hintActive?: boolean
  pulseCard?: boolean
  onHintSeen?: () => void
}

function CardPreview({ id }: { id: PortfolioStyle['id'] }) {
  if (id === 'classic') {
    return (
      <div className={`${styles.preview} ${styles.previewClassic}`}>
        <div className={styles.mockLeft}>
          <div className={styles.mockBarLg} />
          <div className={styles.mockBarMd} />
          <div className={styles.mockBarSm} />
          <div className={styles.mockPill} />
        </div>
        <div className={styles.mockScreen} />
      </div>
    )
  }
  if (id === 'retro') {
    return (
      <div className={`${styles.preview} ${styles.previewRetro}`}>
        <span className={styles.mockPixelTitle}>
          BARDIA.EXE<span className={styles.mockCursor} />
        </span>
        <div className={styles.mockGreenBar} />
        <div className={styles.mockGreenBarShort} />
        <div className={styles.mockGreenTags}>
          <span /><span /><span />
        </div>
      </div>
    )
  }
  if (id === 'nova') {
    return (
      <div className={`${styles.preview} ${styles.previewNova}`}>
        <span className={styles.novaStars} />
        <span className={styles.novaRing} />
        <span className={styles.novaOrb} />
        <span className={styles.novaWord}>NOVA</span>
      </div>
    )
  }
  return (
    <div className={`${styles.preview} ${styles.previewSoon}`}>
      <span className={styles.mockQuestion}>?</span>
    </div>
  )
}

export default function StyleGallery({
  onSelect,
  hintActive = false,
  pulseCard = false,
  onHintSeen,
}: StyleGalleryProps) {
  const { ref, isVisible } = useInView(0.35)

  useEffect(() => {
    if (isVisible && hintActive) onHintSeen?.()
  }, [isVisible, hintActive, onHintSeen])

  return (
    <section
      id="style"
      ref={ref as React.RefObject<HTMLElement>}
      className={styles.styleSection}
    >
      <div className={styles.sectionHeader}>
        <div className={styles.accentLine} />
        <h2 className={styles.titleText}>STYLE</h2>
        <p className={styles.subtitleText}>
          One portfolio, every taste — pick how you want to see it
        </p>
      </div>

      <div className={styles.cardsRow}>
        {portfolioStyles.map((style) => {
          const body = (
            <>
              <CardPreview id={style.id} />
              <div className={styles.cardBody}>
                <div className={styles.cardTitleRow}>
                  <h3 className={styles.cardName}>{style.name}</h3>
                  {style.status === 'current' && (
                    <span className={styles.badgeCurrent}>CURRENT</span>
                  )}
                  {style.status === 'available' && (
                    <span className={styles.badgeEnter}>ENTER ▸</span>
                  )}
                  {style.status === 'soon' && (
                    <span className={styles.badgeSoon}>SOON</span>
                  )}
                </div>
                <p className={styles.cardTagline}>{style.tagline}</p>
              </div>
            </>
          )

          if (style.status === 'available') {
            return (
              <button
                key={style.id}
                className={`${styles.card} ${styles.cardClickable} ${
                  pulseCard ? styles.cardPulse : ''
                }`}
                onClick={() => onSelect(style.id as SelectableStyleId)}
              >
                {body}
              </button>
            )
          }
          return (
            <div
              key={style.id}
              className={`${styles.card} ${style.status === 'soon' ? styles.cardSoon : ''}`}
            >
              {body}
            </div>
          )
        })}
      </div>
    </section>
  )
}
