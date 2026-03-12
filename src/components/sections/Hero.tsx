import { Download, Linkedin, Github, Mail } from 'lucide-react'
import styles from '../../styles/sections/hero.module.css'

export default function Hero() {
  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.leftColumn}>
        <div className={styles.taglineBadge}>
          <span className={styles.tagDot} />
          <span className={styles.tagText}>BIOMEDICAL ENGINEER</span>
        </div>

        <h1 className={styles.headline}>
          WELCOME<br />TO MY<br />WORLD
        </h1>

        <p className={styles.subtext}>
          Biomedical Engineer | Sensopro | Biomechanics &amp; AI
        </p>

        <div className={styles.ctaRow}>
          <a href="/CV.pdf" download className={styles.ctaButton}>
            <Download size={18} />
            Download CV
          </a>
        </div>

        <div className={styles.socialIcons}>
          <a
            href="https://www.linkedin.com/in/bardia-amiryavari"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialIcon}
          >
            <Linkedin size={18} />
          </a>
          <a
            href="https://github.com/bbardia"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.socialIcon}
          >
            <Github size={18} />
          </a>
          <a
            href="mailto:bardiaamiryavari@gmail.com"
            className={styles.socialIcon}
          >
            <Mail size={18} />
          </a>
        </div>
      </div>

      <div className={styles.rightColumn}>
        <video
          src="/media/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          className={styles.heroVideo}
        />
        <div className={`${styles.diagonalAccent} ${styles.accent1}`} />
        <div className={`${styles.diagonalAccent} ${styles.accent2}`} />
        <div className={`${styles.diagonalAccent} ${styles.accent3}`} />
      </div>
    </section>
  )
}
