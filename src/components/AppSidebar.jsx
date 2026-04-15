import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { 
  Stack, Box, NavLink, ScrollArea, Scroller,
  Badge, Group, Text, Title, Divider
} from '@mantine/core'
import {
  IconHome2, IconPlus, IconCubePlus, 
  IconBulb, IconPencilPlus, IconCalendarPlus
} from '@tabler/icons-react'

const NAV_ITEMS = [
  { label: 'Home', icon: IconHome2, path: '/home' },
  // { label: 'Meus projetos', icon: IconMicrophone2, path: '/projects' },
  // { label: 'Explorar', icon: IconSparkles, path: '/search' },
]

const NAV_ITEMS_CREATE = [
  { label: 'Novo Post', icon: IconPencilPlus, path: '/new/post' },
  { label: 'Novo Evento', icon: IconCalendarPlus, path: '/new/event' },
  { label: 'Novo Projeto', icon: IconBulb, path: '/new/project' },
  { label: 'Novo Equipamento', icon: IconCubePlus, path: '/new/gear' },
]

const GIG_MENU_ITEMS = [
  { label: 'Confirmadas', confirmed: true, path: '#', type: "confirmed" },
  { label: 'Pendentes', confirmed: false, path: '#', type: "pending" },
  { label: 'Sugeridas', confirmed: false, path: '#', type: "suggested" },
]

const UPCOMING_GIGS = [
  { id: 1, title: 'Show Acústico', project: 'Trio Acústico SP', date: '28 Mar', weekday: 'Sex', venue: 'Bar Sagarana', city: 'São Paulo, SP', confirmed: true, type: "confirmed" },
  { id: 2, title: 'Ensaio Geral', project: 'Banda Paralela', date: '02 Abr', weekday: 'Qua', venue: 'Estúdio B', city: 'São Paulo, SP', confirmed: true, type: "confirmed" },
  { id: 3, title: 'Festival Indie', project: 'Trio Acústico SP', date: '12 Abr', weekday: 'Sáb', venue: 'Cine Joia', city: 'São Paulo, SP', confirmed: false, type: "suggested" },
]

export default function AppSidebar() {
  const location = useLocation()
  const [gigsToShow, setGigsToShow] = useState("confirmed")

  function isActive(path) {
    return location.pathname === path
  }

  return (
    <Box p="md" h="100%">
      <Stack gap={4} mb={20}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              component={Link}
              to={item.path}
              disabled={!item.path}
              label={<Text size="sm">{item.label}</Text>}
              description={item.extra}
              color="gray"
              leftSection={<Icon size={18} />}
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
          label={<Text size="sm">Criar</Text>}
          color="gray"
          leftSection={<IconPlus size={18} />}
          childrenOffset={14}
        >
          {NAV_ITEMS_CREATE.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.label}
                href={item.path}
                label={<Text size="xs">{item.label}</Text>}
                leftSection={<Icon size={16} />}
                variant="light"
              />
            )
          })}
        </NavLink>
      </Stack>
      <Title order={2} fz="md" ta="left" fw={600} lts="-0.02em" mb="lg">
        Suas próximas Gigs:
      </Title>
      <Scroller mb={20}>
        <Group gap={4} wrap="nowrap" miw={300}>
          {GIG_MENU_ITEMS.map((item, index) => (
            <Badge
              key={index}
              variant={item.type === gigsToShow ? "filled" : "light"}
              size="lg"
              tt="none"
              fw={550}
              style={{ cursor: 'pointer' }}
              color={item.type === gigsToShow ? "indigo" : "dark"}
              onClick={() => setGigsToShow(item.type)}
            >
              {item.label}
            </Badge>
          ))}
        </Group>
      </Scroller>
      <ScrollArea h={180} type="hover" offsetScrollbars mt="md">
        <Stack gap="xs">
          {UPCOMING_GIGS.filter(gig => gig.type === gigsToShow).map((gig, i) => (
            <Box key={gig.id}>
              <Group gap="xs" align="flex-start">
                <Box
                  style={{
                    minWidth: 44,
                    textAlign: 'center',
                    background: 'var(--mantine-color-indigo-0)',
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
                    variant="dot"
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
