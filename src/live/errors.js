/** Error with a stable `code`, e.g. offline, limit, forbidden, not-installed. */
export class LiveError extends Error {
  constructor(code, message) {
    super(message || code)
    this.name = 'LiveError'
    this.code = code
  }
}

/** Collapses whitespace the same way the database does before storing text. */
export const cleanText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ')
