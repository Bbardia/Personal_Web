import SagaCrest from './SagaCrest'
import styles from './SagaLoader.module.css'

/* This component stays Three-free so the classic landing page does not pull
   the 3D vendor chunk before a visitor enters the Saga. */
export default function SagaLoader() {
  return (
    <div
      className={styles.loader}
      role="status"
      aria-live="polite"
      aria-label="Loading the interactive 3D story"
    >
      <SagaCrest className={styles.crest} />
      <h1 className={styles.wordmark}>A KNIGHT’S SAGA</h1>
      <div className={styles.barTrack} aria-hidden="true">
        <div className={styles.barFill} />
      </div>
      <p className={styles.status}>FORGING THE 3D STORY</p>
    </div>
  )
}
