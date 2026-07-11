import { useState, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { fetchAllRoles } from '../../queries/roles'
import { searchArtist } from '../../queries/artists'
import {
  Stack,
  Group,
  Text,
  Button,
  Modal,
  NativeSelect,
  Skeleton,
  Avatar,
  TextInput,
  ActionIcon,
  Box,
  Loader,
  Radio,
  Textarea,
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
} from '@tabler/icons-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-96,w-96,c-maintain_ratio/'

const PROJECTS_PATH =
  'https://ik.imagekit.io/mublin/projects/tr:h-96,w-96,c-maintain_ratio/'

// ── Queries locais ────────────────────────────────────────

async function fetchUserPortfolio(profileId) {
  const { data, error } = await supabase
    .from('portfolio')
    .select(
      `
      id,
      order_number,
      notes,
      role_id,
      project_id,
      artist_id,
      roles ( id, name_ptbr ),
      projects ( id, name, picture ),
      artists ( id, name, picture )
    `,
    )
    .eq('profile_id', profileId)
    .order('order_number', { ascending: true, nullsFirst: false })
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
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [entryType, setEntryType] = useState('project') // 'project' | 'artist'
  const [selectedProject, setSelectedProject] = useState(null)
  const [selectedArtist, setSelectedArtist] = useState(null)
  const [notes, setNotes] = useState('')

  // ── Estados: busca de projeto ──────────────────────────
  const [projectSearch, setProjectSearch] = useState('')
  const [projectResults, setProjectResults] = useState([])
  const [searchingProjects, setSearchingProjects] = useState(false)

  // ── Estados: busca de artista ──────────────────────────
  const [artistSearch, setArtistSearch] = useState('')
  const [artistResults, setArtistResults] = useState([])
  const [searchingArtists, setSearchingArtists] = useState(false)

  // ── Estados: ações ──────────────────────────────────────
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState(false)

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)

  // ── Queries ─────────────────────────────────────────────

  const { data: allRoles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: fetchAllRoles,
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
    setSelectedRoleId('')
    setEntryType('project')
    setSelectedProject(null)
    setSelectedArtist(null)
    setNotes('')
    setProjectSearch('')
    setProjectResults([])
    setArtistSearch('')
    setArtistResults([])
  }

  function handleCloseModal() {
    closeModal()
    resetForm()
  }

  // ── Handler: adicionar item ao portfólio ───────────────

  async function handleAddPortfolioItem() {
    if (!selectedRoleId) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Selecione o papel exercido no projeto.',
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

    setIsAddingItem(true)
    const nextOrder = userPortfolio.length + 1

    const { error } = await supabase.from('portfolio').insert({
      profile_id: user.id,
      role_id: Number(selectedRoleId),
      project_id: selectedProject ? Number(selectedProject.id) : null,
      artist_id: selectedArtist ? Number(selectedArtist.id) : null,
      order_number: nextOrder,
      notes: notes.trim() ? notes.trim() : null,
    })

    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar item ao portfólio. Tente novamente.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-portfolio', user.id] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Item adicionado ao portfólio!',
      })
      handleCloseModal()
    }
    setIsAddingItem(false)
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
                      ? (isProject ? `${PROJECTS_PATH}${item.id}/` : ARTISTS_PATH) +
                        entity.picture
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
                            align="center"
                            justify="space-between"
                            style={{
                              ...providedDrag.draggableProps.style,
                              backgroundColor: 'var(--mantine-color-body)',
                              padding: '6px 8px',
                              borderRadius: 'var(--mantine-radius-sm)',
                            }}
                          >
                            <Group gap="sm" align="center">
                              <Box
                                {...providedDrag.dragHandleProps}
                                style={{ display: 'flex', alignItems: 'center' }}
                              >
                                <IconGripVertical
                                  size={14}
                                  opacity={0.4}
                                  style={{ cursor: 'grab' }}
                                />
                              </Box>
                              <Avatar size={40} radius="xl" src={picture}>
                                <IconDisc size={18} />
                              </Avatar>
                              <Stack gap={0}>
                                <Text size="sm" fw={600}>
                                  {entity?.name || 'Sem título'}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  Atividade: {item.roles?.name_ptbr}
                                </Text>
                                {item.notes && (
                                  <Text size="xs" c="dimmed" fs="italic" mt={2}>
                                    "{item.notes}"
                                  </Text>
                                )}
                              </Stack>
                            </Group>
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

        <div>
          <Button
            size="sm"
            variant="filled"
            leftSection={<IconPlus size={14} />}
            onClick={openModal}
          >
            Adicionar ao portfólio
          </Button>
        </div>
      </Stack>

      {/* ── Modal: adicionar item ao portfólio ────────── */}
      <Modal
        title="Adicionar ao portfólio"
        opened={modalOpened}
        onClose={handleCloseModal}
        size="sm"
        radius="md"
        centered
      >
        <Stack gap="sm">
          <NativeSelect
            label="Papel exercido"
            size="md"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.currentTarget.value)}
          >
            <option value="">Selecione</option>
            <optgroup label="Gestão, produção e outros">
              {rolesManagement.map((role) => (
                <option key={role.id} value={String(role.id)}>
                  {role.name_ptbr}
                </option>
              ))}
            </optgroup>
            <optgroup label="Instrumentos">
              {rolesMusicians.map((role) => (
                <option key={role.id} value={String(role.id)}>
                  {role.name_ptbr}
                </option>
              ))}
            </optgroup>
          </NativeSelect>

          <Radio.Group
            label="O que você está adicionando?"
            value={entryType}
            onChange={(value) => {
              setEntryType(value)
              setSelectedProject(null)
              setSelectedArtist(null)
            }}
          >
            <Group gap="lg" mt={4}>
              <Radio value="project" label="Projeto cadastrado no Mublin" size="sm" />
              <Radio value="artist" label="Artista/projeto externo" size="sm" />
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

          <Textarea
            label="Comentário (opcional)"
            placeholder="Ex: Guitarrista na turnê de 2019, gravei os vocais de apoio no álbum..."
            description={`${notes.length}/280`}
            minRows={2}
            maxRows={4}
            maxLength={280}
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
          />

          <Button
            fullWidth
            mt="xs"
            loading={isAddingItem}
            disabled={!selectedRoleId || (!selectedProject && !selectedArtist)}
            onClick={handleAddPortfolioItem}
          >
            Adicionar ao meu portfólio
          </Button>
        </Stack>
      </Modal>
    </>
  )
}
