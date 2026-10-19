import { Editable } from '@deckio/deck-engine'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import GridList from '../components/GridList.jsx'
import Stat from '../components/Stat.jsx'
import { Box, Card, Frame, accent } from '../components/primitives.jsx'
import { gap } from '../data/content.js'

const COLUMNS = { x: 58, cols: 4, cellW: 270, colGap: 28.33 }

export default function GapSlide({ index }) {
  return (
    <CeSlide index={index}>
      <Kicker id="gap.kicker">{gap.kicker}</Kicker>
      <Title id="gap.title" size={30}>
        {gap.title}
      </Title>

      <GridList id="gap.stats" items={gap.stats} y={168} cellH={234} {...COLUMNS}>
        {(stat, i) => (
          <Card w={270} h={234} i={2 + i}>
            <Frame x={28} y={21} w={212} h={72} size={44} bold color={accent(i)}>
              <Stat id={`gap.stats.${stat.id}.value`} value={stat.value} slide={index} />
            </Frame>
            <Frame x={28} y={96} w={212} h={91} size={13}>
              <Editable id={`gap.stats.${stat.id}.text`}>{stat.text}</Editable>
            </Frame>
            <Frame x={28} y={205} w={212} h={24} size={10} italic color="var(--ce-slate)">
              <Editable id={`gap.stats.${stat.id}.source`}>{stat.source}</Editable>
            </Frame>
          </Card>
        )}
      </GridList>

      <Frame x={58} y={420} w={384} h={29} size={11} bold color="var(--ce-mist)" className="ce-label" i={6}>
        <Editable id="gap.whyLabel">{gap.whyLabel}</Editable>
      </Frame>

      <GridList id="gap.reasons" items={gap.reasons} y={456} cellH={184} {...COLUMNS}>
        {(reason, i) => (
          <Box w={270} h={184} i={7 + i}>
            <Frame x={0} y={0} w={270} h={34} size={18} bold color="#fff">
              <Editable id={`gap.reasons.${reason.id}.title`}>{reason.title}</Editable>
            </Frame>
            <Frame x={0} y={40} w={260} h={144} size={13} color="#fff">
              <Editable id={`gap.reasons.${reason.id}.text`}>{reason.text}</Editable>
            </Frame>
          </Box>
        )}
      </GridList>
    </CeSlide>
  )
}
