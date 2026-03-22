import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import {
  Container, Title, TextInput, Textarea, NativeSelect,
  NumberInput, Checkbox, Radio, Grid, Group, Button,
  Divider, Text, Paper, ScrollArea, Flex,
  Avatar, Anchor, Image, Box, Input, Modal,
  Loader, Stack
} from '@mantine/core'
import { useForm, isNotEmpty, isInRange } from '@mantine/form'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { upload } from '@imagekit/react'
import { IconTrash, IconCheck, IconSearch } from '@tabler/icons-react'

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

async function fetchRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name_ptbr, instrumentalist, applies_to_a_project')
    .eq('applies_to_a_project', true)
    .order('name_ptbr')
  if (error) throw new Error(error.message)
  return data
}

async function fetchRegions() {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name, uf')
    .eq('country_id', 27) // Brasil
    .order('name')
  if (error) throw new Error(error.message)
  return data
}

async function searchProjectsByName(name) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, picture')
    .ilike('name', `%${name}%`)
    .limit(5)
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

// ── Componente principal ──────────────────────────────────

export default function NewProject() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const currentYear = new Date().getFullYear()

  // Estados locais
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [projectImage, setProjectImage] = useState('')
  const [slugValue, setSlugValue] = useState('')
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState(null)
  const [similarProjects, setSimilarProjects] = useState([])
  const [selectedCity, setSelectedCity] = useState(null) // { id, name }
  const [citySearchQuery, setCitySearchQuery] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [citySearchLoading, setCitySearchLoading] = useState(false)
  const [noCityResults, setNoCityResults] = useState(false)
  const [modalCityOpened, { open: openCityModal, close: closeCityModal }] = useDisclosure(false)

  // Queries
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
    .filter(r => r.instrumentalist)
    .map(r => ({ label: r.name_ptbr, value: String(r.id) }))

  const rolesManagement = roles
    .filter(r => !r.instrumentalist)
    .map(r => ({ label: r.name_ptbr, value: String(r.id) }))

  // Form
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      slug: '',
      foundation_year: currentYear,
      end_year: null,
      description: '',
      main_role_id: '',
      project_type_id: '2',
      kind: '1',
      activity_status: '1',
      is_public: '1',
      featured: false,
      region_id: '',
    },
    validate: {
      name: (v) => (v.length < 2 ? 'Mínimo de 2 caracteres' : null),
      foundation_year: isInRange({ min: 1800, max: currentYear }, `Entre 1800 e ${currentYear}`),
      end_year: (v, values) =>
        (!v && values.activity_status === '2') ? 'Informe o ano de encerramento' : null,
      main_role_id: isNotEmpty('Informe sua função principal'),
      project_type_id: isNotEmpty('Informe o tipo do projeto'),
      activity_status: isNotEmpty('Informe o status do projeto'),
      region_id: isNotEmpty('Informe o Estado de origem'),
    },
  })

  const checkSlug = useDebouncedCallback(async (slug) => {
    if (slug.length < 2) { setSlugAvailable(null); return }
    setSlugChecking(true)
    const { data } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    setSlugAvailable(!data)
    setSlugChecking(false)
  }, 700)

  // Busca projetos similares com debounce
  const checkSimilarProjects = useDebouncedCallback(async (name) => {
    if (name.length < 3) { setSimilarProjects([]); return }
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
    setSlugAvailable(null)   // reseta o ícone enquanto digita
    checkSlug(formatted)
  }

  // Busca cidades
  const handleCitySearch = useDebouncedCallback(async (query) => {
    const regionId = form.getValues().region_id
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

  // Upload de imagem
  const [uploadProgress, setUploadProgress] = useState(0)

  async function handleImageUpload(file) {
    if (!file) return
    try {
      const response = await upload({
        file,
        fileName: `${slugValue || 'project'}_.jpg`,
        folder: '/projects/',
        tags: ['project', 'avatar'],
        useUniqueFileName: true,
        publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
        authenticationEndpoint: import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT,
        onProgress: (e) => setUploadProgress(Math.round((e.loaded / e.total) * 100)),
      })
      const n = response.filePath.lastIndexOf('/')
      setProjectImage(response.filePath.substring(n + 1))
      setUploadProgress(0)
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Erro no upload',
        message: 'Não foi possível enviar a imagem. Tente novamente.',
      })
    }
  }

  // Submit
  async function handleSubmit(values) {
    setIsSubmitting(true)
    if (slugAvailable === false) return

    const finalName = values.name || nameValue
    const finalSlug = slugValue || generateSlug(finalName)

    // 1. Cria o projeto
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: finalName,
        slug: finalSlug,
        description: values.description || null,
        picture: projectImage || null,
        project_type_id: Number(values.project_type_id),
        on_tour: false,
      })
      .select('id')
      .single()

    if (projectError) {
      notifications.show({ color: 'red', title: 'Erro', message: 'Não foi possível criar o projeto.' })
      setIsSubmitting(false)
      return
    }

    // 2. Adiciona o criador como membro fundador e admin
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: newProject.id,
        profile_id: user.id,
        role_id: Number(values.main_role_id),
        is_founder: true,
        is_admin: true,
        joined_at: `${values.foundation_year}-01-01`,
      })

    if (memberError) {
      notifications.show({ color: 'red', title: 'Erro', message: 'Projeto criado, mas não foi possível adicionar você como membro.' })
      setIsSubmitting(false)
      return
    }

    notifications.show({
      color: 'green',
      title: 'Projeto criado!',
      message: `"${values.name}" foi criado com sucesso.`,
    })

    navigate('/home')
  }

  const activityStatus = form.getValues().activity_status
  const regionId = form.getValues().region_id

  return (
    <Container size="xs" py={32} mb={80}>
      <Title order={3} ta="center" fw={800} lts="-0.02em" mb={24}>
        Cadastrar novo projeto
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">

          {/* Nome */}
          <TextInput
            withAsterisk
            label="Nome do projeto"
            placeholder="Ex: Viajantes do Espaço"
            value={nameValue}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => {
              form.setFieldValue('name', nameValue)
              form.validateField('name')
            }}
            error={form.errors.name}
          />

          <Checkbox
            color="indigo"
            label="Definir como um dos meus projetos principais"
            key={form.key('featured')}
            {...form.getInputProps('featured', { type: 'checkbox' })}
          />

          {/* Projetos similares */}
          {similarProjects.length > 0 && (
            <Paper withBorder p="sm" radius="md">
              <Text size="xs" fw={600} mb={4}>Projetos com nomes parecidos</Text>
              <Text size="xs" c="dimmed" mb={8}>Será que já está cadastrado?</Text>
              <ScrollArea w="100%" type="hover" scrollbarSize={6}>
                <Flex gap={12} w="max-content">
                  {similarProjects.map(p => (
                    <Anchor key={p.id} href={`/project/${p.slug}`} underline="never">
                      <Flex direction="column" align="center" gap={4}>
                        <Avatar
                          size={48}
                          radius="md"
                          src={p.picture ? `https://ik.imagekit.io/mublin/projects/tr:h-100/${p.picture}` : undefined}
                        />
                        <Text size="xs" fw={500} ta="center" maw={60} lineClamp={2}>{p.name}</Text>
                      </Flex>
                    </Anchor>
                  ))}
                </Flex>
              </ScrollArea>
            </Paper>
          )}

          {/* Slug */}
          <TextInput
            withAsterisk
            label="URL do projeto"
            placeholder="Ex: viajantesdoespaco"
            description={`mublin.com/project/${slugValue}`}
            maxLength={70}
            rightSection={slugChecking ? <Loader size={16} /> : undefined}
            leftSection={
              slugValue.length >= 2 && !slugChecking && slugAvailable === true
                ? <IconCheck size={18} color="green" />
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

          <Divider label="Imagem do projeto" labelPosition="center" />

          {/* Upload de imagem */}
          {!projectImage ? (
            <>
              <input
                id="projectImage"
                type="file"
                accept="image/png,image/jpeg,image/gif"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <Text size="xs" c="dimmed">Enviando... {uploadProgress}%</Text>
              )}
            </>
          ) : (
            <Flex gap={12} align="center">
              <Image
                radius="md"
                h="auto"
                w={100}
                src={`https://ik.imagekit.io/mublin/tr:w-130/projects/${projectImage}`}
              />
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconTrash size={14} />}
                onClick={() => {
                  setProjectImage('')
                  document.querySelector('#projectImage').value = null
                }}
              >
                Remover
              </Button>
            </Flex>
          )}

          <Divider label="Informações adicionais" labelPosition="center" />

          {/* Tipo e conteúdo */}
          <Grid>
            <Grid.Col span={6}>
              <NativeSelect
                withAsterisk
                label="Tipo de projeto"
                key={form.key('project_type_id')}
                {...form.getInputProps('project_type_id')}
              >
                <option value="2">Banda</option>
                <option value="3">Projeto</option>
                <option value="1">Artista Solo</option>
                <option value="8">DJ</option>
                <option value="4">Dupla</option>
                <option value="5">Trio</option>
                <option value="9">Grupo</option>
              </NativeSelect>
            </Grid.Col>
            <Grid.Col span={6}>
              <NativeSelect
                withAsterisk
                label="Conteúdo principal"
                key={form.key('kind')}
                {...form.getInputProps('kind')}
              >
                <option value="1">Autoral</option>
                <option value="2">Cover</option>
                <option value="3">Autoral + Cover</option>
              </NativeSelect>
            </Grid.Col>
          </Grid>

          {/* Status */}
          <NativeSelect
            withAsterisk
            label="Status do projeto"
            key={form.key('activity_status')}
            {...form.getInputProps('activity_status')}
          >
            <option value="">Selecione</option>
            <option value="1">Em atividade</option>
            <option value="2">Encerrado</option>
            <option value="3">Ativo de vez em quando</option>
            <option value="4">Sazonal / de temporada</option>
            <option value="5">Ainda em construção</option>
            <option value="6">Em hiato</option>
          </NativeSelect>

          {/* Anos */}
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
                label="Ano de encerramento"
                min={form.getValues().foundation_year}
                max={currentYear}
                disabled={activityStatus !== '2'}
                key={form.key('end_year')}
                {...form.getInputProps('end_year')}
              />
            </Grid.Col>
          </Grid>

          {/* Localização */}
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
                {regions.map(r => (
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
                  onClick={() => { if (regionId) openCityModal() }}
                />
              </Input.Wrapper>
            </Grid.Col>
          </Grid>

          {/* Bio */}
          <Textarea
            label="Bio"
            placeholder="Conte um pouco sobre o projeto (opcional)"
            maxLength={220}
            description={`${form.getValues().description?.length ?? 0}/220`}
            autosize
            minRows={3}
            key={form.key('description')}
            {...form.getInputProps('description')}
          />

          {/* Função principal */}
          <NativeSelect
            withAsterisk
            label="Sua principal função no projeto"
            description="Você será atribuído como Administrador e Fundador"
            data={[
              { label: 'Selecione', value: '' },
              { group: 'Gestão, produção e outros', items: rolesManagement },
              { group: 'Instrumentos', items: rolesMusicians },
            ]}
            key={form.key('main_role_id')}
            {...form.getInputProps('main_role_id')}
          />

          {/* Visibilidade */}
          <Radio.Group
            label="Visibilidade"
            description="Exibir o projeto nas buscas do Mublin?"
            key={form.key('is_public')}
            {...form.getInputProps('is_public')}
          >
            <Group mt="xs">
              <Radio color="indigo" value="1" label="Público" />
              <Radio color="indigo" value="0" label="Privado" />
            </Group>
          </Radio.Group>

          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" color="gray" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              color="indigo"
              loading={isSubmitting}
              disabled={slugChecking || slugAvailable === false || slugValue.length < 2 || !nameValue}
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
            <Text size="xs" c="dimmed">Nenhuma cidade encontrada neste Estado.</Text>
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
