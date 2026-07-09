import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserRoles } from '../queries/user'
import { fetchRecentProfiles } from '../queries/search'
import { fetchFeaturedProducts } from '../queries/gear'
import { fetchEvents } from '../queries/events'
import { fetchNewsFeed } from '../queries/feed'
import NewsCard from '../components/feed/NewsCard'
// prettier-ignore
import {
  Skeleton,
  Box, Card,
  Container,
  Group, Flex,
  ActionIcon,
  Stack, Badge,
  Text, Title, 
  Image, Avatar,
  Select, ThemeIcon,
} from '@mantine/core'
import { useMediaQuery, useScroller } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import {
  IconUser,
  IconChevronLeft,
  IconChevronRight,
  IconZoom,
} from '@tabler/icons-react'

const CDN_PREFIX = 'https://ik.imagekit.io/mublin'
const EVENTS_IMG_PATH = `${CDN_PREFIX}/tr:h-320,c-maintain_ratio/events/`
const GEAR_IMG_PATH = `${CDN_PREFIX}/products/tr:w-160,h-160,cm-pad_resize,bg-FFFFFF,fo-x/`
const AVATAR_PATH = `${CDN_PREFIX}/tr:h-80,c-maintain_ratio/users/avatars/`

export default function Home() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const isDesktop = useMediaQuery('(min-width: 48em)')
  const peopleScroller = useScroller()
  const gearScroller = useScroller()
  const eventsScroller = useScroller()
  const newsScroller = useScroller()

  const [defaultRole, setDefaultRole] = useState('')

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

  const { data: userRoles = [], isLoading: loadingUserRoles } = useQuery({
    queryKey: ['profile-roles'],
    queryFn: () => fetchUserRoles(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: recentProfiles = [], isLoading: loadingRecentProfiles } = useQuery({
    queryKey: ['recent-profiles'],
    queryFn: () => fetchRecentProfiles(10),
    staleTime: 1000 * 60 * 5,
  })

  const { data: featuredProducts = [], isLoading: loadingFeaturedProducts } = useQuery({
    queryKey: ['featured-gear'],
    queryFn: () => fetchFeaturedProducts(),
    staleTime: 1000 * 60 * 5,
  })

  const { data: globalEvents = [], isLoading: loadingGlobalEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetchEvents(3),
    staleTime: 1000 * 60 * 5,
  })

  const { data: news = [], isLoading: loadingNews } = useQuery({
    queryKey: ['news', user?.id],
    queryFn: () => fetchNewsFeed(5),
    staleTime: 1000 * 60 * 5,
  })

  const userRolesOptions = userRoles.map((r) => ({
    value: String(r.id_role),
    label: r.roles?.description_ptbr ?? r.roles?.name_ptbr,
  }))

  useEffect(() => {
    if (userRoles.length > 0) {
      setDefaultRole(String(userRoles[0]?.id_role))
    }
  }, [userRoles])

  if (loading) {
    return null
  }

  // Saudação dinâmica
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <>
      {isMobile && <AppNavbarMobile fixed={false} />}

      <Container size="xl" pt="xs" px={{ base: 'sm', sm: 0 }} mt={{ base: 16, sm: 0 }}>
        {loading ? (
          <>
            <Title size="h2" fw={600} lh={1.2} mt={4} mb={4}>
              Carregando...
            </Title>
            <Skeleton width={300} height={18} radius="md" />
          </>
        ) : (
          <>
            <Title size="24px" fw={600} lh={1.2} ta="center" my="md">
              {greeting}, {profile?.username}
            </Title>
            {/* <Text size="sm" c="dimmed">
              {dayjs().format('dddd, D [de] MMMM [de] YYYY')}
            </Text> */}

            <Card shadow="sm" padding="md" withBorder>
              <Text>Encontrar ou cadastrar gigs para tocar</Text>
              <Flex
                mt="sm"
                gap="sm"
                justify="space-between"
                align="flex-end"
                direction={isMobile ? 'column' : 'row'}
              >
                <Select
                  variant="default"
                  w={isMobile ? '100%' : '33%'}
                  label="Sou"
                  placeholder="Selecione"
                  withAsterisk
                  disabled={loadingUserRoles}
                  defaultValue={defaultRole}
                  data={userRolesOptions}
                />
                <Select
                  w={isMobile ? '100%' : '33%'}
                  label="Vínculo desejado"
                  placeholder="Selecione"
                  withAsterisk
                  defaultValue="1"
                  data={[
                    { value: '1', label: 'Sideman' },
                    { value: '2', label: 'Integrante' },
                  ]}
                />
                <Select
                  w={isMobile ? '100%' : '33%'}
                  label="Conteúdo principal"
                  placeholder="Selecione"
                  withAsterisk
                  data={[
                    { value: '1', label: 'Autoral' },
                    { value: '2', label: 'Cover' },
                    { value: '3', label: 'Autoral + Cover' },
                  ]}
                />
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  mb={2}
                  aria-label="Settings"
                  component={Link}
                  to="/search"
                >
                  <IconZoom style={{ width: '70%', height: '70%' }} />
                </ActionIcon>
              </Flex>
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
                          ?.roles?.name_ptbr

                        return (
                          <Link
                            key={p.id}
                            to={`/${p.username}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Card
                              p="xs"
                              w={140}
                              shadow="sm"
                              withBorder
                              style={{ flexShrink: 0 }}
                            >
                              <Stack align="center" gap={6}>
                                <Avatar
                                  src={p.avatar ? AVATAR_PATH + p.avatar : null}
                                  size={64}
                                  radius="xl"
                                >
                                  {!p.avatar && <IconUser size={28} />}
                                </Avatar>
                                <Text size="sm" fw={600} ta="center" lineClamp={1}>
                                  {p.full_name || p.username}
                                </Text>
                                {mainRole && (
                                  <Text size="xs" c="dimmed" ta="center" lineClamp={1}>
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

            {/* <Group justify="space-between" align="center" mt="xl" mb="xs">
              <Title order={3} fw={600} fz="lg">
                Equipamentos
              </Title>
              {featuredProducts.length > 4 && (
                <Group>
                  <ThemeIcon
                    variant="default"
                    style={{
                      cursor: gearScroller.canScrollStart ? 'pointer' : 'default',
                    }}
                    onClick={gearScroller.scrollStart}
                    opacity={gearScroller.canScrollStart ? 1 : 0.5}
                  >
                    <IconChevronLeft style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                  <ThemeIcon
                    variant="default"
                    style={{
                      cursor: gearScroller.canScrollEnd ? 'pointer' : 'default',
                    }}
                    onClick={gearScroller.scrollEnd}
                    opacity={gearScroller.canScrollEnd ? 1 : 0.5}
                  >
                    <IconChevronRight style={{ width: '70%', height: '70%' }} />
                  </ThemeIcon>
                </Group>
              )}
            </Group> */}

            {/* <Box>
              <div
                ref={gearScroller.ref}
                {...gearScroller.dragHandlers}
                className="scrollerHidden"
                style={{
                  overflow: 'auto',
                  cursor: gearScroller.isDragging ? 'grabbing' : 'default',
                }}
              >
                <Group wrap="nowrap" gap="md">
                  {loadingFeaturedProducts
                    ? [1, 2, 3, 4, 5].map((i) => (
                        <Skeleton
                          key={i}
                          width={150}
                          height={200}
                          radius="md"
                          style={{ flexShrink: 0 }}
                        />
                      ))
                    : featuredProducts.map((gear) => (
                        <Link
                          key={gear.id}
                          to={`/gear/${gear.slug}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Card
                            p="xs"
                            w={150}
                            shadow="sm"
                            withBorder
                            style={{ flexShrink: 0 }}
                            pos="relative"
                          >
                            <Card.Section>
                              <Image
                                src={
                                  gear.picture
                                    ? `${GEAR_IMG_PATH}${gear.picture}`
                                    : undefined
                                }
                                height={130}
                                fit="contain"
                                fallbackSrc="https://placehold.co/130x130?text=?"
                                alt={gear.name}
                              />
                            </Card.Section>
                            {gear.brand_name && (
                              <Text size="10px" c="dimmed" mt="xs" lineClamp={1}>
                                {gear.brand_name}
                              </Text>
                            )}
                            <Text size="sm" fw={600} lineClamp={1}>
                              {gear.name}
                            </Text>
                            {gear.subtitle && (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {gear.subtitle}
                              </Text>
                            )}
                            {gear.is_rare && (
                              <Badge
                                size="xs"
                                variant="light"
                                color="yellow"
                                pos="absolute"
                                top={6}
                                right={14}
                              >
                                Raro
                              </Badge>
                            )}
                          </Card>
                        </Link>
                      ))}
                </Group>
              </div>
            </Box> */}

            <Group justify="space-between" align="center" mt="xl" mb="xs">
              <Title order={3} fw={600} fz="lg">
                Eventos
              </Title>
              {globalEvents.length > 3 && (
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

            <Box>
              <div
                ref={eventsScroller.ref}
                {...eventsScroller.dragHandlers}
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
