import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import {
  fetchProjectBackstageInfo,
  updateProjectProfile,
  fetchProjectStatuses,
  fetchProjectAdminRequests,
  respondProjectAdminRequest,
} from '../queries/projects'
import {
  fetchProjectOpenings,
  createProjectOpening,
  updateProjectOpening,
  deleteProjectOpening,
  fetchApplicableRoles,
  fetchExperienceLevelOptions,
  fetchProjectEngagementTypeOptions,
  fetchRateTypeOptions,
} from '../queries/projectOpenings'
import { modals } from '@mantine/modals'
import {
  Container,
  SimpleGrid,
  Box,
  Avatar,
  Button,
  Title,
  Text,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  NumberInput,
  FileInput,
  Badge,
  Group,
  Stack,
  Card,
  Paper,
  Center,
  Tooltip,
  ActionIcon,
  Modal,
  Skeleton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { upload } from '@imagekit/react'
import {
  IconCamera,
  IconTrash,
  IconCheck,
  IconX,
  IconPlus,
  IconPencil,
  IconRotateClockwise,
} from '@tabler/icons-react'
import { MEMBER_REQUEST_STATUS } from '../constants/projects'

const DEFAULT_OPENING_FORM = {
  role_id: null,
  experience_level: null,
  engagement_type_id: null,
  description: '',
  is_paid: false,
  fee: '',
  rate_type_id: null,
  is_remote: false,
}

// ── Helpers de upload (ImageKit) ──────────────────────────
// TODO: extrair para '../lib/imagekit.js' — hoje duplicado aqui e em Project.jsx
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

export default function Backstage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const activeSection = searchParams.get('section') || 'info'

  const [openingModalOpened, { open: openOpeningModal, close: closeOpeningModal }] =
    useDisclosure(false)
  const [editingOpeningId, setEditingOpeningId] = useState(null)
  const [openingForm, setOpeningForm] = useState(DEFAULT_OPENING_FORM)

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
    queryKey: ['project-backstage-info', projectId],
    queryFn: () => fetchProjectBackstageInfo(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const userIsAdmin = project?.members?.some(
    (m) =>
      m.profile_id === user?.id &&
      m.is_admin &&
      m.status === MEMBER_REQUEST_STATUS.ACCEPTED,
  )

  const { data: projectStatuses = [], isLoading: loadingProjectStatuses } = useQuery({
    queryKey: ['project-statuses'],
    queryFn: fetchProjectStatuses,
    staleTime: 1000 * 60 * 60,
  })

  const projectStatusOptions = projectStatuses.map((status) => ({
    value: String(status.id),
    label: status.description_ptbr,
  }))

  const { data: pendingAdminRequests = [], isLoading: loadingPendingAdminRequests } =
    useQuery({
      queryKey: ['project-admin-requests', projectId],
      queryFn: () => fetchProjectAdminRequests(projectId),
      enabled: !!projectId && !!userIsAdmin,
      staleTime: 1000 * 30,
    })

  const { data: projectOpenings = [], isLoading: loadingProjectOpenings } = useQuery({
    queryKey: ['project-openings', projectId],
    queryFn: () => fetchProjectOpenings(projectId),
    enabled: !!projectId && !!userIsAdmin,
    staleTime: 1000 * 60,
  })

  const { data: applicableRoles = [] } = useQuery({
    queryKey: ['applicable-roles'],
    queryFn: fetchApplicableRoles,
    enabled: openingModalOpened,
    staleTime: 1000 * 60 * 60,
  })

  const { data: experienceLevelOptions = [] } = useQuery({
    queryKey: ['experience-levels'],
    queryFn: fetchExperienceLevelOptions,
    enabled: openingModalOpened,
    staleTime: 1000 * 60 * 60,
  })

  const { data: engagementTypeOptions = [] } = useQuery({
    queryKey: ['project-engagement-types'],
    queryFn: fetchProjectEngagementTypeOptions,
    enabled: openingModalOpened,
    staleTime: 1000 * 60 * 60,
  })

  const { data: rateTypeOptions = [] } = useQuery({
    queryKey: ['rate-types'],
    queryFn: fetchRateTypeOptions,
    enabled: openingModalOpened && openingForm.is_paid,
    staleTime: 1000 * 60 * 60,
  })

  const roleSelectOptions = [
    {
      group: 'Gestão, produção e outros',
      items: applicableRoles
        .filter((r) => !r.instrumentalist)
        .map((r) => ({ value: String(r.id), label: r.name_ptbr })),
    },
    {
      group: 'Instrumentos',
      items: applicableRoles
        .filter((r) => r.instrumentalist)
        .map((r) => ({ value: String(r.id), label: r.name_ptbr })),
    },
  ]
  const experienceLevelSelectOptions = experienceLevelOptions.map((l) => ({
    value: String(l.id),
    label: l.name_pt,
  }))
  const engagementTypeSelectOptions = engagementTypeOptions.map((t) => ({
    value: String(t.id),
    label: t.name_ptbr,
  }))
  const rateTypeSelectOptions = rateTypeOptions.map((t) => ({
    value: String(t.id),
    label: t.name_ptbr,
  }))

  // Ajusta o editForm quando o projeto muda (setState durante a renderização,
  // ver nota em Project.jsx sobre por que isso é preferível a um useEffect)
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
      queryClient.invalidateQueries({ queryKey: ['project-backstage-info', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', project?.slug] })
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
      queryClient.invalidateQueries({ queryKey: ['project-backstage-info', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-admin-requests', projectId] })
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

  const createOpeningMutation = useMutation({
    mutationFn: (payload) => createProjectOpening(payload),
    onSuccess: () => {
      notifications.show({
        title: 'Vaga publicada',
        message: 'A vaga já está visível na aba de Vagas do projeto.',
        color: 'green',
        position: 'top-center',
      })
      queryClient.invalidateQueries({ queryKey: ['project-openings', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-openings-open', projectId] })
      closeOpeningModal()
    },
    onError: (error) => {
      notifications.show({
        title: 'Erro ao criar vaga',
        message: error?.message || 'Tente novamente em instantes.',
        color: 'red',
        position: 'top-center',
      })
    },
  })

  const updateOpeningMutation = useMutation({
    mutationFn: ({ id, updates }) => updateProjectOpening(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-openings', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-openings-open', projectId] })
      closeOpeningModal()
    },
    onError: (error) => {
      notifications.show({
        title: 'Erro ao salvar vaga',
        message: error?.message || 'Tente novamente em instantes.',
        color: 'red',
        position: 'top-center',
      })
    },
  })

  const deleteOpeningMutation = useMutation({
    mutationFn: (id) => deleteProjectOpening(id),
    onSuccess: () => {
      notifications.show({
        message: 'Vaga removida.',
        color: 'green',
        position: 'top-center',
      })
      queryClient.invalidateQueries({ queryKey: ['project-openings', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project-openings-open', projectId] })
    },
    onError: (error) => {
      notifications.show({
        title: 'Erro ao remover vaga',
        message: error?.message || 'Tente novamente em instantes.',
        color: 'red',
        position: 'top-center',
      })
    },
  })

  const handleEditFormChange = (field) => (event) => {
    const { value } = event.currentTarget
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleOnTourChange = (event) => {
    const { checked } = event.currentTarget
    setEditForm((prev) => ({ ...prev, on_tour: checked }))
  }

  const handleActivityStatusChange = (value) => {
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

  const handleRespondAdminRequest = (requestId, accept) => {
    respondAdminRequestMutation.mutate({ requestId, accept })
  }

  // ── Handlers: Vagas do projeto ────────────────────────
  const handleOpeningTextChange = (field) => (event) => {
    const { value } = event.currentTarget
    setOpeningForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleOpeningSelectChange = (field) => (value) => {
    setOpeningForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleOpeningPaidChange = (event) => {
    const { checked } = event.currentTarget
    setOpeningForm((prev) => ({ ...prev, is_paid: checked }))
  }

  const handleOpeningRemoteChange = (event) => {
    const { checked } = event.currentTarget
    setOpeningForm((prev) => ({ ...prev, is_remote: checked }))
  }

  const handleOpeningFeeChange = (value) => {
    setOpeningForm((prev) => ({ ...prev, fee: value }))
  }

  const handleOpenCreateOpeningModal = () => {
    setEditingOpeningId(null)
    setOpeningForm(DEFAULT_OPENING_FORM)
    openOpeningModal()
  }

  const handleOpenEditOpeningModal = (opening) => {
    setEditingOpeningId(opening.id)
    setOpeningForm({
      role_id: opening.role?.id ? String(opening.role.id) : null,
      experience_level: opening.experience_level?.id
        ? String(opening.experience_level.id)
        : null,
      engagement_type_id: opening.engagement_type?.id
        ? String(opening.engagement_type.id)
        : null,
      description: opening.description || '',
      is_paid: !!opening.is_paid,
      fee: opening.fee != null ? String(opening.fee) : '',
      rate_type_id: opening.rate_type?.id ? String(opening.rate_type.id) : null,
      is_remote: !!opening.is_remote,
    })
    openOpeningModal()
  }

  const handleSaveOpening = () => {
    if (!openingForm.role_id) {
      notifications.show({
        title: 'Cargo obrigatório',
        message: 'Selecione qual cargo esta vaga busca.',
        color: 'red',
        position: 'top-center',
      })
      return
    }

    const payload = {
      role_id: Number(openingForm.role_id),
      experience_level: openingForm.experience_level
        ? Number(openingForm.experience_level)
        : null,
      engagement_type_id: openingForm.engagement_type_id
        ? Number(openingForm.engagement_type_id)
        : null,
      description: openingForm.description.trim() || null,
      is_paid: openingForm.is_paid,
      fee: openingForm.is_paid && openingForm.fee ? Number(openingForm.fee) : null,
      rate_type_id:
        openingForm.is_paid && openingForm.rate_type_id
          ? Number(openingForm.rate_type_id)
          : null,
      is_remote: openingForm.is_remote,
    }

    if (editingOpeningId) {
      updateOpeningMutation.mutate({ id: editingOpeningId, updates: payload })
    } else {
      createOpeningMutation.mutate({
        ...payload,
        project_id: project.id,
        created_by: user.id,
      })
    }
  }

  const handleToggleOpeningFilled = (opening) => {
    updateOpeningMutation.mutate({
      id: opening.id,
      updates: { is_filled: !opening.is_filled },
    })
  }

  const handleDeleteOpening = (opening) => {
    modals.openConfirmModal({
      title: 'Remover vaga',
      centered: true,
      children: (
        <Text size="sm">
          Tem certeza que deseja remover a vaga de {opening.role?.name_ptbr}? Essa ação
          não pode ser desfeita.
        </Text>
      ),
      labels: { confirm: 'Remover', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteOpeningMutation.mutate(opening.id),
    })
  }

  const PICTURE_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-200,w-200,c-maintain_ratio/`
  const AVATAR_PATH =
    'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

  if (isLoading) {
    return (
      <Container size="lg" py="xl">
        <Skeleton h={300} radius="lg" />
      </Container>
    )
  }

  if (isError || !project) {
    return (
      <Container size="md" py="xl">
        <Text c="dimmed" ta="center">
          Projeto não encontrado.
        </Text>
      </Container>
    )
  }

  if (!userIsAdmin) {
    return (
      <Container size="sm" py="xl">
        <Card withBorder radius="lg" p="xl">
          <Stack gap={4} align="center">
            <Title order={4} fw={600}>
              Acesso restrito
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              Somente administradores de {project.name} podem acessar o backstage deste
              projeto.
            </Text>
          </Stack>
        </Card>
      </Container>
    )
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`Backstage · ${project.name} · Mublin`}</title>
      </Helmet>

      <Container size="lg" px={{ base: 'md', sm: 0 }}>
        {activeSection === 'dashboard' && (
          <Card withBorder radius="lg" p="lg">
            <Title order={4} fw={600} mb={4}>
              Dashboard
            </Title>
            <Text size="sm" c="dimmed">
              Métricas do projeto em breve — visitas ao perfil, candidaturas recebidas,
              evolução do staff.
            </Text>
          </Card>
        )}

        {activeSection === 'info' && (
          <SimpleGrid
            cols={{ base: 1, md: 2 }}
            spacing="md"
            style={{ alignItems: 'flex-start' }}
          >
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
          </SimpleGrid>
        )}

        {activeSection === 'picture' && (
          <Card withBorder radius="lg" p="lg">
            <Stack gap="md">
              <Box>
                <Title order={5} fw={600}>
                  Foto
                </Title>
                <Text size="xs" c="dimmed">
                  Atualize a imagem de perfil do projeto
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
            </Stack>
          </Card>
        )}

        {activeSection === 'gigs' && (
          <Card withBorder radius="lg" p="lg">
            <Title order={4} fw={600} mb={4}>
              Gigs
            </Title>
            <Text size="sm" c="dimmed">
              Gigs do projeto em breve serão listadas e gerenciadas aqui
            </Text>
          </Card>
        )}

        {activeSection === 'requests' && (
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
                              respondAdminRequestMutation.variables?.accept === false
                            }
                            onClick={() => handleRespondAdminRequest(request.id, false)}
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
                          onClick={() => handleRespondAdminRequest(request.id, true)}
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
        )}

        {activeSection === 'openings' && (
          <Card withBorder radius="lg" p="lg">
            <Group justify="space-between" mb="md">
              <Box>
                <Title order={5} fw={600}>
                  Vagas do projeto
                </Title>
                <Text size="xs" c="dimmed">
                  Gerencie as vagas abertas para músicos e staff
                </Text>
              </Box>
              <Button
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={handleOpenCreateOpeningModal}
              >
                Nova vaga
              </Button>
            </Group>

            {loadingProjectOpenings ? (
              <Stack gap="xs">
                {[1, 2].map((i) => (
                  <Skeleton key={i} h={58} radius="md" />
                ))}
              </Stack>
            ) : projectOpenings.length > 0 ? (
              <Stack gap="sm">
                {projectOpenings.map((opening) => (
                  <Paper key={opening.id} withBorder radius="md" p="sm">
                    <Group justify="space-between" wrap="nowrap" gap="sm">
                      <Box style={{ minWidth: 0 }}>
                        <Group gap={6} wrap="wrap">
                          <Text size="sm" fw={600}>
                            {opening.role?.name_ptbr}
                          </Text>
                          {opening.is_filled && (
                            <Badge size="xs" variant="light" color="gray">
                              Preenchida
                            </Badge>
                          )}
                          {!opening.is_active && (
                            <Badge size="xs" variant="light" color="red">
                              Pausada
                            </Badge>
                          )}
                          {opening.engagement_type?.name_ptbr && (
                            <Badge size="xs" variant="light" color="mublinColor">
                              {opening.engagement_type.name_ptbr}
                            </Badge>
                          )}
                        </Group>
                        {opening.description && (
                          <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                            {opening.description}
                          </Text>
                        )}
                      </Box>
                      <Group gap={6} wrap="nowrap">
                        <Tooltip
                          label={
                            opening.is_filled ? 'Reabrir vaga' : 'Marcar como preenchida'
                          }
                        >
                          <ActionIcon
                            variant="light"
                            color={opening.is_filled ? 'gray' : 'green'}
                            onClick={() => handleToggleOpeningFilled(opening)}
                          >
                            {opening.is_filled ? (
                              <IconRotateClockwise size={14} />
                            ) : (
                              <IconCheck size={14} />
                            )}
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Editar">
                          <ActionIcon
                            variant="light"
                            color="gray"
                            onClick={() => handleOpenEditOpeningModal(opening)}
                          >
                            <IconPencil size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Remover">
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDeleteOpening(opening)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                Nenhuma vaga cadastrada ainda.
              </Text>
            )}
          </Card>
        )}
      </Container>

      <Modal
        opened={openingModalOpened}
        onClose={closeOpeningModal}
        title={editingOpeningId ? 'Editar vaga' : 'Nova vaga'}
        centered
      >
        <Stack gap="sm">
          <Select
            label="Cargo buscado"
            placeholder="Selecione o cargo"
            data={roleSelectOptions}
            value={openingForm.role_id}
            onChange={handleOpeningSelectChange('role_id')}
            searchable
            required
            withAsterisk
          />
          <Select
            label="Nível de experiência"
            placeholder="Opcional"
            data={experienceLevelSelectOptions}
            value={openingForm.experience_level}
            onChange={handleOpeningSelectChange('experience_level')}
            clearable
          />
          <Select
            label="Tipo de engajamento"
            placeholder="Opcional"
            data={engagementTypeSelectOptions}
            value={openingForm.engagement_type_id}
            onChange={handleOpeningSelectChange('engagement_type_id')}
            clearable
          />
          <Textarea
            label="Descrição"
            placeholder="Detalhes sobre a vaga, requisitos, expectativas..."
            value={openingForm.description}
            onChange={handleOpeningTextChange('description')}
            rows={3}
            autosize
            minRows={2}
            maxRows={6}
          />
          <Checkbox
            label="Vaga remunerada"
            checked={openingForm.is_paid}
            onChange={handleOpeningPaidChange}
          />
          {openingForm.is_paid && (
            <Group grow align="flex-start">
              <NumberInput
                label="Valor"
                placeholder="0,00"
                value={openingForm.fee}
                onChange={handleOpeningFeeChange}
                min={0}
                decimalScale={2}
                fixedDecimalScale
                hideControls
              />
              <Select
                label="Tipo de remuneração"
                placeholder="Selecione"
                data={rateTypeSelectOptions}
                value={openingForm.rate_type_id}
                onChange={handleOpeningSelectChange('rate_type_id')}
                clearable
              />
            </Group>
          )}
          <Checkbox
            label="Aceita candidatos remotos"
            checked={openingForm.is_remote}
            onChange={handleOpeningRemoteChange}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={closeOpeningModal}>
              Cancelar
            </Button>
            <Button
              color="mublinColor"
              loading={createOpeningMutation.isPending || updateOpeningMutation.isPending}
              onClick={handleSaveOpening}
            >
              {editingOpeningId ? 'Salvar alterações' : 'Publicar vaga'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
