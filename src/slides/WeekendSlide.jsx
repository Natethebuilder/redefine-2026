import { Editable } from '@deckio/deck-engine'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import GridList from '../components/GridList.jsx'
import { Arrow, Box, Card, Frame, accent } from '../components/primitives.jsx'
import { weekend } from '../data/content.js'

export default function WeekendSlide({ index }) {
  return (
    <CeSlide index={index}>
      <Kicker id="weekend.kicker">{weekend.kicker}</Kicker>
      <Title id="weekend.title" size={30}>
        {weekend.title}
      </Title>

      <Frame x={58} y={156} w={480} h={24} size={11} bold color="#fff" className="ce-label" i={2}>
        <Editable id="weekend.heard">{weekend.heard}</Editable>
      </Frame>
      <Frame x={648} y={156} w={576} h={24} size={11} bold color="#fff" className="ce-label" i={2}>
        <Editable id="weekend.responds">{weekend.responds}</Editable>
      </Frame>

      <GridList id="weekend.rows" items={weekend.rows} x={58} y={190} cellW={1164} cellH={104} rowGap={13}>
        {(row, i) => (
          <>
            <Card w={552} h={104} i={3 + i * 2}>
              <Frame x={28} y={19} w={499} h={43} size={17} bold italic={row.italic} color={accent(i)}>
                <Editable id={`weekend.rows.${row.id}.quote`}>{row.quote}</Editable>
              </Frame>
              <Frame x={28} y={63} w={499} h={29} size={12}>
                <Editable id={`weekend.rows.${row.id}.who`}>{row.who}</Editable>
              </Frame>
            </Card>
            <Box x={556} y={28} w={38} h={48} i={4 + i * 2} className="ce-center">
              <Arrow width={26} height={22} stroke={3} color={accent(i)} />
            </Box>
            <Card x={590} w={574} h={104} i={4 + i * 2}>
              <Frame x={29} y={19} w={517} h={75} size={14} middle>
                <Editable id={`weekend.rows.${row.id}.response`}>{row.response}</Editable>
              </Frame>
            </Card>
          </>
        )}
      </GridList>
    </CeSlide>
  )
}
