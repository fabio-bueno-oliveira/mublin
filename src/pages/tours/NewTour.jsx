import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { upload } from '@imagekit/react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { fetchAllGenres } from '../../queries/genres'
import { searchProjects } from '../../queries/search'
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
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPhoto,
  IconX,
  IconCalendar,
  IconMusic,
  IconSearch,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react'

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

const PROJECTS_PATH = 'https://ik.imagekit.io/mublin/projects/tr:w-64,h-64/'

export default function NewTour() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const imageInputRef = useRef(null)

  // Base
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genreId, setGenreId] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isPublic, setIsPublic] = useState(true)

  // Imagem - BLOB LOCAL (sem upload pra temp)
  const [picturePreview, setPicturePreview] = useState('') // URL.createObjectURL
  const [pictureFile, setPictureFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Projetos
  const [projectSearchQuery, setProjectSearchQuery] = useState('')
  const [projectResults, setProjectResults] = useState([])
  const [projectLoading, setProjectLoading] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState([])

  const { data: genres = [], isLoading: loadingGenres } = useQuery({
    queryKey: ['genres-all'],
    queryFn: fetchAllGenres,
    staleTime: Infinity,
  })

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

  function addProject(project) {
    if (selectedProjects.some((p) => p.id === project.id)) return
    const isFirst = selectedProjects.length === 0
    setSelectedProjects((prev) => [
      ...prev,
      {
        id: project.id,
        name: project.name,
        picture: project.picture,
        slug: project.slug,
        is_headliner: isFirst,
        order_show: prev.length,
      },
    ])
    setProjectSearchQuery('')
    setProjectResults([])
  }
  function removeProject(id) {
    setSelectedProjects((prev) =>
      prev.filter((p) => p.id !== id).map((p, idx) => ({ ...p, order_show: idx })),
    )
  }
  function toggleHeadliner(id) {
    setSelectedProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_headliner: !p.is_headliner } : p)),
    )
  }

  // ── Imagem com BLOB LOCAL - igual NewProject.jsx linha 392-410 ──
  function handleImageUpload(file) {
    if (picturePreview) URL.revokeObjectURL(picturePreview)
    if (!file) {
      setPictureFile(null)
      setPicturePreview('')
      return
    }
    setPictureFile(file)
    const previewUrl = URL.createObjectURL(file)
    setPicturePreview(previewUrl)
  }

  function handleRemoveImage() {
    if (picturePreview) URL.revokeObjectURL(picturePreview)
    setPicturePreview('')
    setPictureFile(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  // ── ImageKit upload final ──
  async function getIkAuthTokens() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const authRes = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (!authRes.ok) throw new Error('Falha ImageKit')
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

  async function handleSubmit() {
    if (!title.trim()) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Informe o título',
      })
      return
    }
    if (dateStart && dateEnd && dateEnd < dateStart) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Data final anterior',
      })
      return
    }
    setSubmitting(true)

    let slug = generateSlug(title)
    let finalSlug = slug
    let counter = 1
    while (counter < 20) {
      const { data: exists } = await supabase
        .from('tours')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle()
      if (!exists) break
      finalSlug = `${slug}-${counter}`
      counter++
    }

    const { data: newTour, error } = await supabase
      .from('tours')
      .insert({
        title: title.trim(),
        slug: finalSlug,
        description: description.trim() || null,
        genre_id: genreId ? Number(genreId) : null,
        date_start: dateStart || null,
        date_end: dateEnd || null,
        is_active: isActive,
        is_public: isPublic,
        created_by: user.id,
        picture: null,
      })
      .select('id, slug')
      .single()

    if (error) {
      notifications.show({ color: 'red', position: 'top-center', message: error.message })
      setSubmitting(false)
      return
    }

    // Upload final só aqui - sem temp
    if (pictureFile) {
      try {
        const response = await uploadToImageKit({
          file: pictureFile,
          fileName: `${newTour.id}_.jpg`,
          folder: '/tours/',
          tags: ['tour'],
        })
        const n = response.filePath.lastIndexOf('/')
        const finalUrl = response.filePath.substring(n + 1)
        await supabase.from('tours').update({ picture: finalUrl }).eq('id', newTour.id)
        if (picturePreview) URL.revokeObjectURL(picturePreview)
      } catch (e) {
        console.error(e)
      }
    }

    if (selectedProjects.length > 0) {
      const rows = selectedProjects.map((p) => ({
        tour_id: newTour.id,
        project_id: p.id,
        is_headliner: !!p.is_headliner,
        order_show: p.order_show,
      }))
      await supabase.from('tour_projects').insert(rows)
    }

    notifications.show({
      color: 'green',
      position: 'top-center',
      message: 'Turnê cadastrada!',
    })
    navigate(`/tour/${newTour.slug}`)
  }

  return (
    <>
      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Cadastrar nova turnê" />
      </Affix>
      <Container size="sm" pb="xl" mt={{ base: 70, sm: 'md' }}>
        <Title order={3} mb="xs" visibleFrom="sm">
          Cadastrar nova turnê
        </Title>
        <Stack gap="md">
          <Box>
            <Text size="xs" c="dimmed" fw={500} mb={6}>
              <IconPhoto size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Capa / pôster
            </Text>
            {picturePreview ? (
              <Box style={{ position: 'relative', display: 'inline-block' }}>
                <Image src={picturePreview} radius="md" h={180} w="auto" fit="contain" />
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
                  Adicionar imagem
                </Button>
              </>
            )}
          </Box>

          <Divider />
          <TextInput
            label="Título *"
            placeholder="Ex: Flying Blind World Tour 2027"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autosize
            minRows={3}
          />
          <NativeSelect
            label="Gênero"
            value={genreId}
            disabled={loadingGenres}
            onChange={(e) => setGenreId(e.target.value)}
            leftSection={<IconMusic size={14} />}
          >
            <option value="">Opcional</option>
            {genres.map((g) => (
              <option key={g.id} value={String(g.id)}>
                {g.name_ptbr}
              </option>
            ))}
          </NativeSelect>

          <Divider label="Período" labelPosition="left" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Início"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              leftSection={<IconCalendar size={14} />}
            />
            <TextInput
              label="Fim"
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              leftSection={<IconCalendar size={14} />}
            />
          </SimpleGrid>

          <Divider label="Artistas / Projetos" labelPosition="left" />
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
            <Card withBorder radius="md" p={0}>
              <ScrollArea h={200}>
                <Stack gap={0}>
                  {projectResults.map((p) => (
                    <Group
                      key={p.id}
                      justify="space-between"
                      p="xs"
                      style={{
                        borderBottom: '1px solid var(--mantine-color-default-border)',
                      }}
                    >
                      <Group gap="sm">
                        <Avatar
                          src={
                            p.picture
                              ? `${PROJECTS_PATH}/${p.id}/${p.picture}`
                              : undefined
                          }
                          size={32}
                          radius="md"
                        />
                        <Text size="sm">{p.name}</Text>
                      </Group>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconPlus size={12} />}
                        onClick={() => addProject(p)}
                      >
                        Adicionar
                      </Button>
                    </Group>
                  ))}
                </Stack>
              </ScrollArea>
            </Card>
          )}
          {selectedProjects.length > 0 && (
            <Stack gap="xs">
              {selectedProjects.map((p) => (
                <Card key={p.id} withBorder radius="md" p="sm">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <Avatar
                        src={
                          p.picture ? `${PROJECTS_PATH}/${p.id}/${p.picture}` : undefined
                        }
                        size={32}
                        radius="md"
                      />
                      <Box>
                        <Text size="sm" fw={500}>
                          {p.name}
                        </Text>
                        {p.is_headliner && (
                          <Badge size="xs" color="violet">
                            Headliner
                          </Badge>
                        )}
                      </Box>
                    </Group>
                    <Group gap="sm">
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
          )}

          <Divider label="Configurações" labelPosition="left" />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
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

          <Divider />
          <Group justify="flex-end">
            <Button loading={submitting} onClick={handleSubmit}>
              Cadastrar turnê
            </Button>
          </Group>
        </Stack>
      </Container>
    </>
  )
}
