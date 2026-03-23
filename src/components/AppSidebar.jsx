import { useLocation, Link } from 'react-router-dom'
import { 
  Stack, Box, NavLink, ScrollArea,
  Badge, Group, Text, Divider
} from '@mantine/core'
import {
  IconHome, IconCalendarEvent, IconMapPin,
  IconUser, IconGuitarPick,
} from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { label: 'Home',         icon: IconHome,          path: '/home' },
  { label: 'Gigs',         icon: IconCalendarEvent, path: '/gigs', badge: 'Novo' },
  { label: 'Meu Perfil',   icon: IconUser,          path: null },
  { label: 'Equipamentos', icon: IconGuitarPick,    path: '/gear' },
]

const UPCOMING_GIGS = [
  { id: 1, title: 'Show Acústico', project: 'Trio Acústico SP', date: '28 Mar', weekday: 'Sex', venue: 'Bar Sagarana', city: 'São Paulo, SP', confirmed: true },
  { id: 2, title: 'Ensaio Geral', project: 'Banda Paralela', date: '02 Abr', weekday: 'Qua', venue: 'Estúdio B', city: 'São Paulo, SP', confirmed: true },
  { id: 3, title: 'Festival Indie', project: 'Trio Acústico SP', date: '12 Abr', weekday: 'Sáb', venue: 'Cine Joia', city: 'São Paulo, SP', confirmed: false },
]

export default function AppSidebar() {
  const location = useLocation()
  const { profile } = useAuth()

  function getPath(item) {
    if (item.label === 'Meu Perfil') return profile?.username ? `/${profile.username}` : null
    return item.path
  }

  function isActive(item) {
    return location.pathname === getPath(item)
  }

  return (
    <Box p="md" h="100%">
      <Stack gap={4}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              component={Link}
              to={getPath(item) ?? '#'}
              disabled={!getPath(item)}
              label={item.label}
              color="gray"
              leftSection={<Icon size={20} />}
              rightSection={item.badge && (
                <Badge size="xs" color="amber" variant="light">
                  {item.badge}
                </Badge>
              )}
              variant="light"
              active={isActive(item)}
            />
          )
        })}
      </Stack>
      <Text fw={600} size="sm" mt="lg">
        Minhas próximas gigs:
      </Text>
      <ScrollArea h={250} type="always" offsetScrollbars mt="md">
        <Stack gap="xs">
          {UPCOMING_GIGS.map((gig, i) => (
            <Box key={gig.id}>
              <Group gap="xs" align="flex-start">
                <Box
                  style={{
                    minWidth: 44,
                    textAlign: 'center',
                    background: 'var(--mantine-color-amber-0)',
                    borderRadius: 8,
                    padding: '6px 4px',
                  }}
                >
                  <Text size="xs" c="dimmed" lh={1}>{gig.weekday}</Text>
                  <Text fw={800} size="sm" c="amber" lh={1.2}>{gig.date.split(' ')[0]}</Text>
                  <Text size="xs" c="dimmed" lh={1}>{gig.date.split(' ')[1]}</Text>
                </Box>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Group gap="xs">
                    <Text size="sm" fw={600}>{gig.title}</Text>
                    <Badge
                      size="xs"
                      variant="light"
                      color={gig.confirmed ? 'green' : 'gray'}
                    >
                      {gig.confirmed ? 'Confirmado' : 'Pendente'}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">{gig.project}</Text>
                  <Group gap={4}>
                    <IconMapPin size={11} style={{ color: 'var(--mantine-color-dimmed)' }} />
                    <Text size="xs" c="dimmed">{gig.venue} · {gig.city}</Text>
                  </Group>
                </Stack>
              </Group>
              {i < UPCOMING_GIGS.length - 1 && <Divider mt="xs" />}
            </Box>
          ))}
        </Stack>
      </ScrollArea>
    </Box>
  )
}
