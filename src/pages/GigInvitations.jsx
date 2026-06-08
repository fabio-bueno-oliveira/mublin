import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import {
  Container,
  Stack,
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
  Divider,
  Anchor,
  Flex,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconMoodSad,
  IconChevronDown,
  IconChevronUp,
  IconSend,
  IconCheck,
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
  1: { label: 'Pendente', color: 'orange' },
  2: { label: 'Aceito', color: 'lime' },
  3: { label: 'Declinado', color: 'red' },
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Convites ENVIADOS pelo usuário logado (ele é o dono da gig).
 * Filtramos pelo created_by da tabela gigs.
 */
async function fetchSentInvitations(userId) {
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      `
      id,
      created_at,
      invitation_description,
      status_request_gig_owner,
      status_request_appliant,
      gigs (
        id,
        title,
        created_by,
        projects ( id, name, slug, picture, project_types ( name_ptbr ) )
      ),
      gig_roles (
        id, description, fee, is_filled, is_sub, sub_for,
        roles ( description_ptbr ),
        experience_levels ( id, name_pt ),
        profiles ( avatar, username )
      ),
      profiles:profile_id (
        id,
        full_name,
        username,
        avatar,
        title
      )
    `,
    )
    .eq('gigs.created_by', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }
  // Filtrar linhas onde gigs não veio (join falhou — owner diferente)
  return (data ?? []).filter((r) => r.gigs !== null)
}

/**
 * Convites RECEBIDOS pelo usuário logado (ele é o profile_id convidado).
 */
async function fetchReceivedInvitations(userId) {
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      `
      id,
      created_at,
      invitation_description,
      status_request_gig_owner,
      status_request_appliant,
      gigs (
        id,
        title,
        created_by,
        projects ( id, name, slug, picture, project_types ( name_ptbr ) )
      ),
      gig_roles (
        id, description, fee, is_filled, is_sub, sub_for,
        roles ( description_ptbr ),
        experience_levels ( id, name_pt ),
        profiles ( avatar, username )
      ),
      profiles:profile_id (
        id,
        full_name,
        username,
        avatar,
        title
      )
    `,
    )
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }
  return data ?? []
}

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
    <Stack gap="xs" mt="sm">
      <Divider label="Comentários" labelPosition="left" />
      {isLoading ? (
        <Text size="xs" c="dimmed">
          Carregando comentários...
        </Text>
      ) : comments.length === 0 ? (
        <Text size="xs" c="dimmed">
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
      <Group align="flex-end" gap="xs" mt="xs">
        <Textarea
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.currentTarget.value)}
          autosize
          minRows={1}
          maxRows={4}
          flex={1}
          size="xs"
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

  const profile = invitation.profiles
  const gig = invitation.gigs
  const role = invitation.gig_roles

  const isReceived = mode === 'received'
  const isAcceptedByAppliant = invitation.status_request_appliant === 2
  const canRespond =
    isReceived &&
    (!invitation.status_request_appliant || invitation.status_request_appliant === 1)

  return (
    <Paper withBorder radius="md" p="md">
      <Text size="xs" c="dimmed" mb={4}>
        {isReceived ? 'Convite recebido ' : 'Convite enviado em '}
        {dayjs(invitation.created_at).format('dddd, D [de] MMMM [de] YYYY [às] HH:mm')}
      </Text>
      <Title order={3} size="md" fw={300} mb="sm">
        {role?.roles?.description_ptbr} em {invitation?.gigs?.projects?.name} (
        {invitation?.gigs?.projects?.project_types.name_ptbr})
      </Title>
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap="sm" wrap="nowrap" flex={1}>
          <Avatar
            src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
            radius="xl"
            size={44}
            component={Link}
            to={`/${profile?.username}`}
          />
          <Box flex={1}>
            <Group gap={4} wrap="wrap">
              <Text size="sm">Convite feito {isReceived ? 'por' : 'para'}</Text>
              <Anchor
                component={Link}
                to={`/${profile?.username}`}
                fw={600}
                size="sm"
                c="var(--mantine-color-text)"
              >
                {profile?.full_name}
              </Anchor>
              <Text size="sm">{dayjs(invitation.created_at).fromNow()}</Text>
            </Group>
            {profile?.title && (
              <Text size="xs" c="dimmed" lh={1.2}>
                {profile.title}
              </Text>
            )}
            <Group gap={6} mt={4} wrap="wrap">
              {gig && (
                <Badge variant="light" color="blue" size="xs" radius="sm">
                  {gig.title}
                </Badge>
              )}
              {role && (
                <Badge variant="outline" color="gray" size="xs" radius="sm">
                  {role?.roles?.description_ptbr}
                </Badge>
              )}
            </Group>
          </Box>
        </Group>

        {/* Status badges */}
        <Stack gap={4} align="flex-end">
          {ownerStatus && (
            <Tooltip label="Status do convite">
              <Badge size="xs" color={ownerStatus.color} variant="light">
                {ownerStatus.label}
              </Badge>
            </Tooltip>
          )}
          {appliantStatus && (
            <Tooltip label="Resposta do convidado">
              <Badge size="xs" color={appliantStatus.color} variant="filled">
                {appliantStatus.label}
              </Badge>
            </Tooltip>
          )}
        </Stack>
      </Group>

      {/* Botão expandir */}
      <Button
        variant="subtle"
        size="xs"
        mt="xs"
        px={0}
        rightSection={
          expanded ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />
        }
        onClick={toggle}
        color="gray"
      >
        {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
      </Button>

      <Collapse expanded={expanded}>
        <Stack gap="sm" mt="xs">
          <Box>
            <Text size="xs" c="dimmed" mb={2}>
              Descrição do convite
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
                    src={
                      userProfile?.avatar ? AVATAR_PATH + userProfile.avatar : undefined
                    }
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
              <Text size="sm">Nenhuma descrição foi enviada junto deste convite</Text>
            )}
          </Box>

          {/* Ações de resposta (apenas quem recebeu) */}
          {canRespond && (
            <Group gap="xs">
              <Button
                size="xs"
                color="lime"
                variant="light"
                onClick={() => updateStatus.mutate(2)}
                loading={updateStatus.isPending}
              >
                Aceitar Gig
              </Button>
              <Button
                size="xs"
                color="red"
                variant="light"
                onClick={() => updateStatus.mutate(3)}
                loading={updateStatus.isPending}
              >
                Declinar Gig
              </Button>
            </Group>
          )}
          {isAcceptedByAppliant && (
            <Button
              size="xs"
              color="lime"
              variant="light"
              loading={updateStatus.isPending}
              style={{ width: 'fit-content' }}
              disabled
              leftSection={<IconCheck size={16} />}
            >
              Aceito
            </Button>
          )}

          {/* Seção de comentários */}
          <ApplicationComments
            applicationId={invitation.id}
            currentUserId={currentUserId}
          />
        </Stack>
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
