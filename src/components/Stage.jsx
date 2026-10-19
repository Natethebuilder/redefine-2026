import { useLayoutEffect, useRef } from 'react'

export const STAGE_WIDTH = 1280
export const STAGE_HEIGHT = 720

/**
 * Fixed 1280×720 canvas (the PowerPoint slide size in CSS px) scaled to fit
 * its slide. Scale updates on resize and when export capture resizes slides.
 */
export default function Stage({ className = '', children }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const el = ref.current
    const host = el?.parentElement
    if (!el || !host) return undefined

    const apply = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (!w || !h) return
      el.style.setProperty('--stage-scale', String(Math.min(w / STAGE_WIDTH, h / STAGE_HEIGHT)))
    }

    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`ce-stage ${className}`.trim()}>
      {children}
    </div>
  )
}
