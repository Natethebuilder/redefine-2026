import FourUp from '../components/FourUp.jsx'
import { safety } from '../data/content.js'

export default function SafetySlide({ index }) {
  return <FourUp index={index} id="safety" data={safety} />
}
