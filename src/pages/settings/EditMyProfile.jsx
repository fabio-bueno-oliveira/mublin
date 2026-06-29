import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUserProfile } from '../../queries/user'
import { fetchCityById } from '../../queries/locations'
import { supabase } from '../../lib/supabaseClient'
import {
  Stack,
  Grid,
  TextInput,
  Textarea,
  NativeSelect,
  Input,
  Select,
  Button,
  Group,
  Text,
  Anchor,
  Divider,
  Modal,
  ScrollArea,
  Box,
  Loader,
  Alert,
  Switch,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDebouncedCallback, useDisclosure, useWindowScroll } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconSearch,
  IconCheck,
  IconAlertCircle,
  IconBrandInstagram,
  IconBrandTiktok,
  IconWorld,
  IconBrandYoutube,
  IconBrandTwitch,
  IconVideo,
} from '@tabler/icons-react'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'

// ── Queries locais ────────────────────────────────────────

async function fetchGenders() {
  const { data, error } = await supabase.from('genders').select('id, label')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchRegions() {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name')
    .eq('country_id', 27)
    .order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function searchCitiesByName(query, regionId) {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name')
    .eq('region_id', regionId)
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchSocialLinks(profileId) {
  const { data, error } = await supabase
    .from('profile_social_links')
    .select('platform, handle')
    .eq('profile_id', profileId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function resetExpiredLive(userId) {
  await supabase
    .from('profiles')
    .update({
      is_live: false,
      live_platform: null,
      live_expires_at: null,
    })
    .eq('id', userId)
}

// ── Componente principal ──────────────────────────────────

export default function EditMyProfile() {
  const { user, loading, profile: authProfile } = useAuth()
  const queryClient = useQueryClient()
  const [, scrollTo] = useWindowScroll()

  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Username check ────────────────────────────────────
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(null)
  const [usernameUnavailableReason, setUsernameUnavailableReason] = useState(null)

  // ── Cidade ────────────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState(null)
  const [citySearchQuery, setCitySearchQuery] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [citySearchLoading, setCitySearchLoading] = useState(false)
  const [noCityResults, setNoCityResults] = useState(false)
  const [modalCityOpened, { open: openCityModal, close: closeCityModal }] =
    useDisclosure(false)

  // ── Live Streaming ────────────────────────────────────
  const [isLive, setIsLive] = useState(false)
  const [livePlatform, setLivePlatform] = useState('')
  const [liveDuration, setLiveDuration] = useState('')

  // ── Form ──────────────────────────────────────────────
  const form = useForm({
    initialValues: {
      full_name: '',
      username: '',
      title: '',
      bio: '',
      gender: '',
      region_id: '',
      website: '',
      instagram: '',
      tiktok: '',
      youtube: '',
      twitch: '',
      phone_number: '',
      phone_number_is_public: false,
      phone_number_is_whatsapp: false,
    },
    validate: {
      full_name: (v) => (!v?.trim() ? 'Nome completo é obrigatório' : null),
      username: (v) => {
        if (!v) {
          return 'Username é obrigatório'
        }
        if (v.length < 3) {
          return 'Mínimo 3 caracteres'
        }
        if (!/^[a-z0-9_]+$/.test(v)) {
          return 'Apenas letras minúsculas, números e _'
        }
        return null
      },
      website: (v) => {
        if (!v) {
          return null
        }
        try {
          new URL(v)
          return null
        } catch {
          return 'URL inválida. Ex: https://meusite.com'
        }
      },
    },
  })

  // ── Queries ───────────────────────────────────────────
  const { data: savedProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchUserProfile(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: regions = [] } = useQuery({
    queryKey: ['regions-br'],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 60,
  })

  const { data: savedCity } = useQuery({
    queryKey: ['city', savedProfile?.city_id],
    queryFn: () => fetchCityById(savedProfile.city_id),
    enabled: !!savedProfile?.city_id,
    staleTime: Infinity,
  })

  const { data: genders = [] } = useQuery({
    queryKey: ['genders'],
    queryFn: fetchGenders,
    staleTime: Infinity,
  })

  const { data: socialLinks = [] } = useQuery({
    queryKey: ['social-links', user?.id],
    queryFn: () => fetchSocialLinks(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  // ── Popula form com dados salvos ──────────────────────
  useEffect(() => {
    if (!savedProfile || form.values.username) {
      return
    }
    form.setValues({
      full_name: authProfile.full_name ?? '',
      username: savedProfile.username ?? '',
      title: savedProfile.title ?? '',
      bio: savedProfile.bio ?? '',
      gender: savedProfile.gender ?? '',
      region_id: savedProfile.region_id ? String(savedProfile.region_id) : '',
      website: savedProfile.website ?? '',
      phone_number: savedProfile.phone_number ?? '',
      phone_number_is_public: savedProfile.phone_number_is_public ?? false,
      phone_number_is_whatsapp: savedProfile.phone_number_is_whatsapp ?? false,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedProfile])

  useEffect(() => {
    if (!savedProfile) {
      return
    }
    const expired = savedProfile.live_expires_at
      ? new Date(savedProfile.live_expires_at) < new Date()
      : false
    if (expired && savedProfile.is_live) {
      resetExpiredLive(user.id)
    }
    setIsLive(!expired && !!savedProfile.is_live)
    setLivePlatform(savedProfile.live_platform ?? '')
    if (savedProfile.live_expires_at && !expired) {
      const remaining = Math.round(
        (new Date(savedProfile.live_expires_at) - new Date()) / 60000,
      )
      const closest = [15, 30, 60, 120, 180].reduce((a, b) =>
        Math.abs(b - remaining) < Math.abs(a - remaining) ? b : a,
      )
      setLiveDuration(String(closest))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedProfile])

  useEffect(() => {
    if (!socialLinks.length) {
      return
    }
    const instagram = socialLinks.find((l) => l.platform === 'instagram')?.handle ?? ''
    const tiktok = socialLinks.find((l) => l.platform === 'tiktok')?.handle ?? ''
    const youtube = socialLinks.find((l) => l.platform === 'youtube')?.handle ?? ''
    const twitch = socialLinks.find((l) => l.platform === 'twitch')?.handle ?? ''
    form.setValues((prev) => ({ ...prev, instagram, tiktok, youtube, twitch }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socialLinks])

  useEffect(() => {
    if (savedCity) {
      setSelectedCity({ id: savedCity.id, name: savedCity.name })
    }
  }, [savedCity])

  // ── Username check ────────────────────────────────────
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
    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', value)
      .maybeSingle()
    setUsernameAvailable(!taken)
    setUsernameUnavailableReason(taken ? 'taken' : null)
    setUsernameChecking(false)
  }, 600)

  // ── Busca de cidade ───────────────────────────────────
  const handleCitySearch = useDebouncedCallback(async (query) => {
    const regionId = form.values.region_id
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

  // ── Salva links sociais (upsert por plataforma) ───────
  async function saveSocialLinks(profileId, values) {
    const platforms = [
      { platform: 'instagram', handle: values.instagram },
      { platform: 'tiktok', handle: values.tiktok },
      { platform: 'youtube', handle: values.youtube },
      { platform: 'twitch', handle: values.twitch },
    ]

    for (const { platform, handle } of platforms) {
      if (handle) {
        await supabase
          .from('profile_social_links')
          .upsert(
            { profile_id: profileId, platform, handle },
            { onConflict: 'profile_id,platform' },
          )
      } else {
        // Remove o link se o campo foi deixado em branco
        await supabase
          .from('profile_social_links')
          .delete()
          .eq('profile_id', profileId)
          .eq('platform', platform)
      }
    }
  }

  // ── Submit ────────────────────────────────────────────
  async function handleSubmit(values) {
    const liveExpiresAt =
      isLive && liveDuration
        ? new Date(Date.now() + Number(liveDuration) * 60 * 1000).toISOString()
        : null
    const validation = form.validate()
    if (validation.hasErrors) {
      return
    }
    if (usernameAvailable === false) {
      return
    }
    if (usernameChecking) {
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name.trim(),
          username: values.username.trim(),
          title: values.title?.trim() || null,
          bio: values.bio?.trim() || null,
          gender: values.gender || null,
          region_id: values.region_id ? Number(values.region_id) : null,
          city_id: selectedCity?.id ?? null,
          website: values.website?.trim() || null,
          is_live: isLive,
          live_platform: isLive ? livePlatform || null : null,
          live_expires_at: liveExpiresAt,
          phone_number: values.phone_number?.trim() || null,
          phone_number_is_public: values.phone_number_is_public,
          phone_number_is_whatsapp: values.phone_number_is_whatsapp,
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      await saveSocialLinks(user.id, values)

      // Invalida queries afetadas para refletir os dados novos
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      queryClient.invalidateQueries({ queryKey: ['social-links', user.id] })

      scrollTo({ y: 0 })

      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Perfil atualizado com sucesso!',
      })
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao salvar. Tente novamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const genderData = [
    { value: '', label: 'Prefiro não informar' },
    ...genders.map((g) => ({ value: g.id, label: g.label })),
  ]

  const LIVE_PLATFORMS = [
    { value: 'instagram', label: 'Instagram', icon: <IconBrandInstagram size={14} /> },
    { value: 'tiktok', label: 'TikTok', icon: <IconBrandTiktok size={14} /> },
    { value: 'youtube', label: 'YouTube', icon: <IconBrandYoutube size={14} /> },
    { value: 'twitch', label: 'Twitch', icon: <IconBrandTwitch size={14} /> },
  ]

  const savedHandles = new Set(socialLinks.map((l) => l.platform))

  const livePlatformOptions = LIVE_PLATFORMS.filter((p) => savedHandles.has(p.value)).map(
    (p) => ({ value: p.value, label: p.label }),
  )

  const liveDurationOptions = [
    { value: '15', label: '15 minutos' },
    { value: '30', label: '30 minutos' },
    { value: '60', label: '1 hora' },
    { value: '120', label: '2 horas' },
    { value: '180', label: '3 horas' },
  ]

  // ── Render ────────────────────────────────────────────
  return (
    <>
      <Stack gap="lg">
        {/* ── Live ─────────────────────────────────────── */}
        <Stack gap="sm">
          <Text fw={600} size="sm" c="dimmed" tt="uppercase" lts="0.05em">
            Live
          </Text>
          <Switch
            label="Avisar que estou fazendo live agora"
            description="Seu perfil exibirá um indicador de live ativa"
            color="red"
            style={{ width: 'fit-content' }}
            checked={isLive}
            onChange={(e) => {
              setIsLive(e.currentTarget.checked)
              if (!e.currentTarget.checked) {
                setLivePlatform('')
                setLiveDuration('')
              }
            }}
          />
          {isLive && (
            <>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Rede social"
                    placeholder={
                      livePlatformOptions.length === 0
                        ? 'Nenhuma rede social cadastrada'
                        : 'Selecione'
                    }
                    data={livePlatformOptions}
                    disabled={livePlatformOptions.length === 0}
                    value={livePlatform}
                    onChange={(val) => setLivePlatform(val ?? '')}
                    description={
                      livePlatformOptions.length === 0
                        ? 'Cadastre uma rede social primeiro'
                        : 'Informe a rede que estará transmitindo'
                    }
                    leftSection={<IconVideo size={14} />}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Duração estimada"
                    placeholder="Selecione"
                    data={liveDurationOptions}
                    value={liveDuration}
                    onChange={(val) => setLiveDuration(val ?? '')}
                    description="Após esse tempo o indicador será removido"
                  />
                </Grid.Col>
              </Grid>
            </>
          )}
        </Stack>
        <Divider />

        {/* ── Dados básicos ───────────────────────────── */}
        <Stack gap="md">
          <Text fw={600} size="sm" c="dimmed" tt="uppercase" lts="0.05em">
            Dados básicos
          </Text>

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                withAsterisk
                label="Nome"
                placeholder="Nome completo"
                disabled={loading}
                {...form.getInputProps('full_name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                withAsterisk
                label="Username"
                placeholder="ex: joaosilva"
                success={!usernameChecking && usernameAvailable === true}
                loading={usernameChecking}
                disabled={loading}
                rightSection={
                  !usernameChecking && usernameAvailable === true ? (
                    <IconCheck size={16} color="var(--mantine-color-green-6)" />
                  ) : !usernameChecking && usernameAvailable === false ? (
                    <IconX size={16} color="var(--mantine-color-red-6)" />
                  ) : null
                }
                error={
                  form.errors.username ||
                  (usernameAvailable === false
                    ? usernameUnavailableReason === 'reserved'
                      ? 'Este username não está disponível'
                      : 'Este username já está em uso'
                    : undefined)
                }
                {...form.getInputProps('username')}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase()
                  form.setFieldValue('username', value)
                  setUsernameAvailable(null)
                  handleUsernameCheck(value)
                }}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Título (opcional)"
            description="Aparece logo abaixo do seu nome no perfil"
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Bio"
            placeholder="Conte um pouco sobre você, sua trajetória e estilo musical..."
            maxLength={5000}
            autosize
            minRows={3}
            bottomSection={
              <Text size="xs" c="dimmed">
                {form.values.bio.length}/5000 caracteres
              </Text>
            }
            {...form.getInputProps('bio')}
          />

          <Select
            label="Gênero"
            data={genderData}
            allowDeselect={false}
            {...form.getInputProps('gender')}
          />
        </Stack>

        <Divider />

        {/* ── Localização ─────────────────────────────── */}
        <Stack gap="md">
          <Text fw={600} size="sm" c="dimmed" tt="uppercase" lts="0.05em">
            Localização
          </Text>

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NativeSelect
                label="Estado"
                {...form.getInputProps('region_id')}
                onChange={(e) => {
                  form.setFieldValue('region_id', e.target.value)
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
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Input.Wrapper label="Cidade">
                <Input
                  pointer
                  readOnly
                  placeholder={
                    form.values.region_id
                      ? 'Selecionar...'
                      : 'Selecione o Estado primeiro'
                  }
                  disabled={!form.values.region_id}
                  value={selectedCity?.name ?? ''}
                  rightSection={
                    form.values.region_id ? <IconSearch size={15} /> : undefined
                  }
                  onClick={() => {
                    if (form.values.region_id) {
                      openCityModal()
                    }
                  }}
                />
              </Input.Wrapper>
            </Grid.Col>
          </Grid>
        </Stack>

        <Divider />
        {/* ── Contato ──────────────────────────────────── */}
        <Stack gap="md">
          <Text fw={600} size="sm" c="dimmed" tt="uppercase" lts="0.05em">
            Contato
          </Text>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Input.Wrapper
                label="Telefone"
                description="Número com DDD e código do país"
              >
                <PhoneInput
                  defaultCountry="br"
                  value={form.values.phone_number}
                  onChange={(val) => form.setFieldValue('phone_number', val)}
                  style={{
                    '--react-international-phone-border-radius':
                      'var(--mantine-radius-default)',
                  }}
                />
              </Input.Wrapper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Stack gap="xs" mt={{ base: 0, sm: 24 }}>
                <Switch
                  label="Exibir telefone no perfil"
                  checked={form.values.phone_number_is_public}
                  disabled={!form.values.phone_number}
                  onChange={(e) =>
                    form.setFieldValue('phone_number_is_public', e.currentTarget.checked)
                  }
                />
                <Switch
                  label="É WhatsApp"
                  checked={form.values.phone_number_is_whatsapp}
                  disabled={!form.values.phone_number}
                  onChange={(e) =>
                    form.setFieldValue(
                      'phone_number_is_whatsapp',
                      e.currentTarget.checked,
                    )
                  }
                />
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>

        <Divider />

        {/* ── Web e redes sociais ──────────────────────── */}
        <Stack gap="md">
          <Text fw={600} size="sm" c="dimmed" tt="uppercase" lts="0.05em">
            Website e redes sociais
          </Text>

          <TextInput
            label="Website"
            placeholder="https://meusite.com"
            leftSection={<IconWorld size={16} />}
            {...form.getInputProps('website')}
          />

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Instagram"
                placeholder="seu username"
                leftSection={<IconBrandInstagram size={16} />}
                description="Só o username, sem @"
                {...form.getInputProps('instagram')}
                onChange={(e) => {
                  // Remove @ se o usuário colar com ele
                  const value = e.target.value.replace(/^@/, '')
                  form.setFieldValue('instagram', value)
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="TikTok"
                placeholder="seu username"
                leftSection={<IconBrandTiktok size={16} />}
                description="Só o username, sem @"
                {...form.getInputProps('tiktok')}
                onChange={(e) => {
                  const value = e.target.value.replace(/^@/, '')
                  form.setFieldValue('tiktok', value)
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="YouTube"
                placeholder="seu canal"
                leftSection={<IconBrandYoutube size={16} />}
                description="Username ou handle do canal"
                {...form.getInputProps('youtube')}
                onChange={(e) => {
                  const value = e.target.value.replace(/^@/, '')
                  form.setFieldValue('youtube', value)
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Twitch"
                placeholder="seu username"
                leftSection={<IconBrandTwitch size={16} />}
                description="Só o username, sem @"
                {...form.getInputProps('twitch')}
                onChange={(e) => {
                  const value = e.target.value.replace(/^@/, '')
                  form.setFieldValue('twitch', value)
                }}
              />
            </Grid.Col>
          </Grid>
        </Stack>

        <Divider />

        {/* ── Ações ────────────────────────────────────── */}
        {usernameAvailable === false && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {usernameUnavailableReason === 'reserved'
              ? 'Este username não está disponível.'
              : 'Este username já está em uso por outra conta.'}
          </Alert>
        )}

        <Group justify="flex-end">
          <Button
            loading={isSubmitting}
            leftSection={<IconCheck size={15} />}
            onClick={() => handleSubmit(form.values)}
          >
            Salvar alterações
          </Button>
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
                        setNoCityResults(false)
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
    </>
  )
}
