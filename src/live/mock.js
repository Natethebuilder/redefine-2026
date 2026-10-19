import { LiveError, cleanText } from './errors.js'

/**
 * In-browser stand-in for the Supabase functions in supabase/live_polls.sql.
 * State lives in localStorage, so a deck tab and a /vote tab on the same
 * origin share votes. Presenter key: "demo".
 */
const STORE = 'ce-live-mock-v1'
const KEY = 'demo'
const CAP = 5000
const POLLS = {
  childhood: { screen: 'childhood', kind: 'choice', options: ['A', 'B', 'C', 'D'], max: 1, maxLen: 1 },
  career: { screen: 'career', kind: 'words', options: [], max: 3, maxLen: 40 },
  likelihood: { screen: 'feedback', kind: 'scale', options: ['1', '2', '3', '4', '5'], max: 1, maxLen: 1 },
  roadblock: { screen: 'feedback', kind: 'text', options: [], max: 2, maxLen: 280 },
}
const SCREENS = new Set(Object.values(POLLS).map((p) => p.screen))
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// Same order as the database's COLLATE "C" sorting.
const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
const uuid = () =>
  crypto.randomUUID?.() ??
  '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
  )

function fresh() {
  return { active: null, nextId: 1, votes: [] }
}

function load() {
  try {
    const db = JSON.parse(localStorage.getItem(STORE))
    if (db && Array.isArray(db.votes)) return db
  } catch {
    /* fall through */
  }
  return fresh()
}

function save(db) {
  try {
    localStorage.setItem(STORE, JSON.stringify(db))
  } catch {
    /* storage full or blocked: keep going in memory */
  }
}

function requireKey(key) {
  if (key !== KEY) throw new LiveError('forbidden')
}

function mine(db, poll, voter) {
  return db.votes
    .filter((v) => v.poll === poll && v.voter === voter)
    .sort((a, b) => a.slot - b.slot)
    .map((v) => ({ slot: v.slot, value: v.choice ?? v.response }))
}

function add(db, poll, voter, slot, choice, response, at = new Date().toISOString()) {
  db.votes.push({ id: db.nextId++, poll, voter, slot, choice, response, hidden: false, created_at: at, updated_at: at })
}

function pollResults(db, id, def) {
  const rows = db.votes.filter((v) => v.poll === id)
  const voters = new Set(rows.map((v) => v.voter)).size
  if (def.kind === 'choice' || def.kind === 'scale') {
    const counts = Object.fromEntries(def.options.map((o) => [o, 0]))
    for (const v of rows) if (v.choice in counts) counts[v.choice] += 1
    return { kind: def.kind, voters, counts }
  }
  const visible = rows.filter((v) => !v.hidden)
  if (def.kind === 'words') {
    const groups = new Map()
    for (const v of visible) {
      const k = v.response.toLowerCase()
      const g = groups.get(k) || { n: 0, forms: new Map() }
      g.n += 1
      g.forms.set(v.response, (g.forms.get(v.response) || 0) + 1)
      groups.set(k, g)
    }
    const words = [...groups.values()]
      .map((g) => ({ text: [...g.forms.entries()].sort((a, b) => b[1] - a[1] || byCode(a[0], b[0]))[0][0], n: g.n }))
      .sort((a, b) => b.n - a.n || byCode(a.text.toLowerCase(), b.text.toLowerCase()) || byCode(a.text, b.text))
      .slice(0, 80)
    return { kind: 'words', voters, entries: visible.length, words }
  }
  const responses = [...visible]
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
    .slice(0, 50)
    .map((v) => ({ id: v.id, text: v.response, at: v.created_at }))
  return { kind: 'text', voters, entries: visible.length, responses }
}

