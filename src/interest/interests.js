import { COPY } from '../vote/copy.js'

const way = (id) => COPY.involved.ways.find((w) => w.id === id)

/**
 * What people can register interest in. The ids are what the database accepts
 * (see live_poll_interest_submit); the first three are the slide's three ways.
 */
export const INTERESTS = [
  { id: 'pilot', label: 'Piloting at my school', text: way('pilot')?.text },
  { id: 'mentor', label: 'Mentoring learners', text: way('mentors')?.text },
  { id: 'partner', label: 'Partnering with ConnectEdu', text: way('partners')?.text },
  { id: 'conversation', label: 'A conversation first', text: 'Not sure yet? Tell us a little and we will set up a chat.' },
]

/** The slide's way ids map onto interest ids (mentors → mentor, …). */
export const INTEREST_FOR_WAY = { pilot: 'pilot', mentors: 'mentor', partners: 'partner' }
