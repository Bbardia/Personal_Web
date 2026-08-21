import { useEffect, useState } from 'react'
import styles from './NovaLoader.module.css'

/* Hubtown-style boot screen shown while the 3D chunk downloads.
   Progress is simulated — it parks near the end until the real load finishes. */
export default function NovaLoader() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => Math.min(97, p + Math.max(1, Math.round((97 - p) / 12))))
    }, 90)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.loader}>
      <span className={styles.word}>NOVA</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${progress}%` }} />
      </div>
      <span className={styles.percent}>{progress}% — ENTERING ORBIT</span>
    </div>
  )
}
