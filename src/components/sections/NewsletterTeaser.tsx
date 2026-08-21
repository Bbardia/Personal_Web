import { ArrowRight } from 'lucide-react'
import { formatEditionDate } from '../../data/bardiReport'
import { useLatestEdition } from '../../hooks/useLatestEdition'
import styles from './NewsletterTeaser.module.css'

interface NewsletterTeaserProps {
  /** Opens the full Bardi Report page (sets the #newsletter route). */
  onOpen: () => void
}

export default function NewsletterTeaser({ onOpen }: NewsletterTeaserProps) {
  const { edition } = useLatestEdition()

  return (
    <section id="newsletter-teaser" className={styles.section}>
      <div className={styles.header}>
        <div className={styles.accentLine} />
        <h2 className={styles.title}>NEWSLETTER</h2>
        <p className={styles.subtitle}>
          My twice-weekly digest on sport, rehab-tech &amp; innovation
        </p>
      </div>

      <button className={styles.card} onClick={onOpen}>
        <div className={styles.brandBlock}>
          <span className={styles.wordmark}>
            Bardi<span className={styles.accent}>.</span>Report
          </span>
          <span className={styles.cadence}>CURATED TUE &amp; FRI</span>
        </div>

        <div className={styles.previewBlock}>
          <span className={styles.issueMeta}>
            Latest issue · {formatEditionDate(edition.date)}
          </span>
          <span className={styles.issueSubject}>{edition.subject}</span>
          <span className={styles.cta}>
            Read the latest issue
            <ArrowRight size={18} />
          </span>
        </div>
      </button>
    </section>
  )
}
