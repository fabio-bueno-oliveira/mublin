import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPersonDetails, fetchPersonInspirated } from '../queries/person'
import {
  fetchProjectAdmins,
  fetchProjectPeople,
  fetchProjectGenres,
  fetchMyProjectAdminRequest,
  requestProjectAdminAccess,
  fetchProjectClaimPolicy,
} from '../queries/projects'
import { fetchOpenProjectOpenings } from '../queries/projectOpenings'
// prettier-ignore
import {
  Container, Grid, SimpleGrid,
  Flex, Group,
  Box, Stack,
  Skeleton, em,
  Modal, Affix,
  Button, Badge,
  Avatar, Image, ActionIcon,
  Anchor, Title, Text,
  Textarea, Spoiler, 
  Card, Paper,
  Scroller, Tooltip, Popover,
  Tabs, ThemeIcon,
  Divider,
} from '@mantine/core'
import { useMediaQuery, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconBrandInstagram,
  IconInfoCircle,
  IconRosetteDiscountCheckFilled,
  IconArrowUpRight,
  IconPencil,
  IconArrowRight,
  IconBriefcase2,
  IconChevronRight,
} from '@tabler/icons-react'
import AppNavbarMobile from '../components/AppNavbarMobile'
import SimilarProjects from '../components/explore/SimilarProjects'
import ProjectProfileBadge from '../components/ProjectProfileBadge'
import { MEMBER_REQUEST_STATUS } from '../constants/projects'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

const ADMIN_REQUEST_STATUS = {
  PENDING: 1,
  ACCEPTED: 2,
  DECLINED: 3,
}

function formatClaimPolicyMessage(policy) {
  if (!policy) {
    return 'Carregando regra de aprovação...'
  }

  if (policy.requires_curation) {
    return 'Este é um projeto de grande visibilidade — sua solicitação será revisada manualmente pela curadoria do Mublin antes de ser aprovada.'
  }

  const hours = policy.auto_approval_hours
  const isFullDays = hours % 24 === 0

  const timeLabel = isFullDays
    ? `${hours / 24} dia${hours / 24 > 1 ? 's' : ''}`
    : `${hours} horas`

  return `Para este projeto, sua solicitação ficará pendente de aprovação da curadoria do Mublin, ou será aprovada automaticamente em até ${timeLabel} caso ninguém conteste.`
}

