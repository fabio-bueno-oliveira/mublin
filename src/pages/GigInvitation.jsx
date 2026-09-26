import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { fetchGigInvitationsByGigId } from '../queries/gigs'
import AppNavbarMobile from '../components/AppNavbarMobile'
// prettier-ignore
import {
  Affix,
  Container, Grid, Stack,
  Center, Group,
  Title, Text,
  Box, Paper,
  Avatar,
  Badge, Button,
  Collapse,
  Textarea,
  ActionIcon,
  Skeleton,
  Alert,
  DataList,
  Anchor,
  Tooltip, Fieldset,
  Divider,
} from '@mantine/core'
import { useDisclosure, useWindowScroll } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import {
  IconMoodSad,
  IconChevronDown,
  IconChevronUp,
  IconSend,
  IconArrowLeft,
  IconThumbDown,
  IconThumbUp,
  IconMailFast,
} from '@tabler/icons-react'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
import dayjs from 'dayjs'
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const PROJECT_IMAGE_PATH =
  'https://ik.imagekit.io/mublin/projects/tr:h-100,w-100,c-maintain_ratio/'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

const STATUS_MAP = {
  1: { label: 'Pendente', color: 'gray' },
  2: { label: 'Aceito', color: 'green' },
  3: { label: 'Declinado', color: 'red' },
}

// Junta os nomes das funções de um convite combinado — mesma convenção usada
// em gigs.js, Gig.jsx e GigsDashboard.jsx
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

async function fetchInvitationById(invitationId) {
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      `
      id,
      created_at,
      invitation_description,
      status_request_gig_owner,
      status_request_appliant,
      profile_id,
      gig_id,
      gigs (
        id,
        date,
        time_stage_start,
        title,
        created_by,
        type:event_types ( name ),
        city:cities ( name ),
        projects ( id, name, slug, description, picture, project_types ( name_ptbr ) )
      ),
      gig_roles (
        id, description, fee, is_filled, is_sub, sub_for, primary_role_id,
        roles ( description_ptbr ),
        experience_levels ( id, name_pt ),
        profiles ( avatar, username )
      ),
      organizer:invited_by (
        id,
        full_name,
        username,
        avatar,
        title
      ),
      applicant:profile_id (
        id,
        full_name,
        username,
        avatar,
        title
      ),
      profiles:invited_by (
        id,
        full_name,
        username,
        avatar,
        title
      )
    `,
    )
    .eq('id', invitationId)
    .single()

  if (error) throw error

  // Uma vaga combinada (mesma pessoa, mais de uma função) gera uma
  // gig_applications por função — busca as irmãs (mesma gig, mesma pessoa)
  // pra exibir o convite inteiro, não só a função que este id representa.
  const comboRootId = data.gig_roles?.primary_role_id || data.gig_roles?.id
  const { data: siblings, error: siblingsError } = await supabase
    .from('gig_applications')
    .select(
      `
      id, created_at,
      gig_roles (
        id, description, fee, is_filled, is_sub, sub_for, primary_role_id,
        roles ( description_ptbr ),
        experience_levels ( id, name_pt ),
        profiles ( avatar, username )
      )
    `,
    )
    .eq('gig_id', data.gig_id)
    .eq('profile_id', data.profile_id)

  if (siblingsError) throw siblingsError

  const comboMembers = (siblings ?? [])
    .filter((s) => (s.gig_roles?.primary_role_id || s.gig_roles?.id) === comboRootId)
    .sort((a, b) => {
      const aIsPrimary = !a.gig_roles?.primary_role_id
      const bIsPrimary = !b.gig_roles?.primary_role_id
      if (aIsPrimary === bIsPrimary) return 0
      return aIsPrimary ? -1 : 1
    })

  return {
    ...data,
    comboApplicationIds: comboMembers.map((m) => m.id),
    comboRoles: comboMembers.map((m) => m.gig_roles),
  }
}

async function fetchApplicationsCountByRoleId(gigRoleId) {
  // Conta quantas candidaturas/convites existem para a mesma vaga
  const { count, error } = await supabase
    .from('gig_applications')
    .select('id', { count: 'exact', head: true })
    .eq('gig_role_id', gigRoleId)

  if (error) throw error
  return count ?? 0
}

