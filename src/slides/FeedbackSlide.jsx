import { Editable, useSlides } from '@deckio/deck-engine'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import { Frame } from '../components/primitives.jsx'
import { feedback } from '../data/content.js'
import JoinCard from '../live/JoinCard.jsx'
import ResponseWall from '../live/ResponseWall.jsx'
import ScalePanel from '../live/ScalePanel.jsx'
import { useLive } from '../live/store.js'
import { useLiveResults } from '../live/useLiveResults.js'

export default function FeedbackSlide({ index }) {
  const { current } = useSlides()
  const results = useLiveResults('feedback', current === index)
  const hidden = useLive((s) => s.resultsHidden)
  const polls = results.data?.polls || {}

  return (
    <CeSlide index={index}>
      <Kicker id="feedback.kicker">{feedback.kicker}</Kicker>
      <Title id="feedback.title" w={930} h={118} size={36} className="ce-balance">
        {feedback.title}
      </Title>
      <Frame x={58} y={200} w={930} h={34} size={20} color="var(--ce-lilac)" i={2}>
        <Editable id="feedback.prompt">{feedback.prompt}</Editable>
      </Frame>

      <JoinCard id="feedback.join" screen="feedback" results={results} i={3} />

      <ScalePanel poll={polls.likelihood} hidden={hidden} x={58} y={284} i={4} />
      <ResponseWall
        id="feedback.wall.label"
        label="BIGGEST ROADBLOCKS"
        poll={polls.roadblock}
        hidden={hidden}
        x={598}
        y={284}
        i={5}
        empty="Roadblocks will appear here"
        hint="Rate 1 to 5 on your phone, then add yours"
      />
    </CeSlide>
  )
}

FeedbackSlide.liveScreen = 'feedback'
