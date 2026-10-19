/**
 * Live-voting configuration shared by the deck and the phone voting page.
 *
 * The Supabase URL and anon key come from build-time env vars (see README).
 * Append `?mock` to any URL to use an in-browser backend instead (handy for
 * rehearsals and local development; `?mock=demo` also seeds sample votes).
 */
const env = import.meta.env

export const EVENT = 'redefine-2026'

export const SUPABASE_URL = (env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '')
export const SUPABASE_KEY = (env.VITE_SUPABASE_ANON_KEY || '').trim()

const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
const mockParam = params.get('mock')

export const MOCK = mockParam !== null || env.VITE_LIVE_MOCK === '1'
export const MOCK_SEED = mockParam === 'demo'
export const LIVE_CONFIGURED = MOCK || Boolean(SUPABASE_URL && SUPABASE_KEY)

function voteBase() {
  if (env.VITE_VOTE_URL) return new URL(env.VITE_VOTE_URL, window.location.href)
  return new URL(`${env.BASE_URL || '/'}vote/`, window.location.origin)
}

/** Full URL of the phone voting page, optionally opened on one screen. */
export function voteUrl(screen) {
  const url = voteBase()
  if (screen) url.searchParams.set('p', screen)
  if (MOCK) url.searchParams.set('mock', '')
  return url.href.replace('mock=&', 'mock&').replace(/mock=$/, 'mock')
}

/** Short, human-typeable form of the voting URL (no protocol or trailing slash). */
export function voteDisplayUrl() {
  const url = voteBase()
  return `${url.host}${url.pathname}`.replace(/\/+$/, '')
}