async function fetchApplicationComments(applicationId) {
  const { data, error } = await supabase
    .from('gig_applications_comments')
    .select(
      `
      id,
      created_at,
      content,
      parent_id,
      profiles:author_id (
        id,
        full_name,
        username,
        avatar
      )
    `,
    )
    .eq('gig_application_id', applicationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

function ApplicationComments({ applicationId, currentUserId, comments: commentsProp }) {
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')

  const { data: commentsFromQuery = [], isLoading } = useQuery({
    queryKey: ['application-comments', applicationId],
    queryFn: () => fetchApplicationComments(applicationId),
    staleTime: 0,
    enabled: !commentsProp, // só busca se não vier do pai
  })

  const comments = commentsProp ?? commentsFromQuery

  const addComment = useMutation({
    mutationFn: async (content) => {
      const { error } = await supabase.from('gig_applications_comments').insert([
        {
          gig_application_id: applicationId,
          author_id: currentUserId,
          content: content.trim(),
        },
      ])
      if (error) throw error
    },
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries({ queryKey: ['application-comments', applicationId] })
    },
    onError: (err) => {
      notifications.show({ title: 'Erro', message: err.message, color: 'red' })
    },
  })

  return (
    <Stack gap="xs">
      {isLoading ? (
        <Text size="sm" c="dimmed">
          Carregando comentários...
        </Text>
      ) : comments.length === 0 ? (
        <Text size="sm" c="dimmed">
          Nenhum comentário ainda.
        </Text>
      ) : (
        <Stack gap="xs">
          {comments.map((c) => (
            <Group key={c.id} align="flex-start" gap="xs" wrap="nowrap">
              <Avatar
                src={c.profiles?.avatar ? AVATAR_PATH + c.profiles.avatar : undefined}
                size={28}
                radius="xl"
                component={Link}
                to={`/${c.profiles?.username}`}
              />
              <Box flex={1}>
                <Group gap={6} mb={2}>
                  <Anchor
                    component={Link}
                    to={`/${c.profiles?.username}`}
                    size="xs"
                    fw={600}
                    c="var(--mantine-color-text)"
                  >
                    {c.profiles?.full_name}
                  </Anchor>
                  <Text size="10px" c="dimmed">
                    {dayjs(c.created_at).fromNow()}
                  </Text>
                </Group>
                <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                  {c.content}
                </Text>
              </Box>
            </Group>
          ))}
        </Stack>
      )}

      <Group align="flex-end" gap="xs">
        <Textarea
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.currentTarget.value)}
          autosize
          minRows={1}
          maxRows={4}
          flex={1}
          size="sm"
        />
        <Tooltip label="Enviar">
          <ActionIcon
            onClick={() => {
              if (newComment.trim()) addComment.mutate(newComment)
            }}
            loading={addComment.isPending}
            disabled={!newComment.trim()}
            variant="light"
            size="lg"
          >
            <IconSend size={15} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Stack>
  )
}

function OtherInvitedMusicians({ gigId, currentInvitationId }) {
  const { data: otherInvites = [], isLoading } = useQuery({
    queryKey: ['gig-invite', gigId, currentInvitationId],
    queryFn: () => fetchGigInvitationsByGigId(gigId, currentInvitationId),
    enabled: !!gigId,
    staleTime: 1000 * 60 * 2,
  })

  if (isLoading) {
    return (
      <Box mt="lg">
        <Skeleton height={80} radius="md" />
      </Box>
    )
  }

  if (!otherInvites.length) return null

  return (
    <Box mt="lg">
      <Title order={4} size="md" fw={600} mb="xs">
        Pessoas confirmadas nesta mesma gig ({otherInvites.length})
      </Title>
      <Stack gap="xs">
        {otherInvites
          .filter((inv) => {
            // só aceitos
            return inv.status_request_appliant === 2
          })
          .map((inv) => {
            const status = STATUS_MAP[inv.status_request_appliant]
            const role = formatRoleNames(inv?.comboRoles)
            return (
              <Paper key={inv.id} withBorder radius="md" p="xs">
                <Group gap="xs" wrap="nowrap" justify="space-between">
                  <Group gap="xs" wrap="nowrap">
                    <Avatar
                      src={
                        inv.profiles?.avatar
                          ? AVATAR_PATH + inv.profiles.avatar
                          : undefined
                      }
                      size={36}
                      radius="xl"
                      component={Link}
                      to={`/${inv.profiles?.username}`}
                    />
                    <Box>
                      <Group gap={4}>
                        <Anchor
                          component={Link}
                          to={`/${inv.profiles?.username}`}
                          size="sm"
                          fw={600}
                          c="var(--mantine-color-text)"
                        >
                          {inv.profiles?.full_name}
                        </Anchor>
                        <Text size="xs" c="dimmed">
                          @{inv.profiles?.username}
                        </Text>
                      </Group>
                      {role && (
                        <Text size="xs" c="dimmed">
                          {role}
                        </Text>
                      )}
                    </Box>
                  </Group>

                  {status && inv.status_request_appliant === 2 && (
                    <Badge size="xs" color={status.color} variant="light">
                      {status.label}
                    </Badge>
                  )}
                </Group>
              </Paper>
            )
          })}
      </Stack>
    </Box>
  )
}

