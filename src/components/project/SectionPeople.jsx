import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  fetchProjectPeople,
  fetchProjectAdmins,
  fetchProjectClaimPolicy,
} from '../../queries/projects'
import {
  Skeleton,
  Modal,
  Container,
  Group,
  Stack,
  SimpleGrid,
  Paper,
  Title,
  Text,
  Textarea,
  Box,
  Button,
  Avatar,
  Center,
  Loader,
  Badge,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { formatPortfolioPeriod } from '../../utils/profile'
import { IconPencil, IconInfoCircle } from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

const AVATAR_MINI_PATH =
  'https://ik.imagekit.io/mublin/tr:h-35,c-maintain_ratio/users/avatars/'

export default function SectionPeople({
  projectId,
  userIsAdmin,
  myAdminRequestIsPending,
}) {
  const { user } = useAuth()
  const [claimModalOpened, { open: openClaimModal, close: closeClaimModal }] =
    useDisclosure(false)

  const [endorsementMessage, setEndorsementMessage] = useState('')

  const { data: projectPeople = [], isLoading: loadingProjectPeople } = useQuery({
    queryKey: ['project-people', projectId],
    queryFn: () => fetchProjectPeople(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  })

  const { data: projectAdmins = [], isLoading: loadingProjectAdmins } = useQuery({
    queryKey: ['project-admins', projectId],
    queryFn: () => fetchProjectAdmins(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  })

  const {
    data: claimPolicy,
    isLoading: loadingClaimPolicy,
    isError: claimPolicyError,
  } = useQuery({
    queryKey: ['project-claim-policy', projectId],
    queryFn: () => fetchProjectClaimPolicy(projectId),
    enabled: !!projectId && claimModalOpened,
    staleTime: 1000 * 60,
  })

  const handleOpenClaimModal = () => {
    if (!user?.id) {
      notifications.show({
        title: 'Faça login',
        message: 'Você precisa estar logado para solicitar acesso de admin.',
        color: 'red',
        position: 'top-center',
      })

      return
    }

    setEndorsementMessage('')
    openClaimModal()
  }

  function formatClaimPolicyMessage(policy) {
    if (!policy) {
      return 'Carregando regra de aprovação...'
    }

    if (policy.requires_curation) {
      return 'Este é um projeto de grande visibilidade — sua solicitação será revisada manualmente pela curadoria do Mublin antes de ser aprovada.'
    }

    const hours = policy.auto_approval_hours
    const isFullDays = hours % 24 === 0

    const timeLabel = isFullDays
      ? `${hours / 24} dia${hours / 24 > 1 ? 's' : ''}`
      : `${hours} horas`

    return `Para este projeto, sua solicitação ficará pendente de aprovação da curadoria do Mublin, ou será aprovada automaticamente em até ${timeLabel} caso ninguém conteste.`
  }

  /*
   * ─────────────────────────────────────────────
   * ADMIN MUTATION
   * ─────────────────────────────────────────────
   */

  const requestAdminMutation = useMutation({
    mutationFn: (message) => requestProjectAdminAccess(project.id, message),

    onSuccess: (data) => {
      const autoApproved = data?.status === ADMIN_REQUEST_STATUS.ACCEPTED

      notifications.show({
        title: autoApproved ? 'Você agora é administrador' : 'Solicitação enviada',
        message: autoApproved
          ? 'Como o projeto ainda não tinha administrador, seu acesso foi aprovado automaticamente.'
          : 'Assim que um administrador atual responder, você será avisado.',
        color: 'green',
        position: 'top-center',
      })

      queryClient.invalidateQueries({
        queryKey: ['project', slug],
      })

      queryClient.invalidateQueries({
        queryKey: ['project-admins', project.id],
      })

      queryClient.invalidateQueries({
        queryKey: ['project-admin-request', project.id, user.id],
      })
    },

    onError: (error) => {
      notifications.show({
        title: 'Ops!',
        message:
          error?.message ||
          'Não conseguimos solicitar acesso de admin a este projeto neste momento. Tente novamente em instantes.',
        color: 'red',
        position: 'top-center',
      })
    },
  })

  const handleConfirmClaimRequest = () => {
    requestAdminMutation.mutate(endorsementMessage, {
      onSuccess: closeClaimModal,
    })
  }

  return loadingProjectPeople ? (
    <Center mt={80}>
      <Loader />
    </Center>
  ) : (
    <>
      <Container size="lg" px={{ base: 'sm', sm: 'md' }}>
        <Stack gap="xl">
          <Box>
            <Title mt="xs" order={3} fz="lg" fw={600} lh={1}>
              Administradores
            </Title>
            <Text mt="xs" mb="xs" c="dimmed" size="xs">
              É fundador ou faz parte do staff?{' '}
              <Text
                span
                fw={500}
                c="var(--mantine-color-text)"
                style={{
                  cursor: 'pointer',
                }}
                onClick={handleOpenClaimModal}
              >
                Quero ser administrador
              </Text>
            </Text>

            {loadingProjectAdmins ? (
              <Skeleton h={60} radius="md" />
            ) : projectAdmins.length > 0 ? (
              <Group gap="sm">
                {projectAdmins.map((person) => (
                  <Tooltip key={person.id} label={person?.profile?.full_name}>
                    <Avatar
                      component={Link}
                      to={`/${person?.profile?.username}`}
                      size={35}
                      src={`${AVATAR_MINI_PATH}${person?.profile?.avatar}`}
                    />
                  </Tooltip>
                ))}
              </Group>
            ) : userIsAdmin ? null : myAdminRequestIsPending ? (
              <Text c="dimmed" size="sm">
                Nenhum administrador neste projeto. Sua solicitação está sendo processada
              </Text>
            ) : (
              <Text c="dimmed" size="sm">
                Nenhum administrador neste projeto
              </Text>
            )}
          </Box>

          <Box>
            <Title order={3} fz="lg" fw={600} mb="xs">
              Pessoas associadas
            </Title>

            {loadingProjectPeople ? (
              <SimpleGrid
                cols={{
                  base: 2,
                  sm: 3,
                  md: 4,
                }}
              >
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} h={160} radius="lg" />
                ))}
              </SimpleGrid>
            ) : projectPeople.length > 0 ? (
              <SimpleGrid
                cols={{
                  base: 2,
                  sm: 3,
                  md: 4,
                }}
                spacing="sm"
              >
                {projectPeople.map((person) => (
                  <Paper key={person.id} withBorder radius="lg" p="sm" pos="relative">
                    {userIsAdmin && (
                      <ActionIcon
                        pos="absolute"
                        top={8}
                        right={8}
                        variant="subtle"
                        color="gray"
                        aria-label="Editar pessoa"
                        component={Link}
                        to="/settings/portfolio"
                      >
                        <IconPencil size={15} />
                      </ActionIcon>
                    )}

                    <Stack gap={5} align="center">
                      <Avatar
                        component={Link}
                        to={`/${person?.profile?.username}`}
                        size={64}
                        src={`${AVATAR_PATH}${person.profile?.avatar}`}
                      />

                      <Text
                        component={Link}
                        to={`/${person?.profile?.username}`}
                        fz="13px"
                        fw={600}
                        ta="center"
                        lineClamp={1}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                        }}
                      >
                        {person.profile.full_name}
                      </Text>

                      {person.engagement_types?.length > 0 && (
                        <Badge
                          size="xs"
                          fw={400}
                          color="var(--mantine-color-text)"
                          variant="light"
                        >
                          {person.engagement_types
                            .map((e) => e.engagement_type.name_ptbr)
                            .join(', ')}
                        </Badge>
                      )}

                      <Text fz="11px" ta="center" c="dimmed" lh={1.2} lineClamp={2}>
                        {person.roles?.map((r) => r.role.name_ptbr).join(', ')}
                      </Text>

                      <Text fz="11px" ta="center" opacity={0.7}>
                        {formatPortfolioPeriod(person.year_start, person.year_end)}
                      </Text>
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            ) : (
              <Text c="dimmed" size="sm">
                Nenhum perfil associado a este projeto até o momento
              </Text>
            )}
          </Box>
        </Stack>
      </Container>
      {/*
       * ════════════════════════════════════════════════
       * CLAIM PROJECT MODAL
       * ════════════════════════════════════════════════
       */}

      <Modal
        opened={claimModalOpened}
        onClose={closeClaimModal}
        title="Solicitar acesso de administrador"
        centered
      >
        <Stack gap="sm">
          <Text size="sm">
            Como administrador, você poderá editar as informações do projeto, publicar
            vagas e aprovar outras pessoas como staff ou demais administradores.
          </Text>

          {loadingClaimPolicy ? (
            <Skeleton h={44} radius="md" />
          ) : (
            <Paper withBorder radius="md" p="xs">
              <Group gap={8} wrap="nowrap" align="flex-start">
                <IconInfoCircle
                  color="orange"
                  size={24}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <Text size="xs">
                  {claimPolicyError
                    ? 'Não foi possível carregar a regra de aprovação. Sua solicitação será analisada pela curadoria do Mublin.'
                    : formatClaimPolicyMessage(claimPolicy)}
                </Text>
              </Group>
            </Paper>
          )}

          {claimPolicy?.associates_count > 0 && (
            <Text size="xs" c="dimmed">
              Este projeto já aparece no portfólio de {claimPolicy.associates_count}{' '}
              pessoa
              {claimPolicy.associates_count > 1 ? 's' : ''} — isso será considerado para
              sua aprovação.
            </Text>
          )}

          <Textarea
            label="Mensagem (opcional)"
            placeholder="Conte brevemente por que você deveria administrar este projeto..."
            value={endorsementMessage}
            onChange={(e) => setEndorsementMessage(e.currentTarget.value)}
            maxLength={500}
            autosize
            minRows={2}
            maxRows={5}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={closeClaimModal}>
              Cancelar
            </Button>

            <Button
              color="mublinColor"
              loading={requestAdminMutation.isPending}
              onClick={handleConfirmClaimRequest}
            >
              Solicitar acesso
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
