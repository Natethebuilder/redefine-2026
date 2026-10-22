/**
 * All slide copy, in presentation order. Text is taken verbatim from
 * “ConnectEdu Redefine 2026 – Lighter map v3.pptx”. Speaker notes are
 * intentionally not included: this site is public.
 *
 * List items carry stable `id`s so inline edits and reordering survive.
 */

export const SITE_URL = 'https://www.connectedu.world'
export const SURVEY_URL = `${SITE_URL}/survey`

export const footer = {
  left: 'Redefine Education 2026',
  right: 'connectedu.world',
}

export const cover = {
  kicker: '29+ DISCIPLINES  ·  VETTED MENTORS  ·  GRADE 7 TO UNIVERSITY',
  titleLead: 'Who could they ',
  titleAccent: 'become?',
  subtitle:
    'Reimagining how students discover their future, and why guidance belongs in the conversation about redefining education',
  speakers: 'Dr Heena Brahmbhatt (CEO) & Nathan Brahmbhatt (CTO) ·  Co-founders, ConnectEdu',
  event: 'Redefine Education 2026  ·  Redhill School  ·  Friday 23 October',
  url: 'connectedu.world',
}

export const childhood = {
  kicker: 'LIVE POLL  ·  MULTIPLE CHOICE',
  title: 'Think back to when you were 15',
  subtitle: 'Who helped you choose your subjects, and your path?',
  options: [
    { id: 'a', letter: 'A', lines: ['A parent or relative'] },
    { id: 'b', letter: 'B', lines: ['A teacher or counsellor'] },
    { id: 'c', letter: 'C', lines: ['A friend, cousin or neighbour'] },
    { id: 'd', letter: 'D', lines: ['Nobody. ', 'I guessed.'] },
  ],
}

export const gap = {
  kicker: 'THE GUIDANCE GAP',
  title: 'One of the biggest decisions a teenager makes gets the least support',
  stats: [
    {
      id: 'graduation',
      value: '44%',
      text: 'of SA students in three-year degrees have not graduated after six years',
      source: 'DHET cohort data, 2010 intake',
    },
    {
      id: 'majors',
      value: '1 in 3',
      text: 'university students change their major within three years of enrolling',
      source: 'NCES, US first-time students',
    },
    {
      id: 'maths',
      value: '34%',
      text: 'of 2025 matrics wrote Pure Maths (38% in 2024). Most took Maths Literacy, closing many STEM and health degrees',
      source: 'DBE, NSC 2025 results',
    },
    {
      id: 'youth',
      value: '61%',
      text: 'of South Africans aged 15 to 24 who want work are unemployed',
      source: 'Stats SA, QLFS Q1 2026',
    },
  ],
  whyLabel: 'WHY IT HAPPENS',
  reasons: [
    {
      id: 'timing',
      title: 'Timing',
      text: 'Subject choices in Grades 9 and 10 open or close university and career doors before most learners know what they want.',
    },
    {
      id: 'capacity',
      title: 'Capacity',
      text: 'Life Orientation has two hours a week, and career guidance is only a quarter of it in Grades 10 to 12.',
    },
    {
      id: 'access',
      title: 'Access',
      text: 'Honest advice about careers and universities usually depends on who a learner happens to know.',
    },
    {
      id: 'translation',
      title: 'Translation',
      text: 'Subjects do not map to careers. Learners choose Physics or Business Studies, not data science or biomedical engineering.',
    },
  ],
}

export const weekend = {
  kicker: 'WHAT THIS WEEKEND IS TELLING US',
  title: 'Redefining education means redefining guidance',
  heard: 'WHAT WE HEARD',
  responds: 'HOW CONNECTEDU RESPONDS',
  rows: [
    {
      id: 'access',
      quote: 'Access for every learner',
      italic: false,
      who: 'Taddy Blecher, keynote',
      response:
        'Every learner accesses all resources on one platform.  Any device, nothing to install. Guidance no longer depends on postcode, fees or network.',
    },
    {
      id: 'questions',
      quote: '“Too many answers, not enough questions.”',
      italic: true,
      who: 'Brent Hutcheson, keynote',
      response:
        'Every journey starts with a research-based interest survey about the learner, and only then suggests pathways that fit.',
    },
    {
      id: 'robot',
      quote: '“The robot was never the point.”',
      italic: true,
      who: 'Dr Angie Mullins, keynote',
      response:
        'Technology does the sorting so learners reach the right human sooner: a verified mentor in the field they are curious about.',
    },
    {
      id: 'digital',
      quote: '“Digital transformation is not a device project.”',
      italic: true,
      who: 'Panel, chaired by Nadine Smith',
      response:
        'Safety and governance are built in: vetted mentors, parental consent, learner-first contact and POPIA-aligned privacy.',
    },
  ],
}

