import { useState } from 'react'
import styles from './Navbar.module.css'

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#work' },
  { label: 'Skills', href: '#skills' },
  { label: 'Newsletter', href: '#newsletter' },
  { label: 'Style', href: '#style' },
]

interface NavbarProps {
  pulseStyleLink?: boolean
  onOpenNewsletter?: () => void
}

export default function Navbar({ pulseStyleLink = false, onOpenNewsletter }: NavbarProps) {
  const [open, setOpen] = useState(false)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setOpen(false)
    // #newsletter opens a dedicated page; App handles the route and records that
    // it was opened from the menu (so Back returns to the top of the page).
    if (href === '#newsletter') {
      onOpenNewsletter?.()
      return
    }
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={styles.navbar}>
      <span className={styles.logo}>BARDIA</span>
      <div className={`${styles.navLinks} ${open ? styles.open : ''}`}>
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={`${styles.navLink} ${
              pulseStyleLink && link.href === '#style' ? styles.navLinkPulse : ''
            }`}
            onClick={(e) => handleClick(e, link.href)}
          >
            {link.label}
          </a>
        ))}
      </div>
      <div
        className={`${styles.menuToggle} ${open ? styles.open : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
        <span />
      </div>
    </nav>
  )
}
