import { useEffect, useState } from 'react'
import { latestEdition } from '../data/bardiReport'
import type { BardiEdition } from '../data/bardiReport'
import { HAS_REMOTE, loadLatestEdition } from '../data/loadEdition'
import type { EditionSource } from '../data/loadEdition'

interface EditionState {
  status: 'loading' | 'ready'
  edition: BardiEdition
  source: EditionSource
}

/**
 * Returns the latest edition. Starts from the bundled sample (so consumers
 * always have something to render) and swaps to the live edition once loaded.
 * The underlying fetch is cached, so the page and teaser share one request.
 */
export function useLatestEdition(): EditionState {
  const [state, setState] = useState<EditionState>({
    status: HAS_REMOTE ? 'loading' : 'ready',
    edition: latestEdition,
    source: 'fallback',
  })

  useEffect(() => {
    let alive = true
    void loadLatestEdition().then(({ edition, source }) => {
      if (alive) setState({ status: 'ready', edition, source })
    })
    return () => {
      alive = false
    }
  }, [])

  return state
}
