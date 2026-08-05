import { IconArrowBigUpLine, IconArrowBigUpLineFilled } from '@tabler/icons-react'
import { Button, Tooltip } from '@mantine/core'

export default function PortfolioUpvote({
  count,
  hasUpvoted,
  isOwnPortfolio,
  onToggle,
  disabled = false,
}) {
  const countLabel = `${count} endosso${count !== 1 ? 's' : ''}`

  const buildTitle = () => {
    if (isOwnPortfolio) {
      return 'Você não pode endossar sua própria participação'
    }
    if (disabled) {
      return countLabel
    }
    return hasUpvoted ? 'Remover endosso' : 'Endossar esta participação'
  }

  return (
    <Tooltip
      withArrow
      arrowSize={7}
      label={buildTitle()}
      position="bottom"
      offset={5}
      color="dark"
    >
      <Button.Group
        component="span"
        mt="xs"
        style={{
          display: 'inline-flex',
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <Button
          variant="default"
          size="compact-xs"
          px={2}
          onClick={disabled ? undefined : onToggle}
          disabled={isOwnPortfolio}
          aria-disabled={disabled}
          aria-pressed={hasUpvoted}
          aria-label={
            disabled
              ? countLabel
              : hasUpvoted
                ? 'Remover endosso'
                : 'Endossar esta participação'
          }
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            pointerEvents: 'auto',
          }}
        >
          {hasUpvoted ? (
            <IconArrowBigUpLineFilled size={14} color="var(--mantine-color-teal-text)" />
          ) : (
            <IconArrowBigUpLine size={14} color="var(--mantine-color-teal-text)" />
          )}
        </Button>
        <Button.GroupSection
          variant="default"
          bg="var(--mantine-color-body)"
          size="compact-xs"
          miw={12}
          px={4}
          fz="10px"
          fw={400}
          lh={0}
          flex={1}
        >
          {count}
        </Button.GroupSection>
      </Button.Group>
    </Tooltip>
  )
}
