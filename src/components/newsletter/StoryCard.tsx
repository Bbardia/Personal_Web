import { useState } from 'react'
import { CATEGORY_COLORS } from '../../data/bardiReport'
import type { BardiStory } from '../../data/bardiReport'
import styles from './StoryCard.module.css'

export default function StoryCard({ story }: { story: BardiStory }) {
  // remote story images are hotlinked and can be blocked; hide gracefully
  const [imageOk, setImageOk] = useState(true)
  const chip = CATEGORY_COLORS[story.category]

  return (
    <article className={styles.card}>
      {story.imageUrl && imageOk && (
        <a
          href={story.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.imageWrap}
        >
          <img
            src={story.imageUrl}
            alt={story.headline}
            loading="lazy"
            className={styles.image}
            onError={() => setImageOk(false)}
          />
        </a>
      )}
      <div className={styles.body}>
        <span className={styles.chip} style={{ background: chip.bg, color: chip.fg }}>
          {story.category}
        </span>
        <h3 className={styles.headline}>{story.headline}</h3>
        <p className={styles.summary}>{story.summary}</p>
        <div className={styles.links}>
          <a
            href={story.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.readLink}
          >
            Read on {story.sourceName} →
          </a>
          {story.videoUrl && (
            <a
              href={story.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.videoLink}
            >
              Watch ▶
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
