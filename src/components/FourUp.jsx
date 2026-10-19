import { Editable } from '@deckio/deck-engine'
import CeSlide, { Kicker, Title } from './CeSlide.jsx'
import GridList from './GridList.jsx'
import { Card, Frame, accent, seq } from './primitives.jsx'

/** Kicker, title and four large numbered cards (slides 8 and 9). */
export default function FourUp({ index, id, data }) {
  return (
    <CeSlide index={index}>
      <Kicker id={`${id}.kicker`}>{data.kicker}</Kicker>
      <Title id={`${id}.title`}>{data.title}</Title>

      <GridList id={`${id}.items`} items={data.items} x={58} y={182} cols={2} cellW={568} cellH={211} colGap={28} rowGap={29}>
        {(item, i) => (
          <Card w={568} h={211} i={2 + i}>
            <Frame x={38} y={39} w={115} h={86} size={48} bold color={accent(i)}>
              {seq(i)}
            </Frame>
            <Frame as="h3" x={168} y={44} w={362} h={43} size={22} bold>
              <Editable id={`${id}.items.${item.id}.title`}>{item.title}</Editable>
            </Frame>
            <Frame x={168} y={96} w={362} h={96} size={15}>
              <Editable id={`${id}.items.${item.id}.text`}>{item.text}</Editable>
            </Frame>
          </Card>
        )}
      </GridList>
    </CeSlide>
  )
}