const handlers = {
  live_poll_submit(db, { p_poll, p_voter, p_value }) {
    const def = POLLS[p_poll]
    if (!def) throw new LiveError('unknown-poll')
    if (!UUID.test(p_voter || '')) throw new LiveError('invalid')
    const value = cleanText(p_value)
    const rows = db.votes.filter((v) => v.poll === p_poll)
    if (def.kind === 'choice' || def.kind === 'scale') {
      if (!def.options.includes(value)) throw new LiveError('invalid')
      const existing = rows.find((v) => v.voter === p_voter && v.slot === 0)
      if (existing) {
        existing.choice = value
        existing.updated_at = new Date().toISOString()
      } else {
        if (rows.length >= CAP) throw new LiveError('full')
        add(db, p_poll, p_voter, 0, value, null)
      }
    } else {
      if (!value) throw new LiveError('invalid')
      if (value.length > def.maxLen) throw new LiveError('too-long')
      const own = rows.filter((v) => v.voter === p_voter)
      if (!own.some((v) => v.response.toLowerCase() === value.toLowerCase())) {
        if (own.length >= def.max) throw new LiveError('limit')
        if (rows.length >= CAP) throw new LiveError('full')
        add(db, p_poll, p_voter, own.reduce((m, v) => Math.max(m, v.slot), -1) + 1, null, value)
      }
    }
    return { ok: true, mine: mine(db, p_poll, p_voter) }
  },

  live_poll_retract(db, { p_poll, p_voter, p_slot }) {
    if (!POLLS[p_poll]) throw new LiveError('unknown-poll')
    db.votes = db.votes.filter((v) => !(v.poll === p_poll && v.voter === p_voter && v.slot === p_slot))
    return { ok: true, mine: mine(db, p_poll, p_voter) }
  },

  live_poll_status(db, { p_voter }) {
    const own = {}
    for (const id of Object.keys(POLLS)) own[id] = p_voter ? mine(db, id, p_voter) : []
    return { active: db.active, mine: own }
  },

  live_poll_results(db, { p_screen }) {
    const polls = {}
    const voters = new Set()
    for (const [id, def] of Object.entries(POLLS)) {
      if (def.screen !== p_screen) continue
      polls[id] = pollResults(db, id, def)
      for (const v of db.votes) if (v.poll === id) voters.add(v.voter)
    }
    return { screen: p_screen, voters: voters.size, polls }
  },

  live_poll_check_key(db, { p_key }) {
    return p_key === KEY
  },

  live_poll_set_active(db, { p_key, p_screen }) {
    requireKey(p_key)
    if (p_screen != null && !SCREENS.has(p_screen)) throw new LiveError('invalid')
    db.active = p_screen ?? null
    return { ok: true, active: db.active }
  },

  live_poll_reset(db, { p_key, p_screen }) {
    requireKey(p_key)
    const before = db.votes.length
    db.votes = db.votes.filter((v) => POLLS[v.poll]?.screen !== p_screen)
    return { ok: true, deleted: before - db.votes.length }
  },

  live_poll_moderation(db, { p_key, p_screen }) {
    requireKey(p_key)
    const groups = new Map()
    for (const v of db.votes) {
      const def = POLLS[v.poll]
      if (def?.screen !== p_screen || v.response == null) continue
      const k = `${v.poll}\u0000${v.response.toLowerCase()}`
      const g = groups.get(k) || { poll: v.poll, text: v.response, n: 0, hidden: true, last: '', lastId: 0 }
      g.n += 1
      g.hidden = g.hidden && v.hidden
      if (v.created_at > g.last) g.last = v.created_at
      g.lastId = Math.max(g.lastId, v.id)
      groups.set(k, g)
    }
    const items = [...groups.values()]
      .sort((a, b) => b.last.localeCompare(a.last) || b.lastId - a.lastId)
      .slice(0, 200)
      .map(({ poll, text, n, hidden }) => ({ poll, text, n, hidden }))
    return { items }
  },

  live_poll_hide(db, { p_key, p_poll, p_text, p_hidden }) {
    requireKey(p_key)
    const k = cleanText(p_text).toLowerCase()
    let updated = 0
    for (const v of db.votes) {
      if (v.poll === p_poll && v.response != null && v.response.toLowerCase() === k) {
        v.hidden = Boolean(p_hidden)
        updated += 1
      }
    }
    return { ok: true, updated }
  },

  live_poll_export(db, { p_key }) {
    requireKey(p_key)
    return db.votes.map((v) => ({
      poll: v.poll,
      voter: v.voter,
      slot: v.slot,
      choice: v.choice,
      response: v.response,
      hidden: v.hidden,
      created_at: v.created_at,
      updated_at: v.updated_at,
    }))
  },
}

function seed(db) {
  const voters = Array.from({ length: 46 }, uuid)
  const at = (n) => new Date(Date.now() - n * 37_000).toISOString()
  const choice = 'AAAAAAAAAAAAAAAAABBBBBBBBBCCCCCDDDDDDDDDDDD'
  ;[...choice].forEach((c, i) => add(db, 'childhood', voters[i], 0, c, null, at(90 - i)))
  const words = [
    ['Engineer', 7], ['Doctor', 5], ['Architect', 4], ['Teacher', 3], ['Data scientist', 3], ['Entrepreneur', 3],
    ['Lawyer', 2], ['Game designer', 2], ['Psychologist', 2], ['Vet', 2], ['Pilot', 1], ['Chef', 1],
    ['Marine biologist', 1], ['Actuary', 1], ['Musician', 1], ['Journalist', 1], ['Pharmacist', 1], ['Animator', 1],
  ]
  let w = 0
  for (const [text, n] of words) {
    for (let k = 0; k < n; k += 1) {
      const voter = voters[w % voters.length]
      const slot = db.votes.filter((v) => v.poll === 'career' && v.voter === voter).length
      add(db, 'career', voter, slot, null, text, at(60 - w))
      w += 1
    }
  }
  const scale = '1223333333344444444444444455555555555'
  ;[...scale].forEach((c, i) => add(db, 'likelihood', voters[i], 0, c, null, at(40 - i)))
  ;[
    'Our Grade 9 timetable is already packed',
    'Getting buy-in from parents and the SGB',
    'POPIA and data privacy sign-off',
    'Teacher time to learn a new platform',
    'Cost for our public-school learners',
    'Not every learner has their own device',
    'Linking it to the systems we already use',
    'Knowing which grade to start with',
  ].forEach((text, i) => add(db, 'roadblock', voters[i * 3], 0, null, text, at(16 - i)))
  db.seeded = true
}

export function createMockBackend({ seed: withSeed = false } = {}) {
  if (withSeed) {
    const db = load()
    if (!db.seeded) {
      seed(db)
      save(db)
    }
  }
  return {
    async call(fn, args) {
      await sleep(60 + Math.random() * 140)
      const handler = handlers[fn]
      if (!handler) throw new LiveError('not-installed', `Unknown function ${fn}`)
      const db = load()
      const result = handler(db, args || {})
      save(db)
      return JSON.parse(JSON.stringify(result))
    },
  }
}
