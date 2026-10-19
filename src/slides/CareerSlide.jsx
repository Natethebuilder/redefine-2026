import { Editable, useSlides } from '@deckio/deck-engine'
import { useMemo } from 'react'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import { Box, Card, Frame, accent } from '../components/primitives.jsx'
import { career } from '../data/content.js'
import JoinCard from '../live/JoinCard.jsx'
import WordCloud from '../live/WordCloud.jsx'
import { hasProfanity } from '../live/profanity.js'
import { useLive } from '../live/store.js'
import { useLiveResults } from '../live/useLiveResults.js'

const CLOUD = { x: 58, y: 196, w: 932, h: 454, pad: 22 }
const TOP = 6

export default function CareerSlide({ index }) {
  const { current } = useSlides()
  const results = useLiveResults('career', current === index)
  const hidden = useLive((s) => s.resultsHidden)

  const poll = results.data?.polls?.career
  const words = useMemo(() => (poll?.words || []).filter((w) => w.text && !hasProfanity(w.text)), [poll])
  const show = words.length > 0 && !hidden

  return (
    <CeSlide index={index}>
      <Kicker id="career.kicker">{career.kicker}</Kicker>
      <Title id="career.title" w={930} h={59} size={36}>
        {career.title}
      </Title>
      <Frame x={58} y={140} w={930} h={36} size={22} color="var(--ce-lilac)" i={2}>
        <Editable id="career.prompt">{career.prompt}</Editable>
      </Frame>

      <JoinCard id="career.join" screen="career" results={results} i={3} />

      <Box x={CLOUD.x} y={CLOUD.y} w={CLOUD.w} h={CLOUD.h} i={4} fade className="ce-cloud-panel">
        {show ? (
          <WordCloud
            words={words}
            width={CLOUD.w - CLOUD.pad * 2}
            height={CLOUD.h - CLOUD.pad * 2}
            style={{ left: CLOUD.pad, top: CLOUD.pad }}
          />
        ) : (
          <div className="ce-empty">
            <div className="ce-empty__title">{hidden && poll?.entries ? 'Results hidden' : 'Your answers will appear here'}</div>
            <div className="ce-empty__hint">
              {hidden && poll?.entries
                ? `${poll.entries} ${poll.entries === 1 ? 'answer' : 'answers'} so far`
                : 'Scan the code to add up to three careers'}
            </div>
          </div>
        )}
      </Box>

      <Card x={1010} y={290} w={212} h={360} tone="navy" i={5} className="ce-top">
        <Frame x={20} y={18} w={172} h={20} size={11} bold color="var(--ce-cyan)" className="ce-label" middle>
          <Editable id="career.top">TOP ANSWERS</Editable>
        </Frame>
        <ol className="ce-top__list">
          {(show ? words.slice(0, TOP) : []).map((w, k) => (
            <li key={w.text.toLowerCase()} className="ce-top__row">
              <span className="ce-top__rank" style={{ color: accent(k) }}>
                {k + 1}
              </span>
              <span className="ce-top__text">{w.text}</span>
              <span className="ce-top__n">{w.n}</span>
            </li>
          ))}
        </ol>
        {!show && <div className="ce-top__empty">{hidden ? 'Hidden for now' : 'No answers yet'}</div>}
      </Card>
    </CeSlide>
  )
}

CareerSlide.liveScreen = 'career'
