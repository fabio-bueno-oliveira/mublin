import { useState, useEffect, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUserProfile, fetchUserRoles } from '../queries/user'
import { fetchAllRoles } from '../queries/roles'
import { searchArtist } from '../queries/artists'
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
  MultiSelect,
  Switch,
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
  Loader,
  ActionIcon,
  Radio,
  NumberInput,
  Pill,
  Tooltip,
} from '@mantine/core'
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
  IconPlus,
  IconTrash,
  IconDisc,
  IconMicrophone2,
  IconStarFilled,
  IconStar,
} from '@tabler/icons-react'
const NewProject = lazy(() => import('./NewProject'))

const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-96,w-96,c-maintain_ratio/'
const PROJECTS_PATH =
  'https://ik.imagekit.io/mublin/projects/tr:h-96,w-96,c-maintain_ratio/'

// ── Queries locais (portfólio) ─────────────────────────────

async function fetchUserPortfolio(profileId) {
  const { data, error } = await supabase
    .from('portfolio')
    .select(
      `
      id,
      order_number,
      notes,
      project_id,
      artist_id,
      year_start,
      year_end,
      is_sporadic,
      is_mublin_facilitated,
      projects ( id, name, picture ),
      artists ( id, name, picture ),
      portfolio_roles ( role_id, roles ( id, name_ptbr ) ),
      portfolio_engagement_types (
        engagement_type_id,
        project_engagement_types ( id, name_ptbr )
      )
    `,
    )
    .eq('profile_id', profileId)
    .order('order_number', { ascending: true, nullsFirst: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchAllEngagementTypes() {
  const { data, error } = await supabase
    .from('project_engagement_types')
    .select('id, name_ptbr')
    .order('name_ptbr')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// Busca local de projetos já cadastrados no Mublin (mesmo padrão do Portfolio.jsx)
async function searchProjects(keyword) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, picture')
    .ilike('name', `%${keyword}%`)
    .limit(10)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

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

  // ── Step 4: Portfólio ──────────────────────────────────
  const [selectedRoleIds, setSelectedRoleIds] = useState([])
  const [selectedEngagementTypeIds, setSelectedEngagementTypeIds] = useState([])
  const [entryType, setEntryType] = useState('project') // 'project' | 'artist'
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [portfolioNotes, setPortfolioNotes] = useState('')
  const [portfolioYearStart, setPortfolioYearStart] = useState('')
  const [portfolioYearEnd, setPortfolioYearEnd] = useState('')
  const [portfolioIsSporadic, setPortfolioIsSporadic] = useState(false)
  const [portfolioIsMublinFacilitated, setPortfolioIsMublinFacilitated] = useState(false)
  const [isSavingPortfolioItem, setIsSavingPortfolioItem] = useState(false)
  const [isDeletingPortfolioItem, setIsDeletingPortfolioItem] = useState(false)

  const [projectSearch, setProjectSearch] = useState('')
  const [projectResults, setProjectResults] = useState([])
  const [projectSearchLoading, setProjectSearchLoading] = useState(false)

  const [artistSearch, setArtistSearch] = useState('')
  const [artistResults, setArtistResults] = useState([])
  const [artistSearchLoading, setArtistSearchLoading] = useState(false)

  const [modalPortfolioOpened, { open: openPortfolioModal, close: closePortfolioModal }] =
    useDisclosure(false)

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

  const { data: userPortfolio = [], isLoading: loadingPortfolio } = useQuery({
    queryKey: ['profile-portfolio', user?.id],
    queryFn: () => fetchUserPortfolio(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchAllRoles,
    staleTime: 1000 * 60 * 30,
  })

  const { data: allEngagementTypes = [] } = useQuery({
    queryKey: ['all-engagement-types'],
    queryFn: fetchAllEngagementTypes,
    staleTime: Infinity,
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

  const roleSelectData = [
    {
      group: 'Gestão, produção e outros',
      items: roles
        .filter((r) => !r.instrumentalist)
        .map((r) => ({ value: String(r.id), label: r.name_ptbr })),
    },
    {
      group: 'Instrumentos',
      items: roles
        .filter((r) => r.instrumentalist)
        .map((r) => ({ value: String(r.id), label: r.name_ptbr })),
    },
  ]

  const engagementTypeSelectData = allEngagementTypes.map((t) => ({
    value: String(t.id),
    label: t.name_ptbr,
  }))

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

  // ── Handlers ──────────────────────────────────────────

  // Step 1 — Avatar
  function handleAvatarSelect(file) {
    if (!file) {
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarUploaded(false)
    // Upload direto, sem exigir confirmação manual do usuário
    handleAvatarUpload(file)
  }

  async function handleAvatarUpload(file) {
    const fileToUpload = file ?? avatarFile
    if (!fileToUpload) {
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
        file: fileToUpload,
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
        { id: role.id, name: role.name_ptbr, main_activity: isFirst },
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

  async function handleSetMainActivity(roleId) {
    const previousMain = userRoles.find((r) => r.main_activity)
    if (previousMain?.id === roleId) {
      return
    }

    // Atualização otimista
    setUserRoles((prev) => prev.map((r) => ({ ...r, main_activity: r.id === roleId })))

    const updates = [
      supabase
        .from('profile_roles')
        .update({ main_activity: true })
        .eq('id_profile', user.id)
        .eq('id_role', roleId),
    ]
    if (previousMain) {
      updates.push(
        supabase
          .from('profile_roles')
          .update({ main_activity: false })
          .eq('id_profile', user.id)
          .eq('id_role', previousMain.id),
      )
    }

    const results = await Promise.all(updates)
    const hasError = results.some((r) => r.error)

    if (hasError) {
      // Reverte em caso de erro
      setUserRoles((prev) =>
        prev.map((r) => ({
          ...r,
          main_activity: previousMain ? r.id === previousMain.id : false,
        })),
      )
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao atualizar atividade principal. Tente novamente.',
      })
    }
  }

  // Step 4 — Portfólio
  const handleProjectSearch = useDebouncedCallback(async (query) => {
    if (query.trim().length < 2) {
      setProjectResults([])
      return
    }
    setProjectSearchLoading(true)
    try {
      const results = await searchProjects(query)
      setProjectResults(results)
    } catch (err) {
      console.error(err)
    } finally {
      setProjectSearchLoading(false)
    }
  }, 500)

  const handleArtistSearch = useDebouncedCallback(async (query) => {
    if (query.trim().length < 2) {
      setArtistResults([])
      return
    }
    setArtistSearchLoading(true)
    try {
      const results = await searchArtist(query)
      setArtistResults(results)
    } catch (err) {
      console.error(err)
    } finally {
      setArtistSearchLoading(false)
    }
  }, 500)

  function resetPortfolioForm() {
    setSelectedRoleIds([])
    setSelectedEngagementTypeIds([])
    setEntryType('project')
    setSelectedProject(null)
    setSelectedArtist(null)
    setPortfolioNotes('')
    setPortfolioYearStart('')
    setPortfolioYearEnd('')
    setPortfolioIsSporadic(false)
    setPortfolioIsMublinFacilitated(false)
    setProjectSearch('')
    setProjectResults([])
    setArtistSearch('')
    setArtistResults([])
  }

  function handleOpenPortfolioModal() {
    resetPortfolioForm()
    openPortfolioModal()
  }

  function handleClosePortfolioModal() {
    closePortfolioModal()
    resetPortfolioForm()
  }

  async function handleAddPortfolioItem() {
    if (selectedRoleIds.length === 0) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Selecione ao menos um papel exercido no projeto.',
      })
      return
    }
    if (!selectedProject && !selectedArtist) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Selecione um projeto ou artista.',
      })
      return
    }

    setIsSavingPortfolioItem(true)
    const nextOrder = userPortfolio.length + 1

    const { data: insertedPortfolio, error } = await supabase
      .from('portfolio')
      .insert({
        profile_id: user.id,
        project_id: selectedProject ? Number(selectedProject.id) : null,
        artist_id: selectedArtist ? Number(selectedArtist.id) : null,
        order_number: nextOrder,
        notes: portfolioNotes.trim() ? portfolioNotes.trim() : null,
        year_start:
          !portfolioIsSporadic && portfolioYearStart ? Number(portfolioYearStart) : null,
        year_end:
          !portfolioIsSporadic && portfolioYearEnd ? Number(portfolioYearEnd) : null,
        is_sporadic: portfolioIsSporadic,
        is_mublin_facilitated: portfolioIsMublinFacilitated,
      })
      .select('id')
      .single()

    if (error || !insertedPortfolio) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar item ao portfólio. Tente novamente.',
      })
      setIsSavingPortfolioItem(false)
      return
    }

    const portfolioId = insertedPortfolio.id

    const rolesPayload = selectedRoleIds.map((roleId) => ({
      portfolio_id: portfolioId,
      role_id: Number(roleId),
    }))
    const engagementPayload = selectedEngagementTypeIds.map((typeId) => ({
      portfolio_id: portfolioId,
      engagement_type_id: Number(typeId),
    }))

    const [{ error: rolesError }, engagementResult] = await Promise.all([
      supabase.from('portfolio_roles').insert(rolesPayload),
      engagementPayload.length > 0
        ? supabase.from('portfolio_engagement_types').insert(engagementPayload)
        : Promise.resolve({ error: null }),
    ])
    const engagementError = engagementResult?.error

    if (rolesError || engagementError) {
      console.error(rolesError || engagementError)
      notifications.show({
        color: 'yellow',
        position: 'top-center',
        message:
          'Item criado, mas houve um erro ao salvar papéis/tipos de vínculo. Você pode revisar depois em Configurações.',
      })
    } else {
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Item adicionado ao seu portfólio!',
      })
    }

    await queryClient.refetchQueries({ queryKey: ['profile-portfolio', user.id] })
    handleClosePortfolioModal()
    setIsSavingPortfolioItem(false)
  }

  async function handleRemovePortfolioItem(itemId) {
    setIsDeletingPortfolioItem(true)
    const { error } = await supabase.from('portfolio').delete().eq('id', itemId)
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover item do portfólio.',
      })
    } else {
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Item removido do portfólio.',
      })
    }
    await queryClient.refetchQueries({ queryKey: ['profile-portfolio', user.id] })
    setIsDeletingPortfolioItem(false)
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
      <style>{`
        .portfolio-search-result:hover {
          background-color: var(--mantine-color-default-hover);
        }
      `}</style>
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

            <Box style={{ position: 'relative' }}>
              <Avatar
                size={120}
                src={
                  avatarPreview ||
                  (profile?.avatar ? AVATAR_PATH + profile.avatar : undefined)
                }
                style={{
                  border: '3px solid var(--mantine-color-default-border)',
                  opacity: avatarUploading ? 0.5 : 1,
                  transition: 'opacity 150ms ease',
                }}
              />
              {avatarUploading && (
                <Loader
                  size="md"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
              {avatarUploaded && !avatarUploading && (
                <ActionIcon
                  radius="xl"
                  size={28}
                  color="green"
                  variant="filled"
                  style={{ position: 'absolute', bottom: 0, right: 0 }}
                >
                  <IconCheck size={16} />
                </ActionIcon>
              )}
            </Box>

            <Box h={18}>
              {avatarUploading && (
                <Text size="xs" c="dimmed" fw={500}>
                  Enviando... {uploadProgress}%
                </Text>
              )}
            </Box>

            <Group gap="sm">
              <Button
                variant="default"
                radius="xl"
                leftSection={<IconUpload size={16} />}
                component="label"
                htmlFor="avatar-input"
                disabled={avatarUploading}
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
                  success={!usernameChecking && usernameAvailable === true}
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
              <Pill.Group>
                {userRoles.map((role) => (
                  <Pill
                    key={role.id}
                    size="md"
                    withRemoveButton
                    onRemove={() => handleRemoveRole(role.id)}
                    style={
                      role.main_activity
                        ? {
                            background:
                              'linear-gradient(190deg, var(--mantine-color-grape-9), var(--mantine-color-mublinColor-9))',
                            color: 'white',
                          }
                        : undefined
                    }
                  >
                    <Group gap={4} wrap="nowrap" component="span">
                      <Tooltip
                        label={
                          role.main_activity
                            ? 'Atividade principal'
                            : 'Definir como atividade principal'
                        }
                        withArrow
                      >
                        <ActionIcon
                          size={14}
                          variant="transparent"
                          c={role.main_activity ? 'white' : 'gray'}
                          onClick={() => handleSetMainActivity(role.id)}
                        >
                          {role.main_activity ? (
                            <IconStarFilled size={12} />
                          ) : (
                            <IconStar size={12} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                      {role.name}
                    </Group>
                  </Pill>
                ))}
              </Pill.Group>
            )}

            {userRoles.length === 0 && (
              <Text size="md" c="dimmed" ta="center">
                Nenhuma atividade adicionada ainda
              </Text>
            )}
          </Stack>
        )}
        {/* ── Step 3: Portfólio ────────────────────────── */}
        {active === 3 && (
          <Stack gap="sm">
            <Title order={3} fw={700} ta="center">
              Seu portfólio
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Em quais projetos, bandas ou com quais artistas você já atuou?
            </Text>

            <Button
              variant="filled"
              color="mublinColor"
              size="sm"
              mt={userPortfolio.length === 0 ? 16 : 0}
              leftSection={<IconPlus size={14} />}
              onClick={handleOpenPortfolioModal}
            >
              Adicionar ao portfólio
            </Button>

            {loadingPortfolio ? (
              <Text size="sm" c="dimmed" ta="center">
                Carregando...
              </Text>
            ) : userPortfolio.length > 0 ? (
              <Stack gap="xs">
                {userPortfolio.map((item) => {
                  const entity = item.projects || item.artists
                  const isProject = !!item.projects
                  const picture = entity?.picture
                    ? (isProject ? `${PROJECTS_PATH}${item.project_id}/` : ARTISTS_PATH) +
                      entity.picture
                    : undefined
                  const roleNames =
                    item.portfolio_roles
                      ?.map((pr) => pr.roles?.name_ptbr)
                      .filter(Boolean) ?? []

                  return (
                    <Group key={item.id} gap="sm" justify="space-between" wrap="nowrap">
                      <Group
                        gap="sm"
                        align="flex-start"
                        wrap="nowrap"
                        style={{ flex: 1, minWidth: 0 }}
                      >
                        <Avatar
                          size={40}
                          radius="xl"
                          src={picture}
                          style={{ flexShrink: 0 }}
                        >
                          {isProject ? (
                            <IconDisc size={18} />
                          ) : (
                            <IconMicrophone2 size={18} />
                          )}
                        </Avatar>
                        <Stack gap={0} style={{ minWidth: 0 }}>
                          <Text size="md" fw={400} truncate>
                            {entity?.name || 'Sem título'}
                          </Text>
                          <Text size="xs" c="dimmed" truncate>
                            {roleNames.join(', ')}
                          </Text>
                        </Stack>
                      </Group>
                      <ActionIcon
                        size="lg"
                        variant="subtle"
                        color="red"
                        loading={isDeletingPortfolioItem}
                        onClick={() => handleRemovePortfolioItem(item.id)}
                        title="Remover item"
                        style={{ flexShrink: 0 }}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  )
                })}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" ta="center">
                Nenhum item adicionado ainda
              </Text>
            )}

            {/* <Button
              mt="xs"
              variant="outline"
              color="teal"
              size="xs"
              onClick={() => openNewProjectModal()}
            >
              Não encontrou? Cadastre um novo projeto
            </Button> */}
            <Text size="sm" c="dimmed" ta="center">
              Não se preocupe, você poderá adicionar mais itens depois!
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

      {/* ── Modal adicionar ao portfólio ──────────────── */}
      <Modal
        title="Adicionar ao portfólio"
        opened={modalPortfolioOpened}
        onClose={handleClosePortfolioModal}
        size="sm"
        radius="md"
        centered
      >
        <Stack gap="sm">
          <MultiSelect
            label="Papéis exercidos"
            placeholder={
              selectedRoleIds.length === 0 ? 'Selecione um ou mais papéis' : undefined
            }
            data={roleSelectData}
            value={selectedRoleIds}
            onChange={setSelectedRoleIds}
            searchable
            clearable
            size="sm"
          />

          <MultiSelect
            label="Tipo de vínculo (opcional)"
            placeholder={
              selectedEngagementTypeIds.length === 0
                ? 'Ex: turnê, gravação, show único...'
                : undefined
            }
            data={engagementTypeSelectData}
            value={selectedEngagementTypeIds}
            onChange={setSelectedEngagementTypeIds}
            searchable
            clearable
            size="sm"
          />

          <Radio.Group
            label="Onde você atuou?"
            description="Escolha uma opção e depois busque pelo nome na lista abaixo"
            value={entryType}
            onChange={(value) => {
              setEntryType(value)
              setSelectedProject(null)
              setSelectedArtist(null)
              setProjectSearch('')
              setProjectResults([])
              setArtistSearch('')
              setArtistResults([])
            }}
          >
            <Stack gap={6} mt={6}>
              <Radio
                value="project"
                label="Uma banda/projeto já cadastrado no Mublin"
                size="sm"
              />
              <Radio
                value="artist"
                label="Um artista, banda ou projeto famoso (fora do Mublin)"
                description="Ex: artistas mainstream, bandas consagradas..."
                size="sm"
              />
            </Stack>
          </Radio.Group>

          {entryType === 'project' &&
            (selectedProject ? (
              <Group gap="sm" justify="space-between" p={6}>
                <Group gap="sm">
                  <Avatar
                    size={32}
                    radius="xl"
                    src={
                      selectedProject.picture
                        ? `${PROJECTS_PATH}${selectedProject.id}/${selectedProject.picture}`
                        : undefined
                    }
                  >
                    <IconDisc size={16} />
                  </Avatar>
                  <Text size="sm" fw={600}>
                    {selectedProject.name}
                  </Text>
                </Group>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => setSelectedProject(null)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            ) : (
              <Stack gap="xs">
                <TextInput
                  placeholder="Digite o nome do projeto ou banda..."
                  leftSection={<IconSearch size={15} />}
                  rightSection={projectSearchLoading ? <Loader size="xs" /> : undefined}
                  value={projectSearch}
                  onChange={(e) => {
                    setProjectSearch(e.target.value)
                    handleProjectSearch(e.target.value)
                  }}
                />
                {projectSearch.length < 2 && (
                  <Text size="xs" c="dimmed">
                    Digite ao menos 2 letras. Os resultados aparecem abaixo — toque em um
                    deles para selecionar.
                  </Text>
                )}
                {projectResults.length > 0 && (
                  <Stack gap={2} mah={220} style={{ overflowY: 'auto' }}>
                    {projectResults.map((project) => (
                      <Group
                        key={project.id}
                        gap="sm"
                        justify="space-between"
                        p={6}
                        style={{
                          cursor: 'pointer',
                          borderRadius: 8,
                        }}
                        className="portfolio-search-result"
                        onClick={() => {
                          setSelectedProject(project)
                          setProjectSearch('')
                          setProjectResults([])
                        }}
                      >
                        <Group gap="sm">
                          <Avatar
                            size={32}
                            radius="xl"
                            src={
                              project.picture
                                ? `${PROJECTS_PATH}${project.id}/${project.picture}`
                                : undefined
                            }
                          >
                            <IconDisc size={16} />
                          </Avatar>
                          <Text size="sm">{project.name}</Text>
                        </Group>
                        <Button size="xs" variant="light" tabIndex={-1}>
                          Selecionar
                        </Button>
                      </Group>
                    ))}
                  </Stack>
                )}
                {projectSearch.length >= 2 &&
                  !projectSearchLoading &&
                  projectResults.length === 0 && (
                    <Stack gap={10} align="center">
                      <Text size="sm" ta="center">
                        Nenhum projeto encontrado com esse nome.
                      </Text>
                      <Button
                        variant="filled"
                        color="green"
                        size="xs"
                        onClick={() => openNewProjectModal()}
                      >
                        Cadastrar “{projectSearch}” no Mublin
                      </Button>
                    </Stack>
                  )}
              </Stack>
            ))}

          {entryType === 'artist' &&
            (selectedArtist ? (
              <Group gap="sm" justify="space-between" p={6}>
                <Group gap="sm">
                  <Avatar
                    size={32}
                    radius="xl"
                    src={
                      selectedArtist.picture
                        ? ARTISTS_PATH + selectedArtist.picture
                        : undefined
                    }
                  >
                    <IconMicrophone2 size={16} />
                  </Avatar>
                  <Text size="sm" fw={600}>
                    {selectedArtist.name}
                  </Text>
                </Group>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => setSelectedArtist(null)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            ) : (
              <Stack gap="xs">
                <TextInput
                  placeholder="Digite o nome do artista, banda ou projeto..."
                  leftSection={<IconSearch size={15} />}
                  rightSection={artistSearchLoading ? <Loader size="xs" /> : undefined}
                  value={artistSearch}
                  onChange={(e) => {
                    setArtistSearch(e.target.value)
                    handleArtistSearch(e.target.value)
                  }}
                />
                {artistSearch.length < 2 && (
                  <Text size="xs" c="dimmed">
                    Digite ao menos 2 letras. Os resultados aparecem abaixo — toque em um
                    deles para selecionar.
                  </Text>
                )}
                {artistResults.length > 0 && (
                  <Stack gap={2} mah={220} style={{ overflowY: 'auto' }}>
                    {artistResults.map((artist) => (
                      <Group
                        key={artist.id}
                        gap="sm"
                        justify="space-between"
                        p={6}
                        style={{ cursor: 'pointer', borderRadius: 8 }}
                        className="portfolio-search-result"
                        onClick={() => {
                          setSelectedArtist(artist)
                          setArtistSearch('')
                          setArtistResults([])
                        }}
                      >
                        <Group gap="sm">
                          <Avatar
                            size={32}
                            radius="xl"
                            src={
                              artist.picture ? ARTISTS_PATH + artist.picture : undefined
                            }
                          >
                            <IconMicrophone2 size={16} />
                          </Avatar>
                          <Text size="sm">{artist.name}</Text>
                        </Group>
                        <Button size="xs" variant="light" tabIndex={-1}>
                          Selecionar
                        </Button>
                      </Group>
                    ))}
                  </Stack>
                )}
                {artistSearch.length >= 2 &&
                  !artistSearchLoading &&
                  artistResults.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center">
                      Nenhum artista encontrado com esse nome.
                    </Text>
                  )}
              </Stack>
            ))}

          <Switch
            label="Colaboração esporádica"
            description="Selecione se atua pontualmente neste projeto, sem um período fixo"
            checked={portfolioIsSporadic}
            onChange={(e) => {
              const checked = e.currentTarget.checked
              setPortfolioIsSporadic(checked)
              if (checked) {
                setPortfolioYearStart('')
                setPortfolioYearEnd('')
              }
            }}
          />

          {!portfolioIsSporadic && (
            <Group grow gap="sm">
              <NumberInput
                label="Ano de início"
                description="Início da atuação"
                placeholder="Ex: 2019"
                min={1900}
                max={currentYear + 1}
                value={portfolioYearStart}
                onChange={setPortfolioYearStart}
                hideControls
              />
              <NumberInput
                label="Ano de término"
                description="Fim da atuação (opcional)"
                min={1900}
                max={currentYear + 1}
                value={portfolioYearEnd}
                onChange={setPortfolioYearEnd}
                hideControls
              />
            </Group>
          )}

          <Switch
            label="Esse vínculo foi facilitado pelo Mublin"
            color="lime"
            checked={portfolioIsMublinFacilitated}
            onChange={(e) => setPortfolioIsMublinFacilitated(e.currentTarget.checked)}
          />

          <Textarea
            label="Comentário (opcional)"
            placeholder="Ex: Guitarrista na turnê de 2019, gravei os vocais de apoio no álbum..."
            description={`${portfolioNotes.length}/2000`}
            minRows={2}
            maxRows={6}
            maxLength={2000}
            value={portfolioNotes}
            onChange={(e) => setPortfolioNotes(e.currentTarget.value)}
          />

          <Button
            fullWidth
            mt="xs"
            size="sm"
            loading={isSavingPortfolioItem}
            onClick={handleAddPortfolioItem}
          >
            Adicionar ao meu portfólio
          </Button>
          {(selectedRoleIds.length === 0 || (!selectedProject && !selectedArtist)) && (
            <Text size="xs" c="dimmed" ta="center" mt={-4}>
              {selectedRoleIds.length === 0
                ? 'Selecione ao menos um papel exercido para continuar'
                : 'Busque e selecione um projeto ou artista na lista acima para continuar'}
            </Text>
          )}
        </Stack>
      </Modal>

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
            // NOTA: se o NewProject.jsx passar a criar o vínculo via "portfolio"
            // em vez de "project_members", invalide ['profile-portfolio', user?.id] aqui.
            closeNewProjectModal()
          }}
          isModal
        />
      </Modal>
    </Container>
  )
}