export default function Project() {
  const { user } = useAuth()
  const { slug } = useParams()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('overview')
  const [opened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [profileDetailOpened, { open: openProfileDetail, close: closeProfileDetail }] =
    useDisclosure(false)

  useEffect(() => {
    scrollTo({ y: 0 })
  }, [])

  /*
   * ─────────────────────────────────────────────
   * PROJECT
   * ─────────────────────────────────────────────
   */

  const {
    data: person,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['person', slug],
    queryFn: () => fetchPersonDetails(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const userMembership = person?.members?.find((m) => m.profile_id === user?.id)

  const userIsAdmin =
    userMembership?.is_admin === true &&
    userMembership?.status === MEMBER_REQUEST_STATUS.ACCEPTED

  /*
   * ─────────────────────────────────────────────
   * PROJECT SOCIAL DATA
   * ─────────────────────────────────────────────
   */

  const { data: inspirated = [] } = useQuery({
    queryKey: ['person-inspirated', person?.id],
    queryFn: () => fetchPersonInspirated(person?.id),
    enabled: !!person?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: projectAdmins = [], isLoading: loadingProjectAdmins } = useQuery({
    queryKey: ['project-admins', person?.id],
    queryFn: () => fetchProjectAdmins(person?.id),
    enabled: !!person?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: projectGenres = [], isLoading: loadingProjectGenres } = useQuery({
    queryKey: ['project-genres', person?.id],
    queryFn: () => fetchProjectGenres(person?.id),
    enabled: !!person?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: projectPeople = [], isLoading: loadingProjectPeople } = useQuery({
    queryKey: ['project-people', person?.id],
    queryFn: () => fetchProjectPeople(person?.id),
    enabled: !!person?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: recentProjectPeople = [], isLoading: loadingRecentProjectPeople } =
    useQuery({
      queryKey: ['project-people-recent', person?.id],
      queryFn: () =>
        fetchProjectPeople(person?.id, {
          limit: 2,
          orderBy: 'created_at',
          ascending: false,
        }),
      enabled: !!person?.id,
      staleTime: 1000 * 60 * 5,
    })

  /*
   * ─────────────────────────────────────────────
   * ADMIN CLAIM
   * ─────────────────────────────────────────────
   */

  const { data: myAdminRequest } = useQuery({
    queryKey: ['project-admin-request', person?.id, user?.id],
    queryFn: () => fetchMyProjectAdminRequest(person?.id, user?.id),
    enabled: !!person?.id && !!user?.id,
    staleTime: 1000 * 30,
  })

  const [claimModalOpened, { open: openClaimModal, close: closeClaimModal }] =
    useDisclosure(false)

  const [endorsementMessage, setEndorsementMessage] = useState('')

  const {
    data: claimPolicy,
    isLoading: loadingClaimPolicy,
    isError: claimPolicyError,
  } = useQuery({
    queryKey: ['project-claim-policy', person?.id],
    queryFn: () => fetchProjectClaimPolicy(person?.id),
    enabled: !!person?.id && claimModalOpened,
    staleTime: 1000 * 60,
  })

  /*
   * ─────────────────────────────────────────────
   * OPENINGS
   * ─────────────────────────────────────────────
   */

  const { data: openProjectOpenings = [], isLoading: loadingOpenProjectOpenings } =
    useQuery({
      queryKey: ['project-openings-open', person?.id],
      queryFn: () => fetchOpenProjectOpenings(person?.id),
      enabled: !!person?.id,
      staleTime: 1000 * 60,
    })

  /*
   * ─────────────────────────────────────────────
   * ADMIN MUTATION
   * ─────────────────────────────────────────────
   */

  const requestAdminMutation = useMutation({
    mutationFn: (message) => requestProjectAdminAccess(person.id, message),

    onSuccess: (data) => {
      const autoApproved = data?.status === ADMIN_REQUEST_STATUS.ACCEPTED

      notifications.show({
        title: autoApproved ? 'Você agora é administrador' : 'Solicitação enviada',
        message: autoApproved
          ? 'Como o projeto ainda não tinha administrador, seu acesso foi aprovado automaticamente.'
          : 'Assim que um administrador atual responder, você será avisado.',
        color: 'green',
        position: 'top-center',
      })

      queryClient.invalidateQueries({
        queryKey: ['person', slug],
      })

      queryClient.invalidateQueries({
        queryKey: ['project-admins', person.id],
      })

      queryClient.invalidateQueries({
        queryKey: ['project-admin-request', person.id, user.id],
      })
    },

    onError: (error) => {
      notifications.show({
        title: 'Ops!',
        message:
          error?.message ||
          'Não conseguimos solicitar acesso de admin a este projeto neste momento. Tente novamente em instantes.',
        color: 'red',
        position: 'top-center',
      })
    },
  })

  /*
   * ─────────────────────────────────────────────
   * IMAGE PATHS
   * ─────────────────────────────────────────────
   */

  const AVATAR_PATH =
    'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

  const AVATAR_MINI_PATH =
    'https://ik.imagekit.io/mublin/tr:h-35,c-maintain_ratio/users/avatars/'

  const PICTURE_AVATAR_SMALL_PATH = `https://ik.imagekit.io/mublin/projects/${person?.id}/tr:h-192,w-192,c-maintain_ratio/`
  const PICTURE_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${person?.id}/tr:h-220,w-220,c-maintain_ratio/`

  const PICTURE_AVATAR_LARGE_PATH = `https://ik.imagekit.io/mublin/projects/${person?.id}/tr:h-400,w-400,c-maintain_ratio/`

  /*
   * A capa agora é maior.
   *
   * Evitamos fixar 100px como anteriormente porque ela passa
   * a funcionar como parte real da identidade visual.
   */
  const PICTURE_COVER_PATH = `https://ik.imagekit.io/mublin/projects/${person?.id}/tr:h-500,w-1400,fo-top,c-maintain_ratio/`

  const DEFAULT_COVER_PICTURE =
    'https://ik.imagekit.io/mublin/bg/default-project-cover.png'

  /*
   * ─────────────────────────────────────────────
   * ERROR
   * ─────────────────────────────────────────────
   */

  if (isError) {
    return (
      <Container size="md" py="xl">
        <Text c="dimmed" ta="center">
          Projeto não encontrado.
        </Text>
      </Container>
    )
  }

  /*
   * ─────────────────────────────────────────────
   * HELPERS
   * ─────────────────────────────────────────────
   */

  const myAdminRequestStatus = myAdminRequest?.status ?? null

  const myAdminRequestIsPending = myAdminRequestStatus === ADMIN_REQUEST_STATUS.PENDING

  const handleOpenClaimModal = () => {
    if (!user?.id) {
      notifications.show({
        title: 'Faça login',
        message: 'Você precisa estar logado para solicitar acesso de admin.',
        color: 'red',
        position: 'top-center',
      })

      return
    }

    setEndorsementMessage('')
    openClaimModal()
  }

  const handleConfirmClaimRequest = () => {
    requestAdminMutation.mutate(endorsementMessage, {
      onSuccess: closeClaimModal,
    })
  }

  const validGenreNames =
    projectGenres?.map((g) => g?.genre?.name_ptbr || g?.name_ptbr).filter(Boolean) ?? []

  const hasValidGenres = validGenreNames.length > 0

  const shouldShowGenreBlock = loadingProjectGenres || hasValidGenres

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`${person?.name} | Página de pessoa | Mublin`}</title>
        <link rel="canonical" href={`https://mublin.com/person/${person?.name}`} />
        <meta
          name="description"
          content={`${person?.name} (${person?.type?.name_ptbr}) no Mublin`}
        />
        <meta
          property="og:image"
          content={
            person?.cover_picture ? PICTURE_COVER_PATH + person?.cover_picture : undefined
          }
        />
      </Helmet>

      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%" style={{ zIndex: 100 }}>
          <AppNavbarMobile pageName=" " transparent />
        </Affix>
      )}

      <Container fluid pb="xl" px={0} mt={{ base: 10, sm: 20 }}>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 9.5 }}>
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
            >
              <Box pos="relative" h={{ base: 200, sm: 200 }}>
                {isLoading ? (
                  <Skeleton h="100%" w="100%" />
                ) : (
                  <Image
                    src={
                      person?.cover_picture
                        ? PICTURE_COVER_PATH + person?.cover_picture
                        : DEFAULT_COVER_PICTURE
                    }
                    fallbackSrc="https://placehold.co/1400x500?text=."
                    h="100%"
                    w="100%"
                    fit="cover"
                    alt={`Capa de ${person?.name}`}
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

                {userIsAdmin && person?.id && (
                  <Button
                    component="a"
                    href={`/backstage/${person.id}`}
                    // target={`backstage-${person.id}`}
                    pos="absolute"
                    top={{ base: 30, sm: 20 }}
                    right={{ base: 20, sm: 20 }}
                    size="xs"
                    variant="white"
                    color="dark"
                    rightSection={<IconArrowUpRight size={14} />}
                    style={{
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,.12)',
                    }}
                  >
                    Backstage
                  </Button>
                )}

                {/*
                 * ─────────────────────────────────────────────
                 * PROJECT IDENTITY
                 * ─────────────────────────────────────────────
                 */}

                <Box
                  pos="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  px={{ base: 'md', sm: 'xl' }}
                  pb={{ base: 'md', sm: 'xl' }}
                >
                  <Flex gap={{ base: 'sm', sm: 'md' }} align="flex-end">
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
                            ? PICTURE_AVATAR_PATH + person?.picture
                            : PICTURE_AVATAR_SMALL_PATH + person?.picture
                        }
                        size={isMobile ? 76 : 96}
                        radius="lg"
                        onClick={openModal}
                        style={{
                          flexShrink: 0,
                          cursor: 'pointer',
                          // border: '2px solid rgba(255,255,255,.18)',
                          // border: '2px solid rgba(255,255,255,.4)',
                          boxShadow: '0 8px 30px rgba(0,0,0,.6)',
                        }}
                      />
                    )}

                    <Stack
                      gap={5}
                      pb={2}
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
                          <Group gap={7} wrap="nowrap">
                            <Title
                              order={1}
                              fz={{
                                base: 24,
                                sm: 32,
                              }}
                              fw={650}
                              c="white"
                              lts="-0.025em"
                              lineClamp={1}
                              lh={1}
                            >
                              {person?.name}
                            </Title>

                            {person?.is_verified && (
                              <IconRosetteDiscountCheckFilled
                                size={isMobile ? 21 : 25}
                                color="var(--mantine-color-mublinSecondary-2)"
                                title="Projeto verificado"
                                style={{
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </Group>

                          {person?.type && (
                            <Text size="sm" c="dimmed">
                              {person.type?.name_ptbr}
                            </Text>
                          )}

                          <ProjectProfileBadge projectId={person?.id} />
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

            <Tabs
              mx={{ base: 0, sm: 'md' }}
              value={activeTab}
              onChange={setActiveTab}
              mt="xs"
              mb="md"
              variant="default"
            >
              <Tabs.List>
                <Scroller>
                  <Tabs.Tab value="overview">Visão geral</Tabs.Tab>

                  <Tabs.Tab value="people">
                    Perfis associados{' '}
                    {projectPeople?.length > 0 && `(${projectPeople.length})`}
                  </Tabs.Tab>

                  {person?.is_active_in_business && (
                    <Tabs.Tab value="gigs">Gigs</Tabs.Tab>
                  )}
                </Scroller>
              </Tabs.List>
            </Tabs>

            {/*
             * ════════════════════════════════════════════════
             * OVERVIEW
             * ════════════════════════════════════════════════
             */}

            {activeTab === 'overview' && (
              <Container size="lg" px={{ base: 'sm', sm: 'md' }}>
                <SimpleGrid
                  cols={{
                    base: 1,
                    md: 3,
                  }}
                  spacing="md"
                  verticalSpacing="md"
                >
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
                    {/*
                     * ABOUT
                     */}

                    <Card withBorder radius="lg" px="lg" pt="lg" pb="sm">
                      <Title order={3} fw={600} size="17px" mb="xs">
                        Sobre
                      </Title>

                      {person?.description ? (
                        <Spoiler
                          mb={40}
                          maxHeight={64}
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
                            {person.description}
                          </Text>
                        </Spoiler>
                      ) : (
                        <Text size="sm" c="dimmed">
                          Descrição não disponível
                        </Text>
                      )}

                      {person?.instagram && (
                        <>
                          <Divider mt="md" />
                          <Group
                            mt="sm"
                            component="a"
                            href={`https://instagram.com/${person.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            justify="flex-start"
                            style={{
                              textDecoration: 'none',
                              color: 'inherit',
                              borderRadius: 'var(--mantine-radius-md)',
                              width: 'fit-content',
                            }}
                          >
                            <Group gap={6}>
                              <IconBrandInstagram size={18} />
                              <Text size="xs" lh={1} lineClamp={1}>
                                instagram.com/{person.instagram}
                              </Text>
                            </Group>
                          </Group>
                        </>
                      )}
                    </Card>

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
                                        {opening.role?.name_ptbr}
                                      </Text>

                                      {opening.is_remote && (
                                        <Badge size="xs" variant="light" color="blue">
                                          Remoto
                                        </Badge>
                                      )}

                                      {opening.is_paid && (
                                        <Badge size="xs" variant="light" color="green">
                                          Remunerado
                                        </Badge>
                                      )}
                                    </Group>

                                    {opening.engagement_type?.name_ptbr && (
                                      <Text size="xs" c="dimmed">
                                        {opening.engagement_type.name_ptbr}
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
                     * PEOPLE PREVIEW
                     */}

                    {recentProjectPeople.length > 0 && (
                      <Card withBorder radius="lg" p="lg">
                        <Title order={3} fw={600} size="17px" mb={6}>
                          Perfis associados recentemente
                        </Title>

                        <Stack gap="xs">
                          {recentProjectPeople.map((person) => (
                            <Paper key={person.id} radius="md" p="sm">
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
                                    lh={1.2}
                                    lineClamp={1}
                                    style={{
                                      textDecoration: 'none',
                                      color: 'inherit',
                                    }}
                                  >
                                    {person.profile?.full_name}
                                    {person.roles?.length > 0 && (
                                      <Text size="sm" span c="dimmed">
                                        {' '}
                                        (
                                        {person.roles
                                          ?.map((r) => r.role.name_ptbr)
                                          .join(', ')}
                                        )
                                      </Text>
                                    )}
                                  </Text>

                                  {/* <Text size="xs" c="dimmed" fw={500} lineClamp={1}>
                                    {person.roles
                                      ?.map((r) => r.role.name_ptbr)
                                      .join(', ')}
                                  </Text> */}

                                  <Text size="xs" c="dimmed" fw={300} lineClamp={1}>
                                    {person?.notes}
                                  </Text>
                                </Box>
                              </Group>
                            </Paper>
                          ))}
                        </Stack>

                        {projectPeople.length > 2 && (
                          <Button
                            mt="xs"
                            radius="md"
                            fullWidth
                            size="compact-xs"
                            variant="transparent"
                            color="var(--mantine-color-text)"
                            onClick={() => setActiveTab('people')}
                            rightSection={<IconArrowRight size={16} />}
                          >
                            Ver todas as pessoas
                          </Button>
                        )}
                      </Card>
                    )}

                    {/*
                     * INSPIRED
                     */}

                    {inspirated.length > 0 && (
                      <Card withBorder radius="lg" p="lg">
                        <Text size="sm" mb="md">
                          {inspirated.length === 1
                            ? `1 perfil se inspira no trabalho de ${person?.name}`
                            : `${inspirated.length} perfis se inspiram no trabalho de ${person?.name}`}
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
                  </Stack>

                  {/*
                   * ────────────────────────────────────────────
                   * SIDEBAR
                   * ────────────────────────────────────────────
                   */}

                  <Stack gap="md">
                    {/*
                     * PROJECT SNAPSHOT
                     */}

                    <Card withBorder radius="lg" p="lg">
                      <Stack gap="sm">
                        <Box>
                          <Text size="sm" c="dimmed" mb="xs">
                            {validGenreNames.length === 1 ? 'Gênero' : 'Gêneros'}
                          </Text>

                          {shouldShowGenreBlock && (
                            <Text size="sm">
                              {loadingProjectGenres
                                ? 'Carregando...'
                                : hasValidGenres
                                  ? validGenreNames.join(', ')
                                  : person.genre}
                            </Text>
                          )}
                        </Box>

                        {openProjectOpenings.length > 0 && (
                          <Group justify="space-between" gap="md">
                            <Text size="sm" c="dimmed">
                              Vagas abertas
                            </Text>

                            <Badge variant="light" color="mublinColor" size="sm">
                              {openProjectOpenings.length}
                            </Badge>
                          </Group>
                        )}

                        {person?.website && (
                          <Group justify="space-between" gap="md">
                            <Text size="sm" c="dimmed">
                              Site
                            </Text>

                            <Anchor
                              href={person?.website}
                              underline="hover"
                              fz="xs"
                              target="_blank"
                            >
                              {person?.website
                                .replace(/^https?:\/\/(www\.)?/, '')
                                .replace(/\/$/, '')}
                            </Anchor>
                          </Group>
                        )}
                      </Stack>
                    </Card>
                  </Stack>
                </SimpleGrid>
              </Container>
            )}

            {/*
             * ════════════════════════════════════════════════
             * PEOPLE
             * ════════════════════════════════════════════════
             */}

            {activeTab === 'people' && (
              <Stack gap="xl" px={{ base: 'sm', sm: 'md' }} mt="xl">
                {person?.id && (
                  <Box>
                    <Title order={3} fz="lg" fw={600} mb="xs">
                      Perfil pessoal no Mublin
                    </Title>
                    <ProjectProfileBadge projectId={person?.id} />
                  </Box>
                )}

                <Box>
                  <Title order={3} fz="lg" fw={600} mb="xs">
                    Administradores
                  </Title>

                  {loadingProjectAdmins ? (
                    <Skeleton h={60} radius="md" />
                  ) : projectAdmins.length > 0 ? (
                    <Group gap="sm">
                      {projectAdmins.map((person) => (
                        <Paper key={person.id} withBorder radius="md" p="sm">
                          <Group gap="sm">
                            <Avatar
                              component={Link}
                              to={`/${person?.profile?.username}`}
                              size={38}
                              src={`${AVATAR_MINI_PATH}${person?.profile?.avatar}`}
                            />

                            <Box>
                              <Text size="sm" fw={500}>
                                {person?.profile?.full_name}
                              </Text>

                              <Text size="xs" c="dimmed">
                                @{person?.profile?.username}
                              </Text>
                            </Box>
                          </Group>
                        </Paper>
                      ))}
                    </Group>
                  ) : userIsAdmin ? null : myAdminRequestIsPending ? (
                    <Text c="dimmed" size="sm">
                      Nenhum administrador associado a esta página. Sua solicitação está
                      sendo processada
                    </Text>
                  ) : (
                    <Text c="dimmed" size="sm">
                      Nenhum administrador associado a esta página
                    </Text>
                  )}
                  <Text c="dimmed" size="xs">
                    Você é esta pessoa ou faz parte do staff?{' '}
                    <Text
                      span
                      fw={500}
                      c="var(--mantine-color-text)"
                      style={{
                        cursor: 'pointer',
                      }}
                      onClick={handleOpenClaimModal}
                    >
                      Quero ser administrador
                    </Text>
                  </Text>
                </Box>

                <Box>
                  <Title order={3} fz="lg" fw={600} mb="xs">
                    Perfis associados
                  </Title>

                  {loadingProjectPeople ? (
                    <SimpleGrid
                      cols={{
                        base: 2,
                        sm: 3,
                        md: 4,
                      }}
                    >
                      {[1, 2, 3, 4].map((item) => (
                        <Skeleton key={item} h={160} radius="lg" />
                      ))}
                    </SimpleGrid>
                  ) : projectPeople.length > 0 ? (
                    <SimpleGrid
                      cols={{
                        base: 2,
                        sm: 3,
                        md: 4,
                      }}
                      spacing="sm"
                    >
                      {projectPeople.map((person) => (
                        <Paper
                          key={person.id}
                          withBorder
                          radius="lg"
                          p="sm"
                          pos="relative"
                        >
                          {userIsAdmin && (
                            <ActionIcon
                              pos="absolute"
                              top={8}
                              right={8}
                              variant="subtle"
                              color="gray"
                              aria-label="Editar pessoa"
                              component={Link}
                              to="/settings/portfolio"
                            >
                              <IconPencil size={15} />
                            </ActionIcon>
                          )}

                          <Stack gap={5} align="center">
                            <Avatar
                              component={Link}
                              to={`/${person?.profile?.username}`}
                              size={64}
                              src={`${AVATAR_PATH}${person.profile?.avatar}`}
                            />

                            <Text
                              component={Link}
                              to={`/${person?.profile?.username}`}
                              fz="13px"
                              fw={600}
                              ta="center"
                              lineClamp={1}
                              style={{
                                textDecoration: 'none',
                                color: 'inherit',
                              }}
                            >
                              {person.profile.full_name}
                            </Text>

                            {person.engagement_types?.length > 0 && (
                              <Badge size="xs" fw={400} variant="light">
                                {person.engagement_types
                                  .map((e) => e.engagement_type.name_ptbr)
                                  .join(', ')}
                              </Badge>
                            )}

                            <Text fz="11px" ta="center" c="dimmed" lh={1.2} lineClamp={2}>
                              {person.roles?.map((r) => r.role.name_ptbr).join(', ')}
                            </Text>

                            <Text fz="11px" ta="center" opacity={0.7}>
                              {person.year_start}
                              {person.year_end && ` › ${person.year_end}`}
                            </Text>
                          </Stack>
                        </Paper>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Text c="dimmed" size="sm">
                      Nenhum perfil associado a esta página até o momento
                    </Text>
                  )}
                </Box>
              </Stack>
            )}

            {/*
             * ════════════════════════════════════════════════
             * GIGS
             * ════════════════════════════════════════════════
             */}

            {activeTab === 'gigs' && (
              <Container size="lg" px={{ base: 'sm', sm: 'md' }}>
                <Card withBorder radius="lg" p="lg">
                  <Title order={3} fz="lg" fw={600} mb="sm">
                    Gigs
                  </Title>

                  <Text c="dimmed" size="sm">
                    Nenhuma gig desta pessoa cadastrada no momento
                  </Text>
                </Card>
              </Container>
            )}
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2.5 }}>
            <SimilarProjects projectId={person?.id} title="Veja também" />
          </Grid.Col>
        </Grid>
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
              src={PICTURE_AVATAR_LARGE_PATH + person?.picture}
              alt={person?.name}
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

      {/*
       * ════════════════════════════════════════════════
       * CLAIM PROJECT MODAL
       * ════════════════════════════════════════════════
       */}

      <Modal
        opened={claimModalOpened}
        onClose={closeClaimModal}
        title="Solicitar acesso de administrador"
        centered
      >
        <Stack gap="sm">
          <Text size="sm">
            Como administrador, você poderá editar as informações do projeto, publicar
            vagas e aprovar outras pessoas como staff ou demais administradores.
          </Text>

          {loadingClaimPolicy ? (
            <Skeleton h={44} radius="md" />
          ) : (
            <Paper withBorder radius="md" p="xs">
              <Group gap={8} wrap="nowrap" align="flex-start">
                <IconInfoCircle
                  color="orange"
                  size={24}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <Text size="xs">
                  {claimPolicyError
                    ? 'Não foi possível carregar a regra de aprovação. Sua solicitação será analisada pela curadoria do Mublin.'
                    : formatClaimPolicyMessage(claimPolicy)}
                </Text>
              </Group>
            </Paper>
          )}

          {claimPolicy?.associates_count > 0 && (
            <Text size="xs" c="dimmed">
              Este projeto já aparece no portfólio de {claimPolicy.associates_count}{' '}
              pessoa
              {claimPolicy.associates_count > 1 ? 's' : ''} — isso será considerado para
              sua aprovação.
            </Text>
          )}

          <Textarea
            label="Mensagem (opcional)"
            placeholder="Conte brevemente por que você deveria administrar este projeto..."
            value={endorsementMessage}
            onChange={(e) => setEndorsementMessage(e.currentTarget.value)}
            maxLength={500}
            autosize
            minRows={2}
            maxRows={5}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={closeClaimModal}>
              Cancelar
            </Button>

            <Button
              color="mublinColor"
              loading={requestAdminMutation.isPending}
              onClick={handleConfirmClaimRequest}
            >
              Solicitar acesso
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
