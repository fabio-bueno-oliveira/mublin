import { useEffect } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import PageMeta from '../components/PageMeta'
import {
  fetchProjectDetails,
  fetchprojectsInspirated,
  fetchProjectPeople,
  fetchProjectGenres,
  fetchRelatedProjects,
  fetchProjectPictureRecent,
  fetchMyProjectAdminRequest,
  fetchProjectTourStatus,
} from '../queries/projects'
import { fetchOpenProjectOpenings } from '../queries/projectOpenings'
// prettier-ignore
import {
  Container, Grid,
  Flex, Group,
  Box, Stack, Spoiler,
  Skeleton, em,
  Modal, Affix,
  Button, UnstyledButton, Badge,
  Avatar, Image,
  Anchor, Title, Text,
  Card, Paper,
  Scroller, Tooltip, Popover,
  Tabs, Divider, ThemeIcon,
  Center,
  ActionIcon,
} from '@mantine/core'
import { useMediaQuery, useDisclosure } from '@mantine/hooks'
import {
  IconBrandInstagram,
  IconBrandSpotify,
  IconBrandSoundcloud,
  IconRoad,
  IconRosetteDiscountCheck,
  IconMapPin,
  IconArrowRight,
  IconBriefcase2,
  IconChevronRight,
  IconWorld,
  IconMusicPlus,
  IconBrandApple,
  IconBrandYoutube,
} from '@tabler/icons-react'
import AppNavbarMobile from '../components/AppNavbarMobile'
// import SimilarProjects from '../components/explore/SimilarProjects'
import ProjectProfileBadge from '../components/ProjectProfileBadge'
import {
  SectionGigs,
  SectionPeople,
  BackstageAccess,
  SectionPictures,
} from '../components/project'
import { MEMBER_REQUEST_STATUS } from '../constants/projects'
import { IconBrandMuso } from '../components/icons/IconBrandMuso'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
// import SocialLinks from '../components/profile/SocialLinks'
dayjs.locale('pt-br')

const ADMIN_REQUEST_STATUS = {
  PENDING: 1,
  ACCEPTED: 2,
  DECLINED: 3,
}

const getRelatedAvatarUrl = (related) =>
  related?.picture
    ? `https://ik.imagekit.io/mublin/projects/${related.id}/tr:h-200,w-200,c-maintain_ratio/${related.picture}`
    : null

