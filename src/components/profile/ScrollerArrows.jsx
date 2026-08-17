import { Group } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { memo } from 'react'

const SIZE_MAP = {
  sm: { size: 22, stroke: 1.6, gap: 2 }, // lateral - Inspirações, Parceiros
  md: { size: 32, stroke: 1.2, gap: 4 }, // principal - gear, posts
  lg: { size: 28, stroke: 1.4, gap: 4 }, // médio - upcoming events
}

function ScrollerArrowsBase({
  scroller,
  sizePreset = 'md',
  ariaLabels = { prev: 'Voltar', next: 'Avançar' },
}) {
  const cfg = SIZE_MAP[sizePreset] || SIZE_MAP.md

  const handleMouseDown = (e) => {
    // Previne seleção de texto no double-click
    e.preventDefault()
  }

  const baseStyle = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
  }

  return (
    <Group gap={cfg.gap} visibleFrom="sm" style={baseStyle}>
      <IconChevronLeft
        size={cfg.size}
        stroke={cfg.stroke}
        style={{
          ...baseStyle,
          cursor: scroller.canScrollStart ? 'pointer' : 'default',
          flexShrink: 0,
        }}
        onMouseDown={handleMouseDown}
        onClick={scroller.scrollStart}
        opacity={scroller.canScrollStart ? 0.7 : 0.2}
        color="var(--mantine-color-text)"
        role="button"
        tabIndex={scroller.canScrollStart ? 0 : -1}
        aria-label={ariaLabels.prev}
        aria-disabled={!scroller.canScrollStart}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (scroller.canScrollStart) {
              scroller.scrollStart()
            }
          }
        }}
      />
      <IconChevronRight
        size={cfg.size}
        stroke={cfg.stroke}
        style={{
          ...baseStyle,
          cursor: scroller.canScrollEnd ? 'pointer' : 'default',
          flexShrink: 0,
        }}
        onMouseDown={handleMouseDown}
        onClick={scroller.scrollEnd}
        opacity={scroller.canScrollEnd ? 0.7 : 0.2}
        color="var(--mantine-color-text)"
        role="button"
        tabIndex={scroller.canScrollEnd ? 0 : -1}
        aria-label={ariaLabels.next}
        aria-disabled={!scroller.canScrollEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (scroller.canScrollEnd) {
              scroller.scrollEnd()
            }
          }
        }}
      />
    </Group>
  )
}

export const ScrollerArrows = memo(ScrollerArrowsBase)
