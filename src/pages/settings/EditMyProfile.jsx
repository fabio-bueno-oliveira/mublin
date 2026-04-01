import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUserProfile } from '../../queries/user'
import { fetchCityById } from '../../queries/locations'
import { supabase } from '../../lib/supabaseClient'
import {
  Stack, Grid, TextInput, Textarea, NativeSelect,
  Input, Select, Button, Group, Text, Anchor, Divider,
  Modal, ScrollArea, Box, Loader, Alert,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconSearch, IconCheck, IconAlertCircle,
  IconBrandInstagram, IconBrandTiktok, IconWorld,
} from '@tabler/icons-react'

// ── Queries locais ────────────────────────────────────────

async function fetchGenders() {
  const { data, error } = await supabase
    .from('genders')
    .select('id, label')
  if (error) throw new Error(error.message)
  return data
}

async function fetchRegions() {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name')
    .eq('country_id', 27)
    .order('name')
  if (error) throw new Error(error.message)
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
  if (error) throw new Error(error.message)
  return data
}

async function fetchSocialLinks(profileId) {
  const { data, error } = await supabase
    .from('profile_social_links')
    .select('platform, handle')
    .eq('profile_id', profileId)
  if (error) throw new Error(error.message)
  return data
}

// ── Componente principal ──────────────────────────────────

export default function EditMyProfile() {
  const { user, profile: authProfile } = useAuth()
  const queryClient = useQueryClient()

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
  const [modalCityOpened, { open: openCityModal, close: closeCityModal }] = useDisclosure(false)

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
    },
    validate: {
      full_name: (v) => (!v?.trim() ? 'Nome completo é obrigatório' : null),
      username: (v) => {
        if (!v) return 'Username é obrigatório'
        if (v.length < 3) return 'Mínimo 3 caracteres'
        if (!/^[a-z0-9_]+$/.test(v)) return 'Apenas letras minúsculas, números e _'
        return null
      },
      website: (v) => {
        if (!v) return null
        try { new URL(v); return null }
        catch { return 'URL inválida. Ex: https://meusite.com' }
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
    staleTime: Infinity, // cidade do perfil não muda sozinha
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
    if (!savedProfile || form.values.username) return
    form.setValues({
      full_name: authProfile.full_name ?? '',
      username:  savedProfile.username  ?? '',
      title:     savedProfile.title     ?? '',
      bio:       savedProfile.bio       ?? '',
      gender:    savedProfile.gender    ?? '',
      region_id: savedProfile.region_id ? String(savedProfile.region_id) : '',
      website:   savedProfile.website   ?? '',
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedProfile])

  useEffect(() => {
    if (!socialLinks.length) return
    const instagram = socialLinks.find(l => l.platform === 'instagram')?.handle ?? ''
    const tiktok    = socialLinks.find(l => l.platform === 'tiktok')?.handle ?? ''
    form.setValues(prev => ({ ...prev, instagram, tiktok }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socialLinks])

  useEffect(() => {
    if (savedCity) setSelectedCity({ id: savedCity.id, name: savedCity.name })
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
    if (!query || query.length < 2 || !regionId) return
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
      { platform: 'tiktok',   handle: values.tiktok },
    ]

    for (const { platform, handle } of platforms) {
      if (handle) {
        await supabase
          .from('profile_social_links')
          .upsert(
            { profile_id: profileId, platform, handle },
            { onConflict: 'profile_id,platform' }
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
    const validation = form.validate()
    if (validation.hasErrors) return
    if (usernameAvailable === false) return
    if (usernameChecking) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name.trim(),
          username:  values.username.trim(),
          title:     values.title?.trim()  || null,
          bio:       values.bio?.trim()    || null,
          gender:    values.gender         || null,
          region_id: values.region_id ? Number(values.region_id) : null,
          city_id:   selectedCity?.id      ?? null,
          website:   values.website?.trim() || null,
        })
        .eq('id', user.id)

      if (error) throw error

      await saveSocialLinks(user.id, values)

      // Invalida queries afetadas para refletir os dados novos
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      queryClient.invalidateQueries({ queryKey: ['social-links', user.id] })

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
    ...genders.map(g => ({ value: g.id, label: g.label })),
  ]

  // ── Render ────────────────────────────────────────────
  return (
    <>
      <Stack gap="lg">

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
                {...form.getInputProps('full_name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
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
            maxLength={220}
            description={`${form.values.bio.length}/220`}
            autosize
            minRows={3}
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
                {regions.map(r => (
                  <option key={r.id} value={String(r.id)}>{r.name}</option>
                ))}
              </NativeSelect>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Input.Wrapper label="Cidade">
                <Input
                  pointer
                  readOnly
                  placeholder={form.values.region_id ? 'Selecionar...' : 'Selecione o Estado primeiro'}
                  disabled={!form.values.region_id}
                  value={selectedCity?.name ?? ''}
                  rightSection={form.values.region_id ? <IconSearch size={15} /> : undefined}
                  onClick={() => { if (form.values.region_id) openCityModal() }}
                />
              </Input.Wrapper>
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
          </Grid>
        </Stack>

        <Divider />

        {/* ── Ações ────────────────────────────────────── */}
        {usernameAvailable === false && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
          >
            {usernameUnavailableReason === 'reserved'
              ? 'Este username não está disponível.'
              : 'Este username já está em uso por outra conta.'}
          </Alert>
        )}

        <Group justify="flex-end">
          <Button
            variant="default"
            radius="xl"
            component={Link}
            to="/home"
          >
            Cancelar e voltar
          </Button>
          <Button
            color="indigo"
            radius="xl"
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
            rightSection={citySearchLoading ? <Loader size={16} /> : <IconSearch size={16} />}
            onChange={(e) => {
              setCitySearchQuery(e.target.value)
              handleCitySearch(e.target.value)
            }}
          />
          {noCityResults && (
            <Text size="xs" c="dimmed">Nenhuma cidade encontrada.</Text>
          )}
          {cityResults.length > 0 && (
            <ScrollArea h={200} type="auto">
              <Stack gap={0}>
                {cityResults.map(city => (
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