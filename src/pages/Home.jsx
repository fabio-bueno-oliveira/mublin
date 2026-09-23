import { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTrendingMap } from '../hooks/useTrending'
import { useQuery } from '@tanstack/react-query'
import { fetchNewsFeed } from '../queries/feed'
import NewsCard from '../components/feed/NewsCard'
import ProfileChecklistCard from '../components/home/ProfileChecklistCard'
import GigsDashboard from '../components/home/GigsDashboard'
import AppNavbarMobile from '../components/AppNavbarMobile'
import BannerMublinPro from '../components/banners/BannerMublinPro'
// prettier-ignore
import {
  Skeleton, Grid, Box,
  Container, Stack, Group,
  Text, Title, 
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconRss } from '@tabler/icons-react'

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
              <Title size="h4" fw={500} lh={1.2} mt="sm" mb={4}>
                Carregando...
              </Title>
            ) : (
              <>
                {/* <FeaturedCard /> */}

                <ProfileChecklistCard />

                <GigsDashboard />

                {profile?.plan !== 'Pro' && <BannerMublinPro />}
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
