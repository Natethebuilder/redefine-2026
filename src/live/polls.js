import { career, childhood, feedback } from '../data/content.js'

/**
 * The three live "screens" in the deck. A screen is what the audience sees on
 * their phone while the matching slide is up; it may contain several polls.
 * Keep ids and limits in sync with supabase/live_polls.sql.
 */
export const SCREENS = {
  childhood: {
    id: 'childhood',
    label: 'Who helped you?',
    title: childhood.title,
    prompt: childhood.subtitle,
    polls: [
      {
        id: 'childhood',
        kind: 'choice',
        options: childhood.options.map((o) => ({ value: o.letter, label: o.lines.join('').trim() })),
      },
    ],
  },
  career: {
    id: 'career',
    label: 'Your career',
    title: career.title,
    prompt: career.prompt,
    polls: [{ id: 'career', kind: 'words', max: 3, maxLen: 40 }],
  },
  feedback: {
    id: 'feedback',
    label: 'Feedback',
    title: feedback.title,
    prompt: feedback.prompt,
    polls: [
      {
        id: 'likelihood',
        kind: 'scale',
        options: ['1', '2', '3', '4', '5'].map((value) => ({ value, label: value })),
        low: 'Not likely',
        high: 'Very likely',
      },
      {
        id: 'roadblock',
        kind: 'text',
        max: 2,
        maxLen: 280,
        prompt: 'What is the biggest roadblock to trying this at your school?',
      },
    ],
  },
}

export const SCREEN_ORDER = ['childhood', 'career', 'feedback']

export const isScreen = (id) => Object.prototype.hasOwnProperty.call(SCREENS, id)

export function findPoll(pollId) {
  for (const screen of Object.values(SCREENS)) {
    const poll = screen.polls.find((p) => p.id === pollId)
    if (poll) return { screen, poll }
  }
  return null
}
