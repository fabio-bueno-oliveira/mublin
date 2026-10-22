import { ActionIcon, Group } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { memo } from 'react'

const SIZE_MAP = {
  sm: { size: 22, stroke: 1.6, gap: 2 },
  md: { size: 32, stroke: 1.2, gap: 4 },
  lg: { size: 28, stroke: 1.4, gap: 4 },
}

export default function ScrollerArrowsBase({
  scroller,
  sizePreset = 'md',
  ariaLabels = { prev: 'Voltar', next: 'Avançar' },
}) {
  const cfg = SIZE_MAP[sizePreset] || SIZE_MAP.md

  return (
    <Group gap={cfg.gap} visibleFrom="sm" wrap="nowrap">
      <ActionIcon
        variant="transparent"
        color="var(--mantine-color-text)"
        size={cfg.size}
        disabled={!scroller.canScrollStart}
        onClick={scroller.scrollStart}
        aria-label={ariaLabels.prev}
        title={ariaLabels.prev}
        style={{
          opacity: scroller.canScrollStart ? 0.7 : 0.2,
          transition: 'opacity 150ms ease',
        }}
      >
        <IconChevronLeft size={cfg.size} stroke={cfg.stroke} />
      </ActionIcon>

      <ActionIcon
        variant="transparent"
        color="var(--mantine-color-text)"
        size={cfg.size}
        disabled={!scroller.canScrollEnd}
        onClick={scroller.scrollEnd}
        aria-label={ariaLabels.next}
        title={ariaLabels.next}
        style={{
          opacity: scroller.canScrollEnd ? 0.7 : 0.2,
          transition: 'opacity 150ms ease',
        }}
      >
        <IconChevronRight size={cfg.size} stroke={cfg.stroke} />
      </ActionIcon>
    </Group>
  )
}

export const ScrollerArrows = memo(ScrollerArrowsBase)
