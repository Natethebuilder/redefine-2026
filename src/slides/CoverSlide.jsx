import { Editable } from '@deckio/deck-engine'
import CeSlide from '../components/CeSlide.jsx'
import QrCode from '../components/QrCode.jsx'
import { Box, Frame } from '../components/primitives.jsx'
import { SITE_URL, cover } from '../data/content.js'
import logo from '../data/media/logo-white.png'

export default function CoverSlide({ index }) {
  return (
    <CeSlide index={index} bg="cover" footer={false}>
      <Box x={58} y={58} w={250} h={48} i={0} fade>
        <img className="ce-img" src={logo} alt="ConnectEdu" draggable="false" />
      </Box>

      <Frame x={58} y={168} w={768} h={29} size={14} bold color="var(--ce-violet)" className="ce-label" i={1}>
        <Editable id="cover.kicker">{cover.kicker}</Editable>
      </Frame>

      <Frame as="h1" x={58} y={211} w={1056} h={115} size={66} bold color="#fff" className="ce-hero-title" i={2}>
        <Editable id="cover.title.lead">{cover.titleLead}</Editable>
        <Editable id="cover.title.accent" className="ce-glow-pink">
          {cover.titleAccent}
        </Editable>
      </Frame>

      <Frame x={58} y={350} w={806} h={86} size={20} color="var(--ce-lilac)" i={3}>
        <Editable id="cover.subtitle">{cover.subtitle}</Editable>
      </Frame>

      <Frame x={58} y={514} w={864} h={34} size={16} bold color="#fff" i={4}>
        <Editable id="cover.speakers">{cover.speakers}</Editable>
      </Frame>

      <Frame x={58} y={557} w={864} h={29} size={14} color="var(--ce-lilac)" i={5}>
        <Editable id="cover.event">{cover.event}</Editable>
      </Frame>

      <Box x={1042} y={451} w={178} h={178} i={6} fade>
        <QrCode className="ce-qr" value={SITE_URL} color="#fff" label="QR code: connectedu.world" />
      </Box>
      <Frame x={994} y={638} w={226} h={29} size={12} color="var(--ce-lilac)" align="right" i={6} fade>
        <Editable id="cover.url">{cover.url}</Editable>
      </Frame>
    </CeSlide>
  )
}
