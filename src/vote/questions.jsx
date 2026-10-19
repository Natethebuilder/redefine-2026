import { useId, useState } from 'react'
import { cleanText } from '../live/errors.js'
import { Check, Close, Send } from './icons.jsx'

// Same colours as the slides: option letters A–D, then the 1–5 rating bars.
const LETTER_COLORS = ['#a78bfa', '#22d3ee', '#f472b6', '#34d399']
const SCALE_COLORS = ['#f472b6', '#c4b5fd', '#a78bfa', '#22d3ee', '#34d399']

const isSaved = (item) => typeof item.slot === 'number'

function ErrorText({ error }) {
  if (!error) return null
  return (
    <p className="v-error" role="alert">
      {error}
    </p>
  )
}

export function ChoiceQuestion({ poll, labels, value, error, onPick }) {
  const name = useId()
  return (
    <div className="v-poll">
      <div className="v-choices" role="radiogroup" aria-labelledby="v-q-title">
        {poll.options.map((o, i) => {
          const selected = value === o.value
          return (
            <label
              key={o.value}
              className={`v-choice${selected ? ' is-selected' : ''}`}
              style={{ '--accent': LETTER_COLORS[i % LETTER_COLORS.length], '--i': i }}
            >
              <input
                className="v-sr"
                type="radio"
                name={name}
                value={o.value}
                checked={selected}
                onChange={() => onPick(o.value)}
              />
              <span className="v-choice__letter" aria-hidden="true">
                {o.value}
              </span>
              <span className="v-choice__label">{labels?.[o.value] || o.label}</span>
              <span className="v-choice__check" aria-hidden="true">
                <Check />
              </span>
            </label>
          )
        })}
      </div>
      <ErrorText error={error} />
      <p className="v-hint">{value ? 'Saved. Tap another answer to change your vote.' : 'Tap one answer.'}</p>
    </div>
  )
}

export function ScaleQuestion({ poll, label, value, error, onPick }) {
  const name = useId()
  const labelId = useId()
  const last = poll.options.length - 1
  return (
    <div className="v-poll">
      <h2 className="v-sub" id={labelId}>
        {label}
      </h2>
      <div className="v-scale" role="radiogroup" aria-labelledby={labelId}>
        {poll.options.map((o, k) => {
          const selected = value === o.value
          const end = k === 0 ? `, ${poll.low}` : k === last ? `, ${poll.high}` : ''
          return (
            <label
              key={o.value}
              className={`v-scale__opt${selected ? ' is-selected' : ''}`}
              style={{ '--accent': SCALE_COLORS[k % SCALE_COLORS.length] }}
            >
              <input
                className="v-sr"
                type="radio"
                name={name}
                value={o.value}
                checked={selected}
                onChange={() => onPick(o.value)}
                aria-label={`${o.label}${end}`}
              />
              <span aria-hidden="true">{o.label}</span>
            </label>
          )
        })}
      </div>
      <div className="v-scale__ends" aria-hidden="true">
        <span>{poll.low}</span>
        <span>{poll.high}</span>
      </div>
      <ErrorText error={error} />
    </div>
  )
}

/** Shared add/validate logic for the free-text polls. */
function useDraft({ poll, items, error, onAdd, onError, duplicate, limit }) {
  const [draft, setDraftRaw] = useState('')
  const value = cleanText(draft)

  const setDraft = (next) => {
    setDraftRaw(next)
    if (error) onError(null)
  }

  const submit = async (e) => {
    e?.preventDefault()
    if (!value) return
    if (items.some((it) => it.value.toLowerCase() === value.toLowerCase())) {
      setDraftRaw('')
      onError(duplicate)
      return
    }
    if (items.length >= poll.max) {
      onError(limit)
      return
    }
    setDraftRaw('')
    const ok = await onAdd(value)
    if (!ok) setDraftRaw((d) => d || value)
  }

  return { draft, setDraft, ready: Boolean(value), submit }
}

export function WordsQuestion({ poll, items, error, onAdd, onRemove, onError }) {
  const inputId = useId()
  const full = items.length >= poll.max
  const { draft, setDraft, ready, submit } = useDraft({
    poll,
    items,
    error,
    onAdd,
    onError,
    duplicate: 'You have already added that one.',
    limit: `You can add up to ${poll.max}. Remove one to add another.`,
  })

  return (
    <div className="v-poll">
      {full ? (
        <p className="v-done">
          <Check />
          Thanks! That’s {poll.max}. Remove one to change your answers.
        </p>
      ) : (
        <form className="v-entry" onSubmit={submit}>
          <label className="v-sr" htmlFor={inputId}>
            Your career
          </label>
          <input
            id={inputId}
            className="v-input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={poll.maxLen}
            placeholder="e.g. Engineer"
            autoComplete="off"
            autoCapitalize="sentences"
            enterKeyHint="send"
          />
          <button type="submit" className="v-btn" disabled={!ready}>
            Add
          </button>
        </form>
      )}
      <ErrorText error={error} />
      {items.length > 0 && (
        <ul className="v-chips" aria-label="Your answers">
          {items.map((it) => (
            <li key={it.value.toLowerCase()} className={`v-chip${isSaved(it) ? '' : ' is-pending'}`}>
              <span className="v-chip__text">{it.value}</span>
              <button
                type="button"
                className="v-chip__x"
                onClick={() => onRemove(it.slot)}
                disabled={!isSaved(it)}
                aria-label={`Remove ${it.value}`}
              >
                <Close />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="v-hint">
        {items.length} of {poll.max} added. One or two words each.
      </p>
    </div>
  )
}

export function TextQuestion({ poll, label, placeholder, items, error, onAdd, onRemove, onError }) {
  const inputId = useId()
  const full = items.length >= poll.max
  const { draft, setDraft, ready, submit } = useDraft({
    poll,
    items,
    error,
    onAdd,
    onError,
    duplicate: 'You have already sent that.',
    limit: `You can send up to ${poll.max}. Remove one to send another.`,
  })
  const left = poll.maxLen - draft.length

  return (
    <div className="v-poll">
      <h2 className="v-sub">
        <label htmlFor={inputId}>{label}</label>
      </h2>
      {full ? (
        <p className="v-done">
          <Check />
          Thank you! You’ve sent {poll.max}. Remove one to send another.
        </p>
      ) : (
        <form className="v-compose" onSubmit={submit}>
          <textarea
            id={inputId}
            className="v-textarea"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) submit(e)
            }}
            maxLength={poll.maxLen}
            placeholder={placeholder}
            enterKeyHint="send"
          />
          <div className="v-compose__bar">
            <span className={`v-count${left <= 20 ? ' is-low' : ''}`}>{left <= 80 ? `${left} left` : ''}</span>
            <button type="submit" className="v-btn v-btn--sm" disabled={!ready}>
              Send
              <Send />
            </button>
          </div>
        </form>
      )}
      <ErrorText error={error} />
      {items.length > 0 && (
        <ul className="v-sent" aria-label="What you sent">
          {items.map((it) => (
            <li key={it.value.toLowerCase()} className={`v-sent__item${isSaved(it) ? '' : ' is-pending'}`}>
              <p className="v-sent__text">{it.value}</p>
              <button
                type="button"
                className="v-sent__remove"
                onClick={() => onRemove(it.slot)}
                disabled={!isSaved(it)}
                aria-label={`Remove: ${it.value}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="v-hint">Up to {poll.max}. Answers appear on the big screen without your name.</p>
    </div>
  )
}
