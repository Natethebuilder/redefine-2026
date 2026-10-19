import { useEffect, useRef, useState } from 'react'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Eases a number towards `target` whenever it changes (for live counts).
 * Pass `from` to animate in from a starting value when first mounted.
 */
export function useTween(target, duration = 700, from = target) {
  const [value, setValue] = useState(from)
  const current = useRef(from)

  useEffect(() => {
    const begin = current.current
    if (begin === target) return undefined
    if (reducedMotion()) {
      current.current = target
      setValue(target)
      return undefined
    }
    let frame = 0
    const start = performance.now()
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - start) / duration))
      const v = begin + (target - begin) * (1 - (1 - p) ** 3)
      current.current = v
      setValue(v)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
