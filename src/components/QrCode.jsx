import { encode } from 'uqr'
import { useMemo } from 'react'

/** Crisp vector QR code (one SVG path, horizontal module runs). */
export default function QrCode({ value, color = '#1e1b4b', background, ecc = 'Q', border = 1, className, style, label }) {
  const { d, n } = useMemo(() => {
    const { size, data } = encode(value, { ecc, border })
    let path = ''
    for (let y = 0; y < size; y += 1) {
      let x = 0
      while (x < size) {
        if (!data[y][x]) {
          x += 1
          continue
        }
        let run = 1
        while (x + run < size && data[y][x + run]) run += 1
        path += `M${x} ${y}h${run}v1h-${run}z`
        x += run
      }
    }
    return { d: path, n: size }
  }, [value, ecc, border])

  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${n} ${n}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label || `QR code: ${value}`}
    >
      {background && <rect width={n} height={n} fill={background} />}
      <path d={d} fill={color} />
    </svg>
  )
}
