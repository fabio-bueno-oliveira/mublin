import { useState } from 'react'
import {
  Box,
  Group,
  Text,
  Badge,
  ActionIcon,
  Button,
  Anchor,
  Collapse,
} from '@mantine/core'
import { IconX, IconSparkles, IconArrowRight, IconFlask } from '@tabler/icons-react'

export default function BetaBar({ onFeedbackClick }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('mublin_beta_bar_dismissed') === 'true'
    } catch {
      return false
    }
  })

  const handleDismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem('mublin_beta_bar_dismissed', 'true')
    } catch {}
  }

  if (dismissed) return null

  return (
    <Box
      style={{
        background: 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
        borderBottom: '1px solid #333',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Group
        justify="center"
        wrap="nowrap"
        px={{ base: 'sm', md: 'lg' }}
        py={8}
        maw={1000}
        mx="auto"
      >
        <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
          <Badge
            size="xs"
            variant="filled"
            color="dark"
            leftSection={<IconFlask size={10} />}
            style={{ flexShrink: 0 }}
            fw={700}
          >
            BETA
          </Badge>

          <Text
            size="xs"
            c="white"
            lh={1.3}
            style={{ flex: 1 }}
            lineClamp={1}
            visibleFrom="sm"
          >
            O Mublin está em fase de pré-lançamento! Estamos aprimoramendo as
            funcionalidades diariamente
          </Text>

          <Text size="xs" c="white" lh={1.3} hiddenFrom="sm" lineClamp={1}>
            Mublin em versão beta — estamos melhorando!
          </Text>
        </Group>

        <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
          <ActionIcon
            variant="subtle"
            color="gray.5"
            size="sm"
            radius="xl"
            onClick={handleDismiss}
            aria-label="Fechar aviso beta"
          >
            <IconX size={14} />
          </ActionIcon>
        </Group>
      </Group>
    </Box>
  )
}

// Versão alternativa mais minimalista / colorida - descomente se preferir usar
export function BetaBarLight({ onFeedbackClick }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <Box bg="yellow.1" style={{ borderBottom: '1px solid #ffe066' }}>
      <Group justify="center" gap={6} px="md" py={6} wrap="nowrap">
        <Text size="xs" ta="center" c="dark.7">
          <Text span fw={700}>
            Mublin Beta
          </Text>{' '}
          — estamos em pré-lançamento. Encontrou algo estranho?{' '}
          <Anchor
            size="xs"
            fw={600}
            onClick={onFeedbackClick}
            underline="always"
            c="dark"
          >
            Conte pra gente
          </Anchor>
        </Text>
        <ActionIcon
          size="xs"
          variant="subtle"
          color="gray"
          onClick={() => setDismissed(true)}
        >
          <IconX size={12} />
        </ActionIcon>
      </Group>
    </Box>
  )
}