export const reimagined = {
  kicker: 'WHAT IS BEST FOR THE CHILD',
  title: 'Guidance, reimagined',
  from: 'FROM',
  to: 'TO',
  rows: [
    {
      id: 'personal',
      from: 'One-size-fits-all advice',
      to: 'Personal pathways from each learner’s own interests',
    },
    {
      id: 'early',
      from: 'Subject choices rushed in Grades 9 and 10',
      to: 'Discovery that starts in Grade 7, well before subject choice',
    },
    {
      id: 'curricula',
      from: 'NSC or IEB vs IB vs A Levels, decided with little information',
      to: 'Informed comparison of each curriculum and the doors it opens',
    },
    {
      id: 'abroad',
      from: 'South Africa or abroad, and if abroad, Europe, the US or elsewhere',
      to: 'A 3D globe of ranked universities and programmes worldwide',
    },
    {
      id: 'mentors',
      from: 'Private consultants charging families hundreds of thousands of rands',
      to: 'Vetted mentors and the same guidance, for every learner',
    },
    {
      id: 'portfolio',
      from: 'A CV written at the end',
      to: 'A portfolio of growth, built along the way',
    },
  ],
}

export const toolkit = {
  quoteMark: '“',
  quote: 'You cannot see their future. You can still prepare them for it.”',
  attribution: 'Willem Gous, founder of The Human Entrepreneur, Redefine 2026 keynote',
  stat: '39%',
  statText: 'of workers’ core skills are expected to change by 2030',
  statSource: 'World Economic Forum, Future of Jobs 2025',
  kicker: 'THAT IS WHY EVERY PATHWAY HAS A COMPLETE TOOLKIT',
  title: 'Four lenses on every career pathway',
  lenses: [
    {
      id: 'core',
      number: '01',
      title: 'Core skills',
      text: 'The subject knowledge and technical skills a field depends on, so learners know what to build as they choose subjects.',
    },
    {
      id: 'transferable',
      number: '02',
      title: 'Transferable skills',
      text: 'Communication, problem-solving, collaboration and adaptability: skills that travel into any career, even as jobs change.',
    },
    {
      id: 'applications',
      number: '03',
      title: 'Many applications',
      text: 'Each pathway shows the range of careers it leads to. Chemistry can mean pharmacy, materials science, forensics or food technology.',
    },
    {
      id: 'future',
      number: '04',
      title: 'Future potential',
      text: 'How AI and other advances are reshaping each field, so learners see where it is heading, not just where it is today.',
    },
  ],
}

export const journey = {
  kicker: 'THE LEARNER JOURNEY',
  title: 'Five connected steps, on any device',
  steps: [
    { id: 'discover', number: '01', title: 'Discover', text: 'A research-based interest survey suggests career pathways that fit.' },
    { id: 'explore', number: '02', title: 'Explore', text: 'A 3D globe of ranked universities and programmes for every field.' },
    { id: 'master', number: '03', title: 'Master', text: 'Subject and career hubs with roadmaps, resources and projects.' },
    { id: 'connect', number: '04', title: 'Connect', text: 'Vetted mentors, searchable by discipline, help and language.' },
    { id: 'build', number: '05', title: 'Build', text: 'A portfolio of projects, badges and points that shows initiative.' },
  ],
  bannerLead: '29+ disciplines  ',
  bannerText:
    'from Engineering and Medicine to Law, Data Science and the Arts, each with curated pathways. Learners tag projects to the 17 UN Sustainable Development Goals.',
}

export const safety = {
  kicker: 'SAFETY AND TRUST BY DESIGN',
  title: 'Built for learners under 18 from day one',
  items: [
    {
      id: 'verified',
      number: '01',
      title: 'Verified mentors only',
      text: 'Mentors apply and are reviewed and approved. No open registration.',
    },
    {
      id: 'consent',
      number: '02',
      title: 'Parent consent',
      text: 'Under-18s need a parent or guardian’s consent before messaging or public profiles unlock.',
    },
    {
      id: 'contact',
      number: '03',
      title: 'No unsolicited contact',
      text: 'Mentors cannot browse learners. A learner always makes first contact.',
    },
    {
      id: 'privacy',
      number: '04',
      title: 'Privacy first',
      text: 'Messages auto-delete after 14 days. POPIA-aligned. We never sell personal information.',
    },
  ],
}

export const pilot = {
  kicker: 'ALREADY LIVE AT REDHILL SCHOOL',
  title: 'Our Grade 12 pilot, launched in July 2026',
  items: [
    {
      id: 'discovered',
      number: '01',
      title: 'Discovered',
      text: 'Every Grade 12 took the interest survey. For most, it matched the field they chose.',
    },
    {
      id: 'explored',
      number: '02',
      title: 'Explored',
      text: 'Learners compared top universities and programmes worldwide on the 3D globe.',
    },
    {
      id: 'connected',
      number: '03',
      title: 'Connected',
      text: 'Learners messaged vetted mentors in the fields they are considering.',
    },
    {
      id: 'built',
      number: '04',
      title: 'Built',
      text: 'Learners tagged projects to the UN SDGs, building a record of who they are becoming.',
    },
  ],
}

