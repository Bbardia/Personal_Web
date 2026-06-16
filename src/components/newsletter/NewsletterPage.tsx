import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import BardiReportReader from './BardiReportReader'
import { useLatestEdition } from '../../hooks/useLatestEdition'
import styles from './NewsletterPage.module.css'

interface NewsletterPageProps {
  onExit: () => void
}

export default function NewsletterPage({ onExit }: NewsletterPageProps) {
  const { status, edition } = useLatestEdition()

  // Esc exits (consistent with the retro/nova pages); open at the top
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit()
    }
    window.addEventListener('keydown', onKey)
    window.scrollTo(0, 0)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.backBtn} onClick={onExit}>
          <ArrowLeft size={18} />
          Back
        </button>
        <span className={styles.brand}>
          Bardi<span className={styles.brandAccent}>.</span>Report
        </span>
      </header>

      <main className={styles.content}>
        {status === 'loading' ? (
          <div className={styles.loading}>
            <span className={styles.spinner} />
            <p className={styles.loadingText}>Loading the latest issue…</p>
          </div>
        ) : (
          <BardiReportReader edition={edition} />
        )}
      </main>
    </div>
  )
}
