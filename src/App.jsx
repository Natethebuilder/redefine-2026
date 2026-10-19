import { useEffect } from 'react'
import { InlineEditProvider, Navigation, SlideErrorBoundary, SlideProvider } from '@deckio/deck-engine'
import '@deckio/deck-engine/styles/editable.css'
import project from '../deck.config.js'
import inlineEdits from './data/inline-edits.json'
import LiveLayer from './live/LiveLayer.jsx'

// Text edited in the dev server is saved to inline-edits.json. This deck ships
// those edits to production too, so what you rehearse is what gets published.
const overrides = inlineEdits

export default function App() {
  const { accent, id, slides, theme, title, hiddenSlides } = project

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
    document.title = title
  }, [accent, title])

  return (
    <InlineEditProvider overrides={overrides} project={id}>
      <SlideProvider totalSlides={slides.length} project={id} slides={slides} theme={theme} hiddenSlides={hiddenSlides}>
        <Navigation />
        <LiveLayer slides={slides} />
        <div className="deck" data-project-id={id}>
          {slides.map((SlideComponent, index) => (
            <SlideErrorBoundary key={`${id}-slide-${index}`} index={index}>
              <SlideComponent index={index} project={project} />
            </SlideErrorBoundary>
          ))}
        </div>
      </SlideProvider>
    </InlineEditProvider>
  )
}
