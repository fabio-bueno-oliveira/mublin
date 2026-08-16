import { useState, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { fetchUserRoles } from '../../queries/user'
import { fetchAllGenres, fetchGenreCategories } from '../../queries/genres'
import { fetchAllRoles } from '../../queries/roles'
import { searchArtist } from '../../queries/artists'
import { fetchAllTravelPreferences } from '../../queries/misc'
import {
  Pill,
  Stack,
  Group,
  Text,
  Button,
  Divider,
  Modal,
  NativeSelect,
  Skeleton,
  Flex,
  Avatar,
  TextInput,
  ActionIcon,
  Box,
  NumberInput,
  Loader,
  Radio,
} from '@mantine/core'
import { useDisclosure, useDebouncedCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus,
  IconSearch,
  IconTrash,
  IconGripVertical,
  IconCheck,
} from '@tabler/icons-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const PROJECTS_PATH =
  'https://ik.imagekit.io/mublin/projects/tr:h-96,w-96,c-maintain_ratio/'

// ── Queries locais ────────────────────────────────────────

async function fetchUserGenres(profileId) {
  const { data, error } = await supabase
    .from('profile_genres')
    .select('id, id_genre, main_genre, genres(id, name_ptbr)')
    .eq('id_profile', profileId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchUserInspirations(profileId) {
  const { data, error } = await supabase
    .from('profile_inspirations')
    .select(
      `
      id,
      order_show,
      projects (
        id,
        name,
        slug,
        picture,
        type:project_types ( name_ptbr ),
        genre:genres ( name, name_ptbr )
      )
    `,
    )
    .eq('profile_id', profileId)
    .order('order_show', { ascending: true, nullsFirst: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchProfileTravelPreference(profileId) {
  const { data, error } = await supabase
    .from('profile_travel_preference')
    .select(
      `
      id,
      travel_preferences (
        id, label
      )
    `,
    )
    .eq('id_profile', profileId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// ── Componente principal ──────────────────────────────────

export default function MusicalPreferences() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // ── Estados: gêneros ──────────────────────────────────
  const [isAddingGenre, setIsAddingGenre] = useState(false)
  const [isDeletingGenre, setIsDeletingGenre] = useState(false)

  // ── Estados: atividades ───────────────────────────────
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [isDeletingRole, setIsDeletingRole] = useState(false)

  // ── Estados: preferência de viagem ───────────────────
  const [isSavingTravelPreference, setIsSavingTravelPreference] = useState(false)

  // ── Estados: inspirações ──────────────────────────────
  const [artistSearch, setArtistSearch] = useState('')
  const [artistResults, setArtistResults] = useState([])
  const [searchingArtists, setSearchingArtists] = useState(false)
  const [isDeletingInspiration, setIsDeletingInspiration] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [isSavingOrder, setIsSavingOrder] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  // ── Modais ────────────────────────────────────────────
  const [modalGenresOpened, { open: openGenresModal, close: closeGenresModal }] =
    useDisclosure(false)
  const [modalRolesOpened, { open: openRolesModal, close: closeRolesModal }] =
    useDisclosure(false)
  const [
    modalInspirationsOpened,
    { open: openInspirationsModal, close: closeInspirationsModal },
  ] = useDisclosure(false)

  // ── Queries ───────────────────────────────────────────

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

  const { data: userGenres = [], isLoading: loadingUserGenres } = useQuery({
    queryKey: ['user-genres', user?.id],
    queryFn: () => fetchUserGenres(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: allRoles = [] } = useQuery({
    queryKey: ['all-roles'],
    queryFn: fetchAllRoles,
    staleTime: Infinity,
  })

  const { data: userRoles = [], isLoading: loadingUserRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: () => fetchUserRoles(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: userInspirations = [], isLoading: loadingInspirations } = useQuery({
    queryKey: ['user-inspirations', user?.id],
    queryFn: () => fetchUserInspirations(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: allTravelPreferences = [] } = useQuery({
    queryKey: ['all-travel-preferences'],
    queryFn: fetchAllTravelPreferences,
    staleTime: Infinity,
  })

  const { data: userTravelPreference, isLoading: loadingTravelPreference } = useQuery({
    queryKey: ['user-travel-preference', user?.id],
    queryFn: () => fetchProfileTravelPreference(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  // ── IDs já selecionados ───────────────────────────────

  const selectedGenreIds = userGenres.map((g) => g.id_genre)
  const selectedRoleIds = userRoles.map((r) => r.id_role)
  const selectedArtistIds = userInspirations.map((i) => i.projects?.id)

  // ── Handlers: gêneros ─────────────────────────────────

  async function handleAddGenre(value) {
    if (!value) {
      return
    }
    setIsAddingGenre(true)
    const isFirst = userGenres.length === 0
    const { error } = await supabase.from('profile_genres').insert({
      id_profile: user.id,
      id_genre: Number(value),
      main_genre: isFirst,
    })
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar gênero. Tente novamente.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-genres', user.id] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Gênero adicionado!',
      })
      closeGenresModal()
    }
    setIsAddingGenre(false)
  }

  async function handleDeleteGenre(profileGenreId) {
    setIsDeletingGenre(true)
    const { error } = await supabase
      .from('profile_genres')
      .delete()
      .eq('id', profileGenreId)
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover gênero. Tente novamente.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-genres', user.id] })
    }
    setIsDeletingGenre(false)
  }

  // ── Handlers: atividades ──────────────────────────────

  async function handleAddRole(value) {
    if (!value) {
      return
    }
    setIsAddingRole(true)
    const isFirst = userRoles.length === 0
    const { error } = await supabase.from('profile_roles').insert({
      id_profile: user.id,
      id_role: Number(value),
      main_activity: isFirst,
    })
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar atividade. Tente novamente.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-roles', user.id] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Atividade adicionada!',
      })
      closeRolesModal()
    }
    setIsAddingRole(false)
  }

  async function handleDeleteRole(profileRoleId) {
    setIsDeletingRole(true)
    const { error } = await supabase
      .from('profile_roles')
      .delete()
      .eq('id', profileRoleId)
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover atividade. Tente novamente.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-roles', user.id] })
    }
    setIsDeletingRole(false)
  }

  // ── Handlers: inspirações ─────────────────────────────

  // Função interna que executa a busca real no Supabase
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

  // Debounce de 400ms para segurar as chamadas enquanto digita
  const debouncedSearch = useDebouncedCallback(executeArtistSearch, 400)

  // Handler que o TextInput chama imediatamente
  function handleArtistSearch(keyword) {
    setArtistSearch(keyword)
    debouncedSearch(keyword)
  }

  async function handleAddInspiration(projectId) {
    const nextOrder = userInspirations.length + 1
    const { error } = await supabase.from('profile_inspirations').insert({
      profile_id: user.id,
      project_id: projectId,
      order_show: nextOrder,
    })
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar inspiração.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-inspirations', user.id] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Inspiração adicionada!',
      })
      setArtistSearch('')
      setArtistResults([])
      closeInspirationsModal()
    }
  }

  async function handleDeleteInspiration(inspirationId) {
    setIsDeletingInspiration(true)

    const { error: deleteError } = await supabase
      .from('profile_inspirations')
      .delete()
      .eq('id', inspirationId)

    if (deleteError) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover inspiração.',
      })
      setIsDeletingInspiration(false)
      return
    }

    const remainingItems = userInspirations.filter((item) => item.id !== inspirationId)

    if (remainingItems.length > 0) {
      try {
        const promises = remainingItems.map((item, index) => {
          const newOrder = index + 1
          return supabase
            .from('profile_inspirations')
            .update({ order_show: newOrder })
            .eq('id', item.id)
        })

        await Promise.all(promises)
      } catch (orderError) {
        console.error('Erro ao reordenar remanescentes:', orderError)
      }
    }

    await queryClient.refetchQueries({ queryKey: ['user-inspirations', user.id] })
    setIsDeletingInspiration(false)
  }

  async function handleSaveOrder(inspirationId, newOrder) {
    setIsSavingOrder(true)
    const { error } = await supabase
      .from('profile_inspirations')
      .update({ order_show: newOrder })
      .eq('id', inspirationId)
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao salvar ordem.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-inspirations', user.id] })
      setEditingOrder(null)
    }
    setIsSavingOrder(false)
  }

  // Handler para reordenar via arrastar e soltar (Drag and Drop)
  async function handleDragEnd(result) {
    if (!result.destination) {
      return
    }
    if (result.source.index === result.destination.index) {
      return
    }

    const items = Array.from(userInspirations)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const previous = userInspirations

    // otimista - já com order_show correto
    const optimistic = items.map((it, idx) => ({ ...it, order_show: idx + 1 }))
    queryClient.setQueryData(['user-inspirations', user.id], optimistic)

    setIsReordering(true)
    try {
      const orderedIds = optimistic.map((it) => it.id)

      const { error } = await supabase.rpc('reorder_inspirations', {
        p_ordered_ids: orderedIds,
      })
      if (error) {
        throw error
      }

      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Nova ordem das inspirações salva com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao salvar nova ordenação:', error)
      // rollback
      queryClient.setQueryData(['user-inspirations', user.id], previous)
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Houve um erro ao sincronizar a ordem com o servidor.',
      })
    } finally {
      setIsReordering(false)
      // opcional - você pode remover esse invalidate se confiar no otimista
      await queryClient.invalidateQueries({ queryKey: ['user-inspirations', user.id] })
    }
  }

  // ── Handler: preferência de viagem ───────────────────

  async function handleTravelPreferenceChange(value) {
    setIsSavingTravelPreference(true)
    const preferenceId = Number(value)

    if (userTravelPreference?.id) {
      // Já existe registro: atualiza
      const { error } = await supabase
        .from('profile_travel_preference')
        .update({ id_travel_preference: preferenceId })
        .eq('id', userTravelPreference.id)
      if (error) {
        notifications.show({
          color: 'red',
          position: 'top-center',
          message: 'Erro ao salvar preferência de viagem. Tente novamente.',
        })
      } else {
        await queryClient.refetchQueries({
          queryKey: ['user-travel-preference', user.id],
        })
        notifications.show({
          color: 'green',
          position: 'top-center',
          message: 'Preferência de viagem atualizada!',
        })
      }
    } else {
      // Não existe registro: insere
      const { error } = await supabase.from('profile_travel_preference').insert({
        id_profile: user.id,
        id_travel_preference: preferenceId,
      })
      if (error) {
        notifications.show({
          color: 'red',
          position: 'top-center',
          message: 'Erro ao salvar preferência de viagem. Tente novamente.',
        })
      } else {
        await queryClient.refetchQueries({
          queryKey: ['user-travel-preference', user.id],
        })
        notifications.show({
          color: 'green',
          position: 'top-center',
          message: 'Preferência de viagem salva!',
        })
      }
    }
    setIsSavingTravelPreference(false)
  }

  // ── Listas filtradas ──────────────────────────────────

  const rolesMusicians = allRoles.filter((r) => r.instrumentalist)
  const rolesManagement = allRoles.filter((r) => !r.instrumentalist)
  const sortedGenreCategories = [
    ...genreCategories.filter((c) => c.id !== 5),
    ...genreCategories.filter((c) => c.id === 5),
  ]

  // ── Render ────────────────────────────────────────────

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Configurações · Preferências musicais · Mublin</title>
        <link rel="canonical" href="https://mublin.com/settings/portfolio" />
      </Helmet>
      <Stack gap="lg">
        {/* ── Gêneros e estilos ────────────────────────── */}
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Gêneros e estilos
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Principais gêneros musicais relacionados à sua atuação
            </Text>
          </div>
          {loadingUserGenres || isDeletingGenre ? (
            <Flex gap={7}>
              <Skeleton width={70} height={24} radius="xl" />
              <Skeleton width={90} height={24} radius="xl" />
              <Skeleton width={60} height={24} radius="xl" />
            </Flex>
          ) : (
            <Group gap={6}>
              {userGenres.length > 0 ? (
                userGenres.map((genre) => (
                  <Pill
                    key={genre.id}
                    withRemoveButton
                    onRemove={() => handleDeleteGenre(genre.id)}
                    removeButtonProps={{
                      'aria-label': `Remover ${genre.genres?.name_ptbr}`,
                      title: 'Remover',
                    }}
                  >
                    {genre.genres?.name_ptbr}
                    {genre.main_genre ? ' ★' : ''}
                  </Pill>
                ))
              ) : (
                <Text size="sm" c="dimmed">
                  Nenhum gênero cadastrado
                </Text>
              )}
            </Group>
          )}
          <div>
            <Button
              size="sm"
              variant="filled"
              leftSection={<IconPlus size={14} />}
              onClick={openGenresModal}
            >
              Adicionar gênero/estilo
            </Button>
          </div>
        </Stack>

        <Divider />

        {/* ── Atividades na música ─────────────────────── */}
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Atividades na música
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Suas principais atividades e atuações
            </Text>
          </div>
          {loadingUserRoles || isDeletingRole ? (
            <Flex gap={7}>
              <Skeleton width={80} height={24} radius="xl" />
              <Skeleton width={100} height={24} radius="xl" />
              <Skeleton width={70} height={24} radius="xl" />
            </Flex>
          ) : (
            <Group gap={6}>
              {userRoles.length > 0 ? (
                userRoles.map((role) => (
                  <Pill
                    key={role.id}
                    withRemoveButton
                    onRemove={() => handleDeleteRole(role.id)}
                    removeButtonProps={{
                      'aria-label': `Remover ${role.roles?.name_ptbr}`,
                      title: 'Remover',
                    }}
                  >
                    {role.roles?.name_ptbr}
                    {role.main_activity ? ' ★' : ''}
                  </Pill>
                ))
              ) : (
                <Text size="sm" c="dimmed">
                  Nenhuma atividade cadastrada
                </Text>
              )}
            </Group>
          )}
          <div>
            <Button
              size="sm"
              variant="filled"
              leftSection={<IconPlus size={14} />}
              onClick={openRolesModal}
            >
              Adicionar atividade
            </Button>
          </div>
        </Stack>

        <Divider />

        {/* ── Preferência de viagens ───────────────────── */}
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Disponibilidade para viagens
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Informe sua preferência em relação a deslocamentos para trabalhos
            </Text>
          </div>

          {loadingTravelPreference ? (
            <Stack gap="xs">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} width={220} height={18} radius="sm" />
              ))}
            </Stack>
          ) : (
            <Radio.Group
              value={
                userTravelPreference?.travel_preferences?.id
                  ? String(userTravelPreference.travel_preferences.id)
                  : ''
              }
              onChange={handleTravelPreferenceChange}
            >
              <Stack gap="xs">
                {allTravelPreferences.map((pref) => (
                  <Radio
                    key={pref.id}
                    value={String(pref.id)}
                    label={pref.label}
                    disabled={isSavingTravelPreference}
                    size="sm"
                  />
                ))}
              </Stack>
            </Radio.Group>
          )}
        </Stack>

        <Divider />

        {/* ── Inspirações ──────────────────────────────── */}
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Inspirações
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Artistas e figuras que inspiram sua trajetória musical (arraste para
              reordenar)
            </Text>
          </div>

          {loadingInspirations || isDeletingInspiration ? (
            <Flex gap={12}>
              {[1, 2, 3].map((i) => (
                <Stack key={i} align="center" gap={6}>
                  <Skeleton circle height={56} />
                  <Skeleton width={56} height={10} radius="xl" />
                </Stack>
              ))}
            </Flex>
          ) : userInspirations.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="inspirations-list" isDropDisabled={isReordering}>
                {(provided) => (
                  <Stack gap="xs" ref={provided.innerRef} {...provided.droppableProps}>
                    {userInspirations.map((inspiration, index) => (
                      <Draggable
                        key={String(inspiration.id)}
                        draggableId={String(inspiration.id)}
                        index={index}
                        isDragDisabled={isReordering}
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
                              padding: '4px 8px',
                              borderRadius: 'var(--mantine-radius-sm)',
                            }}
                          >
                            <Group gap="sm" align="center">
                              <Box
                                {...providedDrag.dragHandleProps}
                                style={{ display: 'flex', alignWith: 'center' }}
                              >
                                {isReordering ? (
                                  <Loader size="xs" />
                                ) : (
                                  <IconGripVertical
                                    size={14}
                                    opacity={0.4}
                                    style={{ cursor: 'grab' }}
                                  />
                                )}
                              </Box>
                              <Avatar
                                size={40}
                                radius="xl"
                                src={
                                  inspiration.projects?.picture
                                    ? `${PROJECTS_PATH}/${inspiration.projects.id}/${inspiration.projects.picture}`
                                    : undefined
                                }
                              />
                              <Stack gap={0}>
                                <Text size="sm" fw={600}>
                                  {inspiration.projects?.name}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {inspiration.projects.type?.name_ptbr}{' '}
                                  {inspiration.projects.genre?.name_ptbr && (
                                    <Text span>
                                      · {inspiration.projects.genre?.name_ptbr}
                                    </Text>
                                  )}
                                </Text>
                              </Stack>
                            </Group>
                            <Group gap="xs">
                              {/* Edição de ordem manual via clique */}
                              {editingOrder?.id === inspiration.id ? (
                                <Group gap={4}>
                                  <NumberInput
                                    size="xs"
                                    w={64}
                                    min={1}
                                    max={99}
                                    value={editingOrder.order_show}
                                    onChange={(val) =>
                                      setEditingOrder((prev) => ({
                                        ...prev,
                                        order_show: val,
                                      }))
                                    }
                                  />
                                  <ActionIcon
                                    size="sm"
                                    variant="light"
                                    color="green"
                                    loading={isSavingOrder}
                                    onClick={() =>
                                      handleSaveOrder(
                                        inspiration.id,
                                        editingOrder.order_show,
                                      )
                                    }
                                  >
                                    <IconCheck size={13} />
                                  </ActionIcon>
                                </Group>
                              ) : (
                                <Text
                                  size="xs"
                                  c="dimmed"
                                  style={{
                                    cursor: 'pointer',
                                    minWidth: 20,
                                    textAlign: 'center',
                                  }}
                                  title="Clique para editar a ordem"
                                  onClick={() =>
                                    setEditingOrder({
                                      id: inspiration.id,
                                      order_show:
                                        inspiration.order_show ??
                                        userInspirations.indexOf(inspiration) + 1,
                                    })
                                  }
                                >
                                  #{inspiration.order_show ?? '—'}
                                </Text>
                              )}
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="red"
                                onClick={() => handleDeleteInspiration(inspiration.id)}
                                title="Remover inspiração"
                              >
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Stack>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhuma inspiração cadastrada
            </Text>
          )}

          <div>
            <Button
              size="sm"
              variant="filled"
              leftSection={<IconPlus size={14} />}
              onClick={openInspirationsModal}
            >
              Adicionar inspiração
            </Button>
          </div>
        </Stack>
      </Stack>

      {/* ── Modal: adicionar gênero ───────────────────── */}
      <Modal
        title="Adicionar gênero musical"
        opened={modalGenresOpened}
        onClose={closeGenresModal}
        size="sm"
        radius="md"
        centered
      >
        <NativeSelect
          size="md"
          disabled={isAddingGenre}
          onChange={(e) => handleAddGenre(e.currentTarget.value)}
          value=""
        >
          <option value="">{isAddingGenre ? 'Salvando...' : 'Selecione'}</option>
          {sortedGenreCategories.map((category) => (
            <optgroup key={category.id} label={category.name_ptbr}>
              {allGenres
                .filter((g) => g.id_category === category.id)
                .map((genre) => (
                  <option
                    key={genre.id}
                    value={String(genre.id)}
                    disabled={selectedGenreIds.includes(genre.id)}
                  >
                    {genre.name_ptbr}
                  </option>
                ))}
            </optgroup>
          ))}
        </NativeSelect>
      </Modal>

      {/* ── Modal: adicionar atividade ────────────────── */}
      <Modal
        title="Adicionar atividade"
        opened={modalRolesOpened}
        onClose={closeRolesModal}
        size="sm"
        radius="md"
        centered
      >
        <NativeSelect
          size="md"
          disabled={isAddingRole}
          onChange={(e) => handleAddRole(e.currentTarget.value)}
          value=""
        >
          <option value="">{isAddingRole ? 'Salvando...' : 'Selecione'}</option>
          <optgroup label="Gestão, produção e outros">
            {rolesManagement.map((role) => (
              <option
                key={role.id}
                value={String(role.id)}
                disabled={selectedRoleIds.includes(role.id)}
              >
                {role.name_ptbr}
              </option>
            ))}
          </optgroup>
          <optgroup label="Instrumentos">
            {rolesMusicians.map((role) => (
              <option
                key={role.id}
                value={String(role.id)}
                disabled={selectedRoleIds.includes(role.id)}
              >
                {role.name_ptbr}
              </option>
            ))}
          </optgroup>
        </NativeSelect>
      </Modal>

      {/* ── Modal: adicionar inspiração ───────────────── */}
      <Modal
        title="Adicionar inspiração musical"
        opened={modalInspirationsOpened}
        onClose={() => {
          closeInspirationsModal()
          setArtistSearch('')
          setArtistResults([])
        }}
        size="sm"
        radius="md"
        centered
      >
        <Stack gap="sm">
          <TextInput
            placeholder="Buscar artista por nome..."
            leftSection={<IconSearch size={15} />}
            rightSection={searchingArtists ? <Loader size="xs" /> : undefined}
            value={artistSearch}
            onChange={(e) => handleArtistSearch(e.target.value)}
            autoFocus
          />
          {artistResults.length > 0 && (
            <Stack gap="xs" mah={300} style={{ overflowY: 'auto' }}>
              {artistResults.map((artist) => {
                const alreadyAdded = selectedArtistIds.includes(artist.id)
                return (
                  <Group key={artist.id} gap="sm" justify="space-between">
                    <Group gap="sm">
                      <Avatar
                        size={36}
                        radius="xl"
                        src={
                          artist.picture
                            ? `${PROJECTS_PATH}/${artist.id}/${artist.picture}`
                            : undefined
                        }
                      />
                      <Box>
                        <Text size="sm" fw={600}>
                          {artist.name}
                        </Text>
                        {artist.genres?.name_ptbr && (
                          <Text size="xs" c="dimmed">
                            {artist.genres.name_ptbr}
                          </Text>
                        )}
                      </Box>
                    </Group>
                    <Button
                      size="xs"
                      color="green"
                      variant={alreadyAdded ? 'default' : 'light'}
                      disabled={alreadyAdded}
                      onClick={() => handleAddInspiration(artist.id)}
                    >
                      {alreadyAdded ? 'Adicionado' : 'Adicionar'}
                    </Button>
                  </Group>
                )
              })}
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
      </Modal>
    </>
  )
}
