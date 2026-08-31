import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchRecentProfiles } from '../queries/search'
import { fetchUpcomingEvents } from '../queries/events'
import { fetchNewsFeed } from '../queries/feed'
import NewsCard from '../components/feed/NewsCard'
// import FeaturedCard from '../components/home/FeaturedCard'
import ProfileChecklistCard from '../components/home/ProfileChecklistCard'
import MusicianDashboard from '../components/home/MusicianDashboard'
import InspirationSpotlight from '../components/home/InspirationSpotlight'
// prettier-ignore
import {
  Skeleton, Grid,
  Box, Card,
  Container, Stack,
  Group, Flex,
  Text, Title, 
  Image, Avatar,
  ThemeIcon,
  Badge,
  Indicator,
  Scroller,
} from '@mantine/core'
import { useMediaQuery, useScroller } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { getAvatarUrl } from '../utils/profile'
import { isEventHappeningNow } from '../utils/dates'
import dayjs from 'dayjs'
import {
  IconUser,
  IconChevronLeft,
  IconChevronRight,
  IconRosetteDiscountCheckFilled,
  IconRoute,
  IconSparklesFilled,
  IconSquareRoundedArrowLeftFilled,
  IconSquareRoundedArrowRightFilled,
} from '@tabler/icons-react'

const CDN_PREFIX = 'https://ik.imagekit.io/mublin'
const EVENTS_IMG_PATH = `${CDN_PREFIX}/tr:h-320,c-maintain_ratio/events/`
const AVATAR_PATH = `${CDN_PREFIX}/tr:h-80,c-maintain_ratio/users/avatars/`

