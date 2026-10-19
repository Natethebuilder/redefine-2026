import { useSyncExternalStore } from 'react'
import { live } from './api.js'

/**
 * Tiny global store for the deck's live-voting UI: presenter key, results
 * visibility (H), QR overlay (Q), presenter panel (P) and toasts.
 */
const KEY_STORAGE = 'ce-live-presenter-key'

const storage = {
  get() {
    try {
      return localStorage.getItem(KEY_STORAGE) || ''
    } catch {
      return ''
    }
  },
  set(value) {
    try {
      if (value) localStorage.setItem(KEY_STORAGE, value)
      else localStorage.removeItem(KEY_STORAGE)
    } catch {
      /* private mode: key lasts for this tab only */
    }
  },
}

// `?presenter=KEY` unlocks this browser, then disappears from the address bar.
function takeKeyFromUrl() {
  if (typeof window === 'undefined') return null
  const url = new URL(window.location.href)
  const key = url.searchParams.get('presenter')
  if (key === null) return null
  url.searchParams.delete('presenter')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  return key.trim()
}

const urlKey = takeKeyFromUrl()

let state = {
  key: urlKey || storage.get(),
  // locked | checking | unlocked | rejected | error
  presenter: 'locked',
  resultsHidden: false,
  qrOpen: false,
  panelOpen: false,
  revision: 0,
  toast: null,
}

const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())
const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getLive() {
  return state
}

export function setLive(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
  emit()
}

/** Subscribe to one slice of the store, e.g. useLive((s) => s.qrOpen). */
export function useLive(selector) {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state))
}

let toastTimer
export function toast(message) {
  clearTimeout(toastTimer)
  setLive((s) => ({ toast: { message, id: (s.toast?.id || 0) + 1 } }))
  toastTimer = setTimeout(() => setLive({ toast: null }), 2400)
}

/** Ask every results view to refetch now (after a reset or moderation change). */
export function refreshResults() {
  setLive((s) => ({ revision: s.revision + 1 }))
}

export async function unlock(key) {
  const candidate = (key ?? state.key).trim()
  if (!candidate) return false
  setLive({ key: candidate, presenter: 'checking' })
  try {
    const ok = await live.checkKey(candidate)
    if (ok === true) {
      storage.set(candidate)
      setLive({ presenter: 'unlocked' })
      return true
    }
    storage.set('')
    setLive({ presenter: 'rejected' })
    return false
  } catch {
    setLive({ presenter: 'error' })
    return false
  }
}

export function lock() {
  storage.set('')
  setLive({ key: '', presenter: 'locked' })
}

if (urlKey) storage.set(urlKey)
