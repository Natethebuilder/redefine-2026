import { useCallback, useEffect, useRef, useState } from 'react'
import logo from '../data/media/logo-white.png'
import { describeError, live } from '../live/api.js'
import { LIVE_CONFIGURED, MOCK } from '../live/config.js'
import { SCREENS, SCREEN_ORDER, isScreen } from '../live/polls.js'
import { COPY } from './copy.js'
import { Arrow, Check } from './icons.jsx'
import { ChoiceQuestion, ScaleQuestion, TextQuestion, WordsQuestion } from './questions.jsx'

const VOTER_KEY = 'ce-voter'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const POLL_EVERY = 3000
const STEP_LABELS = { childhood: 'Who helped?', career: 'Your career', feedback: 'Feedback' }
const MAX_BACKOFF = 15000

function makeUuid() {
  if (crypto.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Anonymous, per-browser id so people can change their answers. */
function getVoter() {
  try {
    const saved = localStorage.getItem(VOTER_KEY)
    if (saved && UUID.test(saved)) return saved
    const id = makeUuid()
    localStorage.setItem(VOTER_KEY, id)
    return id
  } catch {
    return makeUuid()
  }
}

function screenFromUrl() {
  const p = new URLSearchParams(window.location.search).get('p')
  return p && isScreen(p) ? p : null
}

function rememberScreen(id) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('p', id)
  else url.searchParams.delete('p')
  const href = url.href.replace('mock=&', 'mock&').replace(/mock=$/, 'mock')
  window.history.replaceState(null, '', href)
}

/** True while someone has an unsent draft in a text box. */
function isDrafting() {
  const el = document.activeElement
  return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.value.trim())
}

function normaliseMine(raw) {
  const out = {}
  for (const screen of Object.values(SCREENS)) {
    for (const poll of screen.polls) {
      const list = Array.isArray(raw?.[poll.id]) ? raw[poll.id] : []
      out[poll.id] = list
        .filter((v) => v && v.value != null)
        .map((v) => ({ slot: Number(v.slot), value: String(v.value) }))
    }
  }
  return out
}

const answered = (screen, mine) => SCREENS[screen].polls.some((poll) => mine[poll.id]?.length)

