import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchProfileDetails,
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
  fetchProfileTravelPreference,
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
  Affix,
  Transition,
  Menu,
  Select,
  em,
  Badge,
  Center,
  Divider,
} from '@mantine/core'
import { useMediaQuery, useDisclosure, useWindowScroll } from '@mantine/hooks'
import LoadingSkeleton from '../components/profile/LoadingSkeleton'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayerYoutube from '../components/feed/VideoPlayerYoutube'
import SectionPanel from '../components/SectionPanel'
import InviteToGigModal from '../components/gigs/InviteToGigModal'
import RecognitionBadge from '../components/profile/RecognitionBadge'
import {
  IconMoodSad,
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
  IconArrowsMaximize,
  IconPlane,
  IconGuitarPick,
  IconRosetteDiscountCheck,
  IconSend,
  IconHeart,
  IconUserX,
  IconUserPlus,
} from '@tabler/icons-react'
import ProfileHeaderMobile from '../components/profile/ProfileHeaderMobile'
import AppNavbarMobile from '../components/AppNavbarMobile'
import ProPlanBadge from '../components/ProPlanBadge'
import SimilarProfiles from '../components/SimilarProfiles'
import { getAvatarUrl } from '../utils/profile'
import { truncateString } from '../utils/formatter'
import { isProfileLive } from '../utils/live'
import { AVAILABLE_FROM_LABELS } from '../constants/availability'
import { SOCIAL_CONFIG } from '../constants/socialConfig'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
import { WorkAvailabilityItem } from '../components/profile/WorkAvailabilityItem'

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
  const [expandedBio, setExpandedBio] = useState(false)

  const [followersOpened, { open: openFollowers, close: closeFollowers }] =
    useDisclosure(false)
  const [followingOpened, { open: openFollowing, close: closeFollowing }] =
    useDisclosure(false)
  const [contactInfoOpened, { open: openContactInfo, close: closeContactInfo }] =
    useDisclosure(false)
  const [inviteOpened, { open: openInvite, close: closeInvite }] = useDisclosure(false)

  const {
    data: profile,
    isLoading: isLoadingProfileInfo,
    isError,
  } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchProfileDetails(username),
    enabled: !!username && !authLoading,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const MENU_ITEMS = [
    { id: 'about', label: 'Sobre', active: true },
    { id: 'projects', label: 'Projetos', active: true },
    { id: 'posts', label: 'Postagens', active: true },
    { id: 'gear', label: 'Equipamento', active: true },
    {
      id: 'availability',
      label: 'Disponibilidade',
      active: profile?.show_availability_info,
    },
    { id: 'recognitions', label: 'Reconhecimentos', active: true },
    { id: 'inspirations', label: 'Inspirações', active: profile?.is_legend },
    { id: 'suggested-profiles', label: 'Perfis parecidos', active: true },
    { id: 'social', label: 'Redes', active: true },
  ]

  useEffect(() => {
    scrollTo({ y: 0 })
    setExpandedBio(false)
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

  const { data: followersList = [], isLoading: loadingFollowers } = useQuery({
    queryKey: ['profileFollowers', profile?.id],
    queryKeyHashFn: () => `profileFollowers-${profile?.id}`,
    queryFn: () => fetchProfileFollowers(profile?.id),
    enabled: !!profile?.id && followersOpened,
    staleTime: 0,
  })

  const { data: followingList = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ['profileFollowingList', profile?.id],
    queryKeyHashFn: () => `profileFollowingList-${profile?.id}`,
    queryFn: () => fetchProfileFollowingList(profile?.id),
    enabled: !!profile?.id && followingOpened,
    staleTime: 0,
  })

  const { data: similarProfiles = [], isLoading: loadingSimilarProfiles } = useQuery({
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
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: travelPreference = [], isLoading: loadingTravelPreference } = useQuery({
    queryKey: ['user-travel-preference', profile?.id],
    queryFn: () => fetchProfileTravelPreference(profile.id),
    enabled: !!profile?.id,
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

  const rolesOrdered = profile?.profile_roles
    ?.slice()
    ?.sort(
      (a, b) =>
        b.main_activity - a.main_activity ||
        Number(b.instrumentalist) - Number(a.instrumentalist),
    )
  const genres = profile?.profile_genres.sort((a, b) => b.main_genre - a.main_genre)
  const city = profile?.cities?.name
  const region = profile?.regions?.name
  const country =
    profile?.cities?.countries?.name_ptbr ?? profile?.cities?.countries?.name

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
          // assumirão os valores default definidos no schema.
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
            // featured={profile.is_open_to_work}
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
        >
          <Card.Section>
            <Box
              style={{
                position: 'relative',
                width: '100%',
                height: 90,
                overflow: 'hidden',
              }}
            >
              <Image
                src={
                  profile.cover_image
                    ? `https://ik.imagekit.io/mublin/tr:w-870,h-90,fo-center,c-maintain_ratio/users/avatars/${profile.cover_image}`
                    : 'https://ik.imagekit.io/mublin/bg/tr:w-870,h-90,bg-F3F3F3,fo-bottom/open-air-concert.jpg'
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
            region={region}
            country={country}
            user={user}
          />
        )}
        <Grid>
          <Grid.Col span={{ base: 12, md: 2 }} visibleFrom="sm">
            <Center mb="sm">
              <Avatar
                size={140}
                src={getAvatarUrl(profile.avatar, profile.is_open_to_work, 140)}
              />
            </Center>
            {user?.id !== profile.id && (
              <Stack gap={10} className="buttonContentToLeft">
                {followingInfo?.id ? (
                  <Button
                    fullWidth
                    size="xs"
                    radius="md"
                    variant="filled"
                    className="defaultMublinButton"
                    onClick={() => unfollowProfile(user.id, profile.id)}
                    disabled={loadingFollowingInfo}
                    leftSection={<IconUserX size={16} />}
                  >
                    Deixar de seguir
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    size="xs"
                    radius="md"
                    variant="gradient"
                    gradient={{ from: 'grape.8', to: 'mublinColor.8', deg: 55 }}
                    onClick={() => followProfile(user.id, profile.id)}
                    disabled={loadingFollowingInfo}
                    leftSection={<IconUserPlus size={16} />}
                  >
                    Seguir
                  </Button>
                )}
                <Button
                  fullWidth
                  size="xs"
                  radius="md"
                  variant="filled"
                  className="defaultMublinButton"
                  onClick={openInvite}
                  leftSection={<IconSend size={16} />}
                >
                  Convidar para gig
                </Button>
                <Button
                  fullWidth
                  size="xs"
                  radius="md"
                  variant="filled"
                  className="defaultMublinButton"
                  onClick={openInvite}
                  leftSection={<IconHeart size={16} />}
                >
                  Salvar nos favoritos
                </Button>
              </Stack>
            )}
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 7 }}>
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

            <Stack gap={0} flex={1} mb="md" visibleFrom="sm">
              <Flex align="center" gap={4} wrap="wrap">
                <Title
                  order={1}
                  fw={600}
                  size="26px"
                  // lh="1"
                  component={Text}
                  lineClamp={2}
                >
                  {profile.full_name}
                </Title>
                {!!profile.is_verified && (
                  <IconRosetteDiscountCheck
                    className="iconVerified"
                    title="Perfil verificado"
                  />
                )}
                {/* {!!profile?.is_legend && (
                    <IconShieldCheckFilled
                      className="iconLegend"
                      title="Lenda da música"
                    />
                  )} */}
                {/* {profile?.plan === 'Pro' && <ProPlanBadge />} */}
                {user?.id === profile.id && (
                  <ActionIcon
                    component={Link}
                    to="/settings/profile"
                    radius="xl"
                    size="sm"
                    variant="subtle"
                    aria-label="Editar meu perfil"
                    title="Editar meu perfil"
                  >
                    <IconPencil size={18} stroke={2} />
                  </ActionIcon>
                )}
              </Flex>
              {profile.title && (
                <Text size="sm" fw={400} maw={420} lh={1.2} my={3}>
                  {profile.title}
                </Text>
              )}
              <Flex align="center" gap={4} opacity={0.8}>
                {/* <Text span size="sm">
                    @{profile.username}
                  </Text> */}
                {(city || region) && (
                  <Text size="xs" fw={300}>
                    {[city, region, country].filter(Boolean).join(', ')}
                  </Text>
                )}
                <Text size="xs">·</Text>
                <Anchor size="xs" onClick={openContactInfo} c="var(--mantine-color-text)">
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
              <Group gap="md" mt={3}>
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
            </Stack>

            <Stack gap={12} mt={{ base: 'md', md: 'md' }}>
              <SectionPanel id="about">
                {profile.bio && (
                  <>
                    <SectionTitle text="Sobre" mb={12} />
                    <Text
                      fz="sm"
                      lh={1.4}
                      style={{ whiteSpace: 'pre-line', cursor: 'default' }}
                      lineClamp={expandedBio ? undefined : 4}
                      onClick={() => setExpandedBio(!expandedBio)}
                    >
                      {profile.bio}
                    </Text>
                  </>
                )}

                <Title
                  order={3}
                  fz="xs"
                  fw={300}
                  mt={profile.bio ? 'lg' : 0}
                  mb="xs"
                  opacity={0.8}
                >
                  Principais atividades
                </Title>
                {rolesOrdered && rolesOrdered.length > 0 && (
                  <Group gap={4}>
                    {rolesOrdered.map((role) => (
                      <Badge
                        radius="xl"
                        size="md"
                        variant="light"
                        color="var(--mantine-color-text)"
                        key={role.id}
                      >
                        {role?.roles?.description_ptbr}
                      </Badge>
                    ))}
                  </Group>
                )}

                {genres && genres.length > 0 && (
                  <>
                    <Title order={3} fz="xs" fw={300} mt="xs" mb={4} opacity={0.8}>
                      Gêneros musicais de atuação
                    </Title>
                    {genres && genres.length > 0 ? (
                      <Group gap={4} mt="xs">
                        {genres.map(({ id, genres: genre }) => (
                          <Badge
                            radius="xl"
                            size="md"
                            variant="light"
                            color="var(--mantine-color-text)"
                            key={id}
                          >
                            {genre?.name}
                          </Badge>
                        ))}
                      </Group>
                    ) : (
                      <Text size="xs" c="dimmed">
                        Não informado
                      </Text>
                    )}
                  </>
                )}
              </SectionPanel>
              {/* <SectionPanel>
                <SectionTitle text="Gêneros musicais de atuação" mb={12} />
                {genres && genres.length > 0 ? (
                  <Group gap={6} mt={6}>
                    {genres.map(({ id, genres: genre }) => (
                      <Badge
                        radius="xl"
                        size="md"
                        variant="light"
                        color="var(--mantine-color-text)"
                        key={id}
                      >
                        {genre?.name}
                      </Badge>
                    ))}
                  </Group>
                ) : (
                  <Text size="xs" c="dimmed">
                    Não informado
                  </Text>
                )}
              </SectionPanel> */}
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
                                      <VideoPlayerYoutube
                                        url={post.video_url}
                                        thumbnailOnly
                                      />
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
                      <Group justify="flex-start" align="center" gap="xs" mt={10}>
                        <SectionTitle
                          id="gear"
                          text={`Equipamento (${gear.length})`}
                          ml={{ base: 'sm', md: 0 }}
                        />

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
                        <ActionIcon
                          component={Link}
                          to={`/${username}/gear`}
                          size="lg"
                          radius="xl"
                          title="Maximizar equipamentos"
                          variant="subtle"
                          color="gray"
                        >
                          <IconArrowsMaximize size={18} />
                        </ActionIcon>
                      </Group>
                      <Group gap={10} mb={4} mx={{ base: 'sm', md: 0 }}>
                        {gearCategories.length > 1 && (
                          <Select
                            size="md"
                            variant="unstyled"
                            w={190}
                            value={gearCategorySelected || ''}
                            onChange={(value) => setGearCategorySelected(value || '')}
                            data={[
                              { value: '', label: 'Todos' },
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
                                ta="center"
                                lineClamp={2}
                                style={{ whiteSpace: 'pre-wrap' }}
                              >
                                {item.products?.name}
                              </Text>
                            </Flex>
                          ))}
                        </Scroller>
                        <Box ml={{ base: 'sm', md: 0 }}>
                          <Text fw={600} size="15px" mt="md">
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
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Stack gap={10}>
              {profile?.show_availability_info && (
                <SectionPanel id="availability">
                  <SectionTitle text="Disponibilidade" mb="sm" />
                  <Divider mt="sm" label="Disponível a partir de:" labelPosition="left" />
                  {profile.available_from ? (
                    <Text size="sm">
                      {AVAILABLE_FROM_LABELS[profile.available_from] ||
                        profile.available_from}
                    </Text>
                  ) : (
                    <Text size="sm" opacity={0.8}>
                      Não informado
                    </Text>
                  )}
                  <Divider
                    mt="xs"
                    mb={2}
                    label="Tipos de trabalho:"
                    labelPosition="left"
                  />
                  {workAvailability.length > 0 ? (
                    <Flex gap="xs" wrap="wrap" direction="column">
                      {workAvailability.map((item) => (
                        <>
                          <Stack gap={1}>
                            <WorkAvailabilityItem item={item} />
                          </Stack>
                        </>
                      ))}
                    </Flex>
                  ) : (
                    <Text size="sm" opacity={0.8}>
                      Não informado
                    </Text>
                  )}
                  <Divider
                    mt="sm"
                    mb={2}
                    label="Vínculos de preferência:"
                    labelPosition="left"
                  />
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
                    <Text size="sm" opacity={0.8}>
                      Não informado
                    </Text>
                  )}
                  <Divider
                    mt="sm"
                    label="Preferência para viagens:"
                    labelPosition="left"
                  />
                  {loadingTravelPreference ? (
                    <Text size="sm" c="dimmed">
                      Carregando...
                    </Text>
                  ) : (
                    <>
                      {travelPreference?.id ? (
                        <Text span size="sm" lh={1.2} fw={500}>
                          {travelPreference?.travel_preferences?.label}
                        </Text>
                      ) : (
                        <Text size="sm" opacity={0.8}>
                          Não informado
                        </Text>
                      )}
                    </>
                  )}
                </SectionPanel>
              )}

              <SectionPanel id="recognitions">
                <SectionTitle text="Reconhecimentos" mb="sm" />
                {/* <Text mt={6} size="10px" c="dimmed" ta="center">
                      Atribuído internamente pela equipe do Mublin conforme critérios
                      internos
                    </Text> */}
                <Scroller
                  key={3}
                  draggable={isMobile}
                  controlSize="xl"
                  startControlIcon={<IconCircleArrowLeftFilled size={24} />}
                  endControlIcon={<IconCircleArrowRightFilled size={24} />}
                  edgeGradientColor="transparent"
                >
                  <Group gap={12} wrap="nowrap" align="flex-start">
                    <RecognitionBadge
                      label="Mublin OG"
                      description="Perfil entre os primeiros usuários da plataforma"
                      color="dark"
                    />
                    {!!profile.is_legend && (
                      <RecognitionBadge
                        icon={IconShieldCheckFilled}
                        label="Lenda da música"
                        description="Carreira amplamente reconhecida"
                        color="purple"
                      />
                    )}
                    <RecognitionBadge
                      icon={IconTrophy}
                      label="Grammy Nominee"
                      description="Indicação ou vitória comprovada no Grammy"
                      color="amber"
                    />
                    <RecognitionBadge
                      icon={IconPlane}
                      label="Internacional "
                      description="Atuação em mais de um país"
                      color="green"
                    />
                    <RecognitionBadge
                      icon={IconGuitarPick}
                      label="Bem equipado"
                      description="10 ou mais itens no gear"
                      color="coral"
                    />
                  </Group>
                </Scroller>
              </SectionPanel>

              <SectionPanel id="inspirations">
                <SectionTitle
                  text="Inspirações"
                  mb={inspirations.length > 0 ? 4 : 'sm'}
                />
                {inspirations.length > 0 && (
                  <Text size="xs" c="dimmed" mb="sm">
                    Figuras consagradas que inspiram {profile?.full_name}
                  </Text>
                )}
                {loadingInspirations ? (
                  <Text size="sm">Carregando...</Text>
                ) : inspirations.length > 0 ? (
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
                              artist?.picture ? ARTISTS_PATH + artist.picture : undefined
                            }
                            alt={`Foto de ${artist?.name}`}
                          />
                          <Text
                            size="xs"
                            fw={500}
                            ta="center"
                            lineClamp={2}
                            lh={1.2}
                            w={64}
                            title={artist?.name}
                          >
                            {artist?.name}
                          </Text>
                          {artist?.genre?.name_ptbr && (
                            <Text size="10px" c="dimmed" ta="center" lineClamp={1}>
                              {artist?.genre?.name_ptbr || artist?.genre?.name}
                            </Text>
                          )}
                        </Flex>
                      ))}
                    </Group>
                  </Scroller>
                ) : (
                  <Text size="sm" c="dimmed">
                    Não informado
                  </Text>
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
                            variant="light"
                            color="var(--mantine-color-text)"
                            size="xl"
                            radius="xl"
                            title={`${link.platform}: ${link.handle}`}
                          >
                            <Icon color="var(--mantine-color-text)" size={25} />
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
              <SectionPanel id="suggested-profiles">
                <SectionTitle text="Mais perfis parecidos" mb="md" />
                <SimilarProfiles
                  profiles={similarProfiles}
                  loading={loadingSimilarProfiles}
                />
              </SectionPanel>
              {profile?.plan === 'Pro' && (
                <SectionPanel>
                  <Flex gap={6} align="center">
                    <ProPlanBadge small />
                    <Text size="xs" c="dimmed" lh={1} mt={3}>
                      {profile?.full_name} possui uma conta Premium
                    </Text>
                  </Flex>
                </SectionPanel>
              )}
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
        {loadingFollowers ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            Carregando...
          </Text>
        ) : (
          renderUserList(followersList, 'Nenhum seguidor ainda.')
        )}
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
        {loadingFollowing ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            Carregando...
          </Text>
        ) : (
          renderUserList(followingList, 'Não está seguindo ninguém ainda.')
        )}
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
        <Stack mt="md" gap="xs">
          <Box>
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
          </Box>
        </Stack>
      </Modal>

      <InviteToGigModal
        opened={inviteOpened}
        onClose={closeInvite}
        targetProfile={{
          id: profile.id,
          full_name: profile.full_name,
          username: profile.username,
          avatar: profile.avatar,
          title: profile.title,
        }}
      />
    </>
  )
}
