import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchGigDetails, fetchGigApplicationDetails } from '../queries/gigs'
import { fetchSetlistTracks } from '../queries/setlists'
import AppNavbarMobile from '../components/AppNavbarMobile'
// prettier-ignore
import {
  Container, Group, Stack, Accordion,
  Affix, Anchor, Divider, Grid,
  Table, DataList, Paper,
  Title, Text,
  Badge, Button, ActionIcon,
  Alert, Spoiler, EmptyState,
  Avatar, Image, Loader,
  Menu, Textarea, ScrollArea,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
// prettier-ignore
import {
  IconClock, IconX,
  IconMoodSad, IconLink,
  IconDotsVertical,
  IconTrash, IconCheck, IconBan,
  IconCalendarCancel, 
  IconPlaylist, IconMusic,
} from '@tabler/icons-react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const VENUE_AVATAR_PATH =
  'https://ik.imagekit.io/mublin/venues/tr:h-200,c-maintain_ratio/'
const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'
const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

// ── Helpers ───────────────────────────────────────────────

function gigDate(gig) {
  return gig?.date ?? null
}

// function gigVenue(gig) {
//   if (!gig?.venue_name) {
//     return null
//   }
//   const city = gig?.venue_city?.name
//   const uf = gig?.venue_city?.regions?.uf
//   return `${gig.venue_name}${city ? ` · ${city}` : ''}${uf ? `/${uf}` : ''}`
// }

function gigVenueAddressRegion(gig) {
  if (gig?.venues?.id) {
    const city = gig?.venues?.cities?.name
    const regionName = gig?.venues?.cities?.regions?.name
    const regionUf = gig?.venues?.cities?.regions?.uf
    return `${city ? `${city}` : ''}${!regionUf && regionName ? `, ${regionName}` : ''}${regionUf ? `/${regionUf}` : ''}`
  } else {
    const city = gig?.venue_city?.name
    const regionName = gig?.venue_city?.regions?.name
    const regionUf = gig?.venue_city?.regions?.uf
    return `${city ? `${city}` : ''}${regionName ? `, ${regionName}` : ''}${regionUf ? `/${regionUf}` : ''}`
  }
}

// Agrupa gig_roles em combos (mesma pessoa, mais de uma função) — mesmo
// critério usado em gigs.js e no NewGig.jsx: raiz = primary_role_id, ou o
// próprio id quando a vaga é a principal. Cada grupo vem com a principal
// primeiro.
function groupGigRoles(gigRoles) {
  const groups = new Map()
  for (const role of gigRoles ?? []) {
    const rootId = role.primary_role_id || role.id
    if (!groups.has(rootId)) {
      groups.set(rootId, [])
    }
    groups.get(rootId).push(role)
  }
  return Array.from(groups.values()).map((members) =>
    [...members].sort((a, b) => {
      const aIsPrimary = !a.primary_role_id
      const bIsPrimary = !b.primary_role_id
      if (aIsPrimary === bIsPrimary) return 0
      return aIsPrimary ? -1 : 1
    }),
  )
}

// Junta os nomes das funções de um grupo: "Guitarrista", "Guitarrista e
// Backing Vocal", "Guitarrista, Backing Vocal e Produtor Musical"
function formatRoleNames(roles) {
  const names = (roles ?? []).map((r) => r?.roles?.description_ptbr).filter(Boolean)
  if (names.length === 0) {
    return ''
  }
  if (names.length === 1) {
    return names[0]
  }
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
}

function daysUntil(dateStr) {
  if (!dateStr) {
    return null
  }
  return dayjs(dateStr).diff(dayjs(), 'day')
}

function UrgencyBadge({ dateStr }) {
  const days = daysUntil(dateStr)
  const daysText = days === 1 ? 'dia' : 'dias'
  if (days === null) {
    return null
  }

  if (days < 0) {
    return (
      <Badge size="xs" color="gray" variant="light" mb="xs">
        Passou
      </Badge>
    )
  }
  if (days === 0) {
    return (
      <Badge size="xs" color="green.9" variant="filled" mb="xs">
        Hoje
      </Badge>
    )
  }
  if (days <= 2) {
    return (
      <Badge size="xs" color="red" variant="filled" mb="xs">
        em {days} {daysText}
      </Badge>
    )
  }
  if (days <= 7) {
    return (
      <Badge size="xs" color="orange" variant="filled" mb="xs">
        em {days} {daysText}
      </Badge>
    )
  }
  if (days <= 30) {
    return (
      <Badge size="xs" color="yellow" variant="filled" mb="xs">
        em {days} {daysText}
      </Badge>
    )
  }
  return (
    <Badge size="xs" color="gray" variant="filled" mb="xs">
      {dayjs(dateStr).fromNow()}
    </Badge>
  )
}

function formatTrackDuration(seconds) {
  if (!seconds || seconds <= 0) return '--:--'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

function formatTotalDuration(seconds) {
  if (!seconds || seconds <= 0) return null

  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}min`
  }

  return `${minutes} min`
}

export default function GigApplicationDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()

  const {
    data: gig = [],
    isLoading: loadingGig,
    isSuccess,
  } = useQuery({
    queryKey: ['gig-details', id],
    queryFn: () => fetchGigDetails(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 4,
  })

  const {
    data: gigSetlist,
    isLoading: loadingGigSetlist,
    isError: gigSetlistError,
  } = useQuery({
    queryKey: ['setlist-details', gig?.setlist_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('setlists')
        .select('id, name, project_id')
        .eq('id', gig.setlist_id)
        .single()

      if (error) throw error

      return data
    },
    enabled: !!gig?.setlist_id,
    staleTime: 1000 * 60 * 4,
  })

  const {
    data: setlistTracks = [],
    isLoading: loadingSetlistTracks,
    isError: setlistTracksError,
  } = useQuery({
    queryKey: ['setlist-tracks', gig?.setlist_id],
    queryFn: () => fetchSetlistTracks(gig.setlist_id),
    enabled: !!gig?.setlist_id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: gigApplications = [], isLoading: loadingGigApplicationDetails } =
    useQuery({
      queryKey: ['user-gig-application', user?.id, id],
      queryFn: () => fetchGigApplicationDetails(user.id, id),
      enabled: !!user?.id && !!id,
      staleTime: 1000 * 60 * 4,
    })

  const nextDays = daysUntil(gigDate(gig))

  // Lista completa de candidaturas para o modal de delete
  // IMPORTANTE: usar a mesma sintaxe que já funciona em fetchGigApplicationDetails
  // Em gig 18 você tem 3 candidaturas do próprio dono (combo roles) - por isso
  // reutilizamos gigApplications quando allApplications estiver vazio por RLS
  const { data: allApplicationsRaw = [] } = useQuery({
    queryKey: ['gig-all-applications', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gig_applications')
        .select(
          `
          id,
          created_at,
          status_request_appliant,
          status_request_gig_owner,
          profile_id,
          profiles:profile_id (
            id,
            username,
            full_name,
            avatar
          ),
          gig_roles:gig_role_id (
            id,
            primary_role_id,
            roles ( description_ptbr )
          )
        `,
        )
        .eq('gig_id', id)
        .order('created_at', { ascending: false })
      if (error) {
        console.warn('Erro ao buscar allApplications (pode ser RLS):', error)
        throw error
      }
      return data
    },
    enabled: !!id,
    retry: false,
  })

  // Fallback inteligente: se RLS bloqueou a busca geral, usa o que já funciona
  // (fetchGigApplicationDetails = candidaturas do usuário logado nessa gig)
  // Para a gig 18, isso já traz as 3 linhas do CSV
  const allApplications =
    allApplicationsRaw.length > 0 ? allApplicationsRaw : gigApplications

  const hasAnyApplication = allApplications.length > 0

  const isOwner =
    gig?.profiles?.username && profile?.username
      ? gig?.profiles?.username === profile?.username
      : false
  const isCanceled = gig?.is_canceled === true

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      notifications.show({
        title: 'Link copiado!',
        message: 'URL copiada',
        color: 'green',
        icon: <IconCheck size={16} />,
      })
    } catch (e) {
      notifications.show({ title: 'Erro ao copiar', message: e.message, color: 'red' })
    }
  }

  const handleCancelGig = () => {
    if (isCanceled) return

    // Mantine modals.openConfirmModal NÃO re-renderiza quando um state externo muda.
    // Por isso seu value={cancelReason} + setCancelReason não mostrava digitação.
    // Solução: usar componente interno com state próprio ou ref + defaultValue (uncontrolled).
    // Aqui vamos com ref + uncontrolled que é o mais simples e funciona.

    let currentReason = ''

    modals.openConfirmModal({
      title: 'Cancelar esta gig?',
      children: (
        <Stack gap="xs">
          <Text size="sm">
            Quem já se candidatou ou foi aceito verá a gig como <b>CANCELADA</b> no
            painel. Essa ação pode ser desfeita.
          </Text>
          <Textarea
            placeholder="Motivo do cancelamento (opcional) - ex: Evento adiado, problema no local..."
            defaultValue=""
            onChange={(e) => {
              currentReason = e.currentTarget.value
            }}
            autosize
            minRows={2}
            maxRows={4}
            data-autofocus
          />
        </Stack>
      ),
      labels: { confirm: 'Sim, cancelar gig', cancel: 'Voltar' },
      confirmProps: { color: 'orange', leftSection: <IconBan size={16} /> },
      centered: true,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('gigs')
            .update({
              is_canceled: true,
              canceled_at: new Date().toISOString(),
              canceled_by: user.id,
              cancellation_reason: currentReason || null,
            })
            .eq('id', gig.id)
          if (error) throw error
          notifications.show({
            title: 'Gig cancelada',
            message: 'Os músicos serão notificados como cancelada',
            color: 'orange',
            icon: <IconCheck size={16} />,
          })
          window.location.reload()
        } catch (err) {
          notifications.show({
            title: 'Erro ao cancelar',
            message: err.message,
            color: 'red',
          })
        }
      },
    })
  }

  const handleReactivateGig = async () => {
    try {
      const { error } = await supabase
        .from('gigs')
        .update({
          is_canceled: false,
          canceled_at: null,
          canceled_by: null,
          cancellation_reason: null,
        })
        .eq('id', gig.id)
      if (error) throw error
      notifications.show({ title: 'Gig reativada', color: 'green' })
      window.location.reload()
    } catch (e) {
      notifications.show({ title: 'Erro', message: e.message, color: 'red' })
    }
  }

  const handleDeleteGig = () => {
    const count = allApplications.length

    modals.openConfirmModal({
      title: 'Tem certeza que deseja deletar esta gig?',
      size: 'lg',
      children: (
        <Stack gap="sm">
          <Text size="sm">
            Todas as informações da gig e vagas relacionadas serão{' '}
            <b>deletadas permanentemente</b> do histórico de todos os usuários. Essa ação
            não pode ser desfeita.
          </Text>

          {count > 0 ? (
            <>
              <Alert
                color="red"
                variant="light"
                p="xs"
                title={`${count} ${count === 1 ? 'candidatura será perdida' : 'candidaturas serão perdidas'}`}
                icon={<IconTrash size={16} />}
              >
                <Text size="xs">
                  Os seguintes músicos já se candidataram ou foram convidados e perderão o
                  registro desta gig no painel deles:
                </Text>
              </Alert>

              <ScrollArea h={count > 4 ? 180 : 'auto'} type="auto" offsetScrollbars>
                <Stack gap={6}>
                  {allApplications.map((app) => {
                    const prof = app.profiles || profile
                    const roleName =
                      app.gig_roles?.roles?.description_ptbr ||
                      app.gig_roles?.roles?.description_ptbr ||
                      'Vaga'
                    return (
                      <Group key={app.id} gap={8} wrap="nowrap">
                        <Avatar
                          src={
                            prof?.avatar
                              ? `https://ik.imagekit.io/mublin/users/avatars/tr:h-60,w-60,c-maintain_ratio/${prof.avatar}`
                              : undefined
                          }
                          size={28}
                          radius="xl"
                        />
                        <Stack gap={0} style={{ flex: 1 }}>
                          <Text size="sm" fw={500} lh={1}>
                            {prof?.full_name || prof?.username}
                            <Text span size="xs" c="dimmed">
                              {' '}
                              @{prof?.username}
                            </Text>
                          </Text>
                          <Group gap={4}>
                            <Text size="xs" c="dimmed" lh={1}>
                              {roleName} •{' '}
                              {new Date(app.created_at).toLocaleDateString('pt-BR')}
                            </Text>
                            {app.status_request_appliant === 2 && (
                              <Badge size="xs" color="green" variant="light">
                                aceito
                              </Badge>
                            )}
                          </Group>
                        </Stack>
                      </Group>
                    )
                  })}
                </Stack>
              </ScrollArea>

              <Alert color="orange" variant="light" p="xs">
                <Text size="xs">
                  Considere usar <b>Cancelar gig</b> ao invés de Deletar. No cancelamento,
                  os músicos continuam vendo a gig como <b>CANCELADA</b> no histórico.
                </Text>
              </Alert>
            </>
          ) : (
            <Alert color="gray" variant="light" p="xs">
              <Text size="xs">
                Nenhuma candidatura encontrada para esta gig. A exclusão afetará apenas o
                projeto.
              </Text>
            </Alert>
          )}
        </Stack>
      ),
      labels: {
        confirm:
          count > 0
            ? `Sim, deletar mesmo com ${count} candidatura(s)`
            : 'Deletar permanentemente',
        cancel: 'Voltar',
      },
      confirmProps: { color: 'red', leftSection: <IconTrash size={16} /> },
      cancelProps: { variant: 'default' },
      centered: true,
      onConfirm: async () => {
        try {
          await supabase
            .from('gig_roles')
            .update({ primary_role_id: null })
            .eq('gig_id', gig.id)
          const { error: rErr } = await supabase
            .from('gig_roles')
            .delete()
            .eq('gig_id', gig.id)
          if (rErr) throw rErr
          const { error: gErr } = await supabase.from('gigs').delete().eq('id', gig.id)
          if (gErr) throw gErr
          notifications.show({
            title: 'Gig deletada',
            message: 'Removida permanentemente do histórico de todos',
            color: 'green',
            icon: <IconCheck size={16} />,
          })
          window.location.href = '/'
        } catch (err) {
          notifications.show({
            title: 'Erro ao deletar',
            message: err.message,
            color: 'red',
          })
        }
      },
    })
  }

  const dataListDetails = [
    {
      label: 'Data:',
      value: gigDate(gig)
        ? `${dayjs(gigDate(gig)).format('dddd, D [de] MMMM [de] YYYY')}${
            nextDays > 0 ? ` (em ${nextDays} dias)` : ''
          }`
        : 'Não informada',
      disabled: !gigDate(gig),
    },
    {
      label: 'Horário:',
      value:
        gig?.time_stage_start || gig?.time_stage_end
          ? `das ${gig?.time_stage_start?.slice(0, 5) || '--:--'} às ${
              gig?.time_stage_end?.slice(0, 5) || '--:--'
            }`
          : 'Não informado',
      disabled: !gig?.time_stage_start && !gig?.time_stage_end,
    },
    // {
    //   label: 'Local:',
    //   value: (
    //     <Text
    //       size="sm"
    //       c="var(--mantine-color-text)"
    //       component={Link}
    //       to={`/venue/${gig?.venues?.slug}`}
    //     >
    //       {gigVenue(gig) || 'Não informado'}
    //     </Text>
    //   ),
    //   disabled: !gigVenue(gig),
    // },
    {
      label: 'Tipo da gig:',
      value: gig?.event_types?.name || 'Não informado',
      disabled: !gig?.event_types?.name,
    },
    {
      label: 'Remunerado:',
      value: gig?.has_remuneration ? 'Sim' : 'Não',
    },
    {
      label: 'Dress code:',
      value: gig?.dress_code_types?.name || 'Não informado',
      disabled: !gig?.dress_code_types?.name,
    },
  ]

  const loggedUserIsTheGigCreator = gig?.profiles?.username === profile.username

  const totalSetlistDuration = setlistTracks.reduce(
    (total, track) => total + (Number(track.duration_seconds) || 0),
    0,
  )

  const tracksWithDuration = setlistTracks.filter(
    (track) => Number(track.duration_seconds) > 0,
  )

  const hasCompleteSetlistDuration =
    setlistTracks.length > 0 && tracksWithDuration.length === setlistTracks.length

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{isSuccess ? `${gig?.title} · Mublin` : 'Mublin'}</title>
        <link rel="canonical" href={`https://mublin.com/gig/${gig?.slug}`} />
        <meta name="description" content={`Gig '${gig?.title}' no Mublin`} />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName={`Detalhes da gig`} />
      </Affix>

      <Container size="xl" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <Stack>
          {loadingGig ? (
            <Text mt="lg" ta="center" c="dimmed">
              Carregando...
            </Text>
          ) : isSuccess ? (
            <Paper p="sm" radius="lg" withBorder>
              <Stack gap={2}>
                <Stack gap={0} mb={8}>
                  <Group align="flex-start" justify="space-between">
                    <Group gap="xs">
                      <UrgencyBadge dateStr={gigDate(gig)} />
                      {isCanceled && (
                        <Badge
                          color="red"
                          variant="filled"
                          size="md"
                          mb="xs"
                          leftSection={<IconCalendarCancel size={12} />}
                        >
                          CANCELADA
                        </Badge>
                      )}
                    </Group>
                    <Menu
                      mr="xs"
                      shadow="md"
                      width={210}
                      position="bottom-end"
                      withinPortal
                    >
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconDotsVertical size={22} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconLink size={14} />}
                          onClick={handleCopyUrl}
                        >
                          Copiar URL
                        </Menu.Item>
                        {isOwner && !isCanceled && (
                          <>
                            <Menu.Divider />
                            <Menu.Item
                              color="orange"
                              leftSection={<IconBan size={14} />}
                              onClick={handleCancelGig}
                            >
                              Cancelar gig
                            </Menu.Item>
                          </>
                        )}
                        {isOwner && isCanceled && (
                          <>
                            <Menu.Divider />
                            <Menu.Item
                              leftSection={<IconCheck size={14} />}
                              onClick={handleReactivateGig}
                            >
                              Reativar gig
                            </Menu.Item>
                          </>
                        )}
                        {isOwner && (
                          <>
                            <Menu.Divider />
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={handleDeleteGig}
                            >
                              Deletar gig
                            </Menu.Item>
                          </>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                  <Title
                    order={1}
                    fw={500}
                    fz="h2"
                    w="100%"
                    style={{
                      textDecoration: isCanceled ? 'line-through' : 'none',
                      opacity: isCanceled ? 0.7 : 1,
                    }}
                  >
                    {gig?.title}
                  </Title>
                  {isCanceled && (
                    <Alert
                      color="red"
                      variant="light"
                      mt="sm"
                      mb="xs"
                      p="xs"
                      title={`Gig cancelada ${gig?.canceled_at ? `em ${new Date(gig.canceled_at).toLocaleDateString('pt-BR')}` : ''}`}
                      icon={<IconCalendarCancel size={22} />}
                    >
                      <Stack gap={4}>
                        {gig?.cancellation_reason ? (
                          <Text size="sm">
                            <b>Motivo:</b> {gig.cancellation_reason}
                          </Text>
                        ) : (
                          <Text size="sm" c="dimmed">
                            Sem motivo informado.
                          </Text>
                        )}
                        <Text size="xs" c="dimmed">
                          Esta gig permanecerá no histórico com status CANCELADA para
                          todos os envolvidos
                        </Text>
                      </Stack>
                    </Alert>
                  )}
                  {gig?.events?.id && (
                    <Text size="xs" c="dimmed">
                      parte do evento{' '}
                      <Anchor component={Link} to={`/event/${gig.events.slug}`} size="xs">
                        {gig.events.name}
                      </Anchor>
                    </Text>
                  )}
                  <Group gap={6} align="center" wrap="nowrap" mb="xs">
                    <Text size="xs" c="dimmed" lh={1}>
                      evento criado por
                    </Text>
                    <Group gap={5} align="center" wrap="nowrap">
                      <Avatar
                        component={Link}
                        to={`/${gig?.profiles?.username}`}
                        src={
                          loggedUserIsTheGigCreator
                            ? AVATAR_PATH + profile.avatar
                            : AVATAR_PATH + gig?.profiles?.avatar
                        }
                        radius="xl"
                        size={18}
                        title={gig?.profiles?.username}
                      />
                      <Anchor
                        component={Link}
                        to={`/${gig?.profiles?.username}`}
                        fz="xs"
                        fw={500}
                        lh={1}
                        c="dimmed"
                        underline="hover"
                      >
                        {loggedUserIsTheGigCreator ? 'mim' : gig?.profiles?.full_name}
                      </Anchor>
                    </Group>
                    <Text size="xs" c="dimmed" lh={1}>
                      · {dayjs(gig?.created_at).fromNow()}
                    </Text>
                  </Group>
                  <Group my={4} gap="xs">
                    <Avatar
                      size={40}
                      radius="md"
                      src={
                        gig?.projects?.picture
                          ? `${PROJECT_AVATAR_PATH}/${gig?.projects?.id}/tr:h-80,w-80,c-maintain_ratio/${gig?.projects?.picture}`
                          : undefined
                      }
                      alt={gig?.projects?.name}
                    />
                    <Stack gap={0}>
                      <Text
                        c="var(--mantine-color-text)"
                        size="md"
                        fw={500}
                        component={Link}
                        to={`/project/${gig?.projects?.slug}`}
                      >
                        {gig?.projects?.name}
                      </Text>
                      <Text size="xs" c="dimmed" lh={1}>
                        {gig?.projects?.project_types?.name_ptbr}
                      </Text>
                    </Stack>
                  </Group>
                </Stack>
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <DataList p={0} gap={4} size="sm" orientation="horizontal">
                      {dataListDetails.map((item) => (
                        <DataList.Item key={item.label}>
                          <DataList.ItemLabel miw={94}>{item.label}</DataList.ItemLabel>
                          <DataList.ItemValue c={item.disabled ? 'dimmed' : undefined}>
                            {item.value}
                          </DataList.ItemValue>
                        </DataList.Item>
                      ))}
                    </DataList>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Divider my="xs" hiddenFrom="sm" />
                    {/* {
                      label: 'Local',
                      value: (
                        <Text
                          size="sm"
                          c="var(--mantine-color-text)"
                          component={Link}
                          to={`/venue/${gig?.venues?.slug}`}
                        >
                          {gigVenue(gig) || 'Não informado'}
                        </Text>
                      ),
                      disabled: !gigVenue(gig),
                    }, */}
                    <DataList p={0} gap={4} size="sm" orientation="horizontal">
                      <DataList.Item style={{ alignItems: 'flex-start' }}>
                        <DataList.ItemLabel miw={48}>Local:</DataList.ItemLabel>
                        <DataList.ItemValue flex={1}>
                          <Group gap="xs">
                            {gig?.venues?.picture_url && (
                              <Avatar
                                radius="md"
                                src={VENUE_AVATAR_PATH + gig?.venues?.picture_url}
                                size={60}
                                component={Link}
                                to={`/venue/${gig?.venues?.slug}`}
                              />
                            )}
                            <Stack gap={2}>
                              {gig?.venues?.id ? (
                                <>
                                  <Text
                                    w="fit-content"
                                    size="sm"
                                    fw={600}
                                    c="var(--mantine-color-text)"
                                    component={Link}
                                    to={`/venue/${gig?.venues?.slug}`}
                                  >
                                    {gig?.venues?.name}
                                  </Text>
                                  <Text w="fit-content" size="xs">
                                    {gig?.venues?.address} {gig?.venues?.address_number}
                                    {gig?.venues?.neighborhood &&
                                      `, ${gig?.venues?.neighborhood}`}
                                  </Text>
                                </>
                              ) : (
                                <>
                                  <Text w="fit-content" size="sm">
                                    {gig?.venue_name || 'Não informado'}
                                  </Text>
                                  <Text size="xs" mt={3} c="dimmed">
                                    {gig?.venue_address}
                                  </Text>
                                </>
                              )}
                              <Text size="xs" c="dimmed">
                                {gigVenueAddressRegion(gig)}
                              </Text>
                            </Stack>
                          </Group>
                        </DataList.ItemValue>
                      </DataList.Item>
                    </DataList>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Paper>
          ) : (
            <EmptyState
              icon={<IconMoodSad />}
              title="Gig não encontrada"
              description="Talvez ela tenha sido removida ou você tenha digitado um endereço incorreto."
            >
              <EmptyState.Actions>
                <Button variant="default" component={Link} to="/search">
                  Encontrar gigs
                </Button>
              </EmptyState.Actions>
            </EmptyState>
          )}

          {isSuccess && (
            <Paper p="sm" radius="lg" withBorder>
              <Title order={5}>Descrição</Title>
              {gig?.description ? (
                <Spoiler
                  mt="xs"
                  maxHeight={60}
                  showLabel={<Text size="sm">...ver mais</Text>}
                  hideLabel={<Text size="sm">...ver menos</Text>}
                >
                  <Text size="sm">{gig?.description}</Text>
                </Spoiler>
              ) : (
                <Text size="sm" c="dimmed" mt={4}>
                  Descrição não fornecida
                </Text>
              )}
            </Paper>
          )}

          {isSuccess && gig?.setlist_id ? (
            <Paper p="sm" radius="lg" withBorder>
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <IconPlaylist size={20} />

                    <Title order={5}>Repertório</Title>
                  </Group>

                  {!loadingSetlistTracks && !setlistTracksError && (
                    <Badge variant="light" color="gray">
                      {setlistTracks.length}{' '}
                      {setlistTracks.length === 1 ? 'música' : 'músicas'}
                    </Badge>
                  )}
                </Group>

                {loadingGigSetlist ? (
                  <Text size="xs" c="dimmed">
                    Carregando repertório...
                  </Text>
                ) : (
                  gigSetlist && (
                    <Text size="sm" fw={500}>
                      <Text span fw={300}>
                        Setlist:
                      </Text>{' '}
                      {gigSetlist.name}
                    </Text>
                  )
                )}

                {(gigSetlistError || setlistTracksError) && (
                  <Alert color="red" variant="light">
                    Não foi possível carregar o repertório desta gig.
                  </Alert>
                )}

                {loadingSetlistTracks && (
                  <Group justify="center" py="md">
                    <Loader size="sm" />
                  </Group>
                )}

                {!loadingSetlistTracks &&
                  !setlistTracksError &&
                  setlistTracks.length === 0 && (
                    <Text size="sm" c="dimmed">
                      Esta setlist ainda não possui músicas cadastradas.
                    </Text>
                  )}

                {!loadingSetlistTracks &&
                  !setlistTracksError &&
                  setlistTracks.length > 0 && (
                    <Stack gap={0}>
                      {setlistTracks.map((track, index) => (
                        <Group
                          key={track.setlist_track_id}
                          justify="space-between"
                          align="center"
                          wrap="nowrap"
                          gap="xs"
                          py="xs"
                          style={{
                            borderBottom:
                              index < setlistTracks.length - 1
                                ? '1px solid var(--mantine-color-default-border)'
                                : 'none',
                          }}
                        >
                          <Text
                            size="xs"
                            c="dimmed"
                            w={20}
                            ta="center"
                            style={{ flexShrink: 0 }}
                          >
                            {index + 1}
                          </Text>

                          {track.cover_image ? (
                            <Image
                              src={track.cover_image}
                              w={42}
                              h={42}
                              radius="sm"
                              fit="cover"
                              fallbackSrc={null}
                            />
                          ) : (
                            <Paper
                              w={42}
                              h={42}
                              radius="sm"
                              bg="var(--mantine-color-default-hover)"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <IconMusic size={18} />
                            </Paper>
                          )}

                          <Stack gap={3} style={{ flex: 1, minWidth: 0 }}>
                            <Text size="sm" fw={500} lineClamp={1}>
                              {track.title}
                            </Text>

                            <Group gap={6}>
                              {track.is_cover && (
                                <Badge size="xs" variant="light" color="teal">
                                  Cover
                                </Badge>
                              )}

                              {track.notes && (
                                <Text
                                  size="xs"
                                  c="dimmed"
                                  lineClamp={1}
                                  title={track.notes}
                                >
                                  {track.notes}
                                </Text>
                              )}
                            </Group>
                          </Stack>

                          <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                            {formatTrackDuration(track.duration_seconds)}
                          </Text>
                        </Group>
                      ))}

                      {totalSetlistDuration > 0 && (
                        <>
                          <Divider my="xs" />

                          <Group justify="space-between">
                            <Text size="xs" c="dimmed">
                              {hasCompleteSetlistDuration
                                ? 'Duração total estimada'
                                : 'Duração parcial conhecida'}
                            </Text>

                            <Text size="sm" fw={500}>
                              {formatTotalDuration(totalSetlistDuration)}
                            </Text>
                          </Group>
                        </>
                      )}
                    </Stack>
                  )}
              </Stack>
            </Paper>
          ) : (
            <Paper p="sm" radius="lg" withBorder>
              <Title order={5}>Repertório</Title>
              <Text size="sm" c="dimmed" mt={4}>
                Nenhuma setlist vinculada a essa gig até o momento
              </Text>
            </Paper>
          )}

          {gig?.id && (
            <Paper p="sm" radius="lg" withBorder>
              <Title order={5} mb="sm">
                Vagas para esta gig
              </Title>

              {!loadingGig && !loadingGigApplicationDetails && (
                <Accordion
                  variant="separated"
                  radius="md"
                  multiple
                  styles={{
                    item: {
                      border: '1px solid var(--mantine-color-default-border)',
                      overflow: 'hidden',
                    },
                    control: {
                      padding: '12px',
                    },
                    content: {
                      padding: '12px',
                      paddingTop: 0,
                    },
                  }}
                >
                  {groupGigRoles(gig?.gig_roles).map((group) => {
                    const primary = group[0]
                    const isCombo = group.length > 1

                    const myApplicationInGroup = gigApplications.find((app) =>
                      group.some((r) => r.id === app.gig_roles?.id),
                    )

                    const combinedDescription = group
                      .filter((r) => r.description)
                      .map((r) =>
                        isCombo
                          ? `${r.roles?.description_ptbr}: ${r.description}`
                          : r.description,
                      )
                      .join('\n\n')

                    return (
                      <Accordion.Item key={primary.id} value={String(primary.id)}>
                        <Accordion.Control py={0} px="md">
                          <Stack gap={6}>
                            <Group gap="xs" align="center">
                              <Text size="xl" fw={500}>
                                {formatRoleNames(group)}
                              </Text>

                              {isCombo && (
                                <Badge size="xs" variant="light" color="grape">
                                  Funções combinadas
                                </Badge>
                              )}
                            </Group>

                            <Group gap={6}>
                              {gig?.has_remuneration && !primary.is_filled && (
                                <Badge variant="light" size="sm" color="lime">
                                  {primary.fee
                                    ? primary.fee.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      })
                                    : 'Cachê não disponível'}
                                </Badge>
                              )}

                              {primary.is_filled ? (
                                <Badge variant="light" size="sm" color="gray">
                                  Vaga preenchida
                                </Badge>
                              ) : (
                                <Badge variant="light" size="sm" color="teal">
                                  Vaga aberta
                                </Badge>
                              )}

                              {myApplicationInGroup && (
                                <Badge
                                  variant="light"
                                  size="sm"
                                  color="blue"
                                  leftSection={<IconCheck size={11} />}
                                >
                                  Você se candidatou
                                </Badge>
                              )}
                            </Group>
                          </Stack>
                        </Accordion.Control>

                        <Accordion.Panel>
                          <Stack gap="sm">
                            <Divider />

                            {primary.is_filled ? (
                              <Alert variant="light" color="lime" p="xs">
                                Esta vaga já foi preenchida!
                              </Alert>
                            ) : (
                              <Alert
                                variant="light"
                                color="gray"
                                p="xs"
                                icon={<IconClock size={16} />}
                              >
                                O criador da vaga ainda está avaliando candidaturas.
                              </Alert>
                            )}

                            <Table
                              verticalSpacing={4}
                              horizontalSpacing={0}
                              fz="sm"
                              variant="vertical"
                              layout="fixed"
                              withRowBorders={false}
                            >
                              <Table.Tbody>
                                {group.map((r) => (
                                  <Table.Tr key={r.id}>
                                    <Table.Th
                                      bg="transparent"
                                      w={140}
                                      c="dimmed"
                                      fw={400}
                                    >
                                      {isCombo
                                        ? r.roles?.description_ptbr
                                        : 'Nível desejado'}
                                    </Table.Th>

                                    <Table.Td>
                                      {r.experience_levels?.name_pt || 'Não informado'}
                                    </Table.Td>
                                  </Table.Tr>
                                ))}

                                {!primary.is_filled && (
                                  <Table.Tr>
                                    <Table.Th bg="transparent" c="dimmed" fw={400}>
                                      Cachê
                                    </Table.Th>

                                    <Table.Td>
                                      {primary.fee
                                        ? primary.fee.toLocaleString('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                          })
                                        : 'Não disponível'}

                                      {isCombo && (
                                        <Text span size="xs" c="dimmed">
                                          {' '}
                                          (combinado — cobre todas as funções acima)
                                        </Text>
                                      )}
                                    </Table.Td>
                                  </Table.Tr>
                                )}

                                {group
                                  .filter((r) => r.is_sub)
                                  .map((r) => (
                                    <Table.Tr key={`sub-${r.id}`}>
                                      <Table.Th bg="transparent" c="dimmed" fw={400}>
                                        Substituindo
                                        {isCombo ? ` (${r.roles?.description_ptbr})` : ''}
                                      </Table.Th>

                                      <Table.Td>
                                        <Group gap={6}>
                                          <Avatar
                                            size="xs"
                                            radius="xl"
                                            src={
                                              r.profiles?.avatar
                                                ? `https://ik.imagekit.io/mublin/users/avatars/tr:h-60,w-60,c-maintain_ratio/${r.profiles.avatar}`
                                                : undefined
                                            }
                                          />

                                          <Text size="sm">
                                            {r.sub_for
                                              ? r.profiles?.username
                                              : 'Nome não disponível'}
                                          </Text>
                                        </Group>
                                      </Table.Td>
                                    </Table.Tr>
                                  ))}
                              </Table.Tbody>
                            </Table>

                            <Stack gap={4}>
                              <Text size="sm">Sobre a vaga</Text>

                              <Text
                                size="sm"
                                c={combinedDescription ? undefined : 'dimmed'}
                                style={{ whiteSpace: 'pre-line' }}
                              >
                                {combinedDescription || 'Nenhuma descrição fornecida'}
                              </Text>
                            </Stack>

                            {myApplicationInGroup && (
                              <>
                                <Divider />

                                <Stack gap="xs">
                                  <Text size="xs">
                                    <IconCheck
                                      color="green"
                                      size={14}
                                      style={{
                                        verticalAlign: 'middle',
                                        marginRight: 4,
                                      }}
                                    />
                                    Você aplicou para esta vaga em{' '}
                                    {dayjs(myApplicationInGroup.created_at).format(
                                      'D [de] MMMM [de] YYYY',
                                    )}
                                  </Text>

                                  <Button
                                    size="xs"
                                    color="red"
                                    radius="md"
                                    variant="light"
                                    leftSection={<IconX size={14} stroke={2} />}
                                  >
                                    Retirar meu interesse
                                  </Button>
                                </Stack>
                              </>
                            )}
                          </Stack>
                        </Accordion.Panel>
                      </Accordion.Item>
                    )
                  })}
                </Accordion>
              )}
            </Paper>
          )}
        </Stack>
      </Container>
    </>
  )
}
