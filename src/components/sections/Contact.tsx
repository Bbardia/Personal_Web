import { Download, Github, Linkedin, Mail } from 'lucide-react'
import styles from './Contact.module.css'

export default function Contact() {
  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.topDeco} />

      <div className={styles.closing}>
        <div className={styles.accentLine} />
        <h2 className={styles.title}>LET&apos;S BUILD WHAT&apos;S NEXT</h2>
        <p className={styles.subtitle}>
          Open to conversations about rehab-tech, machine learning, and human
          movement, or the next detour worth taking.
        </p>
        <div className={styles.ctaRow}>
          <a href="mailto:bardiaamiryavari@gmail.com" className={styles.ctaPrimary}>
            <Mail size={18} />
            bardiaamiryavari@gmail.com
          </a>
          <a href="/CV.pdf" download className={styles.ctaSecondary}>
            <Download size={16} />
            Download CV
          </a>
          <a
            href="https://www.linkedin.com/in/bardia-amiryavari"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaSecondary}
          >
            <Linkedin size={16} />
            LinkedIn
          </a>
          <a
            href="https://github.com/bbardia"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaSecondary}
          >
            <Github size={16} />
            GitHub
          </a>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.footerRow}>
        <span className={styles.footerLeft}>&copy; Bardia Amiryavari 2026</span>
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
    </section>
  )
}
