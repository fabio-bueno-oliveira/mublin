// src/pages/admin/AdminVenues.jsx
// Gerenciamento de venues (locais de eventos) — backoffice Mublin
// Stack: React + Mantine + Supabase + ImageKit

import { useEffect, useState, useCallback } from 'react'
import {
  Stack,
  Group,
  Title,
  Text,
  TextInput,
  Select,
  Avatar,
  ActionIcon,
  Modal,
  Skeleton,
  Table,
  Pagination,
  Tooltip,
  Button,
  Switch,
  Textarea,
  Box,
  SimpleGrid,
  Image,
  Divider,
  Progress,
  NumberInput,
  Anchor,
  ScrollArea,
  ThemeIcon,
  Input,
  Loader,
} from '@mantine/core'
import { useDebouncedValue, useDisclosure, useDebouncedCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconSearch,
  IconPlus,
  IconPencil,
  IconRefresh,
  IconFilter,
  IconMapPin,
  IconWorld,
  IconBrandInstagram,
  IconPhone,
  IconTrash,
  IconUsers,
  IconSpeakerphone,
  IconMusic,
  IconExternalLink,
} from '@tabler/icons-react'
import { upload } from '@imagekit/react'
import { supabase } from '../../lib/supabaseClient'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20
const IK_BASE = 'https://ik.imagekit.io/mublin'

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  venue_type_id: '',
  address: '',
  address_number: '',
  neighborhood: '',
  zip_code: '',
  city_id: '',
  region_id: '',
  latitude: '',
  longitude: '',
  instagram_handle: '',
  website_url: '',
  phone: '',
  capacity: '',
  has_sound_system: false,
  has_backline: false,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function venueImageUrl(picture_url) {
  if (!picture_url) {
    return null
  }
  if (picture_url.startsWith('http')) {
    return picture_url
  }
  return `${IK_BASE}/venues/tr:w-400,h-300,cm-pad_resize/${picture_url}`
}

// ─── ImageKit helpers ─────────────────────────────────────────────────────────

async function getIkAuthTokens() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const res = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  })
  if (!res.ok) {
    throw new Error('Falha na autenticação do ImageKit')
  }
  return { session, ...(await res.json()) }
}

async function uploadToImageKit({ file, fileName, folder, tags, onProgress }) {
  const { token, expire, signature } = await getIkAuthTokens()
  return upload({
    file,
    fileName,
    folder,
    tags,
    useUniqueFileName: true,
    publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
    token,
    expire,
    signature,
    onProgress: (e) => onProgress?.(Math.round((e.loaded / e.total) * 100)),
  })
}

