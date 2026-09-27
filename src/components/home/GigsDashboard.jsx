import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
// prettier-ignore
import {
  Grid, Stack,
  Group, Center, Table,
  Box, Card, Paper,
  Text, Title, Avatar,
  Select, Switch, Slider,
  Button, Badge,
  Popover, Divider,
} from '@mantine/core'
import { MiniCalendar } from '@mantine/dates'
import {
  fetchUserGigs,
  fetchUserGigsByDate,
  fetchUserNextGig,
  fetchUserGigGoals,
  upsertUserGigGoals,
} from '../../queries/user'
import { fetchReceivedInvitations } from '../../queries/gigs'
import { formatShortDate } from '../../utils/dates'
import BannerGigs from '../banners/BannerGigs'
import {
  IconClock,
  IconHourglassOff,
  IconThumbDown,
  IconThumbUp,
  IconCalendarCancel,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const PROJECT_IMAGE_PATH =
  'https://ik.imagekit.io/mublin/projects/tr:h-100,w-100,c-maintain_ratio/'
const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-40,w-40,r-max,c-maintain_ratio/users/avatars/'

function getGigUrgencyStatus(gig) {
  if (!gig?.date || !gig?.time_stage_start) return null

  const now = dayjs()
  const start = dayjs(`${gig.date}T${gig.time_stage_start}`)
  let end = gig.time_stage_end ? dayjs(`${gig.date}T${gig.time_stage_end}`) : null

  // Se o fim for menor que o início (virada de dia), joga pro dia seguinte
  if (end && end.isBefore(start)) {
    end = end.add(1, 'day')
  }

  // Já começou?
  if (now.isAfter(start)) {
    if (!end || now.isBefore(end)) {
      return { type: 'live' }
    }
    // já terminou
    return null
  }

  const diffMinutes = start.diff(now, 'minute')

  // só mostra a partir de 3h = 180min
  if (diffMinutes > 180) return null
  if (diffMinutes <= 0) return { type: 'live' }

  if (diffMinutes <= 10) return { type: 'minutes' }
  if (diffMinutes <= 75) return { type: '1h' }
  if (diffMinutes <= 135) return { type: '2h' }
  return { type: '3h' }
}

function GigUrgencyBadge({ gig }) {
  const status = getGigUrgencyStatus(gig)
  if (!status) return null

  const map = {
    '3h': { label: 'em 3 horas', color: 'yellow', variant: 'light' },
    '2h': { label: 'em 2 horas', color: 'orange', variant: 'light' },
    '1h': { label: 'daqui a 1 hora', color: 'orange', variant: 'light' },
    minutes: { label: 'em alguns minutos!', color: 'red', variant: 'light' },
  }

  if (status.type === 'live') {
    return (
      <Group gap={4} wrap="nowrap">
        <Box
          component="span"
          className="live-dot green small"
          style={{ flexShrink: 0 }}
        />
        <Text size="8px" c="var(--mantine-color-text)" ta="center" tt="uppercase" lh={1}>
          rolando agora
        </Text>
      </Group>
    )
  }

  const cfg = map[status.type]
  return (
    <>
      {/* <Badge size="xs" fw={400} color={cfg.color} variant={cfg.variant} radius="sm">
        {cfg.label}
      </Badge> */}
      <Group gap={4} wrap="nowrap">
        <Box
          component="span"
          className={`live-dot ${cfg.color} small`}
          style={{ flexShrink: 0 }}
        />
        <Text size="8px" c="var(--mantine-color-text)" ta="center" tt="uppercase" lh={1}>
          {cfg.label}
        </Text>
      </Group>
    </>
  )
}

// Junta os nomes das funções de um convite combinado: "Guitarrista",
// "Guitarrista e Backing Vocal", "Guitarrista, Backing Vocal e Produtor Musical"
function formatComboRoleNames(comboRoles) {
  const names = (comboRoles ?? []).map((r) => r?.roles?.description_ptbr).filter(Boolean)
  if (names.length === 0) {
    return ''
  }
  if (names.length === 1) {
    return names[0]
  }
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
}

export default function GigsDashboard() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [tempGoal, setTempGoal] = useState(10)
  const [tempNoGoal, setTempNoGoal] = useState(false)
  const [popoverOpened, setPopoverOpened] = useState(false)

  const [miniCalendarCurrentDate, setMiniCalendarCurrentDate] = useState(new Date())
  const [nowTick, setNowTick] = useState(() => dayjs()) // força re-render do badge de urgência

  useEffect(() => {
    const id = setInterval(() => setNowTick(dayjs()), 1000 * 30) // atualiza a cada 30s
    return () => clearInterval(id)
  }, [])
  const [invitationFilter, setInvitationFilter] = useState('pending') // 'all' | 'pending'

  const saveGigGoalMutation = useMutation({
    mutationFn: (goals) => upsertUserGigGoals(user.id, goals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-gig-goals', user.id] })
      setPopoverOpened(false)
    },
  })

  const handleSaveGoal = () => {
    saveGigGoalMutation.mutate({
      monthly_total_gigs: tempNoGoal ? null : tempGoal,
      annual_total_gigs: null,
      monthly_income: null,
      annual_income: null,
    })
  }

  const handleOpen = () => {
    setTempGoal(goal || 10)
    setTempNoGoal(!goal)
    setPopoverOpened(true)
  }

  const { data: gigs = [] } = useQuery({
    queryKey: ['user-gigs', user?.id],
    queryFn: () => fetchUserGigs(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })
  const todayIso = dayjs().format('YYYY-MM-DD')
  const tomorrowIso = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const selectedIso = dayjs(miniCalendarCurrentDate).format('YYYY-MM-DD')
  const isSelectedToday = selectedIso === todayIso
  const isSelectedTomorrow = selectedIso === tomorrowIso

  const { data: nextGig } = useQuery({
    queryKey: ['user-next-gig', user?.id, todayIso],
    queryFn: () => fetchUserNextGig(user.id, todayIso),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })
  const gigDatesSet = useMemo(
    () => new Set(gigs.map((g) => dayjs(g.gig?.date).format('YYYY-MM-DD'))),
    [gigs],
  )
  const gigsThisMonth = useMemo(
    () => gigs.filter((g) => dayjs(g.gig?.date).isSame(dayjs(), 'month')).length,
    [gigs],
  )
  const { data: gigsForSelectedDay = [], isLoading: isLoadingGigsForSelectedDay } =
    useQuery({
      queryKey: ['user-gigs-by-date', user?.id, selectedIso],
      queryFn: () => fetchUserGigsByDate(user.id, selectedIso),
      enabled: !!user?.id && !!selectedIso,
    })
  const { data: gigGoals } = useQuery({
    queryKey: ['user-gig-goals', user?.id],
    queryFn: () => fetchUserGigGoals(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const goal = gigGoals?.monthly_total_gigs ?? null
  const noGoal = !goal

  const progress = noGoal ? 0 : Math.min((gigsThisMonth / goal) * 100, 100)
  const subtleBg = 'light-dark(rgba(0,0,0,0.01), rgba(0,0,0,0.09))'

  const { data: receivedInvitations = [], isLoading: loadingReceivedInvitations } =
    useQuery({
      queryKey: ['received-invitations', user?.id],
      queryFn: () => fetchReceivedInvitations(user.id),
      enabled: !!user?.id,
      staleTime: 1000 * 60 * 2,
    })

  const weekDay = dayjs(miniCalendarCurrentDate).locale('pt-br').format('dddd')
  const weekDayCapitalized = weekDay.charAt(0).toUpperCase() + weekDay.slice(1)

  const filteredInvitations = useMemo(() => {
    if (invitationFilter === 'pending') {
      return receivedInvitations.filter((i) => {
        if (i.status_request_appliant !== 1) return false
        // Remove convites que já passaram (data + hora)
        const gigDate = i?.gigs?.date
        const gigTime = i?.gigs?.time_stage_start || '23:59:59'
        const isPast = gigDate ? dayjs(`${gigDate}T${gigTime}`).isBefore(dayjs()) : false
        return !isPast
      })
    }
    return receivedInvitations
  }, [receivedInvitations, invitationFilter])

  return (
    <>
      <Card radius="lg" withBorder p="sm" mb="md" mt={{ base: 2, sm: 8 }}>
        <Group justify="flex-start" gap={6} mb="xs">
          <Avatar
            size={25}
            radius="xl"
            src={
              profile?.avatar
                ? `https://ik.imagekit.io/mublin/tr:h-50,c-maintain_ratio/users/avatars/${profile?.avatar}`
                : `https://api.dicebear.com/10.x/initials/svg?seed=${profile?.full_name}`
            }
            component={Link}
            to={`/${profile?.username}`}
          />
          <Title order={3} fz="xl" fw={600} ml={2} lh={1}>
            Olá, {profile?.full_name?.split(' ')[0]}
          </Title>
        </Group>

        <Card.Section px="md">
          <Grid gap="xs">
            <Grid.Col span={7.3}>
              <Paper
                radius="md"
                p="xs"
                h={84}
                style={{
                  boxShadow: 'none',
                  background: subtleBg,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                }}
              >
                <Text size="xs" fw={500} tt="uppercase" c="dimmed">
                  Próxima gig
                  {/* {nextGig && `${dayjs(nextGig?.gig?.date).fromNow()}`} */}
                </Text>

                <Stack gap={1} mt={2}>
                  <Text size="sm" fw={500} lineClamp={1}>
                    {nextGig ? nextGig?.gig?.title : 'Nenhum evento futuro'}
                  </Text>
                  {nextGig && (
                    <>
                      <Group gap={4}>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {dayjs(nextGig?.gig?.date).format('DD [de] MMMM')}{' '}
                          <Text span>
                            {nextGig?.gig?.venue_city
                              ? `em ${nextGig.gig.venue_city.name}/${nextGig.gig.venue_city.region?.uf || ''}`
                              : nextGig?.gig?.venue_name || ''}
                          </Text>
                        </Text>
                      </Group>
                      <Group gap={4}>
                        <Text span size="10px" c="dimmed" lh={1}>
                          com
                        </Text>
                        <Avatar
                          src={`${PROJECT_IMAGE_PATH}/${nextGig?.gig?.projects?.id}/${nextGig?.gig?.projects?.picture}`}
                          size={20}
                          component={Link}
                          to={`/project/${nextGig?.gig?.projects?.slug}`}
                        />
                        <Text span size="10px" c="dimmed" lh={1}>
                          {nextGig?.gig?.projects?.name}
                        </Text>
                      </Group>
                    </>
                  )}
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={4.7}>
              <Popover
                width={240}
                position="bottom-end"
                shadow="md"
                opened={popoverOpened}
                onChange={setPopoverOpened}
                withArrow
                arrowPosition="center"
              >
                <Popover.Target>
                  <Card
                    radius="md"
                    p="xs"
                    h={84}
                    onClick={handleOpen}
                    style={{ boxShadow: 'none', background: subtleBg, cursor: 'pointer' }}
                  >
                    <Text size="xs" fw={500} tt="uppercase" c="dimmed">
                      {dayjs().format('MMMM/YY')}
                    </Text>
                    <Text size="sm" fw={500}>
                      {gigsThisMonth} gigs
                    </Text>
                    {!noGoal && goal ? (
                      <Box
                        mt={5}
                        mb={6}
                        h={3}
                        // bg={subtleBg2}
                        bg="light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-6))"
                        style={{ borderRadius: 999 }}
                      >
                        <Box
                          w={`${progress}%`}
                          h="100%"
                          bg="teal"
                          style={{ borderRadius: 999 }}
                        />
                      </Box>
                    ) : (
                      <Box mt={3} mb={6} h={4} />
                    )}
                    <Text size="11px" c="dimmed">
                      {noGoal || !goal
                        ? 'Definir meta'
                        : `Meta: ${goal} ${goal > 1 ? 'gigs' : 'gig'}/mês`}
                    </Text>
                  </Card>
                </Popover.Target>
                <Popover.Dropdown p="sm" onClick={(e) => e.stopPropagation()}>
                  <Stack gap="sm">
                    <Text size="xs" fw={500}>
                      Minha meta de gigs no mês
                    </Text>
                    <Slider
                      value={tempGoal}
                      onChange={setTempGoal}
                      min={1}
                      max={20}
                      step={1}
                      disabled={tempNoGoal}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 10, label: '10' },
                        { value: 20, label: '20' },
                      ]}
                    />
                    <Group justify="space-between" mt={14}>
                      <Text size="xs" c="dimmed">
                        Sem meta
                      </Text>
                      <Switch
                        size="sm"
                        checked={tempNoGoal}
                        onChange={(e) => setTempNoGoal(e.currentTarget.checked)}
                      />
                    </Group>
                    <Group gap="xs" grow>
                      <Button
                        variant="default"
                        size="xs"
                        onClick={() => setPopoverOpened(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="xs"
                        onClick={handleSaveGoal}
                        loading={saveGigGoalMutation.isPending}
                      >
                        Salvar
                      </Button>
                    </Group>
                  </Stack>
                </Popover.Dropdown>
              </Popover>
            </Grid.Col>
          </Grid>
        </Card.Section>

        <Divider variant="dashed" my="md" />

        <Center>
          <MiniCalendar
            value={miniCalendarCurrentDate}
            onChange={setMiniCalendarCurrentDate}
            numberOfDays={6}
            size="sm"
            locale="pt-br"
            getDayProps={(date) => {
              const iso = dayjs(date).format('YYYY-MM-DD')
              const isToday = iso === todayIso

              return {
                'data-has-gig': gigDatesSet.has(iso) || undefined,
                'data-is-today': isToday || undefined,
              }
            }}
          />
        </Center>

        <Box mt="md" id="gigs-list-view">
          <Title ta="center" order={3} fw={600} fz="lg" lh={1} mb={6}>
            {isSelectedToday
              ? `Hoje, ${weekDay}`
              : isSelectedTomorrow
                ? `Amanhã, ${weekDay}`
                : `${weekDayCapitalized}, ${dayjs(miniCalendarCurrentDate).locale('pt-br').format('DD [de] MMMM')}`}
          </Title>

          {isLoadingGigsForSelectedDay ? (
            <Text c="dimmed" ta="center" size="sm">
              Carregando gigs...
            </Text>
          ) : gigsForSelectedDay.length === 0 ? (
            <Text c="dimmed" ta="center" size="sm">
              Nenhuma gig nesta data
            </Text>
          ) : (
            <Table mt="sm">
              <Table.Tbody>
                {gigsForSelectedDay.map((item) => {
                  const isCanceled = item.gig?.is_canceled || item.gig?.is_canceled
                  return (
                    <Table.Tr
                      key={item.id}
                      onClick={() => navigate(`/gig/${item.gig.id}`)}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      <Table.Td px={0} py={2}>
                        <Group gap={4}>
                          {/* <IconCalendarEvent size={32} stroke={1.4} /> */}
                          <Avatar
                            src={`${PROJECT_IMAGE_PATH}/${item.gig?.project?.id}/${item.gig?.project?.picture}`}
                            size={50}
                            radius="md"
                            component={Link}
                            to={`/project/${item.gig?.project?.slug}`}
                          />
                          <Stack gap={3}>
                            {/* <Text size="sm" fw={500} c="var(--mantine-color-text)">
                            {item.gig.title}
                          </Text> */}
                            <Group gap={6}>
                              <Text
                                size="sm"
                                fw={500}
                                c={isCanceled ? 'dimmed' : 'var(--mantine-color-text)'}
                                style={{
                                  textDecoration: isCanceled ? 'line-through' : 'none',
                                }}
                              >
                                {item.gig?.type?.name} · {item.gig?.project?.name}
                              </Text>
                              {isCanceled && (
                                <Badge
                                  color="red"
                                  variant="filled"
                                  size="xs"
                                  leftSection={<IconCalendarCancel size={10} />}
                                >
                                  CANCELADA
                                </Badge>
                              )}
                            </Group>
                            {item.comboRoles?.length > 0 && (
                              <Group gap={4}>
                                <Avatar
                                  src={`${AVATAR_PATH}${profile.avatar}`}
                                  size={14}
                                />
                                <Text size="xs" lh={1}>
                                  {formatComboRoleNames(item.comboRoles)}
                                </Text>
                              </Group>
                            )}
                            <Group gap={6} wrap="wrap" align="center">
                              <Text size="xs" c="dimmed" lh={1}>
                                Início:{' '}
                                {item.gig.time_stage_start
                                  ? item.gig.time_stage_start.slice(0, 5)
                                  : ''}
                                {item.gig.time_stage_end &&
                                  ` · Fim: ${item.gig.time_stage_end.slice(0, 5)}`}
                              </Text>
                              {/* Badge só aparece 3h antes - key com nowTick pra forçar recálculo */}
                              <Box key={`${item.id}-${nowTick.format('HH:mm')}`}>
                                <GigUrgencyBadge gig={item.gig} />
                              </Box>
                            </Group>
                          </Stack>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          )}
        </Box>
      </Card>

      {/* <Divider mt="lg" opacity={0.6} /> */}

      <Box mt="md" mb="xs">
        <Group gap={6} mb={2} w="100%" justify="space-between" align="center">
          <Title order={3} fw={600} fz="lg">
            Convites para gigs ({filteredInvitations.length})
          </Title>

          {receivedInvitations.length > 0 && (
            <Select
              size="sm"
              variant="unstyled"
              w={120}
              placeholder="Filtrar"
              data={[
                { value: 'all', label: 'Todos' },
                { value: 'pending', label: 'Pendentes' },
              ]}
              value={invitationFilter}
              onChange={setInvitationFilter}
              allowDeselect={false}
              comboboxProps={{ withinPortal: false }}
            />
          )}
        </Group>

        {loadingReceivedInvitations && (
          <Card radius="md" withBorder p="sm" mt="xs">
            <Text c="dimmed" size="sm">
              Carregando convites...
            </Text>
          </Card>
        )}

        {!loadingReceivedInvitations &&
          filteredInvitations.length === 0 &&
          receivedInvitations.length > 0 && (
            <Card radius="md" withBorder p="sm" mb="md" mt="xs">
              <Text c="dimmed" size="sm">
                {invitationFilter === 'pending'
                  ? 'Nenhum convite pendente'
                  : 'Nenhum convite'}
              </Text>
            </Card>
          )}

        {filteredInvitations.length > 0 ? (
          <>
            {filteredInvitations.map((inv) => (
              <Card
                key={inv.id}
                component={Link}
                to={`/gig-invitation/${inv.id}`}
                radius="md"
                withBorder
                p="sm"
                mb="xs"
                mt="xs"
              >
                <Group justify="space-between">
                  <Group gap={6}>
                    <Avatar src={`${AVATAR_PATH}${inv.profiles.avatar}`} size={20} />
                    <Text size="xs" fw={200}>
                      enviado por {inv.profiles.full_name}{' '}
                      {inv?.created_at && `${dayjs(inv?.created_at).fromNow()}`}
                    </Text>
                  </Group>
                  {(() => {
                    const gigDate = inv?.gigs?.date
                    const gigTime = inv?.gigs?.time_stage_start || '23:59:59'
                    const isPastGig = gigDate
                      ? dayjs(`${gigDate}T${gigTime}`).isBefore(dayjs())
                      : false

                    if (isPastGig) {
                      return (
                        <Badge
                          variant="light"
                          size="xs"
                          color="red.9"
                          fw={300}
                          leftSection={<IconHourglassOff size={10} />}
                        >
                          passou
                        </Badge>
                      )
                    }

                    if (inv.status_request_appliant === 1) {
                      return (
                        <Badge
                          leftSection={<IconClock size={10} />}
                          variant="light"
                          size="xs"
                          color="mublinSecondary"
                          fw={300}
                        >
                          pendente
                        </Badge>
                      )
                    }

                    if (inv.status_request_appliant === 2) {
                      return (
                        <Badge
                          leftSection={<IconThumbUp size={10} />}
                          variant="light"
                          size="xs"
                          color="green"
                          fw={300}
                        >
                          aceito
                        </Badge>
                      )
                    }

                    if (inv.status_request_appliant === 3) {
                      return (
                        <Badge
                          leftSection={<IconThumbDown size={10} />}
                          variant="light"
                          size="xs"
                          color="red.9"
                          fw={300}
                        >
                          declinado
                        </Badge>
                      )
                    }

                    return null
                  })()}
                </Group>
                <Divider variant="dashed" my={8} />
                <Group gap={6} wrap="nowrap" align="flex-start">
                  <Stack gap={4}>
                    <Avatar
                      radius="md"
                      size={50}
                      src={`${PROJECT_IMAGE_PATH}${inv?.gigs?.projects?.id}/${inv?.gigs?.projects?.picture}`}
                    />
                    <Badge size="xs" fw={500} variant="filled" color="dark" w="100%">
                      {formatShortDate(inv?.gigs?.date)}
                    </Badge>
                  </Stack>
                  <Stack gap={1} w="100%">
                    <Title fz="md" fw={500} lh={1}>
                      Convite para ser {formatComboRoleNames(inv?.comboRoles)}
                    </Title>
                    {inv?.gigs?.title && <Text size="sm">{inv?.gigs?.title}</Text>}
                    <Text size="xs" c="dimmed">
                      Tipo: {inv?.gigs?.type?.name} · Projeto/Artista:{' '}
                      {inv?.gigs?.projects?.name}
                      {/* <Text span> · {inv?.gigs?.projects?.project_types.name_ptbr}</Text> */}
                    </Text>
                    {inv?.gigs?.description && (
                      <Text size="xs" c="dimmed" mt={2} lineClamp={2}>
                        {inv?.gigs?.description}
                      </Text>
                    )}
                  </Stack>
                </Group>
              </Card>
            ))}
          </>
        ) : (
          !loadingReceivedInvitations &&
          receivedInvitations.length === 0 && (
            <Card radius="md" withBorder p="sm" mb="md" mt={{ base: 2, sm: 8 }}>
              <Text c="dimmed" size="sm">
                Nenhum convite para gigs no momento
              </Text>
            </Card>
          )
        )}
      </Box>

      <Box mt="lg" mb="md">
        <BannerGigs />
      </Box>
    </>
  )
}
