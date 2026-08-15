import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchEventDetails,
  fetchEventGigs,
  fetchEventAttendees,
  fetchInterestTypes,
  fetchMyEventInterest,
  upsertEventInterest,
  deleteEventInterest,
} from '../queries/events'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  Container,
  Skeleton,
  Modal,
  Grid,
  Image,
  Checkbox,
  Popover,
  Switch,
  Group,
  Avatar,
  Box,
  Title,
  Text,
  Stack,
  Flex,
  Affix,
  ThemeIcon,
  Spoiler,
  Paper,
  Button,
  Divider,
  Badge,
  Scroller,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import {
  IconCircleCheck,
  IconInfoCircleFilled,
  IconX,
  IconMapPin,
  IconTicket,
  IconWorld,
  IconBrandInstagram,
  IconExternalLink,
  IconBrandWaze,
  IconCheck,
  IconCalendar,
} from '@tabler/icons-react'
import dayjs from 'dayjs'

const EVENTS_PATH =
  'https://ik.imagekit.io/mublin/events/tr:h-144,w-144,c-maintain_ratio/'
const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-120,w-120,c-maintain_ratio/users/avatars/'

function EventMap({ latitude, longitude, venueName, addressLine }) {
  if (!latitude || !longitude) {
    return null
  }
  const bbox = `${longitude - 0.008}%2C${latitude - 0.008}%2C${longitude + 0.008}%2C${latitude + 0.008}`
  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      <Box h={300}>
        <iframe
          title={`Mapa - ${venueName}`}
          width="100%"
          height="100%"
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`}
        />
      </Box>
      <Box
        p="sm"
        bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-7))"
      >
        <Group gap="xs" mb={2}>
          <ThemeIcon size={18} radius="xl" variant="light" color="violet">
            <IconMapPin size={12} />
          </ThemeIcon>
          <Text size="sm" fw={600} lineClamp={1}>
            {venueName}
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          {addressLine}
        </Text>
        <Group gap="xs" mt="sm">
          <Button
            size="compact-xs"
            variant="light"
            color="var(--mantine-color-text)"
            component="a"
            href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
            target="_blank"
          >
            Google Maps
          </Button>
          <Button
            size="compact-xs"
            variant="light"
            color="var(--mantine-color-text)"
            component="a"
            href={`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`}
            target="_blank"
            leftSection={<IconBrandWaze size={14} />}
          >
            Waze
          </Button>
        </Group>
      </Box>
    </Paper>
  )
}

export default function Event() {
  const { user } = useAuth()
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const [opened, { open, close }] = useDisclosure(false)
  const [attendeesModal, { open: openAttendees, close: closeAttendees }] =
    useDisclosure(false)

  useEffect(() => {
    window.scrollTo({ y: 0 })
  }, [])

  const { data: event, isLoading } = useQuery({
    queryKey: ['event-details', slug],
    queryFn: () => fetchEventDetails(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 4,
  })
  const { data: attendees = [] } = useQuery({
    queryKey: ['event-attendees', event?.id],
    queryFn: () => fetchEventAttendees(event.id),
    enabled: !!event?.id,
  })
  const { data: gigs = [], isLoading: isLoadingGigs } = useQuery({
    queryKey: ['event-gigs', event?.id],
    queryFn: () => fetchEventGigs(event?.id),
    enabled: !!event?.id,
  })
  const { data: myInterest } = useQuery({
    queryKey: ['my-event-interest', event?.id, user?.id],
    queryFn: () => fetchMyEventInterest(event.id, user.id),
    enabled: !!event?.id && !!user?.id,
  })
  const { data: interestTypes } = useQuery({
    queryKey: ['interest-types'],
    queryFn: fetchInterestTypes,
  })

  const interestForm = useForm({
    initialValues: { is_interested: false, is_confirmed: false, type_ids: [] },
  })

  useEffect(() => {
    if (myInterest && opened) {
      interestForm.setValues({
        is_interested: myInterest.is_interested,
        is_confirmed: myInterest.is_confirmed,
        type_ids: myInterest.type_ids || [],
      })
    }
  }, [myInterest, opened])

  const saveMutation = useMutation({
    mutationFn: upsertEventInterest,
    onSuccess: () => {
      notifications.show({
        color: 'green',
        message: 'Interesse registrado!',
        icon: <IconCircleCheck size={18} />,
      })
      queryClient.invalidateQueries({ queryKey: ['my-event-interest', event?.id] })
      queryClient.invalidateQueries({ queryKey: ['event-attendees', event?.id] })
      close()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: () => deleteEventInterest(event.id, user.id),
    onSuccess: () => {
      notifications.show({ color: 'blue', message: 'Interesse removido' })
      queryClient.invalidateQueries({ queryKey: ['my-event-interest', event?.id] })
      queryClient.invalidateQueries({ queryKey: ['event-attendees', event?.id] })
      interestForm.reset()
      close()
    },
  })
  function handleSaveInterest(values) {
    if (!user) {
      return notifications.show({ color: 'orange', message: 'Faça login' })
    }
    if (!values.is_interested && myInterest) {
      return deleteMutation.mutate()
    }
    saveMutation.mutate({
      eventId: event.id,
      userId: user.id,
      isInterested: values.is_interested,
      isConfirmed: values.is_confirmed,
      typeIds: values.type_ids,
    })
  }

  useEffect(() => {
    if (interestForm.values.type_ids.includes('4')) {
      interestForm.setFieldValue('is_confirmed', true)
    }
  }, [interestForm.values.type_ids])

  if (isLoading) {
    return (
      <Container
        size="md"
        py={{ base: 'md', sm: 0 }}
        px={{ base: 'md', sm: 'md' }}
        mt={{ base: 44, sm: 10 }}
      >
        <Skeleton height={120} radius="md" />
      </Container>
    )
  }
  if (!event) {
    return (
      <Container size="sm" py="xl">
        <Flex direction="column" align="center">
          <Text>Evento não encontrado</Text>
        </Flex>
      </Container>
    )
  }

  const addressLine = event?.venue
    ? `${event.venue.address || ''}${event.venue.address_number ? `, ${event.venue.address_number}` : ''} - ${event.venue.neighborhood || ''} - ${event.venue.city?.name || ''}`
    : ''

  return (
    <>
      <Helmet>
        <title>{event?.name ? `${event.name} · Mublin` : 'Mublin'}</title>
      </Helmet>
      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Evento" />
      </Affix>

      <Container
        size="md"
        py={{ base: 'md', sm: 0 }}
        px={{ base: 'md', sm: 'md' }}
        mt={{ base: 44, sm: 10 }}
      >
        <Grid gutter="xl" align="flex-start">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="lg">
              {/* HEADER */}
              <Paper withBorder radius="md" p="md" className="paperWrapper">
                <Group gap="sm" align="center" wrap="nowrap">
                  <Image
                    src={event?.picture_url ? EVENTS_PATH + event.picture_url : undefined}
                    fit="cover"
                    w={94}
                    h={94}
                    radius="lg"
                  />
                  <Stack gap={6}>
                    <Group gap="xs">
                      <Badge size="sm" variant="light" color="var(--mantine-color-text)">
                        {event.category?.name || 'Evento'}
                      </Badge>
                      <Badge size="sm" variant="light" color="var(--mantine-color-text)">
                        {event?.event_type?.name}
                      </Badge>
                    </Group>
                    <Title order={2} size="h3" lh={1.1}>
                      {event.name}
                    </Title>
                    <Flex gap={6} align="center">
                      <Text size="xs" span c="dimmed">
                        Criado por
                      </Text>
                      <Link to={`/${event.author?.username}`}>
                        <Avatar
                          src={AVATAR_PATH + event.author?.avatar}
                          size={20}
                          title={event.author?.full_name}
                        />
                      </Link>
                      <Text size="xs" span c="dimmed">
                        {event.author?.username}
                      </Text>
                      <Popover width={240} position="bottom" withArrow shadow="md">
                        <Popover.Target>
                          <IconInfoCircleFilled
                            size={14}
                            color="gray"
                            style={{ cursor: 'pointer' }}
                          />
                        </Popover.Target>
                        <Popover.Dropdown>
                          <Text size="xs">
                            O criador deste evento no Mublin não necessariamente
                            representa a organização oficial
                          </Text>
                        </Popover.Dropdown>
                      </Popover>
                    </Flex>
                  </Stack>
                </Group>
                <Stack gap={4} mt="xs">
                  <Group gap={4}>
                    <ThemeIcon size={18} radius="xl" variant="transparent">
                      <IconCalendar size={15} stroke={2} color="gray" />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed">
                      {dayjs(event.date_start).format('DD [de] MMMM')}
                      {' · '}
                      {event.time_event_start?.slice(0, 5)} às{' '}
                      {event.time_event_end?.slice(0, 5)}
                    </Text>
                  </Group>
                  <Group gap={4}>
                    <ThemeIcon size={18} radius="xl" variant="transparent">
                      <IconMapPin size={15} stroke={2} color="gray" />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {event.venue?.name} · {event.venue?.city?.name}
                    </Text>
                  </Group>
                </Stack>
                <Group mt="xs">
                  <Button
                    size="xs"
                    leftSection={myInterest?.is_interested && <IconCheck size={16} />}
                    onClick={open}
                    color={
                      myInterest?.is_interested ? 'green.9' : 'var(--mantine-color-text)'
                    }
                    variant={myInterest?.is_interested ? 'filled' : 'light'}
                  >
                    {myInterest?.is_interested
                      ? 'Interesse registrado'
                      : 'Demonstrar interesse'}
                  </Button>
                  <Text size="xs" c="dimmed">
                    {attendees?.length || 0} interessados
                  </Text>
                </Group>
                {event.description && (
                  <>
                    <Divider variant="dashed" my="md" />
                    <Spoiler
                      maxHeight={82}
                      showLabel={<Text size="sm">Ver mais</Text>}
                      hideLabel={<Text size="sm">Ver menos</Text>}
                    >
                      <Text
                        size="sm"
                        className="allow-copy"
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {event.description}
                      </Text>
                    </Spoiler>
                  </>
                )}
              </Paper>

              {/* INTERESSADOS - SCROLLER */}
              <Paper withBorder radius="md" p="md">
                <Group justify="space-between" mb="sm">
                  <Group gap="xs">
                    <Text fw={600} size="18px">
                      Interessados
                    </Text>
                    <Badge size="xs" variant="light" color="gray">
                      {attendees.length}
                    </Badge>
                  </Group>
                  {attendees.length > 8 && (
                    <Button size="compact-xs" variant="subtle" onClick={openAttendees}>
                      Ver todos
                    </Button>
                  )}
                </Group>
                {attendees.length ? (
                  <Scroller type="auto" scrollbars="x" className="scrollerRoot">
                    <Group gap="sm" wrap="nowrap" py={4}>
                      {attendees.map((att) => {
                        const prof = att.profiles || att.user || att
                        return (
                          <Stack
                            key={att.id || prof.id}
                            gap={4}
                            align="center"
                            style={{ minWidth: 64 }}
                          >
                            <Avatar
                              size={48}
                              radius="xl"
                              src={prof.avatar ? AVATAR_PATH + prof.avatar : undefined}
                              component={Link}
                              to={`/${prof.username}`}
                            />
                            <Text size="11px" c="dimmed" lineClamp={1} ta="center" w={64}>
                              {prof.full_name?.split(' ')[0] || prof.username}
                            </Text>
                          </Stack>
                        )
                      })}
                    </Group>
                  </Scroller>
                ) : (
                  <Text size="sm" c="dimmed">
                    Seja o primeiro a demonstrar interesse
                  </Text>
                )}
              </Paper>

              {/* GIGS */}
              <Paper withBorder radius="md" p="md">
                <Text fw={600} size="18px" mb="sm">
                  Gigs associadas a este evento
                </Text>
                {isLoadingGigs ? (
                  <Skeleton height={60} />
                ) : gigs.length ? (
                  <Stack gap="sm">
                    {gigs.map((g) => (
                      <Paper key={g.id} withBorder p="sm" radius="sm">
                        <Group justify="space-between">
                          <Box>
                            <Text size="sm" fw={600}>
                              {g.title || 'Vaga'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {g.description}
                            </Text>
                          </Box>
                          <Button
                            size="xs"
                            variant="light"
                            component={Link}
                            to={`/gigs/${g.id}`}
                          >
                            Ver vaga
                          </Button>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    Nenhuma gig associada até o momento
                  </Text>
                )}
              </Paper>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md" pos={{ base: 'static', md: 'sticky' }} top={20}>
              <Paper withBorder radius="md" p="md">
                <Stack gap="sm">
                  {event.tickets_url && (
                    <Button
                      fullWidth
                      leftSection={<IconTicket size={20} />}
                      component="a"
                      href={event.tickets_url}
                      target="_blank"
                    >
                      Comprar ingressos
                    </Button>
                  )}
                  {event.website_url && (
                    <Button
                      fullWidth
                      variant="light"
                      color="var(--mantine-color-text)"
                      leftSection={<IconWorld size={20} />}
                      component="a"
                      href={event.website_url}
                      target="_blank"
                      rightSection={<IconExternalLink size={18} />}
                    >
                      Site oficial
                    </Button>
                  )}
                  {event.instagram_handle && (
                    <Button
                      fullWidth
                      variant="default"
                      leftSection={<IconBrandInstagram size={16} />}
                      component="a"
                      href={`https://instagram.com/${event.instagram_handle.replace('@', '')}`}
                      target="_blank"
                    >
                      @{event.instagram_handle.replace('@', '')}
                    </Button>
                  )}
                </Stack>
              </Paper>

              <Box>
                <Box p={{ base: 'lg', sm: 0 }}>
                  <EventMap
                    latitude={event.venue?.latitude}
                    longitude={event.venue?.longitude}
                    venueName={event.venue?.name}
                    addressLine={addressLine}
                  />
                </Box>
                <Text size="xs" c="dimmed" mt="xs" className="allow-copy">
                  {event.venue?.address}, {event.venue?.address_number}
                  <br />
                  {event.venue?.neighborhood} - {event.venue?.city?.name},{' '}
                  {event.venue?.city?.region?.uf}
                </Text>
              </Box>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>

      {/* MODAL TODOS INTERESSADOS */}
      <Modal
        opened={attendeesModal}
        onClose={closeAttendees}
        title={`Interessados (${attendees.length})`}
        radius="md"
        size="sm"
        centered
      >
        <Stack gap="xs" mt="sm">
          {attendees.map((att) => {
            const prof = att.profiles || att.user || att
            return (
              <Group
                key={att.id || prof.id}
                gap="sm"
                component={Link}
                to={`/${prof.username}`}
                className="noDecoration"
              >
                <Avatar
                  size={36}
                  radius="xl"
                  src={prof.avatar ? AVATAR_PATH + prof.avatar : undefined}
                />
                <Box>
                  <Text size="sm" fw={500}>
                    {prof.full_name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    @{prof.username}
                  </Text>
                </Box>
              </Group>
            )
          })}
        </Stack>
      </Modal>

      <Modal
        opened={opened}
        onClose={close}
        title="Demonstrar interesse"
        radius="md"
        centered
      >
        <Stack mt="xs" gap="md">
          <Switch
            label="Tenho interesse"
            description="Será notificado"
            size="sm"
            {...interestForm.getInputProps('is_interested', { type: 'checkbox' })}
          />
          <Switch
            label="Presença confirmada"
            size="sm"
            disabled={!interestForm.values.is_interested}
            {...interestForm.getInputProps('is_confirmed', { type: 'checkbox' })}
          />
          <Divider label="Qual seu interesse?" labelPosition="left" />
          <Checkbox.Group {...interestForm.getInputProps('type_ids')}>
            <Stack gap="xs" mt="xs">
              {interestTypes?.map((t) => (
                <Checkbox
                  key={t.id}
                  value={String(t.id)}
                  label={t.name}
                  description={t.description}
                  disabled={!interestForm.values.is_interested}
                />
              ))}
            </Stack>
          </Checkbox.Group>
          <Group justify="space-between" mt="md">
            <Box>
              {myInterest?.is_interested && (
                <Button
                  variant="subtle"
                  color="red"
                  size="sm"
                  loading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                  leftSection={<IconX size={16} />}
                >
                  Remover interesse
                </Button>
              )}
            </Box>
            <Group>
              <Button size="sm" variant="default" onClick={close}>
                Cancelar
              </Button>
              <Button
                size="sm"
                loading={saveMutation.isPending}
                onClick={() => interestForm.onSubmit(handleSaveInterest)()}
                disabled={!interestForm.values.is_interested}
              >
                Salvar
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
