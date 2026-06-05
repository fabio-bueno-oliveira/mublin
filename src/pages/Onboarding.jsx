import { useState, useEffect, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUserProfile, fetchUserRoles, fetchUserProjects } from '../queries/user'
import { fetchRoles } from '../queries/roles'
import { searchProjectsByName } from '../queries/projects'
import { fetchRegions, searchCitiesByName, fetchCityById } from '../queries/locations'
import { supabase } from '../lib/supabaseClient'
import {
  useMantineColorScheme,
  Container,
  Stepper,
  Stack,
  Group,
  Image,
  Title,
  Text,
  Button,
  Avatar,
  Textarea,
  TextInput,
  NativeSelect,
  Combobox,
  useCombobox,
  Grid,
  Input,
  Modal,
  ScrollArea,
  Box,
  Anchor,
  Divider,
  Badge,
  Pill,
  Loader,
  ThemeIcon,
} from '@mantine/core'
import JoinProjectModal from '../components/modals/JoinProjectModal'
import { useForm } from '@mantine/form'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { upload } from '@imagekit/react'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import {
  IconArrowLeft,
  IconArrowRight,
  IconSearch,
  IconCheck,
  IconX,
  IconUpload,
  IconCamera,
  IconUserEdit,
  IconMusic,
  IconUsersGroup,
} from '@tabler/icons-react'
const NewProject = lazy(() => import('./NewProject'))

