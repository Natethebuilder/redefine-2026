import FourUp from '../components/FourUp.jsx'
import { pilot } from '../data/content.js'

export default function PilotSlide({ index }) {
  return <FourUp index={index} id="pilot" data={pilot} />
}