async function deleteFromImageKit(fileId) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/imagekit-manage`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ fileId }),
    },
  )
  if (!res.ok) {
    throw new Error('Erro ao deletar imagem no servidor')
  }
}

// ─── Formulário ───────────────────────────────────────────────────────────────

function VenueForm({ venue, venueTypes, onSave, onClose }) {
  const isEditing = !!venue?.id

  const [form, setForm] = useState(
    isEditing
      ? {
          name: venue.name ?? '',
          slug: venue.slug ?? '',
          description: venue.description ?? '',
          venue_type_id: venue.venue_type_id ? String(venue.venue_type_id) : '',
          address: venue.address ?? '',
          address_number: venue.address_number ?? '',
          neighborhood: venue.neighborhood ?? '',
          zip_code: venue.zip_code ?? '',
          city_id: venue.cities?.id ? String(venue.cities.id) : '',
          region_id: venue.regions?.id ? String(venue.regions.id) : '',
          latitude: venue.latitude ?? '',
          longitude: venue.longitude ?? '',
          instagram_handle: venue.instagram_handle ?? '',
          website_url: venue.website_url ?? '',
          phone: venue.phone ?? '',
          capacity: venue.capacity ?? '',
          has_sound_system: venue.has_sound_system ?? false,
          has_backline: venue.has_backline ?? false,
        }
      : { ...EMPTY_FORM },
  )

  // Regiões (estados) — lista completa, ~27 registros
  const [regions, setRegions] = useState([])

  // Cidade — selecionada via modal de busca (igual ao NewProject.jsx)
  // Inicializada diretamente de venue.cities para popular corretamente em edição
  const [selectedCity, setSelectedCity] = useState(
    isEditing && venue.cities?.id
      ? { id: venue.cities.id, name: venue.cities.name }
      : null,
  )
  const [cityModalOpened, { open: openCityModal, close: closeCityModal }] =
    useDisclosure(false)
  const [citySearchQuery, setCitySearchQuery] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [citySearchLoading, setCitySearchLoading] = useState(false)
  const [noCityResults, setNoCityResults] = useState(false)

  // Imagem
  const [picFileId, setPicFileId] = useState(null)
  const [picFileName, setPicFileName] = useState(null)
  const [picProgress, setPicProgress] = useState(0)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Carrega estados BR uma vez
  useEffect(() => {
    supabase
      .from('regions')
      .select('id, name, uf')
      .eq('country_id', 27)
      .order('name')
      .then(({ data }) => setRegions(data ?? []))
  }, [])

  // Busca cidades com debounce — igual ao NewProject.jsx
  // Máx. 20 resultados, sem carregar lista completa do estado
  const handleCitySearch = useDebouncedCallback(async (query) => {
    if (!query || query.length < 2 || !form.region_id) {
      return
    }
    setCitySearchLoading(true)
    setNoCityResults(false)
    const { data } = await supabase
      .from('cities')
      .select('id, name')
      .eq('region_id', Number(form.region_id))
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20)
    if (data?.length) {
      setCityResults(data)
    } else {
      setNoCityResults(true)
      setCityResults([])
    }
    setCitySearchLoading(false)
  }, 500)

  function setField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && !isEditing) {
        next.slug = slugify(value)
      }
      return next
    })
    if (key === 'region_id') {
      setSelectedCity(null) // reseta cidade ao trocar estado
      setCityResults([])
      setCitySearchQuery('')
    }
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) {
      errs.name = 'Nome é obrigatório'
    }
    if (!form.slug.trim()) {
      errs.slug = 'Slug é obrigatório'
    }
    if (form.website_url && !/^https?:\/\/.+/.test(form.website_url)) {
      errs.website_url = 'URL deve começar com http:// ou https://'
    }
    if (form.latitude && isNaN(Number(form.latitude))) {
      errs.latitude = 'Latitude inválida'
    }
    if (form.longitude && isNaN(Number(form.longitude))) {
      errs.longitude = 'Longitude inválida'
    }
    return errs
  }

  async function handlePicSelect(e) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    setPicProgress(1)
    try {
      const res = await uploadToImageKit({
        file,
        fileName: `${slugify(form.name || 'venue')}_.jpg`,
        folder: '/venues/',
        tags: ['venue', 'picture'],
        onProgress: setPicProgress,
      })
      setPicFileName(res.filePath.split('/').pop())
      setPicFileId(res.fileId)
      setPicProgress(0)
    } catch (err) {
      notifications.show({ color: 'red', message: `Erro no upload: ${err.message}` })
      setPicProgress(0)
    }
  }

  async function handleRemovePic() {
    if (picFileId) {
      await deleteFromImageKit(picFileId).catch(console.error)
    }
    setPicFileId(null)
    setPicFileName(null)
    setPicProgress(0)
    const el = document.querySelector('#venuePicture')
    if (el) {
      el.value = null
    }
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setSaving(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        venue_type_id: form.venue_type_id ? Number(form.venue_type_id) : null,
        address: form.address.trim() || null,
        address_number: form.address_number.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        zip_code: form.zip_code.trim() || null,
        city_id: selectedCity?.id ?? null,
        latitude: form.latitude !== '' ? Number(form.latitude) : null,
        longitude: form.longitude !== '' ? Number(form.longitude) : null,
        instagram_handle: form.instagram_handle.trim() || null,
        website_url: form.website_url.trim() || null,
        phone: form.phone.trim() || null,
        capacity: form.capacity !== '' ? Number(form.capacity) : null,
        has_sound_system: form.has_sound_system,
        has_backline: form.has_backline,
        updated_at: new Date().toISOString(),
        ...(picFileName && { picture_url: picFileName }),
        // Exigido pela RLS policy de INSERT: auth.uid() = created_by_profile_id
        ...(!isEditing && { created_by_profile_id: session?.user?.id ?? null }),
      }

      if (isEditing) {
        const { error } = await supabase.from('venues').update(payload).eq('id', venue.id)
        if (error) {
          throw new Error(error.message)
        }
        notifications.show({ color: 'teal', message: `Venue "${form.name}" atualizado.` })
        onSave({ ...venue, ...payload })
      } else {
        const { data, error } = await supabase
          .from('venues')
          .insert(payload)
          .select()
          .single()
        if (error) {
          throw new Error(error.message)
        }
        notifications.show({ color: 'teal', message: `Venue "${form.name}" criado.` })
        onSave(data)
      }
    } catch (err) {
      notifications.show({ color: 'red', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const previewUrl = picFileName
    ? `${IK_BASE}/venues/tr:w-400,h-300,cm-pad_resize/${picFileName}`
    : isEditing && venue.picture_url
      ? venueImageUrl(venue.picture_url)
      : null

  return (
    <Stack gap="md">
      {/* Identificação */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="Nome"
          placeholder="Ex: Blue Note São Paulo"
          required
          value={form.name}
          error={errors.name}
          onChange={(e) => setField('name', e.currentTarget.value)}
        />
        <TextInput
          label="Slug"
          placeholder="Ex: blue-note-sao-paulo"
          required
          description="Gerado automaticamente"
          value={form.slug}
          error={errors.slug}
          onChange={(e) => setField('slug', slugify(e.currentTarget.value))}
        />
      </SimpleGrid>

      <Select
        label="Tipo de venue"
        placeholder="Selecione o tipo"
        data={venueTypes.map((t) => ({ value: String(t.id), label: t.name }))}
        value={form.venue_type_id}
        clearable
        onChange={(v) => setField('venue_type_id', v ?? '')}
      />

      <Textarea
        label="Descrição"
        placeholder="Descrição do local..."
        value={form.description}
        rows={3}
        maxLength={3000}
        onChange={(e) => setField('description', e.currentTarget.value)}
      />

      <Divider label="Localização" labelPosition="left" />

      {/* Estado + Cidade — cidade via modal de busca (igual ao NewProject.jsx) */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Select
          label="Estado"
          placeholder="Selecione o estado"
          data={regions.map((r) => ({
            value: String(r.id),
            label: `${r.name} (${r.uf})`,
          }))}
          value={form.region_id}
          clearable
          searchable
          onChange={(v) => setField('region_id', v ?? '')}
        />
        <Input.Wrapper label="Cidade">
          <Input
            pointer
            readOnly
            placeholder={
              form.region_id ? 'Buscar cidade...' : 'Selecione o estado primeiro'
            }
            disabled={!form.region_id}
            value={selectedCity?.name ?? ''}
            rightSection={
              selectedCity ? (
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={() => setSelectedCity(null)}
                  aria-label="Limpar cidade"
                >
                  ✕
                </ActionIcon>
              ) : form.region_id ? (
                <IconSearch size={15} />
              ) : undefined
            }
            onClick={() => {
              if (form.region_id) {
                openCityModal()
              }
            }}
          />
        </Input.Wrapper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <TextInput
          label="Endereço"
          placeholder="Nome da rua / avenida"
          value={form.address}
          onChange={(e) => setField('address', e.currentTarget.value)}
          style={{ gridColumn: 'span 2' }}
        />
        <TextInput
          label="Número"
          value={form.address_number}
          onChange={(e) => setField('address_number', e.currentTarget.value)}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="Bairro"
          value={form.neighborhood}
          onChange={(e) => setField('neighborhood', e.currentTarget.value)}
        />
        <TextInput
          label="CEP"
          placeholder="00000-000"
          value={form.zip_code}
          onChange={(e) => setField('zip_code', e.currentTarget.value)}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="Latitude"
          placeholder="Ex: -23.5505"
          value={form.latitude}
          error={errors.latitude}
          description="Opcional — para mapa"
          onChange={(e) => setField('latitude', e.currentTarget.value)}
        />
        <TextInput
          label="Longitude"
          placeholder="Ex: -46.6333"
          value={form.longitude}
          error={errors.longitude}
          description="Opcional — para mapa"
          onChange={(e) => setField('longitude', e.currentTarget.value)}
        />
      </SimpleGrid>

      <Divider label="Contato e redes" labelPosition="left" />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <TextInput
          label="Website"
          placeholder="https://..."
          leftSection={<IconWorld size={14} />}
          value={form.website_url}
          error={errors.website_url}
          onChange={(e) => setField('website_url', e.currentTarget.value)}
        />
        <TextInput
          label="Instagram"
          placeholder="@bluenotesp"
          leftSection={<IconBrandInstagram size={14} />}
          value={form.instagram_handle}
          onChange={(e) => setField('instagram_handle', e.currentTarget.value)}
        />
        <TextInput
          label="Telefone"
          placeholder="(11) 99999-9999"
          leftSection={<IconPhone size={14} />}
          value={form.phone}
          onChange={(e) => setField('phone', e.currentTarget.value)}
        />
      </SimpleGrid>

      <Divider label="Infraestrutura" labelPosition="left" />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        <NumberInput
          label="Capacidade"
          placeholder="Ex: 500"
          min={1}
          allowDecimal={false}
          leftSection={<IconUsers size={14} />}
          value={form.capacity}
          onChange={(v) => setField('capacity', v)}
        />
        <Switch
          label="Sistema de som"
          mt="xl"
          checked={form.has_sound_system}
          onChange={(e) => setField('has_sound_system', e.currentTarget.checked)}
          color="teal"
        />
        <Switch
          label="Backline"
          mt="xl"
          checked={form.has_backline}
          onChange={(e) => setField('has_backline', e.currentTarget.checked)}
          color="teal"
          description="Instrumentos e amplificadores disponíveis"
        />
      </SimpleGrid>

      <Divider label="Foto do venue" labelPosition="left" />

      {previewUrl ? (
        <Group gap="md" align="center">
          <Image
            src={previewUrl}
            w={120}
            h={80}
            fit="cover"
            radius="md"
            style={{ border: '1px solid var(--mantine-color-default-border)' }}
          />
          <Button
            size="xs"
            color="red"
            variant="light"
            leftSection={<IconTrash size={14} />}
            onClick={handleRemovePic}
          >
            Remover foto
          </Button>
        </Group>
      ) : (
        <Box>
          <Text size="xs" c="dimmed" mb={6}>
            Foto do local · JPG ou PNG · proporção 4:3 ideal · máx. 2mb
          </Text>
          <input
            id="venuePicture"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePicSelect}
          />
          {picProgress > 0 && picProgress < 100 && (
            <Progress value={picProgress} size="xs" mt={6} animated />
          )}
        </Box>
      )}

      <Group justify="flex-end" pt="xs">
        <Button variant="default" size="sm" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button size="sm" loading={saving} onClick={handleSubmit}>
          {isEditing ? 'Salvar alterações' : 'Criar venue'}
        </Button>
      </Group>

      {/* Modal de busca de cidade — igual ao NewProject.jsx */}
      <Modal
        title="Selecionar cidade"
        opened={cityModalOpened}
        onClose={() => {
          closeCityModal()
          setCitySearchQuery('')
          setCityResults([])
          setNoCityResults(false)
        }}
        size="sm"
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
              setCitySearchQuery(e.currentTarget.value)
              handleCitySearch(e.currentTarget.value)
            }}
          />
          {noCityResults && (
            <Text size="xs" c="dimmed">
              Nenhuma cidade encontrada neste estado.
            </Text>
          )}
          {cityResults.length > 0 && (
            <ScrollArea h={220} type="auto">
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
    </Stack>
  )
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function VenueRow({ venue, venueTypes, onEdit }) {
  const typeName = venueTypes.find((t) => t.id === venue.venue_type_id)?.name

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <Avatar
            src={venueImageUrl(venue.picture_url)}
            size={36}
            radius="sm"
            color="orange"
          >
            <IconMapPin size={18} />
          </Avatar>
          <Box>
            <Text size="sm" fw={500} lineClamp={1}>
              {venue.name}
            </Text>
            <Text size="xs" c="dimmed" ff="monospace" lineClamp={1}>
              {venue.slug}
            </Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td visibleFrom="sm">
        <Text size="xs" c="dimmed">
          {typeName ?? '—'}
        </Text>
      </Table.Td>
      <Table.Td visibleFrom="md">
        <Text size="xs" c="dimmed">
          {[venue.cities?.name, venue.regions?.regions?.uf].filter(Boolean).join(' / ') ||
            '—'}
        </Text>
      </Table.Td>
      <Table.Td visibleFrom="lg">
        <Group gap={4} wrap="nowrap">
          {venue.has_sound_system && (
            <Tooltip label="Sistema de som">
              <ThemeIcon size="sm" variant="light" color="teal">
                <IconSpeakerphone size={12} />
              </ThemeIcon>
            </Tooltip>
          )}
          {venue.has_backline && (
            <Tooltip label="Backline">
              <ThemeIcon size="sm" variant="light" color="violet">
                <IconMusic size={12} />
              </ThemeIcon>
            </Tooltip>
          )}
          {venue.capacity && (
            <Text size="xs" c="dimmed">
              {venue.capacity.toLocaleString('pt-BR')} pax
            </Text>
          )}
        </Group>
      </Table.Td>
      <Table.Td visibleFrom="lg">
        {venue.website_url ? (
          <Anchor href={venue.website_url} target="_blank" rel="noopener" size="xs">
            <Group gap={4} wrap="nowrap">
              <IconExternalLink size={12} />
              {venue.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </Group>
          </Anchor>
        ) : (
          <Text size="xs" c="dimmed">
            —
          </Text>
        )}
      </Table.Td>
      <Table.Td>
        <Tooltip label="Editar">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => onEdit(venue)}
          >
            <IconPencil size={14} />
          </ActionIcon>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminVenues() {
  const [venues, setVenues] = useState([])
  const [venueTypes, setVenueTypes] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 350)
  const [typeFilter, setTypeFilter] = useState('')
  const [soundFilter, setSoundFilter] = useState('')
  const [backlineFilter, setBacklineFilter] = useState('')

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editingVenue, setEditingVenue] = useState(null)

  // Carrega tipos de venue uma vez
  useEffect(() => {
    supabase
      .from('venue_types')
      .select('id, name')
      .order('name')
      .then(({ data }) => setVenueTypes(data ?? []))
  }, [])

  const fetchVenues = useCallback(
    async (currentPage) => {
      setLoading(true)
      const from = (currentPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from('venues')
        .select(
          `id, name, slug, picture_url, venue_type_id,
         address, address_number, neighborhood, zip_code,
         latitude, longitude, instagram_handle, website_url,
         phone, capacity, has_sound_system, has_backline,
         created_at, updated_at,
         cities ( id, name ),
         regions:cities ( regions ( id, name, uf ) )`,
          { count: 'exact' },
        )
        .order('name')
        .range(from, to)

      if (debouncedSearch) {
        query = query.or(
          `name.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`,
        )
      }
      if (typeFilter) {
        query = query.eq('venue_type_id', Number(typeFilter))
      }
      if (soundFilter !== '') {
        query = query.eq('has_sound_system', soundFilter === 'true')
      }
      if (backlineFilter !== '') {
        query = query.eq('has_backline', backlineFilter === 'true')
      }

      const { data, count, error } = await query

      if (error) {
        notifications.show({
          color: 'red',
          message: `Erro ao carregar venues: ${error.message}`,
        })
      } else {
        const normalized = (data ?? []).map((v) => ({
          ...v,
          regions: v.regions?.regions ?? null,
        }))
        setVenues(normalized)
        setTotal(count ?? 0)
      }
      setLoading(false)
    },
    [debouncedSearch, typeFilter, soundFilter, backlineFilter],
  )

  // Unico efeito: reseta página para 1 quando filtros mudam,
  // e busca diretamente com a página correta — sem cascata de renders.
  useEffect(() => {
    setPage(1)
    fetchVenues(1)
  }, [debouncedSearch, typeFilter, soundFilter, backlineFilter])

  // Busca quando apenas a página muda (sem alterar filtros)
  useEffect(() => {
    fetchVenues(page)
  }, [page])

  function openCreate() {
    setEditingVenue(null)
    openModal()
  }
  function openEdit(venue) {
    setEditingVenue(venue)
    openModal()
  }

  function handleSaved(saved) {
    if (editingVenue) {
      setVenues((prev) => prev.map((v) => (v.id === saved.id ? saved : v)))
    } else {
      setVenues((prev) => [saved, ...prev].slice(0, PAGE_SIZE))
      setTotal((t) => t + 1)
    }
    closeModal()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = typeFilter || soundFilter || backlineFilter

  return (
    <>
      <Stack gap="lg">
        {/* Cabeçalho */}
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={3} fw={500}>
              Venues
            </Title>
            <Text size="sm" c="dimmed">
              {loading
                ? '...'
                : `${total.toLocaleString('pt-BR')} venue${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
            </Text>
          </Box>
          <Group gap="sm">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => fetchVenues(page)}
              loading={loading}
            >
              <IconRefresh size={16} />
            </ActionIcon>
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={openCreate}>
              Novo venue
            </Button>
          </Group>
        </Group>

        {/* Filtros */}
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Buscar por nome ou slug"
            leftSection={<IconSearch size={14} />}
            value={search}
            size="sm"
            style={{ flex: 1, minWidth: 200 }}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            placeholder="Tipo"
            data={[
              { value: '', label: 'Todos os tipos' },
              ...venueTypes.map((t) => ({ value: String(t.id), label: t.name })),
            ]}
            value={typeFilter}
            size="sm"
            w={180}
            clearable
            onChange={(v) => setTypeFilter(v ?? '')}
          />
          <Select
            placeholder="Som"
            data={[
              { value: '', label: 'Som: todos' },
              { value: 'true', label: 'Com sistema de som' },
              { value: 'false', label: 'Sem sistema de som' },
            ]}
            value={soundFilter}
            size="sm"
            w={180}
            clearable
            onChange={(v) => setSoundFilter(v ?? '')}
          />
          <Select
            placeholder="Backline"
            data={[
              { value: '', label: 'Backline: todos' },
              { value: 'true', label: 'Com backline' },
              { value: 'false', label: 'Sem backline' },
            ]}
            value={backlineFilter}
            size="sm"
            w={165}
            clearable
            onChange={(v) => setBacklineFilter(v ?? '')}
          />
          {hasActiveFilters && (
            <Tooltip label="Limpar filtros">
              <ActionIcon
                variant="light"
                color="gray"
                size="sm"
                onClick={() => {
                  setTypeFilter('')
                  setSoundFilter('')
                  setBacklineFilter('')
                }}
              >
                <IconFilter size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        {/* Tabela */}
        <Box style={{ overflowX: 'auto' }}>
          <Table highlightOnHover verticalSpacing="sm" striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Venue</Table.Th>
                <Table.Th visibleFrom="sm">Tipo</Table.Th>
                <Table.Th visibleFrom="md">Cidade</Table.Th>
                <Table.Th visibleFrom="lg">Infra</Table.Th>
                <Table.Th visibleFrom="lg">Website</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Group gap="sm">
                        <Skeleton height={36} width={36} radius="sm" />
                        <Box>
                          <Skeleton height={12} width={140} mb={4} />
                          <Skeleton height={10} width={100} />
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td visibleFrom="sm">
                      <Skeleton height={10} width={80} />
                    </Table.Td>
                    <Table.Td visibleFrom="md">
                      <Skeleton height={10} width={100} />
                    </Table.Td>
                    <Table.Td visibleFrom="lg">
                      <Skeleton height={10} width={80} />
                    </Table.Td>
                    <Table.Td visibleFrom="lg">
                      <Skeleton height={10} width={120} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={24} width={28} />
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : venues.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" size="sm" ta="center" py="xl">
                      Nenhum venue encontrado.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                venues.map((venue) => (
                  <VenueRow
                    key={venue.id}
                    venue={venue}
                    venueTypes={venueTypes}
                    onEdit={openEdit}
                  />
                ))
              )}
            </Table.Tbody>
          </Table>
        </Box>

        {/* Paginação */}
        {totalPages > 1 && (
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              Página {page} de {totalPages}
            </Text>
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
              withEdges
            />
          </Group>
        )}
      </Stack>

      {/* Modal criação / edição */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        size="xl"
        centered
        title={editingVenue ? `Editar: ${editingVenue.name}` : 'Novo venue'}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <VenueForm
          key={editingVenue?.id ?? 'new'}
          venue={editingVenue}
          venueTypes={venueTypes}
          onSave={handleSaved}
          onClose={closeModal}
        />
      </Modal>
    </>
  )
}
