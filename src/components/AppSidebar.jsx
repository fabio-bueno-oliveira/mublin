import { useLocation, Link } from 'react-router-dom'
import { 
  Stack, Box, NavLink, ScrollArea,
  Badge, Group, Text, Divider,
  Marquee, Image, Center, Loader, useComputedColorScheme
} from '@mantine/core'
import {
  IconHome, IconCalendarEvent, IconGuitarPick, IconMusic
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { fetchRandomBrands } from '../queries/gear'

const NAV_ITEMS = [
  { label: 'Home',         icon: IconHome,          path: '/home' },
  { label: 'Gigs',         icon: IconCalendarEvent, path: '/gigs' },
  { label: 'Projetos', icon: IconMusic,    path: '/projects', extra: 'Associados a mim', badge: 3 },
  { label: 'Equipamentos', icon: IconGuitarPick,    path: '/gear' },
]

const UPCOMING_GIGS = [
  { id: 1, title: 'Show Acústico', project: 'Trio Acústico SP', date: '28 Mar', weekday: 'Sex', venue: 'Bar Sagarana', city: 'São Paulo, SP', confirmed: true },
  { id: 2, title: 'Ensaio Geral', project: 'Banda Paralela', date: '02 Abr', weekday: 'Qua', venue: 'Estúdio B', city: 'São Paulo, SP', confirmed: true },
  { id: 3, title: 'Festival Indie', project: 'Trio Acústico SP', date: '12 Abr', weekday: 'Sáb', venue: 'Cine Joia', city: 'São Paulo, SP', confirmed: false },
]

export default function AppSidebar() {
  const location = useLocation()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

  function isActive(path) {
    return location.pathname === path
  }

  const { data: randomBrands = [], isLoading: loadingRandomBrands } = useQuery({
    queryKey: ['random-brands'],
    queryFn: fetchRandomBrands,
    staleTime: 1000 * 60 * 30,
  })

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
              label={item.label}
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
                    <Text size="xs" fw={400} lh="0.8em">{gig.title}</Text>
                    <Badge
                      size="xs"
                      variant="light"
                      fw="400"
                      color={gig.confirmed ? 'green' : 'gray'}
                    >
                      {gig.confirmed ? 'Confirmado' : 'Pendente'}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">{gig.project}</Text>
                  <Group gap={4}>
                    <Text size="xs" c="dimmed" truncate="end">
                      {gig.venue} · {gig.city}
                    </Text>
                  </Group>
                </Stack>
              </Group>
              {i < UPCOMING_GIGS.length - 1 && <Divider mt="xs" />}
            </Box>
          ))}
        </Stack>
      </ScrollArea>
      <Marquee duration={48000} gap="xs" mt="xl">
        {!loadingRandomBrands && randomBrands.length > 0 ? (
          randomBrands.map(brand => (
            <Link key={brand.id} to={`/brand/${brand.slug}`}>
            <Image
              src={brand.logo ? `https://ik.imagekit.io/mublin/products/brands/tr:w-130,h-130,cm-pad_resize,bg-FFFFFF,fo-x/${brand.logo}` : undefined}
              h={65}
              w='auto'
              fit='contain'
              style={{
                filter: isDark ? 'invert(1) opacity(0.85)' : 'none',
                transition: 'filter 0.3s',
              }}
            />
            </Link>
          ))
        ) : (
          <Center>
            <Loader size="sm" />
          </Center>
        )}
      </Marquee>
    </Box>
  )
}
