import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { fetchAllRoles } from '../queries/roles'
import { fetchEventTypes, fetchDressCodeTypes } from '../queries/events'
import { searchEvents, searchProfiles } from '../queries/search'
import { supabase } from '../lib/supabaseClient'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import GigRoleCombobox from '../components/gigs/GigRoleCombobox'
import ProjectSelector from '../components/gigs/ProjectSelector'
import VenueSelector from '../components/gigs/VenueSelector'
import SetlistManager from '../components/setlist/SetlistManager'
import { useDebouncedCallback } from '@mantine/hooks'
import { TimeInput } from '@mantine/dates'
import { getDateSuggestions } from '../utils/dates'
// prettier-ignore
import {
  useCombobox,
  Container, Collapse,
  Grid, Group, ScrollArea,
  Box, Stack, Divider, Card, Paper,
  Alert, Badge, Avatar,
  CloseButton, InputBase,
  Select, TextInput, NumberInput,
  Title, Text, Textarea,
  Combobox, Checkbox,
  Button, ActionIcon,
} from '@mantine/core'
// prettier-ignore
import {
  IconPlus, IconTrash,
  IconSend, IconCalendar, IconClock,
  IconMapPin, IconShirt,
  IconMicrophone2,
  IconCheck, IconLock,
  IconChevronRightFilled,
  IconExclamationCircle,
  IconHistory,
  IconMinus,
  IconChevronCompactDown,
  IconChevronUp,
  IconChevronDown,
  IconX,
} from '@tabler/icons-react'

