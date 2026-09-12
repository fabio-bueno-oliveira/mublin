import { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTrendingMap } from '../hooks/useTrending'
import { useQuery } from '@tanstack/react-query'
import { fetchUserRecentGear } from '../queries/user'
import { fetchNewsFeed } from '../queries/feed'
import NewsCard from '../components/feed/NewsCard'
// import FeaturedCard from '../components/home/FeaturedCard'
import ProfileChecklistCard from '../components/home/ProfileChecklistCard'
import GigsDashboard from '../components/home/GigsDashboard'
// prettier-ignore
import {
  Skeleton, Grid,
  Box, Card,
  Container, Stack,
  Group,
  Text, Title, 
  Image, Avatar, Badge,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  IconChevronRight,
  IconRoute,
  IconSparklesFilled,
  IconRss,
  IconBox,
} from '@tabler/icons-react'

const PATH_GEAR_ITEM_IMG =
  'https://ik.imagekit.io/mublin/products/tr:w-70,h-70,cm-pad_resize,bg-FFFFFF,fo-x/'

export default function Home() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const isDesktop = useMediaQuery('(min-width: 48em)')

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

  const { data: news = [], isLoading: loadingNews } = useQuery({
    queryKey: ['news', user?.id],
    queryFn: () => fetchNewsFeed(6),
    staleTime: 1000 * 60 * 5,
  })

  const { data: recentGear, isLoading: loadingRecentGear } = useQuery({
    queryKey: ['user-recent-gear', user?.id],
    queryFn: () => fetchUserRecentGear(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const trendingMap = useMemo(() => getTrendingMap(news), [news])

  if (loading) {
    return null
  }

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
                {/* <FeaturedCard /> */}

                <GigsDashboard />

                <ProfileChecklistCard />

                <Box mt="md" mb="xs">
                  <Group gap={6} mb={2}>
                    <IconBox size={18} stroke={1.8} style={{ opacity: 0.6 }} />
                    <Title order={3} fw={600} fz="lg">
                      Meu equipamento
                    </Title>
                  </Group>
                  <Card radius="md" withBorder p="sm" mb="md">
                    <Group
                      wrap="nowrap"
                      gap="sm"
                      component={Link}
                      to={`/${profile?.username}/gear`}
                      style={{
                        borderRadius: 8,
                        boxShadow: 'none',
                        cursor: 'pointer',
                      }}
                      className="noDecoration"
                    >
                      {recentGear && (
                        <Image
                          src={
                            recentGear?.products?.picture
                              ? PATH_GEAR_ITEM_IMG + recentGear?.products?.picture
                              : undefined
                          }
                          fit="contain"
                          h={35}
                          w={35}
                          radius="sm"
                        />
                      )}
                      <Stack gap={1} style={{ flex: 1 }}>
                        <Text size="xs" fw={500} tt="uppercase" c="dimmed" lineClamp={1}>
                          Adicionado recentemente
                        </Text>
                        <Text size="xs" lineClamp={1}>
                          {loadingRecentGear
                            ? 'Carregando...'
                            : recentGear
                              ? `${recentGear?.products?.name} (${recentGear?.products?.brands?.name})`
                              : 'Nenhum item adicionado'}
                        </Text>
                      </Stack>
                    </Group>
                  </Card>
                </Box>

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
            <Group justify="space-between" align="center" mt={{ base: 'md', sm: 'xs' }}>
              <Title order={3} fw={600} fz="lg">
                Notícias do Mercado
              </Title>
              <IconRss size={15} color="gray" />
            </Group>
            <Text mb="xs" c="dimmed" size="sm" fw={600}>
              Assuntos em alta
            </Text>
            <Stack gap="sm" wrap="nowrap">
              {loadingNews
                ? [1, 2, 3, 4, 5].map((i) => (
                    <Skeleton
                      key={i}
                      width="100%"
                      height={40}
                      style={{ flexShrink: 0 }}
                    />
                  ))
                : news.map((item) => {
                    const trend = trendingMap.get(item.id)
                    return (
                      <Box key={item.id} style={{ flexShrink: 0 }}>
                        <NewsCard
                          item={item}
                          width="100%"
                          subtle
                          isTrending={!!trend?.isTrending}
                          trendingCount={trend?.count ?? 0}
                        />
                      </Box>
                    )
                  })}
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </>
  )
}
