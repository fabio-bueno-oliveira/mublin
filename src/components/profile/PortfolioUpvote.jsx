import { IconArrowBigUpLine, IconArrowBigUpLineFilled } from '@tabler/icons-react'
import { Text, Box, useMantineTheme } from '@mantine/core'

export default function PortfolioUpvote({
  count,
  hasUpvoted,
  onToggle,
  disabled = false,
}) {
  const theme = useMantineTheme()

  return (
    <Box
      title={hasUpvoted ? 'Remover endosso' : 'Endossar esta participação'}
      mt="xs"
      component="button"
      type="button"
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      aria-pressed={hasUpvoted}
      aria-label={
        disabled
          ? `${count} endosso${count !== 1 ? 's' : ''}`
          : hasUpvoted
            ? 'Remover endosso'
            : 'Endossar esta participação'
      }
      bg={hasUpvoted ? 'mublinColor.2' : 'transparent'}
      c={hasUpvoted ? 'mublinColor.6' : 'dimmed'}
      bd={`1px solid ${hasUpvoted ? theme.colors.mublinColor[2] : 'dimmed'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px 2px 6px',
        borderRadius: 999,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
      styles={{
        root: {
          '&:hover': disabled
            ? undefined
            : {
                backgroundColor: hasUpvoted
                  ? theme.colors.mublinColor[1]
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
  )
}
