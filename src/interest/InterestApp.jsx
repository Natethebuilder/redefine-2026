import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import logo from '../data/media/logo-white.png'
import { live } from '../live/api.js'
import { MOCK, voteUrl } from '../live/config.js'
import { cleanText } from '../live/errors.js'
import { getSignupClient } from '../live/voter.js'
import { COPY } from '../vote/copy.js'
import { Arrow, Check, Send } from '../vote/icons.jsx'
import { INTERESTS } from './interests.js'

const PRIVACY_URL = 'https://www.connectedu.world/privacy'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CONTACT = EMAIL.test(COPY.involved.email) ? COPY.involved.email : 'support@connectedu.world'
// Same limits as live_poll_interest_submit (characters, after tidying spaces).
const MAX = { name: 120, role: 120, organisation: 160, email: 254, phone: 40, message: 1000 }
const OPTION_COLORS = ['#a78bfa', '#22d3ee', '#f472b6', '#34d399']

const FIELDS = [
  { id: 'name', label: 'Full name', autoComplete: 'name', required: true },
  {
    id: 'organisation',
    label: 'School or organisation',
    autoComplete: 'organization',
    placeholder: 'e.g. Redhill School, Johannesburg',
    required: true,
  },
  { id: 'role', label: 'Your role', autoComplete: 'organization-title', placeholder: 'e.g. Principal, LO teacher, counsellor' },
  {
    id: 'email',
    label: 'Email',
    type: 'email',
    autoComplete: 'email',
    inputMode: 'email',
    autoCapitalize: 'none',
    spellCheck: false,
    required: true,
  },
  { id: 'phone', label: 'Phone or WhatsApp', type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
]

const EMPTY = { name: '', role: '', organisation: '', email: '', phone: '', message: '', consent: false, website: '' }

const length = (text) => [...cleanText(text)].length

function interestsFromUrl() {
  const raw = new URLSearchParams(window.location.search).get('i') || ''
  return INTERESTS.map((i) => i.id).filter((id) => raw.split(',').includes(id))
}

function validate(form, interests) {
  const e = {}
  if (!interests.length) e.interests = 'Choose at least one option.'
  if (!cleanText(form.name)) e.name = 'Enter your name.'
  if (!cleanText(form.organisation)) e.organisation = 'Enter your school or organisation.'
  const email = cleanText(form.email)
  if (!email) e.email = 'Enter your email address.'
  else if (!EMAIL.test(email)) e.email = 'Enter an email address like name@school.co.za.'
  for (const [id, max] of Object.entries(MAX)) {
    if (!e[id] && length(form[id]) > max) e[id] = `Please keep this under ${max} characters.`
  }
  if (!form.consent) e.consent = 'Tick the box so we can contact you.'
  return e
}

const ORDER = ['interests', 'name', 'organisation', 'role', 'email', 'phone', 'message', 'consent']

function serverProblem(code) {
  switch (code) {
    case 'offline':
    case 'timeout':
      return { text: 'We couldn’t reach our server. Check your signal and try again, or email us instead.', retry: true }
    case 'too-long':
      return { text: 'Something you typed is too long. Please shorten it and try again.' }
    case 'invalid':
      return { text: 'Please check your details and try again.' }
    case 'limit':
    case 'full':
      return { text: 'We can’t take any more sign-ups from this device. Please email us instead.' }
    default:
      return { text: 'Online sign-ups aren’t open just yet. Please email us instead and we’ll be in touch.' }
  }
}

function mailtoHref(form, interests) {
  const labels = INTERESTS.filter((i) => interests.includes(i.id)).map((i) => i.label)
  const lines = [
    'Hello ConnectEdu,',
    '',
    `I'm interested in: ${labels.join(', ') || '(not chosen)'}`,
    '',
    `Name: ${cleanText(form.name)}`,
    `School or organisation: ${cleanText(form.organisation)}`,
    `Role: ${cleanText(form.role)}`,
    `Email: ${cleanText(form.email)}`,
    `Phone or WhatsApp: ${cleanText(form.phone)}`,
    '',
    cleanText(form.message),
  ]
  const subject = 'Getting involved with ConnectEdu'
  return `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n').trim())}`
}

function FieldError({ id, error }) {
  if (!error) return null
  return (
    <p className="i-error" id={`${id}-error`}>
      {error}
    </p>
  )
}

const sentence = (text) => `${String(text).trim().replace(/[.!]+$/, '')}.`

function Thanks({ done, onAgain }) {
  const heading = useRef(null)
  useEffect(() => heading.current?.focus(), [])
  const first = done.name.split(' ')[0]
  return (
    <section className="v-card i-done" aria-labelledby="i-done-title">
      <div className="i-done__icon" aria-hidden="true">
        <Check />
      </div>
      <h1 className="v-title" id="i-done-title" tabIndex={-1} ref={heading}>
        Thank you, {first}
      </h1>
      <p className="v-prompt">
        {done.updated ? 'We’ve updated your details. ' : 'We’ve got your details. '}
        We’ll be in touch at <strong className="i-done__email">{done.email}</strong>.
      </p>
      <p className="i-done__stand">{sentence(COPY.involved.stand)}</p>
      <div className="i-actions">
        <a className="v-btn i-wide" href={voteUrl()}>
          Back to the live questions
          <Arrow />
        </a>
        <button type="button" className="v-btn v-btn--ghost i-wide" onClick={onAgain}>
          Register someone else
        </button>
      </div>
    </section>
  )
}

export default function InterestApp() {
  const [interests, setInterests] = useState(interestsFromUrl)
  const [form, setForm] = useState(EMPTY)
  const [tried, setTried] = useState(false)
  const [sending, setSending] = useState(false)
  const [problem, setProblem] = useState(null)
  const [done, setDone] = useState(null)
  const refs = useRef({})
  const alertRef = useRef(null)

  // After the first attempt, errors update as people fix them.
  const errors = useMemo(() => (tried ? validate(form, interests) : {}), [tried, form, interests])

  useEffect(() => {
    if (problem) alertRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [problem])

  const set = (id) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((f) => ({ ...f, [id]: value }))
  }

  const toggle = (id) => setInterests((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))

  const submit = async (event) => {
    event.preventDefault()
    if (sending) return
    const found = validate(form, interests)
    const firstBad = ORDER.find((id) => found[id])
    // Show the messages before moving focus, so screen readers announce them.
    flushSync(() => {
      setTried(true)
      setProblem(null)
    })
    if (firstBad) {
      refs.current[firstBad]?.focus()
      return
    }
    const finish = (updated) => {
      setDone({ name: cleanText(form.name), email: cleanText(form.email), updated })
      window.scrollTo({ top: 0 })
    }
    // Bots fill in the hidden "website" box; pretend it worked.
    if (form.website) return finish(false)

    setSending(true)
    try {
      const res = await live.interestSubmit(getSignupClient(), {
        interests,
        name: cleanText(form.name),
        role: cleanText(form.role),
        organisation: cleanText(form.organisation),
        email: cleanText(form.email),
        phone: cleanText(form.phone),
        message: cleanText(form.message),
        consent: form.consent,
      })
      finish(Boolean(res?.updated))
    } catch (err) {
      setProblem({ ...serverProblem(err?.code), id: Date.now() })
    } finally {
      setSending(false)
    }
  }

  const again = () => {
    setForm(EMPTY)
    setInterests([])
    setTried(false)
    setProblem(null)
    setDone(null)
    window.scrollTo({ top: 0 })
  }

  const describedBy = (id, extra) => [extra, errors[id] && `${id}-error`].filter(Boolean).join(' ') || undefined

  return (
    <div className="v-app">
      <header className="v-head">
        <img className="v-head__logo" src={logo} alt="ConnectEdu" width="125" height="24" />
        {MOCK && (
          <span className="v-conn v-conn--live" role="status">
            <span className="v-conn__dot" aria-hidden="true" />
            Rehearsal
          </span>
        )}
      </header>

      <main className="v-main">
        {done ? (
          <Thanks done={done} onAgain={again} />
        ) : (
          <section className="v-card" aria-labelledby="i-title">
            <p className="v-kicker">Get involved</p>
            <h1 className="v-title" id="i-title">
              Register your interest
            </h1>
            <p className="v-prompt">Tell us how you’d like to work with ConnectEdu and we’ll get in touch.</p>
            {MOCK && <p className="i-note">Rehearsal mode: sign-ups stay in this browser and are not sent to ConnectEdu.</p>}

            <form className="i-form" noValidate onSubmit={submit}>
              <fieldset
                className="i-group"
                aria-describedby={describedBy('interests', 'interests-help')}
                aria-invalid={errors.interests ? true : undefined}
              >
                <legend className="i-label">I’m interested in</legend>
                <p className="i-help" id="interests-help">
                  Choose any that apply.
                </p>
                <div className="i-options">
                  {INTERESTS.map((option, i) => {
                    const on = interests.includes(option.id)
                    return (
                      <label
                        key={option.id}
                        className={`i-option${on ? ' is-on' : ''}`}
                        style={{ '--accent': OPTION_COLORS[i % OPTION_COLORS.length], '--i': i }}
                      >
                        <input
                          className="v-sr"
                          type="checkbox"
                          name="interests"
                          value={option.id}
                          checked={on}
                          onChange={() => toggle(option.id)}
                          ref={
                            i === 0
                              ? (el) => {
                                  refs.current.interests = el
                                }
                              : undefined
                          }
                        />
                        <span className="i-option__box" aria-hidden="true">
                          <Check />
                        </span>
                        <span className="i-option__body">
                          <span className="i-option__title">{option.label}</span>
                          {option.text && <span className="i-option__text">{option.text}</span>}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <FieldError id="interests" error={errors.interests} />
              </fieldset>

              <div className="i-fields">
                {FIELDS.map(({ id, label, required, ...input }) => (
                  <div key={id} className={`i-field${errors[id] ? ' is-invalid' : ''}`}>
                    <label className="i-label" htmlFor={`i-${id}`}>
                      {label}
                      {!required && <span className="i-optional"> (optional)</span>}
                    </label>
                    <input
                      id={`i-${id}`}
                      className="v-input"
                      type={input.type || 'text'}
                      name={id}
                      value={form[id]}
                      onChange={set(id)}
                      maxLength={MAX[id] + 20}
                      aria-required={required || undefined}
                      aria-invalid={errors[id] ? true : undefined}
                      aria-describedby={describedBy(id)}
                      ref={(el) => {
                        refs.current[id] = el
                      }}
                      {...input}
                    />
                    <FieldError id={id} error={errors[id]} />
                  </div>
                ))}

                <div className={`i-field${errors.message ? ' is-invalid' : ''}`}>
                  <label className="i-label" htmlFor="i-message">
                    Anything else we should know?
                    <span className="i-optional"> (optional)</span>
                  </label>
                  <textarea
                    id="i-message"
                    className="v-input i-textarea"
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={set('message')}
                    maxLength={MAX.message}
                    placeholder="e.g. Grades, number of learners, or a good time to call"
                    aria-invalid={errors.message ? true : undefined}
                    aria-describedby={describedBy('message')}
                    ref={(el) => {
                      refs.current.message = el
                    }}
                  />
                  <FieldError id="message" error={errors.message} />
                </div>
              </div>

              <div className="i-trap" aria-hidden="true">
                <label>
                  Website
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
                </label>
              </div>

              <div className={`i-field${errors.consent ? ' is-invalid' : ''}`}>
                <label className="i-consent">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={form.consent}
                    onChange={set('consent')}
                    aria-invalid={errors.consent ? true : undefined}
                    aria-describedby={describedBy('consent')}
                    ref={(el) => {
                      refs.current.consent = el
                    }}
                  />
                  <span>
                    ConnectEdu may store these details and contact me about getting involved. See the{' '}
                    <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
                      privacy policy
                    </a>
                    .
                  </span>
                </label>
                <FieldError id="consent" error={errors.consent} />
              </div>

              {problem && (
                <div key={problem.id} className="v-error i-problem" role="alert" ref={alertRef}>
                  <p>{problem.text}</p>
                  <a className="i-problem__mail" href={mailtoHref(form, interests)}>
                    Email {CONTACT}
                  </a>
                </div>
              )}

              <button type="submit" className="v-btn i-wide i-submit" disabled={sending}>
                {sending ? 'Sending…' : problem?.retry ? 'Try again' : 'Register interest'}
                {!sending && <Send />}
              </button>
              <p className="i-small">Takes about a minute. {sentence(COPY.involved.stand)}</p>
            </form>
          </section>
        )}
      </main>

      <footer className="v-foot">
        <p>Questions? Email {CONTACT}</p>
        <p className="v-foot__event">Redefine Education 2026 · connectedu.world</p>
      </footer>
    </div>
  )
}
