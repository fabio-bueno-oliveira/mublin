import { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchTourBySlug,
  fetchTourDates,
  fetchTourProjects,
  fetchTourLegs,
} from '../../queries/tours'
import AppNavbarMobile from '../../components/AppNavbarMobile'
import {
  Container,
  Title,
  Text,
  Stack,
  Skeleton,
  Avatar,
  Spoiler,
  Affix,
  Badge,
  Group,
  Card,
  Divider,
  Button,
  Box,
  Tooltip,
  ActionIcon,
} from '@mantine/core'
import { IconCalendar, IconMusic, IconEdit, IconPencil } from '@tabler/icons-react'
import dayjs from 'dayjs'

const TOURS_PATH = 'https://ik.imagekit.io/mublin/tours/tr:w-280/'
const PROJECTS_PATH = 'https://ik.imagekit.io/mublin/projects/tr:w-100/'

export default function Tour() {
  const { slug } = useParams()
  useEffect(() => {
    scrollTo({ y: 0 })
  }, [slug])

  const { data: tour, isLoading } = useQuery({
    queryKey: ['tour', slug],
    queryFn: () => fetchTourBySlug(slug),
    enabled: !!slug,
  })

  const { data: tourDates = [], isLoading: loadingDates } = useQuery({
    queryKey: ['tour-dates', tour?.id],
    queryFn: () => fetchTourDates(tour.id),
    enabled: !!tour?.id,
  })

  const { data: tourProjects = [] } = useQuery({
    queryKey: ['tour-projects', tour?.id],
    queryFn: () => fetchTourProjects(tour.id),
    enabled: !!tour?.id,
  })

  const { data: tourLegs = [] } = useQuery({
    queryKey: ['tour-legs', tour?.id],
    queryFn: () => fetchTourLegs(tour.id),
    enabled: !!tour?.id,
  })

  const groupedByLeg = useMemo(() => {
    const groups = {}
    tourDates.forEach((d) => {
      const legKey = d.tour_leg_id || 'no-leg'
      if (!groups[legKey]) groups[legKey] = []
      groups[legKey].push(d)
    })
    return groups
  }, [tourDates])

  const headliners = tourProjects.filter((p) => p.is_headliner)
  const supports = tourProjects.filter((p) => !p.is_headliner)

  if (isLoading)
    return (
      <Container size="sm" mt={80}>
        <Skeleton h={200} />
      </Container>
    )
  if (!tour)
    return (
      <Container size="sm" mt={80}>
        <Text>Turnê não encontrada</Text>
      </Container>
    )

  return (
    <>
      <Helmet>
        <title>{tour.title} · Mublin</title>
      </Helmet>
      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Detalhes da turnê" />
      </Affix>

      <Container size="sm" mt={{ base: 62, sm: 20 }}>
        <Stack align="center" gap="xs">
          <Avatar
            size={140}
            radius="md"
            src={tour.picture ? TOURS_PATH + tour.picture : undefined}
          />
          <Group gap="xs">
            <Title order={1} fz="h2" ta="center">
              {tour.title}
            </Title>
            <Tooltip label="Editar turnê" withArrow>
              <ActionIcon
                component={Link}
                to={`/tour/${tour.slug}/edit`}
                size="lg"
                variant="subtle"
                color="gray"
                radius="xl"
                aria-label="Editar turnê"
              >
                <IconPencil size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Group gap="xs" justify="center">
            {tour.genres?.name_ptbr && (
              <Badge fw={300} leftSection={<IconMusic size={12} />} variant="default">
                {tour.genres.name_ptbr}
              </Badge>
            )}
            {tour.date_start && (
              <Badge leftSection={<IconCalendar size={12} />} variant="outline">
                {tour.date_start} → {tour.date_end || '...'}
              </Badge>
            )}
            {!tour.date_start && tourDates.length > 0 && (
              <Badge variant="light" color="gray">
                {tourDates.length} datas
              </Badge>
            )}
          </Group>

          {/* Projetos - headliners em destaque */}
          {tourProjects.length > 0 && (
            <Box w="100%" mt="md">
              <Group gap="xs" justify="center">
                {headliners.map((tp) => (
                  <Badge
                    key={tp.id}
                    size="lg"
                    color="violet"
                    leftSection={
                      <Avatar
                        src={
                          tp.projects?.picture
                            ? PROJECTS_PATH + tp.projects.picture
                            : undefined
                        }
                        size={20}
                        radius="xl"
                      />
                    }
                  >
                    {tp.projects?.name}
                  </Badge>
                ))}
              </Group>
              {supports.length > 0 && (
                <Group gap="xs" justify="center" mt="xs">
                  {supports.map((tp) => (
                    <Badge key={tp.id} variant="filled" size="sm">
                      {tp.projects?.name}
                    </Badge>
                  ))}
                </Group>
              )}
            </Box>
          )}

          {tour.description && (
            <Spoiler maxHeight={120} showLabel="Ver mais" hideLabel="Ver menos">
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }} mt="md">
                {tour.description}
              </Text>
            </Spoiler>
          )}
        </Stack>

        <Divider my="md" />

        {/* Datas agrupadas por Leg */}
        <Title order={3} fz="h4" mb="md">
          Datas da turnê {tourLegs.length > 0 && `• ${tourLegs.length} pernas`}
        </Title>

        {loadingDates ? (
          <Skeleton h={80} />
        ) : (
          <Stack gap="lg">
            {tourLegs.length > 0
              ? tourLegs.map((leg) => (
                  <Box key={leg.id}>
                    <Group gap="xs" mb="xs">
                      <Title order={4} fz="sm" tt="uppercase" c="dimmed">
                        {leg.name}
                      </Title>
                      <Badge size="xs" variant="light">
                        {groupedByLeg[leg.id]?.length || 0} datas
                      </Badge>
                    </Group>
                    <Stack gap="xs">
                      {(groupedByLeg[leg.id] || []).map((d) => (
                        <Card key={d.id} withBorder radius="md" p="sm">
                          <Group justify="space-between">
                            <Box>
                              <Group gap="xs">
                                <Badge variant="light" color="dark">
                                  {dayjs(d.date).format('DD/MM/YYYY')}
                                </Badge>
                                <Text size="xs">{d.time_start || ''}</Text>
                              </Group>
                              <Text size="sm" fw={500} mt={4}>
                                {d.venues?.name || d.venue_name || 'Local a definir'}{' '}
                                {d.cities?.name && `• ${d.cities.name}`}
                              </Text>
                            </Box>
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                ))
              : null}

            {/* Datas sem leg */}
            {groupedByLeg['no-leg']?.length > 0 && (
              <Box>
                {tourLegs.length > 0 && (
                  <Title order={4} fz="sm" tt="uppercase" c="dimmed" mb="xs">
                    Outras datas
                  </Title>
                )}
                <Stack gap="xs">
                  {groupedByLeg['no-leg'].map((d) => (
                    <Card key={d.id} withBorder radius="md" p="sm">
                      <Text size="sm">
                        <Badge mr={6}>{d.date}</Badge>
                        {d.venues?.name || d.venue_name}{' '}
                        {d.cities?.name && `• ${d.cities.name}`}{' '}
                        {d.countries?.name_ptbr && `• ${d.countries.name_ptbr}`}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}

            {tourDates.length === 0 && (
              <Text size="sm" c="dimmed">
                Nenhuma data cadastrada.
              </Text>
            )}
          </Stack>
        )}
      </Container>
    </>
  )
}
