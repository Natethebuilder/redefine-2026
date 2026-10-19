import { Editable } from '@deckio/deck-engine'
import { Card, Frame } from '../components/primitives.jsx'
import { useTween } from './useTween.js'

const VALUES = ['1', '2', '3', '4', '5']
const COLORS = ['#f472b6', '#c4b5fd', '#a78bfa', '#22d3ee', '#34d399']
const COL_W = 76
const COL_GAP = 21
const BASE = 296
const BAR_H = 116

function Average({ value }) {
  return useTween(value, 900, 0).toFixed(1)
}

/** 1-to-5 rating results: animated average plus a histogram. */
export default function ScalePanel({ poll, hidden, x, y, w = 520, h = 366, i }) {
  const counts = poll?.counts || {}
  const n = VALUES.map((v) => Math.max(0, Number(counts[v]) || 0))
  const total = n.reduce((a, b) => a + b, 0)
  const average = total ? n.reduce((sum, c, k) => sum + c * (k + 1), 0) / total : 0
  const most = Math.max(1, ...n)
  const show = total > 0 && !hidden

  return (
    <Card x={x} y={y} w={w} h={h} tone="navy" i={i} className="ce-scale">
      <Frame x={28} y={20} w={300} h={24} size={11} bold color="var(--ce-cyan)" className="ce-label" middle>
        <Editable id="feedback.scale.label">LIKELIHOOD TO TRY</Editable>
      </Frame>

      <Frame x={28} y={48} w={300} h={78} size={54} bold color="#fff" className="ce-scale__avg">
        {show ? <Average value={average} /> : <span className="ce-scale__none">–</span>}
        <span className="ce-scale__of"> / 5</span>
      </Frame>
      <Frame x={28} y={128} w={464} h={22} size={12} color="var(--ce-mist)">
        {hidden && total
          ? `Results hidden · ${total} ${total === 1 ? 'rating' : 'ratings'} so far`
          : show
            ? `Average from ${total} ${total === 1 ? 'rating' : 'ratings'}`
            : 'No ratings yet'}
      </Frame>

      {VALUES.map((value, k) => {
        const left = 28 + k * (COL_W + COL_GAP)
        const height = show ? Math.max(4, (n[k] / most) * BAR_H) : 0
        return (
          <div key={value} className="ce-scale__col" style={{ left, top: BASE - BAR_H, width: COL_W, height: BAR_H, '--bar': COLORS[k] }}>
            <div className="ce-scale__bar" style={{ height }} />
            {show && (
              <div className="ce-scale__count" style={{ bottom: height + 6 }}>
                {n[k]}
              </div>
            )}
          </div>
        )
      })}
      {VALUES.map((value, k) => (
        <Frame key={value} x={28 + k * (COL_W + COL_GAP)} y={BASE + 6} w={COL_W} h={24} size={16} bold align="center" color="#fff">
          {value}
        </Frame>
      ))}
      <Frame x={28} y={BASE + 34} w={200} h={20} size={11} color="var(--ce-mist)">
        <Editable id="feedback.scale.low">Not likely</Editable>
      </Frame>
      <Frame x={w - 228} y={BASE + 34} w={200} h={20} size={11} color="var(--ce-mist)" align="right">
        <Editable id="feedback.scale.high">Very likely</Editable>
      </Frame>
    </Card>
  )
}
