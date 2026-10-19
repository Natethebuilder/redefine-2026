import { Editable } from '@deckio/deck-engine'
import { useMemo } from 'react'
import QrCode from '../components/QrCode.jsx'
import { Box, Card, Frame } from '../components/primitives.jsx'
import { voteUrl } from './config.js'
import { useLive } from './store.js'

/** One-line connection summary for a live results view. */
export function liveStatus(results, hidden) {
  const voters = results.data?.voters ?? 0
  if (results.status === 'unconfigured') return { tone: 'off', text: 'Voting offline' }
  if (results.error?.code === 'not-installed') return { tone: 'off', text: 'Voting not set up' }
  if (!results.data) return { tone: 'wait', text: results.status === 'offline' ? 'Reconnecting…' : 'Connecting…' }
  if (results.status === 'offline') return { tone: 'wait', text: 'Reconnecting…' }
  if (hidden) return { tone: 'hidden', text: `Results hidden · ${voters} voted` }
  return { tone: 'live', text: voters ? `Live · ${voters} voted` : 'Live · waiting for votes' }
}

/** White "scan to vote" card that replaces the Mentimeter code pill. */
export default function JoinCard({ id, screen, results, x = 1010, y = 38, i = 2 }) {
  const hidden = useLive((s) => s.resultsHidden)
  const url = useMemo(() => voteUrl(screen), [screen])
  const status = liveStatus(results, hidden)

  return (
    <Card x={x} y={y} w={212} h={232} i={i} className="ce-join">
      <Frame x={0} y={0} w={212} h={30} size={11} bold color="var(--ce-ink)" align="center" middle className="ce-join__head ce-label">
        <Editable id={id}>SCAN TO VOTE</Editable>
      </Frame>
      <Box x={22} y={38} w={168} h={168}>
        <QrCode className="ce-qr" value={url} label="QR code: open the voting page on your phone" />
      </Box>
      <Frame x={8} y={207} w={196} h={20} size={10} bold align="center" middle className={`ce-join__status is-${status.tone}`}>
        <span className="ce-join__dot" aria-hidden="true" />
        {status.text}
      </Frame>
    </Card>
  )
}
