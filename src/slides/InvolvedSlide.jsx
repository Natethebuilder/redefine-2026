import { Editable } from '@deckio/deck-engine'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import GridList from '../components/GridList.jsx'
import QrCode from '../components/QrCode.jsx'
import { Box, Card, Frame, accent, seq } from '../components/primitives.jsx'
import { SITE_URL, involved } from '../data/content.js'

export default function InvolvedSlide({ index }) {
  return (
    <CeSlide index={index}>
      <Kicker id="involved.kicker">{involved.kicker}</Kicker>
      <Title id="involved.title" w={768}>
        {involved.title}
      </Title>

      <GridList id="involved.ways" items={involved.ways} x={58} y={168} cellW={778} cellH={134} rowGap={19.5}>
        {(way, i) => (
          <Card w={778} h={134} i={2 + i}>
            <Frame x={33} y={29} w={86} h={77} size={36} bold color={accent(i)}>
              {seq(i)}
            </Frame>
            <Frame as="h3" x={134} y={19} w={614} h={38} size={20} bold>
              <Editable id={`involved.ways.${way.id}.title`}>{way.title}</Editable>
            </Frame>
            <Frame x={134} y={60} w={619} h={69} size={13}>
              <Editable id={`involved.ways.${way.id}.text`}>{way.text}</Editable>
            </Frame>
          </Card>
        )}
      </GridList>

      <Card x={874} y={168} w={348} h={442} className="ce-panel" i={5}>
        <Box x={35} y={29} w={278} h={278}>
          <QrCode className="ce-qr" value={SITE_URL} label="QR code: connectedu.world" />
        </Box>
        <Frame x={19} y={317} w={310} h={62} size={15} bold color="var(--ce-ink)" align="center">
          <Editable id="involved.stand">{involved.stand}</Editable>
        </Frame>
        <Frame x={19} y={384} w={310} h={29} size={12} color="var(--ce-purple)" align="center">
          <Editable id="involved.email">{involved.email}</Editable>
        </Frame>
      </Card>
    </CeSlide>
  )
}
