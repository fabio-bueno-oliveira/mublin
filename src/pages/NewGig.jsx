import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { fetchActiveProjectMembersForGigRoles } from '../queries/projects'
import { fetchAllRoles } from '../queries/roles'
import { fetchEventTypes, fetchDressCodeTypes } from '../queries/events'
import { searchEvents, searchProfiles } from '../queries/search'
import { supabase } from '../lib/supabaseClient'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import GigRoleCombobox from '../components/gigs/GigRoleCombobox'
import ProjectSelector from '../components/gigs/ProjectSelector'
import VenueSelector from '../components/gigs/VenueSelector'
import InternalSearchSelect from '../components/gigs/InternalSearchSelect'
import SetlistManager from '../components/setlist/SetlistManager'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { useDebouncedCallback } from '@mantine/hooks'
import { TimeInput } from '@mantine/dates'
import { getDateSuggestions } from '../utils/dates'
// prettier-ignore
import {
  useCombobox, Affix, 
  Container, Collapse,
  Grid, Flex, Group, ScrollArea,
  Box, Stack, Divider, Card, Paper,
  Alert, Badge, Avatar,
  CloseButton, InputBase, Input, Fieldset,
  Select, TextInput, NumberInput,
  Title, Text, Textarea,
  Combobox, Checkbox, Radio, Loader,
  Button, ActionIcon, ThemeIcon,
} from '@mantine/core'
// prettier-ignore
import {
  IconPlus, IconTrash,
  IconSend, IconCalendar, IconClock,
  IconMapPin, IconShirt,
  IconMicrophone2,
  IconCalendarEvent, IconBuildingStore, IconEdit,
  IconCheck, IconX,
  IconChevronRightFilled,
  IconExclamationCircle,
  IconHistory,
  IconChevronUp, IconChevronDown,
  IconQuestionMark,
  IconReplaceUser,
  IconCurrencyDollar,
  IconWand,
} from '@tabler/icons-react'
import dayjs from 'dayjs'

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
const AVATAR_IMAGE_PATH = 'https://ik.imagekit.io/mublin/users/avatars/'

function getAvatarUrl(avatar, size = 60) {
  return avatar ? `${AVATAR_IMAGE_PATH}tr:h-${size},w-${size}/${avatar}` : null
}

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
          label={isPastGig ? 'Foi em um evento' : 'Será em um evento'}
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
          {value.length >= 2 && results.length === 0 ? (
            <Combobox.Empty>Nenhum evento encontrado</Combobox.Empty>
          ) : (
            results.map((i) => (
              <Combobox.Option key={i.id} value={String(i.id)}>
                {i.name}
              </Combobox.Option>
            ))
          )}
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
    // searchProfiles retorna { results, total } (por causa da paginação da RPC
    // search_profiles), diferente de searchEvents que retorna o array direto.
    const { results: data } = await searchProfiles(val)
    setResults(Array.isArray(data) ? data : [])
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

