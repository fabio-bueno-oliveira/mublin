import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { fetchGigInvitationsByGigId } from '../queries/gigs'
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
  Box,
  DataList,
  Anchor,
  Tooltip,
  Fieldset,
  Center,
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
  IconCheck,
  IconClock,
  IconArrowLeft,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
import { useEffect } from 'react'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

const STATUS_MAP = {
  1: { label: 'Pendente', color: 'gray' },
  2: { label: 'Aceito', color: 'green' },
  3: { label: 'Declinado', color: 'red' },
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
      gigs (
        id,
        created_by,
        date,
        time_stage_start,
        title,
        venue_name,
        venue_address,
        type:event_types ( name ),
        city:cities ( name ),
        events ( id, name, description ),
        venues ( id, name ),
        projects ( id, name, slug, picture, project_types ( name_ptbr ) )
      ),
      gig_roles (
        id, description, fee, is_filled, is_sub, sub_for,
        roles ( description_ptbr ),
        experience_levels ( id, name_pt ),
        profiles ( avatar, username )
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
  return data
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
    queryKey: ['gig-other-invites', gigId, currentInvitationId],
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
        Outros músicos convidados para esta gig ({otherInvites.length})
      </Title>
      <Stack gap="xs">
        {otherInvites.map((inv) => {
          const status = STATUS_MAP[inv.status_request_appliant]
          const role = inv?.gig_roles?.roles?.description_ptbr
          return (
            <Paper key={inv.id} withBorder radius="md" p="xs">
              <Group gap="xs" wrap="nowrap" justify="space-between">
                <Group gap="xs" wrap="nowrap">
                  <Avatar
                    src={
                      inv.profiles?.avatar ? AVATAR_PATH + inv.profiles.avatar : undefined
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

                {status && (
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

  const ownerStatus = STATUS_MAP[invitation.status_request_gig_owner]
  const appliantStatus = STATUS_MAP[invitation.status_request_appliant]

  const gigDate = invitation?.gigs?.date
  const gigTime = invitation?.gigs?.time_stage_start || '23:59:59'
  const isPastGig = gigDate ? dayjs(`${gigDate}T${gigTime}`).isBefore(dayjs()) : false

  const updateStatus = useMutation({
    mutationFn: async (statusId) => {
      const { error } = await supabase
        .from('gig_applications')
        .update({ status_request_appliant: statusId })
        .eq('id', invitation.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitation', invitation.id] })
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
  const canRespond =
    isReceived &&
    (!invitation.status_request_appliant || invitation.status_request_appliant === 1) &&
    !isPastGig

  return (
    <Paper withBorder radius="md" p="sm">
      <Group gap={4} mb={4}>
        <Text size="xs" c="dimmed">
          Convite {isReceived ? 'recebido' : 'enviado'}{' '}
          {dayjs(invitation.created_at).fromNow()}
        </Text>
        <Tooltip
          label={`Criado em ${dayjs(invitation.created_at).format('dddd, D [de] MMMM [de] YYYY [às] HH:mm')}`}
          fz="xs"
          w={200}
          multiline
          withArrow
        >
          <IconClock size={12} color="gray" />
        </Tooltip>
        {isPastGig && (
          <Badge size="xs" color="red.9" variant="light" ml="xs">
            passou
          </Badge>
        )}
      </Group>

      <Title order={2} size="xl" fw={500} mb="xs">
        {role?.roles?.description_ptbr} para {invitation?.gigs?.projects?.name} em{' '}
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

      <Fieldset p="xs" legend="Status do convite" my="sm">
        <Grid columns={2} gutter="md">
          <Grid.Col span={1}>
            <Center>
              <Avatar
                src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
                radius="xl"
                size={22}
                title={`/${profile?.username}`}
                component={Link}
                to={`/${profile?.username}`}
              />
            </Center>
            <Text size="xs" my={2} ta="center">
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
            <Text size="xs" my={2} ta="center">
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

        <Divider variant="dashed" mt="xs" />

        <Box>
          <Text size="sm" mb={2}>
            Descrição do convite:
          </Text>
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
        </Box>

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
          {expanded ? 'Ocultar comentários' : 'Comentários'}
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

  return (
    <>
      <Helmet>
        <title>Convite para Gig | Mublin</title>
      </Helmet>

      <Container size="sm" py="lg">
        <Button
          variant="subtle"
          size="xs"
          leftSection={<IconArrowLeft size={14} />}
          onClick={() => navigate(-1)}
          mb="md"
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
