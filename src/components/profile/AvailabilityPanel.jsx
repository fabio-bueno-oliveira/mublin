import { Link } from 'react-router-dom'
import {
  Paper,
  Text,
  Group,
  Badge,
  Stack,
  Box,
  ThemeIcon,
  Title,
  Divider,
  Skeleton,
  ActionIcon,
} from '@mantine/core'
import { IconCheck, IconPencil } from '@tabler/icons-react'
import WorkAvailabilityItem from './WorkAvailabilityItem'
import { AVAILABLE_FROM_LABELS } from '../../constants/availability'

export default function AvailabilityPanel({
  id,
  profile,
  workAvailability,
  loadingWorkAvailability,
  workFocuses,
  travelPreference,
  isOwnProfile,
}) {
  const hasAny =
    profile?.available_from ||
    workAvailability?.length ||
    workFocuses?.length ||
    travelPreference

  if (!hasAny) {
    return (
      <Paper withBorder p="md" radius="md" id="availability">
        <Group justify="space-between" mb="sm">
          <Text fw={600} size="18px">
            Disponibilidade
          </Text>
          {isOwnProfile && (
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="xl"
              size="sm"
              p={0}
              aria-label="Editar minha disponibilidade"
              title="Editar minha disponibilidade"
              component={Link}
              to="/settings/availability"
            >
              <IconPencil style={{ width: '94%', height: '94%' }} />
            </ActionIcon>
          )}
        </Group>
        <Box>
          <Text size="sm" c="dimmed">
            Não informado
          </Text>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper withBorder p="md" radius="md" id={id}>
      <Group justify="space-between" mb="md">
        <Text fw={600} size="18px">
          Disponibilidade
        </Text>
        {profile?.is_open_to_work && (
          <Badge color="green" size="md" radius="xl" variant="dot">
            Disponível
          </Badge>
        )}
      </Group>
      <Stack gap="xs">
        <Title order={3} fz="sm" fw={300} opacity={0.8} lh={1}>
          Disponível a partir de:
        </Title>
        <Text size="sm" lh={1}>
          {profile?.available_from ? (
            AVAILABLE_FROM_LABELS[profile.available_from] || profile.available_from
          ) : (
            <Text span c="dimmed" size="sm">
              Não informado
            </Text>
          )}
        </Text>
        <Divider variant="dashed" opacity={0.6} />
        <Title order={3} fz="sm" fw={300} opacity={0.8}>
          Tipos de trabalho:
        </Title>
        <Stack gap={4}>
          {loadingWorkAvailability ? (
            <>
              <Skeleton height={22} width={200} radius="xl" />
              <Skeleton height={22} width={200} radius="xl" />
              <Skeleton height={22} width={200} radius="xl" />
            </>
          ) : workAvailability?.length ? (
            workAvailability.map((it, i) => <WorkAvailabilityItem key={i} item={it} />)
          ) : (
            <Text size="sm" c="dimmed">
              Não informado
            </Text>
          )}
        </Stack>
        <Divider variant="dashed" opacity={0.6} />
        <Title order={3} fz="sm" fw={300} opacity={0.8}>
          Vínculos de preferência:
        </Title>
        {workFocuses?.length ? (
          <Stack gap={4}>
            {workFocuses.map((f) => (
              <Group key={f.id} gap="sm" wrap="nowrap" align="flex-start">
                <ThemeIcon
                  size={20}
                  radius="xl"
                  variant="light"
                  color="var(--mantine-color-text)"
                  mt={1}
                >
                  <IconCheck size={12} stroke={4} />
                </ThemeIcon>
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={600} lh={1.2}>
                    {f.work_focuses?.title_ptbr}
                  </Text>
                </div>
              </Group>
            ))}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            Não informado
          </Text>
        )}
        <Divider variant="dashed" opacity={0.6} />
        <Title order={3} fz="sm" fw={300} opacity={0.8}>
          Viagens:
        </Title>
        {travelPreference ? (
          <Group gap="sm" wrap="nowrap" align="flex-start">
            <ThemeIcon
              size={20}
              radius="xl"
              variant="light"
              color="var(--mantine-color-text)"
              mt={1}
            >
              <IconCheck size={12} stroke={4} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={600} lh={1.2}>
                {travelPreference?.travel_preferences?.label}
              </Text>
            </div>
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            Não informado
          </Text>
        )}
      </Stack>
    </Paper>
  )
}
