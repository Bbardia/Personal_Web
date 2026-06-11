export interface ProjectTag {
  label: string
  color: string
  bgColor: string
}

export interface Project {
  title: string
  description: string
  image: string
  tags: ProjectTag[]
  borderGradient: string
  link?: string
}

export const projects: Project[] = [
  {
    title: 'Pose Estimation',
    description: 'Real-time pose estimation for movement analysis and rehabilitation',
    image: '/media/project-pose.png',
    tags: [
      { label: 'Python', color: 'var(--accent-red)', bgColor: '#FF3B3020' },
      { label: 'OpenCV', color: 'var(--accent-orange)', bgColor: '#FF6B3520' },
    ],
    borderGradient: 'linear-gradient(180deg, var(--accent-red), #FF6B3566, #2A2A3A)',
  },
  {
    title: 'Sensopro Coordination',
    description: 'Coordination training devices for athletic performance',
    image: '/media/project-sensopro.png',
    link: 'https://sensopro.swiss/ch-en/',
    tags: [
      { label: 'Sports', color: 'var(--accent-lime)', bgColor: '#B8FF0020' },
      { label: 'Tech', color: 'var(--accent-orange)', bgColor: '#FF6B3520' },
    ],
    borderGradient: 'linear-gradient(180deg, var(--accent-lime), #B8FF0044, #2A2A3A)',
  },
  {
    title: 'Robotic Rehabilitation',
    description: 'AI-driven robotic systems for patient rehabilitation',
    image: '/media/project-rehab.png',
    tags: [
      { label: 'Robotics', color: 'var(--accent-cyan)', bgColor: '#00D4FF20' },
      { label: 'AI', color: 'var(--accent-purple)', bgColor: '#8B5CF620' },
    ],
    borderGradient: 'linear-gradient(180deg, var(--accent-cyan), #00D4FF44, #2A2A3A)',
  },
]
