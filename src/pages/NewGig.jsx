import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { fetchAllRoles } from '../queries/roles'
import { useMediaQuery } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  Container,
  Grid,
  Flex,
  Group,
  Loader,
  Divider,
  Avatar,
  Box,
  Stack,
  Combobox,
  InputBase,
  useCombobox,
  Select,
  TextInput,
  Textarea,
  Switch,
  Title,
  Text,
  Button,
  Image,
  ActionIcon,
} from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import {
  IconSend,
  IconChevronDown,
  IconX,
  IconMapPin,
  IconClock,
  IconCalendar,
} from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,w-200,c-maintain_ratio/users/avatars/'
const PROJECT_IMAGE_PATH = 'https://ik.imagekit.io/mublin/projects/'

// ── Project Option (custom render inside Combobox) ────────────────────────────
function ProjectOption({ project, selected }) {
  const imageUrl = project.picture
    ? `${PROJECT_IMAGE_PATH}${project.id}/tr:h-80/${project.picture}`
    : undefined

  const location = [project.cities?.name, project.cities?.regions?.name]
    .filter(Boolean)
    .join(', ')

  return (
    <Flex align="center" gap="sm" py={4}>
      <Avatar src={imageUrl} size={40} radius="sm" alt={project.name}>
        {project.name?.[0]}
      </Avatar>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={500} lineClamp={1}>
          {project.name}
        </Text>
        <Text size="xs" c="dimmed" lineClamp={1}>
          {[project.project_types?.name_ptbr, project.genres?.name]
            .filter(Boolean)
            .join(' · ')}
          {location && ` — ${location}`}
        </Text>
      </Box>
    </Flex>
  )
}

