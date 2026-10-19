const PATHS = {
  check: 'M3.5 8.5l3 3 6-7',
  arrow: 'M3 8h9M8.5 4.5L12 8l-3.5 3.5',
  close: 'M4.5 4.5l7 7M11.5 4.5l-7 7',
  send: 'M2.5 8h10M8.5 3.5L13 8l-4.5 4.5',
}

function Icon({ name }) {
  return (
    <svg className="v-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const Check = () => <Icon name="check" />
export const Arrow = () => <Icon name="arrow" />
export const Close = () => <Icon name="close" />
export const Send = () => <Icon name="send" />