function InvitationCard({ invitation, currentUserId, userProfile }) {
  const queryClient = useQueryClient()
  const [gigDetailsExpanded, { toggle: toggleGigDetails }] = useDisclosure(false)
  const [expanded, { toggle }] = useDisclosure(false)

  const { data: comments = [] } = useQuery({
    queryKey: ['application-comments', invitation.id],
    queryFn: () => fetchApplicationComments(invitation.id),
    staleTime: 0,
  })

  const ownerStatus = STATUS_MAP[invitation.status_request_gig_owner]
  const appliantStatus = STATUS_MAP[invitation.status_request_appliant]

  const gigDate = invitation?.gigs?.date
  const gigTime = invitation?.gigs?.time_stage_start || '23:59:59'
  const isPastGig = gigDate ? dayjs(`${gigDate}T${gigTime}`).isBefore(dayjs()) : false

  const gigRoleId = invitation?.gig_roles?.id
  const { data: applicationsCount, isLoading: isLoadingCount } = useQuery({
    queryKey: ['gig-role-applications-count', gigRoleId],
    queryFn: () => fetchApplicationsCountByRoleId(gigRoleId),
    enabled: !!gigRoleId,
  })

  const updateStatus = useMutation({
    mutationFn: async (statusId) => {
      // Convite combinado: todas as funções do combo mudam de status juntas —
      // a pessoa nunca vê "aceitei o guitarrista mas ainda não respondi o
      // backing vocal" como dois convites separados.
      const idsToUpdate = invitation.comboApplicationIds?.length
        ? invitation.comboApplicationIds
        : [invitation.id]
      const { error } = await supabase
        .from('gig_applications')
        .update({ status_request_appliant: statusId })
        .in('id', idsToUpdate)
      if (error) throw error
      return statusId
    },
    onSuccess: (newStatus) => {
      // Invalida TODAS as variações de ['invitation', id] - resolve o problema de string vs number
      queryClient.invalidateQueries({ queryKey: ['invitation'] })
      // Atualização otimista imediata - UI muda na hora sem esperar refetch
      queryClient.setQueryData(['invitation', String(invitation.id)], (old) =>
        old ? { ...old, status_request_appliant: newStatus } : old,
      )
      queryClient.setQueryData(['invitation', invitation.id], (old) =>
        old ? { ...old, status_request_appliant: newStatus } : old,
      )
      // Também invalida listas que possam usar esse convite
      queryClient.invalidateQueries({ queryKey: ['received-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['sent-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['gig-role-applications-count'] })

      notifications.show({
        title: 'Resposta enviada!',
        message: 'Status atualizado.',
        color: 'green',
      })
    },
    onError: (err) => {
      notifications.show({ title: 'Erro', message: err.message, color: 'red' })
    },
  })

  const organizerProfile = invitation?.organizer || invitation?.profiles
  const applicantProfile = invitation?.applicant
  const profile = organizerProfile
  // comboRoles já vem com a principal primeiro (ver fetchInvitationById);
  // fallback pro próprio gig_roles cobre o caso raro de comboRoles vir vazio.
  const comboRoles = invitation?.comboRoles?.length
    ? invitation.comboRoles
    : [invitation?.gig_roles].filter(Boolean)
  const role = comboRoles[0]
  const fee = role?.fee
  const isCombo = comboRoles.length > 1

  const dataListDetails = [
    { label: 'Atividade:', value: formatRoleNames(comboRoles) },
    {
      label: 'Projeto/Artista:',
      value: `${invitation?.gigs?.projects?.name} (${invitation?.gigs?.projects?.project_types.name_ptbr})`,
    },
    { label: 'Cachê:', value: fee ? fee : 'Não informado', disabled: !fee },
    {
      label: 'Data da Gig:',
      value: `${dayjs(invitation?.gigs?.date).format('dddd, D [de] MMMM [de] YYYY')} às ${invitation?.gigs?.time_stage_start || '--:--'} (${dayjs(invitation?.gigs?.date).fromNow()})`,
    },
    { label: 'Tipo da Gig:', value: invitation?.gigs?.type?.name },
    { label: 'Título da Gig:', value: invitation?.gigs?.title },
    {
      label: 'Cidade:',
      value: invitation?.gigs?.city?.name
        ? invitation?.gigs?.city?.name
        : 'Não informado',
      disabled: !invitation?.gigs?.city?.name,
    },
    {
      label: 'Evento relacionado:',
      value: invitation?.gigs?.events?.name
        ? invitation?.gigs?.events?.name
        : 'Nenhum evento relacionado',
      disabled: !invitation?.gigs?.events?.id,
    },
    {
      label: 'Endereço:',
      value: invitation?.gigs?.venue_address
        ? invitation?.gigs?.venue_address
        : 'Não informado',
      disabled: !invitation?.gigs?.venue_address,
    },
  ]

  const isReceived = invitation.profile_id === currentUserId
  const isAcceptedByAppliant = invitation.status_request_appliant === 2
  const isDeclinedByAppliant = invitation.status_request_appliant === 3
  const canRespond =
    isReceived &&
    (!invitation.status_request_appliant || invitation.status_request_appliant === 1) &&
    !isPastGig

  return (
    <Paper withBorder radius="md" p="sm">
      <Group gap={6} justify="center" visibleFrom="sm">
        <IconMailFast />
        <Title order={1} size="h5" fw={400}>
          Convite para gig ou evento
        </Title>
      </Group>
      <Group justify="center" gap={4} mb={4}>
        <Text size="xs" c="dimmed">
          {isReceived ? 'recebido' : 'enviado'}{' '}
          {dayjs(invitation.created_at).format('dddd, D [de] MMMM [de] YYYY [às] HH:mm')}
        </Text>
        {isPastGig && (
          <Badge size="xs" color="red.9" variant="light" ml="xs">
            passou
          </Badge>
        )}
      </Group>

      <Divider variant="dashed" my="xs" />

      <Group gap="xs" wrap="nowrap" flex={1} mb="xs">
        <Avatar
          src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
          radius="xl"
          size={30}
          component={Link}
          to={`/${profile?.username}`}
        />
        <Box flex={1}>
          <Group gap={4} wrap="wrap">
            <Text size="xs">Convite feito {isReceived ? 'por' : 'para'}</Text>
            <Anchor
              component={Link}
              to={`/${profile?.username}`}
              fw={600}
              size="xs"
              c="var(--mantine-color-text)"
            >
              {profile?.full_name}
            </Anchor>
            <Text size="xs">{dayjs(invitation.created_at).fromNow()}</Text>
          </Group>
          {profile?.title && (
            <Text size="xs" c="dimmed" lh={1.2}>
              {profile.title}
            </Text>
          )}
        </Box>
      </Group>

      <Divider variant="dashed" my="xs" />

      <Group gap={6} mb={6} wrap="nowrap">
        <Avatar
          src={`${PROJECT_IMAGE_PATH}/${invitation?.gigs?.projects?.id}/${invitation?.gigs?.projects?.picture}`}
          size={50}
          radius="md"
          component={Link}
          to={`/project/${invitation?.gigs?.projects?.slug}`}
        />
        <Stack gap={1}>
          <Text size="sm" truncate="end">
            {invitation?.gigs?.projects?.name} •{' '}
            {invitation?.gigs?.projects?.project_types?.name_ptbr}
          </Text>
          <Text size="xs" lh={1} c="dimmed" lineClamp={2}>
            {invitation?.gigs?.projects?.description}
          </Text>
        </Stack>
      </Group>

      <Title order={2} mt="xs" size="lg" fw={500}>
        {formatRoleNames(comboRoles)} em{' '}
        {dayjs(invitation?.gigs?.date).format('D [de] MMMM [de] YYYY')}
      </Title>

      <Group gap={6} mb="sm" mt={4}>
        <Group gap={4}>
          <Text span size="xs" lh={1}>
            Status da vaga:
          </Text>
          <Text span size="xs">
            {role?.is_filled ? 'Encerrada' : 'Em aberto'}
          </Text>
        </Group>
        <Divider orientation="vertical" />
        <Group gap={4}>
          <Text span size="xs" lh={1}>
            Total de candidaturas:
          </Text>
          <Text span size="xs" fw={600}>
            {isLoadingCount ? '...' : (applicationsCount ?? 0)}
          </Text>
        </Group>
      </Group>

      <Fieldset p={4} legend="Status do convite" my="md">
        <Grid columns={2} gutter="md">
          <Grid.Col span={1}>
            <Center>
              <Avatar
                src={
                  organizerProfile?.avatar
                    ? AVATAR_PATH + organizerProfile.avatar
                    : undefined
                }
                radius="xl"
                size={22}
                component={Link}
                to={`/${organizerProfile?.username}`}
              />
            </Center>
            <Text size="xs" ta="center">
              Organizador
            </Text>
            <Text size="10px" ta="center" c="dimmed">
              @{organizerProfile?.username}
            </Text>
            {ownerStatus && (
              <Center>
                <Badge size="sm" color={ownerStatus.color} variant="light">
                  {ownerStatus.label}
                </Badge>
              </Center>
            )}
          </Grid.Col>
          <Grid.Col span={1}>
            <Center>
              <Avatar
                src={
                  applicantProfile?.avatar
                    ? AVATAR_PATH + applicantProfile.avatar
                    : undefined
                }
                radius="xl"
                size={22}
                component={Link}
                to={`/${applicantProfile?.username}`}
              />
            </Center>
            <Text size="xs" ta="center">
              Convidado
            </Text>
            <Text size="10px" ta="center" c="dimmed">
              @{applicantProfile?.username}
            </Text>
            {appliantStatus && (
              <Center>
                <Badge size="sm" color={appliantStatus.color} variant="light">
                  {appliantStatus.label}
                </Badge>
              </Center>
            )}
          </Grid.Col>
        </Grid>
      </Fieldset>

      <Stack gap="xs" mt="xs">
        {isPastGig && (
          <Alert color="gray" variant="light" radius="md" p="xs">
            Essa gig já aconteceu em{' '}
            {dayjs(`${gigDate}T${gigTime}`).format('DD/MM/YYYY [às] HH:mm')}.
          </Alert>
        )}

        {canRespond && (
          <Button.Group>
            <Button
              fullWidth
              variant="filled"
              color="lime.9"
              onClick={() => updateStatus.mutate(2)}
              loading={updateStatus.isPending}
            >
              Aceitar
            </Button>
            <Button
              fullWidth
              variant="filled"
              color="red.9"
              onClick={() => updateStatus.mutate(3)}
              loading={updateStatus.isPending}
            >
              Declinar
            </Button>
          </Button.Group>
        )}
        {isAcceptedByAppliant && (
          <Tooltip
            label={
              role?.is_filled
                ? 'Não é possível alterar pois a vaga já foi fechada pelo organizador'
                : 'Clique para voltar para pendente'
            }
            disabled={!isReceived}
            multiline
            w={200}
            withArrow
          >
            <Button
              color="lime"
              variant="light"
              fullWidth
              loading={updateStatus.isPending}
              disabled={!isReceived || role?.is_filled}
              onClick={() =>
                modals.openConfirmModal({
                  title: 'Retirar aceite do convite',
                  children: (
                    <Text size="sm">
                      Tem certeza que deseja retirar o seu aceite? O convite ficará
                      pendente novamente.
                    </Text>
                  ),
                  labels: { confirm: 'Retirar aceite', cancel: 'Cancelar' },
                  confirmProps: { color: 'red' },
                  onConfirm: () => updateStatus.mutate(1),
                })
              }
              leftSection={<IconThumbUp size={16} />}
            >
              Aceito
            </Button>
          </Tooltip>
        )}
        {isDeclinedByAppliant && (
          <Tooltip
            label={
              role?.is_filled
                ? 'Não é possível alterar pois a vaga já foi fechada pelo organizador'
                : 'Clique para voltar para pendente'
            }
            disabled={!isReceived}
            multiline
            w={200}
            withArrow
          >
            <Button
              color="red.9"
              variant="light"
              fullWidth
              loading={updateStatus.isPending}
              disabled={!isReceived || role?.is_filled}
              onClick={() =>
                modals.openConfirmModal({
                  title: 'Reverter recusa do convite',
                  children: (
                    <Text size="sm">
                      Tem certeza que deseja reverter sua recusa? O convite ficará
                      pendente novamente.
                    </Text>
                  ),
                  labels: { confirm: 'Retirar recusa', cancel: 'Cancelar' },
                  confirmProps: { color: 'red' },
                  onConfirm: () => updateStatus.mutate(1),
                })
              }
              leftSection={<IconThumbDown size={16} />}
            >
              Recusado
            </Button>
          </Tooltip>
        )}

        <Fieldset p="xs" legend="Descrição do convite:" my="xs">
          {invitation.invitation_description ? (
            <Group align="center" gap={6}>
              <Avatar
                src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
                radius="xl"
                size={20}
                component={Link}
                to={`/${profile?.username}`}
              />
              <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                {invitation.invitation_description}
              </Text>
            </Group>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhuma descrição foi enviada junto deste convite
            </Text>
          )}
        </Fieldset>

        <Button
          size="xs"
          variant="outline"
          color="var(--mantine-color-text)"
          onClick={toggleGigDetails}
          leftSection={
            gigDetailsExpanded ? (
              <IconChevronUp size={14} />
            ) : (
              <IconChevronDown size={14} />
            )
          }
        >
          Ver detalhes da gig
        </Button>
        <Collapse expanded={gigDetailsExpanded}>
          <Fieldset p="xs" legend="Detalhes da gig" my="xs">
            <DataList p={0} gap={4} size="xs" orientation="horizontal">
              {dataListDetails.map((item) => (
                <DataList.Item key={item.label}>
                  <DataList.ItemLabel>{item.label}</DataList.ItemLabel>
                  <DataList.ItemValue c={item.disabled ? 'dimmed' : undefined}>
                    {item.value}
                  </DataList.ItemValue>
                </DataList.Item>
              ))}
            </DataList>
          </Fieldset>
        </Collapse>

        <Button
          variant="outline"
          color="var(--mantine-color-text)"
          size="xs"
          mt="xs"
          leftSection={
            expanded ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />
          }
          onClick={toggle}
        >
          {expanded
            ? `Ocultar comentários (${comments.length})`
            : `Comentários ${comments.length > 0 ? `(${comments.length})` : ''}`}
        </Button>

        <Collapse expanded={expanded}>
          <ApplicationComments
            applicationId={invitation.id}
            currentUserId={currentUserId}
          />
        </Collapse>
      </Stack>
    </Paper>
  )
}

export default function GigInvitation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [, scrollTo] = useWindowScroll()

  useEffect(() => {
    scrollTo({ y: 0 })
  }, [])

  const {
    data: invitation,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['invitation', id],
    queryFn: () => fetchInvitationById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })

  const canView =
    invitation?.profile_id === user?.id ||
    invitation?.gigs?.created_by === user?.id ||
    invitation?.organizer?.id === user?.id

  if (!canView && !isLoading)
    return (
      <Alert color="red" p="xs" mt="sm">
        Você não tem permissão para ver este convite
      </Alert>
    )

  return (
    <>
      <Helmet>
        <title>Convite para Gig | Mublin</title>
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName={`Convite para gig`} />
      </Affix>

      <Container size="sm" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconArrowLeft size={14} />}
          onClick={() => navigate(-1)}
          mb="md"
          visibleFrom="sm"
        >
          Voltar
        </Button>

        {isLoading ? (
          <Stack gap="sm">
            <Skeleton height={200} radius="md" />
            <Skeleton height={100} radius="md" />
          </Stack>
        ) : isError ? (
          <Alert icon={<IconMoodSad size={16} />} color="red" radius="md">
            Erro ao carregar convite: {error?.message || 'Convite não encontrado'}
          </Alert>
        ) : !invitation ? (
          <Alert icon={<IconMoodSad size={16} />} color="gray" radius="md">
            Convite não encontrado.
          </Alert>
        ) : (
          <>
            <InvitationCard
              invitation={invitation}
              currentUserId={user?.id}
              userProfile={profile}
            />
            <OtherInvitedMusicians
              gigId={invitation.gigs?.id}
              currentInvitationId={invitation.id}
            />
          </>
        )}
      </Container>
    </>
  )
}
