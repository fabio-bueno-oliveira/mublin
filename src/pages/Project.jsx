import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import {
  fetchProjectProfile,
  fetchProjectAdmins,
  fetchProjectPeople,
  updateProjectProfile,
} from '../queries/projects'
import {
  useMantineColorScheme,
  Skeleton,
  Container,
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
  Checkbox,
  FileInput,
  Badge,
  Group,
  Stack,
  Tabs,
  Card,
  Scroller,
  Divider,
  Center,
  Tooltip,
  Modal,
  em,
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
} from '@tabler/icons-react'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { MEMBER_REQUEST_STATUS } from '../constants/projects'

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
  const PICTURE_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-200,w-200,c-maintain_ratio/`
  const PICTURE_COVER_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-100,w-1042,fo-top,c-maintain_ratio/`
  const DEFAULT_COVER_PICTURE =
    'https://ik.imagekit.io/mublin/bg/tr:fo-bottom,bl-8/project-cover-default-b.png'

  const userMembership = project?.members?.find((m) => m.profile_id === user.id)
  const userIsAdmin =
    userMembership?.is_admin === true &&
    userMembership?.status === MEMBER_REQUEST_STATUS.ACCEPTED

  if (isError) {
    return (
      <Container size="md" py="xl">
        <Text c="dimmed" ta="center">
          Projeto não encontrado.
        </Text>
      </Container>
    )
  }

  const handleRequestAdminStatus = () => {
    notifications.show({
      title: 'Ops!',
      message:
        'Não conseguimos solicitar acesso de admin a este projeto neste momento. Tente novamente em instantes.',
      color: 'red',
      position: 'top-center',
    })
  }

  return (
    <>
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
          mb="md"
          px={0}
          pt={0}
          pb="md"
          shadow="xs"
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
            <Stack gap={2} w="100%">
              {isLoading ? (
                <>
                  <Skeleton height={28} width={200} />
                  <Skeleton height={16} width={120} mt={4} />
                </>
              ) : (
                <>
                  <Group>
                    <Title order={1} fz="h3" fw={600} lts="-0.01em">
                      {project?.name}
                    </Title>
                  </Group>
                  <Group w="100%" gap={8} align="center">
                    {project?.project_type && (
                      <Text size="md" c="dimmed">
                        {project.project_type}
                      </Text>
                    )}
                    {project?.genre && (
                      <>
                        <Text size="md" opacity={0.4} style={{ cursor: 'default' }}>
                          ·
                        </Text>
                        <Text size="md" c="dimmed">
                          {project.genre}
                        </Text>
                      </>
                    )}
                  </Group>
                </>
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

        <Tabs mx="md" variant="pills" mb="md" value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow>
            <Scroller>
              <Tabs.Tab value="about" mr="xs">
                Sobre
              </Tabs.Tab>
              <Tabs.Tab value="people" mr="xs">
                Pessoas
              </Tabs.Tab>
              <Tabs.Tab value="jobs" mr="xs">
                Vagas
              </Tabs.Tab>
              <Tabs.Tab value="gigs" mr="xs">
                Gigs
              </Tabs.Tab>
              <Tabs.Tab value="social" mr="xs">
                Redes
              </Tabs.Tab>
              {userIsAdmin && (
                <Tabs.Tab value="admin" leftSection={<IconSettings size={16} />} mr="xs">
                  Admin
                </Tabs.Tab>
              )}
            </Scroller>
          </Tabs.List>
        </Tabs>

        {activeTab === 'about' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            {project?.status?.description_ptbr && (
              <Badge color={project?.status?.color} variant="light" size="xs" mb="sm">
                {project?.status?.description_ptbr}
              </Badge>
            )}
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
          <Stack gap="xs">
            <Card mx={{ base: 0, sm: 'md' }}>
              <Title order={5} fw={600}>
                Pessoas associadas ({projectPeople.length})
              </Title>
              {loadingProjectPeople ? (
                <Text size="sm">Carregando...</Text>
              ) : (
                <>
                  {projectPeople.length > 0 ? (
                    <Group mt="xs">
                      {projectPeople.map((person) => (
                        <Flex
                          key={person.id}
                          gap={4}
                          direction="column"
                          w={100}
                          justify="center"
                          align="center"
                        >
                          <Center>
                            <Link to={`/${person.profile.username}`}>
                              <Avatar
                                size={50}
                                src={`${AVATAR_PATH}${person.profile.avatar}`}
                              />
                            </Link>
                          </Center>
                          <Text fz="12px" ta="center" truncate="end">
                            {person.profile.full_name}
                          </Text>
                          <Badge size="xs" fw={300}>
                            {person.engagement_types
                              .map((e) => e.engagement_type.name_ptbr)
                              .join(', ')}
                          </Badge>
                          <Text fz="11px" ta="center" c="dimmed" lh={1.2}>
                            {person.roles.map((r) => r.role.name_ptbr).join(', ')}
                          </Text>
                          <Text fz="11px" ta="center" opacity={0.7}>
                            {person.year_start} ›{' '}
                            {person.year_end ? person.year_end : 'Atualmente'}
                          </Text>
                        </Flex>
                      ))}
                    </Group>
                  ) : (
                    <Text span c="dimmed" size="sm">
                      Nenhum perfil associado a este projeto até o momento
                    </Text>
                  )}
                </>
              )}
            </Card>
            <Card mx={{ base: 0, sm: 'md' }}>
              <Group justify="space-between">
                <Title order={5} fw={600}>
                  Administradores ({projectAdmins.length})
                </Title>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleRequestAdminStatus()}
                >
                  Solicitar acesso admin
                </Button>
              </Group>
              {loadingProjectAdmins ? (
                <Text size="sm">Carregando...</Text>
              ) : (
                <>
                  {projectAdmins.length > 0 ? (
                    <Group mt="xs">
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
                                size={50}
                                src={`${AVATAR_PATH}${person.profile.avatar}`}
                              />
                            </Link>
                          </Center>
                          <Text size="11px" ta="center" truncate="end">
                            {person.profile.full_name}
                          </Text>
                        </Flex>
                      ))}
                    </Group>
                  ) : (
                    <Text span c="dimmed" size="sm">
                      Nenhum administrador neste projeto. <b>Quero ser administrador</b>
                    </Text>
                  )}
                </>
              )}
            </Card>
          </Stack>
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
              Redes
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
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600} mb="md" c="dimmed">
              Administrar projeto
            </Title>
            <Title order={5} fw={600} mb="xs">
              Editar dados do projeto
            </Title>
            <Stack gap="sm">
              <Group align="flex-end" gap="md">
                <Avatar
                  src={picturePreview || PICTURE_AVATAR_PATH + project?.picture}
                  size={80}
                  radius={0}
                />
                <Stack gap={4} flex={1}>
                  <FileInput
                    label="Imagem do projeto"
                    description="PNG, JPG ou GIF"
                    placeholder="Selecionar arquivo"
                    leftSection={<IconCamera size={18} />}
                    leftSectionPointerEvents="none"
                    accept="image/png,image/jpeg,image/gif"
                    value={pictureFile}
                    onChange={handlePictureChange}
                  />
                  {pictureFile && (
                    <Group gap="xs">
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        leftSection={<IconTrash size={14} />}
                        onClick={handleRemovePictureSelection}
                      >
                        Remover seleção
                      </Button>
                      {pictureUploadProgress > 0 && pictureUploadProgress < 100 && (
                        <Text size="xs" c="dimmed">
                          Enviando... {pictureUploadProgress}%
                        </Text>
                      )}
                    </Group>
                  )}
                </Stack>
              </Group>
              <Checkbox
                label="Em turnê atualmente"
                checked={editForm.on_tour}
                onChange={handleOnTourChange}
              />
              <TextInput
                label="Nome do projeto"
                value={editForm.name}
                onChange={handleEditFormChange('name')}
                required
              />
              <Textarea
                label="Descrição"
                value={editForm.description}
                onChange={handleEditFormChange('description')}
                rows={3}
              />
              <Textarea
                label="Propósito"
                value={editForm.purpose}
                onChange={handleEditFormChange('purpose')}
                rows={3}
              />
              <Group justify="flex-end">
                <Button
                  color="mublinColor"
                  size="md"
                  w={240}
                  loading={updateProjectMutation.isPending}
                  onClick={handleSaveProject}
                >
                  Salvar
                </Button>
              </Group>
            </Stack>
            <Divider my="lg" />
            <Title order={5} fw={600} mb="xs">
              Gerenciar administração
            </Title>
            <Button variant="filled" color="red.9" size="xs" w={220}>
              Deixar de ser administrador
            </Button>
          </Card>
        )}
      </Container>
      <Modal.Root opened={opened} onClose={closeModal} size="auto" centered>
        <Modal.Overlay />
        <Modal.Content>
          <Modal.Body p={0}>
            <img
              src={PICTURE_AVATAR_PATH + project?.picture}
              alt=""
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
