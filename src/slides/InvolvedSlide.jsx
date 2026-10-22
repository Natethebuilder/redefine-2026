import { Editable } from '@deckio/deck-engine'
import { useMemo } from 'react'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import GridList from '../components/GridList.jsx'
import QrCode from '../components/QrCode.jsx'
import { Box, Card, Frame, accent, seq } from '../components/primitives.jsx'
import { involved } from '../data/content.js'
import { interestUrl } from '../live/config.js'

export default function InvolvedSlide({ index }) {
  const signupUrl = useMemo(() => interestUrl(), [])

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

      <Card x={874} y={168} w={348} h={442} className="ce-panel ce-panel--scan" i={5}>
        <Frame x={0} y={0} w={348} h={40} size={13} bold color="var(--ce-ink)" align="center" middle className="ce-join__head ce-label">
          <Editable id="involved.scan">SCAN TO GET INVOLVED</Editable>
        </Frame>
        <Box x={49} y={57} w={250} h={250}>
          <QrCode className="ce-qr" value={signupUrl} label="QR code: open the get-involved sign-up page on your phone" />
        </Box>
        <Frame x={19} y={322} w={310} h={62} size={15} bold color="var(--ce-ink)" align="center" className="ce-balance">
          <Editable id="involved.stand">{involved.stand}</Editable>
        </Frame>
        <Frame x={19} y={390} w={310} h={29} size={12} color="var(--ce-purple)" align="center">
          <Editable id="involved.email">{involved.email}</Editable>
        </Frame>
      </Card>
    </CeSlide>
  )
}

// Phones in the room switch to the "get involved" invite on this slide.
InvolvedSlide.liveScreen = 'involved'
