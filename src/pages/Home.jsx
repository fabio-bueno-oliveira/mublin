import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserRoles } from '../queries/user'
import { fetchEvents } from '../queries/events'
import { fetchNewsFeed } from '../queries/feed'
import NewsCard from '../components/feed/NewsCard'
// prettier-ignore
import {
  Skeleton, Tabs,
  Box, Card,
  Group, Flex,
  Container,
  Text, Title, 
  Image, Avatar,
  Select, ThemeIcon
} from '@mantine/core'
import { useMediaQuery, useScroller } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import {
  IconChevronLeft,
  IconChevronRight,
  IconMusic,
  IconUsersGroup,
  IconUser,
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
            <Group justify="space-between" align="flex-start" mt={4} mb="xl">
              <Title size="24px" fw={600} lh={1.2}>
                {greeting}, {profile?.username}
              </Title>
              {/* <Text size="sm" c="dimmed">
                {dayjs().format('dddd, D [de] MMMM [de] YYYY')}
              </Text> */}
            </Group>

            <Tabs variant="pills" defaultValue="gigs">
              <Tabs.List justify="center">
                <Tabs.Tab leftSection={<IconMusic size={18} />} value="gigs">
                  Gigs
                </Tabs.Tab>
                <Tabs.Tab leftSection={<IconUsersGroup size={18} />} value="projects">
                  Projetos
                </Tabs.Tab>
                <Tabs.Tab leftSection={<IconUser size={18} />} value="people">
                  Pessoas
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="gigs" pt="md">
                <Flex
                  gap="sm"
                  justify="space-between"
                  align="flex-start"
                  direction={isMobile ? 'column' : 'row'}
                  mb="md"
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
                      { value: '1', label: 'Contratado' },
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
                </Flex>
              </Tabs.Panel>
              <Tabs.Panel value="people" pt="md">
                <Group justify="space-between" align="flex-start" mb="md">
                  <Select
                    label="Busco"
                    placeholder="Selecione"
                    withAsterisk
                    data={[
                      { value: '1', label: 'Autoral' },
                      { value: '2', label: 'Cover' },
                      { value: '3', label: 'Autoral + Cover' },
                    ]}
                  />
                  <Select
                    label="Conteúdo principal"
                    placeholder="Selecione"
                    withAsterisk
                    data={[
                      { value: '1', label: 'Autoral' },
                      { value: '2', label: 'Cover' },
                      { value: '3', label: 'Autoral + Cover' },
                    ]}
                  />
                  <Select
                    label="Conteúdo principal"
                    placeholder="Selecione"
                    withAsterisk
                    data={[
                      { value: '1', label: 'Autoral' },
                      { value: '2', label: 'Cover' },
                      { value: '3', label: 'Autoral + Cover' },
                    ]}
                  />
                </Group>
              </Tabs.Panel>
            </Tabs>

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
                      <Card p="xs" w={160} shadow="sm" padding="lg" withBorder>
                        <Card.Section>
                          <Image
                            src={EVENTS_IMG_PATH + event.picture_url}
                            height={160}
                            alt={event.name}
                          />
                        </Card.Section>
                        <Title order={4} fw={600} fz="sm" mt="xs" mb={5}>
                          {event.name}
                        </Title>
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

            <Group justify="space-between" align="center" mt="xl" mb="xs">
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
