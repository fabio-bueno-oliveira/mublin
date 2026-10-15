import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { upload } from '@imagekit/react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { fetchAllGenres } from '../../queries/genres'
import { searchProjects } from '../../queries/search'
import { searchVenues } from '../../queries/locations'
import AppNavbarMobile from '../../components/AppNavbarMobile'
import {
  Affix,
  Container,
  Title,
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Switch,
  Image,
  ActionIcon,
  Text,
  Box,
  Divider,
  SimpleGrid,
  NativeSelect,
  Card,
  Badge,
  Checkbox,
  Avatar,
  ScrollArea,
  Loader,
  Modal,
} from '@mantine/core'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPhoto,
  IconX,
  IconSearch,
  IconPlus,
  IconTrash,
  IconMapPin,
} from '@tabler/icons-react'
import dayjs from 'dayjs'

const TOURS_PATH = 'https://ik.imagekit.io/mublin/tours/tr:w-360/'
const PROJECTS_PATH = 'https://ik.imagekit.io/mublin/projects/tr:w-64,h-64/'

async function fetchTourBySlug(slug) {
  const { data, error } = await supabase
    .from('tours')
    .select(
      'id, title, slug, description, genre_id, date_start, date_end, is_active, is_public, picture',
    )
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}
async function fetchTourProjects(tourId) {
  const { data, error } = await supabase
    .from('tour_projects')
    .select(
      'id, project_id, is_headliner, order_show, projects (id, name, slug, picture)',
    )
    .eq('tour_id', tourId)
    .order('order_show')
  if (error) throw error
  return data
}
async function fetchTourLegs(tourId) {
  const { data, error } = await supabase
    .from('tour_legs')
    .select('id, name, order_index')
    .eq('tour_id', tourId)
    .order('order_index')
  if (error) throw error
  return data ?? []
}
async function fetchTourDates(tourId) {
  const { data, error } = await supabase
    .from('tour_dates')
    .select(
      'id, date, time_start, venue_name, venue_id, notes, tour_leg_id, venues (id, name, slug, cities (name)), tour_legs (id, name)',
    )
    .eq('tour_id', tourId)
    .order('date')
  if (error) throw error
  return data ?? []
}

