const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function makeUuid() {
  if (crypto.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Random id kept in this browser (a fresh one each time if storage is blocked). */
function browserId(storageKey) {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved && UUID.test(saved)) return saved
    const id = makeUuid()
    localStorage.setItem(storageKey, id)
    return id
  } catch {
    return makeUuid()
  }
}

/** Anonymous, per-browser id so people can change their answers. */
export const getVoter = () => browserId('ce-voter')

/**
 * Lets someone correct their sign-up by sending the form again. Deliberately
 * separate from the voter id, so named sign-ups cannot be linked to anonymous answers.
 */
export const getSignupClient = () => browserId('ce-signup')