export const demo = {
  kicker: 'LIVE DEMO',
  title: 'Your turn: take the interest survey',
  steps: [
    { id: 'scan', text: 'Scan the code or go to connectedu.world/survey' },
    { id: 'survey', text: 'Take the survey as if you were 15' },
    { id: 'pathways', text: 'See your suggested pathways' },
    { id: 'globe', text: 'Explore one programme on the globe' },
    { id: 'compare', text: 'Compare results with your neighbour' },
  ],
  url: 'connectedu.world/survey',
}

export const career = {
  kicker: 'LIVE POLL  ·  WORD CLOUD',
  title: 'Which career did the survey suggest for you?',
  prompt: 'One or two words. Did anything surprise you?',
}

export const monday = {
  kicker: 'BACK AT SCHOOL ON MONDAY',
  title: 'ConnectEdu across your school, from Grade 7 to university',
  ideas: [
    {
      id: 'lo',
      number: '01',
      title: 'Life Orientation',
      text: 'Run the interest survey in a Grade 9 lesson before subject choice, then discuss results in pairs.',
    },
    {
      id: 'projects',
      number: '02',
      title: 'Projects and portfolios',
      text: 'Learners tag class projects to a UN goal, including IB and A Level project work, and add them as evidence.',
    },
    {
      id: 'service',
      number: '03',
      title: 'Community service and extracurriculars',
      text: 'Hours, activities and reflections logged and managed in one place, ready for IB CAS and other requirements.',
    },
    {
      id: 'careers',
      number: '04',
      title: 'Careers week',
      text: 'Learners prepare questions and message a vetted mentor in the field they are curious about.',
    },
  ],
  dashboard: {
    kicker: 'FOR COUNSELLORS',
    title: 'A school dashboard, built by ConnectEdu',
    text: 'Every activity and every learner’s journey in one view, from Grade 7 to university acceptance.',
    grades: ['Gr 7', 'Gr 9', 'Gr 10', 'Gr 11', 'Gr 12', 'Uni'],
    learners: [
      { id: 'a', name: 'Learner A', progress: 6 },
      { id: 'b', name: 'Learner B', progress: 4 },
      { id: 'c', name: 'Learner C', progress: 5 },
      { id: 'd', name: 'Learner D', progress: 3 },
      { id: 'e', name: 'Learner E', progress: 2 },
    ],
    note: 'Illustrative',
  },
}

export const partnership = {
  kicker: 'WHAT WE OFFER SCHOOLS',
  title: 'A partnership, not just a platform',
  discoverability: {
    label: 'DISCOVERABILITY',
    lead: 'Featured as a partner school,',
    rest: ' so learners and families can discover what sets you apart.',
  },
  handsOn: {
    label: 'HANDS-ON LEARNING',
    lead: 'Hackathons and workshops',
    rest: ' with your learners, across disciplines:',
    chips: [
      { id: 'engineering', text: 'Engineering' },
      { id: 'medicine', text: 'Medicine' },
      { id: 'law', text: 'Law' },
      { id: 'arts', text: 'The arts' },
    ],
  },
  insight: {
    label: 'INSIGHT',
    lead: 'A dashboard you customise',
    rest: ' to follow every learner’s progress and post updates to them.',
  },
  flexibility: {
    label: 'FLEXIBILITY',
    lead: 'Shaped around your school:',
    rest: ' we mould and merge ConnectEdu to suit your needs.',
  },
  access: {
    label: 'ACCESS',
    title: 'Bring ConnectEdu to public-school learners',
    line1: 'Help us reach under-resourced public schools across South Africa,',
    line2: 'so good guidance no longer depends on postcode or fees.',
  },
}

export const involved = {
  kicker: 'HELP US SHAPE WHAT COMES NEXT',
  title: 'Three ways to get involved',
  ways: [
    {
      id: 'pilot',
      number: '01',
      title: 'Pilot schools',
      text: 'A Term 1, 2027 pilot for up to 20 schools. Start from Grade 7, well before subject choice. We build a counsellor dashboard around your school.',
    },
    {
      id: 'mentors',
      number: '02',
      title: 'Mentors',
      text: 'Share your field with learners, on your own schedule. You are vetted first, and learners always make first contact.',
    },
    {
      id: 'partners',
      number: '03',
      title: 'Partners',
      text: 'Organisations working with under-resourced learners: help us widen access across South Africa.',
    },
  ],
  stand: 'Visit our stand all weekend for a live demo',
  email: 'support@connectedu.world',
}

export const feedback = {
  kicker: 'LIVE POLL  ·  YOUR FEEDBACK',
  title: 'How likely are you to try ConnectEdu with your learners?',
  prompt: 'Rate 1 to 5, then tell us: what is the biggest roadblock to trying this at your school?',
}

export const closing = {
  title: 'Every learner deserves to discover who they could become.',
  questions: 'Questions?',
  contacts: [
    { id: 'heena', name: 'Heena Brahmbhatt  ', email: 'heena@connectedu.world' },
    { id: 'nathan', name: 'Nathan Brahmbhatt  ', email: 'nathan@connectedu.world' },
  ],
  linkedin: 'linkedin.com/company/connecteduworld',
  url: 'connectedu.world',
}