// ── Componente principal ──────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const currentYear = new Date().getFullYear()

  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  const [active, setActive] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Step 1: Avatar ────────────────────────────────────
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUploaded, setAvatarUploaded] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // ── Step 2: Perfil ────────────────────────────────────
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const [usernameUnavailableReason, setUsernameUnavailableReason] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)
  const [citySearchQuery, setCitySearchQuery] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [citySearchLoading, setCitySearchLoading] = useState(false)
  const [noCityResults, setNoCityResults] = useState(false)
  const [modalCityOpened, { open: openCityModal, close: closeCityModal }] =
    useDisclosure(false)
  const [
    modalNewProjectOpened,
    { open: openNewProjectModal, close: closeNewProjectModal },
  ] = useDisclosure(false)

  const profileForm = useForm({
    initialValues: {
      full_name: '',
      username: '',
      title: '',
      bio: '',
      region_id: '',
    },
    validate: {
      full_name: (v) => {
        if (v.length < 3) {
          return 'Mínimo 2 caracteres'
        }
      },
      username: (v) => {
        if (!v) {
          return 'Escolha um username'
        }
        if (v.length < 3) {
          return 'Mínimo 3 caracteres'
        }
        if (!/^[a-z0-9_]+$/.test(v)) {
          return 'Apenas letras minúsculas, números e _'
        }
        return null
      },
      title: (v) => {
        if (v.length > 70) {
          return 'Máximo 70 caracteres'
        }
      },
      region_id: (v) => (!v ? 'Selecione seu Estado' : null),
    },
  })

  // ── Step 3: Roles ─────────────────────────────────────
  const [userRoles, setUserRoles] = useState([])
  const [addingRole, setAddingRole] = useState(false)
  const [roleSearch, setRoleSearch] = useState('')
  const comboboxRole = useCombobox({
    onDropdownClose: () => {
      comboboxRole.resetSelectedOption()
      setRoleSearch('')
    },
  })

  // ── Step 4: Projetos ──────────────────────────────────
  const [projectSearch, setProjectSearch] = useState('')
  const [projectResults, setProjectResults] = useState([])
  const [projectSearchLoading, setProjectSearchLoading] = useState(false)
  const [userProjects, setUserProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [modalJoinOpened, { open: openJoinModal, close: closeJoinModal }] =
    useDisclosure(false)
  const [joinRole, setJoinRole] = useState('')
  const [joinYear, setJoinYear] = useState(currentYear)
  const [projectFoundationYear, setProjectFoundationYear] = useState('')
  const [projectEndYear, setProjectEndYear] = useState('')
  const [joiningProject, setJoiningProject] = useState(false)

  // ── Queries ───────────────────────────────────────────

  const { data: savedProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchUserProfile(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: savedRoles = [] } = useQuery({
    queryKey: ['profile-roles', user?.id],
    queryFn: () => fetchUserRoles(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: savedProjects = [] } = useQuery({
    queryKey: ['profile-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    staleTime: 1000 * 60 * 30,
  })

  const { data: regions = [] } = useQuery({
    queryKey: ['regions-br'],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 60,
  })

  const rolesMusicians = roles
    .filter((r) => r.instrumentalist)
    .map((r) => ({
      label: r.description_ptbr ?? r.name_ptbr,
      value: String(r.id),
      name: r.name_ptbr,
      tags: r.tags,
    }))

  const rolesManagement = roles
    .filter((r) => !r.instrumentalist)
    .map((r) => ({
      label: r.description_ptbr ?? r.name_ptbr,
      value: String(r.id),
      name: r.name_ptbr,
      tags: r.tags,
    }))

  const rolesForProject = roles.filter((r) => r.applies_to_a_project)

  const rolesProjectMusicians = rolesForProject
    .filter((r) => r.instrumentalist)
    .map((r) => ({ label: r.name_ptbr, value: String(r.id) }))

  const rolesProjectManagement = rolesForProject
    .filter((r) => !r.instrumentalist)
    .map((r) => ({ label: r.name_ptbr, value: String(r.id) }))

  // ── Popula os estados iniciais ──

  useEffect(() => {
    if (!savedProfile) {
      return
    }

    // Popula username, bio e region_id no form
    profileForm.setValues({
      full_name: savedProfile.full_name,
      username: savedProfile.username ?? '',
      title: savedProfile.title ?? '',
      bio: savedProfile.bio ?? '',
      region_id: savedProfile.region_id ? String(savedProfile.region_id) : '',
    })

    // Busca e popula a cidade, se houver
    if (savedProfile.city_id) {
      fetchCityById(savedProfile.city_id).then((city) => {
        if (city) {
          setSelectedCity({ id: city.id, name: city.name })
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedProfile])

  useEffect(() => {
    if (!savedRoles.length) {
      return
    }
    const mapped = savedRoles.map((r) => ({
      id: r.roles.id,
      name: r.roles.name_ptbr,
      main_activity: r.main_activity,
    }))
    setUserRoles(mapped)
  }, [savedRoles])

  useEffect(() => {
    if (!savedProjects.length) {
      return
    }
    const mapped = savedProjects.map((r) => ({
      id: r.projects.id,
      name: r.projects.name,
      slug: r.projects.slug,
      picture: r.projects.picture,
    }))
    setUserProjects(mapped)
  }, [savedProjects])

  // ── Handlers ──────────────────────────────────────────

  // Step 1 — Avatar
  function handleAvatarSelect(file) {
    if (!file) {
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleAvatarUpload() {
    if (!avatarFile) {
      return
    }
    setAvatarUploading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const authRes = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })
      const { token: ikToken, expire, signature } = await authRes.json()

      const response = await upload({
        file: avatarFile,
        fileName: `${profile?.username || user.id}_.jpg`,
        folder: '/users/avatars/',
        tags: ['avatar', 'user'],
        useUniqueFileName: true,
        publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
        token: ikToken,
        expire,
        signature,
        onProgress: (e) => setUploadProgress(Math.round((e.loaded / e.total) * 100)),
      })

      const n = response.filePath.lastIndexOf('/')
      const fileName = response.filePath.substring(n + 1)

      await supabase.from('profiles').update({ avatar: fileName }).eq('id', user.id)

      setAvatarUploaded(true)
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Foto de perfil atualizada!',
      })
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao enviar a foto. Tente novamente.',
      })
    } finally {
      setAvatarUploading(false)
      setUploadProgress(0)
    }
  }

  // Step 2 — Perfil
  const handleUsernameCheck = useDebouncedCallback(async (value) => {
    if (!value || value.length < 3 || !/^[a-z0-9_]+$/.test(value)) {
      setUsernameAvailable(null)
      return
    }

    if (value === savedProfile?.username) {
      setUsernameAvailable(true)
      return
    }

    setUsernameChecking(true)

    // 1. Verifica se é um nome reservado
    const { data: reserved } = await supabase
      .from('reserved_usernames')
      .select('username')
      .eq('username', value)
      .maybeSingle()

    if (reserved) {
      setUsernameAvailable(false)
      setUsernameUnavailableReason('reserved')
      setUsernameChecking(false)
      return
    }

    // 2. Verifica se já está em uso por outro perfil
    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', value)
      .maybeSingle()

    setUsernameAvailable(!taken)
    setUsernameUnavailableReason(taken ? 'taken' : null)
    setUsernameChecking(false)
  }, 600)

  const handleCitySearch = useDebouncedCallback(async (query) => {
    const regionId = profileForm.values.region_id
    if (!query || query.length < 2 || !regionId) {
      return
    }
    setCitySearchLoading(true)
    setNoCityResults(false)
    const results = await searchCitiesByName(query, regionId)
    if (results.length) {
      setCityResults(results)
    } else {
      setNoCityResults(true)
      setCityResults([])
    }
    setCitySearchLoading(false)
  }, 500)

  async function saveProfile() {
    const values = profileForm.values
    setIsSubmitting(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: values.full_name,
        username: values.username,
        title: values.title,
        bio: values.bio || null,
        region_id: values.region_id ? Number(values.region_id) : null,
        city_id: selectedCity?.id ?? null,
      })
      .eq('id', user.id)
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao salvar. Tente novamente.',
      })
      setIsSubmitting(false)
      return false
    }
    setIsSubmitting(false)
    return true
  }

  // Step 3 — Roles
  async function handleAddRole(roleId) {
    if (!roleId || userRoles.find((r) => r.id === Number(roleId))) {
      return
    }
    setAddingRole(true)
    const role = roles.find((r) => r.id === Number(roleId))
    const isFirst = userRoles.length === 0

    const { error } = await supabase.from('profile_roles').insert({
      id_profile: user.id,
      id_role: Number(roleId),
      main_activity: isFirst,
    })

    if (!error) {
      setUserRoles((prev) => [
        ...prev,
        { id: role.id, name: role.name_ptbr, profileRoleId: null },
      ])
    }
    setAddingRole(false)
  }

  async function handleRemoveRole(roleId) {
    await supabase
      .from('profile_roles')
      .delete()
      .eq('id_profile', user.id)
      .eq('id_role', roleId)

    setUserRoles((prev) => prev.filter((r) => r.id !== roleId))
  }

  // Step 4 — Projetos
  const handleProjectSearch = useDebouncedCallback(async (query) => {
    // if (query.length < 2) {
    //   setProjectResults([])
    //   return
    // }
    setProjectSearchLoading(true)
    const results = await searchProjectsByName(query)
    setProjectResults(results)
    setProjectSearchLoading(false)
  }, 600)

  function handleSelectProject(project) {
    if (userProjects.find((p) => p.id === project.id)) {
      return
    }
    setSelectedProject(project)
    setJoinYear(currentYear)
    setJoinRole('')
    openJoinModal()
    setProjectFoundationYear(project.foundation_year)
    setProjectEndYear(project.end_year)
  }

  async function handleJoinProject() {
    if (!joinRole || !joinYear) {
      return
    }
    setJoiningProject(true)

    const { error } = await supabase.from('project_members').insert({
      project_id: selectedProject.id,
      profile_id: user.id,
      role_id: Number(joinRole),
      joined_at: `${joinYear}-01-01`,
      is_founder: false,
      is_admin: false,
    })

    if (!error) {
      setUserProjects((prev) => [
        ...prev,
        {
          id: selectedProject.id,
          name: selectedProject.name,
          picture: selectedProject.picture,
          slug: selectedProject.slug,
        },
      ])
      closeJoinModal()
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: `Você solicitou o ingresso em ${selectedProject.name}!`,
        autoClose: 5000,
      })
    } else {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao tentar ingressar. Tente novamente.',
      })
    }
    setJoiningProject(false)
  }

  // ── Navegação entre steps ─────────────────────────────

  async function handleNext() {
    if (active === 1) {
      const valid = profileForm.validate()
      if (valid.hasErrors) {
        return
      }
      if (usernameAvailable === false) {
        return
      }
      if (usernameChecking) {
        return
      }
      const ok = await saveProfile()
      if (!ok) {
        return
      }
    }
    setActive((s) => s + 1)
  }

  function handleBack() {
    setActive((s) => s - 1)
  }

  async function handleFinish() {
    setIsSubmitting(true)
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)
    navigate('/home')
    setIsSubmitting(false)
  }

  const AVATAR_PATH =
    'https://ik.imagekit.io/mublin/tr:h-200,w-200,c-maintain_ratio/users/avatars/'

  return (
    <Container size="sm" pb={100} py={24} mb={80}>
      <Stack gap="xl">
        <Stack gap={4} align="center">
          <Image
            src={isDark ? MublinLogoWhite : MublinLogoBlack}
            h={22}
            w="auto"
            fit="contain"
          />
          {active === 0 && (
            <>
              <Title order={1} fz="1.4em" fw={800} ta="center" mt="md">
                Vamos configurar seu perfil
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Leva menos de 2 minutos
              </Text>
            </>
          )}
        </Stack>
        <Stepper active={active} color="mublinColor" size="sm">
          <Stepper.Step icon={<IconCamera stroke={2} />} />
          <Stepper.Step icon={<IconUserEdit stroke={2} />} />
          <Stepper.Step icon={<IconMusic stroke={2} />} />
          <Stepper.Step icon={<IconUsersGroup stroke={2} />} />
        </Stepper>
        {/* ── Step 0: Foto de perfil ───────────────────── */}
        {active === 0 && (
          <Stack gap="md" align="center">
            <Title order={3} fw={700} ta="center">
              Defina sua foto de perfil
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Uma boa foto aumenta suas chances de ser encontrado por outros músicos.
            </Text>

            <Avatar
              size={120}
              src={
                avatarPreview ||
                (profile?.avatar ? AVATAR_PATH + profile.avatar : undefined)
              }
              style={{
                border: '3px solid var(--mantine-color-default-border)',
              }}
            />

            {uploadProgress > 0 && uploadProgress < 100 && (
              <Text size="xs" c="dimmed">
                Enviando... {uploadProgress}%
              </Text>
            )}

            <Group gap="sm">
              <Button
                variant="default"
                radius="xl"
                leftSection={<IconUpload size={16} />}
                component="label"
                htmlFor="avatar-input"
              >
                {avatarPreview ? 'Trocar foto' : 'Selecionar foto'}
              </Button>
              <input
                id="avatar-input"
                type="file"
                accept="image/png,image/jpeg"
                style={{ display: 'none' }}
                onChange={(e) => handleAvatarSelect(e.target.files?.[0])}
              />
              {avatarPreview && !avatarUploaded && (
                <Button
                  color="green"
                  radius="xl"
                  loading={avatarUploading}
                  leftSection={<IconCheck size={16} />}
                  onClick={handleAvatarUpload}
                >
                  Confirmar foto
                </Button>
              )}
            </Group>
          </Stack>
        )}
        {/* ── Step 1: Sobre você ───────────────────────── */}
        {active === 1 && (
          <Stack gap="md">
            <Title order={3} fw={700} ta="center">
              Conte um pouco sobre você
            </Title>

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  withAsterisk
                  label="Nome e Sobrenome"
                  placeholder="ex: João Silva"
                  error={profileForm.errors.full_name}
                  {...profileForm.getInputProps('full_name')}
                  onChange={(e) => profileForm.setFieldValue('full_name', e.target.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  withAsterisk
                  label="Username"
                  placeholder="ex: joaosilva"
                  loading={usernameChecking}
                  rightSection={
                    !usernameChecking && usernameAvailable === true ? (
                      <IconCheck size={16} color="var(--mantine-color-green-6)" />
                    ) : !usernameChecking && usernameAvailable === false ? (
                      <IconX size={16} color="var(--mantine-color-red-6)" />
                    ) : null
                  }
                  error={
                    profileForm.errors.username ||
                    (usernameAvailable === false
                      ? usernameUnavailableReason === 'reserved'
                        ? 'Este username não está disponível'
                        : 'Este username já está em uso'
                      : undefined)
                  }
                  {...profileForm.getInputProps('username')}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase()
                    profileForm.setFieldValue('username', value)
                    setUsernameAvailable(null)
                    handleUsernameCheck(value)
                  }}
                />
                {usernameAvailable === false && (
                  <Badge color="red" variant="light" size="sm" fw="500">
                    Username já em uso
                  </Badge>
                )}
              </Grid.Col>
            </Grid>

            <TextInput
              label="Título (opcional)"
              placeholder="Ex: Guitarrista e produtor com 10 anos de experiência"
              maxLength={70}
              description={`${profileForm.values.title.length}/70`}
              error={profileForm.errors.title}
              {...profileForm.getInputProps('title')}
              onChange={(e) => profileForm.setFieldValue('title', e.target.value)}
            />

            <Textarea
              label="Bio (opcional)"
              placeholder="Ex: Desde cedo me interessei por música e tive a sorte de ter uma família que me apoiou..."
              maxLength={500}
              description={`${profileForm.values.bio.length}/500`}
              autosize
              minRows={2}
              {...profileForm.getInputProps('bio')}
            />

            <Grid>
              <Grid.Col span={6}>
                <NativeSelect
                  withAsterisk
                  label="Estado"
                  {...profileForm.getInputProps('region_id')}
                  onChange={(e) => {
                    profileForm.setFieldValue('region_id', e.target.value)
                    setSelectedCity(null)
                    setCityResults([])
                  }}
                >
                  <option value="">Selecione</option>
                  {regions.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name}
                    </option>
                  ))}
                </NativeSelect>
              </Grid.Col>
              <Grid.Col span={6}>
                <Input.Wrapper label="Cidade" withAsterisk>
                  <Input
                    pointer
                    readOnly
                    placeholder={
                      profileForm.values.region_id
                        ? 'Selecionar...'
                        : 'Selecione o Estado'
                    }
                    disabled={!profileForm.values.region_id}
                    value={selectedCity?.name ?? ''}
                    rightSection={
                      profileForm.values.region_id ? <IconSearch size={15} /> : undefined
                    }
                    onClick={() => {
                      if (profileForm.values.region_id) {
                        openCityModal()
                      }
                    }}
                  />
                </Input.Wrapper>
              </Grid.Col>
            </Grid>
          </Stack>
        )}

        {/* ── Step 2: Atividades musicais ──────────────── */}
        {active === 2 && (
          <Stack gap="md">
            <Title order={3} fw={700} ta="center">
              Sua ligação com a música
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Quais suas principais atividades? Selecione todas que se aplicam.
            </Text>

            {(() => {
              const filteredManagement = rolesManagement
                // .filter((r) => !userRoles.find((ur) => ur.id === Number(r.value)))
                .filter(
                  (r) =>
                    r.label.toLowerCase().includes(roleSearch.toLowerCase().trim()) ||
                    r.name?.toLowerCase().includes(roleSearch.toLowerCase().trim()) ||
                    r.tags?.toLowerCase().includes(roleSearch.toLowerCase().trim()),
                )

              const filteredMusicians = rolesMusicians
                // .filter((r) => !userRoles.find((ur) => ur.id === Number(r.value)))
                .filter(
                  (r) =>
                    r.label.toLowerCase().includes(roleSearch.toLowerCase().trim()) ||
                    r.name?.toLowerCase().includes(roleSearch.toLowerCase().trim()) ||
                    r.tags?.toLowerCase().includes(roleSearch.toLowerCase().trim()),
                )

              const hasOptions =
                filteredManagement.length > 0 || filteredMusicians.length > 0

              return (
                <Combobox
                  store={comboboxRole}
                  onOptionSubmit={(val) => {
                    handleAddRole(val)
                    comboboxRole.closeDropdown()
                    setRoleSearch('')
                  }}
                >
                  <Combobox.Target>
                    <TextInput
                      // label="Adicionar atividade"
                      placeholder={addingRole ? 'Salvando...' : 'Buscar atividade...'}
                      disabled={addingRole}
                      size="md"
                      value={roleSearch}
                      onChange={(e) => {
                        setRoleSearch(e.target.value)
                        comboboxRole.openDropdown()
                        comboboxRole.updateSelectedOptionIndex()
                      }}
                      onClick={() => comboboxRole.openDropdown()}
                      onFocus={() => comboboxRole.openDropdown()}
                      onBlur={() => comboboxRole.closeDropdown()}
                      rightSection={
                        addingRole ? <Loader size={16} /> : <Combobox.Chevron />
                      }
                      rightSectionPointerEvents="none"
                    />
                  </Combobox.Target>

                  <Combobox.Dropdown>
                    <Combobox.Search
                      value={roleSearch}
                      onChange={(e) => {
                        setRoleSearch(e.target.value)
                        comboboxRole.updateSelectedOptionIndex()
                      }}
                      placeholder="Buscar..."
                    />
                    <Combobox.Options>
                      <ScrollArea.Autosize type="scroll" mah={184}>
                        {!hasOptions && (
                          <Combobox.Empty>Nenhuma atividade encontrada</Combobox.Empty>
                        )}
                        {filteredManagement.length > 0 && (
                          <Combobox.Group label="Gestão, produção e outros">
                            {filteredManagement.map((r) => (
                              <Combobox.Option
                                key={r.value}
                                value={r.value}
                                disabled={userRoles.find(
                                  (ur) => ur.id === Number(r.value),
                                )}
                              >
                                {r.label}
                              </Combobox.Option>
                            ))}
                          </Combobox.Group>
                        )}
                        {filteredMusicians.length > 0 && (
                          <Combobox.Group label="Instrumentos">
                            {filteredMusicians.map((r) => (
                              <Combobox.Option
                                key={r.value}
                                value={r.value}
                                disabled={userRoles.find(
                                  (ur) => ur.id === Number(r.value),
                                )}
                              >
                                {r.label}
                              </Combobox.Option>
                            ))}
                          </Combobox.Group>
                        )}
                      </ScrollArea.Autosize>
                    </Combobox.Options>
                  </Combobox.Dropdown>
                </Combobox>
              )
            })()}

            {userRoles.length > 0 && (
              <Group gap={6}>
                {userRoles.map((role) => (
                  <Badge
                    key={role.id}
                    size="md"
                    variant="gradient"
                    gradient={{ from: 'grape.9', to: 'mublinColor.9', deg: 190 }}
                    rightSection={
                      <IconX
                        style={{ width: 10, height: 10, cursor: 'pointer' }}
                        stroke={3}
                        onClick={() => handleRemoveRole(role.id)}
                      />
                    }
                  >
                    {role.name} {role.main_activity ? '( atividade principal)' : ''}
                  </Badge>
                ))}
              </Group>
            )}

            {userRoles.length === 0 && (
              <Text size="md" c="dimmed" ta="center">
                Nenhuma atividade adicionada ainda
              </Text>
            )}
          </Stack>
        )}
        {/* ── Step 3: Projetos ─────────────────────────── */}
        {active === 3 && (
          <Stack gap="md">
            <Title order={3} fw={700} ta="center">
              Seus projetos musicais
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              De quais projetos ou bandas você participa ou já participou?
            </Text>

            <TextInput
              placeholder="Buscar projeto ou banda..."
              size="md"
              leftSection={<IconSearch size={15} />}
              rightSection={projectSearchLoading && <Loader size={15} />}
              value={projectSearch}
              onChange={(e) => {
                setProjectSearch(e.target.value)
                handleProjectSearch(e.target.value)
              }}
            />

            {projectResults.length > 0 && (
              <ScrollArea h={130} type="always">
                <Stack gap={0}>
                  {projectResults.map((project) => {
                    const alreadyAdded = userProjects.find((p) => p.id === project.id)
                    return (
                      <Box key={project.id}>
                        <Group
                          py="xs"
                          gap="sm"
                          style={{
                            cursor: alreadyAdded ? 'default' : 'pointer',
                            opacity: alreadyAdded ? 0.5 : 1,
                          }}
                          onClick={() => !alreadyAdded && handleSelectProject(project)}
                        >
                          <Avatar
                            size={64}
                            radius="md"
                            src={
                              project.picture
                                ? `https://ik.imagekit.io/mublin/projects/${project.id}/tr:h-128/${project.picture}`
                                : undefined
                            }
                          />
                          <Stack gap={2} style={{ flex: 1 }}>
                            <Group gap="xs">
                              <Text size="sm" fw={600}>
                                {project.name}
                              </Text>
                              {alreadyAdded && (
                                <ThemeIcon size={18} radius="xl" color="mublinColor">
                                  <IconCheck
                                    style={{ width: 12, height: 12 }}
                                    stroke={3}
                                  />
                                </ThemeIcon>
                              )}
                            </Group>
                            {project.description && (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {project.description}
                              </Text>
                            )}
                            <Text size="xs">
                              {project.project_types?.name_ptbr &&
                                `${project.project_types?.name_ptbr}  · `}
                              {project.genres?.name_ptbr &&
                                `${project.genres?.name_ptbr}  · `}
                              {[
                                project.cities?.name,
                                project.cities?.regions?.name,
                                project.cities?.countries?.name_ptbr ??
                                  project.cities?.countries?.name,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </Text>

                            {/* ── Membros ───────────────────────────────── */}
                            {(() => {
                              const members = [...(project.project_members ?? [])].sort(
                                (a, b) => (b.is_founder ? 1 : 0) - (a.is_founder ? 1 : 0),
                              )

                              const visible = members.slice(0, 3)
                              const extra = members.length - 3

                              if (!visible.length) {
                                return null
                              }

                              const names = visible
                                .map((m) => m.profiles?.full_name)
                                .filter(Boolean)

                              const suffix =
                                members.length === 1
                                  ? ' faz parte deste projeto'
                                  : ' fazem parte deste projeto'

                              const label =
                                extra > 0
                                  ? `${names.join(', ')} e +${extra}${suffix}`
                                  : `${names.join(', ')}${suffix}`

                              return (
                                <Text size="xs" c="dimmed" fw={300}>
                                  {label}
                                </Text>
                              )
                            })()}
                          </Stack>
                        </Group>
                        <Divider />
                      </Box>
                    )
                  })}
                </Stack>
              </ScrollArea>
            )}

            {userProjects.length > 0 && (
              <Stack gap={4}>
                <Text size="sm" fw={600} c="dimmed">
                  {userProjects.length}{' '}
                  {userProjects.length === 1
                    ? 'projeto adicionado'
                    : 'projetos adicionados'}
                  :
                </Text>
                <Group gap={6}>
                  {userProjects.map((project) => (
                    <Pill
                      key={project.id}
                      withRemoveButton
                      onRemove={async () => {
                        // 1. Verifica se há outros membros aceitos neste projeto
                        const { data: activeMembers } = await supabase
                          .from('project_members')
                          .select('id, profile_id')
                          .eq('project_id', project.id)
                          .eq('status', 2)

                        const otherActiveMembers = activeMembers?.filter(
                          (m) => m.profile_id !== user.id,
                        )

                        if (!otherActiveMembers?.length) {
                          // 2a. Sem outros membros: deleta o projeto
                          // (CASCADE remove os project_members automaticamente)
                          await supabase.from('projects').delete().eq('id', project.id)
                        } else {
                          // 2b. Há outros membros: remove só a participação do usuário
                          await supabase
                            .from('project_members')
                            .delete()
                            .eq('project_id', project.id)
                            .eq('profile_id', user.id)
                        }

                        // 3. Atualiza o estado local
                        setUserProjects((prev) => prev.filter((p) => p.id !== project.id))

                        // 4. Exibe notificação
                        notifications.show({
                          color: 'green',
                          position: 'top-center',
                          message: !otherActiveMembers?.length
                            ? 'Projeto permanentemente removido com sucesso do Mublin'
                            : 'Sua participação foi removida com sucesso do projeto',
                        })
                      }}
                      size="sm"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar
                          src={`https://ik.imagekit.io/mublin/projects/${project.id}/tr:h-150/${project.picture}`}
                          size={16}
                        />
                        {project.name}
                      </div>
                    </Pill>
                  ))}
                </Group>
              </Stack>
            )}

            <Button
              variant="outline"
              color="teal"
              size="sm"
              mt={userProjects.length === 0 ? 26 : 0}
              onClick={() => openNewProjectModal()}
            >
              Não encontrou? Cadastre um novo projeto
            </Button>
            <Text size="sm" c="dimmed" ta="center">
              Não se preocupe, você poderá adicionar mais projetos depois!
            </Text>
          </Stack>
        )}
        {/* ── Navegação ────────────────────────────────── */}
        <Group
          justify="center"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            backgroundColor: 'var(--mantine-color-body)',
            borderTop: '1px solid var(--mantine-color-default-border)',
            zIndex: 100,
          }}
          mt="md"
        >
          {active > 0 ? (
            <Button
              variant="default"
              radius="xl"
              size="lg"
              leftSection={<IconArrowLeft size={14} />}
              onClick={handleBack}
            >
              Voltar
            </Button>
          ) : (
            <Box />
          )}

          {active < 3 ? (
            <Group gap="sm">
              {active === 0 && (
                <Button
                  variant="outline"
                  color="var(--mantine-color-text)"
                  radius="xl"
                  size="lg"
                  onClick={() => setActive(1)}
                >
                  Pular
                </Button>
              )}
              <Button
                color="mublinColor"
                radius="xl"
                size="lg"
                rightSection={<IconArrowRight size={14} />}
                loading={isSubmitting}
                onClick={handleNext}
              >
                Avançar
              </Button>
            </Group>
          ) : (
            <Button
              color="mublinColor"
              radius="xl"
              size="lg"
              loading={isSubmitting}
              onClick={handleFinish}
            >
              Concluir
            </Button>
          )}
        </Group>
      </Stack>

      {/* ── Modal busca de cidade ─────────────────────── */}
      <Modal
        title="Selecionar cidade"
        opened={modalCityOpened}
        onClose={closeCityModal}
        size="sm"
        radius="md"
        centered
      >
        <Stack gap="sm">
          <TextInput
            placeholder="Digite o nome da cidade..."
            data-autofocus
            value={citySearchQuery}
            rightSection={
              citySearchLoading ? <Loader size={16} /> : <IconSearch size={16} />
            }
            onChange={(e) => {
              setCitySearchQuery(e.target.value)
              handleCitySearch(e.target.value)
            }}
          />
          {noCityResults && (
            <Text size="xs" c="dimmed">
              Nenhuma cidade encontrada.
            </Text>
          )}
          {cityResults.length > 0 && (
            <ScrollArea h={200} type="auto">
              <Stack gap={0}>
                {cityResults.map((city) => (
                  <Box key={city.id}>
                    <Anchor
                      size="sm"
                      py={8}
                      display="block"
                      underline="never"
                      c="inherit"
                      onClick={() => {
                        setSelectedCity({ id: city.id, name: city.name })
                        closeCityModal()
                        setCitySearchQuery('')
                        setCityResults([])
                      }}
                    >
                      {city.name}
                    </Anchor>
                    <Divider />
                  </Box>
                ))}
              </Stack>
            </ScrollArea>
          )}
        </Stack>
      </Modal>

      {/* ── Modal ingressar em projeto ────────────────── */}
      <JoinProjectModal
        opened={modalJoinOpened}
        onClose={closeJoinModal}
        project={selectedProject}
        rolesProjectManagement={rolesProjectManagement}
        rolesProjectMusicians={rolesProjectMusicians}
        joinRole={joinRole}
        setJoinRole={setJoinRole}
        joinYear={joinYear}
        setJoinYear={setJoinYear}
        onConfirm={handleJoinProject}
        loading={joiningProject}
        currentYear={currentYear}
        projectEndYear={projectEndYear}
        projectFoundationYear={projectFoundationYear}
      />

      <Modal
        opened={modalNewProjectOpened}
        onClose={closeNewProjectModal}
        size="xl"
        radius="md"
        title="Cadastrar um novo projeto"
        centered
      >
        <NewProject
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['profile-projects', user?.id] })
            closeNewProjectModal()
          }}
          isModal
        />
      </Modal>
    </Container>
  )
}
