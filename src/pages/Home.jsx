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
import AppNavbarMobile from '../components/AppNavbarMobile'
import BannerMublinPro from '../components/banners/BannerMublinPro'
// prettier-ignore
import {
  Skeleton, Grid,
  Box, Card,
  Container, Stack,
  Group,
  Text, Title, 
  Image,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconRss, IconBox } from '@tabler/icons-react'

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
        <title>Home | Mublin</title>
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

                <ProfileChecklistCard />

                <GigsDashboard />

                {profile?.plan === 'Pro' ? (
                  <Box mb="xs">
                    <Title order={3} fw={600} fz="lg" mb={2}>
                      Meu equipamento
                    </Title>
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
                          <Text
                            size="xs"
                            fw={500}
                            tt="uppercase"
                            c="dimmed"
                            lineClamp={1}
                          >
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
                ) : (
                  <BannerMublinPro />
                )}

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
