import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import {
  Stack,
  Box,
  Text,
  Divider,
  Switch,
  Skeleton,
  Indicator,
  Avatar,
  Checkbox,
  Radio,
  Group,
  Loader,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-60,w-60,c-maintain_ratio/users/avatars/'

// Mapeamento de valores do banco para labels exibidos ao usuário
const AVAILABLE_FROM_OPTIONS = [
  { value: 'immediate', label: 'Disponibilidade imediata' },
  { value: 'negotiable', label: 'A combinar' },
  { value: 'few_days', label: 'Em alguns dias' },
  { value: 'one_month', label: 'Daqui a 1 mês' },
  { value: 'three_months', label: 'Daqui a 3 meses' },
  { value: 'six_months', label: 'Daqui a 6 meses' },
  { value: 'one_year', label: 'Daqui a 1 ano' },
]

// ── Queries locais ────────────────────────────────────────

async function fetchWorkTypes() {
  const { data, error } = await supabase
    .from('work_types')
    .select('id, name_ptbr')
    .order('id')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchWorkFocuses() {
  const { data, error } = await supabase
    .from('work_focuses')
    .select('id, title_ptbr')
    .order('id')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchUserWorkAvailability(profileId) {
  const { data, error } = await supabase
    .from('profile_work_availability')
    .select('id, id_work_type, work_types(id, name_ptbr)')
    .eq('id_profile', profileId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchUserWorkFocus(profileId) {
  const { data, error } = await supabase
    .from('profile_work_focus')
    .select('id, id_work_focus, work_focuses(id, title_ptbr)')
    .eq('id_profile', profileId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// ── Componente principal ──────────────────────────────────

export default function Availability() {
  const { user, profile: authProfile } = useAuth()
  const queryClient = useQueryClient()

  const [isSavingOpenToWork, setIsSavingOpenToWork] = useState(false)
  const [isSavingShowAvailabilityInfo, setIsSavingShowAvailabilityInfo] = useState(false)
  const [isSavingAvailableFrom, setIsSavingAvailableFrom] = useState(false)
  const [isDeletingWorkType, setIsDeletingWorkType] = useState(null)
  const [isAddingWorkType, setIsAddingWorkType] = useState(null)
  const [isDeletingWorkFocus, setIsDeletingWorkFocus] = useState(null)
  const [isAddingWorkFocus, setIsAddingWorkFocus] = useState(null)

  // ── Queries ───────────────────────────────────────────
  const { data: workTypes = [] } = useQuery({
    queryKey: ['work-types'],
    queryFn: fetchWorkTypes,
    staleTime: Infinity,
  })

  const { data: workFocuses = [] } = useQuery({
    queryKey: ['work-focuses'],
    queryFn: fetchWorkFocuses,
    staleTime: Infinity,
  })

  const { data: userWorkAvailability = [], isLoading: loadingAvailability } = useQuery({
    queryKey: ['user-work-availability', user?.id],
    queryFn: () => fetchUserWorkAvailability(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: userWorkFocus = [], isLoading: loadingFocus } = useQuery({
    queryKey: ['user-work-focus', user?.id],
    queryFn: () => fetchUserWorkFocus(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const showErrorAlert = () => {
    notifications.show({
      color: 'red',
      position: 'top-center',
      message: 'Erro ao atualizar. Tente novamente.',
    })
  }

  // ── Handler: Show availability info on profile ────────
  const [showAvailabilityInfo, setShowAvailabilityInfo] = useState(
    () => authProfile?.show_availability_info ?? false,
  )
  async function handleShowAvailabilityInfo(checked) {
    setShowAvailabilityInfo(checked)
    setIsSavingShowAvailabilityInfo(true)
    const { error } = await supabase
      .from('profiles')
      .update({ show_availability_info: checked })
      .eq('id', user.id)
    if (error) {
      setShowAvailabilityInfo(!checked)
      showErrorAlert()
    } else {
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
    }
    setIsSavingShowAvailabilityInfo(false)
  }

  // ── Popula is_open_to_work do authProfile ─────────────
  const [isOpenToWork, setIsOpenToWork] = useState(
    () => authProfile?.is_open_to_work ?? false,
  )

  // ── Handler: Open to Work ─────────────────────────────
  async function handleToggleOpenToWork(checked) {
    setIsOpenToWork(checked)
    setIsSavingOpenToWork(true)
    const { error } = await supabase
      .from('profiles')
      .update({ is_open_to_work: checked })
      .eq('id', user.id)
    if (error) {
      setIsOpenToWork(!checked)
      showErrorAlert()
    } else {
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
    }
    setIsSavingOpenToWork(false)
  }

  // ── Handler: Available From ───────────────────────────
  async function handleAvailableFromChange(value) {
    setIsSavingAvailableFrom(true)
    const { error } = await supabase
      .from('profiles')
      .update({ available_from: value })
      .eq('id', user.id)
    if (error) {
      showErrorAlert()
    } else {
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
    }
    setIsSavingAvailableFrom(false)
  }

  // ── Handler: Work Types ───────────────────────────────
  async function handleDeleteWorkType(id) {
    setIsDeletingWorkType(id)
    const { error } = await supabase
      .from('profile_work_availability')
      .delete()
      .eq('id', id)
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover. Tente novamente.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-work-availability', user.id] })
    }
    setIsDeletingWorkType(null)
  }

  // ── Handlers: vínculo de preferência ─────────────────
  async function handleDeleteWorkFocus(id) {
    setIsDeletingWorkFocus(id)
    const { error } = await supabase.from('profile_work_focus').delete().eq('id', id)
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover. Tente novamente.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-work-focus', user.id] })
    }
    setIsDeletingWorkFocus(null)
  }

  return (
    <>
      <Stack gap="md">
        {/* ── Informações de disponibilidade no perfil ─────── */}
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Informações de disponibilidade
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Exibe disponibilidade, tipos de trabalho, vínculos de preferência, etc
            </Text>
          </div>

          <Switch
            label="Exibir informações de disponibilidade no meu perfil"
            checked={showAvailabilityInfo}
            disabled={isSavingShowAvailabilityInfo}
            color="mublinColor"
            onChange={(e) => handleShowAvailabilityInfo(e.currentTarget.checked)}
            mb="sm"
          />
        </Stack>

        <Divider />

        {/* ── Open to Work ────────────────────────────── */}
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Selo Open to Work
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Exibe um indicador de disponibilidade em locais estratégicos do Mublin
            </Text>
          </div>

          <Switch
            label="Estou disponível para trabalhos e gigs"
            checked={isOpenToWork}
            disabled={isSavingOpenToWork}
            color="green"
            onChange={(e) => handleToggleOpenToWork(e.currentTarget.checked)}
          />

          <Box h={70}>
            <Indicator
              inline
              position="bottom-center"
              pos="absolute"
              color="green"
              size={16}
              label={<Text size="8px">Disponível</Text>}
              withBorder
              disabled={!isOpenToWork}
            >
              <Avatar
                size={60}
                radius="xl"
                src={authProfile?.avatar ? AVATAR_PATH + authProfile.avatar : undefined}
                opacity={isSavingOpenToWork ? 0.3 : 1}
              />
            </Indicator>
          </Box>
        </Stack>

        <Divider />

        {/* ── Disponibilidade a partir de ──────────────── */}
        <Stack gap="md">
          <div>
            <Group gap="xs" align="center">
              <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
                Disponível a partir de
              </Text>
              {isSavingAvailableFrom && <Loader size={12} />}
            </Group>
            <Text size="xs" c="dimmed" mt={2}>
              Quando você estaria disponível para iniciar novos trabalhos?
            </Text>
          </div>

          <Radio.Group
            key={authProfile?.available_from || 'loading'}
            defaultValue={authProfile?.available_from ?? ''}
            onChange={handleAvailableFromChange}
          >
            <Stack gap="xs">
              {AVAILABLE_FROM_OPTIONS.map((opt) => (
                <Radio
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  color="indigo"
                  disabled={isSavingAvailableFrom}
                />
              ))}
            </Stack>
          </Radio.Group>
        </Stack>

        <Divider />

        {/* ── Tipos de trabalho ────────────────────────── */}
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Tipos de trabalho
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Para quais tipos de trabalho você está disponível?
            </Text>
          </div>
          {loadingAvailability ? (
            <Stack gap="xs">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} width={160} height={20} radius="sm" />
              ))}
            </Stack>
          ) : (
            <Stack gap="xs">
              {workTypes.map((type) => {
                const existing = userWorkAvailability.find(
                  (i) => i.id_work_type === type.id,
                )
                const isChecked = !!existing
                const isLoading =
                  isDeletingWorkType === existing?.id || isAddingWorkType === type.id
                return (
                  <Checkbox
                    key={type.id}
                    label={type.name_ptbr}
                    color="indigo"
                    checked={isChecked}
                    disabled={isLoading}
                    onChange={async () => {
                      if (isChecked) {
                        await handleDeleteWorkType(existing.id)
                      } else {
                        setIsAddingWorkType(type.id)
                        const { error } = await supabase
                          .from('profile_work_availability')
                          .insert({ id_profile: user.id, id_work_type: type.id })
                        if (error) {
                          notifications.show({
                            color: 'red',
                            position: 'top-center',
                            message: 'Erro ao adicionar. Tente novamente.',
                          })
                        } else {
                          await queryClient.refetchQueries({
                            queryKey: ['user-work-availability', user.id],
                          })
                        }
                        setIsAddingWorkType(null)
                      }
                    }}
                  />
                )
              })}
            </Stack>
          )}
        </Stack>

        <Divider />

        {/* ── Vínculo de preferência ───────────────────── */}
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Vínculo de preferência
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Com que tipo de vínculo você prefere trabalhar?
            </Text>
          </div>
          {loadingFocus ? (
            <Stack gap="xs">
              {[1, 2].map((i) => (
                <Skeleton key={i} width={140} height={20} radius="sm" />
              ))}
            </Stack>
          ) : (
            <Stack gap="xs">
              {workFocuses.map((focus) => {
                const existing = userWorkFocus.find((i) => i.id_work_focus === focus.id)
                const isChecked = !!existing
                const isLoading =
                  isDeletingWorkFocus === existing?.id || isAddingWorkFocus === focus.id
                return (
                  <Checkbox
                    key={focus.id}
                    label={focus.title_ptbr}
                    color="teal"
                    checked={isChecked}
                    disabled={isLoading}
                    onChange={async () => {
                      if (isChecked) {
                        await handleDeleteWorkFocus(existing.id)
                      } else {
                        setIsAddingWorkFocus(focus.id)
                        const { error } = await supabase
                          .from('profile_work_focus')
                          .insert({ id_profile: user.id, id_work_focus: focus.id })
                        if (error) {
                          notifications.show({
                            color: 'red',
                            position: 'top-center',
                            message: 'Erro ao adicionar. Tente novamente.',
                          })
                        } else {
                          await queryClient.refetchQueries({
                            queryKey: ['user-work-focus', user.id],
                          })
                        }
                        setIsAddingWorkFocus(null)
                      }
                    }}
                  />
                )
              })}
            </Stack>
          )}
        </Stack>
      </Stack>
    </>
  )
}
