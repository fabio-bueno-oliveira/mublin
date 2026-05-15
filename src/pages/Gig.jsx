import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchGigDetails, fetchGigApplicationDetails } from '../queries/gigs'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  Container,
  Card,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Box,
  Paper,
  Skeleton,
  Avatar,
  Modal,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCalendar,
  IconMapPin,
  IconCheck,
  IconExclamationCircleFilled,
  IconPlus,
  IconDiamond,
  IconClock,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
import { useState } from 'react'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'

// ── Helpers ───────────────────────────────────────────────

function gigDate(gig) {
  return gig?.events?.date_start ?? gig.gigs?.date ?? null
}

function gigVenue(gig) {
  if (gig.events?.venues?.name) {
    const city = gig.events?.venues.cities?.name
    const uf = gig.events.venues.cities?.regions?.uf
    return `${gig.events.venues.name}${city ? ` · ${city}` : ''}${uf ? `/${uf}` : ''}`
  }
  return null
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
      <Badge size="md" color="gray" variant="light">
        Passou
      </Badge>
    )
  }
  if (days === 0) {
    return (
      <Badge size="md" color="red" variant="filled">
        Hoje!
      </Badge>
    )
  }
  if (days <= 2) {
    return (
      <Badge size="md" color="red" variant="light">
        em {days} dias
      </Badge>
    )
  }
  if (days <= 7) {
    return (
      <Badge size="md" color="orange" variant="light">
        em {days} dias
      </Badge>
    )
  }
  if (days <= 30) {
    return (
      <Badge size="md" color="yellow" variant="light">
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

export default function GigApplicationDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  const [roleDetailOpened, { open: openRoleDetail, close: closeRoleDetail }] =
    useDisclosure(false)
  const [selectedRoleDetails, setSelectedRoleDetails] = useState()

  const handleOpenModalRoleDetail = (role) => {
    setSelectedRoleDetails(role)
    openRoleDetail()
  }

  const { data: gig = [], isLoading: loadingGig } = useQuery({
    queryKey: ['gig-details', id],
    queryFn: () => fetchGigDetails(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: gigApplication = [], isLoading: loadingGigApplicationDetails } = useQuery(
    {
      queryKey: ['user-gig-application', user?.id],
      queryFn: () => fetchGigApplicationDetails(user.id, id),
      enabled: !!user?.id,
      staleTime: 1000 * 60 * 4,
    },
  )

  // const nextGig = upcomingGigs[0] ?? null
  const nextDays = daysUntil(gigDate(gig))

  const renderLeftSection = (status) => {
    const props = { color: status?.color, stroke: 3, size: 12 }

    switch (status?.id) {
      case 1:
        return <IconClock {...props} />
      case 2:
        return <IconCheck {...props} />
      default:
        return null
    }
  }

  return (
    <>
      <AppNavbarMobile />

      <Container size="xl" pt="xs" px={{ base: 'md', sm: 0 }}>
        {/* ── Cabeçalho ────────────────────────────── */}
        <Group justify="space-between" align="flex-end" mb="lg">
          <Box>
            <Title order={1} fz="h2" fw={700} lts="-0.02em">
              Gig
            </Title>
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
        {loadingGig ? (
          <Paper p="md" radius="lg" mb="lg" withBorder>
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
        ) : gig ? (
          <Paper p="md" radius="lg" mb="lg" withBorder>
            <Stack gap={2}>
              <Stack gap={0} mb={8}>
                <UrgencyBadge dateStr={gigDate(gig)} />
                <Text mt="xs" c="var(--mantine-color-text)" w="100%" fw={600} fz="xl">
                  {gig?.events?.name}
                </Text>
                {nextDays !== null && nextDays <= 2 && (
                  <IconExclamationCircleFilled size={15} color="orange" />
                )}
                <Group my={4} gap="xs">
                  <Avatar
                    size={40}
                    radius="md"
                    src={
                      gig?.projects?.picture
                        ? `${PROJECT_AVATAR_PATH}/${gig?.projects?.id}/tr:h-80,w-80,c-maintain_ratio/${gig?.projects?.picture}`
                        : undefined
                    }
                    alt={gig?.projects?.name}
                  />
                  <Stack gap={0}>
                    <Text
                      c="var(--mantine-color-text)"
                      size="xs"
                      fw={500}
                      component={Link}
                      to={`/project/${gig?.projects?.slug}`}
                    >
                      com {gig?.projects?.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {gig?.projects?.project_types?.name_ptbr}
                    </Text>
                  </Stack>
                </Group>
              </Stack>
              {gigDate(gig) && (
                <Group gap={4} opacity={0.8}>
                  <IconCalendar size={13} />
                  <Text size="xs">
                    {dayjs(gigDate(gig)).format('dddd, D [de] MMMM [de] YYYY')}{' '}
                    {nextDays > 0 && `(em ${nextDays} dias)`}
                  </Text>
                </Group>
              )}
              {gigVenue(gig) && (
                <Group gap={4} opacity={0.8}>
                  <IconMapPin size={13} />
                  <Text size="xs">{gigVenue(gig)}</Text>
                </Group>
              )}
              {gig.has_remuneration && (
                <Badge mt="xs" size="xs" color="lime" variant="light">
                  Remunerado
                </Badge>
              )}
              <Text mt="xs" size="sm">
                {gig.description}
              </Text>
            </Stack>
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

        <Title order={5} mb="xs">
          Vagas para esta gig
        </Title>

        {!loadingGig && !loadingGigApplicationDetails && (
          <Stack>
            {gig.gig_roles?.map((role) => (
              <Paper
                key={role.id}
                value={role.id}
                p="xs"
                style={{ cursor: 'pointer' }}
                onClick={() => handleOpenModalRoleDetail(role)}
              >
                <Group gap={4} align="center">
                  <IconDiamond size={16} />
                  <Text size="md" lh={1}>
                    {role.roles?.description_ptbr}
                  </Text>
                </Group>
                {role.id === gigApplication?.gig_roles.id && (
                  <Group mt="xs" align="center" gap={4}>
                    <IconCheck color="#164bae" stroke={3} size={12} />
                    <Text size="xs" lh={1}>
                      Você aplicou para esta vaga{' '}
                      {dayjs(gigApplication.created_at).fromNow()}
                    </Text>
                  </Group>
                )}
              </Paper>
            ))}
          </Stack>
        )}
      </Container>
      <Modal
        opened={roleDetailOpened}
        onClose={closeRoleDetail}
        withCloseButton={false}
        size="xs"
        radius="md"
        centered
      >
        <Stack gap="xs">
          <Box>
            <Text size="xs" fw={600}>
              Experiência desejada:
            </Text>
            <Text size="sm">{selectedRoleDetails?.experience_levels?.name_pt}</Text>
          </Box>
          <Box>
            <Text size="xs" fw={600}>
              Sobre a vaga:
            </Text>
            <Text size="sm">{selectedRoleDetails?.description}</Text>
          </Box>
        </Stack>
        {selectedRoleDetails?.id === gigApplication?.gig_roles?.id && (
          <Card p="xs" shadow="xs" withBorder mt="sm">
            <Text size="xs" fw={600}>
              Você aplicou para esta gig em:
            </Text>
            <Text size="sm" lh={1}>
              {dayjs(gigApplication.created_at).format(
                'dddd, D [de] MMMM [de] YYYY [às] HH:mm',
              )}
            </Text>

            <Text size="xs" mt="xs" fw={600}>
              Status da parte do criador da vaga:
            </Text>
            <Badge
              size="md"
              mt={4}
              variant="filled"
              color="dark"
              leftSection={renderLeftSection(gigApplication.owner_status)}
            >
              {gigApplication.owner_status?.status_name_pt}
            </Badge>
            <Text size="xs" mt="xs" fw={600}>
              Status da sua parte:
            </Text>
            <Badge
              size="md"
              mt={4}
              variant="filled"
              color="dark"
              leftSection={renderLeftSection(gigApplication.appliant_status)}
            >
              {gigApplication.appliant_status?.status_name_pt}
            </Badge>
          </Card>
        )}
      </Modal>
    </>
  )
}
