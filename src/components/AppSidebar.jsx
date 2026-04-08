import { useLocation, Link } from 'react-router-dom'
import { 
  Stack, Box, NavLink, ScrollArea,
  Badge, Group, Text, Divider
} from '@mantine/core'
import {
  IconHome2, IconPlus
} from '@tabler/icons-react'

const NAV_ITEMS = [
  { label: 'Home', icon: IconHome2, path: '/home' },
  // { label: 'Meus projetos', icon: IconMicrophone2, path: '/projects' },
  // { label: 'Explorar', icon: IconSparkles, path: '/search' },
]

const UPCOMING_GIGS = [
  { id: 1, title: 'Show Acústico', project: 'Trio Acústico SP', date: '28 Mar', weekday: 'Sex', venue: 'Bar Sagarana', city: 'São Paulo, SP', confirmed: true },
  { id: 2, title: 'Ensaio Geral', project: 'Banda Paralela', date: '02 Abr', weekday: 'Qua', venue: 'Estúdio B', city: 'São Paulo, SP', confirmed: true },
  { id: 3, title: 'Festival Indie', project: 'Trio Acústico SP', date: '12 Abr', weekday: 'Sáb', venue: 'Cine Joia', city: 'São Paulo, SP', confirmed: false },
]

export default function AppSidebar() {
  const location = useLocation()

  function isActive(path) {
    return location.pathname === path
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
              to={item.path}
              disabled={!item.path}
              label={<Text size="md">{item.label}</Text>}
              description={item.extra}
              color="gray"
              leftSection={<Icon size={20} />}
              rightSection={item.badge && (
                <Badge size="xs" color="gray" variant="light">
                  {item.badge}
                </Badge>
              )}
              variant="light"
              active={isActive(item.path)}
            />
          )
        })}
        <NavLink
          href="#required-for-focus"
          label={<Text size="md">Criar</Text>}
          color="gray"
          leftSection={<IconPlus size={20} />}
          childrenOffset={28}
        >
          <NavLink href="#required-for-focus" label={<Text size="sm">Novo Post</Text>}  />
          <NavLink href="#required-for-focus" label={<Text size="sm">Novo Evento</Text>}  />
          <NavLink href="#required-for-focus" label={<Text size="sm">Novo Projeto</Text>} />
          <NavLink href="#required-for-focus" label={<Text size="sm">Novo Equipamento</Text>} />
        </NavLink>
      </Stack>
      <Text fw={600} size="sm" mt="md" c="dimmed">
        Minhas próximas gigs:
      </Text>
      <ScrollArea h={180} type="hover" offsetScrollbars mt="md">
        <Stack gap="xs">
          {UPCOMING_GIGS.map((gig, i) => (
            <Box key={gig.id}>
              <Group gap="xs" align="flex-start">
                <Box
                  style={{
                    minWidth: 44,
                    textAlign: 'center',
                    background: 'var(--mantine-color-yellow-0)',
                    borderRadius: 8,
                    padding: '6px 4px',
                  }}
                >
                  <Text size="xs" c="dimmed" lh={1}>{gig.weekday}</Text>
                  <Text fw={800} size="sm" c="dark" lh={1.2}>{gig.date.split(' ')[0]}</Text>
                  <Text size="xs" c="dimmed" lh={1}>{gig.date.split(' ')[1]}</Text>
                </Box>
                <Stack gap={1} style={{ flex: 1 }}>
                  <Text size="xs" fw={600}>{gig.title}</Text>
                  <Text size="xs">{gig.project}</Text>
                  <Text size="xs" c="dimmed" truncate="end">
                    {gig.venue} · {gig.city}
                  </Text>
                  <Badge
                    size="xs"
                    variant="light"
                    fw="400"
                    color={gig.confirmed ? 'green' : 'gray'}
                  >
                    {gig.confirmed ? 'Confirmado' : 'Pendente'}
                  </Badge>
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
