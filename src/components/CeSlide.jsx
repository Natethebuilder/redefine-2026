import { Editable, Slide } from '@deckio/deck-engine'
import Backdrop from './Backdrop.jsx'
import Stage from './Stage.jsx'
import { Frame } from './primitives.jsx'
import { footer } from '../data/content.js'

function Footer() {
  return (
    <>
      <Frame x={58} y={672} w={384} h={24} size={10} color="var(--ce-slate)" middle>
        <Editable id="footer.left">{footer.left}</Editable>
      </Frame>
      <Frame x={838} y={672} w={384} h={24} size={10} color="var(--ce-slate)" align="right" middle>
        <Editable id="footer.right">{footer.right}</Editable>
      </Frame>
    </>
  )
}

/** A ConnectEdu slide: background, scaled 1280×720 stage and footer. */
export default function CeSlide({ index, bg = 'map', footer: showFooter = true, className = '', children }) {
  return (
    <Slide index={index} className={`ce-slide ${className}`.trim()}>
      <Backdrop variant={bg} />
      <Stage>
        {children}
        {showFooter && <Footer />}
      </Stage>
    </Slide>
  )
}

/** Small all-caps label above a slide title (cyan by default). */
export function Kicker({ id, children, x = 58, y = 43, w = 864, h = 29, color = 'var(--ce-cyan)', middle = true, i = 0 }) {
  return (
    <Frame x={x} y={y} w={w} h={h} size={11} bold color={color} middle={middle} i={i} className="ce-label">
      <Editable id={id}>{children}</Editable>
    </Frame>
  )
}

/** Slide title in the original 1165px-wide frame. */
export function Title({ id, children, x = 58, y = 75, w = 1165, h = 72, size = 32, i = 1, as = 'h2', className = '' }) {
  return (
    <Frame as={as} x={x} y={y} w={w} h={h} size={size} bold color="#fff" i={i} className={`ce-title ${className}`.trim()}>
      <Editable id={id}>{children}</Editable>
    </Frame>
  )
}
