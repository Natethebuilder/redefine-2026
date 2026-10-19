import { useLayoutEffect, useRef, useState } from 'react'
import { Editable } from '@deckio/deck-engine'
import { Card, Frame } from '../components/primitives.jsx'
import { maskProfanity } from './profanity.js'

const ACCENTS = ['#a78bfa', '#22d3ee', '#f472b6', '#34d399', '#c4b5fd']

/** Newest-first wall of short free-text answers. */
export default function ResponseWall({ id, label, poll, hidden, x, y, w = 624, h = 366, i, empty, hint }) {
  const responses = poll?.responses || []
  const total = poll?.entries || 0
  const show = responses.length > 0 && !hidden
  const listRef = useRef(null)
  const [overflowing, setOverflowing] = useState(false)
  const viewH = h - 72

  // Fade the bottom edge only when older answers actually run off the card.
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) {
      setOverflowing(false)
      return
    }
    const check = () => setOverflowing(list.offsetHeight > viewH + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(list)
    return () => observer.disconnect()
  }, [show, viewH])

  return (
    <Card x={x} y={y} w={w} h={h} tone="navy" i={i} className="ce-wall">
      <Frame x={28} y={20} w={360} h={24} size={11} bold color="var(--ce-cyan)" className="ce-label" middle>
        <Editable id={id}>{label}</Editable>
      </Frame>
      <Frame x={w - 228} y={20} w={200} h={24} size={11} color="var(--ce-mist)" align="right" middle>
        {total ? `${total} ${total === 1 ? 'response' : 'responses'}` : ''}
      </Frame>

      {show ? (
        <div
          className={overflowing ? 'ce-wall__view is-overflowing' : 'ce-wall__view'}
          style={{ left: 28, top: 56, width: w - 56, height: viewH }}
        >
          <ul ref={listRef} className="ce-wall__grid">
            {responses.map((r) => (
              <li key={r.id} className="ce-note" style={{ '--note': ACCENTS[r.id % ACCENTS.length] }}>
                <span className="ce-note__text">{maskProfanity(r.text)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="ce-empty" style={{ top: 44 }}>
          <div className="ce-empty__title">{hidden && total ? 'Responses hidden' : empty}</div>
          <div className="ce-empty__hint">{hidden && total ? `${total} so far` : hint}</div>
        </div>
      )}
    </Card>
  )
}
