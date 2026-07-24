import { IconArrowBigUpLine, IconArrowBigUpLineFilled } from '@tabler/icons-react'
import { Text, Box, useMantineTheme, Tooltip } from '@mantine/core'

export default function PortfolioUpvote({
  count,
  hasUpvoted,
  isOwnPortfolio,
  onToggle,
  disabled = false,
}) {
  const theme = useMantineTheme()

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
      <Box
        mt="xs"
        component="button"
        type="button"
        onClick={disabled ? undefined : onToggle}
        aria-disabled={disabled}
        aria-pressed={hasUpvoted}
        aria-label={
          disabled
            ? countLabel
            : hasUpvoted
              ? 'Remover endosso'
              : 'Endossar esta participação'
        }
        bg={hasUpvoted ? 'mublinSecondary.1' : 'transparent'}
        c={hasUpvoted ? 'mublinSecondary.6' : 'dimmed'}
        bd={`1px solid ${
          hasUpvoted ? theme.colors.mublinSecondary[1] : 'var(--mantine-color-dimmed)'
        }`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px 2px 6px',
          borderRadius: 999,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          transition: 'all 0.15s ease',
          userSelect: 'none',
          pointerEvents: 'auto',
        }}
        styles={{
          root: {
            '&:hover': disabled
              ? undefined
              : {
                  backgroundColor: hasUpvoted
                    ? theme.colors.mublinSecondary[1]
                    : 'var(--mantine-color-default-hover)',
                  transform: 'translateY(-1px)',
                },
            '&:active': disabled
              ? undefined
              : {
                  transform: 'translateY(0px) scale(0.96)',
                },
          },
        }}
      >
        {hasUpvoted ? (
          <IconArrowBigUpLineFilled size={18} />
        ) : (
          <IconArrowBigUpLine size={18} />
        )}
        <Text size="xs" fw={700} lh={1}>
          {count}
        </Text>
      </Box>
    </Tooltip>
  )
}
