import { EditableList } from '@deckio/deck-engine'

const keyOfId = (item) => item.id

/**
 * A reorderable list laid out as a fixed grid on the stage. Cells reproduce
 * the original deck's card positions; drag to reorder while authoring.
 */
export default function GridList({
  id,
  items,
  x,
  y,
  cols = 1,
  cellW,
  cellH,
  colGap = 0,
  rowGap = 0,
  className = '',
  children,
}) {
  const rows = Math.ceil(items.length / cols)
  return (
    <EditableList
      id={id}
      items={items}
      keyOf={keyOfId}
      className={`ce-list ${className}`.trim()}
      itemClassName="ce-item"
      style={{
        left: x,
        top: y,
        width: cols * cellW + (cols - 1) * colGap,
        height: rows * cellH + (rows - 1) * rowGap,
        gridTemplateColumns: `repeat(${cols}, ${cellW}px)`,
        gridAutoRows: `${cellH}px`,
        columnGap: colGap,
        rowGap,
      }}
    >
      {children}
    </EditableList>
  )
}
