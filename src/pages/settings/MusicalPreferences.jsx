import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { fetchGenreCategories } from '../../queries/genres'
import {
  Pill, Stack, Group, Text, Badge, Button, Divider,
  Modal, NativeSelect, Skeleton, Flex,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconX } from '@tabler/icons-react'

// ── Queries locais ────────────────────────────────────────

async function fetchAllGenres() {
  const { data, error } = await supabase
    .from('genres')
    .select('id, name_ptbr, id_category')
    .eq('active', true)
    .order('name_ptbr')
  if (error) throw new Error(error.message)
  return data
}

async function fetchUserGenres(profileId) {
  const { data, error } = await supabase
    .from('profile_genres')
    .select('id, id_genre, main_genre, genres(id, name_ptbr)')
    .eq('id_profile', profileId)
  if (error) throw new Error(error.message)
  return data
}

async function fetchAllRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name_ptbr, instrumentalist')
    .order('name_ptbr')
  if (error) throw new Error(error.message)
  return data
}

async function fetchUserRoles(profileId) {
  const { data, error } = await supabase
    .from('profile_roles')
    .select('id, id_role, main_activity, roles(id, name_ptbr)')
    .eq('id_profile', profileId)
  if (error) throw new Error(error.message)
  return data
}

// ── Componente principal ──────────────────────────────────

export default function MusicalPreferences() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isAddingGenre, setIsAddingGenre] = useState(false)
  const [isDeletingGenre, setIsDeletingGenre] = useState(false)
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [isDeletingRole, setIsDeletingRole] = useState(false)

  const [modalGenresOpened, { open: openGenresModal, close: closeGenresModal }] = useDisclosure(false)
  const [modalRolesOpened, { open: openRolesModal, close: closeRolesModal }] = useDisclosure(false)

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

  // ── IDs já selecionados (para desabilitar no select) ──

  const selectedGenreIds = userGenres.map(g => g.id_genre)
  const selectedRoleIds  = userRoles.map(r => r.id_role)

  // ── Handlers: gêneros ─────────────────────────────────

  async function handleAddGenre(value) {
    if (!value) return
    setIsAddingGenre(true)
    const isFirst = userGenres.length === 0
    const { error } = await supabase
      .from('profile_genres')
      .insert({
        id_profile: user.id,
        id_genre:   Number(value),
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
    if (!value) return
    setIsAddingRole(true)
    const isFirst = userRoles.length === 0
    const { error } = await supabase
      .from('profile_roles')
      .insert({
        id_profile:    user.id,
        id_role:       Number(value),
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

  // ── Listas filtradas para o select ───────────────────

  const rolesMusicians   = allRoles.filter(r =>  r.instrumentalist)
  const rolesManagement  = allRoles.filter(r => !r.instrumentalist)

  const sortedGenreCategories = [
    ...genreCategories.filter(c => c.id !== 5),
    ...genreCategories.filter(c => c.id === 5),
  ]

  const xIconStyle = { width: 10, height: 10, cursor: 'pointer' }

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

          {(loadingUserGenres || isDeletingGenre) ? (
            <Flex gap={7}>
              <Skeleton width={70} height={24} radius="xl" />
              <Skeleton width={90} height={24} radius="xl" />
              <Skeleton width={60} height={24} radius="xl" />
            </Flex>
          ) : (
            <Group gap={6}>
              {userGenres.length > 0 ? userGenres.map(genre => (
                <Pill 
                  key={genre.id} 
                  withRemoveButton
                  onRemove={() => handleDeleteGenre(genre.id)}
                  removeButtonProps={{ 
                    'aria-label': `Remover ${genre.genres?.name_ptbr}`,
                    'title': 'Remover',
                  }}
                >
                  {genre.genres?.name_ptbr}
                  {genre.main_genre ? ' ★' : ''}
                </Pill>
              )) : (
                <Text size="sm" c="dimmed">Nenhum gênero cadastrado</Text>
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

          {(loadingUserRoles || isDeletingRole) ? (
            <Flex gap={7}>
              <Skeleton width={80} height={24} radius="xl" />
              <Skeleton width={100} height={24} radius="xl" />
              <Skeleton width={70} height={24} radius="xl" />
            </Flex>
          ) : (
            <Group gap={6}>
              {userRoles.length > 0 ? userRoles.map(role => (
                // <Badge
                //   key={role.id}
                //   color="gray"
                //   variant="light"
                //   size="md"
                //   rightSection={
                //     <IconX
                //       style={xIconStyle}
                //       stroke={3}
                //       onClick={() => handleDeleteRole(role.id)}
                //       title="Remover"
                //     />
                //   }
                // >
                //   {role.roles?.name_ptbr}
                //   {role.main_activity ? ' ★' : ''}
                // </Badge>
                <Pill 
                  key={role.id} 
                  withRemoveButton
                  onRemove={() => handleDeleteRole(role.id)}
                  removeButtonProps={{ 
                    'aria-label': `Remover ${role.roles?.name_ptbr}`,
                    'title': 'Remover',
                  }}
                >
                  {role.roles?.name_ptbr}
                  {role.main_activity ? ' ★' : ''}
                </Pill>
              )) : (
                <Text size="sm" c="dimmed">Nenhuma atividade cadastrada</Text>
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
          <option value="">
            {isAddingGenre ? 'Salvando...' : 'Selecione'}
          </option>
          {sortedGenreCategories.map(category => (
            <optgroup key={category.id} label={category.name_ptbr}>
              {allGenres
                .filter(g => g.id_category === category.id)
                .map(genre => (
                  <option
                    key={genre.id}
                    value={String(genre.id)}
                    disabled={selectedGenreIds.includes(genre.id)}
                  >
                    {genre.name_ptbr}
                  </option>
                ))
              }
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
          <option value="">
            {isAddingRole ? 'Salvando...' : 'Selecione'}
          </option>
          <optgroup label="Gestão, produção e outros">
            {rolesManagement.map(role => (
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
            {rolesMusicians.map(role => (
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
    </>
  )
}