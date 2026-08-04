import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchRecentProfiles } from '../queries/search'
import { fetchEvents } from '../queries/events'
import { fetchNewsFeed } from '../queries/feed'
import NewsCard from '../components/feed/NewsCard'
// prettier-ignore
import {
  Skeleton,
  Box, Card,
  Container, Stack,
  Group, Flex,
  Text, Title, 
  Image, Avatar,
  ThemeIcon,
  Badge,
} from '@mantine/core'
import { useMediaQuery, useScroller } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { getAvatarUrl } from '../utils/profile'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import {
  IconUser,
  IconChevronLeft,
  IconChevronRight,
  IconMusic,
  IconSparkles,
} from '@tabler/icons-react'

const CDN_PREFIX = 'https://ik.imagekit.io/mublin'
const EVENTS_IMG_PATH = `${CDN_PREFIX}/tr:h-320,c-maintain_ratio/events/`
const AVATAR_PATH = `${CDN_PREFIX}/tr:h-80,c-maintain_ratio/users/avatars/`

export default function Home() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const isDesktop = useMediaQuery('(min-width: 48em)')
  const peopleScroller = useScroller()
  const eventsScroller = useScroller()
  const newsScroller = useScroller()

  useEffect(() => {
    if (isDesktop && profile?.feed_as_home) {
      const redirected = sessionStorage.getItem('feed_redirected')
      if (!redirected) {
        sessionStorage.setItem('feed_redirected', 'true')
        navigate('/feed', { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const { data: recentProfiles = [], isLoading: loadingRecentProfiles } = useQuery({
    queryKey: ['recent-profiles'],
    queryFn: () => fetchRecentProfiles(10),
    staleTime: 1000 * 60 * 5,
  })

  const { data: globalEvents = [], isLoading: loadingGlobalEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetchEvents(10),
    staleTime: 1000 * 60 * 5,
  })

  const { data: news = [], isLoading: loadingNews } = useQuery({
    queryKey: ['news', user?.id],
    queryFn: () => fetchNewsFeed(5),
    staleTime: 1000 * 60 * 5,
  })

  if (loading) {
    return null
  }

  // Dynamic greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Home · Mublin</title>
        <link rel="canonical" href="https://mublin.com/home" />
      </Helmet>
      {isMobile && <AppNavbarMobile fixed={false} />}

      <Container size="xl" px={{ base: 'sm', sm: 0 }} mt={{ base: 16, sm: 0 }}>
        {loading ? (
          <>
            <Title size="h2" fw={600} lh={1.2} mt={4} mb={4}>
              Carregando...
            </Title>
            <Skeleton width={300} height={18} radius="md" />
          </>
        ) : (
          <>
            <Title size="22px" fw={600} lh={1.2} ta="left" my="md">
              {greeting}, {profile?.username}
            </Title>

            <Card
              radius="lg"
              p={{ base: 'md', sm: 'xl' }}
              mb="md"
              style={{
                position: 'relative',
                overflow: 'hidden',
                background:
                  'linear-gradient(135deg, var(--mantine-color-mublinColor-7) 0%, var(--mantine-color-blue-8) 100%)',
              }}
            >
              <IconMusic
                size={180}
                stroke={1}
                style={{
                  position: 'absolute',
                  right: -30,
                  bottom: -40,
                  opacity: 0.12,
                  color: 'white',
                  pointerEvents: 'none',
                }}
              />

              <Stack gap={6} maw={520} style={{ position: 'relative', zIndex: 1 }}>
                <Group gap={6}>
                  <IconSparkles size={16} color="white" style={{ opacity: 0.85 }} />
                  <Text
                    size="xs"
                    fw={200}
                    tt="uppercase"
                    c="white"
                    style={{ opacity: 0.85 }}
                  >
                    Bem-vindo ao Mublin
                  </Text>
                </Group>

                <Title
                  order={2}
                  c="white"
                  fw={700}
                  fz={{ base: '20px', sm: '26px' }}
                  lh={1.25}
                >
                  Sua música, suas conexões, novas oportunidades
                </Title>

                <Text c="white" size="sm" style={{ opacity: 0.9 }}>
                  Conecte-se com músicos e profissionais da música, mostre seu trabalho e
                  fique por dentro de projetos, eventos e vagas.
                </Text>

                {/* <Group mt="sm">
                  <Button
                    component={Link}
                    to="/search"
                    size="xs"
                    radius="md"
                    variant="white"
                    color="dark"
                    leftSection={<IconZoom size={14} />}
                  >
                    Explorar oportunidades
                  </Button>
                </Group> */}
              </Stack>
            </Card>

            <Group justify="space-between" align="center" mt="xl" mb="xs">
              <Title order={3} fw={600} fz="lg">
                Novos por aqui
              </Title>
              {recentProfiles.length > 4 && (
                <Group>
                  <ThemeIcon
                    variant="default"
                    style={{
                      cursor: peopleScroller.canScrollStart ? 'pointer' : 'default',
                    }}
                    onClick={peopleScroller.scrollStart}
                    opacity={peopleScroller.canScrollStart ? 1 : 0.5}
                  >
                    <IconChevronLeft style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                  <ThemeIcon
                    variant="default"
                    style={{
                      cursor: peopleScroller.canScrollEnd ? 'pointer' : 'default',
                    }}
                    onClick={peopleScroller.scrollEnd}
                    opacity={peopleScroller.canScrollEnd ? 1 : 0.5}
                  >
                    <IconChevronRight style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                </Group>
              )}
            </Group>

            <Box>
              <div
                ref={peopleScroller.ref}
                {...peopleScroller.dragHandlers}
                className="scrollerHidden"
                style={{
                  overflow: 'auto',
                  cursor: peopleScroller.isDragging ? 'grabbing' : 'default',
                }}
              >
                <Group wrap="nowrap" gap="md">
                  {loadingRecentProfiles
                    ? [1, 2, 3, 4, 5].map((i) => (
                        <Skeleton
                          key={i}
                          width={140}
                          height={190}
                          radius="md"
                          style={{ flexShrink: 0 }}
                        />
                      ))
                    : recentProfiles.map((p) => {
                        const location = p.cities?.name
                          ? `${p.cities.name}${p.cities.countries?.name_ptbr ? `, ${p.cities.countries.name_ptbr}` : ''}`
                          : p.regions?.name
                            ? `${p.regions.name}${p.regions.uf ? ` - ${p.regions.uf}` : ''}`
                            : null

                        const mainRole = p.profile_roles?.find((r) => r.main_activity)
                          ?.roles?.description_ptbr

                        return (
                          <Link
                            key={p.id}
                            to={`/${p.username}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Card
                              p="xs"
                              w={140}
                              h={142}
                              shadow="sm"
                              withBorder
                              style={{ flexShrink: 0 }}
                              pos="relative"
                            >
                              {p.is_live && (
                                <Badge
                                  size="xs"
                                  color="red.9"
                                  pos="absolute"
                                  right={5}
                                  top={5}
                                >
                                  Live
                                </Badge>
                              )}
                              <Stack align="center" gap={3}>
                                <Avatar
                                  // src={p.avatar ? AVATAR_PATH + p.avatar : null}
                                  src={getAvatarUrl(p?.avatar, p?.is_open_to_work, 64)}
                                  size={64}
                                  radius="xl"
                                >
                                  {!p.avatar && <IconUser size={28} />}
                                </Avatar>
                                <Text size="sm" fw={600} ta="center" lineClamp={1}>
                                  {p.full_name || p.username}
                                </Text>
                                {mainRole && (
                                  <Text size="xs" ta="center" lineClamp={1}>
                                    {mainRole}
                                  </Text>
                                )}
                                {location && (
                                  <Text size="10px" c="dimmed" ta="center" lineClamp={1}>
                                    {location}
                                  </Text>
                                )}
                              </Stack>
                            </Card>
                          </Link>
                        )
                      })}
                </Group>
              </div>
            </Box>

            <Group justify="space-between" align="center" mt="lg" mb="xs">
              <Title order={3} fw={600} fz="lg">
                Eventos
              </Title>
              {globalEvents.length > 2 && (
                <Group>
                  <ThemeIcon
                    variant="default"
                    onClick={eventsScroller.scrollStart}
                    opacity={eventsScroller.canScrollStart ? 1 : 0.5}
                  >
                    <IconChevronLeft style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                  <ThemeIcon
                    variant="default"
                    onClick={eventsScroller.scrollEnd}
                    opacity={eventsScroller.canScrollEnd ? 1 : 0.5}
                  >
                    <IconChevronRight style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                </Group>
              )}
            </Group>

            {loadingGlobalEvents ? (
              <Group wrap="nowrap" gap="md">
                {[1, 2].map((i) => (
                  <Skeleton key={i} width={160} height={240} />
                ))}
              </Group>
            ) : (
              <Box>
                <div
                  ref={eventsScroller.ref}
                  {...eventsScroller.dragHandlers}
                  className="scrollerHidden"
                  style={{
                    overflow: 'auto',
                    cursor: eventsScroller.isDragging ? 'grabbing' : 'default',
                  }}
                >
                  <Group wrap="nowrap" gap="md">
                    {globalEvents.map((event) => (
                      <Link
                        key={event.id}
                        to={`/event/${event.slug}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Card p="xs" w={160} h={280} shadow="sm" padding="lg" withBorder>
                          <Card.Section>
                            <Image
                              src={EVENTS_IMG_PATH + event.picture_url}
                              height={160}
                              alt={event.name}
                            />
                          </Card.Section>
                          <Text fw={600} fz="sm" mt="xs" mb={5} lineClamp={1}>
                            {event.name}
                          </Text>
                          <Text size="10px" mb={8}>
                            {dayjs(event.date_start).format('DD/MM/YYYY')} {' a '}
                            {dayjs(event.date_end).format('DD/MM/YYYY')}
                          </Text>
                          <Text lineClamp={2} size="xs" c="dimmed">
                            {event.description}
                          </Text>
                          <Flex gap={6} align="center" mt={6}>
                            <Text size="10px" span c="dimmed">
                              Criado por
                            </Text>
                            <Avatar
                              src={AVATAR_PATH + event.author?.avatar}
                              size={20}
                              title={event.author?.full_name}
                            />
                            <Text size="10px" span lineClamp={1}>
                              {event.author?.username}
                            </Text>
                          </Flex>
                        </Card>
                      </Link>
                    ))}
                  </Group>
                </div>
              </Box>
            )}

            <Group justify="space-between" align="center" mt="lg" mb="xs">
              <Title order={3} fw={600} fz="lg">
                Notícias recentes
              </Title>
              {news.length > 2 && (
                <Group>
                  <ThemeIcon
                    variant="default"
                    style={{
                      cursor: newsScroller.canScrollStart ? 'pointer' : 'default',
                    }}
                    onClick={newsScroller.scrollStart}
                    opacity={newsScroller.canScrollStart ? 1 : 0.5}
                  >
                    <IconChevronLeft style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                  <ThemeIcon
                    variant="default"
                    style={{
                      cursor: newsScroller.canScrollEnd ? 'pointer' : 'default',
                    }}
                    onClick={newsScroller.scrollEnd}
                    opacity={newsScroller.canScrollEnd ? 1 : 0.5}
                  >
                    <IconChevronRight style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                </Group>
              )}
            </Group>

            <Box>
              <div
                ref={newsScroller.ref}
                {...newsScroller.dragHandlers}
                className="scrollerHidden"
                style={{
                  overflow: 'auto',
                  cursor: newsScroller.isDragging ? 'grabbing' : 'default',
                }}
              >
                <Group gap="xs" wrap="nowrap">
                  {loadingNews
                    ? [1, 2, 3, 4, 5].map((i) => (
                        <Skeleton
                          key={i}
                          width={300}
                          height={144}
                          style={{ flexShrink: 0 }}
                        />
                      ))
                    : news.map((item) => (
                        <Box key={item.id} style={{ flexShrink: 0 }}>
                          <NewsCard item={item} width={300} />
                        </Box>
                      ))}
                </Group>
              </div>
            </Box>

            {/* <Card bg="mublinColor.9">
              <Title order={2}>Guitarrista</Title>
              <Title order={4}>Guitarrista para show cover anos 80</Title>
              <Text />
              <Text>
                95% match Sorocaba, SP · Bar Manifesto · 28 jun · 21h Rock · Guitar solo
                exigido · 4h de show R$ 400 cachê encerra hoje
              </Text>
            </Card> */}
          </>
        )}
      </Container>
    </>
  )
}
