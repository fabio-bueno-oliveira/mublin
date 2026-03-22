import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProjectProfile, cancelParticipationRequest  } from '../queries/projects'
import JoinProjectModal from '../components/modals/JoinProjectModal'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  Container, Flex, Box, Button, 
  Avatar, Image,
  Title, Text, Badge,
  Skeleton, Divider,
  Group, Stack,
  Tooltip, ActionIcon,
} from '@mantine/core'
import {
  IconBrandInstagram,
  IconBrandSpotify,
  IconBrandSoundcloud,
  IconMapPin,
  IconUsers,
  IconClock,
  IconUserUp,
} from '@tabler/icons-react'

  async function fetchRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name_ptbr, instrumentalist, applies_to_a_project')
      .order('name_ptbr')
    if (error) throw new Error(error.message)
    return data
  }

export default function Project() {
  const { user } = useAuth()
  const { slug } = useParams()
  const queryClient = useQueryClient()

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => fetchProjectProfile(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const currentYear = new Date().getFullYear()
  const [modalJoinOpened, { open: openJoinModal, close: closeJoinModal }] = useDisclosure(false)
  const [joinRole, setJoinRole] = useState('')
  const [joinYear, setJoinYear] = useState(currentYear)
  const [joiningProject, setJoiningProject] = useState(false)

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    staleTime: 1000 * 60 * 30,
  })

  const rolesProjectMusicians = roles
    .filter(r => r.applies_to_a_project && r.instrumentalist)
    .map(r => ({ label: r.name_ptbr, value: String(r.id) }))

  const rolesProjectManagement = roles
    .filter(r => r.applies_to_a_project && !r.instrumentalist)
    .map(r => ({ label: r.name_ptbr, value: String(r.id) }))

  const { mutate: cancelRequest, isPending: isCancelling } = useMutation({
    mutationFn: () => cancelParticipationRequest(project.id, user.id),
    onSuccess: () => {
      // Invalida a query para recarregar os membros atualizados
      queryClient.invalidateQueries({ queryKey: ['project', slug] })
      notifications.show({
        message: 'Solicitação cancelada.',
        color: 'blue',
        position: 'top-center',
      })
    },
    onError: () => {
      notifications.show({
        message: 'Erro ao cancelar solicitação. Tente novamente.',
        color: 'red',
      })
    },
  })

  async function handleJoinProject() {
    if (!joinRole || !joinYear) return
    setJoiningProject(true)
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: project.id,
        profile_id: user.id,
        role_id: Number(joinRole),
        joined_at: `${joinYear}-01-01`,
        is_founder: false,
        is_admin: false,
        status: 1, // pendente
      })
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['project', slug] })
      closeJoinModal()
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: `Solicitação enviada para ${project.name}!`,
      })
    } else {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao enviar solicitação. Tente novamente.',
      })
    }
    setJoiningProject(false)
  }

  const confirmedMembers = project?.members?.filter(m => m.status === 2) ?? []
  const userMembership = project?.members?.find(m => m.profile_id === user.id)
  const userHasRequestedParticipation = userMembership?.status === 1
  const userIsConfirmedMember = userMembership?.status === 2
  const userHasNoParticipation = !userMembership

  if (isError) {
    return (
      <Container size="md" py="xl">
        <Text c="dimmed" ta="center">Projeto não encontrado.</Text>
      </Container>
    )
  }

  const PICTURE_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects/tr:h-200,w-200,c-maintain_ratio/'
  const PICTURE_COVER_PATH = 'https://ik.imagekit.io/mublin/projects/tr:h-140,w-800,c-maintain_ratio/'
  const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-240,c-maintain_ratio/users/avatars/'
  const DEFAULT_COVER_PICTURE = 'https://ik.imagekit.io/mublin/bg/tr:w-1920,h-140,bg-F3F3F3,fo-bottom/open-air-concert.jpg'

  return (
    <>
      <Container fluid pb="lg">

        {/* ── Cabeçalho / Cover ── */}
        <Box pos="relative" mb={60}>

          {/* Imagem de capa (usa a picture do projeto em proporção paisagem) */}
          {isLoading ? (
            <Skeleton height={140} radius="md" />
          ) : (
            <Image
              src={project?.cover_picture ? PICTURE_COVER_PATH + project?.cover_picture : DEFAULT_COVER_PICTURE}
              fallbackSrc="https://placehold.co/800x140?text=."
              height={140}
              radius="md"
              fit="cover"
              w="100%"
              alt='Imagem de capa'
            />
          )}

          {/* Avatar do projeto sobreposto */}
          <Box
            pos="absolute"
            bottom={-40}
            left={20}
            style={{ zIndex: 1 }}
          >
            <>
              {isLoading ? (
                <Skeleton height={100} width={100} />
              ) : (
                <Avatar
                  src={PICTURE_AVATAR_PATH+project?.picture}
                  size={100}
                  radius="md"
                  style={{ border: '3px solid var(--mantine-color-body)' }}
                />
              )}
              {!isLoading && userIsConfirmedMember && (
                <Badge size="xs" color="green" variant="light" mt={4}>
                  Você é membro!
                </Badge>
              )}
              {!isLoading && userIsConfirmedMember && (
                <Button size="xs" mt={4} variant="light" color="indigo">
                  Gerenciar minha participação
                </Button>
              )}
              {!isLoading && userHasNoParticipation && (
                <Button
                  size='xs'
                  mt={4}
                  onClick={openJoinModal}
                  leftSection={<IconUserUp size={16} />}
                >
                  Solicitar associação
                </Button>
              )}
              {!isLoading && userHasRequestedParticipation && (
                <Button
                  size='xs'
                  mt={4}
                  variant="light"
                  color="gray"
                  onClick={() => cancelRequest()}
                  loading={isCancelling}
                  leftSection={<IconClock size={16} />}
                >
                  Cancelar solicitação
                </Button>
              )}
            </>
          </Box>
        </Box>

        {/* ── Identidade ── */}
        <Flex justify="space-between" align="flex-start" mt="md" wrap="wrap" gap="sm">
          <Stack gap={4}>
            {isLoading ? (
              <>
                <Skeleton height={28} width={200} />
                <Skeleton height={16} width={120} mt={4} />
              </>
            ) : (
              <>
                <Group gap={8}>
                  <Title order={2}>{project?.name}</Title>
                  {project?.on_tour && (
                    <Badge color="green" variant="light" size="sm" leftSection={<IconMapPin size={10} />}>
                      Em turnê
                    </Badge>
                  )}
                </Group>
                <Group gap={6}>
                  {project?.project_type && (
                    <Text size="sm" c="dimmed">{project.project_type}</Text>
                  )}
                  {project?.genre && (
                    <>
                      <Text size="sm" c="dimmed">·</Text>
                      <Text size="sm" c="dimmed">{project.genre}</Text>
                    </>
                  )}
                </Group>
              </>
            )}
          </Stack>

          {/* Redes sociais */}
          {!isLoading && (
            <Group gap={6}>
              {project?.instagram && (
                <Tooltip label="Instagram">
                  <ActionIcon
                    component="a"
                    href={`https://instagram.com/${project.instagram}`}
                    target="_blank"
                    variant="subtle"
                    color="pink"
                  >
                    <IconBrandInstagram size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
              {project?.spotify_id && (
                <Tooltip label="Spotify">
                  <ActionIcon
                    component="a"
                    href={`https://open.spotify.com/artist/${project.spotify_id}`}
                    target="_blank"
                    variant="subtle"
                    color="green"
                  >
                    <IconBrandSpotify size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
              {project?.soundcloud && (
                <Tooltip label="SoundCloud">
                  <ActionIcon
                    component="a"
                    href={`https://soundcloud.com/${project.soundcloud}`}
                    target="_blank"
                    variant="subtle"
                    color="orange"
                  >
                    <IconBrandSoundcloud size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          )}
        </Flex>

        {/* ── Descrição / Purpose ── */}
        {(isLoading || project?.description || project?.purpose) && (
          <>
            <Divider my="lg" />
            <Stack gap={6}>
              {isLoading ? (
                <>
                  <Skeleton height={14} width="90%" />
                  <Skeleton height={14} width="75%" />
                </>
              ) : (
                <>
                  {project?.description && (
                    <Text size="sm">{project.description}</Text>
                  )}
                  {project?.purpose && (
                    <Text size="sm" c="dimmed" fs="italic">{project.purpose}</Text>
                  )}
                </>
              )}
            </Stack>
          </>
        )}

        {/* ── Integrantes confirmados ── */}
        <Divider my="lg" />
        <Stack gap="sm">
          <Group gap={6}>
            <IconUsers size={16} />
            <Text fw={600} size="sm">Integrantes e Staff ({confirmedMembers.length})</Text>
          </Group>

          {isLoading && (
            <Flex gap={12} wrap="wrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <Flex key={i} direction="column" align="center" gap={6}>
                  <Skeleton circle height={52} width={52} />
                  <Skeleton height={10} width={50} />
                </Flex>
              ))}
            </Flex>
          )}

          {!isLoading && confirmedMembers.length === 0 && (
            <Text size="sm" c="dimmed">Nenhum integrante confirmado.</Text>
          )}

          {!isLoading && confirmedMembers.length > 0 && (
            <Flex gap={16} wrap="wrap">
              {confirmedMembers.map(member => (
                <Flex
                  key={member.id}
                  direction="column"
                  align="center"
                  gap={6}
                  component={Link}
                  to={`/u/${member.username}`}
                  style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                >
                  <Avatar
                    src={AVATAR_PATH + member.avatar}
                    size={50}
                    radius="xl"
                  />
                  <Stack gap={1} align="center">
                    <Text size="0.7rem" fw={500} ta="center" w={60} lineClamp={1}>
                      {member.name}
                    </Text>
                    <Text size="0.65rem" c="dimmed" ta="center" w={60} lineClamp={1}>
                      {member.role}
                      {member.role_2 ? ` · ${member.role_2}` : ''}
                    </Text>
                  </Stack>
                  {member.is_founder && (
                    <Badge size="xs" variant="dot" color="yellow">Fundador</Badge>
                  )}
                </Flex>
              ))}
            </Flex>
          )}
        </Stack>

      </Container>
      <JoinProjectModal
        opened={modalJoinOpened}
        onClose={closeJoinModal}
        project={project}
        rolesProjectManagement={rolesProjectManagement}
        rolesProjectMusicians={rolesProjectMusicians}
        joinRole={joinRole}
        setJoinRole={setJoinRole}
        joinYear={joinYear}
        setJoinYear={setJoinYear}
        onConfirm={handleJoinProject}
        loading={joiningProject}
        currentYear={currentYear}
      />
    </>
  )
}
