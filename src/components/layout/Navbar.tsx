import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Work', href: '#work' },
  { label: 'Skills', href: '#skills' },
  { label: 'Newsletter', href: '#newsletter' },
  { label: 'Style', href: '#style' },
  { label: 'Contact', href: '#contact' },
]

// sections the scroll-spy watches — #newsletter opens a separate page, never spied
const spySections = ['about', 'work', 'skills', 'style', 'contact']

interface NavbarProps {
  pulseStyleLink?: boolean
  onOpenNewsletter?: () => void
}

export default function Navbar({ pulseStyleLink = false, onOpenNewsletter }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  // scroll-spy: the section crossing the viewport's center band marks its nav link
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    for (const id of spySections) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setOpen(false)
    // #newsletter opens a dedicated page; App handles the route and records that
    // it was opened from the menu (so Back returns to the top of the page).
    if (href === '#newsletter') {
      onOpenNewsletter?.()
      return
    }
    // no explicit behavior: inherits the reduced-motion-gated CSS scroll-behavior
    document.querySelector(href)?.scrollIntoView()
  }

  return (
    <nav className={styles.navbar}>
      <span className={styles.logo}>BARDIA</span>
      <div id="primary-nav" className={`${styles.navLinks} ${open ? styles.open : ''}`}>
        {navLinks.map((link) => {
          const isActive = link.href === `#${activeSection}`
          return (
            <a
              key={link.label}
              href={link.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''} ${
                pulseStyleLink && link.href === '#style' ? styles.navLinkPulse : ''
              }`}
              aria-current={isActive ? 'true' : undefined}
              onClick={(e) => handleClick(e, link.href)}
            >
              {link.label}
            </a>
          )
        })}
      </div>
      <button
        type="button"
        className={`${styles.menuToggle} ${open ? styles.open : ''}`}
        aria-expanded={open}
        aria-controls="primary-nav"
        aria-label="Menu"
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
        <span />
      </button>
    </nav>
  )
}
