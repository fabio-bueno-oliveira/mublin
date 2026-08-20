import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchProjectDetails,
  fetchprojectsInspirated,
  fetchProjectAdmins,
  fetchProjectPeople,
  fetchMyProjectAdminRequest,
  requestProjectAdminAccess,
  fetchProjectClaimPolicy,
} from '../queries/projects'
import { fetchOpenProjectOpenings } from '../queries/projectOpenings'
// prettier-ignore
import {
  Container, Flex, Group, Box, Stack, em,
  Center,
  Skeleton,
  Modal, Affix,
  SimpleGrid,
  Button, Badge,
  Avatar, Image,
  Title, Text,
  Textarea,
  Card, Paper,
  Scroller,
  Tabs,
  Tooltip,
  Popover,
} from '@mantine/core'
import { useMediaQuery, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconBrandInstagram,
  IconBrandSpotify,
  IconBrandSoundcloud,
  IconRoad,
  IconInfoCircle,
  IconRosetteDiscountCheckFilled,
  IconArrowUpRight,
} from '@tabler/icons-react'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { MEMBER_REQUEST_STATUS } from '../constants/projects'

// TODO: mover para '../constants/projects', ao lado de MEMBER_REQUEST_STATUS,
// já que reflete os mesmos IDs de applications_statuses (1 pendente, 2 aceito, 3 recusado)
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
  return `Sua solicitação ficará pendente de aprovação da curadoria do Mublin, ou será aprovada automaticamente em até ${timeLabel} caso ninguém conteste.`
}

