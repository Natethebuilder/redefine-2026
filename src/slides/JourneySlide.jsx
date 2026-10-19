import { Editable } from '@deckio/deck-engine'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import GridList from '../components/GridList.jsx'
import { Arrow, Card, Frame, accent, pt, seq } from '../components/primitives.jsx'
import { journey } from '../data/content.js'

const CARD_W = 214
const GAP = 23.75
const LINKS = [0, 1, 2, 3].map((i) => 58 + (i + 1) * CARD_W + i * GAP + GAP / 2)

export default function JourneySlide({ index }) {
  return (
    <CeSlide index={index}>
      <Kicker id="journey.kicker">{journey.kicker}</Kicker>
      <Title id="journey.title">{journey.title}</Title>

      <GridList id="journey.steps" items={journey.steps} x={58} y={182} cols={5} cellW={CARD_W} cellH={307} colGap={GAP}>
        {(step, i) => (
          <Card w={CARD_W} h={307} i={2 + i}>
            <Frame x={28} y={29} w={115} h={72} size={40} bold color={accent(i)}>
              {seq(i)}
            </Frame>
            <Frame as="h3" x={28} y={116} w={156} h={43} size={22} bold>
              <Editable id={`journey.steps.${step.id}.title`}>{step.title}</Editable>
            </Frame>
            <Frame x={28} y={168} w={156} h={125} size={14}>
              <Editable id={`journey.steps.${step.id}.text`}>{step.text}</Editable>
            </Frame>
          </Card>
        )}
      </GridList>

      {LINKS.map((x, i) => (
        <div key={x} className="ce-link ce-in-fade" style={{ left: x, top: 242, '--i': 4 + i }} aria-hidden="true">
          <Arrow width={14} height={12} stroke={2.2} color="#9aa3bf" />
        </div>
      ))}

      <Card x={58} y={523} w={1165} h={106} tone="navy" className="ce-banner" i={8}>
        <Frame x={33} y={0} w={1098} h={106} middle color="var(--ce-paper)" size={15}>
          <Editable id="journey.bannerLead" style={{ fontSize: pt(18), fontWeight: 700, color: 'var(--ce-cyan)' }}>
            {journey.bannerLead}
          </Editable>
          <Editable id="journey.bannerText">{journey.bannerText}</Editable>
        </Frame>
      </Card>
    </CeSlide>
  )
}
