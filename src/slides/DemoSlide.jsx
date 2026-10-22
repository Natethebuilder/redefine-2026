import { Editable } from '@deckio/deck-engine'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import GridList from '../components/GridList.jsx'
import QrCode from '../components/QrCode.jsx'
import { Box, Card, Frame, pt } from '../components/primitives.jsx'
import { SURVEY_URL, demo } from '../data/content.js'

const DOT_COLORS = ['#a78bfa', '#22d3ee', '#f472b6', '#34d399', '#a78bfa']
const STEP = 53
const STEP_GAP = 28.5

export default function DemoSlide({ index }) {
  const last = 192 + (demo.steps.length - 1) * (STEP + STEP_GAP)
  return (
    <CeSlide index={index}>
      <Kicker id="demo.kicker">{demo.kicker}</Kicker>
      <Title id="demo.title" w={720}>
        {demo.title}
      </Title>

      <Box x={58 + STEP / 2 - 1} y={192 + STEP / 2} w={2} h={last - 192} className="ce-steps-line" i={2} fade />

      <GridList id="demo.steps" items={demo.steps} x={58} y={192} cellW={705} cellH={STEP} rowGap={STEP_GAP}>
        {(step, i) => (
          <Box w={705} h={STEP} i={3 + i}>
            <div
              className="ce-step-dot"
              style={{ left: 0, top: 0, width: STEP, height: STEP, fontSize: pt(16), '--ce-dot': DOT_COLORS[i % DOT_COLORS.length] }}
            >
              {i + 1}
            </div>
            <Frame x={81} y={0} w={624} h={STEP} size={20} color="var(--ce-paper)" middle>
              <Editable id={`demo.steps.${step.id}.text`}>{step.text}</Editable>
            </Frame>
          </Box>
        )}
      </GridList>

      <Card x={835} y={154} w={387} h={442} className="ce-panel" i={4}>
        <Box x={45} y={33} w={298} h={298}>
          <QrCode className="ce-qr" value={SURVEY_URL} label="QR code: connectedu.world/survey" />
        </Box>
        <Frame x={0} y={355} w={387} h={48} size={20} bold color="var(--ce-purple)" align="center">
          <Editable id="demo.url">{demo.url}</Editable>
        </Frame>
      </Card>
    </CeSlide>
  )
}
