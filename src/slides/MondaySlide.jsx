import { Editable } from '@deckio/deck-engine'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import GridList from '../components/GridList.jsx'
import { Card, Frame, accent, seq } from '../components/primitives.jsx'
import { monday } from '../data/content.js'

const { dashboard } = monday
// Card-relative geometry of the counsellor dashboard (from the original slide).
const COLS = [139, 181, 223, 265, 308, 350]
const DOTS = [151, 194, 236, 278, 320, 362]
const ROWS = [248, 288, 329, 369, 409]
const TRACK_X = 160
const TRACK_W = 211
const ROW_COLORS = ['#a78bfa', '#22d3ee', '#f472b6', '#34d399', '#a78bfa']

function LearnerRow({ learner, r }) {
  const top = ROWS[r] ?? ROWS[ROWS.length - 1] + (r - ROWS.length + 1) * 40
  const color = ROW_COLORS[r % ROW_COLORS.length]
  const filled = Math.max(0, Math.min(DOTS.length, learner.progress))
  const fill = filled ? DOTS[filled - 1] + 8.5 - TRACK_X : 0
  return (
    <>
      <Frame x={33} y={top} w={106} h={29} size={11} middle>
        <Editable id={`monday.dashboard.learners.${learner.id}.name`}>{learner.name}</Editable>
      </Frame>
      <div className="ce-track" style={{ left: TRACK_X, top: top + 13.85, width: TRACK_W }}>
        {fill > 0 && <div className="ce-track__fill" style={{ width: fill, '--ce-track': color, '--d': r }} />}
      </div>
      {DOTS.map((x, c) => (
        <div
          key={x}
          className={c < filled ? 'ce-dot ce-dot--on' : 'ce-dot'}
          style={{ left: x, top: top + 6, '--ce-dot': color, '--d': r + c }}
        />
      ))}
    </>
  )
}

export default function MondaySlide({ index }) {
  return (
    <CeSlide index={index}>
      <Kicker id="monday.kicker">{monday.kicker}</Kicker>
      <Title id="monday.title" size={30}>
        {monday.title}
      </Title>

      <GridList id="monday.ideas" items={monday.ideas} x={58} y={163} cols={2} cellW={341} cellH={226} colGap={23} rowGap={24}>
        {(idea, i) => (
          <Card w={341} h={226} i={2 + i}>
            <Frame x={28} y={24} w={96} h={38} size={18} bold color={accent(i)}>
              {seq(i)}
            </Frame>
            <Frame as="h3" x={28} y={63} w={283} h={67} size={17} bold>
              <Editable id={`monday.ideas.${idea.id}.title`}>{idea.title}</Editable>
            </Frame>
            <Frame x={28} y={127} w={293} h={96} size={12.5}>
              <Editable id={`monday.ideas.${idea.id}.text`}>{idea.text}</Editable>
            </Frame>
          </Card>
        )}
      </GridList>

      <Card x={797} y={163} w={426} h={475} className="ce-dashboard" i={6}>
        <Frame x={33} y={29} w={288} h={24} size={11} bold color="var(--ce-violet)" className="ce-label">
          <Editable id="monday.dashboard.kicker">{dashboard.kicker}</Editable>
        </Frame>
        <Frame as="h3" x={33} y={58} w={358} h={77} size={20} bold>
          <Editable id="monday.dashboard.title">{dashboard.title}</Editable>
        </Frame>
        <Frame x={33} y={139} w={358} h={58} size={13}>
          <Editable id="monday.dashboard.text">{dashboard.text}</Editable>
        </Frame>

        {dashboard.grades.map((grade, c) => (
          <Frame key={grade} x={COLS[c]} y={211} w={42} h={24} size={10} color="var(--ce-slate)" align="center" nowrap>
            <Editable id={`monday.dashboard.grades.${c}`}>{grade}</Editable>
          </Frame>
        ))}

        {dashboard.learners.map((learner, r) => (
          <LearnerRow key={learner.id} learner={learner} r={r} />
        ))}

        <Frame x={33} y={447} w={192} h={21} size={9} italic color="var(--ce-slate)">
          <Editable id="monday.dashboard.note">{dashboard.note}</Editable>
        </Frame>
      </Card>
    </CeSlide>
  )
}