function slugify(text) {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function generateGigSlug(title) {
  const base = slugify(title) || 'gig'
  const suffix = Math.random().toString(36).slice(2, 8)
  return `${base}-${suffix}`
}

const PROJECT_IMAGE_PATH = 'https://ik.imagekit.io/mublin/projects/'

function StepPlaceholder({ number, title, id }) {
  return (
    <Paper
      id={id}
      withBorder
      p="md"
      radius="md"
      opacity={0.6}
      style={{ borderStyle: 'dashed' }}
    >
      <Group>
        <Badge size="xl" variant="filled" color="gray">
          Passo {number}
        </Badge>
        <Title order={4} c="dimmed" className="cursorDefault">
          {title}
        </Title>
      </Group>
    </Paper>
  )
}

const UPCOMING_STEPS = [
  { number: 2, title: 'Detalhes da gig', id: 'gig-details-placeholder' },
  { number: 3, title: 'Vagas para a gig', id: 'gig-roles-placeholder' },
  { number: 4, title: 'Repertório / Setlist', id: 'gig-setlist-placeholder' },
]

function EventCombobox({ selected, onSelect, onClear, isPastGig }) {
  const combobox = useCombobox()
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const fetch = useDebouncedCallback(async (val) => {
    if (val.length < 2) {
      return
    }
    const data = await searchEvents(val)
    setResults(data)
    combobox.openDropdown()
  }, 400)
  if (selected) {
    return (
      <Group gap="xs">
        <Text size="md" fw={600}>
          Evento: {selected.name}
        </Text>
        <CloseButton size="sm" onClick={onClear} />
      </Group>
    )
  }
  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        const item = results.find((r) => String(r.id) === val)
        if (item) {
          onSelect(item)
          setValue('')
          setResults([])
        }
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target>
        <InputBase
          label={
            isPastGig ? 'Foi em um evento (opcional)' : 'Será em um evento (opcional)'
          }
          placeholder="Digite o nome do evento..."
          value={value}
          onChange={(e) => {
            setValue(e.currentTarget.value)
            fetch(e.currentTarget.value)
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {results.map((i) => (
            <Combobox.Option key={i.id} value={String(i.id)}>
              {i.name}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

function SubForCombobox({ onSelect, selected }) {
  const combobox = useCombobox()
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const fetch = useDebouncedCallback(async (val) => {
    if (val.length < 2) {
      return
    }
    const data = await searchProfiles(val)
    setResults(data)
    combobox.openDropdown()
  }, 400)
  if (selected) {
    return (
      <Group gap="xs" mt="xs">
        <Avatar
          size="sm"
          src={
            selected.avatar
              ? `https://ik.imagekit.io/mublin/users/avatars/tr:h-60,w-60/${selected.avatar}`
              : null
          }
        />
        <Text size="sm">@{selected.username}</Text>
        <CloseButton size="xs" onClick={() => onSelect(null)} />
      </Group>
    )
  }
  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        const item = results.find((r) => r.id === val)
        if (item) {
          onSelect(item)
          setValue('')
          setResults([])
        }
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target>
        <InputBase
          placeholder="Buscar @username..."
          value={value}
          onChange={(e) => {
            setValue(e.currentTarget.value)
            fetch(e.currentTarget.value)
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {results.map((i) => (
            <Combobox.Option key={i.id} value={i.id}>
              @{i.username} - {i.full_name}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

export default function NewGig() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedProject, setSelectedProject] = useState(null)
  const [step, setStep] = useState(1) // 1 = projeto, 2 = detalhes, 3 = vagas, 4 = repertório
  const [selectedSetlistId, setSelectedSetlistId] = useState(null)
  const [isTitleManuallyEdited, setIsTitleManuallyEdited] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [projectSearch, setProjectSearch] = useState('')
  const [showManualVenue, setShowManualVenue] = useState(false)
  const [expandedRoleDetails, setExpandedRoleDetails] = useState([])

  const [gigRoles, setGigRoles] = useState([
    {
      tempId: Date.now(),
      role_id: null,
      description: '',
      fee: null,
      fee_not_informed: false,
      experience_level: 2,
      assigned: null,
      is_sub: false,
      sub_for_profile: null,
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: userProjects = [], isLoading: loadingUserProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
  })

  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: fetchAllRoles })

  const { data: eventTypes = [] } = useQuery({
    queryKey: ['event-types'],
    queryFn: fetchEventTypes,
  })
  const { data: dressCodeTypes = [] } = useQuery({
    queryKey: ['dress_code_types'],
    queryFn: fetchDressCodeTypes,
  })

  const getGigTitleSuggestion = (eventTypeId, projectName) => {
    if (!projectName) {
      return ''
    }
    const type = eventTypes.find((t) => String(t.id) === String(eventTypeId))
    const typeName = type?.name_ptbr || type?.name_en || 'Gig'

    // templates mais naturais em PT-BR
    const templates = {
      1: `Ensaio de ${projectName}`, // Ensaio
      2: `Show de ${projectName}`, // Show
      3: `Apresentação de ${projectName}`, // Apresentação
      4: `Gravação com ${projectName}`, // Gravação
    }

    // se não tiver template específico, usa "Tipo + de Projeto"
    return templates[String(eventTypeId)] || `${typeName} de ${projectName}`
  }

  const form = useForm({
    initialValues: {
      project_id: '',
      title: '',
      description: '',
      event_type_id: '1',
      dress_code_id: '11',
      event_id: '',
      venue_id: '',
      date: '',
      time_stage_start: '',
      time_stage_end: '',
      venue_name: '',
      venue_address: '',
      stage_name: '',
    },
    validate: {
      title: (value) => (value.trim().length < 2 ? 'Informe um título para a gig' : null),
      date: (value) => (!value ? 'Informe a data' : null),
      time_stage_start: (value) => (!value ? 'Informe o horário de início' : null),
    },
  })

  const isPastGig = useMemo(() => {
    if (!form.values.date) {
      return false
    }

    const selectedDate = new Date(`${form.values.date}T00:00:00`)
    const today = new Date()

    today.setHours(0, 0, 0, 0)

    return selectedDate < today
  }, [form.values.date])

  const filteredProjects = userProjects.filter(
    (item) =>
      item.projects?.id != null &&
      (!projectSearch.trim() ||
        item.projects?.name.toLowerCase().includes(projectSearch.toLowerCase())),
  )

  function handleSelectProject(project) {
    setSelectedProject(project)
    setStep(2)
    form.setFieldValue('project_id', String(project.id))

    if (!isTitleManuallyEdited || !form.values.title) {
      const suggestion = getGigTitleSuggestion(form.values.event_type_id, project.name)
      form.setFieldValue('title', suggestion)
    }
  }

  function toggleRoleDetails(tempId) {
    setExpandedRoleDetails((current) =>
      current.includes(tempId)
        ? current.filter((id) => id !== tempId)
        : [...current, tempId],
    )
  }

  const handleBack = () => {
    setProjectSearch('')
    setSelectedProject(null)
    setStep(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleContinueToRoles = () => {
    const validation = form.validate()

    if (validation.hasErrors) {
      return
    }

    setStep(3)
  }

  const handleContinueToSetlist = () => {
    setStep(4)
  }

  function handleSelectEvent(ev) {
    setSelectedEvent(ev)
    // ev.venue não traz "id" (só dados pra exibição) — então não dá pra vincular
    // via venue_id aqui. O VenueCombobox fica oculto e o local do evento é só exibido
    // como leitura (ver JSX abaixo), sem popular selectedVenue/venue_id.
    setSelectedVenue(null)
    setShowManualVenue(false)

    if (ev.date_start) {
      form.setFieldValue('date', ev.date_start) // já vem em "YYYY-MM-DD"
    }
    if (ev.time_event_start) {
      form.setFieldValue('time_stage_start', ev.time_event_start.slice(0, 5)) // "HH:MM:SS" -> "HH:MM"
    }
    form.setFieldValue('time_stage_end', '')
  }

  function addRole() {
    setGigRoles([
      ...gigRoles,
      {
        tempId: Date.now(),
        role_id: null,
        description: '',
        fee: null,
        fee_not_informed: false,
        experience_level: 2,
        assigned: null,
        is_sub: false,
        sub_for_profile: null,
      },
    ])
  }
  function updateRole(tempId, patch) {
    setGigRoles(gigRoles.map((r) => (r.tempId === tempId ? { ...r, ...patch } : r)))
  }
  function removeRole(tempId) {
    setGigRoles(gigRoles.filter((r) => r.tempId !== tempId))
  }

  async function handleSubmit(values) {
    setIsSubmitting(true)
    try {
      const { data: gig, error } = await supabase
        .from('gigs')
        .insert({
          title: values.title,
          slug: generateGigSlug(values.title),
          description: values.description,
          stage_name: values.stage_name || null,
          project_id: values.project_id ? Number(values.project_id) : null,
          event_type: values.event_type_id ? Number(values.event_type_id) : 1,
          dress_code_id: values.dress_code_id ? Number(values.dress_code_id) : null,
          event_id: selectedEvent?.id || null,
          venue_id: selectedVenue?.id || null,
          date: values.date || null,
          time_stage_start: values.time_stage_start || null,
          time_stage_end: values.time_stage_end || null,
          venue_name: selectedVenue ? null : values.venue_name,
          venue_address: selectedVenue ? null : values.venue_address,
          setlist_id: selectedSetlistId || null,
          created_by: user.id,
        })
        .select()
        .single()
      if (error) {
        throw error
      }

      const normalized = gigRoles.map((r) => ({
        gig_id: gig.id,
        role_id: r.role_id,
        description: r.description,
        fee: r.fee_not_informed ? null : r.fee ? Number(r.fee) : null,
        experience_level: r.experience_level,
        is_sub: r.is_sub,
        sub_for: r.is_sub ? r.sub_for_profile?.id || null : null,
      }))
      const { error: rolesError } = await supabase.from('gig_roles').insert(normalized)
      if (rolesError) {
        throw rolesError
      }
      notifications.show({ title: 'Gig criada!', color: 'green' })
      navigate('/gigs')
    } catch (e) {
      notifications.show({
        title: 'Erro',
        message: e.message,
        color: 'red',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const groupedRolesData = useMemo(() => {
    const management = []
    const instruments = []
    const other = []

    roles
      .filter((r) => r.applies_to_a_project)
      .forEach((r) => {
        const item = { value: String(r.id), label: r.description_ptbr || r.name_en }
        const cat = (r.category || r.type || '').toLowerCase()
        if (cat.includes('manag') || cat.includes('prod') || cat.includes('gest')) {
          management.push(item)
        } else if (cat.includes('music') || cat.includes('instr')) {
          instruments.push(item)
        } else {
          const name = (r.name_ptbr || '').toLowerCase()
          if (
            [
              'produtor',
              'técnico',
              'manager',
              'roadie',
              'iluminação',
              'som',
              'staff',
            ].some((k) => name.includes(k))
          ) {
            management.push(item)
          } else {
            instruments.push(item)
          }
        }
      })

    const groups = []
    if (management.length) {
      groups.push({ group: 'Gestão, produção e outros', items: management })
    }
    if (instruments.length) {
      groups.push({ group: 'Instrumentos', items: instruments })
    }
    if (other.length) {
      groups.push({ group: 'Outros', items: other })
    }
    return groups.length
      ? groups
      : roles
          .filter((r) => r?.id != null)
          .map((r) => ({ value: String(r.id), label: r.name_ptbr || r.name_en }))
  }, [roles])

  useEffect(() => {
    if (!selectedProject || isTitleManuallyEdited) {
      return
    }
    const suggestion = getGigTitleSuggestion(
      form.values.event_type_id,
      selectedProject.name,
    )

    if (
      !form.values.title ||
      form.values.title.startsWith('Ensaio de ') ||
      form.values.title.startsWith('Show de ') ||
      form.values.title.includes(` de ${selectedProject.name}`) ||
      form.values.title.includes(` com ${selectedProject.name}`)
    ) {
      form.setFieldValue('title', suggestion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.event_type_id, selectedProject])

  return (
    <>
      <Helmet>
        <title>Cadastrar gig · Mublin</title>
      </Helmet>
      <Container size="sm" py="md">
        <Title order={3} mb="md">
          Cadastrar nova gig
        </Title>

        {/* PASSO 1 */}
        <Paper withBorder p="md" radius="md" mb="md">
          <Group justify="space-between" mb="xs">
            <Badge
              size="xl"
              variant="filled"
              color={step === 1 ? 'mublinColor' : 'green'}
              rightSection={step > 1 && <IconCheck size={18} />}
            >
              Passo 1
            </Badge>
            {selectedProject && step > 1 && (
              <Button variant="subtle" size="xs" icon onClick={handleBack}>
                Trocar projeto
              </Button>
            )}
          </Group>

          <Stack gap={1} mt={4} mb="xs">
            <Title order={4}>Qual projeto realizará esta gig?</Title>
            <Group gap={4} wrap="nowrap">
              <IconLock color="gray" size={15} />
              <Text size="xs" c="dimmed">
                Exibindo projetos que sou administrador ou staff
              </Text>
            </Group>
          </Stack>

          {step === 1 ? (
            <Stack gap="xs">
              <ProjectSelector
                loadingProjects={loadingUserProjects}
                projects={filteredProjects.map((fp) => fp.projects)}
                selectedProject={selectedProject}
                onSelectProject={handleSelectProject}
              />
              {/* <Button
                size="xs"
                variant="subtle"
                w="fit-content"
                rightSection={<IconChevronRightFilled size={14} />}
              >
                Cadastrar novo
              </Button> */}
            </Stack>
          ) : (
            <Group gap="sm">
              <Avatar
                src={
                  selectedProject?.picture
                    ? `${PROJECT_IMAGE_PATH}/${selectedProject.id}/${
                        selectedProject.picture
                      }`
                    : undefined
                }
                size={42}
                radius="xl"
              />
              <Box>
                <Text fw={600}>{selectedProject?.name}</Text>
                <Text size="xs" c="dimmed">
                  @{selectedProject?.slug} · {selectedProject?.project_types?.name_ptbr}
                </Text>
              </Box>
              {selectedProject?.end_year && (
                <Alert
                  icon={<IconExclamationCircle color="red" />}
                  variant="light"
                  title="Atenção!"
                  color="gray"
                  p="xs"
                >
                  Este projeto foi encerrado em {selectedProject?.end_year}. Antes de
                  continuar o cadastro, vale a pena confirmar a viabilidade real desta
                  gig.
                </Alert>
              )}
            </Group>
          )}
        </Paper>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Collapse expanded={step >= 2}>
            <Paper id="gig-details" withBorder p="md" radius="md" mb="md">
              <Group justify="space-between" mb="xs">
                <Badge
                  size="xl"
                  variant="filled"
                  color={step === 2 ? 'mublinColor' : 'green'}
                  rightSection={step === 3 && <IconCheck size={18} />}
                >
                  Passo 2
                </Badge>
                {step >= 3 && (
                  <Button variant="subtle" size="xs" onClick={() => setStep(2)}>
                    Editar detalhes
                  </Button>
                )}
              </Group>
              <Title order={4}>Detalhes da gig</Title>
              {step === 2 && (
                <Stack gap="sm" mt="md">
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select
                        key={`gig-type-${eventTypes.length}`}
                        label="Tipo da gig"
                        leftSection={<IconMicrophone2 size={14} />}
                        data={eventTypes
                          .filter((et) => et?.id != null)
                          .map((et) => ({ value: String(et.id), label: et.name }))}
                        value={form.values.event_type_id}
                        onChange={(v) => form.setFieldValue('event_type_id', v)}
                        // withScrollArea={false}
                        // styles={{ dropdown: { maxHeight: 200, overflowY: 'auto' } }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Select
                        label="Dress code"
                        placeholder="Opcional"
                        leftSection={<IconShirt size={14} />}
                        data={dressCodeTypes.map((d) => ({
                          value: String(d.id),
                          label: d.name,
                        }))}
                        value={form.values.dress_code_id}
                        onChange={(v) => form.setFieldValue('dress_code_id', v)}
                      />
                    </Grid.Col>
                  </Grid>

                  <TextInput label="Título da gig" {...form.getInputProps('title')} />
                  <Textarea
                    label="Descrição"
                    autosize
                    minRows={2}
                    {...form.getInputProps('description')}
                  />

                  <Divider label="Data e local" />

                  <EventCombobox
                    selected={selectedEvent}
                    isPastGig={isPastGig}
                    onSelect={handleSelectEvent}
                    onClear={() => {
                      setSelectedEvent(null)
                      setSelectedVenue(null)
                    }}
                  />

                  {!selectedEvent && (
                    <ScrollArea type="never" scrollbarSize={0} offsetScrollbars>
                      <Group gap="xs" wrap="nowrap" py={4}>
                        {getDateSuggestions().map((suggestion) => (
                          <Button
                            key={suggestion.label}
                            size="xs"
                            variant={
                              form.values.date === suggestion.value ? 'light' : 'default'
                            }
                            onClick={() => {
                              form.setFieldValue('date', suggestion.value)

                              if (suggestion.label === 'Hoje') {
                                const now = new Date()
                                now.setHours(now.getHours() + 1)

                                const hours = String(now.getHours()).padStart(2, '0')
                                const minutes = String(now.getMinutes()).padStart(2, '0')
                                const startTime = `${hours}:${minutes}`

                                const end = new Date(now)
                                end.setHours(end.getHours() + 2)

                                const endHours = String(end.getHours()).padStart(2, '0')
                                const endMinutes = String(end.getMinutes()).padStart(
                                  2,
                                  '0',
                                )
                                const endTime = `${endHours}:${endMinutes}`

                                form.setFieldValue('time_stage_start', startTime)
                                form.setFieldValue('time_stage_end', endTime)
                              } else {
                                form.setFieldValue('time_stage_start', '15:00')
                                form.setFieldValue('time_stage_end', '17:00')
                              }
                            }}
                            style={{ flexShrink: 0 }}
                          >
                            {suggestion.label}
                          </Button>
                        ))}
                      </Group>
                    </ScrollArea>
                  )}

                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        type="date"
                        label="Data"
                        leftSection={<IconCalendar size={16} />}
                        {...form.getInputProps('date')}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 6, sm: 4 }}>
                      <TimeInput
                        label="Início"
                        leftSection={<IconClock size={16} />}
                        {...form.getInputProps('time_stage_start')}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 6, sm: 4 }}>
                      <TimeInput
                        label="Fim"
                        leftSection={<IconClock size={16} />}
                        {...form.getInputProps('time_stage_end')}
                      />
                    </Grid.Col>
                  </Grid>

                  {isPastGig && (
                    <Alert
                      icon={<IconHistory size={18} />}
                      title="Gig passada"
                      color="teal"
                      variant="light"
                      p="xs"
                    >
                      Você está cadastrando uma gig que já aconteceu. Ela será registrada
                      no histórico do projeto normalmente.
                    </Alert>
                  )}

                  {selectedEvent && (
                    <TextInput
                      label="Nome do palco"
                      description="Palco ou local onde será a gig no evento"
                      placeholder="Ex: Palco Principal"
                      {...form.getInputProps('stage_name')}
                    />
                  )}

                  {selectedEvent?.venue && (
                    <Group gap={6}>
                      <IconMapPin size={14} />
                      <Text size="sm" c="dimmed">
                        {selectedEvent.venue.name}
                        {selectedEvent.venue.city?.name &&
                          ` — ${selectedEvent.venue.city.name}/${selectedEvent.venue.city.region?.uf || ''}`}
                      </Text>
                    </Group>
                  )}

                  {!selectedEvent && (
                    <VenueSelector
                      selected={selectedVenue}
                      relatedProject={selectedProject}
                      relatedProjectId={selectedProject?.id}
                      onSelect={(venue) => {
                        setSelectedVenue(venue)
                        setShowManualVenue(false)
                      }}
                      onClear={() => {
                        setSelectedVenue(null)
                      }}
                      onSelectManual={(venue) => {
                        setSelectedVenue(null)
                        setShowManualVenue(true)
                        form.setValues({
                          venue_name: venue.name || '',
                          venue_address: venue.address || '',
                          venue_city_id: venue.city_id || null,
                        })
                      }}
                    />
                  )}

                  {!selectedVenue && !selectedEvent && (
                    <Checkbox
                      label="Não encontrei o local, preencher manualmente"
                      checked={showManualVenue}
                      onChange={(e) => setShowManualVenue(e.currentTarget.checked)}
                      mt="xs"
                    />
                  )}

                  {showManualVenue && !selectedVenue && !selectedEvent && (
                    <Grid>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Nome do local (caso não encontrado acima)"
                          placeholder="Ex: Estúdio do Seu Zé"
                          {...form.getInputProps('venue_name')}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Endereço"
                          placeholder="Rua, bairro, cidade"
                          {...form.getInputProps('venue_address')}
                        />
                      </Grid.Col>
                    </Grid>
                  )}

                  {step === 2 && (
                    <Group justify="flex-end" mt="md">
                      <Button
                        rightSection={<IconChevronRightFilled size={14} />}
                        onClick={handleContinueToRoles}
                      >
                        Continuar
                      </Button>
                    </Group>
                  )}
                </Stack>
              )}
            </Paper>
          </Collapse>

          <Collapse expanded={step >= 3}>
            <Paper id="gig-roles" withBorder p="md" radius="md" mb="md">
              <Group justify="space-between" mb="xs">
                <Badge
                  size="xl"
                  variant="filled"
                  color={step === 3 ? 'mublinColor' : 'green'}
                  rightSection={step === 4 && <IconCheck size={18} />}
                >
                  Passo 3
                </Badge>
                {step === 4 && (
                  <Button variant="subtle" size="xs" onClick={() => setStep(3)}>
                    Editar vagas
                  </Button>
                )}
              </Group>
              <Title order={4}>
                Vagas para a gig ({gigRoles.filter((role) => role.role_id).length})
              </Title>
              {step > 3 && (
                <Text size="xs" mt="xs">
                  {gigRoles
                    ?.map(
                      (gigRole) =>
                        roles?.find((role) => role.id === gigRole.role_id)
                          ?.description_ptbr,
                    )
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              )}
              {step === 3 && (
                <Stack gap="xs" mt="md">
                  <Stack gap="xs">
                    {gigRoles.map((gr) => {
                      const detailsOpened = expandedRoleDetails.includes(gr.tempId)

                      return (
                        <Paper key={gr.tempId} p="sm" withBorder radius="md">
                          <Grid>
                            <Grid.Col span={{ base: 12, sm: 8 }}>
                              <Select
                                label="Atividade"
                                placeholder="Selecione..."
                                data={groupedRolesData}
                                value={gr.role_id ? String(gr.role_id) : null}
                                onChange={(v) =>
                                  updateRole(gr.tempId, {
                                    role_id: v ? Number(v) : null,
                                  })
                                }
                                searchable
                                comboboxProps={{ withinPortal: true }}
                              />
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, sm: 4 }}>
                              <Select
                                label="Nível"
                                data={[
                                  { value: '1', label: 'Iniciante' },
                                  { value: '2', label: 'Intermediário' },
                                  { value: '3', label: 'Avançado' },
                                ]}
                                value={String(gr.experience_level)}
                                onChange={(v) =>
                                  updateRole(gr.tempId, {
                                    experience_level: Number(v),
                                  })
                                }
                              />
                            </Grid.Col>
                          </Grid>

                          {gr.role_id && (
                            <Button
                              variant="subtle"
                              size="xs"
                              mt="sm"
                              onClick={() => toggleRoleDetails(gr.tempId)}
                              leftSection={
                                detailsOpened ? (
                                  <IconChevronUp size={16} />
                                ) : (
                                  <IconChevronDown size={16} />
                                )
                              }
                            >
                              {detailsOpened ? 'Ocultar detalhes' : 'Mais detalhes'}
                            </Button>
                          )}

                          <Collapse expanded={detailsOpened}>
                            <Card
                              withBorder
                              mt="sm"
                              shadow="xs"
                              bg="light-dark(#f5f5f5, #171717)"
                            >
                              <Stack gap="sm">
                                {/* CACHÊ */}
                                <Box>
                                  <NumberInput
                                    label="Cachê"
                                    placeholder="R$ 0,00"
                                    min={0}
                                    decimalScale={2}
                                    fixedDecimalScale
                                    thousandSeparator="."
                                    decimalSeparator=","
                                    prefix="R$ "
                                    value={gr.fee}
                                    onChange={(v) => updateRole(gr.tempId, { fee: v })}
                                    disabled={gr.fee_not_informed}
                                  />

                                  <Checkbox
                                    mt={6}
                                    size="xs"
                                    label="Não informado"
                                    checked={gr.fee_not_informed}
                                    onChange={(e) =>
                                      updateRole(gr.tempId, {
                                        fee_not_informed: e.currentTarget.checked,
                                        fee: e.currentTarget.checked ? null : gr.fee,
                                      })
                                    }
                                  />
                                </Box>

                                {/* DESCRIÇÃO */}
                                <Textarea
                                  label="Sobre a atuação"
                                  description="Detalhes opcionais sobre esta atuação"
                                  minRows={2}
                                  maxRows={2}
                                  value={gr.description}
                                  onChange={(e) =>
                                    updateRole(gr.tempId, {
                                      description: e.currentTarget.value,
                                    })
                                  }
                                />

                                {/* MÚSICO DESIGNADO */}
                                {gr.role_id && selectedProject && (
                                  <Box>
                                    <Text size="sm" fw={500} mb={4}>
                                      Designar músico para esta vaga
                                    </Text>

                                    <GigRoleCombobox
                                      label=""
                                      projectId={selectedProject.id}
                                      roleId={gr.role_id}
                                      onSelect={(profile) =>
                                        updateRole(gr.tempId, {
                                          assigned: profile,
                                        })
                                      }
                                    />

                                    {gr.assigned && (
                                      <Group mt="xs" gap="xs">
                                        <Badge
                                          px={6}
                                          variant="default"
                                          tt="lowercase"
                                          fw={400}
                                          size="lg"
                                          radius="lg"
                                          leftSection={
                                            <Avatar
                                              size="xs"
                                              src={
                                                gr?.assigned?.avatar
                                                  ? `https://ik.imagekit.io/mublin/users/avatars/tr:h-16,w-16/${gr.assigned.avatar}`
                                                  : null
                                              }
                                            />
                                          }
                                          rightSection={
                                            <ActionIcon
                                              size="xs"
                                              variant="transparent"
                                              color="teal"
                                              onClick={() =>
                                                updateRole(gr.tempId, {
                                                  assigned: null,
                                                })
                                              }
                                              aria-label="Remover músico designado"
                                            >
                                              <IconX size={12} stroke={2.5} />
                                            </ActionIcon>
                                          }
                                        >
                                          @{gr.assigned.username}
                                        </Badge>
                                      </Group>
                                    )}
                                  </Box>
                                )}

                                {/* SUBSTITUIÇÃO */}
                                <Box>
                                  <Divider mb="sm" />

                                  <Checkbox
                                    label="A vaga é um sub (substituição)"
                                    checked={gr.is_sub}
                                    onChange={(e) =>
                                      updateRole(gr.tempId, {
                                        is_sub: e.currentTarget.checked,
                                      })
                                    }
                                  />

                                  {gr.is_sub && (
                                    <Box mt="xs">
                                      <Text size="xs" fw={500} mb={4}>
                                        Quem será substituído nesta vaga?
                                      </Text>

                                      <SubForCombobox
                                        selected={gr.sub_for_profile}
                                        onSelect={(profile) =>
                                          updateRole(gr.tempId, {
                                            sub_for_profile: profile,
                                          })
                                        }
                                      />
                                    </Box>
                                  )}
                                </Box>
                              </Stack>
                            </Card>
                          </Collapse>

                          {/* REMOVER */}
                          <Group justify="flex-end" mt="xs">
                            <Button
                              size="xs"
                              variant="subtle"
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => removeRole(gr.tempId)}
                              disabled={gigRoles.length === 1}
                            >
                              Remover vaga
                            </Button>
                          </Group>
                        </Paper>
                      )
                    })}
                    <Button
                      variant="light"
                      color="var(--mantine-color-text)"
                      leftSection={<IconPlus size={16} />}
                      onClick={addRole}
                    >
                      Adicionar outra vaga
                    </Button>
                  </Stack>
                  <Group justify="flex-end" mt="md">
                    <Button
                      rightSection={<IconChevronRightFilled size={14} />}
                      onClick={handleContinueToSetlist}
                      disabled={!gigRoles.some((r) => r.role_id)}
                    >
                      Continuar
                    </Button>
                  </Group>
                </Stack>
              )}
            </Paper>
          </Collapse>

          <Collapse expanded={step === 4}>
            <Paper id="gig-setlist" withBorder p="md" radius="md">
              <Badge size="lg" variant="filled" color="mublinColor" mb="xs">
                Passo 4
              </Badge>
              <Title order={4} mb="md">
                Repertório / Setlist
              </Title>
              <Stack gap="md">
                <SetlistManager
                  projectId={selectedProject?.id}
                  value={selectedSetlistId}
                  onChange={setSelectedSetlistId}
                />
                <Group justify="flex-end" mt="md">
                  <Button
                    type="submit"
                    leftSection={<IconSend size={15} />}
                    loading={isSubmitting}
                  >
                    Criar gig
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Collapse>
          {/* Exibe os steps desativados para situar o usuário */}
          <Stack gap="xs">
            {UPCOMING_STEPS.filter((s) => step < s.number).map((s) => (
              <StepPlaceholder
                key={s.number}
                number={s.number}
                title={s.title}
                id={s.id}
              />
            ))}
          </Stack>
        </form>
      </Container>
    </>
  )
}
