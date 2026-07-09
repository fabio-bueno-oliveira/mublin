import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchEventDetails, fetchEventGigs } from '../queries/events'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  Container,
  Anchor,
  Box,
  Title,
  Text,
  Stack,
  Skeleton,
  Avatar,
  Center,
  Flex,
  Group,
  Affix,
  Card,
  List,
  ThemeIcon,
} from '@mantine/core'
import { IconCheck, IconClock } from '@tabler/icons-react'
import dayjs from 'dayjs'

const EVENTS_PATH =
  'https://ik.imagekit.io/mublin/events/tr:h-200,w-200,c-maintain_ratio/'
const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-80,c-maintain_ratio/users/avatars/'
const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects/'

export default function Event() {
  const { slug } = useParams()
  const [expandedDescription, setExpandedDescription] = useState(false)

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

  const { data: gigs = [], isLoading: isLoadingGigs } = useQuery({
    queryKey: ['event-gigs', event?.id],
    queryFn: () => fetchEventGigs(event?.id),
    enabled: !!event?.id,
    staleTime: 1000 * 60 * 5,
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
                      <Title order={1} fz="h2">
                        {event?.name}
                      </Title>
                      <Text size="sm">
                        {dayjs(event.date_start).format('DD/MM/YYYY')} {' a '}
                        {dayjs(event.date_end).format('DD/MM/YYYY')}
                      </Text>
                      {/* <Text size="10px" c="dimmed">
                        {dayjs(event.date_start).format('dddd D [de] MMMM')} {' a '}
                        {dayjs(event.date_end).format('dddd D [de] MMMM [de] YYYY')}
                      </Text> */}
                      <Flex gap={6} align="center" mt="sm">
                        <Text size="xs" span c="dimmed">
                          Evento criado por
                        </Text>
                        <Link to={`/${event.author?.username}`}>
                          <Avatar src={AVATAR_PATH + event.author?.avatar} size={20} />
                        </Link>
                        <Text size="xs" span c="dimmed">
                          {event.author?.full_name}
                        </Text>
                      </Flex>
                      <Text
                        mt="md"
                        fz="md"
                        lh={1.4}
                        style={{ whiteSpace: 'pre-line', cursor: 'default' }}
                        lineClamp={expandedDescription ? undefined : 3}
                        onClick={() => setExpandedDescription(!expandedDescription)}
                      >
                        {event?.description}
                      </Text>
                    </Stack>

                    {isLoadingGigs ? (
                      <Text>Carregando gigs relacionadas a este evento...</Text>
                    ) : (
                      <Box>
                        <Text size="sm" c="dimmed">
                          Gigs cadastradas para este evento:
                        </Text>
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
                          <Text size="sm" mb="md">
                            Nenhuma gig cadastrada para este evento
                          </Text>
                        )}
                      </Box>
                    )}

                    <Stack gap="sm">
                      <Box>
                        <Text size="sm" c="dimmed" lh={1}>
                          Website
                        </Text>
                        <Anchor size="sm" href={event?.website_url} target="_blank">
                          {event?.website_url}
                        </Anchor>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed" lh={1}>
                          Ingressos
                        </Text>
                        <Anchor size="sm" href={event?.tickets_url} target="_blank">
                          Acessar site de compra de ingressos
                        </Anchor>
                      </Box>
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
    </>
  )
}
