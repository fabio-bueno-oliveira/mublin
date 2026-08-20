import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import {
  Stack,
  Text,
  Divider,
  Switch,
  Skeleton,
  Avatar,
  Checkbox,
  Radio,
  Group,
  Loader,
  NumberInput,
  Select,
  Paper,
  Box,
  Flex,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { getAvatarUrl } from '../../utils/profile'

const AVAILABLE_FROM_OPTIONS = [
  { value: 'not_available', label: 'Não disponível no momento' },
  { value: 'immediate', label: 'Disponibilidade imediata' },
  { value: 'negotiable', label: 'A combinar' },
  { value: 'few_days', label: 'Em alguns dias' },
  { value: 'one_month', label: 'Daqui a 1 mês' },
  { value: 'three_months', label: 'Daqui a 3 meses' },
  { value: 'six_months', label: 'Daqui a 6 meses' },
  { value: 'one_year', label: 'Daqui a 1 ano' },
]

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

async function fetchRateTypes() {
  const { data, error } = await supabase
    .from('rate_types')
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
    .select(
      `
      id,
      id_work_type,
      avg_rate,
      rate_currency,
      rate_type_id,
      work_types(id, name_ptbr),
      rate_types(id, name_ptbr)
    `,
    )
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

  // draft local para edição de preço/tipo antes de salvar no banco
  const [draftRates, setDraftRates] = useState({})

  const { data: workTypes = [] } = useQuery({
    queryKey: ['work-types'],
    queryFn: fetchWorkTypes,
    staleTime: Infinity,
  })
  const { data: rateTypes = [] } = useQuery({
    queryKey: ['rate-types'],
    queryFn: fetchRateTypes,
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

  // popula draftRates quando carrega do banco
  useEffect(() => {
    const mapped = {}
    userWorkAvailability.forEach((item) => {
      mapped[item.id_work_type] = {
        avg_rate: item.avg_rate,
        rate_type_id: item.rate_type_id ? String(item.rate_type_id) : null,
        rate_currency: item.rate_currency || 'BRL',
      }
    })
    setDraftRates(mapped)
  }, [userWorkAvailability])

  const showErrorAlert = () =>
    notifications.show({
      color: 'red',
      position: 'top-center',
      message: 'Erro ao atualizar. Tente novamente.',
    })

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

  const [isOpenToWork, setIsOpenToWork] = useState(
    () => authProfile?.is_open_to_work ?? false,
  )
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

  async function handleAvailableFromChange(value) {
    setIsSavingAvailableFrom(true)
    if (value === 'not_available') {
      setIsOpenToWork(false)
    }
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

  async function handleAddWorkType(workTypeId) {
    setIsAddingWorkType(workTypeId)
    const draft = draftRates[workTypeId] || {}
    const { error } = await supabase.from('profile_work_availability').insert({
      id_profile: user.id,
      id_work_type: workTypeId,
      avg_rate: draft.avg_rate || null,
      rate_currency: 'BRL',
      rate_type_id: draft.rate_type_id ? Number(draft.rate_type_id) : null,
    })
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar. Tente novamente.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-work-availability', user.id] })
    }
    setIsAddingWorkType(null)
  }

  const debouncedUpdate = useDebouncedCallback(async (workTypeId, patch) => {
    const existing = userWorkAvailability.find((i) => i.id_work_type === workTypeId)
    if (!existing) {
      return
    }
    const { error } = await supabase
      .from('profile_work_availability')
      .update(patch)
      .eq('id', existing.id)
    if (error) {
      showErrorAlert()
    } else {
      queryClient.invalidateQueries({ queryKey: ['user-work-availability', user.id] })
    }
  }, 600)

  async function handleDeleteWorkFocus(id) {
    setIsDeletingWorkFocus(id)
    const { error } = await supabase.from('profile_work_focus').delete().eq('id', id)
    if (error) {
      showErrorAlert()
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-work-focus', user.id] })
    }
    setIsDeletingWorkFocus(null)
  }

  return (
    <>
      <Stack gap="lg">
        <div>
          <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
            Disponibilidade geral
          </Text>
          <Text size="xs" c="dimmed" mt={2}>
            Quando você estará disponível para novos trabalhos?
          </Text>
        </div>
        <Radio.Group
          value={authProfile?.available_from || 'not_available'}
          onChange={handleAvailableFromChange}
        >
          <Stack gap="xs">
            {AVAILABLE_FROM_OPTIONS.map((opt) => (
              <Radio
                key={opt.value}
                value={opt.value}
                label={opt.label}
                disabled={isSavingAvailableFrom}
              />
            ))}
          </Stack>
        </Radio.Group>

        <Switch
          label="Exibir informações de disponibilidade no meu perfil"
          checked={showAvailabilityInfo}
          disabled={isSavingShowAvailabilityInfo}
          color="mublinColor"
          onChange={(e) => handleShowAvailabilityInfo(e.currentTarget.checked)}
          mb="sm"
        />
        <Divider />

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
          <Avatar
            size={70}
            radius="xl"
            src={
              authProfile?.avatar
                ? getAvatarUrl(authProfile?.avatar, isOpenToWork, 70)
                : `https://api.dicebear.com/10.x/initials/svg?seed=${authProfile?.full_name}`
            }
            style={{ border: '2px solid var(--mantine-color-body)' }}
          />
        </Stack>

        <Divider />

        {/* ── Tipos de trabalho com preço e rate_type ── */}
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Tipos de trabalho
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Para quais tipos de trabalho você está disponível? Informe valor médio
              opcional.
            </Text>
          </div>
          {loadingAvailability ? (
            <Stack gap="xs">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} width={160} height={20} radius="sm" />
              ))}
            </Stack>
          ) : (
            <Stack gap="sm">
              {workTypes.map((type) => {
                const existing = userWorkAvailability.find(
                  (i) => i.id_work_type === type.id,
                )
                const isChecked = !!existing
                const isLoading =
                  isDeletingWorkType === existing?.id || isAddingWorkType === type.id
                const draft = draftRates[type.id] || {
                  avg_rate: null,
                  rate_type_id: null,
                }

                return (
                  <Paper
                    key={type.id}
                    withBorder
                    p="sm"
                    radius="md"
                    style={{
                      background: isChecked
                        ? 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))'
                        : undefined,
                    }}
                  >
                    <Checkbox
                      label={type.name_ptbr}
                      color="indigo"
                      checked={isChecked}
                      disabled={isLoading}
                      onChange={async () => {
                        if (isChecked) {
                          await handleDeleteWorkType(existing.id)
                          setDraftRates((prev) => {
                            const n = { ...prev }
                            delete n[type.id]
                            return n
                          })
                        } else {
                          setDraftRates((prev) => ({
                            ...prev,
                            [type.id]: {
                              avg_rate: null,
                              rate_type_id: null,
                              rate_currency: 'BRL',
                            },
                          }))
                          await handleAddWorkType(type.id)
                        }
                      }}
                    />
                    {isChecked && (
                      <Flex
                        gap="sm"
                        mt="xs"
                        direction={{ base: 'column', sm: 'row' }}
                        align={{ sm: 'flex-end' }}
                      >
                        <NumberInput
                          label="Valor médio"
                          placeholder="R$ 0,00"
                          size="xs"
                          w={{ base: '100%', sm: 160 }}
                          min={0}
                          decimalScale={2}
                          fixedDecimalScale
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="R$ "
                          value={draft.avg_rate}
                          onChange={(v) => {
                            setDraftRates((prev) => ({
                              ...prev,
                              [type.id]: { ...prev[type.id], avg_rate: v },
                            }))
                            debouncedUpdate(type.id, {
                              avg_rate: v || null,
                              rate_currency: 'BRL',
                            })
                          }}
                        />
                        <Select
                          label="Cobrança"
                          placeholder="Como cobra?"
                          size="xs"
                          w={{ base: '100%', sm: 180 }}
                          data={rateTypes.map((rt) => ({
                            value: String(rt.id),
                            label: rt.name_ptbr,
                          }))}
                          value={draft.rate_type_id}
                          onChange={(v) => {
                            setDraftRates((prev) => ({
                              ...prev,
                              [type.id]: { ...prev[type.id], rate_type_id: v },
                            }))
                            debouncedUpdate(type.id, {
                              rate_type_id: v ? Number(v) : null,
                            })
                          }}
                          clearable
                        />
                      </Flex>
                    )}
                  </Paper>
                )
              })}
            </Stack>
          )}
        </Stack>

        <Divider />

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
                          showErrorAlert()
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
