export interface Skill {
  name: string
  icon: string
  color: string
}

export interface SkillCategory {
  label: string
  color: string
  skills: Skill[]
}

export const categories: SkillCategory[] = [
  {
    label: 'Interested Topics',
    color: 'var(--accent-red)',
    skills: [
      { name: 'Biomechanics', icon: 'activity', color: 'var(--accent-orange)' },
      { name: 'Pose Estimation', icon: 'scan', color: 'var(--accent-purple)' },
      { name: 'Computer Vision', icon: 'eye', color: 'var(--accent-cyan)' },
      { name: 'Machine Learning', icon: 'brain', color: 'var(--accent-lime)' },
      { name: 'Rehabilitation', icon: 'heart-pulse', color: 'var(--accent-cyan)' },
      { name: 'Mechatronics', icon: 'cog', color: 'var(--accent-red)' },
    ],
  },
  {
    label: 'Software',
    color: 'var(--accent-cyan)',
    skills: [
      { name: 'Python', icon: 'code', color: 'var(--accent-red)' },
      { name: 'MATLAB', icon: 'calculator', color: 'var(--accent-cyan)' },
      { name: 'SolidWorks', icon: 'box', color: 'var(--accent-lime)' },
      { name: 'Abaqus', icon: 'grid-3x3', color: 'var(--accent-orange)' },
      { name: 'React', icon: 'code', color: 'var(--accent-purple)' },
    ],
  },
  {
    label: 'DevOps',
    color: 'var(--accent-lime)',
    skills: [
      { name: 'TwinCAT', icon: 'cpu', color: 'var(--accent-purple)' },
      { name: 'Git', icon: 'git-branch', color: 'var(--accent-orange)' },
      { name: 'Docker', icon: 'container', color: 'var(--accent-cyan)' },
      { name: 'Linux', icon: 'terminal', color: 'var(--accent-lime)' },
    ],
  },
  {
    label: 'Academia',
    color: 'var(--accent-orange)',
    skills: [
      { name: 'LaTeX', icon: 'file-text', color: 'var(--accent-red)' },
      { name: 'Research', icon: 'search', color: 'var(--accent-purple)' },
      { name: 'Publications', icon: 'book-open', color: 'var(--accent-cyan)' },
      { name: 'Data Analysis', icon: 'bar-chart-3', color: 'var(--accent-lime)' },
    ],
  },
]

export const stats = [
  { value: '5+', label: 'Years Experience', color: 'var(--accent-red)' },
  { value: '10+', label: 'Projects', color: 'var(--accent-cyan)', href: 'https://github.com/bbardia' },
  { value: '3', label: 'Publications', color: 'var(--accent-lime)', href: 'https://scholar.google.com/citations?user=ZtBT1EcAAAAJ&hl=en' },
]
