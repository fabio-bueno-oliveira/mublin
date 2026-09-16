import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { fetchReceivedInvitations, fetchSentInvitations } from '../queries/gigs'
import {
  Container,
  Stack,
  Grid,
  Title,
  Text,
  Group,
  Avatar,
  Badge,
  Button,
  Paper,
  Collapse,
  Textarea,
  ActionIcon,
  Skeleton,
  Alert,
  Tabs,
  Box,
  DataList,
  Anchor,
  Flex,
  Tooltip,
  Fieldset,
  Center,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import {
  IconMoodSad,
  IconChevronDown,
  IconChevronUp,
  IconSend,
  IconCheck,
  IconClock,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

// ─── Status lookup (applications_statuses) ────────────────────────────────────
const STATUS_MAP = {
  1: { label: 'Pendente', color: 'gray' },
  2: { label: 'Aceito', color: 'green' },
  3: { label: 'Declinado', color: 'red' },
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Comentários de uma application.
 */
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

  if (error) {
    throw error
  }
  return data ?? []
}

// ─── Componente de comentários ────────────────────────────────────────────────

function ApplicationComments({ applicationId, currentUserId }) {
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['application-comments', applicationId],
    queryFn: () => fetchApplicationComments(applicationId),
    staleTime: 0,
  })

  const addComment = useMutation({
    mutationFn: async (content) => {
      const { error } = await supabase.from('gig_applications_comments').insert([
        {
          gig_application_id: applicationId,
          author_id: currentUserId,
          content: content.trim(),
        },
      ])
      if (error) {
        throw error
      }
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

      {/* Campo novo comentário */}
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
              if (newComment.trim()) {
                addComment.mutate(newComment)
              }
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

// ─── Card de convite ──────────────────────────────────────────────────────────

function InvitationCard({ invitation, currentUserId, mode, userProfile }) {
  const queryClient = useQueryClient()
  const [gigDetailsExpanded, { toggle: toggleGigDetails }] = useDisclosure(false)
  const [expanded, { toggle }] = useDisclosure(false)

  const ownerStatus = STATUS_MAP[invitation.status_request_gig_owner]
  const appliantStatus = STATUS_MAP[invitation.status_request_appliant]

  // Atualizar status do convidado (apenas ele pode fazer)
  const updateStatus = useMutation({
    mutationFn: async (statusId) => {
      const { error } = await supabase
        .from('gig_applications')
        .update({ status_request_appliant: statusId })
        .eq('id', invitation.id)
      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-invitations'] })
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

  const profile = invitation?.profiles
  const role = invitation?.gig_roles
  const fee = invitation?.gig_roles?.fee

  const dataListDetails = [
    { label: 'Atividade:', value: role?.roles?.description_ptbr },
    {
      label: 'Projeto/Artista:',
      value: `${invitation?.gigs?.projects?.name} (${invitation?.gigs?.projects?.project_types.name_ptbr})`,
    },
    { label: 'Cachê:', value: fee ? fee : 'Não informado', disabled: !fee },
    {
      label: 'Data da Gig:',
      value: `${dayjs(invitation?.gigs?.date).format('dddd, D [de] MMMM [de] YYYY')} (${dayjs(invitation?.gigs?.date).fromNow()})`,
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
  ]

  const isReceived = mode === 'received'
  const isAcceptedByAppliant = invitation.status_request_appliant === 2
  const canRespond =
    isReceived &&
    (!invitation.status_request_appliant || invitation.status_request_appliant === 1)

  return (
    <Paper withBorder radius="md" p="sm">
      <Group gap={4} mb={4}>
        <Text size="xs" c="dimmed" style={{ cursor: 'default' }}>
          {isReceived ? 'Convite recebido ' : 'Convite enviado em '}
          {dayjs(invitation.created_at).fromNow()}
        </Text>
        <Tooltip
          label={`Convite criado em ${dayjs(invitation.created_at).format(
            'dddd, D [de] MMMM [de] YYYY [às] HH:mm',
          )}`}
          fz="xs"
          w={200}
          multiline
          withArrow
        >
          <IconClock size={12} color="gray" />
        </Tooltip>
      </Group>

      <Title order={2} size="xl" fw={500} mb="xs">
        {role?.roles?.description_ptbr} para {invitation?.gigs?.projects?.name} (
        {invitation?.gigs?.projects?.project_types.name_ptbr}) em{' '}
        {dayjs(invitation?.gigs?.date).format('D [de] MMMM [de] YYYY')}
      </Title>

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

      <Button
        size="xs"
        onClick={toggleGigDetails}
        leftSection={
          gigDetailsExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />
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

      <Fieldset p={4} legend="Status do convite" my="sm">
        <Grid columns={2} gutter="md">
          <Grid.Col span={1}>
            <Center>
              <Avatar
                src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
                radius="xl"
                size={22}
                component={Link}
                to={`/${profile?.username}`}
              />
            </Center>
            <Text size="xs" ta="center">
              Organizador
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
                src={userProfile?.avatar ? AVATAR_PATH + userProfile.avatar : undefined}
                radius="xl"
                size={22}
                component={Link}
                to={`/${userProfile?.username}`}
              />
            </Center>
            <Text size="xs" ta="center">
              Convidado
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

      <Stack gap="sm" mt="xs">
        {/* Ações de resposta (apenas quem recebeu) */}
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
            label="Clique para voltar para pendente"
            disabled={!isReceived}
            withArrow
          >
            <Button
              color="lime"
              variant="light"
              fullWidth
              loading={updateStatus.isPending}
              disabled={!isReceived}
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
              leftSection={<IconCheck size={16} />}
            >
              Aceito
            </Button>
          </Tooltip>
        )}

        <Box>
          <Text size="xs" mb={2}>
            Descrição do convite:
          </Text>
          {invitation.invitation_description ? (
            <Group align="center" gap={6}>
              {isReceived ? (
                <Avatar
                  src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
                  radius="xl"
                  size={20}
                  component={Link}
                  to={`/${profile?.username}`}
                  title={profile?.username}
                />
              ) : (
                <Avatar
                  src={userProfile?.avatar ? AVATAR_PATH + userProfile.avatar : undefined}
                  radius="xl"
                  size={20}
                  component={Link}
                  to={`/${userProfile?.username}`}
                  title={userProfile?.username}
                />
              )}
              <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                {invitation.invitation_description}
              </Text>
            </Group>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhuma descrição foi enviada junto deste convite
            </Text>
          )}
        </Box>
      </Stack>

      {/* Botão expandir */}
      <Button
        variant="subtle"
        size="xs"
        mt="xs"
        rightSection={
          expanded ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />
        }
        onClick={toggle}
        color="gray"
      >
        {expanded ? 'Ocultar comentários' : 'Comentários'}
      </Button>

      <Collapse expanded={expanded}>
        <ApplicationComments
          applicationId={invitation.id}
          currentUserId={currentUserId}
        />
      </Collapse>
    </Paper>
  )
}

// ─── Lista com skeletons ──────────────────────────────────────────────────────

function InvitationList({
  invitations,
  isLoading,
  emptyMessage,
  currentUserId,
  mode,
  userProfile,
}) {
  if (isLoading) {
    return (
      <Stack gap="sm">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={80} radius="md" />
        ))}
      </Stack>
    )
  }

  if (invitations.length === 0) {
    return (
      <Alert icon={<IconMoodSad size={16} />} color="gray" radius="md">
        {emptyMessage}
      </Alert>
    )
  }

  return (
    <Stack gap="sm">
      {invitations.map((inv) => (
        <InvitationCard
          key={inv.id}
          invitation={inv}
          currentUserId={currentUserId}
          mode={mode}
          userProfile={userProfile}
        />
      ))}
    </Stack>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function GigInvitations() {
  const { user, profile } = useAuth()

  const { data: sentInvitations = [], isLoading: loadingSent } = useQuery({
    queryKey: ['sent-invitations', user?.id],
    queryFn: () => fetchSentInvitations(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  })

  const { data: receivedInvitations = [], isLoading: loadingReceived } = useQuery({
    queryKey: ['received-invitations', user?.id],
    queryFn: () => fetchReceivedInvitations(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  })

  const pendingCount = receivedInvitations.filter(
    (i) => !i.status_request_appliant || i.status_request_appliant === 1,
  ).length

  return (
    <>
      <Helmet>
        <title>Convites para Gigs · Mublin</title>
      </Helmet>

      <Container size="sm" py="lg">
        <Flex align="center" gap="xs" mb="lg">
          <Title order={2} fw={600} size="xl">
            Convites para Gigs
          </Title>
          {pendingCount > 0 && (
            <Badge color="orange" size="sm" variant="filled">
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
        </Flex>

        <Tabs defaultValue="received">
          <Tabs.List mb="lg">
            <Tabs.Tab value="received">
              Recebidos
              {pendingCount > 0 && (
                <Badge size="xs" color="orange" variant="filled" ml={6}>
                  {pendingCount}
                </Badge>
              )}
            </Tabs.Tab>
            <Tabs.Tab value="sent">Enviados</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="received">
            <InvitationList
              invitations={receivedInvitations}
              isLoading={loadingReceived}
              emptyMessage="Você ainda não recebeu nenhum convite para gig."
              currentUserId={user?.id}
              mode="received"
              userProfile={profile}
            />
          </Tabs.Panel>

          <Tabs.Panel value="sent">
            <InvitationList
              invitations={sentInvitations}
              isLoading={loadingSent}
              emptyMessage="Você ainda não enviou nenhum convite para gig."
              currentUserId={user?.id}
              mode="sent"
              userProfile={profile}
            />
          </Tabs.Panel>
        </Tabs>
      </Container>
    </>
  )
}
