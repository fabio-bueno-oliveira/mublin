import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchBasicProfile,
  fetchCheckFollowing,
  fetchProfileFollowers,
  fetchProfileFollowingList,
  fetchSimilarProfiles,
  fetchProfileProjects,
  fetchProfileFeed,
  fetchProfileGear,
  fetchProfileGearCategories,
  fetchProfileGearSetups,
  fetchProfileWorkAvailability,
  fetchProfileWorkFocuses,
  fetchProfileInspirations,
} from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import {
  useMantineColorScheme,
  Container,
  Modal,
  Grid,
  Scroller,
  Avatar,
  Paper,
  Box,
  Indicator,
  Spoiler,
  Card,
  Button,
  Title,
  Text,
  Group,
  Flex,
  Stack,
  ActionIcon,
  Skeleton,
  ScrollArea,
  Alert,
  Anchor,
  Image,
  Tooltip,
  Divider,
  Affix,
  Transition,
  Menu,
  Select,
  em,
  Badge,
} from '@mantine/core'
import { useMediaQuery, useDisclosure, useWindowScroll } from '@mantine/hooks'
import LoadingSkeleton from '../components/profile/LoadingSkeleton'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayer from '../components/feed/VideoPlayer'
import SectionPanel from '../components/SectionPanel'
import {
  IconMoodSad,
  IconRosetteDiscountCheckFilled,
  IconWorld,
  IconShieldCheckFilled,
  IconPlus,
  IconSettings,
  IconCircleArrowLeftFilled,
  IconCircleArrowRightFilled,
  IconCheck,
  IconBrandWhatsapp,
  IconPencil,
  IconTrophy,
  IconDotsVerticalFilled,
} from '@tabler/icons-react'
import ProfileHeaderMobile from '../components/profile/ProfileHeaderMobile'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { truncateString } from '../utils/formatter'
import { isProfileLive } from '../utils/live'
import { AVAILABLE_FROM_LABELS } from '../constants/availability'
import { SOCIAL_CONFIG } from '../constants/socialConfig'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
import ProPlanBadge from '../components/ProPlanBadge'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-96,w-96,c-maintain_ratio/'

function SectionTitle({ text, mb, mt = 0, ...props }) {
  return (
    <Text fw={600} size="18px" mb={mb} mt={mt} {...props}>
      {text}
    </Text>
  )
}

