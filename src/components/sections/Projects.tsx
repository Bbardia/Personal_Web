import { projects } from '../../data/projects'
import styles from './Projects.module.css'

export default function Projects() {
  return (
    <section id="work" className={styles.projects}>
      <div className={styles.headerGroup}>
        <h2 className={styles.headerLabel}>MY WORK</h2>
        <div className={styles.underline} />
      </div>

      <div className={styles.cardsRow}>
        {projects.map((project) => (
          <div
            key={project.title}
            className={styles.cardWrapper}
            style={{ background: project.borderGradient }}
          >
            <div className={styles.card}>
              <img
                src={project.image}
                alt={project.title}
                className={styles.cardImage}
                loading="lazy"
              />
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{project.title}</h3>
                <p className={styles.cardDesc}>{project.description}</p>
                <div className={styles.tagsRow}>
                  {project.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={styles.tag}
                      style={{
                        color: tag.color,
                        borderColor: tag.color,
                        backgroundColor: tag.bgColor,
                      }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
