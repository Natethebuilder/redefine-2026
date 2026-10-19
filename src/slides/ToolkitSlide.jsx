import { Editable } from '@deckio/deck-engine'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import GridList from '../components/GridList.jsx'
import Stat from '../components/Stat.jsx'
import { Box, Card, Frame, seq } from '../components/primitives.jsx'
import { toolkit } from '../data/content.js'

const NUMBER_COLORS = ['#073763', '#22d3ee', '#f472b6', '#34d399']

export default function ToolkitSlide({ index }) {
  return (
    <CeSlide index={index}>
      <Card x={58} y={53} w={413} h={590} tone="purple" i={0}>
        <Frame x={38} y={14} w={96} h={96} size={80} bold color="var(--ce-lilac)" aria-hidden="true">
          {toolkit.quoteMark}
        </Frame>
        <Frame as="blockquote" x={38} y={110} w={336} h={192} size={26} bold italic color="#fff">
          <Editable id="toolkit.quote">{toolkit.quote}</Editable>
        </Frame>
        <Frame x={38} y={307} w={336} h={58} size={12} color="var(--ce-lilac)">
          <Editable id="toolkit.attribution">{toolkit.attribution}</Editable>
        </Frame>
        <Box x={38} y={393} w={336} h={1} style={{ background: 'var(--ce-violet)' }} />
        <Frame x={38} y={413} w={336} h={77} size={44} bold color="#fff">
          <Stat id="toolkit.stat" value={toolkit.stat} slide={index} />
        </Frame>
        <Frame x={38} y={489} w={336} h={58} size={13} color="#fff">
          <Editable id="toolkit.statText">{toolkit.statText}</Editable>
        </Frame>
        <Frame x={38} y={547} w={336} h={29} size={10} italic color="var(--ce-lilac)">
          <Editable id="toolkit.statSource">{toolkit.statSource}</Editable>
        </Frame>
      </Card>

      <Kicker id="toolkit.kicker" x={509} y={53} w={720} middle={false} i={1}>
        {toolkit.kicker}
      </Kicker>
      <Title id="toolkit.title" x={509} y={84} w={720} h={58} size={28} i={2}>
        {toolkit.title}
      </Title>

      <GridList id="toolkit.lenses" items={toolkit.lenses} x={509} y={173} cols={2} cellW={342} cellH={230} colGap={29} rowGap={29}>
        {(lens, i) => (
          <Card w={342} h={230} i={3 + i}>
            <Frame x={29} y={24} w={96} h={43} size={22} bold color={NUMBER_COLORS[i % 4]}>
              {seq(i)}
            </Frame>
            <Frame as="h3" x={29} y={72} w={285} h={38} size={19} bold>
              <Editable id={`toolkit.lenses.${lens.id}.title`}>{lens.title}</Editable>
            </Frame>
            <Frame x={29} y={115} w={285} h={106} size={13}>
              <Editable id={`toolkit.lenses.${lens.id}.text`}>{lens.text}</Editable>
            </Frame>
          </Card>
        )}
      </GridList>
    </CeSlide>
  )
}
