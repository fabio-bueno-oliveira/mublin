import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import {
  fetchProjectProfile,
  fetchProjectAdmins,
  fetchProjectPeople,
  updateProjectProfile,
  fetchProjectAdminRequests,
  fetchMyProjectAdminRequest,
  requestProjectAdminAccess,
  respondProjectAdminRequest,
} from '../queries/projects'
import {
  useMantineColorScheme,
  Skeleton,
  Container,
  SimpleGrid,
  Affix,
  Flex,
  Box,
  Avatar,
  Button,
  Image,
  Title,
  Text,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  FileInput,
  Badge,
  Group,
  Stack,
  Tabs,
  Card,
  Paper,
  Scroller,
  Center,
  Tooltip,
  Modal,
  em,
  Divider,
} from '@mantine/core'
import { useMediaQuery, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { upload } from '@imagekit/react'
import {
  IconBrandInstagram,
  IconBrandSpotify,
  IconBrandSoundcloud,
  IconSettings,
  IconRoad,
  IconCamera,
  IconTrash,
  IconCheck,
  IconX,
  IconClock,
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

// ── Helpers de upload (ImageKit) ──────────────────────────
async function getIkAuthTokens() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const authRes = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  })
  if (!authRes.ok) {
    throw new Error('Falha na autenticação do ImageKit')
  }
  return { session, ...(await authRes.json()) }
}

async function uploadToImageKit({ file, fileName, folder, tags, onProgress }) {
  const { token: ikToken, expire, signature } = await getIkAuthTokens()
  return upload({
    file,
    fileName,
    folder,
    tags,
    useUniqueFileName: true,
    publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
    token: ikToken,
    expire,
    signature,
    onProgress: (e) => onProgress(Math.round((e.loaded / e.total) * 100)),
  })
}

