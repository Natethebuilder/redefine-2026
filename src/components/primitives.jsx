/**
 * Layout primitives that mirror PowerPoint shapes on the 1280×720 stage.
 * Coordinates come straight from the original deck (in px); font sizes are in
 * PowerPoint points and converted with `pt()`.
 */

export const pt = (n) => `${Math.round((n * 4000) / 3) / 1000}px`

const join = (...parts) => parts.filter(Boolean).join(' ')

function motion(i, fade) {
  if (i == null) return { cls: '', style: null }
  return { cls: fade ? 'ce-in-fade' : 'ce-in', style: { '--i': i } }
}

/** Absolutely positioned text frame (zero insets, top or middle anchored). */
export function Frame({
  x = 0,
  y = 0,
  w,
  h,
  size,
  bold,
  italic,
  color,
  align,
  middle,
  nowrap,
  i,
  fade,
  as: Tag = 'div',
  className,
  style,
  children,
  ...rest
}) {
  const m = motion(i, fade)
  const frameStyle = {
    left: x,
    top: `calc(${y}px + var(--ppt-shift))`,
    width: w,
    height: h,
    fontSize: size ? pt(size) : undefined,
    fontWeight: bold ? 700 : undefined,
    fontStyle: italic ? 'italic' : undefined,
    color,
    textAlign: align,
    whiteSpace: nowrap ? 'nowrap' : undefined,
    ...m.style,
    ...style,
  }
  return (
    <Tag className={join('ce-frame', middle && 'ce-mid', m.cls, className)} style={frameStyle} {...rest}>
      {middle ? <div className="ce-mid__inner">{children}</div> : children}
    </Tag>
  )
}

/** Absolutely positioned box for panels, cards and images. */
export function Box({ x = 0, y = 0, w, h, i, fade, as: Tag = 'div', className, style, children, ...rest }) {
  const m = motion(i, fade)
  return (
    <Tag
      className={join('ce-box', m.cls, className)}
      style={{ left: x, top: y, width: w, height: h, ...m.style, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** White (default), navy, deep or purple card at an absolute position. */
export function Card({ x = 0, y = 0, w, h, tone, i, as: Tag = 'div', className, style, children, ...rest }) {
  const m = motion(i)
  return (
    <Tag
      className={join('ce-card', tone && `ce-card--${tone}`, m.cls, className)}
      style={{ left: x, top: y, width: w, height: h, ...m.style, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** Crisp vector replacement for the "→" glyph used in the deck. */
export function Arrow({ width = 26, height = 18, color = 'currentColor', stroke = 2.6, className, style }) {
  const mid = height / 2
  const head = height / 2 + 1
  return (
    <svg
      className={join('ce-arrow', className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d={`M${stroke / 2} ${mid}H${width - stroke}`} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <path
        d={`M${width - head} ${stroke / 2 + 0.5}L${width - stroke / 2} ${mid}L${width - head} ${height - stroke / 2 - 0.5}`}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const ACCENTS = ['#a78bfa', '#22d3ee', '#f472b6', '#34d399', '#c4b5fd']
export const accent = (i) => ACCENTS[i % ACCENTS.length]

/** Two-digit sequence number ("01", "02", …) that follows the rendered order. */
export const seq = (i) => String(i + 1).padStart(2, '0')