export default function Project() {
  const { user, profile } = useAuth()
  const { slug } = useParams()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  const [searchParams, setSearchParams] = useSearchParams()
  const validTabs = ['overview', 'about', 'people', 'gigs', 'pictures', 'music']
  const section = searchParams.get('section')
  const activeTab = validTabs.includes(section) ? section : 'overview'

  const setActiveTab = (tab) => {
    console.log(tab)
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)

      if (!tab || tab === 'overview') {
        params.delete('section')
      } else {
        params.set('section', tab)
      }

      return params
    })
  }

  const [opened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [profileDetailOpened, { open: openProfileDetail, close: closeProfileDetail }] =
    useDisclosure(false)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  /*
   * ─────────────────────────────────────────────
   * PROJECT
   * ─────────────────────────────────────────────
   */

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => fetchProjectDetails(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const userMembership = project?.members?.find((m) => m.profile_id === user?.id)

  const userIsAdmin =
    userMembership?.is_admin === true &&
    userMembership?.status === MEMBER_REQUEST_STATUS.ACCEPTED

  const userIsStaff =
    userMembership?.is_admin === false &&
    userMembership?.status === MEMBER_REQUEST_STATUS.ACCEPTED

  /*
   * ─────────────────────────────────────────────
   * PROJECT SOCIAL DATA
   * ─────────────────────────────────────────────
   */

  const { data: inspirated = [] } = useQuery({
    queryKey: ['project-inspirated', project?.id],
    queryFn: () => fetchprojectsInspirated(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: projectGenres = [], isLoading: loadingProjectGenres } = useQuery({
    queryKey: ['project-genres', project?.id],
    queryFn: () => fetchProjectGenres(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: tourStatus } = useQuery({
    queryKey: ['project-tour-status', project?.id],
    queryFn: () => fetchProjectTourStatus(project.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 2,
  })

  const { data: relatedProjects = [], isLoading: loadingRelatedProjects } = useQuery({
    queryKey: ['project-related', project?.id],
    queryFn: () => fetchRelatedProjects(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: projectPeople = [], isLoading: loadingProjectPeople } = useQuery({
    queryKey: ['project-people', project?.id],
    queryFn: () => fetchProjectPeople(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: recentPicture = null, isLoading: isLoadingRecentPicture } = useQuery({
    queryKey: ['project-recent-picture', project?.id],
    queryFn: () => fetchProjectPictureRecent(project.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: recentProjectPeople = [], isLoading: loadingRecentProjectPeople } =
    useQuery({
      queryKey: ['project-people-recent', project?.id],
      queryFn: () =>
        fetchProjectPeople(project?.id, {
          limit: 1,
          orderBy: 'created_at',
          ascending: false,
        }),
      enabled: !!project?.id,
      staleTime: 1000 * 60 * 5,
    })

  /*
   * ─────────────────────────────────────────────
   * ADMIN CLAIM
   * ─────────────────────────────────────────────
   */

  const { data: myAdminRequest } = useQuery({
    queryKey: ['project-admin-request', project?.id, user?.id],
    queryFn: () => fetchMyProjectAdminRequest(project?.id, user?.id),
    enabled: !!project?.id && !!user?.id,
    staleTime: 1000 * 30,
  })

  /*
   * ─────────────────────────────────────────────
   * OPENINGS
   * ─────────────────────────────────────────────
   */

  const { data: openProjectOpenings = [], isLoading: loadingOpenProjectOpenings } =
    useQuery({
      queryKey: ['project-openings-open', project?.id],
      queryFn: () => fetchOpenProjectOpenings(project?.id),
      enabled: !!project?.id,
      staleTime: 1000 * 60,
    })

  /*
   * ─────────────────────────────────────────────
   * IMAGE PATHS
   * ─────────────────────────────────────────────
   */

  const AVATAR_PATH =
    'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

  const AVATAR_MINI2_PATH =
    'https://ik.imagekit.io/mublin/tr:h-22,c-maintain_ratio/users/avatars/'

  const PICTURE_AVATAR_SMALL_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-192,w-192,c-maintain_ratio/`
  const PICTURE_AVATAR_SMALL2_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-100,w-100,c-maintain_ratio/`
  const PICTURE_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-240,w-240,c-maintain_ratio/`

  const PICTURE_AVATAR_AS_COVER_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-750,w-1200,fo-top,bl-14,fo-auto/`

  const PICTURE_AVATAR_LARGE_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-400,w-400,c-maintain_ratio/`

  const PICTURE_COVER_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-500,w-1400,fo-top,c-maintain_ratio/`

  /*
   * ─────────────────────────────────────────────
   * ERROR
   * ─────────────────────────────────────────────
   */

  if (isError) {
    return (
      <>
        <PageMeta title="Projeto não encontrado | Mublin" noindex />
        <Container size="md" py="xl">
          <Text c="dimmed" ta="center">
            Projeto não encontrado.
          </Text>
        </Container>
      </>
    )
  }

  /*
   * ─────────────────────────────────────────────
   * HELPERS
   * ─────────────────────────────────────────────
   */

  const myAdminRequestStatus = myAdminRequest?.status ?? null

  const myAdminRequestIsPending = myAdminRequestStatus === ADMIN_REQUEST_STATUS.PENDING

  const hasSocialLinks =
    project?.instagram ||
    project?.spotify_id ||
    project?.soundcloud ||
    project?.website ||
    project?.youtube_handle ||
    project?.apple_music_id ||
    project?.muso_ai_app_url

  const validGenreNames =
    projectGenres?.map((g) => g?.genre?.name_ptbr || g?.name_ptbr).filter(Boolean) ?? []

  const projectLocation = [
    project?.city?.name,
    project?.city?.regions?.name !== project?.city?.name
      ? project?.city?.regions?.name
      : null,
    project?.city?.regions?.uf,
  ]
    .filter(Boolean)
    .join(', ')

  const instagramHandle = project?.instagram
    ?.replace('@', '')
    ?.replace('https://instagram.com/', '')
    ?.replace('instagram.com/', '')
    ?.trim()

  const getSocialLinks = (project) => {
    if (!project) return []
    return [
      {
        key: 'muso',
        href: project.muso_ai_app_url,
        label: `${project.name} no Muso.ai`,
        Icon: IconBrandMuso,
        color: '#6BE7C8',
      },
      {
        key: 'instagram',
        href: project.instagram ? `https://instagram.com/${project.instagram}` : null,
        label: `${project.name} no Instagram`,
        Icon: IconBrandInstagram,
        color: '#C13584',
      },
      {
        key: 'apple',
        href: project.apple_music_id
          ? `https://music.apple.com/br/artist/${project.apple_music_id}`
          : null,
        label: `${project.name} na Apple Music`,
        Icon: IconBrandApple,
        color: '#a8a8a8',
      },
      {
        key: 'spotify',
        href: project.spotify_id
          ? `https://open.spotify.com/intl-pt/artist/${project.spotify_id}`
          : null,
        label: `${project.name} no Spotify`,
        Icon: IconBrandSpotify,
        color: '#1ED760',
      },
      {
        key: 'soundcloud',
        href: project.soundcloud ? `https://soundcloud.com/${project.soundcloud}` : null,
        label: `${project.name} no Soundcloud`,
        Icon: IconBrandSoundcloud,
        color: 'orange',
      },
      {
        key: 'youtube',
        href: project.youtube_handle
          ? `https://www.youtube.com/${project.youtube_handle}`
          : null,
        label: `${project.name} no Youtube`,
        Icon: IconBrandYoutube,
        color: '#FF0000',
      },
    ].filter((link) => !!link.href)
  }

  return (
    <>
      {project && (
        <PageMeta
          title={`${project.name} | Mublin`}
          description={
            project.type
              ? `${project.name} (${project.type}) no Mublin`
              : `${project.name} no Mublin`
          }
          canonical={`https://mublin.com/project/${slug}`}
          image={
            project.picture ? PICTURE_AVATAR_LARGE_PATH + project.picture : undefined
          }
        />
      )}

      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%" style={{ zIndex: 100 }}>
          <AppNavbarMobile pageName=" " transparent />
        </Affix>
      )}

      <Container fluid px={0} mt={{ base: 10, sm: 10 }}>
        {/*
         * ════════════════════════════════════════════════
         * PROJECT HERO
         * ════════════════════════════════════════════════
         */}

        <Card
          mx={{ base: 0, sm: 'md' }}
          mb={0}
          p={0}
          radius={isMobile ? 0 : 'lg'}
          style={{
            overflow: 'hidden',
            // borderRadius: '0 0 20px 20px',
          }}
          bg="black"
        >
          <Box pos="relative" h={{ base: 160, sm: 170 }}>
            {isLoading ? (
              <Skeleton h="100%" w="100%" />
            ) : (
              <Image
                opacity={0.15}
                src={
                  project?.cover_picture
                    ? PICTURE_COVER_PATH + project.cover_picture
                    : PICTURE_AVATAR_AS_COVER_PATH + project?.picture
                }
                fallbackSrc="https://placehold.co/1400x500?text=."
                h="100%"
                w="100%"
                fit="inherit"
                alt={`Capa de ${project?.name}`}
              />
            )}

            {/*
             * Overlay
             */}

            <Box
              pos="absolute"
              inset={0}
              style={{
                background: `
                  linear-gradient(
                    to bottom,
                    rgba(0,0,0,0.08) 0%,
                    rgba(0,0,0,0.10) 30%,
                    rgba(0,0,0,0.55) 65%,
                    rgba(0,0,0,0.92) 100%
                  )
                `,
                pointerEvents: 'none',
              }}
            />

            {/*
             * ─────────────────────────────────────────────
             * BACKSTAGE
             * ─────────────────────────────────────────────
             */}

            {/* {(userIsAdmin || userIsStaff) && project?.id && (
                  <Button
                    component="a"
                    href={`/backstage/${project.id}`}
                    // target={`backstage-${project.id}`}
                    pos="absolute"
                    top={{ base: 30, sm: 20 }}
                    right={{ base: 20, sm: 20 }}
                    size="sm"
                    color="dark"
                    rightSection={<IconArrowUpRight size={14} />}
                  >
                    Backstage
                  </Button>
                )} */}

            {/*
             * ─────────────────────────────────────────────
             * PROJECT IDENTITY
             * ─────────────────────────────────────────────
             */}

            <Box
              pos="absolute"
              bottom={0}
              // bg="black"
              left={0}
              right={0}
              px={{ base: 'md', sm: 'md' }}
              pb={{ base: 'md', sm: 'lg' }}
            >
              <Flex gap={{ base: 'md', sm: 'lg' }} align="center">
                {isLoading ? (
                  <Skeleton
                    w={{ base: 76, sm: 96 }}
                    h={{ base: 76, sm: 96 }}
                    radius="lg"
                  />
                ) : (
                  <Avatar
                    src={
                      isMobile
                        ? PICTURE_AVATAR_PATH + project?.picture
                        : PICTURE_AVATAR_SMALL_PATH + project?.picture
                    }
                    size={isMobile ? 76 : 120}
                    onClick={openModal}
                    style={{
                      flexShrink: 0,
                      cursor: 'pointer',
                      // border: '2px solid rgba(255,255,255,.18)',
                      // border: '2px solid rgba(255,255,255,.4)',
                      // boxShadow: '0 8px 30px rgba(0,0,0,.6)',
                    }}
                  />
                )}

                <Stack
                  gap={5}
                  style={{
                    minWidth: 0,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Skeleton h={26} w={200} />
                      <Skeleton h={14} w={130} />
                    </>
                  ) : (
                    <>
                      {/* TOUR BADGES - nova lógica */}
                      {tourStatus?.isOnTour && (
                        <Badge color="green" leftSection={<IconRoad size={14} />}>
                          Em turnê • {tourStatus.activeTours[0].title}
                        </Badge>
                      )}
                      {!tourStatus?.isOnTour && tourStatus?.isUpcomingSoon && (
                        <Badge
                          color="yellow"
                          variant="light"
                          leftSection={<IconCalendar size={14} />}
                          px={5}
                        >
                          Turnê em breve •{' '}
                          {/* {tourStatus.nextDate &&
                                new Date(tourStatus.nextDate).toLocaleDateString(
                                  'pt-BR',
                                )}{' '} */}
                          {tourStatus.upcomingTours[0].days_until} dias
                        </Badge>
                      )}
                      <Group gap={7} wrap="nowrap">
                        <Title
                          order={1}
                          fz={{
                            base: 28,
                            sm: 34,
                          }}
                          fw={650}
                          c="white"
                          lts="-0.025em"
                          lineClamp={1}
                          lh={1}
                        >
                          {project?.name}
                        </Title>

                        {project?.is_verified && (
                          <IconRosetteDiscountCheck
                            size={isMobile ? 21 : 22}
                            color="var(--mantine-color-text)"
                            title="Projeto verificado"
                            style={{
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Group>

                      <Group gap={3} wrap="wrap">
                        {project?.type && (
                          <Text size="sm" c="rgba(255,255,255,.76)">
                            {project.type}
                          </Text>
                        )}
                        {project?.city?.countries?.name && (
                          <Text size="sm" c="rgba(255,255,255,.76)">
                            ·{' '}
                            {project?.city?.countries?.name_ptbr ??
                              project?.city?.countries?.name}
                          </Text>
                        )}
                      </Group>

                      {loadingProjectGenres ? (
                        <Skeleton width={170} height={16} />
                      ) : (
                        validGenreNames.length > 0 && (
                          <Text size="sm" c="dimmed" lineClamp={2} lh={1}>
                            {validGenreNames.join(', ')}
                          </Text>
                        )
                      )}
                    </>
                  )}
                </Stack>
              </Flex>
            </Box>
          </Box>
        </Card>

        {!isLoading && projectPeople.length > 1 && (
          <Box px={{ base: 'md', sm: 'xl' }} py="md">
            <Avatar.Group>
              {projectPeople.slice(0, 5).map((person) => (
                <Tooltip
                  key={person.id}
                  label={person.profile?.full_name || person.profile?.username}
                  withArrow
                >
                  <Avatar
                    component={Link}
                    to={`/${person.profile?.username}`}
                    size={34}
                    src={`${AVATAR_PATH}${person.profile?.avatar}`}
                  />
                </Tooltip>
              ))}

              {projectPeople.length > 5 && (
                <Avatar size={34}>+{projectPeople.length - 5}</Avatar>
              )}
            </Avatar.Group>
          </Box>
        )}

        {/*
         * ════════════════════════════════════════════════
         * NAVIGATION
         * ════════════════════════════════════════════════
         */}

        <Group justify="space-between" mt="xs" mb="md" wrap="nowrap">
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            variant="default"
            style={{ flex: 1, minWidth: 0 }}
            mx={{ base: 0, sm: 'md' }}
          >
            <Tabs.List style={{ flexWrap: 'nowrap' }}>
              <Scroller type="scroll" style={{ flex: 1 }}>
                <Group wrap="nowrap" gap={0}>
                  <Tabs.Tab value="overview">Visão geral</Tabs.Tab>

                  <Tabs.Tab value="about">Sobre</Tabs.Tab>

                  <Tabs.Tab value="people">
                    Pessoas {projectPeople?.length > 0 && `(${projectPeople.length})`}
                  </Tabs.Tab>
                  <Tabs.Tab value="pictures">Imagens</Tabs.Tab>

                  {project?.end_year > 0 && <Tabs.Tab value="gigs">Gigs</Tabs.Tab>}

                  {/* <Tabs.Tab value="music">Música</Tabs.Tab> */}
                </Group>
              </Scroller>
            </Tabs.List>
          </Tabs>
          <Group gap={4} mr="lg" visibleFrom="sm" style={{ flexShrink: 0 }}>
            {getSocialLinks(project).map(({ key, href, label, Icon, color }) => (
              <Tooltip key={key} label={label} withArrow>
                <ActionIcon
                  component="a"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  variant="subtle"
                  color="gray"
                  aria-label={`${label} (abre em nova aba)`}
                >
                  <Icon
                    stroke={1.6}
                    color={color}
                    style={{ width: '70%', height: '70%' }}
                  />
                </ActionIcon>
              </Tooltip>
            ))}
          </Group>
        </Group>

        {/*
         * ════════════════════════════════════════════════
         * OVERVIEW
         * ════════════════════════════════════════════════
         */}

        {activeTab === 'overview' && (
          <Container size="lg" px={{ base: 'sm', sm: 'md' }}>
            {/*
             * ────────────────────────────────────────────
             * MAIN COLUMN
             * ────────────────────────────────────────────
             */}

            <Stack
              gap="md"
              style={{
                gridColumn: isMobile ? undefined : 'span 2',
              }}
            >
              <Grid>
                <Grid.Col span={{ base: 12, sm: 7 }}>
                  <Stack>
                    <Card withBorder radius="lg" px="lg" pt="md" pb={8} h={160}>
                      <Group justify="space-between" mb="xs">
                        <Title order={3} fw={600} size="17px">
                          Visão geral
                        </Title>
                        {recentPicture?.id && (
                          <Image
                            w={24}
                            h={24}
                            radius="md"
                            src={`https://ik.imagekit.io/mublin/projects/${project?.id}/${recentPicture?.file_name}?tr=w-54`}
                            style={{
                              cursor: 'pointer',
                              boxSizing: 'content-box',
                              border: '2px var(--mantine-color-dimmed) solid',
                            }}
                            alt={recentPicture?.caption || 'Foto do projeto'}
                            onClick={() => setActiveTab('pictures')}
                          />
                        )}
                      </Group>

                      {project?.description ? (
                        <>
                          <Text
                            size="sm"
                            lh={1.6}
                            lineClamp={2}
                            mih={48}
                            style={{
                              whiteSpace: 'pre-line',
                            }}
                          >
                            {project.description}
                          </Text>
                          <Divider mt="xs" mb="xs" />
                          <Button
                            radius="xl"
                            fullWidth
                            size="compact-sm"
                            variant="transparent"
                            color="var(--mantine-color-text)"
                            onClick={() => setActiveTab('about')}
                            rightSection={<IconArrowRight size={16} />}
                          >
                            Ver tudo
                          </Button>
                        </>
                      ) : (
                        <Text size="sm" c="dimmed">
                          Descrição não disponível.
                        </Text>
                      )}
                    </Card>

                    {project?.profile_id && (
                      <Card withBorder radius="lg" px="lg" py="lg">
                        <Title order={3} fw={600} size="17px">
                          Perfil pessoal no Mublin
                        </Title>
                        <Text size="sm" c="dimmed" mb="xs">
                          Este artista possui perfil pessoal no Mublin
                        </Text>
                        <ProjectProfileBadge projectId={project?.id} />
                      </Card>
                    )}

                    {/*
                     * PEOPLE PREVIEW
                     */}

                    {((activeTab === 'overview' && isMobile) || !isMobile) && (
                      <>
                        {recentProjectPeople.length > 0 && (
                          <Card withBorder radius="lg" px="lg" pt="md" pb={8}>
                            <>
                              <Title order={3} fw={600} size="17px" mb="xs">
                                Pessoas associadas recentemente
                              </Title>
                              <Stack gap="xs">
                                {recentProjectPeople.map((person) => (
                                  <Box key={person.id}>
                                    <Group gap="sm" wrap="nowrap">
                                      <Avatar
                                        component={Link}
                                        to={`/${person.profile?.username}`}
                                        size={42}
                                        src={`${AVATAR_PATH}${person.profile?.avatar}`}
                                      />

                                      <Box
                                        style={{
                                          minWidth: 0,
                                        }}
                                      >
                                        <Text
                                          component={Link}
                                          to={`/${person.profile?.username}`}
                                          size="sm"
                                          fw={500}
                                          lineClamp={1}
                                          style={{
                                            textDecoration: 'none',
                                            color: 'inherit',
                                          }}
                                        >
                                          {person.profile?.full_name}
                                        </Text>

                                        <Text size="xs" c="dimmed" fw={500} lineClamp={1}>
                                          {person.roles
                                            ?.map((r) => r.role?.name_ptbr)
                                            .join(', ')}
                                        </Text>

                                        <Text
                                          size="11px"
                                          c="dimmed"
                                          mt={3}
                                          fw={300}
                                          lineClamp={1}
                                        >
                                          {person?.notes}
                                        </Text>
                                      </Box>
                                    </Group>
                                  </Box>
                                ))}
                              </Stack>
                              <Divider mt="md" mb={4} />
                              {projectPeople.length > 0 && (
                                <Button
                                  radius="md"
                                  fullWidth
                                  size="sm"
                                  variant="transparent"
                                  color="var(--mantine-color-text)"
                                  onClick={() => setActiveTab('people')}
                                >
                                  Ver todas as pessoas associadas
                                </Button>
                              )}
                            </>
                          </Card>
                        )}
                      </>
                    )}
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 5 }}>
                  <Stack>
                    {/*
                     * ADD TO PORTFOLIO
                     */}
                    <Card withBorder radius="lg" p="lg" h={162}>
                      <Stack gap="xs" mt={4}>
                        <Center mb={2}>
                          <Group w={240} gap="xs" wrap="nowrap">
                            <Avatar
                              src={PICTURE_AVATAR_SMALL2_PATH + project?.picture}
                              size={50}
                            />
                            <IconMusicPlus size={19} color="gray" />
                            <Stack gap={6} style={{ flex: 1 }}>
                              <Skeleton
                                h={8}
                                w="96%"
                                radius="xl"
                                animate={false}
                                opacity={0.9}
                              />
                              <Skeleton
                                h={6}
                                w="66%"
                                radius="xl"
                                animate={false}
                                opacity={0.65}
                              />
                              <Skeleton
                                h={6}
                                w="80%"
                                radius="xl"
                                animate={false}
                                opacity={0.4}
                              />
                            </Stack>
                          </Group>
                        </Center>

                        <Stack gap={4} mt={6}>
                          <Text ta="center" size="sm" fw={500}>
                            Já trabalhou com {project?.name}?
                          </Text>
                          <Anchor
                            component={Link}
                            to={`/settings/portfolio`}
                            size="sm"
                            c="dimmed"
                            ta="center"
                          >
                            Adicione ao seu portfolio
                          </Anchor>
                        </Stack>
                      </Stack>
                    </Card>

                    {/*
                     * ADMIN FEATURES
                     */}

                    {(userIsAdmin || userIsStaff) && activeTab === 'overview' && (
                      <BackstageAccess
                        profile={profile}
                        projectId={project?.id}
                        userIsAdmin={userIsAdmin}
                        userIsStaff={userIsStaff}
                      />
                    )}

                    {/*
                     * RELATED PROJECTS
                     */}

                    {(loadingRelatedProjects || relatedProjects.length > 0) && (
                      <Stack gap="sm" px="xs" mb="sm">
                        <Title order={3} fw={600} size="15px" mb={6}>
                          Projetos relacionados a {project?.name}
                        </Title>
                        <Scroller>
                          <Group wrap="nowrap" gap="xs" align="flex-start">
                            {loadingRelatedProjects
                              ? [1, 2, 3].map((i) => (
                                  <Stack key={i} gap={6} align="center" w={84}>
                                    <Skeleton circle height={64} width={64} />
                                    <Skeleton height={10} width={56} />
                                  </Stack>
                                ))
                              : relatedProjects.map((related) => (
                                  <UnstyledButton
                                    key={related.id}
                                    onClick={() =>
                                      navigate(
                                        related.project_type_id === 19
                                          ? `/person/${related.slug}`
                                          : `/project/${related.slug}`,
                                      )
                                    }
                                    aria-label={`Ver projeto ${related.name}`}
                                    w={80}
                                  >
                                    <Stack gap={3} align="center">
                                      <Avatar
                                        src={getRelatedAvatarUrl(related)}
                                        size={50}
                                      />
                                      <Text
                                        w={79}
                                        size="xs"
                                        ta="center"
                                        lineClamp={1}
                                        title={related.name}
                                      >
                                        {related.name}
                                      </Text>
                                      <Text size="10px" c="dimmed">
                                        {related?.type}
                                      </Text>
                                    </Stack>
                                  </UnstyledButton>
                                ))}
                          </Group>
                        </Scroller>
                      </Stack>
                    )}
                  </Stack>
                </Grid.Col>
              </Grid>

              {/*
               * OPENINGS
               */}

              {(loadingOpenProjectOpenings || openProjectOpenings.length > 0) && (
                <Card withBorder radius="lg" p="lg">
                  <Group justify="space-between" mb="md">
                    <Group gap="xs">
                      <ThemeIcon
                        variant="light"
                        color="mublinColor"
                        radius="md"
                        size="lg"
                      >
                        <IconBriefcase2 size={18} />
                      </ThemeIcon>

                      <Box>
                        <Title order={3} fz="lg" fw={600}>
                          Vagas abertas
                        </Title>

                        <Text size="xs" c="dimmed">
                          O projeto está procurando músicos
                        </Text>
                      </Box>
                    </Group>
                  </Group>

                  {loadingOpenProjectOpenings ? (
                    <Stack gap="xs">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} h={74} radius="md" />
                      ))}
                    </Stack>
                  ) : (
                    <Stack gap="xs">
                      {openProjectOpenings.slice(0, 3).map((opening) => (
                        <Paper key={opening.id} withBorder radius="md" p="md">
                          <Flex justify="space-between" align="center" gap="md">
                            <Box>
                              <Group gap={6} mb={3}>
                                <Text fw={600} size="sm">
                                  {opening?.role?.name_ptbr}
                                </Text>

                                {opening?.is_remote && (
                                  <Badge size="xs" variant="light" color="blue">
                                    Remoto
                                  </Badge>
                                )}

                                {opening?.is_paid && (
                                  <Badge size="xs" variant="light" color="green">
                                    Remunerado
                                  </Badge>
                                )}
                              </Group>

                              {opening.engagement_type?.name_ptbr && (
                                <Text size="xs" c="dimmed">
                                  {opening.engagement_type?.name_ptbr}
                                </Text>
                              )}

                              {opening.description && (
                                <Text size="xs" c="dimmed" mt={3} lineClamp={2}>
                                  {opening.description}
                                </Text>
                              )}
                            </Box>

                            <IconChevronRight
                              size={18}
                              opacity={0.45}
                              style={{
                                flexShrink: 0,
                              }}
                            />
                          </Flex>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Card>
              )}

              {/*
               * INSPIRED
               */}

              {inspirated.length > 0 && (
                <Card withBorder radius="lg" p="lg">
                  <Title order={3} fz="lg" fw={600}>
                    Inspirando pessoas
                  </Title>

                  <Text size="xs" c="dimmed" mt={2} mb="md">
                    {inspirated.length === 1
                      ? `1 pessoa se inspira no trabalho de ${project?.name}`
                      : `${inspirated.length} pessoas se inspiram no trabalho de ${project?.name}`}
                  </Text>

                  <Group wrap="wrap">
                    {inspirated.slice(0, 12).map((item) => (
                      <Popover
                        key={item.id}
                        width={140}
                        position="bottom"
                        withArrow
                        shadow="md"
                        opened={profileDetailOpened}
                      >
                        <Popover.Target>
                          <Link to={`/${item.profiles?.username}`}>
                            <Avatar
                              size={42}
                              onMouseEnter={openProfileDetail}
                              onMouseLeave={closeProfileDetail}
                              src={
                                item.profiles?.avatar
                                  ? AVATAR_PATH + item.profiles.avatar
                                  : `https://api.dicebear.com/10.x/initials/svg?seed=${item.profiles?.full_name}`
                              }
                              title={item.profiles?.full_name}
                            />
                          </Link>
                        </Popover.Target>

                        <Popover.Dropdown
                          style={{
                            pointerEvents: 'none',
                          }}
                          p={10}
                        >
                          <Text size="xs" fw={500}>
                            @{item.profiles?.username}
                          </Text>

                          <Text size="10px" c="dimmed">
                            {item.profiles?.title}
                          </Text>
                        </Popover.Dropdown>
                      </Popover>
                    ))}

                    {inspirated.length > 12 && (
                      <Avatar size={42}>+{inspirated.length - 12}</Avatar>
                    )}
                  </Group>
                </Card>
              )}

              {/* {project?.spotify_id && (
                      <Box px={isMobile ? 10 : 0}>
                        <iframe
                          title={`Spotify - ${project?.name}`}
                          src={`https://open.spotify.com/embed/artist/${encodeURIComponent(project.spotify_id)}?utm_source=generator&theme=0`}
                          width="100%"
                          height="352"
                          style={{ borderRadius: 15, border: 0 }}
                          allowFullScreen
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                        />
                      </Box>
                    )} */}
            </Stack>
          </Container>
        )}

        {/*
         * ════════════════════════════════════════════════
         * ABOUT
         * ════════════════════════════════════════════════
         */}

        {activeTab === 'about' && (
          <Container size="lg" px={{ base: 'sm', sm: 'md' }}>
            <Card withBorder radius="lg" p="lg">
              <Title order={3} fz="lg" fw={600} mb="xs">
                Sobre
              </Title>

              <Stack gap={2} mb="xs">
                {project?.type && (
                  <Text size="sm" c="dimmed">
                    Tipo do projeto: {project.type}
                  </Text>
                )}
                <Group gap={2}>
                  {/* {project?.foundation_year && (
                    <Text size="xs" c="dimmed">
                      Início das atividades: {project.foundation_year}
                    </Text>
                  )} */}
                  {projectLocation && (
                    <Group gap={2} wrap="nowrap">
                      <IconMapPin color="gray" size={12} stroke={2} />
                      <Text size="sm" c="dimmed">
                        {projectLocation}
                      </Text>
                    </Group>
                  )}
                </Group>
              </Stack>

              <Stack gap="xs">
                {project?.description ? (
                  <Spoiler
                    mb={30}
                    maxHeight={85}
                    showLabel={
                      <Text size="sm" fw={600} c="var(--mantine-color-text)">
                        Ver mais
                      </Text>
                    }
                    hideLabel={
                      <Text size="sm" fw={600} c="var(--mantine-color-text)">
                        Ver menos
                      </Text>
                    }
                  >
                    <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                      {project.description}
                    </Text>
                  </Spoiler>
                ) : (
                  <Text size="sm" c="dimmed">
                    Descrição não disponível.
                  </Text>
                )}

                {project?.purpose && (
                  <>
                    <Divider my="lg" />

                    <Text size="xs" c="dimmed" fw={600} tt="uppercase" lts=".04em" mb={5}>
                      Objetivo do projeto
                    </Text>

                    <Text size="sm" lh={1.6}>
                      {project.purpose}
                    </Text>
                  </>
                )}

                {project?.is_verified && (
                  <Group gap="sm" mb={4} align="flex-start" wrap="nowrap">
                    <IconRosetteDiscountCheck
                      size={22}
                      color="var(--mantine-color-text)"
                      style={{ flexShrink: 0, marginTop: 1 }}
                    />

                    <Box>
                      <Text size="sm" fw={600} mb={4}>
                        Projeto verificado
                      </Text>
                      <Text size="xs" c="dimmed" lh={1}>
                        A equipe do Mublin confirmou que este projeto é representado por
                        pessoas reais ligadas a ele.
                      </Text>

                      {/* {(project?.verified_at ||
                        project?.verified_method?.method_name_pt) && (
                        <Text size="xs" c="dimmed" mt={4}>
                          {[
                            project?.verified_at &&
                              `Verificado em ${dayjs(project.verified_at).format('DD/MM/YYYY')}`,
                            project?.verified_method?.method_name_pt,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      )} */}
                    </Box>
                  </Group>
                )}

                {/*
                 * SOCIAL
                 */}

                {hasSocialLinks && isMobile && <Divider />}

                {project?.website && (
                  <Anchor
                    href={project?.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="never"
                    c="dimmed"
                    aria-label={`Abrir website de ${project?.name}`}
                    style={{ width: 'fit-content' }}
                  >
                    <Group gap={6} wrap="nowrap" className="social-link">
                      <IconWorld size={20} style={{ flexShrink: 0 }} />
                      <Text size="sm" lh={1}>
                        {project?.website
                          .replace(/^https?:\/\/(www\.)?/, '')
                          .replace(/\/$/, '')}
                      </Text>
                    </Group>
                  </Anchor>
                )}

                <Group gap={6} mr="lg" hiddenFrom="sm">
                  {project?.muso_ai_app_url && (
                    <ActionIcon
                      component="a"
                      href={project.muso_ai_app_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="lg"
                      variant="subtle"
                      color="gray"
                      aria-label={`${project.name} no Muso.ai (abre em nova aba)`}
                    >
                      <IconBrandMuso
                        stroke={1.6}
                        color="#6BE7C8"
                        style={{ width: '70%', height: '70%' }}
                      />
                    </ActionIcon>
                  )}
                  {project?.apple_music_id && (
                    <ActionIcon
                      component="a"
                      href={`https://music.apple.com/br/artist/${project?.apple_music_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="lg"
                      variant="subtle"
                      color="gray"
                      aria-label={`${project.name} no Apple Music (abre em nova aba)`}
                    >
                      <IconBrandApple
                        stroke={1.6}
                        color="#a8a8a8"
                        style={{ width: '70%', height: '70%' }}
                      />
                    </ActionIcon>
                  )}
                  {project?.spotify_id && (
                    <ActionIcon
                      component="a"
                      href={`https://open.spotify.com/intl-pt/artist/${project?.spotify_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="lg"
                      variant="subtle"
                      color="gray"
                      aria-label={`${project.name} no Spotify (abre em nova aba)`}
                    >
                      <IconBrandSpotify
                        stroke={1.6}
                        color="#1ED760"
                        style={{ width: '70%', height: '70%' }}
                      />
                    </ActionIcon>
                  )}
                  {project?.instagram && (
                    <ActionIcon
                      component="a"
                      href={`https://instagram.com/${project?.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="lg"
                      variant="subtle"
                      color="gray"
                      aria-label={`${project.name} no Instagram (abre em nova aba)`}
                    >
                      <IconBrandInstagram
                        stroke={1.6}
                        color="#C13584"
                        style={{ width: '70%', height: '70%' }}
                      />
                    </ActionIcon>
                  )}
                </Group>

                <Divider />

                <Group gap={4} mt={2}>
                  <Text size="xs" c="dimmed">
                    {/* Cadastrado em {dayjs(project?.created_at).format('DD/MM/YYYY')} */}
                    Cadastrado
                  </Text>
                  {project?.creator?.username && (
                    <>
                      <Avatar
                        src={AVATAR_MINI2_PATH + project?.creator?.avatar}
                        size={22}
                        component={Link}
                        to={`/${project?.creator?.username}`}
                        title={project?.creator?.full_name}
                      />
                      <Text size="xs" c="dimmed">
                        por{' '}
                        <Text span fw={600}>
                          {project?.creator?.username}
                        </Text>
                      </Text>
                    </>
                  )}
                </Group>
              </Stack>
            </Card>
          </Container>
        )}

        {/*
         * ════════════════════════════════════════════════
         * PEOPLE
         * ════════════════════════════════════════════════
         */}

        {activeTab === 'people' && (
          <SectionPeople
            projectId={project?.id}
            userIsAdmin={userIsAdmin}
            myAdminRequestIsPending={myAdminRequestIsPending}
          />
        )}

        {/*
         * ════════════════════════════════════════════════
         * IMAGES
         * ════════════════════════════════════════════════
         */}

        {activeTab === 'pictures' && <SectionPictures projectId={project?.id} />}

        {/*
         * ════════════════════════════════════════════════
         * GIGS
         * ════════════════════════════════════════════════
         */}

        {activeTab === 'gigs' && <SectionGigs projectId={project?.id} />}

        {/*
         * ════════════════════════════════════════════════
         * MUSIC
         * ════════════════════════════════════════════════
         */}

        {/* {activeTab === 'music' && (
          <Container size="lg" px={{ base: 'sm', sm: 'md' }}>
            <Card withBorder radius="lg" p="lg">
              <Title order={3} fz="lg" fw={600} mb="xs">
                Discografia
              </Title>
              <Text c="dimmed" size="sm">
                Nenhum álbum cadastrado para este projeto no momento.
              </Text>
            </Card>
          </Container>
        )} */}
      </Container>

      {/*
       * ════════════════════════════════════════════════
       * PROJECT AVATAR MODAL
       * ════════════════════════════════════════════════
       */}

      <Modal.Root opened={opened} onClose={closeModal} size="auto" centered>
        <Modal.Overlay backgroundOpacity={0.85} blur={3} />

        <Modal.Content>
          <Modal.Body p={0}>
            <img
              src={PICTURE_AVATAR_LARGE_PATH + project?.picture}
              alt={project?.name}
              style={{
                display: 'block',
                width: 'inherit',
              }}
            />

            <Modal.CloseButton
              style={{
                position: 'fixed',
                top: 8,
                right: 8,
                zIndex: 1000,
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              }}
            />
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </>
  )
}