// ── Fetch: opções de status de atividade do projeto ──────
// TODO: mover para '../queries/projects', ao lado das demais funções de
// fetch/mutation do projeto, para manter o padrão do restante do arquivo.
async function fetchProjectStatuses() {
  const { data, error } = await supabase
    .from('project_statuses')
    .select('id, description_ptbr, color')
    .order('id', { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export default function Project() {
  const { user } = useAuth()
  const { slug } = useParams()
  const { colorScheme } = useMantineColorScheme()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('about')
  const [opened, { open: openModal, close: closeModal }] = useDisclosure(false)

  // ── Edição do projeto (aba Admin) ──
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    purpose: '',
    on_tour: false,
    activity_status: null,
  })
  const [pictureFile, setPictureFile] = useState(null)
  const [picturePreview, setPicturePreview] = useState(null)
  const [pictureUploadProgress, setPictureUploadProgress] = useState(0)
  const [editFormProjectId, setEditFormProjectId] = useState(null)

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => fetchProjectProfile(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const userMembership = project?.members?.find((m) => m.profile_id === user?.id)
  const userIsAdmin =
    userMembership?.is_admin === true &&
    userMembership?.status === MEMBER_REQUEST_STATUS.ACCEPTED

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

  // Opções de status de atividade do projeto (lookup table, muda raramente)
  const { data: projectStatuses = [], isLoading: loadingProjectStatuses } = useQuery({
    queryKey: ['project-statuses'],
    queryFn: fetchProjectStatuses,
    staleTime: 1000 * 60 * 60,
  })

  const projectStatusOptions = projectStatuses.map((status) => ({
    value: String(status.id),
    label: status.description_ptbr,
  }))

  // Solicitação de acesso admin do próprio usuário logado (se houver)
  const { data: myAdminRequest, isLoading: loadingMyAdminRequest } = useQuery({
    queryKey: ['project-admin-request', project?.id, user?.id],
    queryFn: () => fetchMyProjectAdminRequest(project?.id, user?.id),
    enabled: !!project?.id && !!user?.id,
    staleTime: 1000 * 30,
  })

  const { data: pendingAdminRequests = [], isLoading: loadingPendingAdminRequests } =
    useQuery({
      queryKey: ['project-admin-requests', project?.id],
      queryFn: () => fetchProjectAdminRequests(project?.id),
      enabled: !!project?.id && userIsAdmin,
      staleTime: 1000 * 30,
    })

  // Ajusta o editForm durante a própria renderização quando o projeto muda
  // (em vez de um useEffect). React trata esse "setState durante a
  // renderização" de forma especial: ele reinicia o render com o novo estado
  // antes de pintar a tela, então não há commit intermediário nem cascata de
  // renders extra como aconteceria com um useEffect.
  // Ref: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (project && project.id !== editFormProjectId) {
    setEditFormProjectId(project.id)
    setEditForm({
      name: project.name || '',
      description: project.description || '',
      purpose: project.purpose || '',
      on_tour: !!project.on_tour,
      activity_status:
        project.activity_status != null ? String(project.activity_status) : null,
    })
  }

  // Libera a URL de preview criada com createObjectURL ao trocar/desmontar
  useEffect(() => {
    return () => {
      if (picturePreview) {
        URL.revokeObjectURL(picturePreview)
      }
    }
  }, [picturePreview])

  const updateProjectMutation = useMutation({
    mutationFn: async () => {
      const updates = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        purpose: editForm.purpose.trim() || null,
        on_tour: editForm.on_tour,
        activity_status: editForm.activity_status
          ? Number(editForm.activity_status)
          : null,
      }

      if (pictureFile) {
        setPictureUploadProgress(0)
        const res = await uploadToImageKit({
          file: pictureFile,
          fileName: `${project.slug || 'project'}_.jpg`,
          folder: `/projects/${project.id}/`,
          tags: ['project', 'picture'],
          onProgress: setPictureUploadProgress,
        })
        updates.picture = res.filePath.split('/').pop()
      }

      return updateProjectProfile(project.id, updates)
    },
    onSuccess: () => {
      notifications.show({
        title: 'Projeto atualizado',
        message: 'As informações do projeto foram salvas com sucesso.',
        color: 'green',
        position: 'top-center',
      })
      queryClient.invalidateQueries({ queryKey: ['project', slug] })
      if (picturePreview) {
        URL.revokeObjectURL(picturePreview)
      }
      setPictureFile(null)
      setPicturePreview(null)
      setPictureUploadProgress(0)
    },
    onError: (error) => {
      notifications.show({
        title: 'Erro ao salvar',
        message:
          error?.message ||
          'Não foi possível salvar as alterações do projeto. Tente novamente.',
        color: 'red',
        position: 'top-center',
      })
      setPictureUploadProgress(0)
    },
  })

  const requestAdminMutation = useMutation({
    mutationFn: () => requestProjectAdminAccess(project.id),
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

  const respondAdminRequestMutation = useMutation({
    mutationFn: ({ requestId, accept }) => respondProjectAdminRequest(requestId, accept),
    onSuccess: (_data, variables) => {
      notifications.show({
        title: variables.accept ? 'Solicitação aceita' : 'Solicitação recusada',
        message: variables.accept
          ? 'O usuário agora é administrador do projeto.'
          : 'A solicitação foi recusada.',
        color: variables.accept ? 'green' : 'gray',
        position: 'top-center',
      })
      queryClient.invalidateQueries({ queryKey: ['project', slug] })
      queryClient.invalidateQueries({ queryKey: ['project-admins', project.id] })
      queryClient.invalidateQueries({ queryKey: ['project-admin-requests', project.id] })
    },
    onError: (error) => {
      notifications.show({
        title: 'Erro ao responder solicitação',
        message: error?.message || 'Tente novamente em instantes.',
        color: 'red',
        position: 'top-center',
      })
    },
  })

  const handleEditFormChange = (field) => (event) => {
    // Importante: extraia o valor AQUI, de forma síncrona, e não dentro do
    // callback de atualização do setState. O React zera event.currentTarget
    // logo após o handler do evento terminar, então se a leitura for feita
    // dentro da função de atualização (que pode rodar em um momento
    // posterior), event.currentTarget já estará null.
    const { value } = event.currentTarget
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleOnTourChange = (event) => {
    // Checkbox usa .checked, não .value — mesmo cuidado de extrair antes do setState
    const { checked } = event.currentTarget
    setEditForm((prev) => ({ ...prev, on_tour: checked }))
  }

  const handleActivityStatusChange = (value) => {
    // Select do Mantine chama onChange já com o valor (string) ou null,
    // diferente de TextInput/Textarea, que disparam um evento nativo
    setEditForm((prev) => ({ ...prev, activity_status: value }))
  }

  const handlePictureChange = (file) => {
    if (picturePreview) {
      URL.revokeObjectURL(picturePreview)
    }
    setPictureFile(file)
    setPicturePreview(file ? URL.createObjectURL(file) : null)
  }

  const handleRemovePictureSelection = () => {
    if (picturePreview) {
      URL.revokeObjectURL(picturePreview)
    }
    setPictureFile(null)
    setPicturePreview(null)
  }

  const handleSaveProject = () => {
    if (!editForm.name.trim()) {
      notifications.show({
        title: 'Nome obrigatório',
        message: 'O nome do projeto não pode ficar em branco.',
        color: 'red',
        position: 'top-center',
      })
      return
    }
    updateProjectMutation.mutate()
  }

  const AVATAR_PATH =
    'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
  const AVATAR_MINI_PATH =
    'https://ik.imagekit.io/mublin/tr:h-35,c-maintain_ratio/users/avatars/'
  const PICTURE_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-200,w-200,c-maintain_ratio/`
  const PICTURE_AVATAR_LARGE_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-400,w-400,c-maintain_ratio/`
  const PICTURE_COVER_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-100,w-1042,fo-top,c-maintain_ratio/`
  const DEFAULT_COVER_PICTURE =
    'https://ik.imagekit.io/mublin/bg/tr:fo-bottom,bl-8/project-cover-default-b.png'

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

  const handleRequestAdminStatus = () => {
    if (!user?.id) {
      notifications.show({
        title: 'Faça login',
        message: 'Você precisa estar logado para solicitar acesso de admin.',
        color: 'red',
        position: 'top-center',
      })
      return
    }
    requestAdminMutation.mutate()
  }

  const handleRespondAdminRequest = (requestId, accept) => {
    respondAdminRequestMutation.mutate({ requestId, accept })
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
            pageName={`${project?.name} (${project?.project_type})`}
            // profile={profile}
            // featured={profile.is_open_to_work}
          />
        </Affix>
      )}

      <Container fluid pb="lg" px={0} mt={{ base: 51, sm: 0 }}>
        <Card
          mx={{ base: 0, sm: 'md' }}
          mt={{ base: 0, sm: 'xs' }}
          mb="xs"
          px={0}
          pt={0}
          pb="md"
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
                  'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.8) 100%)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            <Group pos="absolute" top={12} right={20}>
              {project?.on_tour && (
                <Badge size="lg" color="dark" leftSection={<IconRoad size={18} />}>
                  Em turnê
                </Badge>
              )}
            </Group>

            {/* Avatar do projeto sobreposto */}
            <Box pos="absolute" bottom={-30} left={16} style={{ zIndex: 2 }}>
              {isLoading ? (
                <Skeleton height={100} width={100} />
              ) : (
                <Avatar
                  src={PICTURE_AVATAR_PATH + project?.picture}
                  size={100}
                  radius={0}
                  onClick={openModal}
                  style={
                    colorScheme === 'light'
                      ? { border: '3px solid white' }
                      : { border: '3px solid #1c1c1c' }
                  }
                />
              )}
            </Box>
          </Box>

          {/* ── Identidade ── */}
          <Flex justify="space-between" align="flex-start" wrap="wrap" gap="sm" px="lg">
            <Stack gap={0} w="100%">
              {isLoading ? (
                <>
                  <Skeleton height={28} width={200} />
                  <Skeleton height={16} width={120} mt={4} />
                </>
              ) : (
                <>
                  <Group>
                    <Title order={1} fz="h2" fw={600} lts="-0.01em">
                      {project?.name}
                    </Title>
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
              {project?.status?.description_ptbr && (
                <Badge color={project?.status?.color} variant="filled" size="xs" mt={8}>
                  {project?.status?.description_ptbr}
                </Badge>
              )}
            </Stack>
          </Flex>
          {projectPeople.length > 0 && (
            <Avatar.Group px="xl" mt="xs">
              {projectPeople.map((person) => (
                <Link to={`/${person.profile.username}`} key={person.id}>
                  <Tooltip label={person.profile.username} withArrow>
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
              <Tabs.Tab value="people">Pessoas ({projectPeople.length})</Tabs.Tab>
              <Tabs.Tab value="discography">Discografia</Tabs.Tab>
              <Tabs.Tab value="jobs">Vagas</Tabs.Tab>
              <Tabs.Tab value="gigs">Gigs</Tabs.Tab>
              <Tabs.Tab value="social">Redes sociais</Tabs.Tab>
              {userIsAdmin && (
                <Tabs.Tab value="admin" leftSection={<IconSettings size={16} />}>
                  Admin
                </Tabs.Tab>
              )}
            </Scroller>
          </Tabs.List>
        </Tabs>

        {activeTab === 'about' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600}>
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
            <Title mt="md" order={5} fw={600}>
              Objetivo do projeto
            </Title>
            <Text size="sm">
              {project?.purpose ? (
                project.purpose
              ) : (
                <Text span c="dimmed">
                  Não disponível
                </Text>
              )}
            </Text>
          </Card>
        )}

        {activeTab === 'people' && (
          <>
            <Divider my="sm" label="Administradores" labelPosition="left" mx="md" />
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
                              <Link to={`/${person.profile.username}`}>
                                <Avatar
                                  size={35}
                                  src={`${AVATAR_MINI_PATH}${person.profile.avatar}`}
                                />
                              </Link>
                            </Center>
                            <Text size="11px" ta="center" truncate="end">
                              {person.profile.full_name}
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
                        fw={700}
                        style={{ cursor: 'pointer' }}
                        onClick={handleRequestAdminStatus}
                      >
                        Quero ser administrador
                      </Text>
                    </Text>
                  )}
                </>
              )}
            </Stack>
            <Divider my="sm" label="Pessoas associadas" labelPosition="left" mx="md" />
            <Box mx="md" p={0}>
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
                          to={`/${person.profile.username}`}
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
                            <Text fz="11px" ta="center" c="dimmed" lh={1.2} lineClamp={2}>
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
            </Box>
          </>
        )}

        {activeTab === 'discography' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600}>
              Discografia
            </Title>
            <Text span c="dimmed" size="sm">
              Nenhum álbum cadastrado para este projeto no momento
            </Text>
          </Card>
        )}

        {activeTab === 'jobs' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600}>
              Vagas
            </Title>
            <Text span c="dimmed" size="sm">
              Nenhuma vaga para este projeto no momento
            </Text>
          </Card>
        )}

        {activeTab === 'gigs' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600}>
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

            <Stack gap="sm" w={180}>
              {project?.instagram && (
                <Button
                  size="sm"
                  color="pink.8"
                  component="a"
                  target="_blank"
                  href={`https://instagram.com/${project.instagram}`}
                  leftSection={<IconBrandInstagram size={22} />}
                >
                  Instagram
                </Button>
              )}
              {project?.spotify_id && (
                <Button
                  size="sm"
                  color="green"
                  component="a"
                  target="_blank"
                  href={`https://open.spotify.com/artist/${project.spotify_id}`}
                  leftSection={<IconBrandSpotify size={22} />}
                >
                  Spotify
                </Button>
              )}
              {project?.soundcloud && (
                <Button
                  size="sm"
                  color="orange"
                  component="a"
                  target="_blank"
                  href={`https://soundcloud.com/${project.soundcloud}`}
                  leftSection={<IconBrandSoundcloud size={22} />}
                >
                  SoundCloud
                </Button>
              )}
            </Stack>

            {!project?.instagram && !project?.spotify_id && !project?.soundcloud && (
              <Text span c="dimmed" size="sm">
                Não disponível
              </Text>
            )}
          </Card>
        )}

        {activeTab === 'admin' && userIsAdmin && (
          <Stack gap="md" mx="md">
            {/* Header admin */}
            <Group gap="xs">
              <IconSettings size={18} />
              <Title order={4} fw={600}>
                Administração
              </Title>
              <Badge variant="light" color="gray" size="sm">
                {project?.name}
              </Badge>
            </Group>

            <SimpleGrid
              cols={{ base: 1, md: 2 }}
              spacing="md"
              style={{ alignItems: 'flex-start' }}
            >
              {/* COL ESQ - FORM */}
              <Card withBorder radius="lg" p="lg">
                <Stack gap="md">
                  <Box>
                    <Title order={5} fw={600}>
                      Informações básicas
                    </Title>
                    <Text size="xs" c="dimmed">
                      Atualize os dados públicos do projeto
                    </Text>
                  </Box>

                  <Box>
                    <Group align="flex-start" gap="md" wrap="nowrap">
                      <Box pos="relative">
                        <Avatar
                          src={picturePreview || PICTURE_AVATAR_PATH + project?.picture}
                          size={88}
                          radius="md"
                        />
                        {pictureFile && (
                          <Badge
                            size="xs"
                            color="blue"
                            pos="absolute"
                            top={-6}
                            right={-6}
                            style={{ textTransform: 'none' }}
                          >
                            Nova
                          </Badge>
                        )}
                      </Box>
                      <Stack gap={6} flex={1}>
                        <FileInput
                          label="Imagem do projeto"
                          description="PNG, JPG até 4MB · quadrada funciona melhor"
                          placeholder="Clique para selecionar"
                          leftSection={<IconCamera size={16} />}
                          accept="image/png,image/jpeg,image/gif"
                          value={pictureFile}
                          onChange={handlePictureChange}
                          size="sm"
                        />

                        <Group gap="xs">
                          <Button
                            size="xs"
                            variant="subtle"
                            color="gray"
                            leftSection={<IconTrash size={14} />}
                            onClick={handleRemovePictureSelection}
                          >
                            Descartar
                          </Button>
                          {pictureUploadProgress > 0 && (
                            <Text size="xs" c="dimmed">
                              {pictureUploadProgress}%
                            </Text>
                          )}
                        </Group>
                      </Stack>
                    </Group>
                  </Box>

                  <TextInput
                    label="Nome do projeto"
                    placeholder="Ex: Os Mublins"
                    value={editForm.name}
                    onChange={handleEditFormChange('name')}
                    required
                    withAsterisk
                    maxLength={60}
                    rightSection={
                      <Text size="xs" c="dimmed">
                        {editForm.name.length}/60
                      </Text>
                    }
                  />

                  <Textarea
                    label="Descrição"
                    placeholder="Conte a história do projeto, estilo, influências..."
                    value={editForm.description}
                    onChange={handleEditFormChange('description')}
                    rows={4}
                    autosize
                    minRows={3}
                    maxRows={8}
                  />

                  <Textarea
                    label="Propósito / Objetivo"
                    description="O que o projeto busca atualmente"
                    placeholder="Ex: Gravar EP, fazer turnê no Sudeste..."
                    value={editForm.purpose}
                    onChange={handleEditFormChange('purpose')}
                    rows={3}
                    autosize
                  />

                  <Select
                    label="Status do projeto"
                    description="Situação atual de atividade do projeto"
                    placeholder="Selecione um status"
                    data={projectStatusOptions}
                    value={editForm.activity_status}
                    onChange={handleActivityStatusChange}
                    disabled={loadingProjectStatuses}
                    searchable
                  />

                  <Checkbox
                    label="Em turnê atualmente"
                    checked={editForm.on_tour}
                    onChange={handleOnTourChange}
                  />

                  <Group justify="space-between" mt="sm">
                    <Button
                      variant="default"
                      disabled={updateProjectMutation.isPending}
                      onClick={() => {
                        setEditForm({
                          name: project.name || '',
                          description: project.description || '',
                          purpose: project.purpose || '',
                          on_tour: !!project.on_tour,
                          activity_status:
                            project.activity_status != null
                              ? String(project.activity_status)
                              : null,
                        })
                        handleRemovePictureSelection()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      color="mublinColor"
                      size="sm"
                      loading={updateProjectMutation.isPending}
                      onClick={handleSaveProject}
                      leftSection={
                        !updateProjectMutation.isPending ? (
                          <IconCheck size={16} />
                        ) : undefined
                      }
                    >
                      Salvar
                    </Button>
                  </Group>
                </Stack>
              </Card>

              {/* COL DIR - SOLICITAÇÕES + DANGER */}
              <Stack gap="md">
                <Card withBorder radius="lg" p="lg">
                  <Group justify="space-between" mb="md">
                    <Box>
                      <Title order={5} fw={600}>
                        Solicitações de acesso
                      </Title>
                      <Text size="xs" c="dimmed">
                        Pessoas que querem administrar o projeto
                      </Text>
                    </Box>
                    {pendingAdminRequests.length > 0 && (
                      <Badge size="lg" variant="filled" color="mublinColor" circle>
                        {pendingAdminRequests.length}
                      </Badge>
                    )}
                  </Group>

                  {loadingPendingAdminRequests ? (
                    <Stack gap="xs">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} h={54} radius="md" />
                      ))}
                    </Stack>
                  ) : pendingAdminRequests.length > 0 ? (
                    <Stack gap="sm">
                      {pendingAdminRequests.map((request) => (
                        <Paper key={request.id} withBorder radius="md" p="sm">
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                              <Avatar
                                component={Link}
                                to={`/${request.profile.username}`}
                                size={38}
                                src={`${AVATAR_PATH}${request.profile.avatar}`}
                              />
                              <Box style={{ minWidth: 0 }}>
                                <Text size="sm" fw={600} lineClamp={1}>
                                  {request.profile.full_name}
                                </Text>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  @{request.profile.username}
                                </Text>
                              </Box>
                            </Group>
                            <Group gap={6} wrap="nowrap">
                              <Tooltip label="Recusar">
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="gray"
                                  px={8}
                                  loading={
                                    respondAdminRequestMutation.isPending &&
                                    respondAdminRequestMutation.variables?.requestId ===
                                      request.id &&
                                    respondAdminRequestMutation.variables?.accept ===
                                      false
                                  }
                                  onClick={() =>
                                    handleRespondAdminRequest(request.id, false)
                                  }
                                >
                                  <IconX size={14} />
                                </Button>
                              </Tooltip>
                              <Button
                                size="xs"
                                color="green"
                                leftSection={<IconCheck size={14} />}
                                loading={
                                  respondAdminRequestMutation.isPending &&
                                  respondAdminRequestMutation.variables?.requestId ===
                                    request.id &&
                                  respondAdminRequestMutation.variables?.accept === true
                                }
                                onClick={() =>
                                  handleRespondAdminRequest(request.id, true)
                                }
                              >
                                Aceitar
                              </Button>
                            </Group>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Paper p="md" radius="md" withBorder={false}>
                      <Center>
                        <Stack gap={4} align="center">
                          <Text size="sm" c="dimmed">
                            Nenhuma solicitação pendente
                          </Text>
                          <Text size="xs" c="dimmed">
                            Tudo em dia por aqui
                          </Text>
                        </Stack>
                      </Center>
                    </Paper>
                  )}
                </Card>

                <Card
                  withBorder
                  radius="lg"
                  p="lg"
                  style={{ borderColor: 'var(--mantine-color-red-4)' }}
                >
                  <Title order={5} fw={600} c="red.8" mb={4}>
                    Zona de perigo
                  </Title>
                  <Text size="xs" c="dimmed" mb="md">
                    Ações irreversíveis para sua participação como admin
                  </Text>
                  <Stack gap="xs">
                    <Group justify="space-between" wrap="nowrap">
                      <Box>
                        <Text size="sm" fw={500}>
                          Deixar administração
                        </Text>
                        <Text size="xs" c="dimmed">
                          Você perderá acesso às configurações
                        </Text>
                      </Box>
                      <Button variant="filled" color="red" size="xs" w={142}>
                        Sair do admin
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              </Stack>
            </SimpleGrid>
          </Stack>
        )}
      </Container>
      <Modal.Root opened={opened} onClose={closeModal} size="auto" centered>
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Body p={0}>
            <img
              src={PICTURE_AVATAR_LARGE_PATH + project?.picture}
              alt={project?.name}
              style={{ display: 'block', width: '100%' }}
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
