/**
 * Light profanity filter for audience text shown on the big screen.
 * Words in the cloud that match are dropped; free-text responses are masked.
 * The presenter panel can also hide anything else by hand.
 */
const ROOTS = [
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'asshole', 'arsehole', 'bastard', 'slut', 'whore',
  'faggot', 'fag', 'nigger', 'nigga', 'retard', 'twat', 'wank', 'bollock', 'prick', 'dildo', 'penis', 'vagina',
  'boob', 'tits', 'porn', 'rape', 'poes', 'naai', 'doos', 'kaffir', 'kaffer', 'moer', 'piel', 'fok',
]
// Short roots only match whole words to avoid false positives ("Scunthorpe", "cocktail", "analysis").
const WHOLE = new Set(['fag', 'tits', 'piel', 'fok', 'moer', 'doos', 'dick', 'cock', 'naai', 'poes', 'boob', 'rape', 'prick', 'twat'])

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' }

function normalise(token) {
  return token
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[013457@$!]/g, (c) => LEET[c])
    .replace(/[^a-z]/g, '')
    .replace(/(.)\1{2,}/g, '$1$1')
}

function isBad(token) {
  const t = normalise(token)
  if (!t) return false
  return ROOTS.some((root) => (WHOLE.has(root) ? t === root || t === `${root}s` : t.includes(root)))
}

export function hasProfanity(text) {
  return String(text).split(/\s+/).some(isBad)
}

export function maskProfanity(text) {
  return String(text).replace(/\S+/g, (token) => (isBad(token) ? token[0] + '•'.repeat(Math.max(2, token.length - 1)) : token))
}
