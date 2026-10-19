import { Editable, useInlineEdit, useInlineEditEntry } from '@deckio/deck-engine'
import CountUp from './CountUp.jsx'

/**
 * A headline number. Editable while authoring (`npm run dev`); in the built
 * site it counts up when its slide appears, using any saved inline edit.
 */
export default function Stat({ id, value, slide }) {
  const ctx = useInlineEdit()
  const entry = useInlineEditEntry(id)

  if (ctx?.isDev) return <Editable id={id}>{value}</Editable>

  // Mirror <Editable>'s auto-heal: ignore an edit made against older source text.
  const stale = typeof entry?.base === 'string' && entry.base !== value
  const shown = !stale && typeof entry?.value === 'string' ? entry.value : value
  return <CountUp value={shown} slide={slide} />
}
