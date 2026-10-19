import { Editable } from '@deckio/deck-engine'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import GridList from '../components/GridList.jsx'
import { Arrow, Box, Card, Frame } from '../components/primitives.jsx'
import { reimagined } from '../data/content.js'

export default function ReimaginedSlide({ index }) {
  return (
    <CeSlide index={index}>
      <Kicker id="reimagined.kicker">{reimagined.kicker}</Kicker>
      <Title id="reimagined.title">{reimagined.title}</Title>

      <Frame x={58} y={154} w={288} h={24} size={11} bold color="#fff" className="ce-label" i={2}>
        <Editable id="reimagined.from">{reimagined.from}</Editable>
      </Frame>
      <Frame x={672} y={154} w={288} h={24} size={11} bold color="var(--ce-cyan)" className="ce-label" i={2}>
        <Editable id="reimagined.to">{reimagined.to}</Editable>
      </Frame>

      <GridList id="reimagined.rows" items={reimagined.rows} x={58} y={187} cellW={1164} cellH={63} rowGap={12}>
        {(row, i) => (
          <>
            <Card w={552} h={63} className="ce-shift" i={3 + i}>
              <Frame x={24} y={0} w={509} h={63} size={14} bold color="var(--ce-deep-blue)" middle>
                <Editable id={`reimagined.rows.${row.id}.from`}>{row.from}</Editable>
              </Frame>
            </Card>
            <Box x={556} y={0} w={48} h={63} className="ce-center" i={4 + i}>
              <Arrow width={24} height={20} stroke={2.8} color="#22d3ee" />
            </Box>
            <Card x={614} w={550} h={63} className="ce-shift ce-shift--to" i={5 + i}>
              <Frame x={24} y={0} w={502} h={63} size={15} bold middle>
                <Editable id={`reimagined.rows.${row.id}.to`}>{row.to}</Editable>
              </Frame>
            </Card>
          </>
        )}
      </GridList>
    </CeSlide>
  )
}