export default function NewGig() {
  const { user } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 48em)')

  // ── Local States ──────────────────────────────────────
  const [projectSearch, setProjectSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasRemuneration, setHasRemuneration] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  // ── Queries ───────────────────────────────────────────
  const { data: userProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchAllRoles,
    staleTime: 1000 * 60 * 30,
  })

  const filteredProjects = userProjects.filter((item) =>
    !projectSearch?.trim()
      ? true
      : item.projects?.name.toLowerCase().includes(projectSearch.trim().toLowerCase()),
  )

  // ── Form Management ────────────────────────────────────
  const formNewGig = useForm({
    initialValues: {
      project_id: '',
      title: '',
      slug: '',
      description: '',
      date: '',
      time_stage_start: '',
      time_stage_end: '',
      stage_name: 'Palco Principal',
      has_remuneration: false,
      is_recurring: false,
      recurrence_rule: '',
      venue_name: '',
      venue_address: '',
      event_id: '',
      dress_code_id: '',
      iteration_id: '',
      hiring_notes: '',
      hiring_confirmed: false,
    },
    validate: {
      title: (v) => (v.length < 2 ? 'Mínimo de 2 caracteres' : null),
      project_id: (v) => (!v ? 'Selecione um projeto' : null),
    },
  })

  // ── Handlers ───────────────────────────────────────────
  function handleSelectProject(item) {
    const project = item.projects
    setSelectedProject(project)
    formNewGig.setFieldValue('project_id', String(project.id))
    setProjectSearch(project.name)
    combobox.closeDropdown()
  }

  function handleClearProject() {
    setSelectedProject(null)
    formNewGig.setFieldValue('project_id', '')
    setProjectSearch('')
  }

  async function handleSubmit(values) {
    setIsSubmitting(true)
    try {
      // TODO: integrar com Supabase
      console.log('Submitting gig:', values)
      notifications.show({
        title: 'Gig criada!',
        message: 'A gig foi cadastrada com sucesso.',
        color: 'green',
      })
    } catch (err) {
      notifications.show({
        title: 'Erro ao criar gig',
        message: 'Tente novamente em instantes.',
        color: 'red',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Project Combobox options ──────────────────────────
  const projectOptions = filteredProjects.map((item) => (
    <Combobox.Option value={String(item.projects?.id)} key={item.projects?.id}>
      <ProjectOption
        project={item.projects}
        selected={selectedProject?.id === item.projects?.id}
      />
    </Combobox.Option>
  ))

  return (
    <>
      <Helmet>
        <title>Cadastrar gig · Mublin</title>
        <link rel="canonical" href="https://mublin.com/new/gig" />
      </Helmet>
      <Container size="sm" py="md" px={{ base: 'md', sm: 'lg' }}>
        <Title order={1} fz="h3" fw={600} mb="lg">
          Cadastrar nova gig
        </Title>
        <form onSubmit={formNewGig.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* ── Projeto ─────────────────────────────────────── */}

            <Combobox
              store={combobox}
              onOptionSubmit={(val) => {
                const item = userProjects.find((p) => String(p.projects?.id) === val)
                if (item) {
                  handleSelectProject(item)
                }
              }}
            >
              <Combobox.Target>
                <InputBase
                  label="Projeto"
                  withAsterisk
                  rightSection={
                    selectedProject ? (
                      <ActionIcon
                        size="sm"
                        variant="transparent"
                        color="gray"
                        onClick={handleClearProject}
                        aria-label="Limpar projeto"
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    ) : loadingProjects ? (
                      <Loader size="xs" />
                    ) : (
                      <Combobox.Chevron />
                    )
                  }
                  rightSectionPointerEvents={selectedProject ? 'all' : 'none'}
                  value={projectSearch}
                  placeholder="Buscar projeto..."
                  onChange={(e) => {
                    setProjectSearch(e.currentTarget.value)
                    if (selectedProject) {
                      handleClearProject()
                    }
                    combobox.openDropdown()
                    combobox.updateSelectedOptionIndex()
                  }}
                  onClick={() => combobox.openDropdown()}
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                  error={formNewGig.errors.project_id}
                />
              </Combobox.Target>

              <Combobox.Dropdown>
                <Combobox.Options>
                  {loadingProjects ? (
                    <Combobox.Empty>
                      <Loader size="xs" />
                    </Combobox.Empty>
                  ) : projectOptions.length === 0 ? (
                    <Combobox.Empty>Nenhum projeto encontrado</Combobox.Empty>
                  ) : (
                    projectOptions
                  )}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>

            {/* ── Informações básicas ──────────────────────────── */}
            <Divider label="Informações básicas" labelPosition="center" mt="xs" />

            <TextInput
              withAsterisk
              label="Título"
              placeholder="Ex: Show de lançamento"
              {...formNewGig.getInputProps('title')}
            />

            <Textarea
              label="Descrição"
              placeholder="Informações sobre a gig..."
              minRows={2}
              autosize
              maxRows={5}
              {...formNewGig.getInputProps('description')}
            />

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Tipo de evento"
                  placeholder="Selecione..."
                  data={[
                    { value: '1', label: 'Show' },
                    { value: '2', label: 'Ensaio' },
                    { value: '3', label: 'Gravação' },
                    { value: '4', label: 'Festival' },
                    { value: '5', label: 'Evento corporativo' },
                  ]}
                  key={formNewGig.key('event_type')}
                  {...formNewGig.getInputProps('event_type')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Iteração / Edição"
                  placeholder="Opcional"
                  data={[
                    { value: '1', label: '1ª edição' },
                    { value: '2', label: '2ª edição' },
                    { value: '3', label: '3ª edição' },
                  ]}
                  key={formNewGig.key('iteration_id')}
                  {...formNewGig.getInputProps('iteration_id')}
                />
              </Grid.Col>
            </Grid>

            {/* ── Data e horário ───────────────────────────────── */}
            <Divider label="Data e horário" labelPosition="center" mt="xs" />

            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  type="date"
                  label="Data"
                  leftSection={<IconCalendar size={16} />}
                  key={formNewGig.key('date')}
                  {...formNewGig.getInputProps('date')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 4 }}>
                <TimeInput
                  label="Início no palco"
                  leftSection={<IconClock size={16} />}
                  key={formNewGig.key('time_stage_start')}
                  {...formNewGig.getInputProps('time_stage_start')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, md: 4 }}>
                <TimeInput
                  label="Fim no palco"
                  leftSection={<IconClock size={16} />}
                  key={formNewGig.key('time_stage_end')}
                  {...formNewGig.getInputProps('time_stage_end')}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Nome do palco"
                  placeholder="Ex: Palco Principal"
                  {...formNewGig.getInputProps('stage_name')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Dress code"
                  placeholder="Selecione..."
                  data={[
                    { value: '10', label: 'Sem definição' },
                    { value: '1', label: 'Casual' },
                    { value: '2', label: 'Esporte fino' },
                    { value: '3', label: 'Social' },
                    { value: '4', label: 'Black tie' },
                  ]}
                  key={formNewGig.key('dress_code_id')}
                  {...formNewGig.getInputProps('dress_code_id')}
                />
              </Grid.Col>
            </Grid>

            {/* ── Recorrência ──────────────────────────────────── */}
            <Switch
              label="Gig recorrente"
              description="Marque se esta gig se repete periodicamente"
              checked={isRecurring}
              onChange={(e) => {
                setIsRecurring(e.currentTarget.checked)
                formNewGig.setFieldValue('is_recurring', e.currentTarget.checked)
              }}
            />
            {isRecurring && (
              <Select
                label="Regra de recorrência"
                placeholder="Selecione a frequência..."
                data={[
                  { value: 'FREQ=WEEKLY', label: 'Semanal' },
                  { value: 'FREQ=BIWEEKLY', label: 'Quinzenal' },
                  { value: 'FREQ=MONTHLY', label: 'Mensal' },
                ]}
                key={formNewGig.key('recurrence_rule')}
                {...formNewGig.getInputProps('recurrence_rule')}
              />
            )}

            {/* ── Local ────────────────────────────────────────── */}
            <Divider label="Local" labelPosition="center" mt="xs" />

            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Nome do local / venue"
                  placeholder="Ex: Audio Club"
                  leftSection={<IconMapPin size={16} />}
                  {...formNewGig.getInputProps('venue_name')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Endereço"
                  placeholder="Rua, número..."
                  {...formNewGig.getInputProps('venue_address')}
                />
              </Grid.Col>
            </Grid>

            {/* ── Remuneração ──────────────────────────────────── */}
            <Divider label="Remuneração e contratação" labelPosition="center" mt="xs" />

            <Switch
              label="Esta gig tem remuneração"
              checked={hasRemuneration}
              onChange={(e) => {
                setHasRemuneration(e.currentTarget.checked)
                formNewGig.setFieldValue('has_remuneration', e.currentTarget.checked)
              }}
            />

            <Textarea
              label="Notas sobre a contratação"
              placeholder="Informações adicionais sobre a contratação, cachê, etc..."
              minRows={2}
              autosize
              maxRows={4}
              {...formNewGig.getInputProps('hiring_notes')}
            />

            <Switch
              label="Contratação confirmada"
              description="Marque se a gig já está contratada / confirmada"
              key={formNewGig.key('hiring_confirmed')}
              {...formNewGig.getInputProps('hiring_confirmed', { type: 'checkbox' })}
            />

            {/* ── Ações ────────────────────────────────────────── */}
            <Group justify="flex-end" mt="sm">
              <Button
                type="submit"
                size="sm"
                leftSection={<IconSend size={15} />}
                loading={isSubmitting}
              >
                Criar gig
              </Button>
            </Group>
          </Stack>
        </form>
      </Container>
    </>
  )
}
