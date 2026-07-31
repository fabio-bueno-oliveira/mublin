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
  Checkbox,
  Alert,
  Switch,
  Group,
  Anchor,
  Avatar,
  Box,
  Title,
  Text,
  Stack,
  Center,
  Flex,
  Affix,
  Card,
  List,
  ThemeIcon,
  ScrollArea,
  Indicator,
  Spoiler,
  Paper,
  Button,
  Divider,
  Popover,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import {
  IconCheck,
  IconClock,
  IconHeart,
  IconHeartFilled,
  IconCircleCheck,
  IconInfoCircle,
  IconX,
  IconInfoCircleFilled,
  IconBrandInstagram,
} from '@tabler/icons-react'
import dayjs from 'dayjs'

const EVENTS_PATH =
  'https://ik.imagekit.io/mublin/events/tr:h-200,w-200,c-maintain_ratio/'
const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-80,c-maintain_ratio/users/avatars/'
const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects/'

export default function Event() {
  const { user } = useAuth()
  const { slug } = useParams()
  const queryClient = useQueryClient()

  const [opened, { open, close }] = useDisclosure(false)

  useEffect(() => {
    scrollTo({ y: 0 })
  }, [])

  const {
    data: event,
    isLoading: isLoadingEventDetails,
    isSuccess,
  } = useQuery({
    queryKey: ['event-details', slug],
    queryFn: () => fetchEventDetails(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 4,
  })

  const { data: attendees, isLoading: loadingAttendees } = useQuery({
    queryKey: ['event-attendees', event?.id],
    queryFn: () => fetchEventAttendees(event.id),
    enabled: !!event?.id,
  })

  const { data: gigs = [], isLoading: isLoadingGigs } = useQuery({
    queryKey: ['event-gigs', event?.id],
    queryFn: () => fetchEventGigs(event?.id),
    enabled: !!event?.id,
    staleTime: 1000 * 60 * 5,
  })

  // Busca meu interesse atual
  const { data: myInterest } = useQuery({
    queryKey: ['my-event-interest', event?.id, user?.id],
    queryFn: () => fetchMyEventInterest(event.id, user.id),
    enabled: !!event?.id && !!user?.id,
  })

  // Busca tipos disponíveis
  const { data: interestTypes } = useQuery({
    queryKey: ['interest-types'],
    queryFn: fetchInterestTypes,
  })

  // Form do modal
  const interestForm = useForm({
    initialValues: {
      is_interested: false,
      is_confirmed: false,
      type_ids: [],
    },
  })

  // Sincroniza form com dados do banco quando abrir
  useEffect(() => {
    if (myInterest && opened) {
      interestForm.setValues({
        is_interested: myInterest.is_interested,
        is_confirmed: myInterest.is_confirmed,
        type_ids: myInterest.type_ids || [],
      })
    }
  }, [myInterest, opened])

  // Mutation pra salvar
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
    onError: () => {
      notifications.show({
        color: 'red',
        title: 'Ops...',
        message: 'Não foi possível salvar. Tente novamente.',
      })
    },
  })

  function handleSaveInterest(values) {
    if (!user) {
      notifications.show({
        color: 'orange',
        message: 'Faça login para demonstrar interesse',
      })
      return
    }

    // Se desmarcou "Tenho interesse", deleta o registro
    if (!values.is_interested && myInterest) {
      deleteMutation.mutate()
      return
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
    // Se marcar "Estou entre as atrações", confirma automaticamente
    if (interestForm.values.type_ids.includes('4')) {
      interestForm.setFieldValue('is_confirmed', true)
    }
  }, [interestForm.values.type_ids])

  const deleteMutation = useMutation({
    mutationFn: () => deleteEventInterest(event.id, user.id),
    onSuccess: () => {
      notifications.show({
        color: 'blue',
        message: 'Interesse removido',
      })
      queryClient.invalidateQueries({ queryKey: ['my-event-interest', event?.id] })
      queryClient.invalidateQueries({ queryKey: ['event-attendees', event?.id] })
      interestForm.reset()
      close() // fecha o modal
    },
    onError: () => {
      notifications.show({
        color: 'red',
        message: 'Erro ao remover. Tente novamente.',
      })
    },
  })

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{event?.name ? `${event.name} · Mublin` : 'Mublin'}</title>
        <link rel="canonical" href={`https://mublin.com/event/${event?.slug || ''}`} />
        <meta
          name="description"
          content={`Informações de '${event?.name || ''}' no Mublin`}
        />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Evento" />
      </Affix>

      <Container size="sm" py="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 62, sm: 0 }}>
        <Stack gap="xs" mb="xl">
          {isLoadingEventDetails ? (
            <Center>
              <Skeleton radius="xl" height={100} width={100} />
            </Center>
          ) : (
            <>
              {isSuccess && event ? (
                <>
                  <Text ta="center" c="dimmed" size="13px" mb={6} visibleFrom="sm">
                    Evento
                  </Text>
                  <Center pos="relative">
                    <Avatar
                      size={100}
                      radius="xl"
                      src={
                        event?.picture_url ? EVENTS_PATH + event.picture_url : undefined
                      }
                      title={event?.name}
                      alt={event?.name}
                    />
                  </Center>
                  <Flex justify="center" direction="column">
                    <Stack align="center" gap={2} mb="lg">
                      <Group align="center" gap="md" mb="sm">
                        {/* Caixinha da data */}
                        {event.date_start === event.date_end ? (
                          <Paper
                            withBorder
                            radius="md"
                            w={70}
                            style={{ overflow: 'hidden' }}
                          >
                            <Stack gap={0} align="center">
                              <Text
                                size="xs"
                                fw={700}
                                tt="uppercase"
                                c="white"
                                bg="red.6"
                                w="100%"
                                ta="center"
                                py={2}
                              >
                                {dayjs(event.date_start).format('MMM')}
                              </Text>
                              <Text size="xl" fw={700} py={4}>
                                {dayjs(event.date_start).format('DD')}
                              </Text>
                            </Stack>
                          </Paper>
                        ) : (
                          <Paper
                            withBorder
                            radius="md"
                            w={70}
                            style={{ overflow: 'hidden' }}
                          >
                            <Stack gap={0} align="center">
                              <Text
                                size="xs"
                                fw={700}
                                tt="uppercase"
                                c="white"
                                bg="red.6"
                                w="100%"
                                ta="center"
                                py={2}
                              >
                                {dayjs(event.date_start).format('MMM')}
                              </Text>
                              <Text size="sm" fw={700} py={12}>
                                {dayjs(event.date_start).format('DD')} a{' '}
                                {dayjs(event.date_end).format('DD')}
                              </Text>
                            </Stack>
                          </Paper>
                        )}

                        {/* Título do evento */}
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Title order={1} fz="h2">
                            {event?.name}
                          </Title>
                          <Text size="xs" c="dimmed">
                            {dayjs(event.date_start).format('dddd, DD [de] MMMM')}
                            <br />
                            {event.date_start !== event.date_end &&
                              `a ${dayjs(event.date_end).format('dddd, DD [de] MMMM [de] YYYY')}`}
                          </Text>
                        </Stack>
                      </Group>
                      <Flex gap={6} align="center">
                        <Text size="xs" span c="dimmed">
                          Evento criado por
                        </Text>
                        <Link to={`/${event.author?.username}`}>
                          <Avatar src={AVATAR_PATH + event.author?.avatar} size={20} />
                        </Link>
                        <Text size="xs" span c="dimmed">
                          {event.author?.full_name}
                        </Text>
                        <Popover width={240} position="bottom" withArrow shadow="md">
                          <Popover.Target>
                            <IconInfoCircleFilled
                              size={16}
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
                      {user && (
                        <Flex justify="center" mt="sm">
                          <Button
                            size="sm"
                            variant={myInterest?.is_interested ? 'light' : 'outline'}
                            leftSection={
                              myInterest?.is_interested ? (
                                <IconHeartFilled size={18} />
                              ) : (
                                <IconHeart size={18} />
                              )
                            }
                            color={
                              myInterest?.is_interested ? 'mublinColor' : 'mublinColor'
                            }
                            onClick={open}
                          >
                            {myInterest?.is_interested
                              ? 'Interesse registrado'
                              : 'Demonstrar interesse'}
                          </Button>
                        </Flex>
                      )}
                      <Spoiler
                        mt="lg"
                        maxHeight={68}
                        showLabel={<Text size="sm">Ver mais</Text>}
                        hideLabel={<Text size="sm">Ver menos</Text>}
                        fz="sm"
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        {event?.description}
                      </Spoiler>
                    </Stack>

                    {loadingAttendees ? (
                      <Text c="dimmed">
                        Carregando pessoas interessadas neste evento...
                      </Text>
                    ) : (
                      <>
                        {attendees && attendees.length > 0 && (
                          <>
                            <Divider
                              label={`Interessados neste evento (${attendees.length})`}
                              labelPosition="left"
                            />

                            <ScrollArea type="hover" offsetScrollbars>
                              <Group gap="sm" wrap="nowrap" py="xs" align="flex-start">
                                {attendees.map((person) => (
                                  <Stack key={person.id} align="center" gap={4} w={88}>
                                    <Link to={`/${person.username}`}>
                                      <Indicator
                                        disabled={!person.is_confirmed}
                                        color="green"
                                        size={14}
                                        position="bottom-end"
                                        withBorder
                                        label={<IconCheck size={9} />}
                                      >
                                        <Avatar
                                          src={AVATAR_PATH + person.avatar}
                                          size={44}
                                          radius="xl"
                                        >
                                          {person.full_name?.charAt(0)}
                                        </Avatar>
                                      </Indicator>
                                    </Link>

                                    <Text
                                      ta="center"
                                      size="xs"
                                      fw={500}
                                      lineClamp={1}
                                      w="100%"
                                      title={person.full_name}
                                    >
                                      {person.full_name}
                                    </Text>

                                    {person.interests.length > 0 && (
                                      <Text
                                        fz="10px"
                                        c="dimmed"
                                        ta="center"
                                        lineClamp={2}
                                      >
                                        {person.interests
                                          .map((interest) => `✓ ${interest}`)
                                          .join('  ')}
                                      </Text>
                                    )}
                                  </Stack>
                                ))}
                              </Group>
                            </ScrollArea>
                          </>
                        )}
                      </>
                    )}

                    {isLoadingGigs ? (
                      <Text>Carregando gigs relacionadas a este evento...</Text>
                    ) : (
                      <Box>
                        <Divider
                          label={`Gigs neste evento: (${gigs.length})`}
                          labelPosition="left"
                        />
                        {gigs.length > 0 ? (
                          <Group mb="md" mt={8}>
                            {gigs.map((gig) => (
                              <Card p="xs" w={180}>
                                <Avatar
                                  src={
                                    gig.project?.picture
                                      ? `${PROJECT_AVATAR_PATH}/${gig.project?.id}/tr:h-200,w-200,c-maintain_ratio/${gig.project?.picture}`
                                      : undefined
                                  }
                                  radius="sm"
                                  size={40}
                                  mb="xs"
                                />
                                <Text size="xs">{gig.project?.name}</Text>
                                <Text size="xs" opacity={0.7}>
                                  {gig.project?.type?.name_ptbr}
                                </Text>
                                {gig.roles?.length > 0 && (
                                  <List listStyleType="none" mt={6} type="unordered">
                                    {gig.roles?.map((role) => (
                                      <List.Item
                                        icon={
                                          <ThemeIcon
                                            color={role.is_filled ? 'green' : 'blue'}
                                            size={18}
                                            radius="md"
                                          >
                                            {role.is_filled ? (
                                              <IconCheck size={12} />
                                            ) : (
                                              <IconClock size={12} />
                                            )}
                                          </ThemeIcon>
                                        }
                                      >
                                        <Text size="11px">
                                          {role.role.description_ptbr}
                                        </Text>
                                      </List.Item>
                                    ))}
                                  </List>
                                )}
                              </Card>
                            ))}
                          </Group>
                        ) : (
                          <Card p="xs" mt="xs" mb="sm">
                            <Text ta="center" c="dimmed" size="sm">
                              Nenhuma gig vinculada a este evento até o momento
                            </Text>
                          </Card>
                        )}
                      </Box>
                    )}

                    <Stack mt="md" gap="sm">
                      <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Box>
                            <Text size="sm" c="dimmed" lh={1}>
                              Website
                            </Text>
                            <Anchor size="sm" href={event?.website_url} target="_blank">
                              {event?.website_url}
                            </Anchor>
                          </Box>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Box>
                            <Text size="sm" c="dimmed" lh={1}>
                              Ingressos
                            </Text>
                            <Anchor size="sm" href={event?.tickets_url} target="_blank">
                              Acessar site de compra de ingressos
                            </Anchor>
                          </Box>
                        </Grid.Col>
                      </Grid>

                      {event?.instagram_handle && (
                        <Box>
                          <Group gap={4}>
                            <Text size="sm" c="dimmed" lh={1}>
                              Instagram
                            </Text>
                            <IconBrandInstagram size={16} color="gray" />
                          </Group>
                          <Anchor
                            size="sm"
                            href={event?.instagram_handle}
                            target="_blank"
                          >
                            @{event?.instagram_handle}
                          </Anchor>
                        </Box>
                      )}

                      <Box>
                        <Text size="sm" c="dimmed">
                          Local
                        </Text>
                        <Text size="sm">{event?.venue?.name}</Text>
                        <Text size="xs">
                          {event?.venue?.address}, {event?.venue?.address_number}
                        </Text>
                        <Text size="xs">
                          {event?.venue?.neighborhood} - {event?.venue?.city?.name},{' '}
                          {event?.venue?.city?.region?.uf ??
                            event?.venue?.city?.region?.name}
                        </Text>
                        {event?.venue.longitude && event?.venue.latitude && (
                          <Box mt="sm" style={{ borderRadius: 8, overflow: 'hidden' }}>
                            <iframe
                              title="Mapa"
                              width="100%"
                              height="120"
                              style={{ border: 0 }}
                              loading="lazy"
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                                event?.venue.longitude - 0.01
                              }%2C${event?.venue.latitude - 0.01}%2C${
                                event?.venue.longitude + 0.01
                              }%2C${event?.venue.latitude + 0.01}&layer=mapnik&marker=${event?.venue.latitude}%2C${event?.venue.longitude}`}
                            />
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  </Flex>
                </>
              ) : (
                <Flex mt="lg" align="center" direction="column">
                  <Text size="lg" ta="center">
                    Evento não encontrado
                  </Text>
                  <Text size="xs" c="dimmed">
                    Verifique o endereço da página e tente novamente
                  </Text>
                </Flex>
              )}
            </>
          )}
        </Stack>
      </Container>
      <Modal opened={opened} onClose={close} title="Demonstrar interesse">
        <Stack mt="xs">
          <Switch
            label="Tenho interesse neste evento"
            description="Você será notificado sobre novidades"
            size="sm"
            {...interestForm.getInputProps('is_interested', { type: 'checkbox' })}
          />

          <Switch
            label="Minha presença está confirmada"
            description="Já comprei ingresso / vou comparecer"
            size="sm"
            disabled={!interestForm.values.is_interested}
            {...interestForm.getInputProps('is_confirmed', { type: 'checkbox' })}
          />

          <Divider label="Qual seu interesse?" labelPosition="left" />

          <Checkbox.Group
            {...interestForm.getInputProps('type_ids')}
            label="Selecione uma ou mais opções"
          >
            <Stack gap="xs" mt="xs">
              {interestTypes?.map((type) => (
                <Checkbox
                  key={type.id}
                  value={String(type.id)}
                  label={type.name}
                  description={type.description}
                  disabled={!interestForm.values.is_interested}
                />
              ))}
            </Stack>
          </Checkbox.Group>

          {interestForm.values.type_ids.includes('4') && (
            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
              Marcando "Estou entre as atrações confirmadas", sua presença será
              automaticamente confirmada.
            </Alert>
          )}

          <Group justify="space-between" mt="md">
            <Box>
              {myInterest?.is_interested && (
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  loading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                  leftSection={<IconX size={16} />}
                >
                  Remover interesse
                </Button>
              )}
            </Box>

            <Group>
              <Button size="xs" variant="default" onClick={close}>
                Cancelar
              </Button>
              <Button
                size="xs"
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
