import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  fetchProfileDetails,
  fetchCheckFollowing,
  fetchProfileFollowers,
  fetchProfileFollowingList,
  fetchSimilarProfiles,
  fetchProfileFeed,
  fetchProfileGear,
  fetchProfileGearSetups,
  fetchProfileWorkAvailability,
  fetchProfileWorkFocuses,
  fetchProfileTravelPreference,
  fetchProfileInspirations,
  fetchProfilePartners,
  fetchProfilePortfolio,
  fetchProfileEducation,
  fetchProfileTeachers,
  fetchCheckFavorite,
  toggleFavorite,
  fetchPortfolioUpvotes,
  togglePortfolioUpvote,
  fetchProfileLinks,
  fetchProfileUpcomingEvents,
} from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
// prettier-ignore
import {
  useMantineColorScheme,
  Grid, Container, Center,
  Modal, Drawer,
  Scroller, Skeleton, Stack,
  Box, Card,
  Transition, ScrollArea,
  Affix, Divider,
  Avatar, Image,
  Title, Text,
  Flex, Group,
  Button, ActionIcon, ThemeIcon, 
  Alert, Tooltip, Anchor,
  Spoiler, em,
  Badge, Indicator,
} from '@mantine/core'
// prettier-ignore
import { useMediaQuery, useDisclosure, useWindowScroll, useScroller } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import LoadingSkeleton from '../components/profile/LoadingSkeleton'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayerYoutube from '../components/feed/VideoPlayerYoutube'
import SectionPanel from '../components/SectionPanel'
import InviteToGigModal from '../components/gigs/InviteToGigModal'
import RecognitionBadge from '../components/profile/RecognitionBadge'
import PortfolioUpvote from '../components/profile/PortfolioUpvote'
import { truncateString } from '../utils/formatter'
// prettier-ignore
import {
  IconMoodSad, IconWorld, IconCheck,
  IconShieldCheckFilled, IconPlus,
  IconCircleArrowLeftFilled,
  IconCircleArrowRightFilled,
  IconBrandWhatsapp,
  IconDotsVerticalFilled, IconBrain,
  IconTrophy, IconGuitarPick,
  IconSend, IconEye, IconLink,
  IconUserPlus, IconUserX,
  IconChevronLeft, IconChevronRight,
  IconPencil, IconSparkles,
  IconBookmark, IconBookmarkFilled,
  IconRosetteDiscountCheckFilled,
  IconSchool, IconUserCircle,
  IconExternalLink,
  IconSettings,
} from '@tabler/icons-react'
import ProfileHeaderMobile from '../components/profile/ProfileHeaderMobile'
import AppNavbarMobile from '../components/AppNavbarMobile'
import ProPlanBadge from '../components/ProPlanBadge'
import SimilarProfiles from '../components/SimilarProfiles'
import { formatPortfolioPeriod, getAvatarUrl } from '../utils/profile'
import { isProfileLive } from '../utils/live'
import { isMublinOG } from '../utils/badges'
import { AVAILABLE_FROM_LABELS } from '../constants/availability'
import { SOCIAL_CONFIG } from '../constants/socialConfig'
import relativeTime from 'dayjs/plugin/relativeTime'
import { WorkAvailabilityItem } from '../components/profile/WorkAvailabilityItem'
import MublinMLogo from '../assets/svg/mublin-m-logo-silver.svg'
import dayjs from 'dayjs'
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-120,w-120,c-maintain_ratio/'
const COMPANY_PATH =
  'https://ik.imagekit.io/mublin/products/brands/tr:h-96,w-96,cm-pad_resize,bg-FFFFFF,fo-x/'
