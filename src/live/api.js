import { EVENT, LIVE_CONFIGURED, MOCK, MOCK_SEED, SUPABASE_KEY, SUPABASE_URL } from './config.js'
import { LiveError } from './errors.js'

export { LiveError }

const SERVER_CODES = new Set(['unknown-poll', 'invalid', 'limit', 'full', 'forbidden', 'too-long'])

let mockBackend
function getMock() {
  mockBackend ||= import('./mock.js').then((m) => m.createMockBackend({ seed: MOCK_SEED }))
  return mockBackend
}

function headers() {
  const h = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Accept: 'application/json' }
  // Legacy anon keys are JWTs and go in Authorization too; new publishable keys must not.
  if (SUPABASE_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SUPABASE_KEY}`
  return h
}

/** Calls a Postgres function through Supabase's REST endpoint (no SDK needed). */
export async function rpc(fn, args = {}, { signal, timeout = 8000 } = {}) {
  if (MOCK) return (await getMock()).call(fn, args)
  if (!LIVE_CONFIGURED) throw new LiveError('not-configured', 'Live voting is not configured')

  const ctrl = new AbortController()
  const abort = () => ctrl.abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(abort, timeout)

  let res
  let text = ''
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(args),
      signal: ctrl.signal,
      cache: 'no-store',
    })
    text = await res.text()
  } catch {
    if (signal?.aborted) throw new LiveError('aborted')
    throw new LiveError(ctrl.signal.aborted ? 'timeout' : 'offline', 'Could not reach the voting server')
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }

  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }
  if (!res.ok) {
    const message = data?.message || `HTTP ${res.status}`
    if (SERVER_CODES.has(message)) throw new LiveError(message, message)
    if (data?.code === 'PGRST202' || res.status === 404) throw new LiveError('not-installed', message)
    throw new LiveError('server', message)
  }
  return data
}

const ev = { p_event: EVENT }

export const live = {
  submit: (poll, voter, value) => rpc('live_poll_submit', { ...ev, p_poll: poll, p_voter: voter, p_value: value }),
  retract: (poll, voter, slot) => rpc('live_poll_retract', { ...ev, p_poll: poll, p_voter: voter, p_slot: slot }),
  status: (voter, opts) => rpc('live_poll_status', { ...ev, p_voter: voter }, opts),
  results: (screen, opts) => rpc('live_poll_results', { ...ev, p_screen: screen }, opts),
  checkKey: (key) => rpc('live_poll_check_key', { ...ev, p_key: key }),
  setActive: (key, screen) => rpc('live_poll_set_active', { ...ev, p_key: key, p_screen: screen }),
  reset: (key, screen) => rpc('live_poll_reset', { ...ev, p_key: key, p_screen: screen }),
  moderation: (key, screen, opts) => rpc('live_poll_moderation', { ...ev, p_key: key, p_screen: screen }, opts),
  hide: (key, poll, text, hidden) => rpc('live_poll_hide', { ...ev, p_key: key, p_poll: poll, p_text: text, p_hidden: hidden }),
  exportVotes: (key) => rpc('live_poll_export', { ...ev, p_key: key }, { timeout: 20000 }),
  resetAll: (key, signups) => rpc('live_poll_reset_all', { ...ev, p_key: key, p_signups: signups === true }),
  interestSubmit: (client, form) =>
    rpc(
      'live_poll_interest_submit',
      {
        ...ev,
        p_client: client,
        p_interests: form.interests,
        p_name: form.name,
        p_role: form.role,
        p_organisation: form.organisation,
        p_email: form.email,
        p_phone: form.phone,
        p_message: form.message,
        p_consent: form.consent === true,
      },
      { timeout: 15000 },
    ),
  interestCount: (key, opts) => rpc('live_poll_interest_count', { ...ev, p_key: key }, opts),
  interestExport: (key) => rpc('live_poll_interest_export', { ...ev, p_key: key }, { timeout: 20000 }),
}

/** Friendly sentence for an error code (used on phones and in the panel). */
export function describeError(err) {
  switch (err?.code) {
    case 'not-configured':
      return 'Live voting has not been set up for this site yet.'
    case 'not-installed':
      return 'The voting database has not been set up yet.'
    case 'offline':
    case 'timeout':
      return 'Connection problem. Check your signal and try again.'
    case 'limit':
      return 'You have reached the limit for this question. Remove an answer to add another.'
    case 'full':
      return 'This poll is full. Thank you!'
    case 'too-long':
      return 'That answer is a bit long. Please shorten it.'
    case 'invalid':
      return 'That answer could not be accepted. Please try again.'
    case 'forbidden':
      return 'Presenter key not recognised.'
    case 'unknown-poll':
      return 'This poll is not available.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
