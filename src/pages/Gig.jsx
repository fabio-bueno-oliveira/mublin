import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchGigDetails, fetchGigApplicationDetails } from '../queries/gigs'
import AppNavbarMobile from '../components/AppNavbarMobile'
// prettier-ignore
import {
  Container, Group, Stack,
  Affix, Anchor, Divider,
  Table, DataList, Paper, Modal,
  Title, Text,
  Badge, Button, ActionIcon,
  Avatar, Alert, Spoiler,
  EmptyState,
  Menu, Textarea, ScrollArea,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import {
  IconClock,
  IconEye,
  IconX,
  IconMoodSad,
  IconDotsVertical,
  IconLink,
  IconTrash,
  IconCheck,
  IconCalendarCancel,
  IconBan,
} from '@tabler/icons-react'
import { supabase } from '../lib/supabaseClient'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'
const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

// ── Helpers ───────────────────────────────────────────────

function gigDate(gig) {
  return gig?.date ?? null
}

function gigVenue(gig) {
  if (!gig?.venue_name) {
    return null
  }
  const city = gig?.venue_city?.name
  const uf = gig?.venue_city?.regions?.uf
  return `${gig.venue_name}${city ? ` · ${city}` : ''}${uf ? `/${uf}` : ''}`
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
  if (days === null) {
    return null
  }

  if (days < 0) {
    return (
      <Badge size="md" color="gray" variant="light" mb="xs">
        Passou
      </Badge>
    )
  }
  if (days === 0) {
    return (
      <Badge size="md" color="green.9" variant="filled" mb="xs">
        Hoje
      </Badge>
    )
  }
  if (days <= 2) {
    return (
      <Badge size="md" color="red" variant="light" mb="xs">
        em {days} dias
      </Badge>
    )
  }
  if (days <= 7) {
    return (
      <Badge size="md" color="orange" variant="light" mb="xs">
        em {days} dias
      </Badge>
    )
  }
  if (days <= 30) {
    return (
      <Badge size="md" color="yellow" variant="light" mb="xs">
        em {days} dias
      </Badge>
    )
  }
  return (
    <Badge size="sm" color="gray" variant="light" mb="xs">
      {dayjs(dateStr).fromNow()}
    </Badge>
  )
}

export default function GigApplicationDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()

  const [roleDetailOpened, { open: openRoleDetail, close: closeRoleDetail }] =
    useDisclosure(false)
  const [selectedRoleGroup, setSelectedRoleGroup] = useState(null)
  // cancelReason capturado via ref dentro do modal (ver handleCancelGig)

  const handleOpenModalRoleDetail = (group) => {
    setSelectedRoleGroup(group)
    openRoleDetail()
  }

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
      label: 'Data',
      value: gigDate(gig)
        ? `${dayjs(gigDate(gig)).format('dddd, D [de] MMMM [de] YYYY')}${
            nextDays > 0 ? ` (em ${nextDays} dias)` : ''
          }`
        : 'Não informada',
      disabled: !gigDate(gig),
    },
    {
      label: 'Horário',
      value:
        gig?.time_stage_start || gig?.time_stage_end
          ? `das ${gig?.time_stage_start?.slice(0, 5) || '--:--'} às ${
              gig?.time_stage_end?.slice(0, 5) || '--:--'
            }`
          : 'Não informado',
      disabled: !gig?.time_stage_start && !gig?.time_stage_end,
    },
    {
      label: 'Local',
      value: gigVenue(gig) || 'Não informado',
      disabled: !gigVenue(gig),
    },
    {
      label: 'Tipo',
      value: gig?.event_types?.name || 'Não informado',
      disabled: !gig?.event_types?.name,
    },
    {
      label: 'Remunerado',
      value: gig?.has_remuneration ? 'Sim' : 'Não',
    },
    {
      label: 'Dress code',
      value: gig?.dress_code_types?.name || 'Não informado',
      disabled: !gig?.dress_code_types?.name,
    },
  ]

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
                    <Menu shadow="md" width={210} position="bottom-end" withinPortal>
                      <Menu.Target>
                        <ActionIcon variant="subtle" size="sm">
                          <IconDotsVertical size={18} />
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
                    fz="h3"
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
                  <Group gap={4} align="center" mb="xs">
                    <Text size="xs" c="dimmed">
                      evento criado por{' '}
                    </Text>
                    <Group gap={4}>
                      <Avatar
                        component={Link}
                        to={`/${gig?.profiles?.username}`}
                        src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
                        radius="xl"
                        size={12}
                      />
                      <Anchor component={Link} to={`/${gig?.profiles?.username}`} fz="xs">
                        {gig?.profiles?.username === profile.username
                          ? 'mim'
                          : gig?.profiles?.full_name}
                      </Anchor>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {dayjs(gig?.created_at).fromNow()}
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
                      <Text size="xs" c="dimmed">
                        {gig?.projects?.project_types?.name_ptbr}
                      </Text>
                    </Stack>
                  </Group>
                </Stack>
                <DataList p={0} gap={4} size="sm" orientation="horizontal">
                  {dataListDetails.map((item) => (
                    <DataList.Item key={item.label}>
                      <DataList.ItemLabel>{item.label}</DataList.ItemLabel>
                      <DataList.ItemValue c={item.disabled ? 'dimmed' : undefined}>
                        {item.value}
                      </DataList.ItemValue>
                    </DataList.Item>
                  ))}
                </DataList>
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
              <Title order={5}>Sobre a gig</Title>
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

          {gig?.id && (
            <Paper p="sm" radius="lg" withBorder>
              <Title order={5} mb="xs">
                Vagas para esta gig:
              </Title>
              {!loadingGig && !loadingGigApplicationDetails && (
                <Stack>
                  {groupGigRoles(gig?.gig_roles).map((group) => {
                    const primary = group[0] // já ordenado: principal primeiro
                    const myApplicationInGroup = gigApplications.find((app) =>
                      group.some((r) => r.id === app.gig_roles?.id),
                    )
                    return (
                      <Paper
                        withBorder
                        bg="mublinColor.8"
                        c="white"
                        key={primary.id}
                        p="xs"
                      >
                        <Group justify="space-between">
                          <Stack gap={4}>
                            <Group gap={6} align="center">
                              <Text size="md" lh={1}>
                                {formatRoleNames(group)}
                              </Text>
                              {gig?.has_remuneration && !primary.is_filled && (
                                <Badge
                                  variant="filled"
                                  size="md"
                                  color="lime.2"
                                  autoContrast
                                >
                                  {primary.fee
                                    ? primary.fee.toLocaleString('pt-br', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      })
                                    : 'Não disponível'}
                                </Badge>
                              )}
                              {primary.is_filled && (
                                <Badge variant="outline" size="md" color="white">
                                  Vaga preenchida
                                </Badge>
                              )}
                            </Group>
                            {myApplicationInGroup && (
                              <Text size="xs" lh={1}>
                                ✓ Você aplicou para esta vaga{' '}
                                {dayjs(myApplicationInGroup.created_at).fromNow()}
                              </Text>
                            )}
                          </Stack>
                          <ActionIcon
                            size="md"
                            variant="subtle"
                            onClick={() => handleOpenModalRoleDetail(group)}
                          >
                            <IconEye size={18} color="white" />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    )
                  })}
                </Stack>
              )}
            </Paper>
          )}
        </Stack>
      </Container>
      <Modal
        opened={roleDetailOpened}
        onClose={closeRoleDetail}
        title={`${formatRoleNames(selectedRoleGroup)} para atuar em ${gig?.projects?.name} em ${dayjs(gigDate(gig)).format('dddd, D [de] MMMM [de] YYYY')}`}
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        {(() => {
          const groupPrimary = selectedRoleGroup?.[0]
          const isCombo = (selectedRoleGroup?.length ?? 0) > 1
          const myApplicationInGroup = gigApplications.find((app) =>
            selectedRoleGroup?.some((r) => r.id === app.gig_roles?.id),
          )
          const combinedDescription = (selectedRoleGroup ?? [])
            .filter((r) => r.description)
            .map((r) =>
              isCombo ? `${r.roles?.description_ptbr}: ${r.description}` : r.description,
            )
            .join('\n\n')

          return (
            <>
              <Stack gap="xs" mt="sm">
                {groupPrimary?.is_filled && (
                  <Alert variant="light" color="lime" p="xs">
                    Esta vaga já foi preenchida!
                  </Alert>
                )}
                {!groupPrimary?.is_filled && (
                  <Alert variant="light" color="gray" p={4}>
                    <Group gap={6}>
                      <IconClock size={16} />
                      <Text size="xs">
                        O criador da vaga ainda está avaliando candidaturas
                      </Text>
                    </Group>
                  </Alert>
                )}
                <Table
                  verticalSpacing={2}
                  horizontalSpacing={0}
                  fz="sm"
                  variant="vertical"
                  layout="fixed"
                  withRowBorders={false}
                >
                  <Table.Tbody>
                    {selectedRoleGroup?.map((r) => (
                      <Table.Tr key={r.id}>
                        <Table.Th bg="transparent" w={140} c="dimmed" fw={400}>
                          {isCombo ? r.roles?.description_ptbr : 'Nível desejado'}
                        </Table.Th>
                        <Table.Td>{r.experience_levels?.name_pt}</Table.Td>
                      </Table.Tr>
                    ))}

                    {!groupPrimary?.is_filled && (
                      <Table.Tr>
                        <Table.Th bg="transparent" c="dimmed" fw={400}>
                          Cachê
                        </Table.Th>
                        <Table.Td>
                          {groupPrimary?.fee
                            ? groupPrimary.fee.toLocaleString('pt-br', {
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

                    {selectedRoleGroup
                      ?.filter((r) => r.is_sub)
                      .map((r) => (
                        <Table.Tr key={`sub-${r.id}`}>
                          <Table.Th bg="transparent" c="dimmed" fw={400}>
                            Substituindo{isCombo ? ` (${r.roles?.description_ptbr})` : ''}
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
                                {r.sub_for ? r.profiles?.username : 'Nome não disponível'}
                              </Text>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                  </Table.Tbody>
                </Table>

                <Text size="sm" fw={400} c="dimmed">
                  Sobre a vaga:
                </Text>
                <Spoiler
                  fz="sm"
                  maxHeight={60}
                  showLabel="...ver mais"
                  hideLabel="...ver menos"
                >
                  {combinedDescription || 'Nenhuma descrição fornecida'}
                </Spoiler>
              </Stack>

              {myApplicationInGroup && (
                <>
                  <Divider my="sm" />
                  <Text size="xs" mb={6}>
                    ✓ Você aplicou para esta vaga em{' '}
                    {dayjs(myApplicationInGroup.created_at).format(
                      'D [de] MMMM [de] YYYY',
                    )}
                  </Text>
                  <Button
                    fullWidth
                    size="xs"
                    color="red"
                    variant="outline"
                    leftSection={<IconX size={14} stroke={3} />}
                  >
                    Retirar meu interesse
                  </Button>
                </>
              )}
            </>
          )
        })()}
      </Modal>
    </>
  )
}
