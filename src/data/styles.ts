export type SelectableStyleId = 'retro' | 'nova' | 'saga'

export interface PortfolioStyle {
  id: 'classic' | SelectableStyleId | 'soon'
  name: string
  tagline: string
  status: 'current' | 'available' | 'soon'
}

export const portfolioStyles: PortfolioStyle[] = [
  {
    id: 'classic',
    name: 'Classic',
    tagline: 'The full experience — bold, dark & animated',
    status: 'current',
  },
  {
    id: 'retro',
    name: 'Retro Pixel',
    tagline: 'Minimal 8-bit terminal. Just the essentials.',
    status: 'available',
  },
  {
    id: 'nova',
    name: 'Nova 3D',
    tagline: 'A futuristic 3D journey. Scroll to fly.',
    status: 'available',
  },
  {
    id: 'saga',
    name: 'Knight’s Saga',
    tagline: 'A scroll-driven 3D quest through the work.',
    status: 'available',
  },
  {
    id: 'soon',
    name: '???',
    tagline: 'New styles in development',
    status: 'soon',
  },
]