export default function EditTour() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const imageInputRef = useRef(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genreId, setGenreId] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isPublic, setIsPublic] = useState(true)

  const [existingPicture, setExistingPicture] = useState('')
  const [picturePreview, setPicturePreview] = useState('')
  const [pictureFile, setPictureFile] = useState(null)

  // Projects
  const [projectSearchQuery, setProjectSearchQuery] = useState('')
  const [projectResults, setProjectResults] = useState([])
  const [projectLoading, setProjectLoading] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState([])

  // Legs
  const [legs, setLegs] = useState([])
  const [newLegName, setNewLegName] = useState('')
  const [creatingLeg, setCreatingLeg] = useState(false)

  // Dates + VENUES SEARCH
  const [tourDates, setTourDates] = useState([])
  const [newDate, setNewDate] = useState({
    date: '',
    time_start: '',
    venue_name_free: '',
    venue_id: null,
    tour_leg_id: '',
    notes: '',
  })
  const [creatingDate, setCreatingDate] = useState(false)
  const [venueSearchQuery, setVenueSearchQuery] = useState('')
  const [venueResults, setVenueResults] = useState([])
  const [venueLoading, setVenueLoading] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState(null) // objeto venues

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [tourId, setTourId] = useState(null)

  const { data: genres = [] } = useQuery({
    queryKey: ['genres-all'],
    queryFn: fetchAllGenres,
    staleTime: Infinity,
  })
  const [legModalOpened, { open: openLegModal, close: closeLegModal }] =
    useDisclosure(false)

  const groupedByLeg = useMemo(() => {
    const g = {}
    ;(tourDates || []).forEach((d) => {
      const k = d.tour_leg_id || 'no-leg'
      if (!g[k]) g[k] = []
      g[k].push(d)
    })
    return g
  }, [tourDates])

  useEffect(() => {
    async function load() {
      try {
        const tour = await fetchTourBySlug(slug)
        setTourId(tour.id)
        setTitle(tour.title)
        setDescription(tour.description || '')
        setGenreId(tour.genre_id ? String(tour.genre_id) : '')
        setDateStart(tour.date_start || '')
        setDateEnd(tour.date_end || '')
        setIsActive(tour.is_active)
        setIsPublic(tour.is_public)
        setExistingPicture(tour.picture || '')
        const [projects, legsData, dates] = await Promise.all([
          fetchTourProjects(tour.id),
          fetchTourLegs(tour.id),
          fetchTourDates(tour.id),
        ])
        setSelectedProjects(
          projects.map((p) => ({
            id: p.project_id,
            name: p.projects?.name,
            picture: p.projects?.picture,
            slug: p.projects?.slug,
            is_headliner: p.is_headliner,
            order_show: p.order_show,
          })),
        )
        setLegs(legsData)
        setTourDates(dates)
      } catch (e) {
        notifications.show({ color: 'red', message: e.message })
      } finally {
        setLoading(false)
      }
    }
    if (slug) load()
  }, [slug])

  // ── Projects debounce (search.js RPC) ──
  const handleProjectSearch = useDebouncedCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setProjectResults([])
      return
    }
    setProjectLoading(true)
    try {
      const results = await searchProjects(query.trim())
      const filtered = (results || [])
        .filter((r) => !selectedProjects.some((s) => s.id === r.id))
        .slice(0, 10)
      setProjectResults(filtered)
    } catch {
      setProjectResults([])
    } finally {
      setProjectLoading(false)
    }
  }, 400)

  // ── Venues debounce (locations.js searchVenues) ──
  const handleVenueSearch = useDebouncedCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setVenueResults([])
      return
    }
    setVenueLoading(true)
    try {
      const results = await searchVenues(query.trim())
      setVenueResults(results || [])
    } catch {
      setVenueResults([])
    } finally {
      setVenueLoading(false)
    }
  }, 400)

  function addProject(p) {
    setSelectedProjects((prev) => [
      ...prev,
      {
        id: p.id,
        name: p.name,
        picture: p.picture,
        slug: p.slug,
        is_headliner: prev.length === 0,
        order_show: prev.length,
      },
    ])
    setProjectSearchQuery('')
    setProjectResults([])
  }
  function toggleHeadliner(id) {
    setSelectedProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_headliner: !p.is_headliner } : p)),
    )
  }
  function removeProject(id) {
    setSelectedProjects((prev) =>
      prev.filter((p) => p.id !== id).map((p, i) => ({ ...p, order_show: i })),
    )
  }

  function handleImageUpload(file) {
    if (picturePreview) URL.revokeObjectURL(picturePreview)
    if (!file) {
      setPictureFile(null)
      setPicturePreview('')
      return
    }
    setPictureFile(file)
    setPicturePreview(URL.createObjectURL(file))
  }
  function handleRemoveImage() {
    if (picturePreview) URL.revokeObjectURL(picturePreview)
    setPicturePreview('')
    setPictureFile(null)
    setExistingPicture('')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  function selectVenue(venue) {
    setSelectedVenue(venue)
    setNewDate((prev) => ({ ...prev, venue_id: venue.id, venue_name_free: venue.name }))
    setVenueSearchQuery(venue.name)
    setVenueResults([])
  }

  function clearSelectedVenue() {
    setSelectedVenue(null)
    setNewDate((prev) => ({ ...prev, venue_id: null, venue_name_free: '' }))
    setVenueSearchQuery('')
    setVenueResults([])
  }

  async function getIkAuthTokens() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const authRes = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    return { session, ...(await authRes.json()) }
  }
  async function uploadToImageKit({ file, fileName, folder, tags }) {
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
    })
  }

  async function handleCreateLeg() {
    if (!newLegName.trim() || !tourId) return
    setCreatingLeg(true)
    try {
      const { data, error } = await supabase
        .from('tour_legs')
        .insert({ tour_id: tourId, name: newLegName.trim(), order_index: legs.length })
        .select()
        .single()
      if (error) throw error
      setLegs((prev) => [...prev, data])
      setNewLegName('')
      closeLegModal()
    } catch (e) {
      notifications.show({ color: 'red', message: e.message })
    } finally {
      setCreatingLeg(false)
    }
  }
  async function handleDeleteLeg(legId) {
    await supabase
      .from('tour_dates')
      .update({ tour_leg_id: null })
      .eq('tour_leg_id', legId)
    const { error } = await supabase.from('tour_legs').delete().eq('id', legId)
    if (!error) {
      setLegs((prev) => prev.filter((l) => l.id !== legId))
      setTourDates((prev) =>
        prev.map((d) =>
          d.tour_leg_id === legId ? { ...d, tour_leg_id: null, tour_legs: null } : d,
        ),
      )
    }
  }
  async function handleCreateDate() {
    if (!newDate.date || !tourId) {
      notifications.show({ color: 'red', message: 'Informe a data' })
      return
    }
    setCreatingDate(true)
    try {
      const payload = {
        tour_id: tourId,
        date: newDate.date,
        time_start: newDate.time_start || null,
        venue_id: newDate.venue_id || null,
        venue_name: newDate.venue_id ? null : newDate.venue_name_free?.trim() || null, // se tem venue_id, não usa venue_name livre
        notes: newDate.notes?.trim() || null,
        tour_leg_id: newDate.tour_leg_id ? Number(newDate.tour_leg_id) : null,
      }
      const { data, error } = await supabase
        .from('tour_dates')
        .insert(payload)
        .select(
          'id, date, time_start, venue_name, venue_id, notes, tour_leg_id, venues (id, name, slug, cities (name)), tour_legs (id, name)',
        )
        .single()
      if (error) throw error
      setTourDates((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
      setNewDate({
        date: '',
        time_start: '',
        venue_name_free: '',
        venue_id: null,
        tour_leg_id: '',
        notes: '',
      })
      clearSelectedVenue()
    } catch (e) {
      notifications.show({ color: 'red', message: e.message })
    } finally {
      setCreatingDate(false)
    }
  }
  async function handleDeleteDate(id) {
    const { error } = await supabase.from('tour_dates').delete().eq('id', id)
    if (!error) setTourDates((prev) => prev.filter((d) => d.id !== id))
  }

  async function handleSubmit() {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      let pictureToSave = existingPicture
      if (pictureFile) {
        const response = await uploadToImageKit({
          file: pictureFile,
          fileName: `${tourId}_.jpg`,
          folder: '/tours/',
          tags: ['tour'],
        })
        const n = response.filePath.lastIndexOf('/')
        pictureToSave = response.filePath.substring(n + 1)
        if (picturePreview) URL.revokeObjectURL(picturePreview)
      }
      const { error } = await supabase
        .from('tours')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          genre_id: genreId ? Number(genreId) : null,
          date_start: dateStart || null,
          date_end: dateEnd || null,
          is_active: isActive,
          is_public: isPublic,
          picture: pictureToSave || null,
        })
        .eq('id', tourId)
      if (error) throw error
      await supabase.from('tour_projects').delete().eq('tour_id', tourId)
      if (selectedProjects.length > 0) {
        const rows = selectedProjects.map((p) => ({
          tour_id: tourId,
          project_id: p.id,
          is_headliner: !!p.is_headliner,
          order_show: p.order_show,
        }))
        await supabase.from('tour_projects').insert(rows)
      }
      notifications.show({ color: 'green', message: 'Turnê atualizada!' })
      navigate(`/tour/${slug}`)
    } catch (e) {
      notifications.show({ color: 'red', message: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading)
    return (
      <Container size="sm" mt={80}>
        <Text>Carregando...</Text>
      </Container>
    )

  return (
    <>
      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Editar turnê" />
      </Affix>
      <Container size="sm" pb="xl" mt={{ base: 70, sm: 'md' }}>
        <Group justify="space-between" mb="md">
          <Title order={3}>Editar turnê</Title>
          <Button component={Link} to={`/tour/${slug}`} size="xs" variant="default">
            Ver página
          </Button>
        </Group>
        <Stack gap="md">
          <Box>
            <Text size="xs" c="dimmed" fw={500} mb={6}>
              Capa / pôster
            </Text>
            {picturePreview || existingPicture ? (
              <Box style={{ position: 'relative', display: 'inline-block' }}>
                <Image
                  src={picturePreview || `${TOURS_PATH}${existingPicture}`}
                  radius="md"
                  h={180}
                  w="auto"
                  fit="contain"
                />
                <ActionIcon
                  color="red"
                  radius="xl"
                  size="sm"
                  style={{ position: 'absolute', top: 6, right: 6 }}
                  onClick={handleRemoveImage}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Box>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={imageInputRef}
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                />
                <Button
                  variant="light"
                  size="xs"
                  leftSection={<IconPhoto size={14} />}
                  onClick={() => imageInputRef.current?.click()}
                >
                  Alterar imagem
                </Button>
              </>
            )}
          </Box>

          <Divider />
          <TextInput
            label="Título *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autosize
            minRows={3}
            maxRows={6}
          />

          <NativeSelect
            label="Gênero"
            value={genreId}
            onChange={(e) => setGenreId(e.target.value)}
          >
            <option value="">Opcional</option>
            {genres.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.name_ptbr}
              </option>
            ))}
          </NativeSelect>

          <Divider label="Período (opcional)" labelPosition="left" />
          <SimpleGrid cols={2}>
            <TextInput
              label="Data início"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
            <TextInput
              label="Data fim"
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </SimpleGrid>

          <Divider label="Artistas / Headliners" labelPosition="left" />
          <TextInput
            placeholder="Buscar projeto..."
            value={projectSearchQuery}
            leftSection={projectLoading ? <Loader size={14} /> : <IconSearch size={14} />}
            onChange={(e) => {
              setProjectSearchQuery(e.target.value)
              handleProjectSearch(e.target.value)
            }}
          />
          {projectResults.length > 0 && (
            <Card withBorder p={0}>
              <ScrollArea h={180}>
                <Stack gap={0}>
                  {projectResults.map((p) => (
                    <Group key={p.id} justify="space-between" p="xs">
                      <Group gap="sm">
                        <Avatar
                          src={
                            p.picture
                              ? `${PROJECTS_PATH}/${p.id}/${p.picture}`
                              : undefined
                          }
                          size={32}
                        />
                        <Text size="sm">{p.name}</Text>
                      </Group>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconPlus size={12} />}
                        onClick={() => addProject(p)}
                      >
                        Add
                      </Button>
                    </Group>
                  ))}
                </Stack>
              </ScrollArea>
            </Card>
          )}
          <Stack gap="xs">
            {selectedProjects.map((p) => (
              <Card key={p.id} withBorder p="sm">
                <Group justify="space-between">
                  <Group gap="sm">
                    <Avatar
                      src={
                        p.picture ? `${PROJECTS_PATH}/${p.id}/${p.picture}` : undefined
                      }
                      size={32}
                    />
                    <Text size="sm" fw={500}>
                      {p.name}{' '}
                      {p.is_headliner && (
                        <Badge size="xs" color="violet" ml={6}>
                          Headliner
                        </Badge>
                      )}
                    </Text>
                  </Group>
                  <Group>
                    <Checkbox
                      size="xs"
                      label="Headliner"
                      checked={!!p.is_headliner}
                      onChange={() => toggleHeadliner(p.id)}
                    />
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removeProject(p.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>

          <Divider label="Pernas da turnê (tour_legs)" labelPosition="left" />
          <Group>
            <Button
              size="xs"
              variant="light"
              leftSection={<IconPlus size={12} />}
              onClick={openLegModal}
            >
              Nova perna
            </Button>
            <Text size="xs" c="dimmed">
              {legs.length} pernas
            </Text>
          </Group>
          {legs.length > 0 && (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {legs.map((leg) => (
                <Card key={leg.id} withBorder p="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {leg.name}
                    </Text>
                    <ActionIcon
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => handleDeleteLeg(leg.id)}
                    >
                      <IconTrash size={12} />
                    </ActionIcon>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {groupedByLeg[leg.id]?.length || 0} datas
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          )}

          <Divider label="Datas" labelPosition="left" />
          <Card withBorder p="sm">
            <Stack gap="xs">
              <SimpleGrid cols={2}>
                <TextInput
                  label="Data *"
                  type="date"
                  value={newDate.date}
                  onChange={(e) => setNewDate({ ...newDate, date: e.target.value })}
                />
                <TextInput
                  label="Horário"
                  type="time"
                  value={newDate.time_start}
                  onChange={(e) => setNewDate({ ...newDate, time_start: e.target.value })}
                />
              </SimpleGrid>

              {/* VENUE SEARCH COM DEBOUNCE - searchVenues de locations.js */}
              <Box>
                <Text size="xs" fw={500} mb={4}>
                  Local / Venue (busca em venues cadastradas)
                </Text>
                <TextInput
                  placeholder="Buscar venue... ex: Fundição Progresso, Teatro Caupolican"
                  value={venueSearchQuery}
                  leftSection={
                    venueLoading ? <Loader size={14} /> : <IconMapPin size={14} />
                  }
                  rightSection={
                    selectedVenue && (
                      <ActionIcon size="xs" variant="subtle" onClick={clearSelectedVenue}>
                        <IconX size={12} />
                      </ActionIcon>
                    )
                  }
                  onChange={(e) => {
                    setVenueSearchQuery(e.target.value)
                    handleVenueSearch(e.target.value)
                    if (!e.target.value) clearSelectedVenue()
                  }}
                />
                {selectedVenue && (
                  <Badge fw={300} size="sm" color="green" mt={6}>
                    Selecionado: {selectedVenue.name}{' '}
                    {selectedVenue.cities?.name && `• ${selectedVenue.cities.name}`}
                  </Badge>
                )}

                {venueResults.length > 0 && (
                  <Card withBorder p={0} mt={6}>
                    <ScrollArea h={180}>
                      <Stack gap={0}>
                        {venueResults.map((v) => (
                          <Group
                            key={v.id}
                            justify="space-between"
                            p="xs"
                            style={{
                              borderBottom:
                                '1px solid var(--mantine-color-default-border)',
                            }}
                          >
                            <Box>
                              <Text size="sm" fw={500}>
                                {v.name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {v.cities?.name || ''}{' '}
                                {v.neighborhood ? `• ${v.neighborhood}` : ''}
                              </Text>
                            </Box>
                            <Button
                              size="xs"
                              variant="light"
                              onClick={() => selectVenue(v)}
                            >
                              Selecionar
                            </Button>
                          </Group>
                        ))}
                      </Stack>
                    </ScrollArea>
                  </Card>
                )}

                {!selectedVenue && (
                  <TextInput
                    label="Ou nome livre (se venue não cadastrada)"
                    placeholder="Ex: Teatro Caupolican"
                    mt="sm"
                    value={newDate.venue_name_free}
                    onChange={(e) =>
                      setNewDate({
                        ...newDate,
                        venue_name_free: e.target.value,
                        venue_id: null,
                      })
                    }
                    description="Usado em tour_dates.venue_name quando não há venue_id"
                  />
                )}
              </Box>

              <NativeSelect
                label="Perna (leg)"
                value={newDate.tour_leg_id}
                onChange={(e) => setNewDate({ ...newDate, tour_leg_id: e.target.value })}
              >
                <option value="">Sem perna</option>
                {legs.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.name}
                  </option>
                ))}
              </NativeSelect>
              <TextInput
                label="Notas"
                value={newDate.notes}
                onChange={(e) => setNewDate({ ...newDate, notes: e.target.value })}
              />
              <Button
                size="xs"
                loading={creatingDate}
                leftSection={<IconPlus size={12} />}
                onClick={handleCreateDate}
                disabled={!newDate.date}
              >
                Adicionar data
                {/* {selectedVenue
                  ? `com local pré-cadastrado (${selectedVenue.id})`
                  : newDate.venue_name_free
                    ? `(venue livre)`
                    : ''} */}
              </Button>
            </Stack>
          </Card>

          {tourDates.length > 0 && (
            <Stack gap="md">
              {legs.map(
                (leg) =>
                  groupedByLeg[leg.id]?.length > 0 && (
                    <Box key={leg.id}>
                      <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb={4}>
                        {leg.name}
                      </Text>
                      <Stack gap="xs">
                        {groupedByLeg[leg.id].map((d) => (
                          <Card key={d.id} withBorder p="xs">
                            <Group justify="space-between">
                              <Box>
                                <Text size="sm">
                                  <Badge size="xs" mr={6}>
                                    {dayjs(d.date).format('DD/MM/YYYY')}
                                  </Badge>
                                  {d.venues?.name || d.venue_name || 'Sem local'}{' '}
                                  {d.venues?.cities?.name
                                    ? `• ${d.venues.cities.name}`
                                    : ''}{' '}
                                  {d.time_start || ''}
                                </Text>
                                {d.notes && (
                                  <Text size="xs" c="dimmed">
                                    {d.notes}
                                  </Text>
                                )}
                                {/* {d.venues?.id ? (
                                  <Badge size="xs" color="green" mt={2}>
                                    Local pré cadastrado ({d.venues.id})
                                  </Badge>
                                ) : (
                                  <Badge size="xs" color="gray" mt={2}>
                                    Local digitado manualmente
                                  </Badge>
                                )} */}
                              </Box>
                              <ActionIcon
                                size="xs"
                                color="red"
                                variant="subtle"
                                onClick={() => handleDeleteDate(d.id)}
                              >
                                <IconTrash size={12} />
                              </ActionIcon>
                            </Group>
                          </Card>
                        ))}
                      </Stack>
                    </Box>
                  ),
              )}
              {groupedByLeg['no-leg']?.length > 0 && (
                <Box>
                  <Text size="xs" fw={600} tt="uppercase" c="dimmed" mb={4}>
                    Sem perna
                  </Text>
                  <Stack gap="xs">
                    {groupedByLeg['no-leg'].map((d) => (
                      <Card key={d.id} withBorder p="xs">
                        <Group justify="space-between">
                          <Text size="sm">
                            <Badge size="xs" mr={6}>
                              {dayjs(d.date).format('DD/MM/YYYY')}
                            </Badge>
                            {d.venues?.name || d.venue_name || ''}
                          </Text>
                          <ActionIcon
                            size="xs"
                            color="red"
                            variant="subtle"
                            onClick={() => handleDeleteDate(d.id)}
                          >
                            <IconTrash size={12} />
                          </ActionIcon>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}

          <Divider label="Configurações" labelPosition="left" />
          <SimpleGrid cols={2}>
            <Switch
              label="Ativa"
              checked={isActive}
              onChange={(e) => setIsActive(e.currentTarget.checked)}
            />
            <Switch
              label="Pública"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.currentTarget.checked)}
            />
          </SimpleGrid>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button loading={submitting} onClick={handleSubmit}>
              Salvar
            </Button>
          </Group>
        </Stack>

        <Modal
          opened={legModalOpened}
          onClose={closeLegModal}
          title="Nova perna"
          size="sm"
        >
          <Stack>
            <TextInput
              label="Nome"
              placeholder="Ex: South American Leg"
              value={newLegName}
              onChange={(e) => setNewLegName(e.target.value)}
              data-autofocus
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={closeLegModal}>
                Cancelar
              </Button>
              <Button loading={creatingLeg} onClick={handleCreateLeg}>
                Criar
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </>
  )
}
