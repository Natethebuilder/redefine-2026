import { useEffect, useMemo, useRef, useState } from 'react'

const FONT = 'Calibri, Carlito, "Segoe UI", system-ui, sans-serif'
const PALETTE = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#c4b5fd', '#ffffff']
const MIN_SIZE = 18
const MAX_SIZE = 64
const GAP = 6

let ctx
function textWidth(text, size) {
  ctx ||= document.createElement('canvas').getContext('2d')
  ctx.font = `700 ${size}px ${FONT}`
  return ctx.measureText(text).width
}

function hash(text) {
  let h = 2166136261
  for (let k = 0; k < text.length; k += 1) {
    h ^= text.charCodeAt(k)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Re-measures once web fonts are ready so word boxes match the rendered text. */
function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const fonts = document.fonts
    if (!fonts) {
      setReady(true)
      return undefined
    }
    Promise.allSettled([fonts.load(`700 40px ${FONT}`), fonts.ready]).then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [])
  return ready
}

const overlaps = (a, b) =>
  a.x < b.x + b.w + GAP && b.x < a.x + a.w + GAP && a.y < b.y + b.h + GAP && b.y < a.y + a.h + GAP

/**
 * Places words on an elliptical spiral from the centre, biggest first. Words
 * keep their previous spot whenever it is still free, so the cloud grows
 * calmly instead of reshuffling on every vote.
 */
function layout(words, width, height, previous) {
  if (!words.length) return []
  const top = words[0].n
  const aspect = width / height
  let best = []

  for (let scale = 1; scale > 0.5; scale *= 0.86) {
    const placed = []
    for (const word of words) {
      const size = Math.max(14, Math.round((MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.sqrt(word.n / top)) * scale))
      const w = textWidth(word.text, size) + size * 0.12
      const h = size * 1.05
      const fits = (cx, cy) => {
        const box = { x: cx - w / 2, y: cy - h / 2, w, h }
        if (box.x < 0 || box.y < 0 || box.x + w > width || box.y + h > height) return null
        return placed.some((p) => overlaps(box, p)) ? null : box
      }

      let box = null
      const before = previous.get(word.key)
      if (before) box = fits(before.cx, before.cy)
      if (!box) {
        const turn = ((hash(word.key) % 360) * Math.PI) / 180
        const limit = Math.hypot(width / aspect, height) / 2 + h
        for (let t = 0, r = 0, tries = 0; r < limit && tries < 3000; tries += 1) {
          r = 2.2 * t
          box = fits(width / 2 + r * aspect * Math.cos(t + turn), height / 2 + r * Math.sin(t + turn))
          if (box) break
          t += Math.min(0.35, 7 / Math.max(r * aspect, 1))
        }
      }
      if (box) placed.push({ ...word, ...box, size, cx: box.x + w / 2, cy: box.y + h / 2 })
    }
    if (placed.length > best.length) best = placed
    if (placed.length === words.length) break
  }
  return best
}

/**
 * Live word cloud on the stage. `words` is [{ text, n }] sorted by count.
 * Sizes scale with the square root of each word's share of the top count.
 */
export default function WordCloud({ words, width, height, className = '', style }) {
  const ready = useFontsReady()
  const previous = useRef(new Map())

  // Results arrive every couple of seconds; only re-run layout when they change.
  const signature = words.map((w) => `${w.n}\u0000${w.text}`).join('\u0001')
  const placed = useMemo(() => {
    if (!ready) return []
    const prepared = words.map((w) => ({ ...w, key: w.text.toLowerCase() }))
    return layout(prepared, width, height, previous.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, width, height, ready])

  useEffect(() => {
    previous.current = new Map(placed.map((p) => [p.key, { cx: p.cx, cy: p.cy }]))
  }, [placed])

  return (
    <div className={`ce-cloud ${className}`.trim()} style={{ width, height, ...style }}>
      {placed.map((p, rank) => (
        <span
          key={p.key}
          className="ce-word"
          style={{
            fontSize: p.size,
            color: rank === 0 ? '#ffffff' : PALETTE[hash(p.key) % PALETTE.length],
            transform: `translate(${p.cx}px, ${p.cy}px) translate(-50%, -50%)`,
          }}
          title={`${p.text}: ${p.n}`}
        >
          {p.text}
        </span>
      ))}
    </div>
  )
}
