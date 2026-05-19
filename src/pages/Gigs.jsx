import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserGigs } from '../queries/gigs'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Card,
  Box,
  Paper,
  Skeleton,
  Avatar,
  Tabs,
  Table,
} from '@mantine/core'
import {
  IconCalendar,
  IconMapPin,
  IconCheck,
  IconExclamationCircleFilled,
  IconPlus,
  IconDiamond,
  IconBinoculars,
  IconListCheck,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'

// ── Helpers ───────────────────────────────────────────────

function gigDate(gig) {
  return gig.gigs?.events?.date_start ?? gig.gigs?.date ?? null
}

function gigVenue(gig) {
  if (gig.gigs?.events?.venues?.name) {
    const city = gig.gigs.events.venues.cities?.name
    const uf = gig.gigs.events.venues.cities?.regions?.uf
    return `${gig.gigs.events.venues.name}${city ? ` · ${city}` : ''}${uf ? `/${uf}` : ''}`
  }
  if (gig.gigs?.venue_name) {
    return gig.gigs.venue_name
  }
  return null
}

function gigEventName(gig) {
  return gig.gigs?.events?.name ?? gig.gigs?.title ?? null
}

function daysUntil(dateStr) {
  if (!dateStr) {
    return null
  }
  return dayjs(dateStr).diff(dayjs(), 'day')
}

function UrgencyBadge({ dateStr }) {
  const days = daysUntil(dateStr)
  if (days === null) {
    return null
  }

  if (days < 0) {
    return (
      <Badge size="sm" color="gray" variant="light">
        Passou
      </Badge>
    )
  }
  if (days === 0) {
    return (
      <Badge size="sm" color="red" variant="filled">
        Hoje!
      </Badge>
    )
  }
  if (days <= 2) {
    return (
      <Badge size="sm" color="red" variant="light">
        em {days} dias
      </Badge>
    )
  }
  if (days <= 7) {
    return (
      <Badge size="sm" color="orange" variant="light">
        em {days} dias
      </Badge>
    )
  }
  if (days <= 30) {
    return (
      <Badge size="xs" color="yellow" variant="light">
        em {days} dias
      </Badge>
    )
  }
  return (
    <Badge size="xs" color="gray" variant="light">
      {dayjs(dateStr).fromNow()}
    </Badge>
  )
}

export default function Gigs() {
  const { user } = useAuth()
  const [tab, setTab] = useState('upcoming')

  const { data: gigs = [], isLoading: loadingGigs } = useQuery({
    queryKey: ['user-gigs', user?.id],
    queryFn: () => fetchUserGigs(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const today = dayjs().startOf('day')

  const upcomingGigs = gigs
    .filter((g) => {
      const d = gigDate(g)
      return (d && dayjs(d).isSame(today, 'day')) || (d && dayjs(d).isAfter(today))
    })
    .sort((a, b) => dayjs(gigDate(a)).diff(dayjs(gigDate(b))))

  const pastGigs = gigs
    .filter((g) => {
      const d = gigDate(g)
      return d && dayjs(d).isBefore(today)
    })
    .sort((a, b) => dayjs(gigDate(b)).diff(dayjs(gigDate(a))))

  const nextGig = upcomingGigs[0] ?? null
  const nextDays = nextGig ? daysUntil(gigDate(nextGig)) : null

  return (
    <>
      <AppNavbarMobile />

      <Container size="xl" pt="xs" px={{ base: 'md', sm: 0 }}>
        {/* ── Cabeçalho ────────────────────────────── */}
        <Group justify="space-between" align="flex-end" mb="lg">
          <Box>
            <Title order={1} fz="h2" fw={700}>
              Minhas gigs
            </Title>
            {!loadingGigs && (
              <Text size="sm" opacity={0.8}>
                {upcomingGigs.length} próxima{upcomingGigs.length !== 1 ? 's' : ''} ·{' '}
                {pastGigs.length} realizada
                {pastGigs.length !== 1 ? 's' : ''}
              </Text>
            )}
          </Box>
          <Button
            size="sm"
            leftSection={<IconPlus size={15} />}
            component={Link}
            to="/new/event"
          >
            Nova gig
          </Button>
        </Group>

        {/* ── Próxima gig em destaque ───────────────── */}
        {loadingGigs ? (
          <Paper
            p="md"
            radius="lg"
            mb="lg"
            withBorder
            style={{
              borderLeft: `4px solid var(--mantine-color-mublinColor-6)`,
            }}
          >
            <Stack gap={8}>
              <Skeleton height={15} width={120} radius="lg" />
              <Skeleton height={22} width={280} radius="lg" />
              <Group gap="xs">
                <Skeleton height={40} width={40} radius="md" />
                <Stack gap={6}>
                  <Skeleton height={14} width={200} radius="lg" />
                  <Skeleton height={14} width={160} radius="lg" />
                </Stack>
              </Group>
              <Skeleton height={12} width={190} radius="lg" />
              <Skeleton height={12} width={220} radius="lg" />
              <Skeleton height={12} width={160} radius="lg" />
            </Stack>
          </Paper>
        ) : nextGig ? (
          <Paper
            p="md"
            radius="lg"
            mb="lg"
            withBorder
            style={{
              borderLeft: `4px solid var(${nextDays !== null && nextDays <= 2 ? '--mantine-color-red' : '--mantine-color-mublinColor'}-6)`,
            }}
          >
            <Stack gap={3}>
              <Group gap={6}>
                <Text size="xs" c="dimmed" tt="uppercase" lts="0.05em">
                  Próxima gig
                </Text>
                {nextDays !== null && nextDays <= 2 && (
                  <IconExclamationCircleFilled size={15} color="orange" />
                )}
              </Group>
              <Stack gap={0} mb={8}>
                <Text
                  c="var(--mantine-color-text)"
                  w="100%"
                  fw={600}
                  fz="xl"
                  truncate="end"
                  component={Link}
                  to={`/gig/${nextGig.gigs.id}`}
                >
                  {gigEventName(nextGig)}
                </Text>
                <Group my={4} gap="xs">
                  <Avatar
                    size={40}
                    radius="md"
                    src={
                      nextGig.gigs?.projects?.picture
                        ? `${PROJECT_AVATAR_PATH}/${nextGig.gigs?.projects?.id}/tr:h-80,w-80,c-maintain_ratio/${nextGig.gigs?.projects?.picture}`
                        : undefined
                    }
                    alt={nextGig.gigs?.projects?.name}
                  />
                  <Stack gap={0}>
                    <Text
                      c="var(--mantine-color-text)"
                      size="xs"
                      fw={500}
                      component={Link}
                      to={`/project/${nextGig.gigs?.projects?.slug}`}
                    >
                      com {nextGig.gigs?.projects?.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {nextGig.gigs?.projects?.project_types?.name_ptbr}
                    </Text>
                  </Stack>
                </Group>
              </Stack>
              <Group gap={4}>
                <UrgencyBadge dateStr={gigDate(nextGig)} />
                <Badge
                  size="xs"
                  color="green"
                  variant="light"
                  leftSection={<IconCheck stroke={3} size={11} />}
                >
                  Aceito
                </Badge>
                {nextGig.gigs?.has_remuneration && (
                  <Badge size="xs" color="lime" variant="light">
                    Remunerado
                  </Badge>
                )}
              </Group>
              <Group gap={4} mt={4} opacity={0.8}>
                <IconDiamond size={13} />
                <Text size="xs">
                  Atividade: {nextGig.gig_roles?.roles?.description_ptbr}
                </Text>
              </Group>
              {gigDate(nextGig) && (
                <Group gap={4} opacity={0.8}>
                  <IconCalendar size={13} />
                  <Text size="xs">
                    {dayjs(gigDate(nextGig)).format('dddd, D [de] MMMM [de] YYYY')}{' '}
                    {nextDays > 0 && `(em ${nextDays} dias)`}
                  </Text>
                </Group>
              )}
              {gigVenue(nextGig) && (
                <Group gap={4} opacity={0.8}>
                  <IconMapPin size={13} />
                  <Text size="xs">{gigVenue(nextGig)}</Text>
                </Group>
              )}
            </Stack>
            <Button mt={12} size="xs" component={Link} to={`/gig/${nextGig.gigs.id}`}>
              mais detalhes
            </Button>
          </Paper>
        ) : (
          <Paper withBorder radius="lg" p="md" mb="lg" ta="center">
            <Text size="sm" c="dimmed" mb="xs">
              Nenhuma gig agendada por enquanto.
            </Text>
            <Button size="xs" variant="default" radius="xl" component={Link} to="/search">
              Encontrar gigs
            </Button>
          </Paper>
        )}

        {/* ── Tabs: Próximas / Passadas ─────────────── */}
        <Tabs variant="outline" value={tab} onChange={setTab} mb="xl">
          <Tabs.List mb="md">
            <Tabs.Tab value="upcoming" leftSection={<IconBinoculars size={15} />}>
              Próximas ({upcomingGigs.length})
            </Tabs.Tab>
            <Tabs.Tab value="past" leftSection={<IconListCheck size={15} />}>
              Realizadas ({pastGigs.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* ── Próximas ─────────────────────────────── */}
          <Tabs.Panel value="upcoming">
            {loadingGigs ? (
              <Stack gap="xs">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={80} radius="md" />
                ))}
              </Stack>
            ) : upcomingGigs.length === 0 ? (
              <Paper withBorder radius="md" p="md" ta="center">
                <Text size="sm" c="dimmed">
                  Nenhuma gig futura agendada.
                </Text>
              </Paper>
            ) : (
              <Stack gap="xs">
                {upcomingGigs.map((gig) => {
                  const date = gigDate(gig)
                  const days = daysUntil(date)
                  return (
                    <Card key={gig.id} withBorder padding="sm" radius="md">
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Group
                          gap="sm"
                          align="flex-start"
                          wrap="nowrap"
                          style={{ flex: 1 }}
                        >
                          {/* Bloco de data */}
                          {date && (
                            <Box
                              ta="center"
                              style={{
                                minWidth: 44,
                                background: 'var(--mantine-color-indigo-0)',
                                borderRadius: 8,
                                padding: '6px 4px',
                                flexShrink: 0,
                              }}
                            >
                              <Text size="10px" c="dimmed" lh={1}>
                                {dayjs(date).format('ddd').toUpperCase()}
                              </Text>
                              <Text fw={800} size="lg" lh={1.1}>
                                {dayjs(date).format('D')}
                              </Text>
                              <Text size="10px" c="dimmed" lh={1}>
                                {dayjs(date).format('MMM').toUpperCase()}
                              </Text>
                            </Box>
                          )}
                          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={600} size="sm" truncate="end">
                              {gigEventName(gig)}
                            </Text>
                            <Text size="xs" c="dimmed" truncate="end">
                              {nextGig.gigs?.projects?.name && (
                                <Text span fw={500}>
                                  {gig.gigs?.projects?.name} ·{' '}
                                </Text>
                              )}
                              {gig.gig_roles?.roles?.description_ptbr}
                            </Text>
                            {gigVenue(gig) && (
                              <Group gap={3}>
                                <IconMapPin size={11} opacity={0.4} />
                                <Text size="xs" c="dimmed" truncate="end">
                                  {gigVenue(gig)}
                                </Text>
                              </Group>
                            )}
                            <Group gap={4} mt={2}>
                              <UrgencyBadge dateStr={date} />
                              {gig.gigs?.has_remuneration && (
                                <Badge size="xs" color="teal" variant="light">
                                  Remunerado
                                </Badge>
                              )}
                              {gig.gigs?.is_recurring && (
                                <Badge size="xs" color="violet" variant="light">
                                  Recorrente
                                </Badge>
                              )}
                            </Group>
                          </Stack>
                        </Group>
                        <Avatar
                          size={36}
                          radius="md"
                          src={
                            gig.gigs?.projects?.picture
                              ? `${PROJECT_AVATAR_PATH}/${gig.gigs?.projects?.id}/tr:h-72,w-72,c-maintain_ratio/${gig.gigs?.projects?.picture}`
                              : undefined
                          }
                        />
                      </Group>
                    </Card>
                  )
                })}
              </Stack>
            )}
          </Tabs.Panel>

          {/* ── Realizadas ───────────────────────────── */}
          <Tabs.Panel value="past">
            {loadingGigs ? (
              <Skeleton height={200} radius="md" />
            ) : pastGigs.length === 0 ? (
              <Paper withBorder radius="md" p="md" ta="center">
                <Text size="sm" c="dimmed">
                  Nenhuma gig realizada registrada.
                </Text>
              </Paper>
            ) : (
              <Table highlightOnHover withRowBorders={false} verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Evento</Table.Th>
                    <Table.Th visibleFrom="sm">Projeto</Table.Th>
                    <Table.Th visibleFrom="sm">Local</Table.Th>
                    <Table.Th>Data</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pastGigs.map((gig) => (
                    <Table.Tr key={gig.id}>
                      <Table.Td>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {gigEventName(gig)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {gig.gig_roles?.roles?.description_ptbr}
                        </Text>
                      </Table.Td>
                      <Table.Td visibleFrom="sm">
                        <Text size="sm" truncate="end" maw={140}>
                          {gig.gigs?.projects?.name ?? '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td visibleFrom="sm">
                        <Text size="xs" c="dimmed" truncate="end" maw={160}>
                          {gigVenue(gig) ?? '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                          {gigDate(gig) ? dayjs(gigDate(gig)).format('D MMM YYYY') : '—'}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Tabs.Panel>
        </Tabs>
      </Container>
    </>
  )
}
