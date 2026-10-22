import { useSlides } from '@deckio/deck-engine'
import { useEffect, useRef, useState } from 'react'
import QrCode from '../components/QrCode.jsx'
import { describeError, live } from './api.js'
import { LIVE_CONFIGURED, MOCK, interestDisplayUrl, interestUrl, voteDisplayUrl, voteUrl } from './config.js'
import { INVOLVED, PHONE_SCREENS, SCREENS, SCREEN_ORDER, isScreen, phoneLabel } from './polls.js'
import { getLive, lock, refreshResults, setLive, toast, unlock, useLive } from './store.js'

const isTyping = (el) => Boolean(el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)))

function csvCell(value) {
  if (value === null || value === undefined) return ''
  let text = String(value)
  // Stop spreadsheet apps from treating audience text as a formula.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function downloadCsv(name, header, rows) {
  const lines = [header, ...rows].map((cells) => cells.map(csvCell).join(','))
  const blob = new Blob([`\ufeff${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const stamp = localStamp(new Date().toISOString()).replace(/[-:]/g, '').replace(' ', '-')
  const a = document.createElement('a')
  a.href = url
  a.download = `redefine-2026-${name}-${stamp}.csv`
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const VOTE_COLUMNS = ['poll', 'voter', 'slot', 'choice', 'response', 'hidden', 'created_at', 'updated_at']

const INTEREST_LABELS = { pilot: 'Pilot', mentor: 'Mentor', partner: 'Partner', conversation: 'Conversation' }

/** Spreadsheet-friendly local time, e.g. 2026-10-23 14:05. */
function localStamp(iso) {
  const d = new Date(iso)
  if (!iso || Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function signupRows(rows) {
  return rows.map((r) => [
    localStamp(r.created_at),
    (Array.isArray(r.interests) ? r.interests : []).map((i) => INTEREST_LABELS[i] || i).join('; '),
    r.name,
    r.role,
    r.organisation,
    r.email,
    r.phone,
    r.message,
    localStamp(r.consent_at),
    localStamp(r.updated_at),
  ])
}

const SIGNUP_HEADER = [
  'Signed up',
  'Interested in',
  'Name',
  'Role',
  'School or organisation',
  'Email',
  'Phone',
  'Message',
  'Consent given',
  'Last updated',
]

/** Short "when" for the drawer: a time today, otherwise day and time. */
function when(iso) {
  const d = new Date(iso)
  if (!iso || Number.isNaN(d.getTime())) return ''
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === new Date().toDateString()) return time
  return `${d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`
}

function UnlockForm() {
  const presenter = useLive((s) => s.presenter)
  const [draft, setDraft] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    if (await unlock(draft)) {
      setDraft('')
      toast('Presenter controls unlocked')
    }
  }
  return (
    <form className="ce-drawer__section" onSubmit={submit}>
      <p className="ce-drawer__note">
        Results show for everyone. Unlock to move phones between questions, reset and moderate.
      </p>
      <div className="ce-drawer__row">
        <input
          className="ce-drawer__input"
          type="password"
          autoComplete="current-password"
          placeholder={MOCK ? 'Rehearsal key: demo' : 'Presenter key'}
          aria-label="Presenter key"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="ce-btn ce-btn--primary" type="submit" disabled={!draft.trim() || presenter === 'checking'}>
          {presenter === 'checking' ? 'Checking…' : 'Unlock'}
        </button>
      </div>
      {presenter === 'rejected' && <p className="ce-drawer__error">That key did not match.</p>}
      {presenter === 'error' && <p className="ce-drawer__error">Could not reach the voting server.</p>}
    </form>
  )
}

function Moderation({ screen, presenterKey }) {
  const revision = useLive((s) => s.revision)
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [tick, setTick] = useState(0)
  const textPolls = SCREENS[screen].polls.filter((p) => p.kind === 'words' || p.kind === 'text')

  useEffect(() => {
    if (!textPolls.length) return undefined
    const ctrl = new AbortController()
    let timer
    const load = async () => {
      try {
        const data = await live.moderation(presenterKey, screen, { signal: ctrl.signal })
        setItems(data?.items || [])
        setError(null)
      } catch (err) {
        if (err.code !== 'aborted') setError(err)
      }
      timer = setTimeout(load, 5000)
    }
    load()
    return () => {
      ctrl.abort()
      clearTimeout(timer)
    }
  }, [screen, presenterKey, tick, textPolls.length, revision])

  if (!textPolls.length) return <p className="ce-drawer__note">Multiple-choice answers have nothing to moderate.</p>
  if (error && !items) return <p className="ce-drawer__error">{describeError(error)}</p>
  if (!items) return <p className="ce-drawer__note">Loading answers…</p>
  if (!items.length) return <p className="ce-drawer__note">No written answers yet.</p>

  const toggle = async (item) => {
    try {
      await live.hide(presenterKey, item.poll, item.text, !item.hidden)
      setItems((list) => list.map((x) => (x === item ? { ...x, hidden: !x.hidden } : x)))
      refreshResults()
      setTick((t) => t + 1)
    } catch (err) {
      toast(describeError(err))
    }
  }

  return (
    <ul className="ce-mod">
      {items.map((item) => (
        <li key={`${item.poll}:${item.text}`} className={`ce-mod__item${item.hidden ? ' is-hidden' : ''}`}>
          <span className="ce-mod__text">{item.text}</span>
          {item.n > 1 && <span className="ce-mod__n">×{item.n}</span>}
          <button className="ce-btn ce-btn--small" type="button" onClick={() => toggle(item)}>
            {item.hidden ? 'Show' : 'Hide'}
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Sign-up count for the drawer. Never fetches names or contact details. */
function useSignupCount(presenterKey) {
  const revision = useLive((s) => s.revision)
  const [info, setInfo] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const ctrl = new AbortController()
    let timer
    const load = async () => {
      try {
        const data = await live.interestCount(presenterKey, { signal: ctrl.signal })
        setInfo({ count: Number(data?.count) || 0, latest: data?.latest || null })
        setError(null)
      } catch (err) {
        if (err.code !== 'aborted') setError(err)
      }
      timer = setTimeout(load, 10000)
    }
    load()
    return () => {
      ctrl.abort()
      clearTimeout(timer)
    }
  }, [presenterKey, revision])

  return { info, error }
}

function Signups({ presenterKey, signups, busy, setBusy }) {
  const { info, error } = signups
  const notInstalled = error?.code === 'not-installed'

  const exportCsv = async () => {
    setBusy(true)
    try {
      const rows = await live.interestExport(presenterKey)
      const list = Array.isArray(rows) ? rows : []
      downloadCsv('sign-ups', SIGNUP_HEADER, signupRows(list))
      toast(`Downloaded ${list.length} sign-up${list.length === 1 ? '' : 's'}`)
    } catch (err) {
      toast(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="ce-drawer__section">
      <h3 className="ce-drawer__h">Sign-ups</h3>
      {notInstalled ? (
        <p className="ce-drawer__error">
          Run the latest <code>supabase/live_polls.sql</code> in Supabase to collect sign-ups.
        </p>
      ) : error && !info ? (
        <p className="ce-drawer__error">{describeError(error)}</p>
      ) : (
        <div className="ce-signups" aria-live="polite">
          <span className="ce-signups__n">{info ? info.count : '–'}</span>
          <span className="ce-signups__label">
            {info?.count === 1 ? 'person has' : 'people have'} registered interest
            {info?.latest ? ` · latest ${when(info.latest)}` : ''}
          </span>
        </div>
      )}
      <div className="ce-drawer__row">
        <button type="button" className="ce-btn" onClick={exportCsv} disabled={busy || notInstalled || !info?.count}>
          Download sign-ups (CSV)
        </button>
        <a className="ce-btn ce-btn--ghost" href={interestUrl()} target="_blank" rel="noreferrer">
          Open the form ↗
        </a>
      </div>
      <p className="ce-drawer__note">Names and contact details stay off the projector. They are only in the CSV.</p>
    </section>
  )
}

function Controls({ slideScreen, lastSet }) {
  const presenterKey = useLive((s) => s.key)
  const hidden = useLive((s) => s.resultsHidden)
  const [active, setActive] = useState(null)
  const [tab, setTab] = useState(isScreen(slideScreen) ? slideScreen : SCREEN_ORDER[0])
  const [confirm, setConfirm] = useState(false)
  const [confirmAll, setConfirmAll] = useState(false)
  const [alsoSignups, setAlsoSignups] = useState(false)
  const [busy, setBusy] = useState(false)
  const signups = useSignupCount(presenterKey)
  const signupCount = signups.info?.count ?? 0

  useEffect(() => {
    if (isScreen(slideScreen)) setTab(slideScreen)
  }, [slideScreen])

  useEffect(() => {
    setConfirm(false)
  }, [tab])

  useEffect(() => {
    if (!confirm) return undefined
    const t = setTimeout(() => setConfirm(false), 5000)
    return () => clearTimeout(t)
  }, [confirm])

  useEffect(() => {
    if (!signupCount) setAlsoSignups(false)
  }, [signupCount])

  useEffect(() => {
    if (!confirmAll) return undefined
    const t = setTimeout(() => setConfirmAll(false), 5000)
    return () => clearTimeout(t)
  }, [confirmAll])

  useEffect(() => {
    const ctrl = new AbortController()
    let timer
    const load = async () => {
      try {
        const data = await live.status(null, { signal: ctrl.signal })
        setActive(data?.active ?? null)
      } catch {
        /* keep the last known value */
      }
      timer = setTimeout(load, 4000)
    }
    load()
    return () => {
      ctrl.abort()
      clearTimeout(timer)
    }
  }, [])

  const show = async (screen) => {
    try {
      const res = await live.setActive(presenterKey, screen)
      lastSet.current = screen
      setActive(res?.active ?? screen)
      toast(`Phones now show: ${phoneLabel(screen)}`)
    } catch (err) {
      toast(
        screen === INVOLVED && (err.code === 'invalid' || err.code === 'not-installed')
          ? 'Run the latest live_polls.sql to send phones to the sign-up invite'
          : describeError(err),
      )
    }
  }

  const reset = async () => {
    if (!confirm) {
      setConfirm(true)
      return
    }
    setBusy(true)
    try {
      const res = await live.reset(presenterKey, tab)
      toast(`Cleared ${res?.deleted ?? 0} answers for “${SCREENS[tab].label}”`)
      refreshResults()
    } catch (err) {
      toast(describeError(err))
    } finally {
      setBusy(false)
      setConfirm(false)
    }
  }

  const resetAll = async () => {
    if (!confirmAll) {
      setConfirmAll(true)
      return
    }
    setBusy(true)
    const withSignups = alsoSignups
    try {
      const res = await live.resetAll(presenterKey, withSignups)
      const n = res?.deleted ?? 0
      const m = res?.signups_deleted ?? 0
      const count = (k, word) => `${k} ${word}${k === 1 ? '' : 's'}`
      const cleared = [n > 0 && count(n, 'answer'), withSignups && m > 0 && count(m, 'sign-up')].filter(Boolean)
      const done = cleared.length
        ? `Cleared ${cleared.join(' and ')}`
        : withSignups
          ? 'Already fresh: nothing to clear'
          : 'No answers to clear'
      toast(withSignups ? done : `${done}. Sign-ups kept.`)
      setAlsoSignups(false)
      setActive(null)
      lastSet.current = null
      refreshResults()
      // Phones went back to waiting; send them to this slide's question again.
      if (slideScreen) {
        try {
          const again = await live.setActive(presenterKey, slideScreen)
          lastSet.current = slideScreen
          setActive(again?.active ?? slideScreen)
        } catch {
          /* the automatic follow will try again on the next live slide */
        }
      }
    } catch (err) {
      toast(err.code === 'not-installed' ? 'Run the latest live_polls.sql in Supabase first' : describeError(err))
    } finally {
      setBusy(false)
      setConfirmAll(false)
    }
  }

  const exportCsv = async () => {
    setBusy(true)
    try {
      const rows = await live.exportVotes(presenterKey)
      const list = Array.isArray(rows) ? rows : []
      downloadCsv('votes', VOTE_COLUMNS, list.map((row) => VOTE_COLUMNS.map((c) => row[c])))
    } catch (err) {
      toast(describeError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="ce-drawer__section">
        <h3 className="ce-drawer__h">Phones are showing</h3>
        <div className="ce-seg ce-seg--grid" role="group" aria-label="Screen shown on phones">
          {PHONE_SCREENS.map((id) => (
            <button key={id} type="button" className={`ce-seg__btn${active === id ? ' is-on' : ''}`} onClick={() => show(id)}>
              {phoneLabel(id)}
            </button>
          ))}
        </div>
        <p className="ce-drawer__note">Phones follow automatically when you reach a poll slide or “Three ways to get involved”.</p>
      </section>

      <section className="ce-drawer__section">
        <h3 className="ce-drawer__h">On screen</h3>
        <div className="ce-drawer__row">
          <button type="button" className={`ce-btn${hidden ? ' is-on' : ''}`} onClick={() => setLive({ resultsHidden: !hidden })}>
            {hidden ? 'Show results' : 'Hide results'} <kbd>H</kbd>
          </button>
          <button type="button" className="ce-btn" onClick={() => setLive({ qrOpen: true, panelOpen: false })}>
            Big QR code <kbd>Q</kbd>
          </button>
        </div>
      </section>

      <section className="ce-drawer__section">
        <h3 className="ce-drawer__h">Answers</h3>
        <div className="ce-seg" role="tablist" aria-label="Question">
          {SCREEN_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`ce-seg__btn${tab === id ? ' is-on' : ''}`}
              onClick={() => setTab(id)}
            >
              {SCREENS[id].label}
            </button>
          ))}
        </div>
        <Moderation screen={tab} presenterKey={presenterKey} />
        <div className="ce-drawer__row">
          <button type="button" className={`ce-btn ce-btn--danger${confirm ? ' is-on' : ''}`} onClick={reset} disabled={busy}>
            {confirm ? 'Click again to delete all answers' : 'Reset this question'}
          </button>
          <button type="button" className="ce-btn" onClick={exportCsv} disabled={busy}>
            Download answers (CSV)
          </button>
        </div>
      </section>

      <Signups presenterKey={presenterKey} signups={signups} busy={busy} setBusy={setBusy} />

      <section className="ce-drawer__section">
        <h3 className="ce-drawer__h">Start fresh</h3>
        <p className="ce-drawer__note">
          Deletes every answer to every question, so you can test and then start the talk from zero. Sign-ups are kept
          unless you tick the box.
        </p>
        <label className={`ce-check${signupCount ? '' : ' is-disabled'}`}>
          <input
            type="checkbox"
            checked={alsoSignups}
            disabled={!signupCount}
            onChange={(e) => {
              setAlsoSignups(e.target.checked)
              setConfirmAll(false)
            }}
          />
          {signupCount
            ? `Also delete ${signupCount === 1 ? 'the 1 sign-up' : `all ${signupCount} sign-ups`}`
            : 'Also delete sign-ups (none yet)'}
        </label>
        <div className="ce-drawer__row">
          <button
            type="button"
            className={`ce-btn ce-btn--danger${confirmAll ? ' is-on' : ''}`}
            onClick={resetAll}
            disabled={busy}
          >
            {confirmAll
              ? alsoSignups
                ? 'Click again to delete answers and sign-ups'
                : 'Click again to delete every answer'
              : alsoSignups
                ? 'Clear answers and sign-ups'
                : 'Clear all answers'}
          </button>
        </div>
      </section>

      <section className="ce-drawer__section">
        <div className="ce-drawer__row">
          <button
            type="button"
            className="ce-btn ce-btn--ghost"
            onClick={() => {
              lock()
              toast('Presenter key forgotten on this device')
            }}
          >
            Lock
          </button>
        </div>
      </section>
    </>
  )
}

function Drawer({ slideScreen, lastSet }) {
  const presenter = useLive((s) => s.presenter)
  const close = () => setLive({ panelOpen: false })
  return (
    <aside className="ce-drawer" aria-label="Live voting controls">
      <header className="ce-drawer__head">
        <div>
          <div className="ce-drawer__title">Live voting</div>
          <div className="ce-drawer__mode">
            {!LIVE_CONFIGURED ? 'Not configured' : MOCK ? 'Rehearsal mode · votes stay in this browser' : voteDisplayUrl()}
          </div>
        </div>
        <button type="button" className="ce-drawer__close" onClick={close} aria-label="Close live controls">
          ×
        </button>
      </header>
      {!LIVE_CONFIGURED ? (
        <section className="ce-drawer__section">
          <p className="ce-drawer__note">
            Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> when building, or add{' '}
            <code>?mock</code> to the address to rehearse without a server.
          </p>
        </section>
      ) : presenter === 'unlocked' ? (
        <Controls slideScreen={slideScreen} lastSet={lastSet} />
      ) : (
        <UnlockForm />
      )}
      <footer className="ce-drawer__keys">
        <span><kbd>P</kbd> panel</span>
        <span><kbd>Q</kbd> QR code</span>
        <span><kbd>H</kbd> hide results</span>
      </footer>
    </aside>
  )
}

/**
 * Presenter-side live voting UI that sits above the deck: keyboard shortcuts,
 * the full-screen QR code, the presenter drawer and toasts. When unlocked it
 * also moves every phone to the poll on the current slide.
 */
export default function LiveLayer({ slides }) {
  const { current } = useSlides()
  const slideScreen = slides[current]?.liveScreen || null
  const presenter = useLive((s) => s.presenter)
  const presenterKey = useLive((s) => s.key)
  const qrOpen = useLive((s) => s.qrOpen)
  const panelOpen = useLive((s) => s.panelOpen)
  const message = useLive((s) => s.toast)
  const lastSet = useRef(null)
  const [awake, setAwake] = useState(false)
  const qrScreen = slideScreen || null

  useEffect(() => {
    if (LIVE_CONFIGURED && getLive().key) {
      unlock().then((ok) => ok && toast('Presenter controls unlocked'))
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      const key = e.key.toLowerCase()
      if (key === 'q') {
        setLive((s) => ({ qrOpen: !s.qrOpen }))
      } else if (key === 'h') {
        const next = !getLive().resultsHidden
        setLive({ resultsHidden: next })
        toast(next ? 'Results hidden' : 'Results showing')
      } else if (key === 'p') {
        setLive((s) => ({ panelOpen: !s.panelOpen }))
      } else if (key === 'escape') {
        const s = getLive()
        if (s.qrOpen) setLive({ qrOpen: false })
        else if (s.panelOpen) setLive({ panelOpen: false })
        else return
      } else {
        return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Clicking a control leaves focus on it, and the deck ignores arrow keys
  // while a button is focused. Hand focus back so the clicker keeps working.
  useEffect(() => {
    const onClick = (e) => {
      if (e.detail === 0) return
      const button = e.target.closest?.('.ce-live-ui button')
      if (button) setTimeout(() => button.blur(), 0)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // Show the small launcher only while the mouse is moving, like the deck's nav.
  useEffect(() => {
    let timer
    const wake = () => {
      setAwake(true)
      clearTimeout(timer)
      timer = setTimeout(() => setAwake(false), 2200)
    }
    window.addEventListener('mousemove', wake)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mousemove', wake)
    }
  }, [])

  useEffect(() => {
    if (presenter !== 'unlocked') {
      lastSet.current = null
      return
    }
    if (!slideScreen || lastSet.current === slideScreen) return
    lastSet.current = slideScreen
    live.setActive(presenterKey, slideScreen).catch((err) => {
      lastSet.current = null
      // Older database without the invite: phones simply stay where they are.
      if (slideScreen === INVOLVED && (err.code === 'invalid' || err.code === 'not-installed')) {
        console.warn('Phones cannot show the get-involved invite until the latest live_polls.sql is installed.')
        return
      }
      toast(describeError(err))
    })
  }, [presenter, presenterKey, slideScreen])

  const signup = slideScreen === INVOLVED

  return (
    <div className="ce-live-ui ce-live-only">
      {qrOpen && (
        <div
          className="ce-qr-overlay"
          role="dialog"
          aria-label={signup ? 'Scan to get involved' : 'Scan to vote'}
          onClick={() => setLive({ qrOpen: false })}
        >
          <div className="ce-qr-overlay__card">
            {signup ? (
              <>
                <QrCode className="ce-qr-overlay__code" value={interestUrl()} label="QR code: open the get-involved page" />
                <div className="ce-qr-overlay__title">Scan to get involved</div>
                <div className="ce-qr-overlay__url">{interestDisplayUrl()}</div>
              </>
            ) : (
              <>
                <QrCode className="ce-qr-overlay__code" value={voteUrl(qrScreen)} label="QR code: open the voting page" />
                <div className="ce-qr-overlay__title">Scan to vote</div>
                <div className="ce-qr-overlay__url">{voteDisplayUrl()}</div>
              </>
            )}
          </div>
        </div>
      )}

      {panelOpen && <Drawer slideScreen={slideScreen} lastSet={lastSet} />}

      {!panelOpen && (
        <button
          type="button"
          className={`ce-launcher${awake ? ' is-awake' : ''}${presenter === 'unlocked' ? ' is-unlocked' : ''}`}
          onClick={() => setLive({ panelOpen: true })}
          title="Live voting controls (P)"
        >
          <span className="ce-launcher__dot" aria-hidden="true" />
          Live <kbd>P</kbd>
        </button>
      )}

      {message && (
        <div key={message.id} className="ce-toast" role="status">
          {message.message}
        </div>
      )}
    </div>
  )
}
