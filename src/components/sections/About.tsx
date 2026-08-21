import { Linkedin, Github } from 'lucide-react'
import styles from './About.module.css'

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const aboutSkills = ['Python', 'React', 'Electron', 'DevOps', 'MATLAB', 'SolidWorks']

export default function About() {
  return (
    <section id="about" className={styles.about}>
      <div className={styles.contentWrapper}>
        <div className={styles.labelRow}>
          <span className={styles.accentLine} />
          <span className={styles.labelText}>ABOUT ME</span>
        </div>

        <div className={styles.aboutContent}>
          <div className={styles.photoColumn}>
            <video
              src="/media/about.mp4"
              autoPlay={!REDUCED_MOTION}
              muted
              loop
              playsInline
              preload={REDUCED_MOTION ? 'metadata' : 'auto'}
              className={styles.photo}
            />
            <div className={styles.photoBorder} />
          </div>

          <div className={styles.textColumn}>
            <h2 className={styles.heading}>Hello, I'm Bardia</h2>

            <p className={styles.bioText}>
              I started my career behind a bakery counter; today I engineer
              ML-powered rehabilitation systems at Sensopro. Some call that job
              drifting — I call knowing how to relearn a{' '}
              <span className={styles.highlight}>SUPERPOWER</span>. Every detour
              added a tool, and the CV reads like the proof.
            </p>

            <span className={styles.skillsLabel}>SKILLS &amp; TOOLS</span>

            <div className={styles.skillsRow}>
              {aboutSkills.map((skill) => (
                <span key={skill} className={styles.skillTag}>
                  {skill}
                </span>
              ))}
            </div>

            <div className={styles.socialRow}>
              <a
                href="https://www.linkedin.com/in/bardia-amiryavari"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
              >
                <Linkedin size={18} />
                LinkedIn
              </a>
              <a
                href="https://github.com/bbardia"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
              >
                <Github size={18} />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className={styles.decoCircle} />
      <div className={styles.decoLine} />
    </section>
  )
}
