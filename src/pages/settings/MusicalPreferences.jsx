import { useState, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { fetchAllGenres, fetchGenreCategories } from '../../queries/genres'
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
// Importação do Drag and Drop (instale via npm/yarn se necessário)
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-96,w-96,c-maintain_ratio/'

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

async function fetchAllRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name_ptbr, instrumentalist')
    .order('name_ptbr')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchUserRoles(profileId) {
  const { data, error } = await supabase
    .from('profile_roles')
    .select('id, id_role, main_activity, roles(id, name_ptbr)')
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
      artists (
        id,
        name,
        slug,
        picture,
        is_band,
        genres ( name_ptbr )
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

async function searchArtists(keyword) {
  const { data, error } = await supabase
    .from('artists')
    .select('id, name, slug, picture, is_band, genres ( name_ptbr )')
    .ilike('name', `%${keyword}%`)
    .eq('is_active', true)
    .order('name')
    .limit(20)
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
  const [editingOrder, setEditingOrder] = useState(null) // { id, order_show }
  const [isSavingOrder, setIsSavingOrder] = useState(false)

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
  const selectedArtistIds = userInspirations.map((i) => i.artists?.id)

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
      const results = await searchArtists(keyword)
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

  async function handleAddInspiration(artistId) {
    const nextOrder = userInspirations.length + 1
    const { error } = await supabase.from('profile_inspirations').insert({
      profile_id: user.id,
      artist_id: artistId,
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
      // Limpa busca e FECHA O MODAL após a seleção
      setArtistSearch('')
      setArtistResults([])
      closeInspirationsModal()
    }
  }

  async function handleDeleteInspiration(inspirationId) {
    setIsDeletingInspiration(true)

    // 1. Deleta o registro selecionado do banco
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

    // 2. Filtra a lista local removendo o artista que acabou de ser deletado
    const remainingItems = userInspirations.filter((item) => item.id !== inspirationId)

    // 3. Se ainda sobrarem artistas, reordena todos sequencialmente (1, 2, 3...)
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
        // Não bloqueia o fluxo principal pois o item principal já foi deletado
      }
    }

    // 4. Atualiza o cache do React Query para renderizar a nova lista
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
    // Se foi arrastado para fora de uma área válida, ignora
    if (!result.destination) {
      return
    }

    // Se a posição não mudou, ignora
    if (result.source.index === result.destination.index) {
      return
    }

    // 1. Cria uma cópia do estado atual para manipulação local
    const items = Array.from(userInspirations)

    // 2. Remove o item movido da posição original e insere na nova posição
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // 3. Otimisticamente atualiza o cache local para a interface mover instantaneamente
    // Substitua 'user-inspirations' pela chave exata que está utilizando na sua query
    queryClient.setQueryData(['user-inspirations', user.id], items)

    try {
      // 4. Mapeia e gera uma lista de promises para reescrever o 'order_show' de forma sequencial limpa (1, 2, 3...)
      const promises = items
        .map((item, index) => {
          const correctOrder = index + 1

          // Só dispara o update se o valor de ordem realmente mudou no banco
          if (item.order_show !== correctOrder) {
            return supabase
              .from('profile_inspirations')
              .update({ order_show: correctOrder })
              .eq('id', item.id)
          }
          return null
        })
        .filter(Boolean) // Remove valores nulos

      // Executa as atualizações em paralelo no Supabase
      if (promises.length > 0) {
        await Promise.all(promises)
      }

      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Nova ordem das inspirações salva com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao salvar nova ordenação:', error)
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Houve um erro ao sincronizar a ordem com o servidor.',
      })
    } finally {
      // 5. Invalida a query para garantir sincronia total com os dados finais do banco
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

        {/* ── Inspirações ──────────────────────────────── */}
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Inspirações
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Artistas que inspiram sua trajetória musical (arraste para reordenar)
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
              <Droppable droppableId="inspirations-list">
                {(provided) => (
                  <Stack gap="xs" ref={provided.innerRef} {...provided.droppableProps}>
                    {userInspirations.map((inspiration, index) => (
                      <Draggable
                        key={String(inspiration.id)}
                        draggableId={String(inspiration.id)}
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
                              padding: '4px 8px',
                              borderRadius: 'var(--mantine-radius-sm)',
                            }}
                          >
                            <Group gap="sm" align="center">
                              {/* O IconGripVertical agora vira o handle do Drag */}
                              <Box
                                {...providedDrag.dragHandleProps}
                                style={{ display: 'flex', alignWith: 'center' }}
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
                                src={
                                  inspiration.artists?.picture
                                    ? ARTISTS_PATH + inspiration.artists.picture
                                    : undefined
                                }
                              />
                              <Stack gap={0}>
                                <Text size="sm" fw={600}>
                                  {inspiration.artists?.name}
                                </Text>
                                {inspiration.artists?.genres?.name_ptbr && (
                                  <Text size="xs" c="dimmed">
                                    {inspiration.artists.genres.name_ptbr}
                                  </Text>
                                )}
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
                                size="sm"
                                variant="subtle"
                                color="red"
                                onClick={() => handleDeleteInspiration(inspiration.id)}
                                title="Remover inspiração"
                              >
                                <IconTrash size={14} />
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
                        src={artist.picture ? ARTISTS_PATH + artist.picture : undefined}
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