// Busca de cidade usada no modo "Preencher manualmente" do local da gig.
// Garante que venue_city_id sempre seja preenchido, mesmo fora do fluxo de
// venue pré-cadastrada — mesmo padrão de combobox debounced do EventCombobox/SubForCombobox acima.
// TODO: extrair a query para queries/search.js (searchCities), como já é feito com searchEvents/searchProfiles.
function CityCombobox({ selected, onSelect }) {
  const combobox = useCombobox()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchCities = useDebouncedCallback(async (query) => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, regions ( name, uf )')
      .ilike('name', `%${query}%`)
      .limit(10)
    setLoading(false)
    if (!error) {
      setResults(data ?? [])
      combobox.openDropdown()
    }
  }, 300)

  if (selected) {
    return (
      <Group gap="xs" mt={4}>
        <IconMapPin size={14} />
        <Text size="sm">
          {selected.name}
          {selected.regions?.uf ? ` — ${selected.regions.uf}` : ''}
        </Text>
        <CloseButton size="xs" onClick={() => onSelect(null)} />
      </Group>
    )
  }

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(value) => {
        const city = results.find((c) => String(c.id) === value)
        onSelect(city || null)
        setSearch('')
        setResults([])
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target>
        <InputBase
          label="Cidade"
          placeholder="Buscar cidade..."
          value={search}
          rightSection={loading ? <Loader size="xs" /> : null}
          onChange={(e) => {
            setSearch(e.currentTarget.value)
            fetchCities(e.currentTarget.value)
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {results.length === 0 ? (
            <Combobox.Empty>Nenhuma cidade encontrada</Combobox.Empty>
          ) : (
            results.map((c) => (
              <Combobox.Option key={c.id} value={String(c.id)}>
                {c.name}
                {c.regions?.uf ? ` — ${c.regions.uf}` : ''}
              </Combobox.Option>
            ))
          )}
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
  // 'event' | 'venue' | 'manual' | null — controla qual dos 3 cards de local está ativo
  const [locationMode, setLocationMode] = useState(null)
  const [selectedManualCity, setSelectedManualCity] = useState(null)
  const [expandedRoleDetails, setExpandedRoleDetails] = useState([])

  const [gigRoles, setGigRoles] = useState([])
  // const [gigRoles, setGigRoles] = useState([
  //   {
  //     tempId: Date.now(),
  //     role_id: null,
  //     description: '',
  //     fee: null,
  //     fee_not_informed: false,
  //     experience_level: 2,
  //     assigned: null,
  //     is_sub: false,
  //     sub_for_profile: null,
  //   },
  // ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoFillingRoles, setIsAutoFillingRoles] = useState(false)

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
      venue_city_id: null,
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

  // Nome do tipo de gig selecionado (Step 2), usado no resumo exibido após a etapa ser concluída
  const selectedEventTypeName = useMemo(() => {
    const type = eventTypes.find(
      (et) => String(et.id) === String(form.values.event_type_id),
    )
    return type?.name || null
  }, [eventTypes, form.values.event_type_id])

  // Resumo do local da gig (Step 2), considerando os 3 cenários possíveis:
  // local do evento vinculado, venue cadastrada selecionada, ou preenchimento manual
  const venueSummary = useMemo(() => {
    if (selectedEvent?.venue) {
      const v = selectedEvent.venue
      const location = v.city?.name ? ` — ${v.city.name}/${v.city.region?.uf || ''}` : ''
      return `${v.name}${location}`
    }

    if (selectedVenue) {
      const location = selectedVenue.city?.name
        ? ` — ${selectedVenue.city.name}/${selectedVenue.city.region?.uf || ''}`
        : ''
      return `${selectedVenue.name}${location}`
    }

    if (form.values.venue_name) {
      const address = form.values.venue_address ? ` — ${form.values.venue_address}` : ''
      const city = selectedManualCity
        ? ` — ${selectedManualCity.name}${selectedManualCity.regions?.uf ? `/${selectedManualCity.regions.uf}` : ''}`
        : ''
      return `${form.values.venue_name}${address}${city}`
    }

    return 'Local não informado'
  }, [
    selectedEvent,
    selectedVenue,
    selectedManualCity,
    form.values.venue_name,
    form.values.venue_address,
  ])

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

    if (ev.date_start) {
      form.setFieldValue('date', ev.date_start) // já vem em "YYYY-MM-DD"
    }
    if (ev.time_event_start) {
      form.setFieldValue('time_stage_start', ev.time_event_start.slice(0, 5)) // "HH:MM:SS" -> "HH:MM"
    }
    form.setFieldValue('time_stage_end', '')
  }

  function addRole() {
    setExpandedRoleDetails([])
    const newRole = {
      tempId: Date.now(),
      role_id: null,
      description: '',
      fee: null,
      fee_not_informed: false,
      experience_level: 2,
      assigned: null,
      is_sub: false,
      is_public: false,
      sub_for_profile: null,
      invitation_description: '',
    }
    setGigRoles([...gigRoles, newRole])
  }
  function updateRole(tempId, patch) {
    setGigRoles(gigRoles.map((r) => (r.tempId === tempId ? { ...r, ...patch } : r)))
  }
  function removeRole(tempId) {
    setGigRoles(gigRoles.filter((r) => r.tempId !== tempId))
  }

  function isBlankRole(r) {
    return (
      !r.role_id &&
      !r.assigned &&
      !r.description &&
      !r.fee &&
      !r.is_sub &&
      !r.is_public &&
      !r.sub_for_profile
    )
  }

  async function handleAutoFillRoles() {
    if (!selectedProject) {
      return
    }
    setIsAutoFillingRoles(true)
    try {
      const members = await fetchActiveProjectMembersForGigRoles(selectedProject.id)

      if (!members.length) {
        notifications.show({
          title: 'Ninguém encontrado',
          message:
            'Não encontramos integrantes em atividade nesse projeto para sugerir vagas automaticamente.',
          color: 'yellow',
        })
        return
      }

      // Uma vaga por combinação (integrante, role) — quem acumula mais de uma
      // função no portfólio gera uma vaga para cada uma delas.
      const suggestedRoles = members.flatMap((member, memberIndex) =>
        (member.roles ?? [])
          .filter((r) => r.role?.id)
          .map((r, roleIndex) => ({
            tempId: Date.now() + memberIndex * 100 + roleIndex,
            role_id: Number(r.role.id),
            description: '',
            fee: null,
            fee_not_informed: false,
            experience_level: 2,
            assigned: member.profile,
            is_sub: false,
            is_public: false,
            sub_for_profile: null,
            invitation_description: '',
          })),
      )

      if (!suggestedRoles.length) {
        notifications.show({
          title: 'Nenhuma função cadastrada',
          message:
            'Os integrantes em atividade encontrados não têm nenhuma função (role) cadastrada no portfólio.',
          color: 'yellow',
        })
        return
      }

      // Evita duplicar uma vaga já existente para a mesma pessoa na mesma função
      const alreadyExists = (candidate) =>
        gigRoles.some(
          (r) =>
            r.role_id === candidate.role_id && r.assigned?.id === candidate.assigned?.id,
        )

      const newRoles = suggestedRoles.filter((candidate) => !alreadyExists(candidate))

      if (!newRoles.length) {
        notifications.show({
          title: 'Vagas já preenchidas',
          message: 'Todas as vagas sugeridas com base no elenco atual já estão criadas.',
          color: 'blue',
        })
        return
      }

      // Se ainda só existir a vaga em branco inicial, substitui em vez de acumular
      const shouldReplace = gigRoles.length === 1 && isBlankRole(gigRoles[0])
      setGigRoles(shouldReplace ? newRoles : [...gigRoles, ...newRoles])

      notifications.show({
        title: 'Vagas preenchidas!',
        message: `${newRoles.length} vaga(s) criada(s) com base no elenco atual do projeto.`,
        color: 'green',
      })
    } catch (e) {
      notifications.show({
        title: 'Erro ao preencher vagas automaticamente',
        message: e.message,
        color: 'red',
      })
    } finally {
      setIsAutoFillingRoles(false)
    }
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
          // Cada campo de local é amarrado ao locationMode ativo — evita o caso em que
          // um valor "sobra" no form de uma seleção anterior e vaza pro insert.
          // venue_city_id/venue_name/venue_address de 'event' e 'venue' são recalculados
          // pelo trigger sync_gig_venue_snapshot no banco; aqui só garantimos o snapshot manual.
          event_id: locationMode === 'event' ? selectedEvent?.id || null : null,
          venue_id: locationMode === 'venue' ? selectedVenue?.id || null : null,
          date: values.date || null,
          time_stage_start: values.time_stage_start || null,
          time_stage_end: values.time_stage_end || null,
          venue_name: locationMode === 'manual' ? values.venue_name || null : null,
          venue_address: locationMode === 'manual' ? values.venue_address || null : null,
          venue_city_id: locationMode === 'manual' ? values.venue_city_id || null : null,
          setlist_id: selectedSetlistId || null,
          created_by: user.id,
        })
        .select()
        .single()
      if (error) {
        throw error
      }

      // Só enviamos vagas com uma atividade (role) de fato selecionada —
      // vagas em branco (ex: adicionadas e não preenchidas) são descartadas aqui.
      const rolesToInsert = gigRoles.filter((r) => r.role_id)

      const normalized = rolesToInsert.map((r) => ({
        gig_id: gig.id,
        role_id: r.role_id,
        description: r.description,
        fee: r.fee_not_informed ? null : r.fee ? Number(r.fee) : null,
        experience_level: r.experience_level,
        is_sub: r.is_sub,
        sub_for: r.is_sub ? r.sub_for_profile?.id || null : null,
        // Sem pessoa designada, a vaga obrigatoriamente é pública
        is_public: r.assigned ? r.is_public : true,
      }))

      // .select() é essencial aqui: gig_roles.id é um uuid gerado pelo banco
      // (gen_random_uuid()), e precisamos desses ids para criar os convites
      // (gig_applications) logo abaixo, referenciando cada vaga certa.
      const { data: insertedRoles, error: rolesError } = await supabase
        .from('gig_roles')
        .insert(normalized)
        .select()
      if (rolesError) {
        throw rolesError
      }

      // Um INSERT ... VALUES (múltiplas linhas) simples no Postgres retorna as
      // linhas na mesma ordem em que foram enviadas, então dá pra parear pelo
      // índice com rolesToInsert (mesma ordem usada para montar "normalized").
      const applicationsToInsert = insertedRoles
        .map((insertedRole, index) => ({
          insertedRole,
          original: rolesToInsert[index],
        }))
        .filter(({ original }) => original?.assigned?.id)
        .map(({ insertedRole, original }) => {
          const isSelfInvite = original.assigned.id === user.id
          return {
            gig_id: gig.id,
            gig_role_id: insertedRole.id,
            profile_id: original.assigned.id,
            invited_by: user.id,
            invitation_description: original.invitation_description?.trim() || null,
            // Convite: quem convida (dono da gig) já "aceitou" ao convidar;
            // quem foi convidado fica com o convite pendente até responder —
            // exceto quando a pessoa se auto-designa, caso em que já nasce
            // aceito (ela já sabe que quer participar).
            status_request_gig_owner: 2, // accepted
            status_request_appliant: isSelfInvite ? 2 : 1, // accepted : pending
          }
        })

      if (applicationsToInsert.length > 0) {
        const { error: applicationsError } = await supabase
          .from('gig_applications')
          .insert(applicationsToInsert)
        if (applicationsError) {
          notifications.show({
            title: 'Gig criada, mas houve um problema ao enviar os convites',
            message: applicationsError.message,
            color: 'yellow',
          })
          navigate('/gigs')
          return
        }
      }

      notifications.show({ title: 'Gig criada!', color: 'green' })
      navigate('/home')
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
      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Cadastrar nova gig" />
      </Affix>
      <Container size="sm" pb="md" mt={{ base: 60, sm: 'md' }}>
        <Title order={3} mb="md" visibleFrom="sm">
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

          <Title order={4} mt={4} mb="xs">
            Qual projeto realizará esta gig?
          </Title>

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
                  {selectedProject?.project_types?.name_ptbr}
                  {selectedProject?.genres?.name && ` · ${selectedProject?.genres?.name}`}
                </Text>
              </Box>
              {selectedProject?.end_year && (
                <Alert
                  icon={<IconExclamationCircle color="red" />}
                  variant="light"
                  // title="Atenção!"
                  color="gray"
                  p="xs"
                >
                  Este projeto foi encerrado em {selectedProject?.end_year}. Antes de
                  continuar o cadastro, vale a pena confirmar a viabilidade real desta gig
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
                  rightSection={step > 2 && <IconCheck size={18} />}
                >
                  Passo 2
                </Badge>
                {step >= 3 && (
                  <Button variant="subtle" size="xs" onClick={() => setStep(2)}>
                    Editar detalhes
                  </Button>
                )}
              </Group>
              <Title order={4}>
                {step > 2
                  ? `Detalhes da gig '${form.getValues()?.title}'`
                  : 'Detalhes da gig'}
              </Title>
              {step > 2 && (
                <Stack gap={4} mt="xs">
                  <Group gap={6}>
                    <IconMicrophone2 color="gray" size={14} />
                    <Text size="sm" c="dimmed">
                      {selectedEventTypeName || 'Tipo não informado'} |{' '}
                      {dayjs(form.values.date).format('DD/MM/YYYY')}
                    </Text>
                  </Group>
                  <Group gap={6}>
                    <IconMapPin color="gray" size={14} />
                    <Text size="sm" c="dimmed">
                      {venueSummary}
                    </Text>
                  </Group>
                </Stack>
              )}
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

                  <Divider label="Local" />

                  <Radio.Group
                    value={locationMode}
                    onChange={(mode) => {
                      setLocationMode(mode)
                      // Limpa o que não pertence ao modo escolhido, pra nunca
                      // vazar dado de uma seleção anterior pro insert.
                      if (mode !== 'event') {
                        setSelectedEvent(null)
                      }
                      if (mode !== 'venue') {
                        setSelectedVenue(null)
                      }
                      if (mode !== 'manual') {
                        setSelectedManualCity(null)
                        form.setValues({
                          venue_name: '',
                          venue_address: '',
                          venue_city_id: null,
                        })
                      }
                    }}
                  >
                    <Flex mt="xs" gap="xs" direction="column" align="stretch">
                      <Radio.Card value="event" p="sm" radius="md">
                        <Group wrap="nowrap" align="flex-start" gap="xs">
                          <Radio.Indicator />
                          <div>
                            <Group gap={6}>
                              <IconCalendarEvent size={14} />
                              <Text size="sm" fw={500}>
                                {isPastGig ? 'Foi em um evento' : 'Será em um evento'}
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              A gig acontecerá em um evento já cadastrado. (Ex: Rock in
                              Rio, João Rock, Tardezinha, etc)
                            </Text>
                          </div>
                        </Group>
                      </Radio.Card>

                      <Radio.Card value="venue" p="sm" radius="md">
                        <Group wrap="nowrap" align="flex-start" gap="xs">
                          <Radio.Indicator />
                          <div>
                            <Group gap={6}>
                              <IconBuildingStore size={14} />
                              <Text size="sm" fw={500}>
                                Local já cadastrado
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              Busque um local já cadastrado (ex: Hangar 110, Nubank
                              Parque, etc)
                            </Text>
                          </div>
                        </Group>
                      </Radio.Card>

                      <Radio.Card value="manual" p="sm" radius="md">
                        <Group wrap="nowrap" align="flex-start" gap="xs">
                          <Radio.Indicator />
                          <div>
                            <Group gap={6}>
                              <IconEdit size={14} />
                              <Text size="sm" fw={500}>
                                Preencher manualmente
                              </Text>
                            </Group>
                            <Text size="xs" c="dimmed">
                              Não será cadastrado para a comunidade
                            </Text>
                          </div>
                        </Group>
                      </Radio.Card>
                    </Flex>
                  </Radio.Group>

                  {locationMode === 'event' && (
                    <Stack gap="xs" mt="xs">
                      <EventCombobox
                        selected={selectedEvent}
                        isPastGig={isPastGig}
                        onSelect={handleSelectEvent}
                        onClear={() => setSelectedEvent(null)}
                      />

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
                    </Stack>
                  )}

                  {locationMode === 'venue' && (
                    <Stack gap="xs" mt="sm">
                      <VenueSelector
                        selected={selectedVenue}
                        relatedProject={selectedProject}
                        relatedProjectId={selectedProject?.id}
                        onSelect={(venue) => setSelectedVenue(venue)}
                        onClear={() => setSelectedVenue(null)}
                        onSelectManual={(venue) => {
                          // Ponte com o card "Preencher manualmente": se o usuário não
                          // encontrar o local na busca, cai pro modo manual já com o
                          // que ele tiver digitado até aqui.
                          setSelectedVenue(null)
                          setLocationMode('manual')
                          form.setValues({
                            venue_name: venue.name || '',
                            venue_address: venue.address || '',
                          })
                        }}
                      />
                    </Stack>
                  )}

                  {locationMode === 'manual' && (
                    <Grid mt="sm">
                      <Grid.Col span={6}>
                        <TextInput
                          label="Nome do local"
                          placeholder="Ex: Estúdio do Seu Zé"
                          {...form.getInputProps('venue_name')}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <TextInput
                          label="Endereço"
                          placeholder="Rua, bairro"
                          {...form.getInputProps('venue_address')}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <CityCombobox
                          selected={selectedManualCity}
                          onSelect={(city) => {
                            setSelectedManualCity(city)
                            form.setFieldValue('venue_city_id', city?.id || null)
                          }}
                        />
                      </Grid.Col>
                    </Grid>
                  )}

                  <Divider label="Data" />

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
              {gigRoles.some((role) => role.role_id) && (
                <ScrollArea
                  type="never"
                  scrollbarSize={0}
                  offsetScrollbars
                  mt="xs"
                  mb={step === 3 ? 'md' : 0}
                >
                  <Group gap={0} wrap="nowrap" align="flex-start" py={4}>
                    {gigRoles
                      .filter((gr) => gr.role_id)
                      .map((gr, index, filledRoles) => {
                        const roleData = roles.find((r) => r.id === gr.role_id)
                        const roleName =
                          roleData?.description_ptbr || roleData?.name_ptbr || 'Vaga'
                        const hasFee =
                          !gr.fee_not_informed && gr.fee !== null && gr.fee !== ''
                        const isLast = index === filledRoles.length - 1

                        return (
                          <Group key={gr.tempId} gap={0} wrap="nowrap" align="center">
                            <Stack align="center" gap={4} w={64}>
                              <Box pos="relative" w={42} h={42}>
                                <Avatar
                                  size={42}
                                  radius="xl"
                                  color="gray"
                                  src={getAvatarUrl(gr.assigned?.avatar, 80)}
                                >
                                  {!gr.assigned && <IconQuestionMark size={18} />}
                                </Avatar>

                                {hasFee && (
                                  <ThemeIcon
                                    size={16}
                                    radius="xl"
                                    color="green"
                                    style={{
                                      position: 'absolute',
                                      top: -2,
                                      right: -2,
                                    }}
                                  >
                                    <IconCurrencyDollar size={10} />
                                  </ThemeIcon>
                                )}

                                {gr.is_sub && (
                                  <Avatar
                                    size={18}
                                    radius="xl"
                                    color="gray"
                                    src={getAvatarUrl(gr.sub_for_profile?.avatar, 32)}
                                    style={{
                                      position: 'absolute',
                                      bottom: -4,
                                      right: hasFee ? 14 : -4,
                                      border: '2px solid var(--mantine-color-body)',
                                    }}
                                  >
                                    <IconReplaceUser size={10} />
                                  </Avatar>
                                )}
                              </Box>

                              <Text size="xs" ta="center" lh={1} fw={500}>
                                {roleName}
                              </Text>

                              {gr?.assigned ? (
                                <Text
                                  size="10px"
                                  ta="center"
                                  lh={1}
                                  fw={300}
                                  lineClamp={3}
                                >
                                  {gr?.assigned?.username} será convidado
                                </Text>
                              ) : (
                                <Text
                                  size="10px"
                                  ta="center"
                                  lh={1}
                                  fw={300}
                                  lineClamp={3}
                                  c="dimmed"
                                >
                                  A vaga ficará em aberto
                                </Text>
                              )}
                            </Stack>

                            {!isLast && (
                              <Box
                                w={24}
                                h={1}
                                mt={20}
                                bg="light-dark(#e0e0e0, #424242)"
                              />
                            )}
                          </Group>
                        )
                      })}
                  </Group>
                </ScrollArea>
              )}
              {step === 3 && (
                <Stack gap="xs" mt="md">
                  {selectedProject && gigRoles.length === 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="gradient"
                        gradient={{ from: 'grape.9', to: 'mublinColor.9', deg: 190 }}
                        leftSection={<IconWand size={16} />}
                        onClick={handleAutoFillRoles}
                        loading={isAutoFillingRoles}
                      >
                        Preencher vagas com o elenco atual
                      </Button>
                      <Divider label="ou" labelPosition="center" my="xs" />
                    </>
                  )}
                  <Stack gap="xs">
                    {gigRoles.map((gr, index) => {
                      const detailsOpened = expandedRoleDetails.includes(gr.tempId)

                      return (
                        <Fieldset legend={`Vaga ${index + 1}`} key={gr.tempId}>
                          <InternalSearchSelect
                            label="Atividade"
                            placeholder="Selecione..."
                            data={groupedRolesData}
                            value={gr.role_id ? String(gr.role_id) : null}
                            onChange={(v) =>
                              updateRole(gr.tempId, {
                                role_id: v ? Number(v) : null,
                              })
                            }
                          />

                          {/* MÚSICO DESIGNADO */}
                          {gr.role_id && selectedProject && (
                            <Box mt="md">
                              <Input.Label>Designar pessoa (opcional)</Input.Label>
                              <Input.Description mb="xs">
                                A pessoa receberá o convite. Caso deixe em branco, a vaga
                                ficará aberta para qualquer usuário que possa se
                                interessar.
                              </Input.Description>

                              {!gr.assigned && (
                                <GigRoleCombobox
                                  label=""
                                  projectId={selectedProject.id}
                                  roleId={gr.role_id}
                                  onSelect={(profile) => {
                                    console.log(gr.tempId, {
                                      assigned: profile,
                                    })
                                    updateRole(gr.tempId, {
                                      assigned: profile,
                                    })
                                  }}
                                />
                              )}

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

                          <Checkbox
                            mt="md"
                            size="sm"
                            color="green"
                            label="Tornar esta vaga pública"
                            description={
                              gr.assigned
                                ? 'A vaga aparecerá nas buscas enquanto o convidado não aceitar o convite'
                                : 'A vaga aparecerá nas buscas enquanto não for preenchida'
                            }
                            checked={gr.is_public || !gr.assigned}
                            disabled={!gr.assigned}
                            onChange={(e) =>
                              updateRole(gr.tempId, {
                                is_public: e.currentTarget.checked,
                              })
                            }
                          />

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
                              {detailsOpened
                                ? 'Ocultar detalhes opcionais'
                                : 'Detalhes opcionais'}
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
                                <Grid>
                                  <Grid.Col span={{ base: 12, sm: 6 }}>
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
                                  <Grid.Col span={{ base: 12, sm: 6 }}>
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
                                        onChange={(v) =>
                                          updateRole(gr.tempId, { fee: v })
                                        }
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
                                  </Grid.Col>
                                </Grid>

                                {/* DESCRIÇÃO */}
                                <Textarea
                                  label="Sobre a atuação"
                                  description="Descrição sobre esta atuação"
                                  minRows={2}
                                  maxRows={2}
                                  value={gr.description}
                                  onChange={(e) =>
                                    updateRole(gr.tempId, {
                                      description: e.currentTarget.value,
                                    })
                                  }
                                />

                                {/* MENSAGEM DO CONVITE */}
                                {gr.assigned && (
                                  <Textarea
                                    label={
                                      <Group gap={6} wrap="nowrap" mb={2}>
                                        <Avatar
                                          size={20}
                                          radius="xl"
                                          src={getAvatarUrl(gr.assigned.avatar, 40)}
                                        >
                                          {gr.assigned.full_name?.[0]}
                                        </Avatar>
                                        <span>Mensagem do convite</span>
                                      </Group>
                                    }
                                    description={`Uma mensagem pessoal para @${gr.assigned.username}, enviada junto com o convite`}
                                    placeholder="Ex: Fala! Bora tocar comigo nessa gig?"
                                    minRows={2}
                                    maxRows={3}
                                    maxLength={500}
                                    value={gr.invitation_description || ''}
                                    onChange={(e) =>
                                      updateRole(gr.tempId, {
                                        invitation_description: e.currentTarget.value,
                                      })
                                    }
                                  />
                                )}

                                {/* SUBSTITUIÇÃO */}
                                <Box>
                                  <Divider mb="sm" />

                                  <Checkbox
                                    label="A vaga é um sub"
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
                              variant="default"
                              leftSection={<IconTrash size={14} color="red" />}
                              onClick={() => removeRole(gr.tempId)}
                            >
                              Remover vaga
                            </Button>
                          </Group>
                        </Fieldset>
                      )
                    })}
                    <Button
                      variant="light"
                      color="var(--mantine-color-text)"
                      leftSection={<IconPlus size={16} />}
                      onClick={addRole}
                    >
                      {gigRoles.length > 0 ? 'Adicionar outra vaga' : 'Adicionar vaga'}
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