export default function Profile() {
  const { username } = useParams()
  const queryClient = useQueryClient()
  const { loading: authLoading, user } = useAuth()

  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)
  const [scroll, scrollTo] = useWindowScroll()
  const [activeSection, setActiveSection] = useState('')

  const [followersOpened, { open: openFollowers, close: closeFollowers }] =
    useDisclosure(false)
  const [followingOpened, { open: openFollowing, close: closeFollowing }] =
    useDisclosure(false)
  const [contactInfoOpened, { open: openContactInfo, close: closeContactInfo }] =
    useDisclosure(false)

  const {
    data: profile,
    isLoading: isLoadingProfileInfo,
    isError,
  } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchBasicProfile(username),
    enabled: !!username && !authLoading,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const MENU_ITEMS = [
    { id: 'about', label: 'Sobre', active: true },
    { id: 'projects', label: 'Projetos', active: true },
    { id: 'posts', label: 'Postagens', active: true },
    { id: 'gear', label: 'Equipamento', active: true },
    { id: 'availability', label: 'Disponibilidade', active: true },
    { id: 'recognitions', label: 'Reconhecimentos', active: true },
    { id: 'inspirations', label: 'Inspirações', active: profile?.is_legend },
    { id: 'suggested-profiles', label: 'Perfis parecidos', active: true },
    { id: 'social', label: 'Redes', active: true },
  ]

  useEffect(() => {
    scrollTo({ y: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  useEffect(() => {
    if (!isMobile) {
      return
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150

      for (const item of MENU_ITEMS) {
        const element = document.getElementById(item.id)
        if (element) {
          const top = element.offsetTop
          const height = element.offsetHeight

          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      const offsetPosition = element.offsetTop - 112

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
      setActiveSection(id)
    }
  }

  const { data: followingInfo = [], isLoading: loadingFollowingInfo } = useQuery({
    queryKey: ['profile-following-info', profile?.id],
    queryFn: () => fetchCheckFollowing(profile.id, user.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  })

  const { data: followersList = [] } = useQuery({
    queryKey: ['profileFollowers', profile?.id],
    queryKeyHashFn: () => `profileFollowers-${profile?.id}`,
    queryFn: () => fetchProfileFollowers(profile?.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 20,
  })

  const { data: followingList = [] } = useQuery({
    queryKey: ['profileFollowingList', profile?.id],
    queryKeyHashFn: () => `profileFollowingList-${profile?.id}`,
    queryFn: () => fetchProfileFollowingList(profile?.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 20,
  })

  const { data: similarProfiles = [], isLoading: loadingSimilar } = useQuery({
    queryKey: ['similar-profiles', profile?.id],
    queryFn: () => fetchSimilarProfiles(profile.id, profile.region_id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  })

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['profile-projects', profile?.id],
    queryFn: () => fetchProfileProjects(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: profilePosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['profile-feed', profile?.id],
    queryFn: () => fetchProfileFeed(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 3,
  })

  const { data: gearList = [], isLoading: loadingGear } = useQuery({
    queryKey: ['user-gear', profile?.id],
    queryFn: () => fetchProfileGear(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const [gearCategorySelected, setGearCategorySelected] = useState('')

  const gear = gearList.filter((x) =>
    gearCategorySelected
      ? x.products?.id_category === Number(gearCategorySelected)
      : true,
  )

  const { data: gearCategories = [] } = useQuery({
    queryKey: ['user-gear-categories', profile?.id],
    queryFn: () => fetchProfileGearCategories(profile.id),
    enabled: !!profile?.id && gear.length > 0,
    staleTime: 1000 * 60 * 5,
  })

  const { data: gearSetups = [] } = useQuery({
    queryKey: ['user-gear-setups', profile?.id],
    queryFn: () => fetchProfileGearSetups(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: workAvailability = [], isLoading: loadingWorkAvailability } = useQuery({
    queryKey: ['user-work-availability', profile?.id],
    queryFn: () => fetchProfileWorkAvailability(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: workFocus = [], isLoading: loadingWorkFocus } = useQuery({
    queryKey: ['user-work-focus', profile?.id],
    queryFn: () => fetchProfileWorkFocuses(profile.id),
    enabled: !!profile?.id && gear.length > 0,
    staleTime: 1000 * 60 * 5,
  })

  const { data: inspirations = [], isLoading: loadingInspirations } = useQuery({
    queryKey: ['profile-inspirations', profile?.id],
    queryFn: () => fetchProfileInspirations(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  })

  const profileProjects =
    projects?.map((r) => ({
      id: r.projects?.id,
      name: r.projects?.name,
      slug: r.projects?.slug,
      picture: r.projects?.picture,
      status: r.status,
      type: r.projects?.project_types?.name_ptbr ?? 'Outro',
      roles: [
        r.roles?.description_ptbr,
        r.role2?.description_ptbr,
        r.role3?.description_ptbr,
      ].filter(Boolean),
    })) || []

  const roles = profile?.profile_roles.sort((a, b) => b.main_activity - a.main_activity)
  const genres = profile?.profile_genres.sort((a, b) => b.main_genre - a.main_genre)
  const city = profile?.cities?.name
  const regionUf = profile?.regions?.uf

  if (authLoading) {
    return (
      <Container size="sm" py={48}>
        <Stack align="center" gap="md">
          <Skeleton circle height={96} />
          <Skeleton height={24} width={200} radius="xl" />
          <Skeleton height={16} width={120} radius="xl" />
        </Stack>
      </Container>
    )
  }

  if (isLoadingProfileInfo || loadingProjects) {
    return <LoadingSkeleton />
  }

  if (isError || !profile) {
    return (
      <Container size="sm" py={48}>
        <Alert
          icon={<IconMoodSad size={18} />}
          title="Perfil não encontrado"
          color="gray"
          radius="md"
        >
          O usuário <strong>@{username}</strong> não existe ou foi removido.
        </Alert>
      </Container>
    )
  }

  async function followProfile(currentUserId, targetUserId) {
    if (currentUserId === targetUserId) {
      throw new Error('Você não pode seguir seu próprio perfil.')
    }

    const { data, error } = await supabase
      .from('profile_followers')
      .insert([
        {
          follower_id: currentUserId,
          following_id: targetUserId,
          // Os campos is_favorite, is_muted e notifications_enabled
          // assumirão os valores default definidos no seu schema.
        },
      ])
      .select()

    queryClient.invalidateQueries({ queryKey: ['profile-following-info', profile.id] })

    if (error) {
      if (error.code === '23505') {
        throw new Error('Você já está seguindo este perfil.')
      }
      throw new Error(error.message)
    }

    return { success: true, action: 'followed', data }
  }

  async function unfollowProfile(currentUserId, targetUserId) {
    const { error } = await supabase
      .from('profile_followers')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)

    queryClient.invalidateQueries({ queryKey: ['profile-following-info', profile.id] })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, action: 'unfollowed' }
  }

  const renderUserList = (list, emptyMessage) => {
    if (list.length === 0) {
      return (
        <Text size="sm" c="dimmed" ta="center" py="xl">
          {emptyMessage}
        </Text>
      )
    }
    return (
      <ScrollArea.Autosize mah={400}>
        <Stack gap="sm" py="xs">
          {list.map((user) => (
            <Group key={user.id} justify="space-between" wrap="nowrap">
              <Group gap="sm" style={{ flex: 1 }}>
                <Link to={`/${user.username}`}>
                  <Avatar
                    src={AVATAR_PATH + user.avatar}
                    radius="xl"
                    size={50}
                    alt={user.full_name}
                  />
                </Link>
                <div style={{ style: 'none', flex: 1 }}>
                  <Anchor
                    component={Link}
                    to={`/${user.username}`}
                    size="sm"
                    fw={600}
                    c="var(--mantine-color-text)"
                    onClick={() => {
                      closeFollowers()
                      closeFollowing()
                    }}
                  >
                    {user.full_name}
                  </Anchor>
                  <Text size="xs" c="dimmed">
                    @{user.username}
                  </Text>
                </div>
              </Group>
            </Group>
          ))}
        </Stack>
      </ScrollArea.Autosize>
    )
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`${profile?.full_name} · Mublin`}</title>
        <link rel="canonical" href={`https://mublin.com/${profile?.username}`} />
        <meta name="description" content={`${profile?.full_name} no Mublin`} />
        <meta
          property="og:image"
          content={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
        />
      </Helmet>

      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%">
          <AppNavbarMobile
            pageName={profile.username}
            profile={profile}
            featured={profile.is_open_to_work}
          />
        </Affix>
      )}

      {profile.cover_image && (
        <Card
          mt={{ base: 51, sm: 0 }}
          shadow={false}
          padding={0}
          radius={isMobile ? 0 : 'md'}
          mb={4}
          // mt={{ base: 0, md: 10 }}
        >
          <Card.Section>
            <Box
              style={{
                position: 'relative',
                width: '100%',
                height: 80,
                overflow: 'hidden',
              }}
            >
              <Image
                src={
                  profile.cover_image
                    ? `https://ik.imagekit.io/mublin/tr:w-870,h-160,c-maintain_ratio/users/avatars/${profile.cover_image}`
                    : 'https://ik.imagekit.io/mublin/bg/tr:w-870,h-160,bg-F3F3F3,fo-bottom/open-air-concert.jpg'
                }
                mih={100}
                w="100%"
                fit="cover"
                alt={`Imagem de capa de ${profile.name}`}
              />
              <Flex
                align="flex-end"
                justify="flex-start"
                pos="absolute"
                direction="column"
                p="md"
                inset={0}
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(33, 18, 18, 0.4) 100%)',
                }}
              />
            </Box>
          </Card.Section>
        </Card>
      )}

      <Container
        size="xl"
        py="sm"
        px={0}
        mt={!profile.cover_image ? { base: 51, sm: 0 } : 0}
      >
        {isMobile && (
          <ProfileHeaderMobile
            profile={profile}
            city={city}
            regionUf={regionUf}
            user={user}
          />
        )}
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            {isMobile && (
              <Affix position={{ top: 50, left: 0 }} w="100%">
                <Transition transition="slide-down" mounted={scroll.y > 120}>
                  {(transitionStyles) => (
                    <Scroller>
                      <Group
                        bg={isDark ? 'black' : 'white'}
                        h={50}
                        gap="xl"
                        px="md"
                        wrap="nowrap"
                        style={{
                          ...transitionStyles,
                          width: '100%',
                        }}
                      >
                        {MENU_ITEMS.filter((x) => x.active).map((item) => {
                          const isActive = activeSection === item.id
                          return (
                            <Text
                              key={item.id}
                              onClick={() => scrollToSection(item.id)}
                              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                              fw={isActive ? 700 : 400}
                              opacity={isActive ? 1 : 0.8}
                              fz="sm"
                            >
                              {item.label}
                            </Text>
                          )
                        })}
                      </Group>
                    </Scroller>
                  )}
                </Transition>
              </Affix>
            )}
            <Group align="center" gap="md" mb="md" visibleFrom="sm">
              <Indicator
                position="bottom-center"
                inline
                label={<Text size="0.7rem">Disponível</Text>}
                color="green.9"
                size={18}
                withBorder
                disabled
              >
                <Avatar
                  size={96}
                  src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
                />
              </Indicator>
              <Stack gap={1} flex={1}>
                <Flex align="center" gap={2} wrap="wrap">
                  <Title order={1} size="25px" lh="1" component={Text} lineClamp={2}>
                    {profile.full_name}
                  </Title>
                  {!!profile.is_verified && (
                    <IconRosetteDiscountCheckFilled
                      className="iconVerified"
                      title="Perfil verificado"
                    />
                  )}
                  {!!profile?.is_legend && (
                    <IconShieldCheckFilled
                      className="iconLegend"
                      title="Lenda da música"
                    />
                  )}
                  {profile?.plan === 'Pro' && <ProPlanBadge />}
                  {user?.id === profile.id && (
                    <ActionIcon
                      component={Link}
                      to="/settings/profile"
                      radius="xl"
                      variant="subtle"
                      aria-label="Editar meu perfil"
                      title="Editar meu perfil"
                      ml={4}
                    >
                      <IconPencil size={14} stroke={2} />
                    </ActionIcon>
                  )}
                </Flex>
                <Group gap="md" my={3}>
                  <Anchor underline="never" onClick={openFollowers}>
                    <Text size="sm" fw={500}>
                      {followersList.length} seguidores
                    </Text>
                  </Anchor>
                  <Anchor underline="never" onClick={openFollowing}>
                    <Text size="sm" fw={500}>
                      {followingList.length} seguindo
                    </Text>
                  </Anchor>
                </Group>
                {profile.title && (
                  <Text size="14px" fw={400} maw={420} lh={1.3} my={3}>
                    {profile.title}
                  </Text>
                )}
                <Flex align="center" gap={4} opacity={0.7}>
                  {/* <Text span size="sm">
                    @{profile.username}
                  </Text> */}
                  {(city || regionUf) && (
                    <Text size="xs">{[city, regionUf].filter(Boolean).join('/')}</Text>
                  )}
                  <Text size="xs">·</Text>
                  <Anchor size="xs" onClick={openContactInfo}>
                    Dados de contato
                  </Anchor>
                  {isProfileLive(profile) && (
                    <Group gap={6} ml={10} align="center" wrap="nowrap">
                      <Box
                        component="span"
                        className="live-dot"
                        style={{ flexShrink: 0 }}
                      />
                      <Text size="11px" fw={600} c="red.7" tt="uppercase" lts="0.02em">
                        Ao vivo em {profile.live_platform}
                      </Text>
                    </Group>
                  )}
                </Flex>
              </Stack>
            </Group>
            {user?.id !== profile.id && (
              <Group gap={10} mx={{ base: 'sm', md: 0 }} mt={{ base: 'sm', md: 0 }}>
                {followingInfo?.id ? (
                  <Button
                    size="sm"
                    radius="md"
                    variant={isDark ? 'filled' : 'light'}
                    color={isDark ? 'gray' : 'gray.3'}
                    w="50%"
                    mt={4}
                    onClick={() => unfollowProfile(user.id, profile.id)}
                    disabled={loadingFollowingInfo}
                  >
                    Deixar de seguir
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    radius="md"
                    variant="gradient"
                    gradient={{ from: 'grape.8', to: 'mublinColor.8', deg: 55 }}
                    w="50%"
                    mt={4}
                    onClick={() => followProfile(user.id, profile.id)}
                    disabled={loadingFollowingInfo}
                  >
                    Seguir
                  </Button>
                )}
                <Button
                  size="sm"
                  radius="md"
                  variant={isDark ? 'filled' : 'light'}
                  color={isDark ? 'gray' : 'gray.3'}
                  w={166}
                  mt={4}
                >
                  Convidar para gig
                </Button>
              </Group>
            )}
            <Stack gap={12} mt={{ base: 'md', md: 'md' }}>
              <SectionPanel id="about">
                {profile.bio && (
                  <>
                    <SectionTitle text="Sobre" mb={16} />
                    <Spoiler
                      maxHeight={40}
                      showLabel={
                        <Text
                          lh={1.3}
                          opacity={0.9}
                          size="sm"
                          c="var(--mantine-color-text)"
                        >
                          ...ver mais
                        </Text>
                      }
                      hideLabel={
                        <Text
                          lh={1.3}
                          opacity={0.9}
                          size="sm"
                          c="var(--mantine-color-text)"
                        >
                          ...ver menos
                        </Text>
                      }
                    >
                      <Text size="sm" lh={1.3} style={{ whiteSpace: 'pre-line' }}>
                        {profile.bio}
                      </Text>
                    </Spoiler>
                  </>
                )}

                <Title order={3} fz="xs" c="dimmed" fw={400} mt={profile.bio ? 'md' : 0}>
                  Atividades na música
                </Title>
                {roles &&
                  roles.length > 0 &&
                  (() => {
                    const instrumentalists = roles.filter(
                      ({ roles: role }) => role?.instrumentalist,
                    )
                    const others = roles.filter(
                      ({ roles: role }) => !role?.instrumentalist,
                    )

                    const renderGroup = (group) =>
                      group.map(({ id, roles: role }, index) => (
                        <Text key={id} span fw={400}>
                          {role?.name_ptbr}
                          {index < group.length - 1 ? ' · ' : ''}
                        </Text>
                      ))

                    return (
                      <Stack gap={0}>
                        {instrumentalists.length > 0 && (
                          <Text size="sm">{renderGroup(instrumentalists)}</Text>
                        )}
                        {others.length > 0 && (
                          <Text size="sm">{renderGroup(others)}</Text>
                        )}
                      </Stack>
                    )
                  })()}
                <Title order={3} fz="xs" c="dimmed" fw={400} mt={6}>
                  Gêneros musicais de atuação
                </Title>
                {genres && genres.length > 0 ? (
                  <Text size="sm">
                    {genres.map(({ id, genres: genre }, index) => (
                      <Text key={id} span fw={400}>
                        {genre?.name}
                        {index < genres.length - 1 ? ' · ' : ''}
                      </Text>
                    ))}
                  </Text>
                ) : (
                  <Text size="sm">Não informado</Text>
                )}

                {profile?.plan === 'Pro' && (
                  <Flex mt={8} gap={6} align="center">
                    <ProPlanBadge small />
                    <Text size="xs" c="dimmed" lh={1} mt={3}>
                      {profile?.full_name} possui uma conta Mublin Premium
                    </Text>
                  </Flex>
                )}
              </SectionPanel>
              {profileProjects.length > 0 && (
                <>
                  <ScrollArea
                    id="projects"
                    mt="xs"
                    mb="xs"
                    w="100%"
                    type={isMobile ? 'never' : 'auto'}
                    offsetScrollbars={isMobile ? false : 'present'}
                    scrollbarSize={18}
                  >
                    <Flex gap={12}>
                      {isMobile && <Box style={{ flexShrink: 10, width: '5px' }} />}
                      {!loadingProjects &&
                        profileProjects?.map((item) => (
                          <Flex
                            key={item.id}
                            direction="column"
                            align="flex-start"
                            gap={2}
                            component={Link}
                            to={`/project/${item.slug ?? item.id}`}
                            style={{
                              cursor: 'pointer',
                              textDecoration: 'none',
                              color: 'inherit',
                            }}
                          >
                            <Box
                              pos="relative"
                              width={180}
                              height={180}
                              style={{ borderRadius: 12, overflow: 'hidden' }}
                            >
                              <Image
                                w={180}
                                h={180}
                                fit="cover"
                                src={
                                  item.picture
                                    ? `https://ik.imagekit.io/mublin/projects/${item.id}/tr:h-320,w-320,c-maintain_ratio/${item.picture}`
                                    : undefined
                                }
                                fallbackSrc="https://placehold.co/180x180?text=Sem+foto"
                                opacity={item.status === 1 ? 0.4 : 1}
                                style={{ transition: 'opacity 0.2s' }}
                              />

                              <Box
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: '65%',
                                  background:
                                    'linear-gradient(to top, rgba(0,0,0,0.82) 10%, transparent 100%)',
                                }}
                              />
                              <Flex
                                align="flex-start"
                                justify="flex-end"
                                pos="absolute"
                                direction="column"
                                gap={0}
                                inset={10}
                              >
                                {item.roles.length > 0 && (
                                  <Text
                                    size="12px"
                                    w={126}
                                    c="white"
                                    style={{
                                      textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                    }}
                                  >
                                    {item.roles.join(', ')} em
                                  </Text>
                                )}
                                <Text
                                  size="lg"
                                  w={140}
                                  fw={700}
                                  lh={1.4}
                                  c="white"
                                  style={{
                                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                                  }}
                                  truncate="end"
                                >
                                  {item.name}
                                </Text>
                                <Text
                                  c="white"
                                  truncate="end"
                                  lh={1}
                                  size="xs"
                                  fw={300}
                                  opacity={0.7}
                                >
                                  {item.type}
                                </Text>
                              </Flex>
                            </Box>
                          </Flex>
                        ))}
                      <Box style={{ flexShrink: 0 }} w={4} />
                    </Flex>
                  </ScrollArea>
                </>
              )}
              {loadingPosts ? (
                <Box mx="xs">
                  <SectionTitle text="Postagens" mb="md" />
                  <Group gap="xs" wrap="nowrap">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} width="100%" height={90} />
                    ))}
                  </Group>
                </Box>
              ) : (
                <>
                  {profilePosts.length > 0 ? (
                    <>
                      <SectionTitle
                        text="Postagens"
                        mb="xs"
                        mx={{ base: 'sm', md: 0 }}
                        id="posts"
                      />
                      <Scroller
                        key={profilePosts.length}
                        draggable
                        controlSize="xl"
                        showEndControl={profilePosts.length > 2}
                        startControlIcon={<IconCircleArrowLeftFilled size={36} />}
                        endControlIcon={<IconCircleArrowRightFilled size={36} />}
                      >
                        <Group gap="xs" wrap="nowrap">
                          {isMobile && <Box style={{ flexShrink: 10, width: '5px' }} />}
                          {loadingPosts
                            ? [1, 2, 3].map((i) => (
                                <Group key={i} gap="sm">
                                  <Skeleton circle height={36} />
                                  <Stack gap={4} style={{ flex: 1 }}>
                                    <Skeleton height={12} width="60%" radius="xl" />
                                    <Skeleton height={10} width="80%" radius="xl" />
                                  </Stack>
                                </Group>
                              ))
                            : profilePosts.map((post) => (
                                <Paper key={post.id} p="xs" withBorder h="100%" w="260px">
                                  <Text size="xs" c="dimmed" mt={4}>
                                    {dayjs(post.created_at).fromNow()}
                                  </Text>
                                  <Link
                                    to={`/post/${post.id}`}
                                    style={{ whiteSpace: 'pre-wrap', display: 'block' }}
                                    className="noDecoration"
                                  >
                                    <Text
                                      size="sm"
                                      maw="100%"
                                      my={6}
                                      lh={1.3}
                                      lineClamp={1}
                                      truncate="end"
                                      c="var(--mantine-color-text)"
                                    >
                                      {post.body}
                                    </Text>
                                  </Link>
                                  {post.image && (
                                    <Link to={`/post/${post.id}`}>
                                      <Image
                                        src={`https://ik.imagekit.io/mublin/posts/tr:w-700/${post.image}`}
                                        radius={false}
                                      />
                                    </Link>
                                  )}
                                  {post.video_url && (
                                    <Link to={`/post/${post.id}`}>
                                      <VideoPlayer url={post.video_url} thumbnailOnly />
                                    </Link>
                                  )}
                                  {(post.linked_gig_id || post.linked_product_id) && (
                                    <LinkedItem
                                      post={{
                                        ...post,
                                        linked_product_slug: post.products?.slug,
                                        linked_product_name: post.products?.name,
                                        linked_product_picture: post.products?.picture,
                                        linked_product_brand_name:
                                          post.products?.brands?.name,
                                        linked_gig_slug: post.gigs?.slug,
                                        linked_gig_title: post.gigs?.title,
                                        linked_gig_has_remuneration:
                                          post.gigs?.has_remuneration,
                                      }}
                                    />
                                  )}
                                </Paper>
                              ))}
                        </Group>
                      </Scroller>
                    </>
                  ) : (
                    <SectionPanel>
                      <SectionTitle text="Postagens" mb="sm" />
                      <Text size="sm" c="dimmed">
                        Nenhuma postagem até o momento
                      </Text>
                    </SectionPanel>
                  )}
                </>
              )}
              {loadingGear ? (
                <Box mx="xs">
                  <SectionTitle text="Equipamento" mb="md" />
                  <Group gap="xs" wrap="nowrap">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} width="100%" height={90} />
                    ))}
                  </Group>
                </Box>
              ) : (
                <>
                  {gear.length > 0 ? (
                    <>
                      <Group justify="space-between">
                        <SectionTitle
                          id="gear"
                          text={`Equipamento (${gear.length})`}
                          mt={10}
                          mb={4}
                          mx={{ base: 'sm', md: 0 }}
                        />
                        <Anchor
                          c="dimmed"
                          component={Link}
                          lh={1}
                          to={`/${username}/gear`}
                          fz="sm"
                          fw={500}
                        >
                          Ver tudo
                        </Anchor>
                      </Group>
                      <Group gap={10} mb={4} mx={{ base: 'sm', md: 0 }}>
                        {gearCategories.length > 1 && (
                          <Select
                            size="sm"
                            variant="filled"
                            w={145}
                            value={gearCategorySelected || ''}
                            clearable
                            onChange={(value) => setGearCategorySelected(value || '')}
                            data={[
                              { value: '', label: 'Exibir tudo' },
                              ...gearCategories.map((cat) => ({
                                value: String(cat.category_id),
                                label: truncateString(
                                  `${cat.category} (${cat.total})`,
                                  28,
                                ),
                              })),
                            ]}
                          />
                        )}
                        {user?.id === profile.id && (
                          <Menu shadow="md" width={200}>
                            <Menu.Target>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="lg"
                                aria-label="Opções de equipamento"
                              >
                                <IconDotsVerticalFilled size={20} />
                              </ActionIcon>
                            </Menu.Target>

                            <Menu.Dropdown>
                              <Menu.Label>Meu equipamento</Menu.Label>
                              <Menu.Item
                                leftSection={<IconPlus size={14} />}
                                component={Link}
                                to="/new/gear"
                              >
                                Adicionar novo
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconSettings size={14} />}
                                component={Link}
                                to="/settings/gear"
                              >
                                Gerenciar
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        )}
                      </Group>
                      <Box h="100%">
                        <Scroller
                          key={gear.length}
                          draggable
                          controlSize="xl"
                          showEndControl={gear.length > 4}
                          startControlIcon={<IconCircleArrowLeftFilled size={36} />}
                          endControlIcon={<IconCircleArrowRightFilled size={36} />}
                        >
                          {isMobile && <Box style={{ flexShrink: 10, width: '5px' }} />}
                          {gear.map((item) => (
                            <Flex
                              key={item.id_product}
                              direction="column"
                              justify="flex-start"
                              align="center"
                              w={140}
                            >
                              <Link to={`/gear/${item.products?.slug}`}>
                                <Image
                                  src={`https://ik.imagekit.io/mublin/products/tr:w-240,h-240,cm-pad_resize,bg-FFFFFF,fo-x/${item.products?.picture}`}
                                  h={120}
                                  mah={120}
                                  w="auto"
                                  fit="contain"
                                  mb={10}
                                  radius="md"
                                />
                              </Link>
                              <Text size="xs" c="dimmed" fw={500} lineClamp={2}>
                                {item.products?.brands?.name}
                              </Text>
                              <Text
                                size="xs"
                                fw={500}
                                lineClamp={2}
                                style={{ whiteSpace: 'pre-wrap' }}
                              >
                                {item.products?.name}
                              </Text>
                            </Flex>
                          ))}
                        </Scroller>
                        <Divider my="md" />
                        <Text fw={600} size="15px">
                          Setups de {profile.full_name}{' '}
                          {!!gearSetups.length && `(${gearSetups.length})`}
                        </Text>
                        {gearSetups.length > 0 && (
                          <Flex gap={16} mt={18}>
                            {gearSetups.map((setup) => (
                              <Box key={setup.id}>
                                <Flex w={60} direction="column" justify="center">
                                  <Link to={`/${username}/setup/${setup.id}`}>
                                    <Image
                                      src={`https://ik.imagekit.io/mublin/users/gear-setups/tr:w-120,h-120/${setup.image}`}
                                      h={60}
                                      mah={60}
                                      w="auto"
                                      fit="contain"
                                      radius="md"
                                      mb={4}
                                    />
                                  </Link>
                                  <Text ta="center" fw={550} size="xs" truncate="end">
                                    {setup.name}
                                  </Text>
                                  <Text ta="center" size="xs">
                                    {setup.totalItems ?? 0} itens
                                  </Text>
                                </Flex>
                              </Box>
                            ))}
                          </Flex>
                        )}
                      </Box>
                    </>
                  ) : (
                    <SectionPanel>
                      <SectionTitle text="Equipamento" mb="sm" />
                      <Text size="sm" c="dimmed">
                        Nenhum equipamento adicionado
                      </Text>
                    </SectionPanel>
                  )}
                </>
              )}
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap={10}>
              {workAvailability.length > 0 && workFocus.length > 0 && (
                <SectionPanel id="availability">
                  <SectionTitle text="Disponibilidade" mb="sm" />
                  {profile.is_open_to_work && !isMobile && (
                    <Alert variant="light" color="green" px={6} py={4}>
                      <Text size="xs">Disponível para trabalhos e gigs</Text>
                    </Alert>
                  )}
                  <Title order={3} fz="xs" c="dimmed" fw={400} mt="sm">
                    Disponível a partir de:
                  </Title>
                  <Text size="sm" fw={500}>
                    {profile.available_from
                      ? AVAILABLE_FROM_LABELS[profile.available_from] ||
                        profile.available_from
                      : 'Não informado'}
                  </Text>
                  <Title order={3} fz="xs" c="dimmed" fw={400} mt="sm" mb={2}>
                    Tipos de trabalho:
                  </Title>
                  {workAvailability.length > 0 ? (
                    <Group gap={6} wrap="wrap">
                      {workAvailability.map((item) => (
                        <Text span size="sm" lh={1.2} fw={500} key={item.id}>
                          <IconCheck size={9} stroke={4} /> {item.work_types?.name_ptbr}
                        </Text>
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Não informado
                    </Text>
                  )}
                  <Title order={3} fz="xs" c="dimmed" fw={400} mt="sm" mb={2}>
                    Vínculos de preferência:
                  </Title>
                  {workFocus.length > 0 ? (
                    <Group gap={6} wrap="wrap">
                      {workFocus.map((item) => (
                        <Text span size="sm" lh={1.2} fw={500} key={item.id}>
                          <IconCheck size={9} stroke={4} />{' '}
                          {item.work_focuses?.title_ptbr}
                        </Text>
                      ))}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Não informado
                    </Text>
                  )}
                </SectionPanel>
              )}
              {!!profile.is_legend && (
                <SectionPanel id="recognitions">
                  <SectionTitle text="Reconhecimentos" mb="sm" />
                  <Flex wrap="wrap" align="flex-start">
                    <Flex direction="column" w={100} align="center">
                      <IconShieldCheckFilled
                        className="iconLegend big"
                        title="Lenda da música"
                      />
                      <Text size="sm" fw={600} ta="center" my={4} lh={1}>
                        Lenda da música
                      </Text>
                      <Text size="11px" fw={300} opacity={0.7} ta="center">
                        Reconhecido pela contribuição para o mercado musical
                      </Text>
                      {/* <Text mt={6} size="10px" c="dimmed" ta="center">
                      Atribuído internamente pela equipe do Mublin conforme critérios
                      internos
                    </Text> */}
                    </Flex>
                    <Flex direction="column" w={100} align="center">
                      <IconTrophy className="iconLegend big" title="Grammy Winner" />
                      <Text size="sm" fw={600} ta="center" my={4} lh={1}>
                        Grammy Nominee
                      </Text>
                      <Text size="11px" fw={300} opacity={0.7} ta="center">
                        Vencedor ou indicado ao Grammys
                      </Text>
                    </Flex>
                  </Flex>
                </SectionPanel>
              )}
              {inspirations.length > 0 ? (
                <SectionPanel id="inspirations">
                  <SectionTitle text="Inspirações" mb={4} />
                  <Text size="xs" c="dimmed" mb="sm">
                    Artistas e bandas consagradas que inspiram {profile?.full_name}
                  </Text>
                  {loadingInspirations ? (
                    <Text size="sm">Carregando...</Text>
                  ) : (
                    <Scroller
                      key={inspirations.length}
                      draggable={isMobile}
                      controlSize="xl"
                      startControlIcon={<IconCircleArrowLeftFilled size={24} />}
                      endControlIcon={<IconCircleArrowRightFilled size={24} />}
                      edgeGradientColor="transparent"
                    >
                      <Group gap="xs" wrap="nowrap">
                        {inspirations.map(({ id, artists: artist }) => (
                          <Flex
                            key={id}
                            direction="column"
                            align="center"
                            gap={4}
                            w={64}
                            component={Link}
                            to={`/artist/${artist?.slug}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Avatar
                              size={56}
                              radius="xl"
                              src={
                                artist?.picture
                                  ? ARTISTS_PATH + artist.picture
                                  : undefined
                              }
                              title={artist?.name}
                            />
                            <Text
                              size="xs"
                              fw={500}
                              ta="center"
                              lineClamp={2}
                              lh={1.2}
                              w={64}
                            >
                              {artist?.name}
                            </Text>
                            {artist?.genres?.name_ptbr && (
                              <Text size="10px" c="dimmed" ta="center" lineClamp={1}>
                                {artist.genres.name_ptbr}
                              </Text>
                            )}
                          </Flex>
                        ))}
                      </Group>
                    </Scroller>
                  )}
                </SectionPanel>
              ) : (
                <SectionPanel>
                  <SectionTitle text="Inspirações" mb={4} />
                  <Text size="xs" c="dimmed" mb="sm">
                    Artistas e bandas consagradas que inspiram {profile?.full_name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Não informado
                  </Text>
                </SectionPanel>
              )}
              <SectionPanel id="suggested-profiles">
                <SectionTitle text="Mais perfis parecidos" mb="md" />
                {similarProfiles.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    Nenhum perfil similar encontrado.
                  </Text>
                ) : (
                  <Stack gap="md">
                    {similarProfiles.map((p) => (
                      <Flex
                        key={p.id}
                        gap="xs"
                        component={Link}
                        to={`/${p.username}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                        w="100%"
                        wrap="nowrap"
                        align="center"
                      >
                        <Box>
                          <Avatar
                            size={40}
                            radius="xl"
                            src={p.avatar ? AVATAR_PATH + p.avatar : undefined}
                          />
                        </Box>
                        <Stack gap={1} style={{ flexGrow: 1 }} maw="80%">
                          <Group gap={4} align="center" wrap="nowrap">
                            <Text size="sm" fw={600} lineClamp={1} truncate="end">
                              {p.full_name}
                            </Text>
                            {!!p.is_verified && (
                              <IconRosetteDiscountCheckFilled
                                className="iconVerified"
                                size={14}
                                title="Perfil verificado"
                              />
                            )}
                            {p.plan === 'Pro' && <ProPlanBadge small />}
                            {p.is_open_to_work && profile && (
                              <Badge
                                variant={isDark ? 'outline' : 'light'}
                                color="green"
                                mt={2}
                                style={{ flexShrink: 0 }}
                                size="xs"
                                title="Disponível para gigs"
                              >
                                Disp
                              </Badge>
                            )}
                          </Group>
                          {p.title && (
                            <Text size="sm" lineClamp={1} truncate="end">
                              {p.title}
                            </Text>
                          )}
                          {p.roles.length > 0 && (
                            <Text size="xs" c="dimmed" lineClamp={1} truncate="end">
                              {p.roles?.map((role, index) => (
                                <Text span key={role.id}>
                                  {role.name_ptbr}
                                  {index < p.roles.length - 1 ? ', ' : ''}
                                </Text>
                              ))}
                            </Text>
                          )}
                        </Stack>
                      </Flex>
                    ))}
                  </Stack>
                )}
              </SectionPanel>
              <SectionPanel id="social">
                <SectionTitle text="Redes sociais" mb="sm" />
                {profile.profile_social_links.length > 0 || profile.website ? (
                  <Group gap={10} wrap="wrap">
                    {profile.website && (
                      <ActionIcon
                        component="a"
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="light"
                        size="lg"
                        radius="xl"
                        title={profile.website}
                      >
                        <IconWorld size={18} />
                      </ActionIcon>
                    )}
                    {profile.profile_social_links.map((link) => {
                      const config = SOCIAL_CONFIG[link.platform]
                      if (!config) {
                        return null
                      }
                      const Icon = config.icon
                      const href = `${config.base}${link.handle}`
                      return (
                        <Tooltip
                          key={link.platform}
                          label={`${link.platform}: ${link.handle}`}
                          position="bottom"
                          withArrow
                        >
                          <ActionIcon
                            component="a"
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="filled"
                            color={config.color}
                            size="lg"
                            radius="xl"
                            title={`${link.platform}: ${link.handle}`}
                          >
                            <Icon size={20} />
                          </ActionIcon>
                        </Tooltip>
                      )
                    })}
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">
                    Nenhuma rede disponível
                  </Text>
                )}
              </SectionPanel>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>

      <Modal
        opened={followersOpened}
        onClose={closeFollowers}
        title={
          <Text fw={700} size="md">
            Seguidores
          </Text>
        }
        centered
        radius="md"
        size="sm"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        {renderUserList(followersList, 'Nenhum seguidor ainda.')}
      </Modal>

      <Modal
        opened={followingOpened}
        onClose={closeFollowing}
        title={
          <Text fw={700} size="md">
            Seguindo
          </Text>
        }
        centered
        radius="md"
        size="sm"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        {renderUserList(followingList, 'Não está seguindo ninguém ainda.')}
      </Modal>
      <Modal
        opened={contactInfoOpened}
        onClose={closeContactInfo}
        title="Dados de contato"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <SectionTitle text="Telefone" mb="sm" />
        {/* Telefone — só exibe se phone_number_is_public */}
        {profile.phone_number && profile.phone_number_is_public ? (
          <Group gap="xs">
            {profile.phone_number_is_whatsapp ? (
              <Anchor
                href={`https://wa.me/${profile.phone_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                underline="never"
              >
                <Group gap="xs">
                  <IconBrandWhatsapp size={16} color="var(--mantine-color-green-6)" />
                  <Text size="sm">{profile.phone_number}</Text>
                </Group>
              </Anchor>
            ) : (
              <>
                <IconPhone size={16} opacity={0.6} />
                <Text size="sm">{profile.phone_number}</Text>
              </>
            )}
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            Não disponível
          </Text>
        )}
      </Modal>
    </>
  )
}
