import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../vote/vote.css'
import './interest.css'
import InterestApp from './InterestApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <InterestApp />
  </StrictMode>,
)
