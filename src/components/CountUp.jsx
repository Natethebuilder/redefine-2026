import { useLayoutEffect, useState } from 'react'
import { useIsExporting, useSlides } from '@deckio/deck-engine'

const NUMBER = /^(\D*)(\d+)(.*)$/s

/**
 * Counts the leading number of a stat (e.g. "44%") up from zero each time its
 * slide is shown. Static in exports, for reduced motion and for small values.
 */
export default function CountUp({ value, slide, duration = 1100, delay = 320 }) {
  const { current } = useSlides()
  const exporting = useIsExporting()
  const match = NUMBER.exec(value)
  const target = match ? Number(match[2]) : 0
  const animate = Boolean(match) && target >= 10 && !exporting
  const active = current === slide
  const [shown, setShown] = useState(target)

  useLayoutEffect(() => {
    if (!animate || !active || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(target)
      return undefined
    }
    let frame = 0
    const start = performance.now() + delay
    setShown(0)
    const tick = (now) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration))
      setShown(Math.round(target * (1 - (1 - p) ** 3)))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, animate, target, duration, delay])

  if (!match) return value
  return (
    <>
      {match[1]}
      {shown}
      {match[3]}
    </>
  )
}