export default function Home() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const isDesktop = useMediaQuery('(min-width: 48em)')
  const eventsScroller = useScroller()

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
    queryFn: () => fetchRecentProfiles(7),
    staleTime: 1000 * 60 * 5,
  })

  const { data: globalEvents = [], isLoading: loadingGlobalEvents } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => fetchUpcomingEvents(10),
    staleTime: 1000 * 60 * 1,
    refetchInterval: 1000 * 60 * 2,
  })

  const { data: news = [], isLoading: loadingNews } = useQuery({
    queryKey: ['news', user?.id],
    queryFn: () => fetchNewsFeed(6),
    staleTime: 1000 * 60 * 5,
  })

  if (loading) {
    return null
  }

  // Dynamic greeting
  // const hour = new Date().getHours()
  // const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Home · Mublin</title>
        <link rel="canonical" href="https://mublin.com/home" />
      </Helmet>
      {isMobile && <AppNavbarMobile fixed={false} />}

      <Container size="xl" px={{ base: 'sm', sm: 0 }} mt={{ base: 16, sm: 0 }}>
        <Grid gap="lg">
          <Grid.Col span={{ base: 12, md: 8, lg: 8 }}>
            {loading ? (
              <>
                <Title size="h2" fw={600} lh={1.2} mt={4} mb={4}>
                  Carregando...
                </Title>
                <Skeleton width={300} height={18} radius="md" />
              </>
            ) : (
              <>
                {/* <Title size="22px" fw={600} lh={1.2} ta="left" my="md">
                  {greeting}, {profile?.username}
                </Title> */}

                {/* <FeaturedCard /> */}

                <MusicianDashboard />

                <ProfileChecklistCard />

                <Box mt="md" mb="xs">
                  <Title order={3} fw={600} fz="lg" mb="xs">
                    Novos por aqui
                  </Title>

                  <Scroller
                    controlSize="xl"
                    startControlIcon={
                      <IconSquareRoundedArrowLeftFilled
                        size={34}
                        style={{ marginLeft: '14px' }}
                      />
                    }
                    endControlIcon={
                      <IconSquareRoundedArrowRightFilled
                        size={34}
                        style={{ marginRight: '14px' }}
                      />
                    }
                    // showEndControl
                  >
                    <Group wrap="nowrap" gap="md">
                      {loadingRecentProfiles
                        ? [1, 2, 3, 4, 5].map((i) => (
                            <Skeleton
                              key={i}
                              width={140}
                              height={140}
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

                            return (
                              <Link
                                key={p.id}
                                to={`/${p.username}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                              >
                                <Card
                                  p="xs"
                                  w={140}
                                  h={140}
                                  shadow="sm"
                                  withBorder
                                  pos="relative"
                                  style={{ flexShrink: 0 }}
                                >
                                  {p.is_live && (
                                    <Badge
                                      size="xs"
                                      color="red.9"
                                      pos="absolute"
                                      left={5}
                                      top={5}
                                    >
                                      Live
                                    </Badge>
                                  )}
                                  <Stack align="center" gap={3}>
                                    <Indicator
                                      position="top-end"
                                      offset={{ x: 2, y: 14 }}
                                      color="transparent"
                                      size={20}
                                      disabled={!p.is_verified}
                                      label={
                                        <IconRosetteDiscountCheckFilled
                                          size={24}
                                          color="var(--mantine-color-text)"
                                          style={{ display: 'block' }}
                                        />
                                      }
                                    >
                                      <Avatar
                                        src={
                                          p?.avatar
                                            ? getAvatarUrl(
                                                p?.avatar,
                                                p?.is_open_to_work,
                                                64,
                                              )
                                            : `https://api.dicebear.com/10.x/initials/svg?seed=${p?.full_name}`
                                        }
                                        size={64}
                                        radius="xl"
                                      >
                                        {!p.avatar && <IconUser size={28} />}
                                      </Avatar>
                                    </Indicator>
                                    <Text
                                      w={114}
                                      size="sm"
                                      fw={600}
                                      ta="center"
                                      lineClamp={1}
                                    >
                                      {p?.full_name || p?.username}
                                    </Text>
                                    {p?.title && (
                                      <Text
                                        w={110}
                                        size="10px"
                                        ta="center"
                                        lineClamp={1}
                                        mb={3}
                                      >
                                        {p.title}
                                      </Text>
                                    )}
                                    {/* {mainRole && (
                                      <Text size="xs" ta="center" lineClamp={1}>
                                        {mainRole}
                                      </Text>
                                    )} */}
                                    {location && (
                                      <Text
                                        size="10px"
                                        c="dimmed"
                                        ta="center"
                                        lineClamp={1}
                                      >
                                        {location}
                                      </Text>
                                    )}
                                  </Stack>
                                </Card>
                              </Link>
                            )
                          })}
                      <Box w={32} h={140} />
                    </Group>
                  </Scroller>
                </Box>

                <InspirationSpotlight />

                {globalEvents?.length > 0 && (
                  <>
                    <Group justify="space-between" align="center" mt="lg" mb="xs">
                      <Title order={3} fw={600} fz="lg">
                        Eventos próximos
                      </Title>
                      {globalEvents?.length > 2 && (
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
                                <Card
                                  p="xs"
                                  w={160}
                                  h={280}
                                  shadow="sm"
                                  padding="lg"
                                  withBorder
                                  style={{ position: 'relative' }}
                                >
                                  <Card.Section style={{ position: 'relative' }}>
                                    <Image
                                      src={EVENTS_IMG_PATH + event.picture_url}
                                      height={160}
                                      alt={event.name}
                                    />
                                    <Box
                                      style={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 16,
                                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                        borderRadius: 6,
                                        padding: '4px 6px',
                                        textAlign: 'center',
                                        lineHeight: 1.1,
                                      }}
                                    >
                                      <Text size="sm" fw={700} c="white" ta="center">
                                        {dayjs(event.date_start).format('DD')}
                                      </Text>
                                      <Text
                                        size="9px"
                                        fw={600}
                                        c="white"
                                        ta="center"
                                        tt="uppercase"
                                      >
                                        {dayjs(event.date_start)
                                          .locale('pt-br')
                                          .format('MMM')}
                                      </Text>
                                    </Box>
                                    {isEventHappeningNow(event) && (
                                      <Group
                                        gap={4}
                                        pos="absolute"
                                        style={{
                                          bottom: 8,
                                          right: 16,
                                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                          borderRadius: 6,
                                          padding: '5px 5px',
                                        }}
                                      >
                                        <Box
                                          component="span"
                                          className="live-dot green"
                                          style={{ flexShrink: 0 }}
                                        />
                                        <Text
                                          size="10px"
                                          c="white"
                                          ta="center"
                                          tt="uppercase"
                                          lh={1}
                                        >
                                          Rolando agora
                                        </Text>
                                      </Group>
                                    )}
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
                  </>
                )}

                {/* ── Banner: Setup em destaque ── */}
                <Card
                  radius="lg"
                  p={0}
                  mt="lg"
                  withBorder={false}
                  component={Link}
                  to="/setup/4"
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    minHeight: 260,
                    backgroundColor: 'black',
                  }}
                >
                  {/* Background photo */}
                  <Box
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(https://ik.imagekit.io/mublin/users/gear-setups/tr:w-1200,h-600,c-maintain_ratio/0d333085-c093-4dd3-99f7-a35e0096f8ef_setup_photo_5uAffGrln)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'brightness(0.7)',
                    }}
                  />
                  {/* Gradient overlay */}
                  <Box
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.15) 100%)',
                    }}
                  />

                  <Box
                    p={{ base: 'lg', sm: 'xl' }}
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      height: '100%',
                      minHeight: 260,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Group gap={8} mb={10}>
                      <Badge
                        size="sm"
                        radius="sm"
                        color="mublinColor"
                        variant="filled"
                        leftSection={<IconSparklesFilled size={12} />}
                      >
                        Setup em destaque
                      </Badge>
                    </Group>

                    <Title
                      order={2}
                      c="white"
                      fw={800}
                      fz={{ base: 22, sm: 28 }}
                      lh={1.1}
                      maw={420}
                    >
                      Mateus Asato Tokyo Aug 2026
                    </Title>

                    <Text
                      c="white"
                      size="sm"
                      mt={6}
                      maw={380}
                      style={{ opacity: 0.85 }}
                      lineClamp={2}
                    >
                      Mateus Asato pedalboard in Tokyo Aug 2026 — confira a cadeia
                      completa de pedais e equipamentos
                    </Text>

                    <Group gap={8} mt={14}>
                      <Avatar
                        src="https://ik.imagekit.io/mublin/tr:h-80,c-maintain_ratio/users/avatars/0d333085-c093-4dd3-99f7-a35e0096f8ef_avatar_7Kj3VXzdX"
                        size={26}
                        radius="xl"
                      />
                      <Text size="sm" c="white" fw={500}>
                        por Mublin
                      </Text>
                      <Text size="xs" c="white" style={{ opacity: 0.6 }}>
                        @mublin
                      </Text>
                    </Group>

                    <Group mt={18} gap={8}>
                      <Box
                        style={{
                          backgroundColor: 'white',
                          color: 'black',
                          borderRadius: 20,
                          padding: '6px 16px',
                          fontSize: 13,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        Ver setup <IconChevronRight size={14} />
                      </Box>
                      <Group gap={4} c="white" style={{ opacity: 0.7 }}>
                        <IconRoute size={14} />
                        <Text size="xs" c="white">
                          Setup público · colaboração aberta
                        </Text>
                      </Group>
                    </Group>
                  </Box>

                  {/* Thumbnail thumb no canto (desktop) */}
                  <Box
                    visibleFrom="sm"
                    style={{
                      position: 'absolute',
                      right: 24,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '2px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}
                  >
                    <Image
                      src="https://ik.imagekit.io/mublin/users/gear-setups/tr:w-200,h-200/0d333085-c093-4dd3-99f7-a35e0096f8ef_setup_1dRtHFr41"
                      w={110}
                      h={110}
                      fit="cover"
                    />
                  </Box>
                </Card>

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
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4, lg: 4 }} visibleFrom="sm">
            <Title order={3} fw={600} fz="lg" mt={{ base: 'md', sm: 'xs' }} mb="sm">
              Notícias recentes
            </Title>
            <Stack gap="lg" wrap="nowrap">
              {loadingNews
                ? [1, 2, 3, 4, 5].map((i) => (
                    <Skeleton
                      key={i}
                      width="100%"
                      height={144}
                      style={{ flexShrink: 0 }}
                    />
                  ))
                : news.map((item) => (
                    <Box key={item.id} style={{ flexShrink: 0 }}>
                      <NewsCard item={item} width="100%" subtle />
                    </Box>
                  ))}
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </>
  )
}
