import { useRef, useState } from 'react'
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
  MultiSelect,
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
import { IconTrash, IconSearch, IconCamera } from '@tabler/icons-react'

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
const BRAZIL_COUNTRY_ID = '27'

// Valores vazios ou salvos como texto 'NULL' no banco não contam como nome válido
function isValidText(v) {
  return typeof v === 'string' && v.trim() !== '' && v.trim().toLowerCase() !== 'null'
}

// Nome do país em pt-BR: name_ptbr -> Intl.DisplayNames (via code ISO) -> name
const regionNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' })
function getCountryLabel(country) {
  if (isValidText(country.name_ptbr)) {
    return country.name_ptbr.trim()
  }
  if (isValidText(country.code)) {
    try {
      const code = country.code.trim().toUpperCase()
      const translated = regionNames.of(code)
      if (translated && translated !== code) {
        return translated
      }
    } catch {
      // código ISO inválido: segue para o fallback
    }
  }
  return isValidText(country.name) ? country.name.trim() : null
}

async function fetchCountries() {
  const { data, error } = await supabase
    .from('countries')
    .select('id, name, name_ptbr, code')
  if (error) {
    throw new Error(error.message)
  }
  return data
}
async function fetchRegions(countryId) {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name, uf')
    .eq('country_id', Number(countryId))
    .order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data
}
async function searchProjectsByName(name) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, picture, project_genres ( genres ( id, name_ptbr ) )')
    .ilike('name', `%${name}%`)
    .limit(5)
  if (error) {
    throw new Error(error.message)
  }
  return data
}
// Se houver regionId, busca dentro da região; senão (países sem regiões
// cadastradas), busca direto pelo país.
async function searchCitiesByName(query, { regionId, countryId }) {
  let request = supabase
    .from('cities')
    .select('id, name, regions ( name )')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20)
  request = regionId
    ? request.eq('region_id', Number(regionId))
    : request.eq('country_id', Number(countryId))
  const { data, error } = await request
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
  const { data: countries = [], isLoading: isLoadingCountries } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: Infinity,
  })
  const countriesList = countries
    .map((c) => ({ value: String(c.id), label: getCountryLabel(c) }))
    .filter((c) => c.label)
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
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
  // Estado/região só é obrigatório se o país escolhido tiver regiões cadastradas
  const regionsRequiredRef = useRef(true)
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
      country_id: BRAZIL_COUNTRY_ID,
      region_id: '',
      genre_ids: [],
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
      country_id: isNotEmpty('Informe o país de origem'),
      region_id: (v) =>
        regionsRequiredRef.current && !v ? 'Informe o Estado/região de origem' : null,
    },
  })

  const countryId = form.getValues().country_id
  const { data: regions = [], isLoading: isLoadingRegions } = useQuery({
    queryKey: ['regions', countryId],
    queryFn: () => fetchRegions(countryId),
    enabled: !!countryId,
    staleTime: 1000 * 60 * 60,
  })
  const hasRegions = regions.length > 0
  regionsRequiredRef.current = hasRegions
  const isBrazil = countryId === BRAZIL_COUNTRY_ID

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
    const { region_id: regionId, country_id: countryId } = form.getValues()
    if (!query || query.length < 2 || !countryId || (hasRegions && !regionId)) {
      return
    }
    setCitySearchLoading(true)
    setNoCityResults(false)
    const results = await searchCitiesByName(query, {
      regionId: hasRegions ? regionId : null,
      countryId,
    })
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
        on_tour: false,
        city_id: selectedCity?.id || null,
        country_id: Number(values.country_id),
        foundation_year: values.foundation_year ? Number(values.foundation_year) : null,
        end_year:
          values.activity_status === '2' && values.end_year
            ? Number(values.end_year)
            : null,
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

    // 2. Adiciona o membro fundador ANTES de qualquer UPDATE em projects.
    // A policy de UPDATE exige um registro em project_members com
    // is_admin = true e status = 2, senão a RLS bloqueia silenciosamente.
    setLoadingStep('Configurando permissões...')
    const { error: memberError } = await supabase.from('project_members').insert({
      project_id: projectId,
      profile_id: user.id,
      is_founder: values.is_founder,
      is_admin: true,
      status: 2,
    })

    if (memberError) {
      console.error('Erro ao adicionar membro fundador:', memberError)
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: 'Projeto criado, mas não foi possível adicionar você como membro.',
      })
      setIsSubmitting(false)
      return
    }

    // 2.1 Gêneros do projeto (tabela project_genres, N:N)
    if (values.genre_ids?.length) {
      setLoadingStep('Salvando gêneros...')
      const { error: genresError } = await supabase.from('project_genres').insert(
        values.genre_ids.map((genreId) => ({
          project_id: projectId,
          genre_id: Number(genreId),
        })),
      )
      if (genresError) {
        console.error('Erro ao salvar gêneros do projeto:', genresError)
        notifications.show({
          color: 'yellow',
          title: 'Aviso',
          message: 'Projeto criado, mas os gêneros não puderam ser salvos.',
        })
      }
    }

    // 3. Upload da imagem definitiva na pasta do projeto
    let finalPicture = null

    try {
      if (projectImageFile) {
        setLoadingStep('Trabalhando as imagens...')
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
    } catch (err) {
      console.error('Erro no upload após criação do projeto:', err)
      notifications.show({
        color: 'yellow',
        title: 'Aviso',
        message: 'Projeto criado, mas houve um erro no upload das imagens.',
      })
    }

    // 4. UPDATE da imagem. O .select('id') faz o Supabase devolver as linhas
    // afetadas, permitindo detectar bloqueio silencioso por RLS (0 linhas).
    if (finalPicture) {
      const { data: updatedRows, error: updateError } = await supabase
        .from('projects')
        .update({ picture: finalPicture })
        .eq('id', projectId)
        .select('id')

      if (updateError || !updatedRows?.length) {
        console.error(
          'Erro ao atualizar imagem do projeto:',
          updateError ?? 'nenhuma linha afetada (possível bloqueio de RLS)',
        )
        notifications.show({
          color: 'yellow',
          title: 'Aviso',
          message:
            'Projeto criado, mas a imagem não pôde ser salva. Tente atualizá-la depois.',
        })
      }
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
  // Cidade liberada: com região (se o país tem regiões) ou direto pelo país
  const canPickCity = !!countryId && !isLoadingRegions && (hasRegions ? !!regionId : true)

  function resetCity() {
    setSelectedCity(null)
    setCitySearchQuery('')
    setCityResults([])
    setNoCityResults(false)
  }

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
        <Stack gap="sm">
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
                success={
                  slugValue.length >= 2 && !slugChecking && slugAvailable === true
                    ? 'Username disponível'
                    : undefined
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
                          {p.project_genres?.[0]?.genres?.name_ptbr}
                        </Text>
                      </Flex>
                    </Anchor>
                  ))}
                </Flex>
              </ScrollArea>
            </Paper>
          )}

          {/* ── Imagem ── */}

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

          <MultiSelect
            label="Gêneros"
            description="Gêneros ou estilos musicais que melhor definem (até 5)"
            placeholder="Selecione (opcional)"
            searchable
            clearable
            hidePickedOptions
            maxValues={5}
            comboboxProps={{ position: 'bottom', middlewares: { flip: false } }}
            data={genresList}
            key={form.key('genre_ids')}
            {...form.getInputProps('genre_ids')}
          />

          <Select
            withAsterisk
            label="País"
            placeholder="Selecione"
            searchable
            data={countriesList}
            disabled={isLoadingCountries}
            comboboxProps={{ position: 'bottom', middlewares: { flip: false } }}
            key={form.key('country_id')}
            {...form.getInputProps('country_id')}
            onChange={(value) => {
              form.setFieldValue('country_id', value ?? '')
              form.setFieldValue('region_id', '')
              resetCity()
            }}
          />

          <Grid>
            <Grid.Col span={6}>
              <NativeSelect
                withAsterisk={hasRegions}
                label={isBrazil ? 'Estado' : 'Estado / Região'}
                disabled={!countryId || isLoadingRegions || !hasRegions}
                key={form.key('region_id')}
                {...form.getInputProps('region_id')}
                onChange={(e) => {
                  form.setFieldValue('region_id', e.target.value)
                  resetCity()
                }}
              >
                <option value="">
                  {countryId && !isLoadingRegions && !hasRegions
                    ? 'Sem regiões cadastradas'
                    : 'Selecione'}
                </option>
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
                  placeholder={
                    canPickCity
                      ? 'Selecionar...'
                      : countryId
                        ? 'Selecione o Estado/região'
                        : 'Selecione o país'
                  }
                  disabled={!canPickCity}
                  value={selectedCity?.name ?? ''}
                  rightSection={canPickCity ? <IconSearch size={15} /> : undefined}
                  onClick={() => {
                    if (canPickCity) {
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
            maxLength={3000}
            description={`${descriptionValue.length}/3000`}
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
              Nenhuma cidade encontrada {hasRegions ? 'nesta região' : 'neste país'}.
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
                      {!hasRegions && city.regions?.name ? (
                        <Text span size="xs" c="dimmed">
                          {' '}
                          — {city.regions.name}
                        </Text>
                      ) : null}
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
