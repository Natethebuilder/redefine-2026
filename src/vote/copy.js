import edits from '../data/inline-edits.json'
import { career, childhood, feedback } from '../data/content.js'

/**
 * Text edited on the slides (`npm run dev`, then click to edit) is saved to
 * inline-edits.json. Apply the same edits here so phones match the screen.
 * Like the deck, an edit made against older source text is ignored.
 */
function edited(id, source) {
  const entry = edits?.[id]
  if (!entry || typeof entry !== 'object' || typeof entry.value !== 'string') return source
  const current = String(source).replace(/[\r\n]+/g, ' ').trim()
  if (typeof entry.base === 'string' && entry.base !== current) return source
  return entry.value
}

const tidy = (text) => text.replace(/\s+/g, ' ').trim()

export const COPY = {
  childhood: {
    title: edited('childhood.title', childhood.title),
    prompt: edited('childhood.subtitle', childhood.subtitle),
    options: Object.fromEntries(
      childhood.options.map((o) => [
        o.letter,
        tidy(o.lines.map((line, k) => edited(`childhood.options.${o.id}.lines.${k}`, line)).join(' ')),
      ]),
    ),
  },
  career: {
    title: edited('career.title', career.title),
    prompt: edited('career.prompt', career.prompt),
  },
  feedback: {
    title: edited('feedback.title', feedback.title),
    prompt: edited('feedback.prompt', feedback.prompt),
    scaleLabel: edited('feedback.scale.label', 'LIKELIHOOD TO TRY'),
    textLabel: 'Your biggest roadblock',
    textPlaceholder: 'e.g. Our Grade 9 timetable is already packed',
  },
}
