import { Editable, useSlides } from '@deckio/deck-engine'
import { Fragment } from 'react'
import CeSlide, { Kicker, Title } from '../components/CeSlide.jsx'
import GridList from '../components/GridList.jsx'
import { Card, Frame, accent } from '../components/primitives.jsx'
import { childhood } from '../data/content.js'
import JoinCard from '../live/JoinCard.jsx'
import { useLive } from '../live/store.js'
import { sharesOf, useLiveResults } from '../live/useLiveResults.js'
import { useTween } from '../live/useTween.js'

const LETTERS = childhood.options.map((o) => o.letter)

function Percent({ value }) {
  return `${Math.round(useTween(value, 900, 0))}%`
}

export default function ChildhoodSlide({ index }) {
  const { current } = useSlides()
  const results = useLiveResults('childhood', current === index)
  const hidden = useLive((s) => s.resultsHidden)

  const counts = results.data?.polls?.childhood?.counts
  const { total, pct, share } = sharesOf(counts, LETTERS)
  const show = total > 0 && !hidden
  const byLetter = Object.fromEntries(
    LETTERS.map((letter, k) => [letter, { n: Number(counts?.[letter]) || 0, pct: pct[k], share: share[k] }]),
  )
  const top = Math.max(...LETTERS.map((l) => byLetter[l].n))
  const leaders = LETTERS.filter((l) => byLetter[l].n === top)
  const lead = show && leaders.length === 1 ? leaders[0] : null

  return (
    <CeSlide index={index}>
      <Kicker id="childhood.kicker" y={83}>
        {childhood.kicker}
      </Kicker>
      <Title id="childhood.title" y={115} w={930} h={67} size={36}>
        {childhood.title}
      </Title>
      <Frame x={58} y={187} w={930} h={48} size={24} color="var(--ce-lilac)" i={2}>
        <Editable id="childhood.subtitle">{childhood.subtitle}</Editable>
      </Frame>

      <JoinCard id="childhood.join" screen="childhood" results={results} i={3} />

      <GridList id="childhood.options" items={childhood.options} x={58} y={288} cols={4} cellW={270} cellH={298} colGap={28.33}>
        {(option, i) => {
          const r = byLetter[option.letter] || { n: 0, pct: 0, share: 0 }
          const color = accent(i)
          return (
            <Card
              w={270}
              h={298}
              i={4 + i}
              className={`ce-choice${lead === option.letter ? ' ce-choice--lead' : ''}`}
              style={{ '--ce-accent': color }}
            >
              <div className="ce-choice__fill" style={{ '--share': show ? r.share : 0 }} aria-hidden="true" />
              <Frame x={33} y={34} w={144} h={96} size={60} bold color={color}>
                {option.letter}
              </Frame>
              {show && (
                <>
                  <Frame x={120} y={68} w={117} h={49} size={30} bold color={color} align="right" className="ce-choice__pct">
                    <Percent key={current === index ? 'on' : 'off'} value={r.pct} />
                  </Frame>
                  <Frame x={120} y={117} w={117} h={20} size={11} bold color="var(--ce-slate)" align="right">
                    {r.n} {r.n === 1 ? 'vote' : 'votes'}
                  </Frame>
                </>
              )}
              <Frame x={33} y={168} w={202} h={96} size={20} bold>
                {option.lines.map((line, k) => (
                  <Fragment key={k}>
                    {k > 0 && '\n'}
                    <Editable id={`childhood.options.${option.id}.lines.${k}`}>{line}</Editable>
                  </Fragment>
                ))}
              </Frame>
            </Card>
          )
        }}
      </GridList>
    </CeSlide>
  )
}

ChildhoodSlide.liveScreen = 'childhood'
