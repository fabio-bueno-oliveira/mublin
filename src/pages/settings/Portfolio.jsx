import { useState, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { fetchAllRoles } from '../../queries/roles'
import { fetchUserPortfolio } from '../../queries/user'
import { searchArtist } from '../../queries/artists'
import {
  Stack,
  Group,
  Text,
  Button,
  Modal,
  MultiSelect,
  Skeleton,
  Avatar,
  TextInput,
  ActionIcon,
  Box,
  Loader,
  Radio,
  Textarea,
  Switch,
  Badge,
  NumberInput,
} from '@mantine/core'
import { useDisclosure, useDebouncedCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus,
  IconSearch,
  IconTrash,
  IconGripVertical,
  IconDisc,
  IconMicrophone2,
  IconSparkles,
  IconPencil,
} from '@tabler/icons-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-96,w-96,c-maintain_ratio/'

const PROJECTS_PATH =
  'https://ik.imagekit.io/mublin/projects/tr:h-96,w-96,c-maintain_ratio/'

const CURRENT_YEAR = new Date().getFullYear()

// ── Queries locais ────────────────────────────────────────

// Todos os tipos de vínculo/engajamento disponíveis (tabela de apoio)
async function fetchAllEngagementTypes() {
  const { data, error } = await supabase
    .from('project_engagement_types')
    .select('id, name_ptbr')
    .order('name_ptbr')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// Busca local de projetos já cadastrados no Mublin.
async function searchProjects(keyword) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, picture')
    .ilike('name', `%${keyword}%`)
    .limit(10)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// ── Componente principal ──────────────────────────────────

export default function Portfolio() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // ── Estados: formulário do modal ──────────────────────
  const [selectedRoleIds, setSelectedRoleIds] = useState([])
  const [selectedEngagementTypeIds, setSelectedEngagementTypeIds] = useState([])
  const [entryType, setEntryType] = useState('project') // 'project' | 'artist'
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [notes, setNotes] = useState('')
  const [yearStart, setYearStart] = useState('')
  const [yearEnd, setYearEnd] = useState('')
  const [isSporadic, setIsSporadic] = useState(false)
  const [isMublinFacilitated, setIsMublinFacilitated] = useState(false)

  // ── Estados: busca de projeto ──────────────────────────
  const [projectSearch, setProjectSearch] = useState('')
  const [projectResults, setProjectResults] = useState([])
  const [searchingProjects, setSearchingProjects] = useState(false)

  // ── Estados: busca de artista ──────────────────────────
  const [artistSearch, setArtistSearch] = useState('')
  const [artistResults, setArtistResults] = useState([])
  const [searchingArtists, setSearchingArtists] = useState(false)

  // ── Estados: ações ──────────────────────────────────────
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)

  // ── Queries ─────────────────────────────────────────────

  const { data: allRoles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: fetchAllRoles,
    staleTime: Infinity,
  })

  const { data: allEngagementTypes = [] } = useQuery({
    queryKey: ['all-engagement-types'],
    queryFn: fetchAllEngagementTypes,
    staleTime: Infinity,
  })

  const { data: userPortfolio = [], isLoading: loadingPortfolio } = useQuery({
    queryKey: ['user-portfolio', user?.id],
    queryFn: () => fetchUserPortfolio(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const rolesMusicians = allRoles.filter((r) => r.instrumentalist)
  const rolesManagement = allRoles.filter((r) => !r.instrumentalist)

  const roleSelectData = [
    {
      group: 'Gestão, produção e outros',
      items: rolesManagement.map((r) => ({ value: String(r.id), label: r.name_ptbr })),
    },
    {
      group: 'Instrumentos',
      items: rolesMusicians.map((r) => ({ value: String(r.id), label: r.name_ptbr })),
    },
  ]

  const engagementTypeSelectData = allEngagementTypes.map((t) => ({
    value: String(t.id),
    label: t.name_ptbr,
  }))

  // ── Handlers: busca de projeto ─────────────────────────

  const executeProjectSearch = useCallback(async (keyword) => {
    if (keyword.trim().length < 2) {
      setProjectResults([])
      return
    }
    setSearchingProjects(true)
    try {
      const results = await searchProjects(keyword)
      setProjectResults(results)
    } catch (err) {
      console.error(err)
    } finally {
      setSearchingProjects(false)
    }
  }, [])

  const debouncedProjectSearch = useDebouncedCallback(executeProjectSearch, 400)

  function handleProjectSearch(keyword) {
    setProjectSearch(keyword)
    debouncedProjectSearch(keyword)
  }

  // ── Handlers: busca de artista ─────────────────────────

  const executeArtistSearch = useCallback(async (keyword) => {
    if (keyword.trim().length < 2) {
      setArtistResults([])
      return
    }
    setSearchingArtists(true)
    try {
      const results = await searchArtist(keyword)
      setArtistResults(results)
    } catch (err) {
      console.error(err)
    } finally {
      setSearchingArtists(false)
    }
  }, [])

  const debouncedArtistSearch = useDebouncedCallback(executeArtistSearch, 400)

  function handleArtistSearch(keyword) {
    setArtistSearch(keyword)
    debouncedArtistSearch(keyword)
  }

  // ── Handler: reset do formulário ───────────────────────

  function resetForm() {
    setEditingItemId(null)
    setSelectedRoleIds([])
    setSelectedEngagementTypeIds([])
    setEntryType('project')
    setSelectedProject(null)
    setSelectedArtist(null)
    setNotes('')
    setYearStart('')
    setYearEnd('')
    setIsSporadic(false)
    setIsMublinFacilitated(false)
    setProjectSearch('')
    setProjectResults([])
    setArtistSearch('')
    setArtistResults([])
  }

  function handleCloseModal() {
    closeModal()
    resetForm()
  }

  // ── Handler: abrir modal em modo edição ────────────────

  function handleOpenEditModal(item) {
    const isProject = !!item.projects

    setEditingItemId(item.id)
    setSelectedRoleIds(item.portfolio_roles?.map((pr) => String(pr.role_id)) ?? [])
    setSelectedEngagementTypeIds(
      item.portfolio_engagement_types?.map((pe) => String(pe.engagement_type_id)) ?? [],
    )
    setEntryType(isProject ? 'project' : 'artist')
    setSelectedProject(isProject ? item.projects : null)
    setSelectedArtist(!isProject ? item.artists : null)
    setNotes(item.notes ?? '')
    setYearStart(item.year_start ?? '')
    setYearEnd(item.year_end ?? '')
    setIsSporadic(!!item.is_sporadic)
    setIsMublinFacilitated(!!item.is_mublin_facilitated)
    openModal()
  }

  // ── Handler: adicionar item ao portfólio ───────────────

  async function handleAddPortfolioItem() {
    if (selectedRoleIds.length === 0) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Selecione ao menos um papel exercido no projeto.',
      })
      return
    }
    if (!selectedProject && !selectedArtist) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Selecione um projeto ou artista.',
      })
      return
    }

    setIsSavingItem(true)
    const nextOrder = userPortfolio.length + 1

    const { data: insertedPortfolio, error } = await supabase
      .from('portfolio')
      .insert({
        profile_id: user.id,
        project_id: selectedProject ? Number(selectedProject.id) : null,
        artist_id: selectedArtist ? Number(selectedArtist.id) : null,
        order_number: nextOrder,
        notes: notes.trim() ? notes.trim() : null,
        // Se for esporádico, ignoramos os anos mesmo que tenham sido preenchidos antes do toggle
        year_start: !isSporadic && yearStart ? Number(yearStart) : null,
        year_end: !isSporadic && yearEnd ? Number(yearEnd) : null,
        is_sporadic: isSporadic,
        is_mublin_facilitated: isMublinFacilitated,
      })
      .select('id')
      .single()

    if (error || !insertedPortfolio) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar item ao portfólio. Tente novamente.',
      })
      setIsSavingItem(false)
      return
    }

    const portfolioId = insertedPortfolio.id

    // Popula as tabelas de junção (papéis e tipos de vínculo)
    const rolesPayload = selectedRoleIds.map((roleId) => ({
      portfolio_id: portfolioId,
      role_id: Number(roleId),
    }))
    const engagementPayload = selectedEngagementTypeIds.map((typeId) => ({
      portfolio_id: portfolioId,
      engagement_type_id: Number(typeId),
    }))

    const [{ error: rolesError }, engagementResult] = await Promise.all([
      supabase.from('portfolio_roles').insert(rolesPayload),
      engagementPayload.length > 0
        ? supabase.from('portfolio_engagement_types').insert(engagementPayload)
        : Promise.resolve({ error: null }),
    ])
    const engagementError = engagementResult?.error

    if (rolesError || engagementError) {
      console.error(rolesError || engagementError)
      notifications.show({
        color: 'yellow',
        position: 'top-center',
        message:
          'Item criado, mas houve um erro ao salvar papéis/tipos de vínculo. Edite o item para revisar.',
      })
    } else {
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Item adicionado ao portfólio!',
      })
    }

    await queryClient.refetchQueries({ queryKey: ['user-portfolio', user.id] })
    handleCloseModal()
    setIsSavingItem(false)
  }

  // ── Handler: atualizar item existente do portfólio ─────

  async function handleUpdatePortfolioItem() {
    if (selectedRoleIds.length === 0) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Selecione ao menos um papel exercido no projeto.',
      })
      return
    }
    if (!selectedProject && !selectedArtist) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Selecione um projeto ou artista.',
      })
      return
    }

    setIsSavingItem(true)

    const { error: updateError } = await supabase
      .from('portfolio')
      .update({
        project_id: selectedProject ? Number(selectedProject.id) : null,
        artist_id: selectedArtist ? Number(selectedArtist.id) : null,
        notes: notes.trim() ? notes.trim() : null,
        year_start: !isSporadic && yearStart ? Number(yearStart) : null,
        year_end: !isSporadic && yearEnd ? Number(yearEnd) : null,
        is_sporadic: isSporadic,
        is_mublin_facilitated: isMublinFacilitated,
      })
      .eq('id', editingItemId)

    if (updateError) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao salvar alterações. Tente novamente.',
      })
      setIsSavingItem(false)
      return
    }

    // Substitui por completo os papéis e tipos de vínculo associados
    await Promise.all([
      supabase.from('portfolio_roles').delete().eq('portfolio_id', editingItemId),
      supabase
        .from('portfolio_engagement_types')
        .delete()
        .eq('portfolio_id', editingItemId),
    ])

    const rolesPayload = selectedRoleIds.map((roleId) => ({
      portfolio_id: editingItemId,
      role_id: Number(roleId),
    }))
    const engagementPayload = selectedEngagementTypeIds.map((typeId) => ({
      portfolio_id: editingItemId,
      engagement_type_id: Number(typeId),
    }))

    const [{ error: rolesError }, engagementResult] = await Promise.all([
      supabase.from('portfolio_roles').insert(rolesPayload),
      engagementPayload.length > 0
        ? supabase.from('portfolio_engagement_types').insert(engagementPayload)
        : Promise.resolve({ error: null }),
    ])
    const engagementError = engagementResult?.error

    if (rolesError || engagementError) {
      console.error(rolesError || engagementError)
      notifications.show({
        color: 'yellow',
        position: 'top-center',
        message:
          'Alterações salvas, mas houve um erro ao atualizar papéis/tipos de vínculo. Edite o item novamente para revisar.',
      })
    } else {
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Item do portfólio atualizado!',
      })
    }

    await queryClient.refetchQueries({ queryKey: ['user-portfolio', user.id] })
    handleCloseModal()
    setIsSavingItem(false)
  }

  // ── Handler: remover item do portfólio ─────────────────

  async function handleDeletePortfolioItem(itemId) {
    setIsDeletingItem(true)

    const { error: deleteError } = await supabase
      .from('portfolio')
      .delete()
      .eq('id', itemId)

    if (deleteError) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover item do portfólio.',
      })
      setIsDeletingItem(false)
      return
    }

    // Reordena sequencialmente os itens remanescentes
    const remainingItems = userPortfolio.filter((item) => item.id !== itemId)
    if (remainingItems.length > 0) {
      try {
        const promises = remainingItems.map((item, index) => {
          const newOrder = index + 1
          return supabase
            .from('portfolio')
            .update({ order_number: newOrder })
            .eq('id', item.id)
        })
        await Promise.all(promises)
      } catch (orderError) {
        console.error('Erro ao reordenar remanescentes:', orderError)
      }
    }

    await queryClient.refetchQueries({ queryKey: ['user-portfolio', user.id] })
    setIsDeletingItem(false)
  }

  // ── Handler: reordenar via drag and drop ───────────────

  async function handleDragEnd(result) {
    if (!result.destination) {
      return
    }
    if (result.source.index === result.destination.index) {
      return
    }

    const items = Array.from(userPortfolio)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    queryClient.setQueryData(['user-portfolio', user.id], items)

    try {
      const promises = items
        .map((item, index) => {
          const correctOrder = index + 1
          if (item.order_number !== correctOrder) {
            return supabase
              .from('portfolio')
              .update({ order_number: correctOrder })
              .eq('id', item.id)
          }
          return null
        })
        .filter(Boolean)

      if (promises.length > 0) {
        await Promise.all(promises)
      }

      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Nova ordem do portfólio salva com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao salvar nova ordenação:', error)
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Houve um erro ao sincronizar a ordem com o servidor.',
      })
    } finally {
      await queryClient.invalidateQueries({ queryKey: ['user-portfolio', user.id] })
    }
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <>
      <Stack gap="lg">
        <div>
          <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
            Portfólio
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            Projetos e artistas com quem você já atuou (arraste para reordenar)
          </Text>
        </div>

        <Box>
          <Button
            size="xs"
            variant="filled"
            leftSection={<IconPlus size={14} />}
            onClick={openModal}
          >
            Adicionar projeto ao portfólio
          </Button>
        </Box>

        {loadingPortfolio || isDeletingItem ? (
          <Stack gap="xs">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={48} radius="sm" />
            ))}
          </Stack>
        ) : userPortfolio.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="portfolio-list">
              {(provided) => (
                <Stack gap="xs" ref={provided.innerRef} {...provided.droppableProps}>
                  {userPortfolio.map((item, index) => {
                    const entity = item.projects || item.artists
                    const isProject = !!item.projects
                    const picture = entity?.picture
                      ? (isProject
                          ? `${PROJECTS_PATH}${item.project_id}/`
                          : ARTISTS_PATH) + entity.picture
                      : undefined

                    return (
                      <Draggable
                        key={String(item.id)}
                        draggableId={String(item.id)}
                        index={index}
                      >
                        {(providedDrag) => (
                          <Group
                            ref={providedDrag.innerRef}
                            {...providedDrag.draggableProps}
                            gap="sm"
                            align="flex-start"
                            justify="space-between"
                            wrap="nowrap"
                            style={{
                              ...providedDrag.draggableProps.style,
                              backgroundColor: 'var(--mantine-color-body)',
                              padding: '6px 8px',
                              borderRadius: 'var(--mantine-radius-sm)',
                            }}
                          >
                            <Group
                              gap="sm"
                              align="flex-start"
                              wrap="nowrap"
                              style={{ flex: 1, minWidth: 0 }}
                            >
                              <Box
                                {...providedDrag.dragHandleProps}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginTop: 10,
                                }}
                              >
                                <IconGripVertical
                                  size={14}
                                  opacity={0.4}
                                  style={{ cursor: 'grab' }}
                                />
                              </Box>
                              <Avatar
                                size={40}
                                radius="xl"
                                src={picture}
                                style={{ flexShrink: 0 }}
                              >
                                <IconDisc size={18} />
                              </Avatar>
                              <Stack gap={2} style={{ minWidth: 0 }}>
                                <Group gap={6} align="center">
                                  <Text size="sm" fw={600}>
                                    {entity?.name || 'Sem título'}
                                  </Text>
                                  {item.is_mublin_facilitated && (
                                    <Badge
                                      size="xs"
                                      variant="light"
                                      color="mublinColor"
                                      leftSection={<IconSparkles size={10} />}
                                    >
                                      Via Mublin
                                    </Badge>
                                  )}
                                </Group>
                                <Text size="xs">
                                  {item.portfolio_roles
                                    ?.map((pr) => pr.roles?.name_ptbr)
                                    .filter(Boolean)
                                    .join(', ')}
                                </Text>
                                {item.portfolio_engagement_types?.length > 0 && (
                                  <Text size="xs" c="dimmed">
                                    {item.portfolio_engagement_types
                                      .map((pe) => pe.project_engagement_types?.name_ptbr)
                                      .filter(Boolean)
                                      .join(', ')}
                                  </Text>
                                )}
                                {item.is_sporadic ? (
                                  <Text size="xs" c="dimmed">
                                    Colaboração esporádica
                                  </Text>
                                ) : (
                                  (item.year_start || item.year_end) && (
                                    <Text size="xs" c="dimmed">
                                      {item.year_start}
                                      {item.year_end && item.year_end !== item.year_start
                                        ? ` – ${item.year_end}`
                                        : ''}
                                    </Text>
                                  )
                                )}
                                {item.notes && (
                                  <Text
                                    w="60%"
                                    size="xs"
                                    c="dimmed"
                                    fs="italic"
                                    mt={2}
                                    truncate
                                  >
                                    "{item.notes}"
                                  </Text>
                                )}
                              </Stack>
                            </Group>
                            <Group gap={4} style={{ flexShrink: 0 }} wrap="nowrap">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                onClick={() => handleOpenEditModal(item)}
                                title="Editar item"
                              >
                                <IconPencil size={14} />
                              </ActionIcon>
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="red"
                                onClick={() => handleDeletePortfolioItem(item.id)}
                                title="Remover item"
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </Stack>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <Text size="sm" c="dimmed">
            Nenhum item cadastrado no portfólio
          </Text>
        )}
      </Stack>

      {/* ── Modal: adicionar ou editar item do portfólio ────────── */}
      <Modal
        title={editingItemId ? 'Editar item do portfólio' : 'Adicionar ao portfólio'}
        opened={modalOpened}
        onClose={handleCloseModal}
        size="sm"
        radius="md"
        centered
      >
        <Stack gap="sm">
          <MultiSelect
            label="Papéis exercidos"
            placeholder={
              selectedRoleIds.length === 0 ? 'Selecione um ou mais papéis' : undefined
            }
            data={roleSelectData}
            value={selectedRoleIds}
            onChange={setSelectedRoleIds}
            searchable
            clearable
            size="sm"
          />

          <MultiSelect
            label="Tipo de vínculo (opcional)"
            placeholder={
              selectedEngagementTypeIds.length === 0
                ? 'Ex: turnê, gravação, show único...'
                : undefined
            }
            data={engagementTypeSelectData}
            value={selectedEngagementTypeIds}
            onChange={setSelectedEngagementTypeIds}
            searchable
            clearable
            size="sm"
          />

          <Radio.Group
            label="O que você está adicionando?"
            value={entryType}
            onChange={(value) => {
              setEntryType(value)
              setSelectedProject(null)
              setSelectedArtist(null)
            }}
          >
            <Group gap="xs" mt={6}>
              <Radio value="project" label="Projeto cadastrado no Mublin" size="sm" />
              <Radio
                value="artist"
                label="Artista ou projeto externo"
                description="Artistas mainstream e outras figuras do mercado"
                size="sm"
              />
            </Group>
          </Radio.Group>

          {entryType === 'project' &&
            (selectedProject ? (
              <Group
                gap="sm"
                justify="space-between"
                p={6}
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                }}
              >
                <Group gap="sm">
                  <Avatar
                    size={32}
                    radius="xl"
                    src={
                      selectedProject.picture
                        ? `${PROJECTS_PATH}${selectedProject.id}/${selectedProject.picture}`
                        : undefined
                    }
                  >
                    <IconDisc size={16} />
                  </Avatar>
                  <Text size="sm" fw={600}>
                    {selectedProject.name}
                  </Text>
                </Group>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => setSelectedProject(null)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            ) : (
              <Stack gap="xs">
                <TextInput
                  placeholder="Buscar projeto cadastrado no Mublin..."
                  leftSection={<IconSearch size={15} />}
                  rightSection={searchingProjects ? <Loader size="xs" /> : undefined}
                  value={projectSearch}
                  onChange={(e) => handleProjectSearch(e.target.value)}
                />
                {projectResults.length > 0 && (
                  <Stack gap="xs" mah={220} style={{ overflowY: 'auto' }}>
                    {projectResults.map((project) => (
                      <Group key={project.id} gap="sm" justify="space-between">
                        <Group gap="sm">
                          <Avatar
                            size={32}
                            radius="xl"
                            src={
                              project.picture
                                ? `${PROJECTS_PATH}${project.id}/${project.picture}`
                                : undefined
                            }
                          >
                            <IconDisc size={16} />
                          </Avatar>
                          <Text size="sm">{project.name}</Text>
                        </Group>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => {
                            setSelectedProject(project)
                            setProjectSearch('')
                            setProjectResults([])
                          }}
                        >
                          Selecionar
                        </Button>
                      </Group>
                    ))}
                  </Stack>
                )}
                {projectSearch.length >= 2 &&
                  !searchingProjects &&
                  projectResults.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center">
                      Nenhum projeto encontrado.
                    </Text>
                  )}
              </Stack>
            ))}

          {entryType === 'artist' &&
            (selectedArtist ? (
              <Group
                gap="sm"
                justify="space-between"
                p={6}
                style={{
                  borderRadius: 'var(--mantine-radius-sm)',
                }}
              >
                <Group gap="sm">
                  <Avatar
                    size={32}
                    radius="xl"
                    src={
                      selectedArtist.picture
                        ? ARTISTS_PATH + selectedArtist.picture
                        : undefined
                    }
                  >
                    <IconMicrophone2 size={16} />
                  </Avatar>
                  <Text size="sm" fw={600}>
                    {selectedArtist.name}
                  </Text>
                </Group>
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  onClick={() => setSelectedArtist(null)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            ) : (
              <Stack gap="xs">
                <TextInput
                  placeholder="Buscar artista por nome..."
                  leftSection={<IconSearch size={15} />}
                  rightSection={searchingArtists ? <Loader size="xs" /> : undefined}
                  value={artistSearch}
                  onChange={(e) => handleArtistSearch(e.target.value)}
                />
                {artistResults.length > 0 && (
                  <Stack gap="xs" mah={220} style={{ overflowY: 'auto' }}>
                    {artistResults.map((artist) => (
                      <Group key={artist.id} gap="sm" justify="space-between">
                        <Group gap="sm">
                          <Avatar
                            size={32}
                            radius="xl"
                            src={
                              artist.picture ? ARTISTS_PATH + artist.picture : undefined
                            }
                          >
                            <IconMicrophone2 size={16} />
                          </Avatar>
                          <Text size="sm">{artist.name}</Text>
                        </Group>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => {
                            setSelectedArtist(artist)
                            setArtistSearch('')
                            setArtistResults([])
                          }}
                        >
                          Selecionar
                        </Button>
                      </Group>
                    ))}
                  </Stack>
                )}
                {artistSearch.length >= 2 &&
                  !searchingArtists &&
                  artistResults.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center">
                      Nenhum artista encontrado.
                    </Text>
                  )}
              </Stack>
            ))}

          <Switch
            label="Colaboro esporadicamente"
            description="No caso de uma ou mais participações pontuais em show ou gravação, sem período fixo"
            checked={isSporadic}
            onChange={(e) => {
              const checked = e.currentTarget.checked
              setIsSporadic(checked)
              if (checked) {
                setYearStart('')
                setYearEnd('')
              }
            }}
          />

          {!isSporadic && (
            <Group grow gap="sm">
              <NumberInput
                label="Ano de início"
                description="Início do trabalho"
                placeholder="Ex: 2019"
                min={1900}
                max={CURRENT_YEAR + 1}
                value={yearStart}
                onChange={setYearStart}
                hideControls
              />
              <NumberInput
                label="Ano de término"
                description="Deixe em branco se atual"
                min={1900}
                max={CURRENT_YEAR + 1}
                value={yearEnd}
                onChange={setYearEnd}
                hideControls
              />
            </Group>
          )}

          <Switch
            label="Esse vínculo foi facilitado pelo Mublin"
            color="lime"
            checked={isMublinFacilitated}
            onChange={(e) => setIsMublinFacilitated(e.currentTarget.checked)}
          />

          <Textarea
            label="Comentário (opcional)"
            placeholder="Ex: Guitarrista na turnê de 2019, gravei os vocais de apoio no álbum..."
            description={`${notes.length}/2000`}
            minRows={2}
            maxRows={9}
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
          />

          <Button
            fullWidth
            mt="xs"
            size="sm"
            loading={isSavingItem}
            disabled={
              selectedRoleIds.length === 0 || (!selectedProject && !selectedArtist)
            }
            onClick={editingItemId ? handleUpdatePortfolioItem : handleAddPortfolioItem}
          >
            {editingItemId ? 'Salvar alterações' : 'Adicionar ao meu portfólio'}
          </Button>
        </Stack>
      </Modal>
    </>
  )
}
