import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { fetchGenreCategories } from '../queries/genres'
import { fetchProjectStatuses, fetchProjectTypes } from '../queries/projects'
import {
  Container,
  Title,
  TextInput,
  Textarea,
  NativeSelect,
  Select,
  NumberInput,
  Checkbox,
  Radio,
  Grid,
  Group,
  Button,
  Divider,
  Text,
  Paper,
  ScrollArea,
  Flex,
  Avatar,
  Anchor,
  Image,
  Box,
  Input,
  Modal,
  Loader,
  Stack,
  LoadingOverlay,
  FileInput,
} from '@mantine/core'
import { useForm, isNotEmpty, isInRange } from '@mantine/form'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { upload } from '@imagekit/react'
import { IconTrash, IconCheck, IconSearch, IconCamera } from '@tabler/icons-react'

// ── Helpers ──────────────────────────────────────────────
function generateSlug(name) {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${suffix}`
}

// ── Queries ──────────────────────────────────────────────
async function fetchRegions() {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name, uf')
    .eq('country_id', 27)
    .order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data
}
async function searchProjectsByName(name) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, picture, genres ( id, name_ptbr )')
    .ilike('name', `%${name}%`)
    .limit(5)
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

async function fetchAllGenres() {
  const { data, error } = await supabase
    .from('genres')
    .select('id, name_ptbr, id_category')
    .eq('active', true)
    .order('name_ptbr')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// ── Componente principal ──────────────────────────────────
export default function NewProject({ onSuccess, isModal = false }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()

  // Estados locais
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nameValue, setNameValue] = useState('')
  // Imagem principal do projeto
  const [projectImage, setProjectImage] = useState('')
  const [projectFileId, setProjectFileId] = useState('')
  const [projectImageProgress, setProjectImageProgress] = useState(0)
  const [projectImageFile, setProjectImageFile] = useState(null)
  // Logo do projeto
  const [projectLogo, setProjectLogo] = useState('')
  const [projectLogoFileId, setProjectLogoFileId] = useState('')
  const [projectLogoProgress, setProjectLogoProgress] = useState(0)
  const [projectLogoFile, setProjectLogoFile] = useState(null)
  // Demais estados
  const [slugValue, setSlugValue] = useState('')
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState(null)
  const [descriptionValue, setDescriptionValue] = useState('')
  const [similarProjects, setSimilarProjects] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [citySearchQuery, setCitySearchQuery] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [citySearchLoading, setCitySearchLoading] = useState(false)
  const [noCityResults, setNoCityResults] = useState(false)
  const [modalCityOpened, { open: openCityModal, close: closeCityModal }] =
    useDisclosure(false)
  const [loadingStep, setLoadingStep] = useState('')

  // Queries
  const { data: projectStatuses = [], isLoading: isLoadingProjectStatuses } = useQuery({
    queryKey: ['project-statuses'],
    queryFn: fetchProjectStatuses,
    staleTime: Infinity,
  })
  const projectStatusesList = projectStatuses.map((status) => ({
    value: String(status?.id),
    label: status?.description_ptbr,
  }))
  const { data: projectTypes = [], isLoading: isLoadingProjectTypes } = useQuery({
    queryKey: ['project-types'],
    queryFn: fetchProjectTypes,
    staleTime: Infinity,
  })
  const projectTypesList = projectTypes.map((type) => ({
    value: String(type?.id),
    label: type?.name_ptbr,
  }))
  const { data: regions = [] } = useQuery({
    queryKey: ['regions-br'],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 60,
  })
  const { data: genreCategories = [] } = useQuery({
    queryKey: ['genre-categories'],
    queryFn: fetchGenreCategories,
    staleTime: Infinity,
  })
  const { data: allGenres = [] } = useQuery({
    queryKey: ['all-genres'],
    queryFn: fetchAllGenres,
    staleTime: Infinity,
  })
  const sortedGenreCategories = [
    ...genreCategories.filter((c) => c.id !== 5),
    ...genreCategories.filter((c) => c.id === 5),
  ]
  const genresList = sortedGenreCategories.map((category) => ({
    group: category.name_ptbr,
    items: allGenres
      .filter((g) => g.id_category === category.id)
      .map((genre) => ({
        value: String(genre.id),
        label: genre.name_ptbr,
      })),
  }))

  // Form
  const form = useForm({
    // mode: 'uncontrolled',
    initialValues: {
      name: '',
      slug: '',
      foundation_year: currentYear,
      end_year: null,
      description: '',
      project_type_id: '2',
      kind: '1',
      activity_status: '1',
      is_public: '1',
      region_id: '',
      genre_id: '',
      is_founder: true,
    },
    validate: {
      name: (v) => (v.length < 2 ? 'Mínimo de 2 caracteres' : null),
      foundation_year: isInRange(
        { min: 1800, max: currentYear },
        `Entre 1800 e ${currentYear}`,
      ),
      end_year: (v, values) =>
        !v && values.activity_status === '2' ? 'Informe o ano de encerramento' : null,
      project_type_id: isNotEmpty('Informe o tipo do projeto'),
      activity_status: isNotEmpty('Informe o status do projeto'),
      region_id: isNotEmpty('Informe o Estado de origem'),
    },
  })

  const checkSlug = useDebouncedCallback(async (slug) => {
    if (slug.length < 2) {
      setSlugAvailable(null)
      return
    }
    setSlugChecking(true)
    const { data } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    setSlugAvailable(!data)
    setSlugChecking(false)
  }, 700)

  const checkSimilarProjects = useDebouncedCallback(async (name) => {
    if (name.length < 3) {
      setSimilarProjects([])
      return
    }
    const results = await searchProjectsByName(name)
    if (results.length > 0) {
      setSimilarProjects(results)
      notifications.show({
        autoClose: 4000,
        position: 'top-center',
        color: 'yellow',
        title: 'Projetos com nomes parecidos',
        message: 'Será que seu projeto já está cadastrado?',
      })
    } else {
      setSimilarProjects([])
    }
  }, 800)

  function handleNameChange(value) {
    setNameValue(value)
    checkSimilarProjects(value)
  }

  function handleSlugChange(value) {
    const formatted = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '')
    setSlugValue(formatted)
    setSlugAvailable(null)
    checkSlug(formatted)
  }

  const handleCitySearch = useDebouncedCallback(async (query) => {
    const regionId = form.getValues().region_id
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

  // ── Upload helpers ────────────────────────────────────────

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

  /**
   * Faz upload de um arquivo para o ImageKit num folder específico.
   * @param {File}     file         - arquivo selecionado
   * @param {string}   fileName     - nome base do arquivo
   * @param {string}   folder       - pasta de destino (ex: '/projects/123/')
   * @param {string[]} tags         - tags do ImageKit
   * @param {Function} onProgress   - callback de progresso
   */
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

  /**
   * Remove um arquivo do ImageKit via Edge Function.
   */
  async function deleteFromImageKit(fileId) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const response = await fetch(
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
    if (!response.ok) {
      throw new Error('Erro ao deletar no servidor')
    }
  }

  async function handleRemoveImage() {
    if (!projectFileId) {
      return
    }
    try {
      await deleteFromImageKit(projectFileId)
      setProjectImage('')
      setProjectFileId('')
      setProjectImageFile(null)
      const el = document.querySelector('#projectImage')
      if (el) {
        el.value = null
      }
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * Pré-upload da imagem principal — folder temporário sem ID.
   * O caminho final será atualizado no handleSubmit após criação do projeto.
   */
  async function handleImageUpload(file) {
    if (!file) {
      return
    }
    setProjectImageFile(file)
    try {
      const response = await uploadToImageKit({
        file,
        fileName: `${slugValue || 'project'}_.jpg`,
        folder: '/projects/temp/',
        tags: ['project', 'picture'],
        onProgress: setProjectImageProgress,
      })
      const n = response.filePath.lastIndexOf('/')
      setProjectImage(response.filePath.substring(n + 1))
      setProjectFileId(response.fileId)
      setProjectImageProgress(0)
    } catch (err) {
      console.error('Erro detalhado:', err)
      notifications.show({
        color: 'red',
        title: 'Erro no upload',
        message: 'Não foi possível enviar a imagem. Tente novamente.',
      })
    }
  }

  async function handleRemoveLogo() {
    if (!projectLogoFileId) {
      return
    }
    try {
      await deleteFromImageKit(projectLogoFileId)
      setProjectLogo('')
      setProjectLogoFileId('')
      setProjectLogoFile(null)
      const el = document.querySelector('#projectLogo')
      if (el) {
        el.value = null
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleLogoUpload(file) {
    if (!file) {
      return
    }
    setProjectLogoFile(file)
    try {
      const response = await uploadToImageKit({
        file,
        fileName: `${slugValue || 'project'}_logo_.png`,
        folder: '/projects/temp/',
        tags: ['project', 'logo'],
        onProgress: setProjectLogoProgress,
      })
      const n = response.filePath.lastIndexOf('/')
      setProjectLogo(response.filePath.substring(n + 1))
      setProjectLogoFileId(response.fileId)
      setProjectLogoProgress(0)
    } catch (err) {
      console.error('Erro detalhado:', err)
      notifications.show({
        color: 'red',
        title: 'Erro no upload da logo',
        message: 'Não foi possível enviar a logo. Tente novamente.',
      })
    }
  }

  // ── Submit ────────────────────────────────────────────────

  async function handleSubmit(values) {
    setIsSubmitting(true)
    if (slugAvailable === false) {
      setIsSubmitting(false)
      return
    }

    const finalName = values.name || nameValue
    const finalSlug = slugValue || generateSlug(finalName)

    // 1. Cria o projeto
    setLoadingStep('Criando o projeto...')
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: finalName,
        slug: finalSlug,
        description: values.description || null,
        project_type_id: Number(values.project_type_id),
        genre_id: values.genre_id ? Number(values.genre_id) : null,
        on_tour: false,
        city_id: selectedCity?.id || null,
        activity_status: values.activity_status,
        is_public: values.is_public === '1',
      })
      .select('id')
      .single()

    if (projectError) {
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Não foi possível criar o projeto.',
      })
      setIsSubmitting(false)
      return
    }

    const projectId = newProject.id
    const targetFolder = `/projects/${projectId}/`

    let finalPicture = null
    let finalLogo = null

    try {
      if (projectImageFile) {
        if (projectFileId) {
          await deleteFromImageKit(projectFileId).catch(() => {})
        }
        const res = await uploadToImageKit({
          file: projectImageFile,
          fileName: `${finalSlug}_.jpg`,
          folder: targetFolder,
          tags: ['project', 'picture'],
          onProgress: setProjectImageProgress,
        })
        finalPicture = res.filePath.split('/').pop()
      }

      if (projectLogoFile) {
        if (projectLogoFileId) {
          await deleteFromImageKit(projectLogoFileId).catch(() => {})
        }
        const res = await uploadToImageKit({
          file: projectLogoFile,
          fileName: `${finalSlug}_logo_.png`,
          folder: targetFolder,
          tags: ['project', 'logo'],
          onProgress: setProjectLogoProgress,
        })
        finalLogo = res.filePath.split('/').pop()
      }
    } catch (err) {
      console.error('Erro no upload após criação do projeto:', err)
      notifications.show({
        color: 'yellow',
        title: 'Aviso',
        message: 'Projeto criado, mas houve um erro no upload das imagens.',
      })
    }

    // UPDATE com imagens (fora do try para garantir execução)
    setLoadingStep('Trabalhando as imagens...')
    if (finalPicture || finalLogo) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          ...(finalPicture && { picture: finalPicture }),
          ...(finalLogo && { logo: finalLogo }),
        })
        .eq('id', projectId)
    }

    // Adiciona membro fundador
    setLoadingStep('Quase lá...')
    const { error: memberError } = await supabase.from('project_members').insert({
      project_id: projectId,
      profile_id: user.id,
      is_founder: values.is_founder,
      is_admin: true,
      status: 2,
    })

    if (memberError) {
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Projeto criado, mas não foi possível adicionar você como membro.',
      })
      setIsSubmitting(false)
      return
    }

    notifications.show({
      color: 'green',
      title: 'Projeto criado!',
      message: `"${finalName}" foi criado com sucesso.`,
    })
    if (onSuccess) {
      onSuccess()
    } else {
      navigate(`/project/${finalSlug}`)
    }
  }

  const activityStatus = form.getValues().activity_status
  const regionId = form.getValues().region_id

  return (
    <Container size="sm" py="md" px={{ base: 'xs', sm: 'xs' }} pos="relative">
      <LoadingOverlay
        visible={isSubmitting}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{
          children: (
            <Stack align="center" gap="xs">
              <Loader color="indigo" size="md" />
              <Text size="sm" c="dimmed" ta="center">
                {loadingStep}
              </Text>
            </Stack>
          ),
        }}
      />
      {!isModal && (
        <Title order={1} fz="h3" ta="left" fw={600} mb={20}>
          Cadastrar um novo projeto
        </Title>
      )}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                withAsterisk
                label="Nome do projeto"
                placeholder="Ex: Viajantes do Espaço"
                description="Nome da banda, projeto solo, DJ, etc"
                value={nameValue}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => {
                  form.setFieldValue('name', nameValue)
                  form.validateField('name')
                }}
                error={form.errors.name}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                withAsterisk
                label="URL do projeto"
                placeholder="Ex: viajantesdoespaco"
                description={`mublin.com/project/${slugValue}`}
                maxLength={70}
                rightSection={slugChecking ? <Loader size={16} /> : undefined}
                leftSection={
                  slugValue.length >= 2 && !slugChecking && slugAvailable === true ? (
                    <IconCheck size={18} color="green" />
                  ) : undefined
                }
                error={
                  slugValue.length >= 2 && !slugChecking && slugAvailable === false
                    ? 'Username não disponível'
                    : undefined
                }
                value={slugValue}
                onChange={(e) => handleSlugChange(e.target.value)}
              />
            </Grid.Col>
          </Grid>

          {/* Projetos similares */}
          {similarProjects.length > 0 && (
            <Paper withBorder p="sm" radius="md">
              <Text size="sm" fw={600} mb={4}>
                Ops, encontramos projetos com nomes parecidos
              </Text>
              <Text size="xs" c="dimmed" mb={8}>
                Será que já está cadastrado?{' '}
                <Anchor onClick={() => setSimilarProjects([])}>
                  Não é nenhum destes
                </Anchor>
              </Text>
              <ScrollArea w="100%" type="hover" scrollbarSize={6}>
                <Flex gap={12} w="max-content">
                  {similarProjects.map((p) => (
                    <Anchor key={p.id} href={`/project/${p.slug}`} underline="never">
                      <Flex direction="column" align="center" gap={4}>
                        <Avatar
                          size={48}
                          radius="md"
                          src={
                            p.picture
                              ? `https://ik.imagekit.io/mublin/projects/${p.id}/tr:h-100/${p.picture}`
                              : undefined
                          }
                        />
                        <Text size="xs" fw={500} ta="center" maw={60} lineClamp={2}>
                          {p.name}
                        </Text>
                        <Text size="10px" c="dimmed">
                          {p.genres?.name_ptbr}
                        </Text>
                      </Flex>
                    </Anchor>
                  ))}
                </Flex>
              </ScrollArea>
            </Paper>
          )}

          {/* ── Imagens ── */}
          <Divider label="Imagens do projeto" labelPosition="center" />

          <Grid>
            {/* Imagem principal */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              {!projectImage ? (
                <>
                  <FileInput
                    id="projectImage"
                    accept="image/png,image/jpeg,image/gif"
                    label="Imagem do projeto"
                    description="Uma foto/imagem que representa o projeto"
                    placeholder="Escolher arquivo"
                    leftSection={<IconCamera size={18} />}
                    onChange={(file) => handleImageUpload(file)}
                  />
                  {projectImageProgress > 0 && projectImageProgress < 100 && (
                    <Text size="xs" c="dimmed" mt={4}>
                      Enviando... {projectImageProgress}%
                    </Text>
                  )}
                </>
              ) : (
                <Flex gap={12} align="center">
                  <Image
                    radius="md"
                    h="auto"
                    w={100}
                    src={`https://ik.imagekit.io/mublin/tr:w-130/projects/temp/${projectImage}`}
                  />
                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    leftSection={<IconTrash size={14} />}
                    onClick={handleRemoveImage}
                  >
                    Remover
                  </Button>
                </Flex>
              )}
            </Grid.Col>

            {/* Logo */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              {!projectLogo ? (
                <>
                  <FileInput
                    id="projectLogo"
                    accept="image/png,image/jpeg,image/gif"
                    label="Logo do projeto (opcional)"
                    description="Logotipo/símbolo do projeto"
                    placeholder="Escolher arquivo"
                    leftSection={<IconCamera size={18} />}
                    onChange={(file) => handleLogoUpload(file)}
                  />
                  {projectLogoProgress > 0 && projectLogoProgress < 100 && (
                    <Text size="xs" c="dimmed" mt={4}>
                      Enviando... {projectLogoProgress}%
                    </Text>
                  )}
                </>
              ) : (
                <Flex gap={12} align="center">
                  <Image
                    radius="md"
                    h="auto"
                    w={80}
                    src={`https://ik.imagekit.io/mublin/tr:w-100/projects/temp/${projectLogo}`}
                  />
                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    leftSection={<IconTrash size={14} />}
                    onClick={handleRemoveLogo}
                  >
                    Remover
                  </Button>
                </Flex>
              )}
            </Grid.Col>
          </Grid>

          <Divider label="Informações adicionais" labelPosition="center" />

          {/* Tipo e conteúdo */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Tipo de projeto"
                placeholder="Selecione"
                withAsterisk
                data={projectTypesList}
                disabled={isLoadingProjectTypes}
                key={form.key('project_type_id')}
                {...form.getInputProps('project_type_id')}
                maxDropdownHeight={155}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Conteúdo principal"
                placeholder="Selecione"
                withAsterisk
                data={[
                  { value: '1', label: 'Autoral' },
                  { value: '2', label: 'Cover' },
                  { value: '3', label: 'Autoral + Cover' },
                ]}
                key={form.key('kind')}
                {...form.getInputProps('kind')}
              />
            </Grid.Col>
          </Grid>

          <Select
            label="Status do projeto"
            placeholder="Selecione"
            withAsterisk
            data={projectStatusesList}
            disabled={isLoadingProjectStatuses}
            key={form.key('activity_status')}
            {...form.getInputProps('activity_status')}
          />

          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                withAsterisk
                label="Ano de formação"
                min={1800}
                max={currentYear}
                key={form.key('foundation_year')}
                {...form.getInputProps('foundation_year')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                withAsterisk={activityStatus === '2'}
                label="Encerramento"
                min={form.getValues().foundation_year}
                max={currentYear}
                disabled={activityStatus !== '2'}
                key={form.key('end_year')}
                {...form.getInputProps('end_year')}
              />
            </Grid.Col>
          </Grid>

          <Select
            label="Gênero principal"
            description="Gênero ou estilo musical que melhor define"
            placeholder="Selecione (opcional)"
            searchable
            comboboxProps={{ position: 'bottom', middlewares: { flip: false } }}
            data={genresList}
            key={form.key('genre_id')}
            {...form.getInputProps('genre_id')}
          />

          <Grid>
            <Grid.Col span={6}>
              <NativeSelect
                withAsterisk
                label="Estado"
                key={form.key('region_id')}
                {...form.getInputProps('region_id')}
                onChange={(e) => {
                  form.setFieldValue('region_id', e.target.value)
                  setSelectedCity(null)
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
              <Input.Wrapper label="Cidade">
                <Input
                  pointer
                  readOnly
                  placeholder={regionId ? 'Selecionar...' : 'Selecione o Estado'}
                  disabled={!regionId}
                  value={selectedCity?.name ?? ''}
                  rightSection={regionId ? <IconSearch size={15} /> : undefined}
                  onClick={() => {
                    if (regionId) {
                      openCityModal()
                    }
                  }}
                />
              </Input.Wrapper>
            </Grid.Col>
          </Grid>

          <Textarea
            label="Bio"
            placeholder="Conte um pouco sobre o projeto (opcional)"
            maxLength={2000}
            description={`${descriptionValue.length}/2000`}
            autosize
            minRows={3}
            maxRows={9}
            value={descriptionValue}
            onChange={(e) => {
              setDescriptionValue(e.target.value)
              form.setFieldValue('description', e.target.value)
            }}
          />

          <Radio.Group
            label="Visibilidade do projeto"
            description="Exibição do projeto nas buscas do Mublin"
            key={form.key('is_public')}
            {...form.getInputProps('is_public')}
          >
            <Group mt="xs">
              <Radio color="indigo" value="1" label="Público" />
              <Radio color="indigo" value="0" label="Privado" />
            </Group>
          </Radio.Group>

          <Divider />

          <Group>
            <Checkbox label="Sou administrador do projeto" disabled checked />
            <Checkbox
              label="Sou fundador do projeto"
              key={form.key('is_founder')}
              {...form.getInputProps('is_founder', { type: 'checkbox' })}
            />
          </Group>

          <Group justify="flex-end" mt="sm">
            {!onSuccess && (
              <Button variant="default" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              color="mublinColor"
              disabled={
                slugChecking ||
                slugAvailable === false ||
                slugValue.length < 2 ||
                !nameValue
              }
            >
              Cadastrar projeto
            </Button>
          </Group>
        </Stack>
      </form>

      <Modal
        title="Selecionar cidade"
        opened={modalCityOpened}
        onClose={closeCityModal}
        size="sm"
        radius="md"
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
              Nenhuma cidade encontrada neste Estado.
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
    </Container>
  )
}