export default function Project() {
  const { user } = useAuth()
  const { slug } = useParams()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('about')
  const [opened, { open: openModal, close: closeModal }] = useDisclosure(false)

  const [profileDetailOpened, { open: openProfileDetail, close: closeProfileDetail }] =
    useDisclosure(false)

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

  const { data: inspirated = [] } = useQuery({
    queryKey: ['project-admins', project?.id],
    queryFn: () => fetchprojectsInspirated(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: projectAdmins = [], isLoading: loadingProjectAdmins } = useQuery({
    queryKey: ['project-admins', project?.id],
    queryFn: () => fetchProjectAdmins(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: projectPeople = [], isLoading: loadingProjectPeople } = useQuery({
    queryKey: ['project-people', project?.id],
    queryFn: () => fetchProjectPeople(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  // Solicitação de acesso admin do próprio usuário logado (se houver)
  const { data: myAdminRequest } = useQuery({
    queryKey: ['project-admin-request', project?.id, user?.id],
    queryFn: () => fetchMyProjectAdminRequest(project?.id, user?.id),
    enabled: !!project?.id && !!user?.id,
    staleTime: 1000 * 30,
  })

  const [claimModalOpened, { open: openClaimModal, close: closeClaimModal }] =
    useDisclosure(false)
  const [endorsementMessage, setEndorsementMessage] = useState('')

  const { data: claimPolicy, isLoading: loadingClaimPolicy } = useQuery({
    queryKey: ['project-claim-policy', project?.id],
    queryFn: () => fetchProjectClaimPolicy(project?.id),
    enabled: !!project?.id && claimModalOpened, // só busca quando o modal abre
    staleTime: 1000 * 60,
  })

  // Vagas abertas do projeto — exibição pública na aba "Vagas"
  const { data: openProjectOpenings = [], isLoading: loadingOpenProjectOpenings } =
    useQuery({
      queryKey: ['project-openings-open', project?.id],
      queryFn: () => fetchOpenProjectOpenings(project?.id),
      enabled: !!project?.id,
      staleTime: 1000 * 60,
    })

  const requestAdminMutation = useMutation({
    mutationFn: (message) => requestProjectAdminAccess(project.id, message),
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
      queryClient.invalidateQueries({ queryKey: ['project', slug] })
      queryClient.invalidateQueries({ queryKey: ['project-admins', project.id] })
      queryClient.invalidateQueries({
        queryKey: ['project-admin-request', project.id, user.id],
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

  const AVATAR_PATH =
    'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
  const AVATAR_MINI_PATH =
    'https://ik.imagekit.io/mublin/tr:h-35,c-maintain_ratio/users/avatars/'
  const PICTURE_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-220,w-220,c-maintain_ratio/`
  const PICTURE_AVATAR_LARGE_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-400,w-400,c-maintain_ratio/`
  const PICTURE_COVER_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-100,w-1042,fo-top,c-maintain_ratio/`
  const DEFAULT_COVER_PICTURE =
    'https://ik.imagekit.io/mublin/bg/default-project-cover.png'

  if (isError) {
    return (
      <Container size="md" py="xl">
        <Text c="dimmed" ta="center">
          Projeto não encontrado.
        </Text>
      </Container>
    )
  }

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
    requestAdminMutation.mutate(endorsementMessage)
    closeClaimModal()
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`${project?.name} ·${project?.project_type} · Mublin`}</title>
        <link rel="canonical" href={`https://mublin.com/project/${project?.name}`} />
        <meta name="description" content={`${project?.name} no Mublin`} />
        <meta
          property="og:image"
          content={
            project?.cover_picture
              ? PICTURE_COVER_PATH + project?.cover_picture
              : undefined
          }
        />
      </Helmet>

      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%">
          <AppNavbarMobile
            pageName={` `}
            transparent
            // profile={profile}
          />
        </Affix>
      )}

      <Container fluid pb="lg" px={0} mt={{ base: 0, sm: 0 }}>
        <Card
          mx={{ base: 0, sm: 'md' }}
          mt={{ base: 0, sm: 'xs' }}
          mb="xs"
          px={0}
          pt={0}
          pb="sm"
          radius={{ base: false, sm: 'lg' }}
        >
          {/* ── Cabeçalho / Cover ── */}
          <Box pos="relative" mb={44}>
            {/* Imagem de capa */}
            {isLoading ? (
              <Skeleton height={140} radius="md" />
            ) : (
              <Image
                src={
                  project?.cover_picture
                    ? PICTURE_COVER_PATH + project?.cover_picture
                    : DEFAULT_COVER_PICTURE
                }
                fallbackSrc="https://placehold.co/1042x100?text=."
                height={100}
                radius={false}
                fit="cover"
                w="100%"
                alt="Imagem de capa"
              />
            )}

            {/* Gradiente escuro sobre a capa (sempre por cima da imagem) */}
            <Box
              pos="absolute"
              bottom={0}
              left={0}
              right={0}
              h={70}
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.40) 35%, rgba(0,0,0,0.8) 100%)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            {/* Avatar do projeto sobreposto */}
            <Flex
              w={{ base: '90%', sm: '94%' }}
              pos="absolute"
              justify="space-between"
              bottom={{ base: -32, sm: -30 }}
              left={{ base: 18, sm: 20 }}
              style={{ zIndex: 2 }}
            >
              {isLoading ? (
                <Skeleton height={isMobile ? 80 : 110} width={isMobile ? 80 : 110} />
              ) : (
                <Avatar
                  src={PICTURE_AVATAR_PATH + project?.picture}
                  size={isMobile ? 80 : 110}
                  onClick={openModal}
                  radius="lg"
                  style={{
                    boxShadow: '-1px -1px 19px -3px rgba(0,0,0,0.85)',
                  }}
                />
              )}
              {userIsAdmin && project?.id && (
                <Button
                  component="a"
                  href={`/backstage/${project.id}`}
                  target={`backstage-${project.id}`}
                  size="xs"
                  w="fit-content"
                  rightSection={<IconArrowUpRight size={16} />}
                  mt={{ base: 6, sm: 30 }}
                >
                  Backstage
                </Button>
              )}
            </Flex>
          </Box>

          {/* ── Identidade ── */}
          <Flex justify="space-between" align="flex-start" wrap="wrap" gap="sm" px="lg">
            <Stack gap={3}>
              {isLoading ? (
                <>
                  <Skeleton height={28} width={200} />
                  <Skeleton height={16} width={120} mt={4} />
                </>
              ) : (
                <>
                  <Group gap={6}>
                    <Title order={1} fz="h2" fw={600} lts="-0.01em">
                      {project?.name}
                    </Title>
                    {project?.is_verified && (
                      <IconRosetteDiscountCheckFilled
                        size={24}
                        color="var(--mantine-color-text)"
                        title="Projeto verificado"
                      />
                    )}
                    {project?.on_tour && (
                      <Badge size="xs" color="dark" leftSection={<IconRoad size={18} />}>
                        Em turnê
                      </Badge>
                    )}
                  </Group>
                  <Group w="100%" gap={8} align="center">
                    {project?.project_type && (
                      <Text size="sm" c="dimmed">
                        {project.project_type}
                      </Text>
                    )}
                    {project?.genre && (
                      <>
                        <Text size="sm" opacity={0.4} style={{ cursor: 'default' }}>
                          ·
                        </Text>
                        <Text size="sm" c="dimmed">
                          {project.genre}
                        </Text>
                      </>
                    )}
                  </Group>
                </>
              )}
              {/* {project?.status?.description_ptbr && (
                <Badge color={project?.status?.color} variant="dot" size="xs" mt={8}>
                  {project?.status?.description_ptbr}
                </Badge>
              )} */}
            </Stack>
          </Flex>
          {projectPeople.length > 0 && (
            <Avatar.Group px="xl" mt="xs">
              {projectPeople.map((person) => (
                <Link to={`/${person.profile?.username}`} key={person.profile.id}>
                  <Tooltip label={person.profile?.username} withArrow>
                    <Avatar size={40} src={`${AVATAR_PATH}${person.profile.avatar}`} />
                  </Tooltip>
                </Link>
              ))}
            </Avatar.Group>
          )}
        </Card>

        <Tabs
          mx={{ base: 0, sm: 'md' }}
          variant="default"
          mb="md"
          value={activeTab}
          onChange={setActiveTab}
        >
          <Tabs.List>
            <Scroller>
              <Tabs.Tab value="about">Sobre</Tabs.Tab>
              <Tabs.Tab value="people">
                Pessoas associadas ({projectPeople.length})
              </Tabs.Tab>
              <Tabs.Tab value="discography">Discografia</Tabs.Tab>
              <Tabs.Tab value="jobs">Vagas</Tabs.Tab>
              <Tabs.Tab value="gigs">Gigs</Tabs.Tab>
              <Tabs.Tab value="social">Redes sociais</Tabs.Tab>
              <Tabs.Tab value="inspirated">Inspirados</Tabs.Tab>
            </Scroller>
          </Tabs.List>
        </Tabs>

        {activeTab === 'about' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600} mb="xs">
              Visão geral
            </Title>
            <Text size="sm">
              {project?.description ? (
                project.description
              ) : (
                <Text span c="dimmed">
                  Descrição não disponível
                </Text>
              )}
            </Text>

            {project?.purpose && (
              <>
                <Title order={5} fw={600} mt="md" mb="xs">
                  Objetivo do projeto
                </Title>
                <Text size="sm">{project.purpose}</Text>
              </>
            )}
          </Card>
        )}

        {activeTab === 'people' && (
          <>
            <Tabs mx="md" color="dark" variant="outline" defaultValue="associated">
              <Tabs.List>
                <Tabs.Tab value="associated">Pessoas ({projectPeople?.length})</Tabs.Tab>
                <Tabs.Tab value="admins">
                  Admins & Staff ({projectAdmins?.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="associated" pt="md">
                {loadingProjectPeople ? (
                  <Text size="sm">Carregando...</Text>
                ) : (
                  <>
                    {projectPeople.length > 0 ? (
                      <SimpleGrid
                        cols={{ base: 2, sm: 3, md: 5 }}
                        spacing="sm"
                        verticalSpacing="sm"
                      >
                        {projectPeople.map((person) => (
                          <Paper
                            key={person.id}
                            withBorder
                            radius="md"
                            p="sm"
                            component={Link}
                            to={`/${person?.profile?.username}`}
                            style={{
                              textDecoration: 'none',
                              color: 'inherit',
                              transition: 'box-shadow 150ms ease, transform 150ms ease',
                            }}
                            className="person-card"
                          >
                            <Stack gap={4} align="center">
                              <Avatar
                                size={56}
                                src={`${AVATAR_PATH}${person.profile.avatar}`}
                              />
                              <Text fz="13px" fw={500} ta="center" lineClamp={1}>
                                {person.profile.full_name}
                              </Text>
                              <Badge size="xs" fw={300} variant="light">
                                {person.engagement_types
                                  .map((e) => e.engagement_type.name_ptbr)
                                  .join(', ')}
                              </Badge>
                              <Text
                                fz="11px"
                                ta="center"
                                c="dimmed"
                                lh={1.2}
                                lineClamp={2}
                              >
                                {person.roles.map((r) => r.role.name_ptbr).join(', ')}
                              </Text>
                              <Text fz="11px" ta="center" opacity={0.7}>
                                {person.year_start} ›{' '}
                                {person.year_end ? person.year_end : 'Atualmente'}
                              </Text>
                            </Stack>
                          </Paper>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Text span c="dimmed" size="sm">
                        Nenhum perfil associado a este projeto até o momento
                      </Text>
                    )}
                  </>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="admins" pt="md">
                <Stack gap="xs" mx="md" mb="md">
                  {loadingProjectAdmins ? (
                    <Text size="sm">Carregando...</Text>
                  ) : (
                    <>
                      {projectAdmins.length > 0 ? (
                        <Scroller>
                          <Group gap="xs" wrap="nowrap">
                            {projectAdmins.map((person) => (
                              <Flex
                                key={person.id}
                                gap={6}
                                direction="column"
                                w={85}
                                justify="center"
                              >
                                <Center>
                                  <Link to={`/${person?.profile?.username}`}>
                                    <Avatar
                                      size={35}
                                      src={`${AVATAR_MINI_PATH}${person?.profile?.avatar}`}
                                    />
                                  </Link>
                                </Center>
                                <Text size="11px" ta="center" truncate="end">
                                  {person?.profile?.full_name}
                                </Text>
                              </Flex>
                            ))}
                          </Group>
                        </Scroller>
                      ) : userIsAdmin ? null : myAdminRequestIsPending ? (
                        <Text span c="dimmed" size="sm">
                          Nenhum administrador neste projeto. Sua solicitação está sendo
                          processada.
                        </Text>
                      ) : (
                        <Text span c="dimmed" size="sm">
                          Nenhum administrador neste projeto.{' '}
                          <Text
                            span
                            fw={600}
                            c="var(--mantine-color-text)"
                            style={{ cursor: 'pointer' }}
                            onClick={handleOpenClaimModal}
                          >
                            Quero ser administrador
                          </Text>
                        </Text>
                      )}
                    </>
                  )}
                </Stack>
              </Tabs.Panel>
            </Tabs>
            {/* <Group mx="md">
              <Text fw={600} size="18px">
                Pessoas associadas
              </Text>
              <Text fw={600} size="18px">
                Administradores
              </Text>
            </Group> */}
          </>
        )}

        {activeTab === 'discography' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600} mb="xs">
              Discografia
            </Title>
            <Text span c="dimmed" size="sm">
              Nenhum álbum cadastrado para este projeto no momento
            </Text>
          </Card>
        )}

        {activeTab === 'jobs' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600} mb="xs">
              Vagas
            </Title>

            {loadingOpenProjectOpenings ? (
              <Stack gap="xs">
                {[1, 2].map((i) => (
                  <Skeleton key={i} h={58} radius="md" />
                ))}
              </Stack>
            ) : openProjectOpenings.length > 0 ? (
              <Stack gap="sm">
                {openProjectOpenings.map((opening) => (
                  <Paper key={opening.id} withBorder radius="md" p="sm">
                    <Group gap={6} wrap="wrap" mb={opening.description ? 4 : 0}>
                      <Text size="lg" fw={600}>
                        {opening.role?.name_ptbr}
                      </Text>
                      {opening.is_remote && (
                        <Badge size="xs" variant="light" color="blue">
                          Remoto
                        </Badge>
                      )}
                    </Group>
                    {opening.engagement_type?.name_ptbr && (
                      <Text size="xs" c="dimmed">
                        Vínculo desejado: {opening.engagement_type?.name_ptbr}
                      </Text>
                    )}
                    {opening.description && (
                      <Text size="xs" c="dimmed">
                        {opening.description}
                      </Text>
                    )}
                    {opening.is_paid && (
                      <Badge color="green" variant="outline" size="xs">
                        Remunerado
                        {opening.rate_type?.name_ptbr
                          ? ` · ${opening.rate_type.name_ptbr}`
                          : ''}
                      </Badge>
                    )}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text span c="dimmed" size="sm">
                Nenhuma vaga para este projeto no momento
              </Text>
            )}
          </Card>
        )}

        {activeTab === 'gigs' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600} mb="xs">
              Gigs
            </Title>
            <Text span c="dimmed" size="sm">
              Nenhuma gig deste projeto cadastrada no momento
            </Text>
          </Card>
        )}

        {activeTab === 'social' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600} mb="md">
              Redes sociais
            </Title>

            <Stack gap="sm">
              {project?.instagram && (
                <Group
                  gap={4}
                  component="a"
                  href={`https://instagram.com/${project.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  pl={6}
                >
                  <IconBrandInstagram color="pink" stroke={1.5} size={25} />
                  <Stack pl={6} gap={2}>
                    <Text size="sm" fw={600} tt="capitalize">
                      Instagram
                    </Text>
                    <Text size="xs" truncate="end" c="dimmed">
                      {`https://instagram.com/${project.instagram}`.replace(
                        /^https?:\/\//,
                        '',
                      )}
                    </Text>
                  </Stack>
                </Group>
              )}
              {project?.spotify_id && (
                <Group
                  gap={4}
                  component="a"
                  href={`https://open.spotify.com/artist/${project.spotify_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  pl={6}
                >
                  <IconBrandSpotify color="#1ED760" stroke={1.5} size={25} />
                  <Stack pl={6} gap={2}>
                    <Text size="sm" fw={600} tt="capitalize">
                      Spotify
                    </Text>
                    <Text size="xs" truncate="end" c="dimmed">
                      {`https://open.spotify.com/artist/${project.spotify_id}`.replace(
                        /^https?:\/\//,
                        '',
                      )}
                    </Text>
                  </Stack>
                </Group>
              )}
              {project?.soundcloud && (
                <Group
                  gap={4}
                  component="a"
                  href={`https://soundcloud.com/${project.soundcloud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  pl={6}
                >
                  <IconBrandSoundcloud color="#FF5500" stroke={1.5} size={25} />
                  <Stack pl={6} gap={2}>
                    <Text size="sm" fw={600} tt="capitalize">
                      SoundCloud
                    </Text>
                    <Text size="xs" truncate="end" c="dimmed">
                      {`https://soundcloud.com/${project.soundcloud}`.replace(
                        /^https?:\/\//,
                        '',
                      )}
                    </Text>
                  </Stack>
                </Group>
              )}
            </Stack>

            {!project?.instagram && !project?.spotify_id && !project?.soundcloud && (
              <Text span c="dimmed" size="sm">
                Não disponível
              </Text>
            )}
          </Card>
        )}

        {activeTab === 'inspirated' && (
          <>
            {inspirated.length > 0 && (
              <Card mx={{ base: 0, sm: 'md' }}>
                <>
                  <Text span c="dimmed" size="sm" mb="sm">
                    Pessoas que se inspiram no trabalho de {project?.name}
                  </Text>
                  <Group wrap="wrap">
                    {inspirated.map((item) => (
                      <Popover
                        key={item.id}
                        width={100}
                        position="bottom"
                        withArrow
                        shadow="md"
                        opened={profileDetailOpened}
                      >
                        <Popover.Target>
                          <Link to={`/${item.profiles?.username}`}>
                            <Avatar
                              size={40}
                              onMouseEnter={openProfileDetail}
                              onMouseLeave={closeProfileDetail}
                              radius="xl"
                              src={
                                item.profiles?.avatar
                                  ? AVATAR_PATH + item.profiles?.avatar
                                  : `https://api.dicebear.com/10.x/initials/svg?seed=${item.profiles?.full_name}`
                              }
                              title={item.profiles?.full_name}
                            />
                          </Link>
                        </Popover.Target>
                        <Popover.Dropdown style={{ pointerEvents: 'none' }} p={10}>
                          <Text size="xs" fw={500}>
                            @{item.profiles?.username}
                          </Text>
                          <Text size="10px" c="dimmed">
                            {item.profiles?.title}
                          </Text>
                        </Popover.Dropdown>
                      </Popover>
                    ))}
                  </Group>
                </>
              </Card>
            )}
          </>
        )}
      </Container>

      <Modal.Root opened={opened} onClose={closeModal} size="auto" centered>
        <Modal.Overlay backgroundOpacity={0.85} blur={3} />
        <Modal.Content>
          <Modal.Body p={0}>
            <img
              src={PICTURE_AVATAR_LARGE_PATH + project?.picture}
              alt={project?.name}
              style={{ display: 'block', width: 'inherit' }}
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
                <Text size="xs">{formatClaimPolicyMessage(claimPolicy)}</Text>
              </Group>
            </Paper>
          )}

          {claimPolicy?.associates_count > 0 && (
            <Text size="xs" c="dimmed">
              Este projeto já aparece no portfólio de {claimPolicy.associates_count}{' '}
              pessoa{claimPolicy.associates_count > 1 ? 's' : ''} — isso será considerado
              para sua aprovação.
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