const EVENTS_PATH =
  'https://ik.imagekit.io/mublin/events/tr:h-140,w-140,c-maintain_ratio/'

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
  const postsScroller = useScroller()
  const inspirationsScroller = useScroller()
  const partnersScroller = useScroller()
  const gearScroller = useScroller()
  const upcomingEventsScroller = useScroller()
  const menuItemRefs = useRef({})

  const [activeSection, setActiveSection] = useState('')
  const [expandedBio, setExpandedBio] = useState(false)

  const [followersOpened, { open: openFollowers, close: closeFollowers }] =
    useDisclosure(false)
  const [followingOpened, { open: openFollowing, close: closeFollowing }] =
    useDisclosure(false)
  const [contactInfoOpened, { open: openContactInfo, close: closeContactInfo }] =
    useDisclosure(false)
  const [linksOpened, { open: openLinksModal, close: closeLinksModal }] =
    useDisclosure(false)
  const [inviteOpened, { open: openInvite, close: closeInvite }] = useDisclosure(false)
  const [actionsOpened, { open: openActions, close: closeActions }] = useDisclosure(false)

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

  const isOwnProfile = !!profile?.id && !!user?.id && profile.id === user.id

  const { data: upcomingEvents = [], isLoading: loadingUpcomingEvents } = useQuery({
    queryKey: ['profile-upcoming-events', profile?.id],
    queryFn: () => fetchProfileUpcomingEvents(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: profileViewCount } = useQuery({
    queryKey: ['profile-view-count', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_profile_view_count', {
        p_profile_id: profile.id,
      })
      if (error) {
        throw error
      }
      return data
    },
    enabled: isOwnProfile,
    staleTime: 1000 * 60, // 1 min
  })

  const MENU_ITEMS = [
    { id: 'about', label: 'Sobre', active: true },
    { id: 'portfolio', label: 'Portfólio', active: true },
    { id: 'education', label: 'Formação', active: true },
    { id: 'posts', label: 'Postagens', active: true },
    { id: 'gear', label: 'Equipamento', active: true },
    {
      id: 'availability',
      label: 'Disponibilidade',
      active: profile?.show_availability_info,
    },
    { id: 'recognitions', label: 'Reconhecimentos', active: true },
    { id: 'inspirations', label: 'Inspirações', active: true },
    { id: 'partners', label: 'Parceiros', active: true },
    { id: 'social', label: 'Redes sociais', active: true },
    { id: 'suggested-profiles', label: 'Perfis parecidos', active: true },
  ]

  useEffect(() => {
    scrollTo({ y: 0 })
    setExpandedBio(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  useEffect(() => {
    if (!isMobile || !activeSection) {
      return
    }

    const activeEl = menuItemRefs.current[activeSection]
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', // não mexe no scroll vertical da página
        inline: 'center', // centraliza o item no scroll horizontal
      })
    }
  }, [activeSection, isMobile])

  useEffect(() => {
    if (!profile?.id || !user?.id) {
      return
    }
    if (profile.id === user.id) {
      return
    } // não conta visita ao próprio perfil

    supabase.rpc('log_profile_view', { p_profile_id: profile.id }).then(({ error }) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao registrar visita ao perfil:', error)
      }
    })
  }, [profile?.id, user?.id])

  const { data: recognitions = [] } = useQuery({
    queryKey: ['profile-recognitions', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_recognitions')
        .select('type')
        .eq('profile_id', profile.id)
      if (error) {
        throw error
      }
      return data.map((r) => r.type)
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10, // muda raramente
  })

  const isGrammyNominee = recognitions.includes('grammy_nominee')
  const isLegend = recognitions.includes('legend')

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

  const { data: favoriteInfo, isLoading: loadingFavoriteInfo } = useQuery({
    queryKey: ['profile-favorite-info', profile?.id],
    queryFn: () => fetchCheckFavorite(profile.id, user.id),
    enabled: !!profile?.id && !!user?.id && profile.id !== user.id,
    staleTime: 1000 * 60 * 5,
  })

  const { mutate: handleToggleFavorite, isPending: togglingFavorite } = useMutation({
    mutationFn: (currentlyFavorited) =>
      toggleFavorite(profile.id, user.id, currentlyFavorited),

    onMutate: async (currentlyFavorited) => {
      const queryKey = ['profile-favorite-info', profile.id]

      // Cancela qualquer refetch em andamento pra não sobrescrever nossa atualização otimista
      await queryClient.cancelQueries({ queryKey })

      const previousFavoriteInfo = queryClient.getQueryData(queryKey)

      // Aplica o resultado esperado imediatamente na tela
      queryClient.setQueryData(queryKey, currentlyFavorited ? null : { id: 'optimistic' })

      // Retorna o valor anterior pro caso precisar reverter em onError
      return { previousFavoriteInfo }
    },

    onError: (error, _currentlyFavorited, context) => {
      // Reverte pro estado anterior se a chamada falhar
      queryClient.setQueryData(
        ['profile-favorite-info', profile.id],
        context?.previousFavoriteInfo,
      )
      notifications.show({
        title: 'Ops!',
        message:
          error.message || 'Não conseguimos atualizar seus favoritos neste momento',
        color: 'red',
        position: 'top-center',
      })
    },

    onSuccess: (_data, currentlyFavorited) => {
      notifications.show({
        title: currentlyFavorited ? 'Removido' : 'Adicionado',
        message: currentlyFavorited
          ? 'Perfil removido dos seus favoritos'
          : 'Perfil adicionado aos seus favoritos',
        color: 'green',
        position: 'top-center',
      })
    },

    onSettled: () => {
      // Garante que o cache reflita o estado real do banco, mesmo em sucesso
      queryClient.invalidateQueries({ queryKey: ['profile-favorite-info', profile.id] })
    },
  })

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
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 2,
  })

  const { data: followingList = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ['profileFollowingList', profile?.id],
    queryKeyHashFn: () => `profileFollowingList-${profile?.id}`,
    queryFn: () => fetchProfileFollowingList(profile?.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 2,
  })

  const { data: similarProfiles = [], isLoading: loadingSimilarProfiles } = useQuery({
    queryKey: ['similar-profiles', profile?.id],
    queryFn: () => fetchSimilarProfiles(profile.id, profile.region_id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  })

  const { data: profileLinks = [] } = useQuery({
    queryKey: ['profile-links', profile?.id],
    queryFn: () => fetchProfileLinks(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
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

  const gear = gearList

  const { data: gearSetups = [] } = useQuery({
    queryKey: ['user-gear-setups', profile?.id],
    queryFn: () => fetchProfileGearSetups(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: workAvailability = [] } = useQuery({
    queryKey: ['user-work-availability', profile?.id],
    queryFn: () => fetchProfileWorkAvailability(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: workFocus = [] } = useQuery({
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

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['profile-partners', profile?.id],
    queryFn: () => fetchProfilePartners(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  })

  const { data: portfolio = [], isLoading: loadingPortfolio } = useQuery({
    queryKey: ['profile-portfolio', profile?.id],
    queryFn: () => fetchProfilePortfolio(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  })

  const { data: portfolioUpvotes = [] } = useQuery({
    queryKey: ['portfolio-upvotes', profile?.id, user?.id],
    queryFn: () => fetchPortfolioUpvotes(profile.id, user?.id),
    enabled: !!profile?.id && portfolio.length > 0,
    staleTime: 1000 * 60 * 2,
  })

  const { data: education = [], isLoading: loadingEducation } = useQuery({
    queryKey: ['profile-education', profile?.id],
    queryFn: () => fetchProfileEducation(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  })

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['profile-teachers', profile?.id],
    queryFn: () => fetchProfileTeachers(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  })

  const upvotesByPortfolioId = useMemo(
    () => Object.fromEntries(portfolioUpvotes.map((u) => [u.portfolio_id, u])),
    [portfolioUpvotes],
  )

  const { mutate: handleToggleUpvote } = useMutation({
    mutationFn: ({ portfolioId, currentlyUpvoted }) =>
      togglePortfolioUpvote(portfolioId, user.id, currentlyUpvoted),

    onMutate: async ({ portfolioId, currentlyUpvoted }) => {
      const queryKey = ['portfolio-upvotes', profile.id, user?.id]
      await queryClient.cancelQueries({ queryKey })

      const previousUpvotes = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, (old = []) => {
        const exists = old.some((u) => u.portfolio_id === portfolioId)
        if (!exists) {
          return [
            ...old,
            { portfolio_id: portfolioId, upvote_count: 1, has_upvoted: true },
          ]
        }
        return old.map((u) =>
          u.portfolio_id === portfolioId
            ? {
                ...u,
                upvote_count: currentlyUpvoted
                  ? Number(u.upvote_count) - 1
                  : Number(u.upvote_count) + 1,
                has_upvoted: !currentlyUpvoted,
              }
            : u,
        )
      })

      return { previousUpvotes }
    },

    onError: (error, _vars, context) => {
      queryClient.setQueryData(
        ['portfolio-upvotes', profile.id, user?.id],
        context?.previousUpvotes,
      )
      notifications.show({
        title: 'Ops!',
        message: error.message || 'Não conseguimos registrar seu voto neste momento',
        color: 'red',
        position: 'top-center',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['portfolio-upvotes', profile.id, user?.id],
      })
    },
  })

  const rolesOrdered = profile?.profile_roles
    ?.slice()
    ?.sort(
      (a, b) =>
        b.main_activity - a.main_activity ||
        Number(b.roles?.instrumentalist) - Number(a.roles?.instrumentalist),
    )

  const instrumentRolesCount =
    rolesOrdered?.filter((role) => role.roles?.instrumentalist).length ?? 0

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

  if (isLoadingProfileInfo) {
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
    queryClient.invalidateQueries({ queryKey: ['profileFollowers', profile.id] })
    queryClient.invalidateQueries({ queryKey: ['profileFollowersList', profile.id] })

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
    queryClient.invalidateQueries({ queryKey: ['profileFollowers', profile.id] })
    queryClient.invalidateQueries({ queryKey: ['profileFollowersList', profile.id] })

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

      <Container
        size="xl"
        py="sm"
        px={0}
        mt={!profile.cover_image ? { base: 51, sm: 0 } : 0}
      >
        <Grid>
          <Grid.Col span={{ base: 12, md: 9 }} pos="relative">
            {profile.cover_image && (
              <Card
                mt={{ base: 46, sm: 0 }}
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
            {isMobile && (
              <ProfileHeaderMobile
                mt={profile.cover_image ? -55 : 0}
                profile={profile}
                city={city}
                region={region}
                country={country}
                profileViewCount={profileViewCount}
                links={profileLinks}
                onOpenLinks={openLinksModal}
              />
            )}
            <Grid>
              <Grid.Col span={{ base: 12, md: 2.7 }} visibleFrom="sm" pos="relative">
                <Box
                  top={profile.cover_image ? -22 : 0}
                  left={0}
                  pos={profile.cover_image ? 'absolute' : 'inherit'}
                >
                  <Center mb="sm">
                    <Avatar
                      size={140}
                      src={getAvatarUrl(profile.avatar, profile.is_open_to_work, 140)}
                    />
                  </Center>

                  <SectionPanel p={0} className="buttonContentToLeft">
                    <Button.Group orientation="vertical">
                      {isOwnProfile ? (
                        <Button
                          component={Link}
                          to="/settings/profile"
                          size="sm"
                          radius="md"
                          variant="subtle"
                          color="gray"
                          leftSection={<IconPencil size={16} />}
                        >
                          Editar meu perfil
                        </Button>
                      ) : (
                        <>
                          {followingInfo?.id ? (
                            <Button
                              size="sm"
                              variant="subtle"
                              color="gray"
                              radius="md"
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
                              gradient={{
                                from: 'grape.8',
                                to: 'mublinColor.8',
                                deg: 55,
                              }}
                              onClick={() => followProfile(user.id, profile.id)}
                              disabled={loadingFollowingInfo}
                              loading={loadingFollowingInfo}
                              leftSection={<IconUserPlus size={16} />}
                            >
                              Seguir
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="subtle"
                            color="gray"
                            radius="md"
                            onClick={openInvite}
                          >
                            Convidar para gig
                          </Button>
                          <Button
                            size="sm"
                            radius="md"
                            variant="subtle"
                            color="gray"
                            leftSection={
                              favoriteInfo?.id ? (
                                <IconBookmarkFilled size={16} />
                              ) : (
                                <IconBookmark size={16} />
                              )
                            }
                            onClick={() => handleToggleFavorite(!!favoriteInfo?.id)}
                            disabled={loadingFavoriteInfo || togglingFavorite}
                          >
                            {favoriteInfo?.id ? 'Salvo' : 'Salvar'}
                          </Button>
                        </>
                      )}
                    </Button.Group>
                  </SectionPanel>
                </Box>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 9.3 }}>
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
                                  ref={(el) => {
                                    menuItemRefs.current[item.id] = el
                                  }}
                                  onClick={() => scrollToSection(item.id)}
                                  style={{
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
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

                <Stack
                  gap={0}
                  flex={1}
                  mb="xs"
                  visibleFrom="sm"
                  mt={profile.cover_image ? { base: 0, sm: 14 } : 0}
                >
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
                      <IconRosetteDiscountCheckFilled
                        className="iconVerified"
                        title="Perfil verificado"
                      />
                    )}
                  </Flex>
                  {profile.title && (
                    <Text size="15px" fw={400} maw={420} lh={1.2} my={3}>
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
                    <Anchor
                      size="xs"
                      onClick={openContactInfo}
                      c="var(--mantine-color-text)"
                    >
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
                  {profileLinks.length > 0 && (
                    <Flex align="center" gap={4} opacity={0.8} mt={6}>
                      <IconLink size={13} style={{ flexShrink: 0 }} />
                      <Anchor
                        size="xs"
                        fw={300}
                        onClick={openLinksModal}
                        c="var(--mantine-color-text)"
                        underline="never"
                      >
                        {profileLinks[0].label}
                        {profileLinks.length > 1 && ` +${profileLinks.length - 1} links`}
                      </Anchor>
                    </Flex>
                  )}
                </Stack>

                <Group
                  gap="md"
                  justify="flex-start"
                  mt={{ base: 6, md: 0 }}
                  px={{ base: 'sm', md: 0 }}
                >
                  <Anchor
                    underline="never"
                    onClick={openFollowers}
                    style={{
                      display: 'inline',
                      hover: { textDecoration: 'underline' },
                      color: 'inherit',
                    }}
                  >
                    <Text size="sm" fw={600}>
                      {followersList.length} seguidores
                    </Text>
                  </Anchor>
                  <Anchor
                    underline="never"
                    onClick={openFollowing}
                    style={{
                      display: 'inline',
                      hover: { textDecoration: 'underline' },
                      color: 'inherit',
                    }}
                  >
                    <Text size="sm" fw={600}>
                      {followingList.length} seguindo
                    </Text>
                  </Anchor>
                </Group>

                {!isOwnProfile && (
                  <Group justify="space-around" hiddenFrom="sm" px="sm" mt="sm">
                    {followingInfo?.id ? (
                      <Button
                        flex={1}
                        size="sm"
                        radius="md"
                        variant="filled"
                        className="defaultMublinButton"
                        onClick={openInvite}
                        leftSection={<IconSend size={16} />}
                      >
                        Convidar para gig
                      </Button>
                    ) : (
                      <Button
                        flex={1}
                        size="sm"
                        radius="md"
                        variant="gradient"
                        gradient={{ from: 'grape.8', to: 'mublinColor.8', deg: 55 }}
                        onClick={() => followProfile(user.id, profile.id)}
                        disabled={loadingFollowingInfo}
                      >
                        Seguir
                      </Button>
                    )}
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="lg"
                      aria-label="Opções de equipamento"
                      onClick={openActions}
                    >
                      <IconDotsVerticalFilled size={20} />
                    </ActionIcon>
                  </Group>
                )}

                <Stack gap={12} mt={{ base: 'md', md: 'sm' }}>
                  {isOwnProfile && typeof profileViewCount === 'number' && (
                    <SectionPanel id="visitors" py="xs">
                      <Group gap="xs">
                        <IconEye color="gray" size={16} />
                        <Link
                          to="/profile-visitors"
                          style={{
                            whiteSpace: 'pre-wrap',
                            display: 'block',
                          }}
                          className="noDecoration"
                        >
                          <Text size="sm" c="dimmed">
                            {profileViewCount === 0
                              ? 'Ninguém visualizou seu perfil ainda'
                              : profileViewCount === 1
                                ? '1 pessoa visualizou seu perfil'
                                : `${profileViewCount} pessoas visualizaram seu perfil`}
                          </Text>
                        </Link>
                      </Group>
                    </SectionPanel>
                  )}

                  <SectionPanel id="about">
                    {profile.bio && (
                      <>
                        <Group justify="space-between" mb={12}>
                          <SectionTitle text="Sobre" />
                          {isOwnProfile && (
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              radius="xl"
                              size="sm"
                              p={0}
                              aria-label="Editar meus dados"
                              title="Editar meus dados"
                              component={Link}
                              to="/settings/profile"
                            >
                              <IconPencil style={{ width: '94%', height: '94%' }} />
                            </ActionIcon>
                          )}
                        </Group>

                        {profile.is_fake_profile && (
                          <Group gap={4} mb={10} wrap="nowrap">
                            <IconSparkles size={20} />
                            <Text size="xs" lh={1} opacity={0.8}>
                              Este perfil foi criado por IA para fins de teste e não
                              representa uma pessoa real
                            </Text>
                          </Group>
                        )}
                        {profile.bio?.length > 150 && !expandedBio ? (
                          <>
                            <Text fz="sm" lh={1.4} style={{ whiteSpace: 'pre-line' }}>
                              {truncateString(profile.bio, 150)}
                            </Text>
                            <Anchor onClick={() => setExpandedBio(true)}>
                              <Text mt={4} size="sm" c="var(--mantine-color-text)">
                                Ver mais
                              </Text>
                            </Anchor>
                          </>
                        ) : (
                          <Text fz="sm" lh={1.4} style={{ whiteSpace: 'pre-line' }}>
                            {profile.bio}
                          </Text>
                        )}
                      </>
                    )}

                    <Group gap={4} align="center" mt={profile.bio ? 'md' : 0} mb={2}>
                      <Title order={3} fz="sm" fw={300} opacity={0.8}>
                        Principais atividades
                      </Title>
                      {isOwnProfile && (
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          radius="xl"
                          size="xs"
                          p={0}
                          aria-label="Editar minhas atividades"
                          title="Editar minhas atividades"
                          component={Link}
                          to="/settings/musical-preferences"
                        >
                          <IconPencil style={{ width: '92%', height: '92%' }} />
                        </ActionIcon>
                      )}
                    </Group>
                    {rolesOrdered && rolesOrdered.length > 0 && (
                      <Text size="sm" fw={500}>
                        {rolesOrdered
                          .map((role) => role?.roles?.description_ptbr)
                          .filter(Boolean)
                          .join(', ')}
                      </Text>
                    )}

                    {genres && genres.length > 0 && (
                      <>
                        <Group gap={4} align="center" mt="xs" mb={2}>
                          <Title order={3} fz="sm" fw={300} opacity={0.8}>
                            Gêneros musicais de atuação
                          </Title>
                          {isOwnProfile && (
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              radius="xl"
                              size="xs"
                              p={0}
                              aria-label="Editar meus gêneros musicais"
                              title="Editar meus gêneros musicais"
                              component={Link}
                              to="/settings/musical-preferences"
                            >
                              <IconPencil style={{ width: '92%', height: '92%' }} />
                            </ActionIcon>
                          )}
                        </Group>
                        {genres && genres.length > 0 ? (
                          <Text size="sm" fw={500}>
                            {genres
                              .map(({ genres: genre }) => genre?.name)
                              .filter(Boolean)
                              .join(', ')}
                          </Text>
                        ) : (
                          <Text size="sm" c="dimmed">
                            Não informado
                          </Text>
                        )}
                      </>
                    )}

                    {!loadingUpcomingEvents && upcomingEvents.length > 0 && (
                      <>
                        <Group justify="space-between" align="center" mt="md" mb="xs">
                          <Title order={3} fz="sm" fw={300} opacity={0.8}>
                            Demonstrou interesse nos eventos
                          </Title>
                          <Group gap={4}>
                            <ThemeIcon
                              variant="default"
                              size="sm"
                              style={{
                                cursor: upcomingEventsScroller.canScrollStart
                                  ? 'pointer'
                                  : 'default',
                              }}
                              onClick={upcomingEventsScroller.scrollStart}
                              opacity={upcomingEventsScroller.canScrollStart ? 1 : 0.5}
                            >
                              <IconChevronLeft style={{ width: '70%', height: '70%' }} />
                            </ThemeIcon>
                            <ThemeIcon
                              variant="default"
                              size="sm"
                              style={{
                                cursor: upcomingEventsScroller.canScrollEnd
                                  ? 'pointer'
                                  : 'default',
                              }}
                              onClick={upcomingEventsScroller.scrollEnd}
                              opacity={upcomingEventsScroller.canScrollEnd ? 1 : 0.5}
                            >
                              <IconChevronRight style={{ width: '70%', height: '70%' }} />
                            </ThemeIcon>
                          </Group>
                        </Group>
                        <div
                          ref={upcomingEventsScroller.ref}
                          {...upcomingEventsScroller.dragHandlers}
                          className="scrollerHidden"
                          style={{
                            overflow: 'auto',
                            cursor: upcomingEventsScroller.isDragging
                              ? 'grabbing'
                              : 'default',
                          }}
                        >
                          <Group gap="xs" wrap="nowrap" align="flex-start">
                            {upcomingEvents.map((event) => {
                              const cityName = event.venue?.city?.name

                              return (
                                <Flex
                                  key={event.id}
                                  direction="column"
                                  align="center"
                                  justify="flex-start"
                                  gap={4}
                                  w={92}
                                  component={Link}
                                  to={`/event/${event.slug}`}
                                  style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                  <Indicator
                                    disabled={!event.is_confirmed}
                                    color="green"
                                    size={14}
                                    position="bottom-end"
                                    withBorder
                                    label={<IconCheck size={9} />}
                                  >
                                    <Avatar
                                      size={70}
                                      radius="md"
                                      src={
                                        event.picture_url
                                          ? EVENTS_PATH + event.picture_url
                                          : undefined
                                      }
                                      alt={event.name}
                                    />
                                  </Indicator>
                                  <Text
                                    size="xs"
                                    fw={500}
                                    ta="center"
                                    lineClamp={2}
                                    lh={1.2}
                                    w={92}
                                    title={event.name}
                                  >
                                    {event.name}
                                  </Text>
                                  <Text
                                    size="10px"
                                    c="dimmed"
                                    ta="center"
                                    lineClamp={1}
                                    w={92}
                                  >
                                    {dayjs(event.date_start).format('DD MMM')}
                                    {cityName ? ` · ${cityName}` : ''}
                                  </Text>
                                </Flex>
                              )
                            })}
                          </Group>
                        </div>
                      </>
                    )}
                  </SectionPanel>

                  <SectionPanel id="portfolio">
                    <Group justify="space-between">
                      <SectionTitle text="Portfólio" />
                      {isOwnProfile && (
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          radius="xl"
                          size="sm"
                          p={0}
                          aria-label="Editar meu portfólio"
                          title="Editar meu portfólio"
                          component={Link}
                          to="/settings/portfolio"
                        >
                          <IconPencil style={{ width: '94%', height: '94%' }} />
                        </ActionIcon>
                      )}
                    </Group>
                    {loadingPortfolio ? (
                      <Text mt="md">Carregando...</Text>
                    ) : portfolio.length > 0 ? (
                      <Stack mt="md" gap="lg">
                        {portfolio.map((item) => {
                          const isArtist = !!item.artist?.name
                          const isProject = !!item.project?.name
                          const entity = isArtist ? item.artist : item.project
                          const url = isArtist
                            ? `/artist/${item.artist?.slug}`
                            : `/project/${item.project?.slug}`

                          if (!entity) {
                            return null
                          }

                          const roleNames =
                            item.roles?.map((r) => r.role?.name_ptbr).filter(Boolean) ??
                            []

                          const genre = item.project?.genre?.name_ptbr

                          const engagementNames =
                            item.engagement_types
                              ?.map((e) => e.engagement_type?.name_ptbr)
                              .filter(Boolean) ?? []

                          const period = formatPortfolioPeriod(
                            item.year_start,
                            item.year_end,
                          )

                          const upvoteInfo = upvotesByPortfolioId[item.id]
                          const upvoteCount = upvoteInfo?.upvote_count ?? 0
                          const hasUpvoted = upvoteInfo?.has_upvoted ?? false
                          const isOwnPortfolio = user?.id === profile.id

                          return (
                            <Box key={item.id}>
                              <Group gap="xs" align="flex-start" wrap="nowrap">
                                <Flex direction="column">
                                  <Link to={url}>
                                    <Avatar
                                      radius="md"
                                      size={60}
                                      src={
                                        isArtist
                                          ? ARTISTS_PATH + entity.picture
                                          : `https://ik.imagekit.io/mublin/projects/${entity.id}/tr:h-120,w-120,c-maintain_ratio/${entity.picture}`
                                      }
                                    />
                                  </Link>
                                  <PortfolioUpvote
                                    count={upvoteCount}
                                    hasUpvoted={hasUpvoted}
                                    isOwnPortfolio={isOwnPortfolio}
                                    disabled={isOwnPortfolio || !user?.id}
                                    onToggle={() =>
                                      handleToggleUpvote({
                                        portfolioId: item.id,
                                        currentlyUpvoted: hasUpvoted,
                                      })
                                    }
                                  />
                                </Flex>
                                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                  {roleNames.length > 0 && (
                                    <Text size="15px" fw={600}>
                                      {roleNames.join(', ')}
                                    </Text>
                                  )}
                                  <Group gap={6} align="center" wrap="wrap">
                                    <Text size="sm" opacity={0.9}>
                                      <Text
                                        span
                                        component={Link}
                                        to={url}
                                        style={{
                                          display: 'inline',
                                          hover: { textDecoration: 'underline' },
                                          color: 'inherit',
                                        }}
                                      >
                                        {entity.name}
                                      </Text>{' '}
                                      <Text span>
                                        (
                                        {isProject
                                          ? item.project?.type?.name_ptbr
                                          : item.artist?.genre?.name_ptbr}
                                        {genre && ` · ${genre}`})
                                      </Text>
                                    </Text>
                                  </Group>

                                  {engagementNames.length > 0 && (
                                    <Text size="xs" opacity={0.9} mt={6} mb={4} lh={1}>
                                      {engagementNames.length === 1
                                        ? 'Vínculo:'
                                        : 'Vínculos:'}{' '}
                                      {engagementNames.join(', ')}
                                    </Text>
                                  )}

                                  {item.is_sporadic ? (
                                    <Text size="xs" opacity={0.7}>
                                      Colaboração esporádica
                                    </Text>
                                  ) : (
                                    period && (
                                      <Text size="xs" opacity={0.7}>
                                        {period}
                                      </Text>
                                    )
                                  )}

                                  {item.is_mublin_facilitated && (
                                    <Flex gap={4} align="center" mt={4} mb={4}>
                                      <Image
                                        src={MublinMLogo}
                                        h={14}
                                        w="auto"
                                        fit="contain"
                                        mb={2}
                                      />
                                      <Text size="xs" lh={1}>
                                        Mublin ajudou a conseguir esta gig
                                      </Text>
                                    </Flex>
                                  )}

                                  {item.notes && (
                                    <Spoiler
                                      maxHeight={42}
                                      showLabel={
                                        <Text size="sm" c="var(--mantine-color-text)">
                                          Ver mais
                                        </Text>
                                      }
                                      hideLabel={
                                        <Text size="sm" c="var(--mantine-color-text)">
                                          Ver menos
                                        </Text>
                                      }
                                    >
                                      <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                                        {item.notes}
                                      </Text>
                                    </Spoiler>
                                  )}
                                </Stack>
                              </Group>
                            </Box>
                          )
                        })}
                      </Stack>
                    ) : (
                      <Text size="sm" c="dimmed" mt="sm">
                        Nenhum item informado até o momento
                      </Text>
                    )}
                  </SectionPanel>

                  <SectionPanel id="education">
                    <Group justify="space-between">
                      <SectionTitle text="Formação" />
                      {isOwnProfile && (
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          radius="xl"
                          size="sm"
                          p={0}
                          aria-label="Editar minha formação"
                          title="Editar minha formação"
                          component={Link}
                          to="/settings/education"
                        >
                          <IconPencil style={{ width: '94%', height: '94%' }} />
                        </ActionIcon>
                      )}
                    </Group>

                    {loadingEducation ? (
                      <Text mt="md">Carregando...</Text>
                    ) : education.length > 0 ? (
                      <Stack mt="md" gap="lg">
                        {education.map((item) => {
                          const period = formatPortfolioPeriod(
                            item.start_year,
                            item.is_current ? null : item.end_year,
                          )
                          return (
                            <Group
                              key={item.id}
                              gap="xs"
                              align="flex-start"
                              wrap="nowrap"
                            >
                              <Avatar
                                radius="md"
                                size={60}
                                src={item.institutions?.logo || undefined}
                              >
                                <IconSchool size={24} />
                              </Avatar>
                              <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                <Text size="15px" fw={600}>
                                  {item.institution_name}
                                </Text>
                                {(item.course_name || item.field_of_study) && (
                                  <Text size="sm" opacity={0.9}>
                                    {[item.course_name, item.field_of_study]
                                      .filter(Boolean)
                                      .join(' — ')}
                                  </Text>
                                )}
                                {(item.education_levels?.name_ptbr || period) && (
                                  <Text size="xs" opacity={0.7}>
                                    {[
                                      item.education_levels?.name_ptbr,
                                      item.is_current
                                        ? `${item.start_year ?? ''} – atual`
                                        : period,
                                    ]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </Text>
                                )}
                                {item.description && (
                                  <Spoiler
                                    maxHeight={42}
                                    showLabel={<Text size="sm">Ver mais</Text>}
                                    hideLabel={<Text size="sm">Ver menos</Text>}
                                  >
                                    <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                                      {item.description}
                                    </Text>
                                  </Spoiler>
                                )}
                              </Stack>
                            </Group>
                          )
                        })}
                      </Stack>
                    ) : (
                      <Text size="sm" c="dimmed" mt="sm">
                        Nenhuma formação informada até o momento
                      </Text>
                    )}

                    {loadingTeachers
                      ? null
                      : teachers.length > 0 && (
                          <>
                            <Divider my="md" />
                            <Text fw={600} size="sm" mb="xs">
                              Professores
                            </Text>
                            <Stack gap="sm">
                              {teachers.map((item) => (
                                <Group key={item.id} gap="sm" wrap="nowrap">
                                  <Link to={`/${item.teacher?.username}`}>
                                    <Avatar
                                      radius="xl"
                                      size={40}
                                      src={
                                        item.teacher?.avatar
                                          ? AVATAR_PATH + item.teacher.avatar
                                          : undefined
                                      }
                                    >
                                      <IconUserCircle size={20} />
                                    </Avatar>
                                  </Link>
                                  <Stack gap={0} style={{ minWidth: 0 }}>
                                    <Text
                                      size="sm"
                                      fw={600}
                                      component={Link}
                                      to={`/${item.teacher?.username}`}
                                      style={{ color: 'inherit' }}
                                    >
                                      {item.teacher?.full_name}
                                    </Text>
                                    {item.notes && (
                                      <Text size="xs" opacity={0.7}>
                                        {item.notes}
                                      </Text>
                                    )}
                                  </Stack>
                                </Group>
                              ))}
                            </Stack>
                          </>
                        )}
                  </SectionPanel>

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
                        <SectionPanel mt="sm">
                          <Group justify="space-between" align="center" mb="sm">
                            <Group gap={10}>
                              <SectionTitle text="Postagens" id="posts" />
                              {isOwnProfile && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="var(--mantine-color-text)"
                                  component={Link}
                                  to="/new/post"
                                  leftSection={<IconPlus size={14} />}
                                >
                                  Novo post
                                </Button>
                              )}
                            </Group>
                            <Group>
                              <ThemeIcon
                                variant="default"
                                style={{
                                  cursor: postsScroller.canScrollStart
                                    ? 'pointer'
                                    : 'default',
                                }}
                                onClick={postsScroller.scrollStart}
                                opacity={postsScroller.canScrollStart ? 1 : 0.5}
                              >
                                <IconChevronLeft
                                  style={{ width: '70%', height: '70%' }}
                                />
                              </ThemeIcon>
                              <ThemeIcon
                                variant="default"
                                style={{
                                  cursor: postsScroller.canScrollEnd
                                    ? 'pointer'
                                    : 'default',
                                }}
                                onClick={postsScroller.scrollEnd}
                                opacity={postsScroller.canScrollEnd ? 1 : 0.5}
                              >
                                <IconChevronRight
                                  style={{ width: '70%', height: '70%' }}
                                />
                              </ThemeIcon>
                            </Group>
                          </Group>
                          <div
                            ref={postsScroller.ref}
                            {...postsScroller.dragHandlers}
                            className="scrollerHidden"
                            style={{
                              overflow: 'auto',
                              cursor: postsScroller.isDragging ? 'grabbing' : 'default',
                            }}
                          >
                            <Group gap="xs" wrap="nowrap">
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
                                    <Box key={post.id} h={200} miw={280}>
                                      <Text size="xs" c="dimmed" mt={4}>
                                        {dayjs(post.created_at).fromNow()}
                                      </Text>
                                      <Link
                                        to={`/post/${post.id}`}
                                        style={{
                                          whiteSpace: 'pre-wrap',
                                          display: 'block',
                                        }}
                                        className="noDecoration"
                                      >
                                        <Text
                                          size="sm"
                                          maw={240}
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
                                            src={`https://ik.imagekit.io/mublin/posts/tr:h-134/${post.image}`}
                                            radius={false}
                                            h={134}
                                            w="auto"
                                            fit="contain"
                                          />
                                        </Link>
                                      )}
                                      {post.video_url && (
                                        <Link to={`/post/${post.id}`}>
                                          <VideoPlayerYoutube
                                            url={post.video_url}
                                            thumbnailOnly
                                            height={134}
                                          />
                                        </Link>
                                      )}
                                      {(post.linked_gig_id || post.linked_product_id) && (
                                        <LinkedItem
                                          post={{
                                            ...post,
                                            linked_product_slug: post.products?.slug,
                                            linked_product_name: post.products?.name,
                                            linked_product_picture:
                                              post.products?.picture,
                                            linked_product_brand_name:
                                              post.products?.brands?.name,
                                            linked_gig_slug: post.gigs?.slug,
                                            linked_gig_title: post.gigs?.title,
                                            linked_gig_has_remuneration:
                                              post.gigs?.has_remuneration,
                                          }}
                                        />
                                      )}
                                    </Box>
                                  ))}
                            </Group>
                          </div>
                        </SectionPanel>
                      ) : (
                        <SectionPanel>
                          <SectionTitle text="Postagens" id="posts" mb="sm" />
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
                          <Group justify="space-between" align="center" gap="xs" mt={10}>
                            <Group gap={10}>
                              <SectionTitle
                                id="gear"
                                text="Equipamento"
                                ml={{ base: 'sm', md: 0 }}
                              />
                              <Button
                                size="xs"
                                variant="light"
                                color="var(--mantine-color-text)"
                                rightSection={
                                  <Badge
                                    circle
                                    size="sm"
                                    color="mublinColor"
                                    variant="filled"
                                  >
                                    {gear.length}
                                  </Badge>
                                }
                                component={Link}
                                to={`/${username}/gear`}
                              >
                                Ver tudo
                              </Button>
                              {isOwnProfile && (
                                <ActionIcon
                                  variant="light"
                                  color="gray"
                                  radius="xl"
                                  size="md"
                                  aria-label="Gerenciar meu equipamento"
                                  title="Gerenciar meu equipamento"
                                  component={Link}
                                  to="/settings/gear"
                                  mr="sm"
                                >
                                  <IconSettings size={18} />
                                </ActionIcon>
                              )}
                            </Group>

                            <Group>
                              <ThemeIcon
                                variant="default"
                                style={{
                                  cursor: gearScroller.canScrollStart
                                    ? 'pointer'
                                    : 'default',
                                }}
                                onClick={gearScroller.scrollStart}
                                opacity={gearScroller.canScrollStart ? 1 : 0.5}
                              >
                                <IconChevronLeft
                                  style={{ width: '70%', height: '70%' }}
                                />
                              </ThemeIcon>
                              <ThemeIcon
                                variant="default"
                                style={{
                                  cursor: gearScroller.canScrollEnd
                                    ? 'pointer'
                                    : 'default',
                                }}
                                onClick={gearScroller.scrollEnd}
                                opacity={gearScroller.canScrollEnd ? 1 : 0.5}
                              >
                                <IconChevronRight
                                  style={{ width: '70%', height: '70%' }}
                                />
                              </ThemeIcon>
                            </Group>
                          </Group>
                          <Box h="100%">
                            <div
                              ref={gearScroller.ref}
                              {...gearScroller.dragHandlers}
                              className="scrollerHidden"
                              style={{
                                overflow: 'auto',
                                cursor: gearScroller.isDragging ? 'grabbing' : 'default',
                              }}
                            >
                              <Group gap="xs" wrap="nowrap">
                                {/* {isMobile && (
                                  <Box style={{ flexShrink: 10, width: '5px' }} />
                                )} */}
                                {gear.map((item) => (
                                  <Flex
                                    key={item.id_product}
                                    direction="column"
                                    justify="flex-start"
                                    align="center"
                                    w={140}
                                  >
                                    <Link to={`/${username}/gear/${item.id}`}>
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
                                    <Text size="xs" c="dimmed" fw={500} lineClamp={1}>
                                      {item.products?.brands?.name}
                                    </Text>
                                    <Text
                                      size="xs"
                                      fw={500}
                                      ta="center"
                                      lineClamp={1}
                                      style={{ whiteSpace: 'pre-wrap' }}
                                    >
                                      {item.products?.name}
                                    </Text>
                                  </Flex>
                                ))}
                              </Group>
                            </div>
                            <Box ml={{ base: 'sm', md: 0 }} mt="lg">
                              <Text fw={600} size="sm">
                                Setups de {profile.full_name}{' '}
                                {!!gearSetups.length && `(${gearSetups.length})`}
                              </Text>
                              {gearSetups.length > 0 && (
                                <Flex gap={12} mt={18}>
                                  {gearSetups.map((setup) => (
                                    <Box key={setup.id}>
                                      <Flex w={80} direction="column" justify="center">
                                        {/* <Link to={`/setup/${setup.id}`}> */}
                                        <Link to={`/${username}/gear`}>
                                          <Image
                                            src={`https://ik.imagekit.io/mublin/users/gear-setups/tr:w-140,h-140/${setup.image}`}
                                            h={70}
                                            w={70}
                                            fit="contain"
                                            radius="md"
                                            mb={4}
                                          />
                                        </Link>
                                        <Text
                                          ta="center"
                                          fw={550}
                                          size="xs"
                                          truncate="end"
                                        >
                                          {setup.name}
                                        </Text>
                                        <Text ta="center" size="xs">
                                          {setup.total_items ?? 0} itens
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
            </Grid>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Stack gap={10}>
              {profile?.show_availability_info && (
                <SectionPanel id="availability">
                  <SectionTitle text="Disponibilidade" mb="sm" />
                  <Divider mt="sm" label="Disponível a partir de:" labelPosition="left" />
                  {profile.available_from ? (
                    <Text size="15px">
                      {AVAILABLE_FROM_LABELS[profile.available_from] ||
                        profile.available_from}
                    </Text>
                  ) : (
                    <Text size="15px" c="dimmed">
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
                        <Stack gap={1} key={item.id}>
                          <WorkAvailabilityItem item={item} />
                        </Stack>
                      ))}
                    </Flex>
                  ) : (
                    <Text size="15px" c="dimmed">
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
                        <Text span size="15px" lh={1.2} fw={500} key={item.id}>
                          <IconCheck size={9} stroke={4} />{' '}
                          {item.work_focuses?.title_ptbr}
                        </Text>
                      ))}
                    </Group>
                  ) : (
                    <Text size="15px" c="dimmed">
                      Não informado
                    </Text>
                  )}
                  <Divider
                    mt="sm"
                    label="Preferência para viagens:"
                    labelPosition="left"
                  />
                  {loadingTravelPreference ? (
                    <Text size="15px" c="dimmed">
                      Carregando...
                    </Text>
                  ) : (
                    <>
                      {travelPreference?.id ? (
                        <Text span size="15px" lh={1.2} fw={500}>
                          {travelPreference?.travel_preferences?.label}
                        </Text>
                      ) : (
                        <Text size="15px" c="dimmed">
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
                    {isMublinOG(profile.created_at) && (
                      <RecognitionBadge
                        label="Mublin OG"
                        description="Perfil entre os primeiros usuários da plataforma"
                        color="dark"
                      />
                    )}
                    {instrumentRolesCount >= 3 && (
                      <RecognitionBadge
                        icon={IconBrain}
                        label="Multi-instrumentista"
                        description="Toca 3 ou mais instrumentos"
                        color="coral"
                      />
                    )}
                    {isLegend && (
                      <RecognitionBadge
                        icon={IconShieldCheckFilled}
                        label="Lenda da música"
                        description="Carreira amplamente reconhecida"
                        color="purple"
                      />
                    )}
                    {isGrammyNominee && (
                      <RecognitionBadge
                        icon={IconTrophy}
                        label="Grammy Nominee"
                        description="Indicação ou vitória comprovada no Grammy"
                        color="amber"
                      />
                    )}
                    {/* <RecognitionBadge
                      icon={IconPlane}
                      label="Internacional "
                      description="Atuação em mais de um país"
                      color="green"
                    /> */}
                    {gear.length > 10 && (
                      <RecognitionBadge
                        icon={IconGuitarPick}
                        label="Bem equipado"
                        description="10 ou mais itens no gear"
                        color="coral"
                      />
                    )}
                  </Group>
                </Scroller>
              </SectionPanel>

              <SectionPanel id="inspirations">
                <Group
                  justify="space-between"
                  align="center"
                  mb={inspirations.length > 0 ? 4 : 'sm'}
                >
                  <SectionTitle text="Inspirações" />

                  <Group>
                    <ThemeIcon
                      variant="default"
                      style={{
                        cursor: inspirationsScroller.canScrollStart
                          ? 'pointer'
                          : 'default',
                      }}
                      onClick={inspirationsScroller.scrollStart}
                      opacity={inspirationsScroller.canScrollStart ? 1 : 0.5}
                    >
                      <IconChevronLeft style={{ width: '70%', height: '70%' }} />
                    </ThemeIcon>
                    <ThemeIcon
                      variant="default"
                      style={{
                        cursor: inspirationsScroller.canScrollEnd ? 'pointer' : 'default',
                      }}
                      onClick={inspirationsScroller.scrollEnd}
                      opacity={inspirationsScroller.canScrollEnd ? 1 : 0.5}
                    >
                      <IconChevronRight style={{ width: '70%', height: '70%' }} />
                    </ThemeIcon>
                  </Group>
                </Group>
                {inspirations.length > 0 && (
                  <Text size="xs" c="dimmed" mb="sm">
                    Figuras consagradas que inspiram {profile?.full_name}
                  </Text>
                )}
                {loadingInspirations ? (
                  <Text size="sm">Carregando...</Text>
                ) : inspirations.length > 0 ? (
                  <div
                    ref={inspirationsScroller.ref}
                    {...inspirationsScroller.dragHandlers}
                    className="scrollerHidden"
                    style={{
                      overflow: 'auto',
                      cursor: inspirationsScroller.isDragging ? 'grabbing' : 'default',
                    }}
                  >
                    <Group gap="xs" wrap="nowrap" align="flex-start">
                      {inspirations.map(({ id, artists: artist }) => (
                        <Flex
                          key={id}
                          direction="column"
                          align="center"
                          justify="flex-start"
                          gap={4}
                          w={64}
                          component={Link}
                          to={`/artist/${artist?.slug}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Avatar
                            size={60}
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
                          {artist?.artist_roles[0]?.roles?.description_ptbr && (
                            <Text
                              size="10px"
                              c="dimmed"
                              ta="center"
                              lineClamp={1}
                              title={artist?.artist_roles[0]?.roles?.description_ptbr}
                            >
                              {artist?.artist_roles[0]?.roles?.description_ptbr}
                            </Text>
                          )}
                        </Flex>
                      ))}
                    </Group>
                  </div>
                ) : (
                  <Text size="sm" c="dimmed">
                    Não informado
                  </Text>
                )}
              </SectionPanel>

              <SectionPanel id="partners">
                <Group justify="space-between" align="center" mb="sm">
                  <SectionTitle text="Parceiros" />
                  {partners.length > 4 && (
                    <Group>
                      <ThemeIcon
                        variant="default"
                        style={{
                          cursor: partnersScroller.canScrollStart ? 'pointer' : 'default',
                        }}
                        onClick={partnersScroller.scrollStart}
                        opacity={partnersScroller.canScrollStart ? 1 : 0.5}
                      >
                        <IconChevronLeft style={{ width: '70%', height: '70%' }} />
                      </ThemeIcon>
                      <ThemeIcon
                        variant="default"
                        style={{
                          cursor: partnersScroller.canScrollEnd ? 'pointer' : 'default',
                        }}
                        onClick={partnersScroller.scrollEnd}
                        opacity={partnersScroller.canScrollEnd ? 1 : 0.5}
                      >
                        <IconChevronRight style={{ width: '70%', height: '70%' }} />
                      </ThemeIcon>
                    </Group>
                  )}
                </Group>
                {loadingPartners ? (
                  <Text size="sm">Carregando...</Text>
                ) : partners.length > 0 ? (
                  <div
                    ref={partnersScroller.ref}
                    {...partnersScroller.dragHandlers}
                    className="scrollerHidden"
                    style={{
                      overflow: 'auto',
                      cursor: partnersScroller.isDragging ? 'grabbing' : 'default',
                    }}
                  >
                    <Group gap="xs" wrap="nowrap">
                      {partners.map(({ id, company, type }) => (
                        <Flex
                          key={id}
                          direction="column"
                          align="center"
                          gap={4}
                          w={64}
                          component={Link}
                          to={`/brand/${company?.slug}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Avatar
                            size={56}
                            radius="xl"
                            src={company?.logo ? COMPANY_PATH + company.logo : undefined}
                            alt={`Foto de ${company?.name}`}
                          />
                          <Text
                            size="xs"
                            fw={500}
                            ta="center"
                            lineClamp={2}
                            lh={1.2}
                            w={64}
                            title={company?.name}
                          >
                            {company?.name}
                          </Text>
                          <Text size="10px" c="dimmed" ta="center" lineClamp={1}>
                            {type}
                          </Text>
                        </Flex>
                      ))}
                    </Group>
                  </div>
                ) : (
                  <Text size="sm" c="dimmed">
                    Não informado
                  </Text>
                )}
              </SectionPanel>

              <SectionPanel id="social">
                <SectionTitle text="Redes sociais" mb="sm" />
                {profile.profile_social_links.length > 0 ? (
                  <Group gap={10} wrap="wrap">
                    {profile.profile_social_links.map((link) => {
                      const config = SOCIAL_CONFIG[link.platform]
                      if (!config) {
                        return null
                      }
                      const Icon = config.icon
                      const href = `${config.base}${link.handle}`
                      return (
                        <Group
                          key={link.platform}
                          gap="xs"
                          component="a"
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Icon
                            color="var(--mantine-color-text)"
                            stroke={1.5}
                            size={25}
                          />
                          <Stack gap={2} w={180}>
                            <Text size="sm" fw={600} truncate="end">
                              {link.platform}
                            </Text>
                            <Text size="xs" truncate="end" c="dimmed">
                              {href.replace(/^https?:\/\//, '')}
                            </Text>
                          </Stack>
                        </Group>
                      )
                    })}
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">
                    Nenhuma rede informada
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
                <Tooltip
                  multiline
                  w={220}
                  withArrow
                  transitionProps={{ duration: 200 }}
                  label="Usuários com conta premium têm acesso a recursos exclusivos como adicionar equipamentos e subir vídeos"
                >
                  <SectionPanel>
                    <Flex gap={6} align="center">
                      <ProPlanBadge small />
                      <Text size="xs" c="dimmed" lh={1} mt={3}>
                        {profile?.full_name} possui uma conta Premium
                      </Text>
                    </Flex>
                  </SectionPanel>
                </Tooltip>
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

      <Modal
        opened={linksOpened}
        onClose={closeLinksModal}
        title="Links"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Stack mt="md" gap="xs">
          {profileLinks.map((link) => (
            <Anchor
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              underline="never"
              c="inherit"
            >
              <Group gap="xs" wrap="nowrap" justify="space-between" py={6}>
                <Group gap="xs" wrap="nowrap">
                  <IconWorld size={16} opacity={0.6} style={{ flexShrink: 0 }} />
                  <Text size="sm">{link.label}</Text>
                </Group>
                <IconExternalLink size={16} opacity={0.5} style={{ flexShrink: 0 }} />
              </Group>
            </Anchor>
          ))}
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

      <Drawer opened={actionsOpened} onClose={closeActions} position="bottom" size="xs">
        <Stack gap="md" mt="sm">
          {followingInfo?.id ? (
            <Button
              variant="transparent"
              onClick={() => unfollowProfile(user.id, profile.id)}
              disabled={loadingFollowingInfo}
              leftSection={<IconUserX size={16} />}
            >
              Deixar de seguir
            </Button>
          ) : (
            <Button
              variant="transparent"
              onClick={() => followProfile(user.id, profile.id)}
              disabled={loadingFollowingInfo}
              leftSection={<IconUserPlus size={16} />}
            >
              Seguir
            </Button>
          )}
          <Button
            variant="transparent"
            leftSection={
              favoriteInfo?.id ? (
                <IconBookmarkFilled size={16} />
              ) : (
                <IconBookmark size={16} />
              )
            }
            onClick={() => handleToggleFavorite(!!favoriteInfo?.id)}
            disabled={loadingFavoriteInfo || togglingFavorite}
          >
            {favoriteInfo?.id ? 'Salvo' : 'Salvar nos favoritos'}
          </Button>
          <Button
            variant="transparent"
            leftSection={<IconLink size={16} />}
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/${profile?.username}`,
              )
              notifications.show({
                title: 'Pronto!',
                message: 'URL copiada!',
                color: 'green',
                position: 'top-center',
              })
            }}
          >
            Copiar URL deste perfil
          </Button>
        </Stack>
      </Drawer>
    </>
  )
}
