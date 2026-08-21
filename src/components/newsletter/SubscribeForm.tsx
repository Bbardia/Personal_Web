import { type FormEvent, useState } from 'react'
import { subscribeToBardiReport } from '../../data/subscribe'
import styles from './NewsletterPage.module.css'

const EMAIL_RE = /^(?=.{1,254}$)[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = email.trim().toLowerCase()

    if (!EMAIL_RE.test(normalized)) {
      setState('error')
      setMessage('Enter a valid email.')
      return
    }

    setState('loading')
    setMessage('')

    try {
      const result = await subscribeToBardiReport(normalized)
      setState(result.ok ? 'success' : 'error')
      setMessage(result.message)
      if (result.ok && result.status === 'subscribed') setEmail('')
    } catch {
      setState('error')
      setMessage('Please try again.')
    }
  }

  return (
    <form className={styles.subscribeForm} onSubmit={submit} noValidate>
      <input
        aria-label="Email for Bardi Report"
        className={styles.subscribeInput}
        disabled={state === 'loading'}
        inputMode="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="email@example.com"
        type="email"
        value={email}
      />
      <button className={styles.subscribeButton} disabled={state === 'loading'} type="submit">
        {state === 'loading' ? 'Joining…' : 'Subscribe'}
      </button>
      {message ? (
        <span className={`${styles.subscribeMessage} ${styles[state]}`} role="status">
          {message}
        </span>
      ) : null}
    </form>
  )
}
