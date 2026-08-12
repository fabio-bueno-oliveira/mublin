import { Link } from 'react-router-dom'
import {
  Badge,
  Card,
  Center,
  Group,
  RingProgress,
  Skeleton,
  Stack,
  Text,
  UnstyledButton,
  Title,
} from '@mantine/core'
import {
  IconChevronRight,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconLock,
} from '@tabler/icons-react'
import { useProfileChecklist } from '../../hooks/useProfileChecklist'

export default function ProfileChecklistCard() {
  const {
    items,
    completedCount,
    totalCount,
    percent,
    isComplete,
    isProPlanUser,
    isLoading,
  } = useProfileChecklist()

  // Enquanto as queries reais carregam, mostra um esqueleto no lugar
  // do card em vez de piscar um checklist "zerado" por um instante.
  if (isLoading) {
    return (
      <Card radius="lg" withBorder p={{ base: 'md', sm: 'lg' }} mb="md">
        <Group justify="space-between" align="center" wrap="nowrap" mb="sm">
          <Stack gap={6}>
            <Skeleton height={16} width={160} radius="xl" />
            <Skeleton height={12} width={100} radius="xl" />
          </Stack>
          <Skeleton height={52} width={52} circle />
        </Group>
        <Stack gap={8}>
          <Skeleton height={28} radius="sm" />
          <Skeleton height={28} radius="sm" />
          <Skeleton height={28} radius="sm" />
        </Stack>
      </Card>
    )
  }

  // Perfil completo: some com o card, sem poluir a Home de quem já
  // preencheu tudo.
  if (isComplete) {
    return null
  }

  return (
    <Card radius="lg" withBorder px={{ base: 'md', sm: 'lg' }} mb="md">
      <style>{`
        .profile-checklist-item:hover {
          background-color: var(--mantine-color-default-hover);
        }
      `}</style>

      <Group justify="space-between" align="center" wrap="nowrap" mb="sm">
        <Group gap="xs" wrap="nowrap">
          <Stack gap={0}>
            <Title order={3} fz="md" fw={600}>
              {isComplete ? 'Seu perfil está 100%! 🎉' : 'Seu perfil está quase lá!'}
            </Title>
            <Text size="xs" c="dimmed">
              {completedCount} de {totalCount} concluídos
            </Text>
          </Stack>
        </Group>

        <RingProgress
          size={52}
          thickness={5}
          roundCaps
          sections={[{ value: percent, color: 'teal' }]}
          label={
            <Center>
              <Text fz="10px" fw={700}>
                {percent}%
              </Text>
            </Center>
          }
        />
      </Group>

      <Stack gap={2}>
        {items.map((item) => {
          const locked = item.proOnly && !isProPlanUser

          return (
            <UnstyledButton
              key={item.key}
              component={Link}
              to={locked ? '/settings/gear' : item.href}
              p={6}
              className="profile-checklist-item"
              style={{
                borderRadius: 8,
                backgroundColor: locked ? 'var(--mantine-color-grape-light)' : undefined,
              }}
            >
              <Group justify="space-between" wrap="nowrap" gap="xs">
                <Group gap={8} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                  {item.completed ? (
                    <IconCircleCheckFilled
                      size={18}
                      color="var(--mantine-color-teal-6)"
                      style={{ flexShrink: 0 }}
                    />
                  ) : locked ? (
                    <IconLock
                      size={16}
                      color="var(--mantine-color-grape-6)"
                      style={{ flexShrink: 0 }}
                    />
                  ) : (
                    <IconCircleDashed
                      size={18}
                      color="var(--mantine-color-gray-5)"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                  <Text
                    size="sm"
                    fw={locked ? 500 : undefined}
                    td={item.completed ? 'line-through' : 'none'}
                    c={item.completed ? 'dimmed' : undefined}
                    truncate="end"
                    style={{ minWidth: 0, flex: 1 }}
                  >
                    {item.label}
                  </Text>
                  {item.proOnly && !isComplete && (
                    <Badge
                      size="xs"
                      variant="filled"
                      color="dark"
                      radius="sm"
                      style={{ flexShrink: 0 }}
                    >
                      PRO
                    </Badge>
                  )}
                </Group>
                {!item.completed && (
                  <IconChevronRight size={14} opacity={0.5} style={{ flexShrink: 0 }} />
                )}
              </Group>
            </UnstyledButton>
          )
        })}
      </Stack>
    </Card>
  )
}
