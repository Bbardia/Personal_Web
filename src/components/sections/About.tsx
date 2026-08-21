import { Linkedin, Github } from 'lucide-react'
import styles from '../../styles/sections/about.module.css'

const aboutSkills = ['Python', 'MATLAB', 'SolidWorks', 'Abaqus', 'TwinCAT', 'LaTeX']

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
              autoPlay
              muted
              loop
              playsInline
              className={styles.photo}
            />
            <div className={styles.photoBorder} />
          </div>

          <div className={styles.textColumn}>
            <h2 className={styles.heading}>Hello, I'm Bardia</h2>

            <p className={styles.bioText}>
              Hey I'm Bardia, nice of you to visit me. Some call us job
              drifters, but I think having the skills to switch your skills is
              a <span className={styles.highlight}>SUPERPOWER</span>. Take a
              look at my CV and you'll find I started my career in a bakery!
              but do not fear as now you have a Biomedical Engineer infront of
              you!
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
      <div className={styles.decoTri1} />
      <div className={styles.decoTri2} />
      <div className={styles.decoCircle} />
      <div className={styles.decoLine} />
    </section>
  )
}
