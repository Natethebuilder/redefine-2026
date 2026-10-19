import { useEffect, useRef, useState } from 'react'
import { live } from './api.js'
import { LIVE_CONFIGURED } from './config.js'
import { useLive } from './store.js'

const INTERVAL = 1800
const MAX_BACKOFF = 12000

/**
 * Polls results for one live screen while `active` is true (its slide is on
 * screen). Results persist when the slide is left, so returning is instant.
 *
 * status: idle | loading | live | offline | unconfigured
 */
export function useLiveResults(screen, active) {
  const revision = useLive((s) => s.revision)
  const [state, setState] = useState(() => ({
    data: null,
    status: LIVE_CONFIGURED ? 'idle' : 'unconfigured',
    error: null,
  }))
  const kick = useRef(null)

  useEffect(() => {
    if (!active || !LIVE_CONFIGURED) return undefined
    let stopped = false
    let timer
    let ctrl
    let failures = 0

    const tick = async () => {
      clearTimeout(timer)
      if (stopped) return
      if (document.hidden) {
        timer = setTimeout(tick, INTERVAL)
        return
      }
      ctrl?.abort()
      ctrl = new AbortController()
      setState((s) => (s.data ? s : { ...s, status: 'loading' }))
      try {
        const data = await live.results(screen, { signal: ctrl.signal })
        if (stopped) return
        failures = 0
        setState({ data, status: 'live', error: null })
      } catch (error) {
        if (stopped || error.code === 'aborted') return
        failures += 1
        setState((s) => ({ ...s, status: 'offline', error }))
      }
      if (!stopped) {
        const wait = failures ? Math.min(MAX_BACKOFF, INTERVAL * 2 ** failures) : INTERVAL
        timer = setTimeout(tick, wait + Math.random() * 250)
      }
    }

    kick.current = tick
    tick()
    return () => {
      stopped = true
      kick.current = null
      clearTimeout(timer)
      ctrl?.abort()
    }
  }, [screen, active])

  useEffect(() => {
    if (revision) kick.current?.()
  }, [revision])

  return state
}

/** Percentages that add up to exactly 100 (largest-remainder rounding). */
export function sharesOf(counts, keys) {
  const values = keys.map((k) => Math.max(0, Number(counts?.[k]) || 0))
  const total = values.reduce((a, b) => a + b, 0)
  if (!total) return { total, pct: keys.map(() => 0), share: keys.map(() => 0) }
  const raw = values.map((v) => (v * 100) / total)
  const pct = raw.map(Math.floor)
  let left = 100 - pct.reduce((a, b) => a + b, 0)
  raw
    .map((r, i) => [r - Math.floor(r), i])
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (left > 0 && values[i] > 0) {
        pct[i] += 1
        left -= 1
      }
    })
  return { total, pct, share: values.map((v) => v / total) }
}
