import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUserProfile } from '../../queries/user'
import { fetchCityById } from '../../queries/locations'
import { supabase } from '../../lib/supabaseClient'
import {
  Stack, Grid, TextInput, Textarea, NativeSelect,
  Input, Select, Button, Group, Text, Anchor, Divider,
  Modal, ScrollArea, Box, Loader, Alert, Switch
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconSearch, IconCheck, IconAlertCircle,
  IconBrandInstagram, IconBrandTiktok, IconWorld,
  IconBrandYoutube, IconBrandTwitch, IconVideo, IconPhone
} from '@tabler/icons-react'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'

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

  useEffect(() => {
    if (!savedProfile) return
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
        (new Date(savedProfile.live_expires_at) - new Date()) / 60000
      )
      const closest = [15, 30, 60, 120, 180].reduce((a, b) =>
        Math.abs(b - remaining) < Math.abs(a - remaining) ? b : a
      )
      setLiveDuration(String(closest))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedProfile])

  const LIVE_PLATFORMS = [
    { value: 'instagram', label: 'Instagram',  icon: <IconBrandInstagram size={14} /> },
    { value: 'tiktok',    label: 'TikTok',     icon: <IconBrandTiktok size={14} /> },
    { value: 'youtube',   label: 'YouTube',    icon: <IconBrandYoutube size={14} /> },
    { value: 'twitch',    label: 'Twitch',     icon: <IconBrandTwitch size={14} /> },
  ]

  const savedHandles = new Set(socialLinks.map(l => l.platform))

  const livePlatformOptions = LIVE_PLATFORMS
    .filter(p => savedHandles.has(p.value))
    .map(p => ({ value: p.value, label: p.label }))

  const liveDurationOptions = [
    { value: '15',  label: '15 minutos' },
    { value: '30',  label: '30 minutos' },
    { value: '60',  label: '1 hora' },
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
            style={{ width: "fit-content" }}
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

        <Group justify="flex-end">
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
    </>
  )
}