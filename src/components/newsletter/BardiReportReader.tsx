import { formatEditionDate } from '../../data/bardiReport'
import type { BardiEdition } from '../../data/bardiReport'
import StoryCard from './StoryCard'
import styles from './BardiReportReader.module.css'

/**
 * Presentational reproduction of the Bardi Report email body, rendered in its
 * authentic "paper" palette. Pure — takes an edition, renders it. No routing,
 * no data fetching, so it can be reused (e.g. an archive view) later.
 */
export default function BardiReportReader({ edition }: { edition: BardiEdition }) {
  const prettyDate = formatEditionDate(edition.date)

  return (
    <article className={styles.sheet}>
      <div className={styles.heroBand}>
        <h1 className={styles.wordmark}>
          Bardi<span className={styles.accent}>.</span>Report
        </h1>
        <p className={styles.dateLine}>
          {prettyDate} · {edition.stories.length}-story digest
        </p>
        <div className={styles.rule} />
      </div>

      <div className={styles.container}>
        <div className={styles.quoteBanner}>
          <span className={styles.quoteLabel}>Today's mantra</span>
          <p className={styles.quoteText}>&ldquo;{edition.quote.text}&rdquo;</p>
          <p className={styles.quoteAuthor}>— {edition.quote.author}</p>
        </div>

        <div className={styles.intro}>{edition.intro}</div>

        {edition.stories.map((story) => (
          <StoryCard key={story.headline} story={story} />
        ))}

        <div className={styles.outro}>{edition.outro}</div>

        <p className={styles.footer}>
          <strong>Bardi.Report</strong> · curated Tue &amp; Fri · {prettyDate}
          <br />
          Reply to the email to give feedback.
        </p>
      </div>
    </article>
  )
}
