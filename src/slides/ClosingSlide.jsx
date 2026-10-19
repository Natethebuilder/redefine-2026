import { Editable } from '@deckio/deck-engine'
import CeSlide from '../components/CeSlide.jsx'
import QrCode from '../components/QrCode.jsx'
import { Box, Frame } from '../components/primitives.jsx'
import { SITE_URL, closing } from '../data/content.js'
import logo from '../data/media/logo-white.png'

export default function ClosingSlide({ index }) {
  return (
    <CeSlide index={index} bg="closing" footer={false}>
      <Box x={58} y={58} w={250} h={48} i={0} fade>
        <img className="ce-img" src={logo} alt="ConnectEdu" draggable="false" />
      </Box>

      <Frame as="h2" x={58} y={182} w={768} h={154} size={40} bold color="#fff" className="ce-hero-title" i={1}>
        <Editable id="closing.title">{closing.title}</Editable>
      </Frame>

      <Frame x={58} y={355} w={576} h={48} size={24} color="var(--ce-lilac)" i={2}>
        <Editable id="closing.questions">{closing.questions}</Editable>
      </Frame>

      <Frame x={58} y={466} w={672} h={115} size={16} color="var(--ce-lilac)" i={3}>
        {closing.contacts.map((contact, n) => (
          <div key={contact.id} style={n ? { marginTop: 5.33 } : undefined}>
            <Editable id={`closing.contacts.${contact.id}.name`} style={{ fontWeight: 700, color: '#fff' }}>
              {contact.name}
            </Editable>
            <Editable id={`closing.contacts.${contact.id}.email`}>{contact.email}</Editable>
          </div>
        ))}
        <div style={{ marginTop: 5.33 }}>
          <Editable id="closing.linkedin">{closing.linkedin}</Editable>
        </div>
      </Frame>

      <Box x={979} y={192} w={240} h={240} i={4} fade>
        <QrCode className="ce-qr" value={SITE_URL} color="#fff" label="QR code: connectedu.world" />
      </Box>
      <Frame x={979} y={446} w={240} h={38} size={18} bold color="#fff" align="center" i={4} fade>
        <Editable id="closing.url">{closing.url}</Editable>
      </Frame>
    </CeSlide>
  )
}