export default function VoteApp() {
  const [voter] = useState(getVoter)
  const [screen, setScreen] = useState(screenFromUrl)
  const [active, setActive] = useState(undefined)
  const [mine, setMine] = useState({})
  const [conn, setConn] = useState(LIVE_CONFIGURED ? 'connecting' : 'unconfigured')
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [loaded, setLoaded] = useState(false)

  const seq = useRef(0)
  const pending = useRef({})
  const confirmed = useRef({})
  const queues = useRef({})
  const kick = useRef(null)
  const lastActive = useRef(undefined)

  const go = useCallback((id) => {
    setScreen(id)
    rememberScreen(id)
    setErrors({})
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
  }, [])

  const say = useCallback((text) => setToast({ text, id: Date.now() }), [])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  // Follow the presenter: poll which screen is live, plus this phone's own answers.
  useEffect(() => {
    if (!LIVE_CONFIGURED) return undefined
    let stopped = false
    let timer
    let ctrl
    let failures = 0

    const tick = async () => {
      clearTimeout(timer)
      if (stopped || document.hidden) return
      ctrl?.abort()
      ctrl = new AbortController()
      const startSeq = seq.current
      try {
        const data = await live.status(voter, { signal: ctrl.signal })
        if (stopped) return
        failures = 0
        setConn('live')
        const idle = Object.values(pending.current).every((n) => !n)
        if (idle && seq.current === startSeq) {
          const next = normaliseMine(data?.mine)
          confirmed.current = next
          setMine(next)
        }
        setActive(data?.active && isScreen(data.active) ? data.active : null)
        setLoaded(true)
      } catch (err) {
        if (stopped || err.code === 'aborted') return
        failures += 1
        setConn(err.code === 'not-installed' || err.code === 'not-configured' ? err.code : 'offline')
        setLoaded(true)
      }
      if (!stopped) {
        const wait = failures ? Math.min(MAX_BACKOFF, POLL_EVERY * 2 ** failures) : POLL_EVERY
        timer = setTimeout(tick, wait + Math.random() * 1200)
      }
    }

    const wake = () => {
      if (!document.hidden) tick()
    }
    kick.current = tick
    document.addEventListener('visibilitychange', wake)
    window.addEventListener('online', wake)
    tick()
    return () => {
      stopped = true
      kick.current = null
      clearTimeout(timer)
      ctrl?.abort()
      document.removeEventListener('visibilitychange', wake)
      window.removeEventListener('online', wake)
    }
  }, [voter])

  // When the presenter opens a new question, jump to it (unless mid-sentence).
  useEffect(() => {
    if (active === undefined) return
    const previous = lastActive.current
    lastActive.current = active
    if (!active || active === previous || active === screen) return
    if (!isDrafting()) go(active)
  }, [active, screen, go])

  /**
   * Runs one change for a poll. Changes to the same poll are queued so they
   * reach the server in order; the screen shows the optimistic result until
   * the last one settles, then the server's version.
   */
  const mutate = useCallback(
    (pollId, optimistic, call, okText) => {
      setErrors((e) => ({ ...e, [pollId]: null }))
      setMine((m) => ({ ...m, [pollId]: optimistic(m[pollId] || []) }))
      pending.current[pollId] = (pending.current[pollId] || 0) + 1
      seq.current += 1

      const task = async () => {
        try {
          const res = await call()
          if (Array.isArray(res?.mine)) confirmed.current[pollId] = normaliseMine({ [pollId]: res.mine })[pollId]
          setConn('live')
          if (okText) say(okText)
          return true
        } catch (err) {
          setErrors((e) => ({ ...e, [pollId]: describeError(err) }))
          if (err.code === 'offline' || err.code === 'timeout') setConn('offline')
          return false
        } finally {
          pending.current[pollId] -= 1
          seq.current += 1
          if (!pending.current[pollId]) setMine((m) => ({ ...m, [pollId]: confirmed.current[pollId] || [] }))
        }
      }
      const run = (queues.current[pollId] || Promise.resolve()).then(task)
      queues.current[pollId] = run
      return run
    },
    [say],
  )

  const pick = useCallback(
    (pollId, value, savedText) => {
      const current = mine[pollId]?.[0]?.value
      if (current === value) return
      mutate(pollId, () => [{ slot: 0, value }], () => live.submit(pollId, voter, value), current ? `Changed to ${value}` : savedText)
    },
    [mine, mutate, voter],
  )

  const add = useCallback(
    (pollId, value, okText) =>
      mutate(
        pollId,
        (list) => [...list, { slot: `new-${Date.now()}`, value, pending: true }],
        () => live.submit(pollId, voter, value),
        okText,
      ),
    [mutate, voter],
  )

  const remove = useCallback(
    (pollId, slot) => {
      if (typeof slot !== 'number') return
      mutate(pollId, (list) => list.filter((v) => v.slot !== slot), () => live.retract(pollId, voter, slot), 'Removed')
    },
    [mutate, voter],
  )

  const setError = useCallback((pollId, message) => setErrors((e) => ({ ...e, [pollId]: message })), [])

  const blocked = conn === 'unconfigured' || conn === 'not-installed' || conn === 'not-configured'
  // Point people to the live question, unless they have already answered it.
  const following = active && screen && active !== screen && !answered(active, mine) ? active : null
  const index = screen ? SCREEN_ORDER.indexOf(screen) : -1

  return (
    <div className="v-app">
      <header className="v-head">
        <img className="v-head__logo" src={logo} alt="ConnectEdu" width="125" height="24" />
        <span className={`v-conn v-conn--${blocked ? 'off' : conn}`} role="status">
          <span className="v-conn__dot" aria-hidden="true" />
          {blocked ? 'Offline' : conn === 'live' ? (MOCK ? 'Rehearsal' : 'Live') : conn === 'offline' ? 'Reconnecting…' : 'Connecting…'}
        </span>
      </header>

      {blocked ? (
        <main className="v-main">
          <section className="v-card v-card--notice">
            <h1 className="v-title">Voting is not open yet</h1>
            <p className="v-prompt">
              {conn === 'not-installed'
                ? 'The voting database has not been set up yet.'
                : 'Live voting has not been switched on for this site yet.'}{' '}
              Please let the presenter know.
            </p>
          </section>
        </main>
      ) : (
        <>
          <nav className="v-steps" aria-label="Questions">
            {SCREEN_ORDER.map((id, k) => {
              const done = answered(id, mine)
              return (
                <button
                  key={id}
                  type="button"
                  className={`v-step${id === screen ? ' is-current' : ''}${done ? ' is-done' : ''}${id === active ? ' is-live' : ''}`}
                  aria-current={id === screen ? 'step' : undefined}
                  onClick={() => go(id)}
                >
                  <span className="v-step__n" aria-hidden="true">
                    {done ? <Check /> : k + 1}
                  </span>
                  <span className="v-step__label">{STEP_LABELS[id] || SCREENS[id].label}</span>
                  {id === active && (
                    <>
                      <span className="v-step__live" aria-hidden="true" />
                      <span className="v-sr">, live now</span>
                    </>
                  )}
                </button>
              )
            })}
          </nav>

          {following && (
            <button type="button" className="v-follow" onClick={() => go(following)}>
              <span className="v-follow__dot" aria-hidden="true" />
              <span>
                Live now: <strong>{SCREENS[following].label}</strong>
              </span>
              <span className="v-follow__go" aria-hidden="true">
                Go
                <Arrow />
              </span>
            </button>
          )}

          <main className="v-main">
            {screen ? (
              <section key={screen} className="v-card" aria-labelledby="v-q-title">
                <p className="v-kicker">
                  Question {index + 1} of {SCREEN_ORDER.length}
                </p>
                <h1 className="v-title" id="v-q-title">
                  {COPY[screen].title}
                </h1>
                <p className="v-prompt">{COPY[screen].prompt}</p>

                {screen === 'childhood' && (
                  <ChoiceQuestion
                    poll={SCREENS.childhood.polls[0]}
                    labels={COPY.childhood.options}
                    value={mine.childhood?.[0]?.value}
                    error={errors.childhood}
                    onPick={(v) => pick('childhood', v, 'Vote saved')}
                  />
                )}
                {screen === 'career' && (
                  <WordsQuestion
                    poll={SCREENS.career.polls[0]}
                    items={mine.career || []}
                    error={errors.career}
                    onAdd={(v) => add('career', v, 'Added')}
                    onRemove={(slot) => remove('career', slot)}
                    onError={(m) => setError('career', m)}
                  />
                )}
                {screen === 'feedback' && (
                  <>
                    <ScaleQuestion
                      poll={SCREENS.feedback.polls[0]}
                      label={COPY.feedback.scaleLabel}
                      value={mine.likelihood?.[0]?.value}
                      error={errors.likelihood}
                      onPick={(v) => pick('likelihood', v, 'Rating saved')}
                    />
                    <TextQuestion
                      poll={SCREENS.feedback.polls[1]}
                      label={COPY.feedback.textLabel}
                      placeholder={COPY.feedback.textPlaceholder}
                      items={mine.roadblock || []}
                      error={errors.roadblock}
                      onAdd={(v) => add('roadblock', v, 'Sent. Thank you!')}
                      onRemove={(slot) => remove('roadblock', slot)}
                      onError={(m) => setError('roadblock', m)}
                    />
                  </>
                )}
              </section>
            ) : (
              <section className="v-card v-card--wait">
                <div className="v-pulse" aria-hidden="true">
                  <span />
                </div>
                <h1 className="v-title">You’re in</h1>
                <p className="v-prompt">
                  {loaded
                    ? 'Questions appear here as soon as the presenter opens them. Keep this page open.'
                    : 'Connecting to the session…'}
                </p>
              </section>
            )}
          </main>
        </>
      )}

      <footer className="v-foot">
        <p>Anonymous. No names or sign-in, just your answers.</p>
        <p className="v-foot__event">Redefine Education 2026 · connectedu.world</p>
      </footer>

      <div className="v-toast-slot" aria-live="polite">
        {toast && (
          <div key={toast.id} className="v-toast">
            <Check />
            {toast.text}
          </div>
        )}
      </div>
    </div>
  )
}
