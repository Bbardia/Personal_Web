import styles from './Contact.module.css'

export default function Contact() {
  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.topDeco} />

      <div className={styles.divider} />

      <div className={styles.footerRow}>
        <span className={styles.footerLeft}>&copy; Bardia Amiryavari 2025</span>
        <div className={styles.footerCenter}>
          <span className={styles.footDot} style={{ background: 'var(--accent-red)' }} />
          <span className={styles.footLogo}>BARDIA</span>
          <span className={styles.footDot} style={{ background: 'var(--accent-cyan)' }} />
        </div>
        <span className={styles.footerRight}>Biomedical Engineer @ Sensopro</span>
      </div>

      <div className={styles.bottomDeco} />

      {/* Decorative elements */}
      <div className={styles.decoLine1} />
      <div className={styles.decoLine2} />
      <div className={styles.decoCircle} />
    </section>
  )
}
