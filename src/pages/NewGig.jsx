import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { fetchAllRoles } from '../queries/roles'
import { fetchEventTypes, searchVenues, fetchDressCodeTypes } from '../queries/events'
import { searchEvents, searchProfiles } from '../queries/search'
import { supabase } from '../lib/supabaseClient'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import GigRoleCombobox from '../components/gigs/GigRoleCombobox'
import {
  Container,
  Grid,
  Flex,
  Group,
  Divider,
  Avatar,
  Stack,
  Combobox,
  InputBase,
  useCombobox,
  Select,
  TextInput,
  Textarea,
  Title,
  Text,
  Button,
  Paper,
  ActionIcon,
  Badge,
  NumberInput,
  Checkbox,
  Box,
  CloseButton,
  Loader,
  Center,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { TimeInput } from '@mantine/dates'
import {
  IconPlus,
  IconTrash,
  IconSend,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconShirt,
  IconMicrophone2,
} from '@tabler/icons-react'

const PROJECT_IMAGE_PATH = 'https://ik.imagekit.io/mublin/projects/'

function VenueCombobox({ selected, onSelect, onClear, disabled, label = 'Local' }) {
  const combobox = useCombobox()
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const fetchVenues = useDebouncedCallback(async (val) => {
    if (val.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    const data = await searchVenues(val)
    setResults(data)
    combobox.openDropdown()
    setSearching(false)
  }, 500)
  if (selected) {
    return (
      <Box>
        <Text size="sm" fw={500}>
          {label}
        </Text>
        <Group gap="xs" mt={4}>
          <IconMapPin size={14} />
          <Text size="sm" fw={500}>
            {selected.name}
          </Text>
          <CloseButton
            size="sm"
            onClick={() => {
              onClear()
              setValue('')
            }}
            disabled={disabled}
          />
        </Group>
      </Box>
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
          label={label}
          placeholder="Buscar local..."
          leftSection={<IconMapPin size={14} />}
          value={value}
          onChange={(e) => {
            setValue(e.currentTarget.value)
            setSearching(true)
            fetchVenues(e.currentTarget.value)
          }}
          rightSection={searching ? <Loader size="xs" /> : <Combobox.Chevron />}
          disabled={disabled}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {results.map((i) => (
            <Combobox.Option key={i.id} value={String(i.id)}>
              {i.name} ({i.cities?.name})
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

function EventCombobox({ selected, onSelect, onClear }) {
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
          label="Evento relacionado (opcional)"
          placeholder="Buscar evento..."
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
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [projectSearch, setProjectSearch] = useState('')
  const [showManualVenue, setShowManualVenue] = useState(false)

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
  const combobox = useCombobox()
  const { data: userProjects = [] } = useQuery({
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

  const isAdminOfSelected = useMemo(() => {
    if (!selectedProject) {
      return true
    }
    const member = userProjects.find((p) => p.projects?.id === selectedProject.id)
    return member?.is_admin === true
  }, [selectedProject, userProjects])

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
    },
    validate: { title: (v) => (v.length < 2 ? 'Mínimo 2 caracteres' : null) },
  })

  const filteredProjects = userProjects.filter(
    (item) =>
      item.projects?.id != null &&
      (!projectSearch.trim() ||
        item.projects?.name.toLowerCase().includes(projectSearch.toLowerCase())),
  )

  function handleSelectProject(item) {
    setSelectedProject(item.projects)
    form.setFieldValue('project_id', String(item.projects.id))
    setProjectSearch(item.projects.name)
    combobox.closeDropdown()
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
          description: values.description,
          project_id: values.project_id ? Number(values.project_id) : null,
          event_type_id: values.event_type_id ? Number(values.event_type_id) : 1,
          dress_code_id: values.dress_code_id ? Number(values.dress_code_id) : null,
          event_id: selectedEvent?.id || null,
          venue_id: selectedVenue?.id || null,
          date: values.date || null,
          time_stage_start: values.time_stage_start || null,
          time_stage_end: values.time_stage_end || null,
          venue_name: selectedVenue ? null : values.venue_name,
          venue_address: selectedVenue ? null : values.venue_address,
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
    } catch (e) {
      notifications.show({ title: 'Erro', message: e.message, color: 'red' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const groupedRolesData = useMemo(() => {
    const management = []
    const instruments = []
    const other = []

    roles.forEach((r) => {
      const item = { value: String(r.id), label: r.name_ptbr || r.name_en }
      const cat = (r.category || r.type || '').toLowerCase()
      if (cat.includes('manag') || cat.includes('prod') || cat.includes('gest')) {
        management.push(item)
      } else if (cat.includes('music') || cat.includes('instr')) {
        instruments.push(item)
      } else {
        const name = (r.name_ptbr || '').toLowerCase()
        if (
          ['produtor', 'técnico', 'manager', 'roadie', 'iluminação', 'som', 'staff'].some(
            (k) => name.includes(k),
          )
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

  return (
    <>
      <Helmet>
        <title>Cadastrar gig · Mublin</title>
      </Helmet>
      <Container size="sm" py="md">
        <Title order={3} mb="lg">
          Cadastrar nova gig
        </Title>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
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
                  label="Selecione o projeto, artista, banda, etc"
                  description="Exibindo apenas projetos que sou administrador"
                  placeholder="Selecione seu projeto..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.currentTarget.value)}
                  onFocus={() => combobox.openDropdown()}
                  rightSection={<Combobox.Chevron />}
                />
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options>
                  {filteredProjects.map((item) => (
                    <Combobox.Option
                      key={item.projects.id}
                      value={String(item.projects.id)}
                    >
                      <Flex gap="sm" align="center">
                        <Avatar
                          size={36}
                          src={
                            item.projects.picture
                              ? `${PROJECT_IMAGE_PATH}${item.projects.id}/tr:h-36/${item.projects.picture}`
                              : null
                          }
                        />
                        <Text size="sm">{item.projects.name}</Text>
                      </Flex>
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>

            {selectedProject && (
              <Center>
                <Flex gap="sm" align="center">
                  <Avatar
                    size={50}
                    src={
                      selectedProject?.picture
                        ? `${PROJECT_IMAGE_PATH}${selectedProject.id}/tr:h-50/${selectedProject.picture}`
                        : null
                    }
                  />
                  <Stack gap={0}>
                    <Text size="md" lh={1}>
                      {selectedProject?.name}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {selectedProject?.project_types?.name_ptbr}
                    </Text>
                  </Stack>
                </Flex>
              </Center>
            )}

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

            <EventCombobox
              selected={selectedEvent}
              onSelect={(ev) => {
                setSelectedEvent(ev)
                setSelectedVenue(
                  ev.venue_id ? { id: ev.venue_id, name: ev.venues?.name } : null,
                )
                setShowManualVenue(false)
              }}
              onClear={() => {
                setSelectedEvent(null)
                setSelectedVenue(null)
              }}
            />

            <TextInput label="Título da gig" {...form.getInputProps('title')} />
            <Textarea
              label="Descrição"
              autosize
              minRows={2}
              {...form.getInputProps('description')}
            />

            <Divider label="Data e local" />
            <Grid>
              <Grid.Col span={4}>
                <TextInput
                  type="date"
                  label="Data"
                  leftSection={<IconCalendar size={16} />}
                  {...form.getInputProps('date')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TimeInput
                  label="Início"
                  leftSection={<IconClock size={16} />}
                  {...form.getInputProps('time_stage_start')}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <TimeInput
                  label="Fim"
                  leftSection={<IconClock size={16} />}
                  {...form.getInputProps('time_stage_end')}
                />
              </Grid.Col>
            </Grid>

            <VenueCombobox
              selected={selectedVenue}
              onSelect={(venue) => {
                setSelectedVenue(venue)
                setShowManualVenue(false)
              }}
              onClear={() => {
                setSelectedVenue(null)
              }}
              disabled={!!selectedEvent}
            />

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

            <Divider label={`Vagas (${gigRoles.length})`} />
            <Stack gap="sm">
              {gigRoles.map((gr) => (
                <Paper key={gr.tempId} p="sm" withBorder radius="md">
                  <Grid>
                    <Grid.Col span={6}>
                      <Select
                        label="Atividade"
                        placeholder="Selecione..."
                        data={groupedRolesData}
                        value={gr.role_id ? String(gr.role_id) : null}
                        onChange={(v) =>
                          updateRole(gr.tempId, { role_id: v ? Number(v) : null })
                        }
                        searchable
                        comboboxProps={{ withinPortal: true }}
                      />
                    </Grid.Col>
                    <Grid.Col span={3}>
                      <Select
                        label="Nível"
                        data={[
                          { value: '1', label: 'Iniciante' },
                          { value: '2', label: 'Intermediário' },
                          { value: '3', label: 'Avançado' },
                        ]}
                        value={String(gr.experience_level)}
                        onChange={(v) =>
                          updateRole(gr.tempId, { experience_level: Number(v) })
                        }
                      />
                    </Grid.Col>
                    <Grid.Col span={3}>
                      <NumberInput
                        label="Cachê"
                        placeholder="R$ 0,00"
                        // leftSection={<IconCurrencyDollar size={14} />}
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
                    </Grid.Col>
                    <Grid.Col span={12}>
                      {gr.role_id && selectedProject && (
                        <GigRoleCombobox
                          projectId={selectedProject.id}
                          roleId={gr.role_id}
                          onSelect={(profile) =>
                            updateRole(gr.tempId, { assigned: profile })
                          }
                        />
                      )}
                      {gr.assigned && (
                        <Group mt="xs" gap="xs">
                          <Badge color="teal" variant="light">
                            @{gr.assigned.username}
                          </Badge>
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            onClick={() => updateRole(gr.tempId, { assigned: null })}
                          >
                            x
                          </ActionIcon>
                        </Group>
                      )}
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Divider mb="sm" />
                      <Checkbox
                        label="A vaga é um sub (substituição)"
                        checked={gr.is_sub}
                        onChange={(e) =>
                          updateRole(gr.tempId, { is_sub: e.currentTarget.checked })
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
                              updateRole(gr.tempId, { sub_for_profile: profile })
                            }
                          />
                        </Box>
                      )}
                    </Grid.Col>
                  </Grid>
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
              ))}
              <Button
                variant="default"
                leftSection={<IconPlus size={16} />}
                onClick={addRole}
              >
                Adicionar outra vaga
              </Button>
            </Stack>
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
        </form>
      </Container>
    </>
  )
}
