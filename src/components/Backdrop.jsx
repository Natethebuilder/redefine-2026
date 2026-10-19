import cover from '../data/media/bg-cover.jpg'
import map from '../data/media/bg-map.jpg'
import closing from '../data/media/bg-closing.jpg'

const SOURCES = { cover, map, closing }

/** Full-bleed slide background. Hero variants drift slowly while on screen. */
export default function Backdrop({ variant = 'map' }) {
  const hero = variant !== 'map'
  return (
    <div className={`ce-backdrop${hero ? ' ce-backdrop--hero' : ''}`} aria-hidden="true">
      <img className="ce-backdrop__img" src={SOURCES[variant]} alt="" decoding="async" draggable="false" />
      {!hero && <div className="ce-backdrop__shade" />}
    </div>
  )
}
