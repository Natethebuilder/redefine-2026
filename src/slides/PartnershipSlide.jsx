import { Editable } from '@deckio/deck-engine'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import { Box, Card, Frame } from '../components/primitives.jsx'
import { partnership } from '../data/content.js'

const OFFERS = [
  { key: 'discoverability', x: 58, y: 168, w: 360, h: 221, textH: 127, color: '#a78bfa' },
  { key: 'handsOn', x: 442, y: 168, w: 384, h: 221, textH: 88, color: '#22d3ee' },
  { key: 'insight', x: 850, y: 168, w: 373, h: 221, textH: 127, color: '#f472b6' },
  { key: 'flexibility', x: 58, y: 413, w: 360, h: 221, textH: 127, color: '#34d399' },
]

function Offer({ offer, i }) {
  const data = partnership[offer.key]
  const id = `partnership.${offer.key}`
  const textW = offer.w - 61
  return (
    <Card x={offer.x} y={offer.y} w={offer.w} h={offer.h} tone="navy" i={i}>
      <Frame x={30} y={29} w={textW} h={24} size={11} bold color={offer.color} className="ce-label">
        <Editable id={`${id}.label`}>{data.label}</Editable>
      </Frame>
      <Frame x={30} y={63} w={textW} h={offer.textH} size={17} color="var(--ce-paper)">
        <Editable id={`${id}.lead`} style={{ fontWeight: 700, color: '#fff' }}>
          {data.lead}
        </Editable>
        <Editable id={`${id}.rest`}>{data.rest}</Editable>
      </Frame>
      {data.chips && (
        <Box x={30} y={159} w={textW} h={31} className="ce-chips" style={{ fontSize: '14.667px' }}>
          {data.chips.map((chip) => (
            <span key={chip.id} className="ce-chip">
              <Editable id={`${id}.chips.${chip.id}`}>{chip.text}</Editable>
            </span>
          ))}
        </Box>
      )}
    </Card>
  )
}

export default function PartnershipSlide({ index }) {
  const { access } = partnership
  return (
    <CeSlide index={index}>
      <Kicker id="partnership.kicker">{partnership.kicker}</Kicker>
      <Title id="partnership.title">{partnership.title}</Title>

      {OFFERS.map((offer, i) => (
        <Offer key={offer.key} offer={offer} i={2 + i} />
      ))}

      <Card x={442} y={413} w={781} h={221} tone="purple" i={6}>
        <Frame x={30} y={29} w={719} h={24} size={11} bold color="var(--ce-lilac)" className="ce-label">
          <Editable id="partnership.access.label">{access.label}</Editable>
        </Frame>
        <Frame as="h3" x={30} y={59} w={719} h={53} size={28} bold color="#fff">
          <Editable id="partnership.access.title">{access.title}</Editable>
        </Frame>
        <Frame x={30} y={125} w={719} h={67} size={16} color="#fff">
          <Editable id="partnership.access.line1">{access.line1}</Editable>
          {'\n'}
          <Editable id="partnership.access.line2">{access.line2}</Editable>
        </Frame>
      </Card>
    </CeSlide>
  )
}
