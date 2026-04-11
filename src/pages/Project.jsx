import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProjectProfile, cancelParticipationRequest  } from '../queries/projects'
import { fetchRoles } from '../queries/roles'
import JoinProjectModal from '../components/modals/JoinProjectModal'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  useMantineColorScheme,
  Container, Flex, Box, Button, 
  Avatar, Image, Menu,
  Title, Text, Badge, Skeleton, 
  Group, Stack, Card, Tooltip, 
  ActionIcon, Pill,
} from '@mantine/core'
import {
  IconBrandInstagram, IconBrandSpotify, IconPencil, IconDoor,
  IconBrandSoundcloud, IconRoad, IconSettings, IconUsers,
  IconClock, IconUserUp, IconLogout, IconUserCog
} from '@tabler/icons-react'

export default function Project() {
  const { user, profile } = useAuth()
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { colorScheme } = useMantineColorScheme()

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => fetchProjectProfile(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-240,c-maintain_ratio/users/avatars/'
  const PICTURE_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-200,w-200,c-maintain_ratio/`
  const PICTURE_COVER_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-120,w-1042,fo-top,c-maintain_ratio/`
  const DEFAULT_COVER_PICTURE = 'https://ik.imagekit.io/mublin/bg/tr:w-1042,h-120,bg-F3F3F3,fo-center,bl-10/mublin-hero-chatgpt-musicians2.png'

  const currentYear = new Date().getFullYear()
  const [modalJoinOpened, { open: openJoinModal, close: closeJoinModal }] = useDisclosure(false)
  const [joinRole, setJoinRole] = useState('')
  const [joinYear, setJoinYear] = useState(currentYear)

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

  const handleCloseJoinModal = () => {
    setJoinRole('')
    setJoinYear(currentYear)
    closeJoinModal()
  }

  const { mutate: joinProject, isPending: joiningProject } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          profile_id: user.id,
          role_id: Number(joinRole),
          joined_at: `${joinYear}-01-01`,
          is_founder: false,
          is_admin: false,
          status: 1,
        })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', slug] })
      handleCloseJoinModal()
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: `Solicitação enviada para ${project.name}!`,
      })
    },
    onError: () => {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao enviar solicitação. Tente novamente.',
      })
    },
  })

  const confirmedMembers = project?.members?.filter(m => m.status === 2) ?? []
  const userMembership = project?.members?.find(m => m.profile_id === user.id)
  const userHasRequestedParticipation = userMembership?.status === 1
  const userIsConfirmedMember = userMembership?.status === 2
  const userHasNoParticipation = !userMembership
  const userIsAdmin = userMembership?.is_admin === true

  if (isError) {
    return (
      <Container size="md" py="xl">
        <Text c="dimmed" ta="center">Projeto não encontrado.</Text>
      </Container>
    )
  }

  return (
    <>
      <Container fluid pb="lg">

        <Card 
          px={0} 
          pt={0} 
          bg={colorScheme === "light" ? "white" : "#1c1c1c"}
          shadow="xs"
        >
          {/* ── Cabeçalho / Cover ── */}
          <Box pos="relative" mb={44}>

            {/* Imagem de capa */}
            {isLoading ? (
              <Skeleton height={140} radius="md" />
            ) : (
              <Image
                src={
                  project?.cover_picture
                    ? PICTURE_COVER_PATH + project?.cover_picture 
                    : DEFAULT_COVER_PICTURE
                }
                fallbackSrc="https://placehold.co/1042x120?text=."
                height={120}
                radius="md"
                fit="cover"
                w="100%"
                alt='Imagem de capa'
              />
            )}

            {/* Avatar do projeto sobreposto */}
            <Box
              pos="absolute"
              bottom={-30}
              left={20}
              zIndex={1}
            >
              {isLoading ? (
                <Skeleton height={100} width={100} />
              ) : (
                <Group align="center" gap={18}>
                  <Avatar
                    src={PICTURE_AVATAR_PATH+project?.picture}
                    size={100}
                    radius={0}
                    style={
                      colorScheme === "light" 
                        ? { border: '2px solid white' }
                        : { border: '2px solid #1c1c1c' }
                    }
                  />
                  {project?.logo && 
                    <Avatar
                      src={PICTURE_AVATAR_PATH+project.logo}
                      size={80}
                      radius={0}
                      style={
                        colorScheme === "light" 
                          ? { border: '2px solid white' }
                          : { border: '2px solid #1c1c1c' }
                      }
                    />
                  }
                </Group>
              )}
            </Box>
          </Box>

          {/* ── Identidade ── */}
          <Flex 
            justify="space-between" 
            align="flex-start" 
            wrap="wrap" 
            gap="sm"
            px="lg"
          >
            <Stack gap={4}>
              {isLoading ? (
                <>
                  <Skeleton height={28} width={200} />
                  <Skeleton height={16} width={120} mt={4} />
                </>
              ) : (
                <>
                  <Group gap={14} align="baseline">
                    <Title order={1} fw={800} lts="-0.01em">
                      {project?.name}
                    </Title>
                    {project?.on_tour && (
                      <Badge 
                        size="sm" 
                        variant="filled"
                        color="pink"
                        radius="xl" 
                        fw={400}
                        leftSection={<IconRoad size={16} />}
                      >
                        Em turnê
                      </Badge>
                    )}
                  </Group>
                  <Group gap={10}>
                    {project?.project_type && (
                      <Text size="sm">{project.project_type}</Text>
                    )}
                    {project?.genre && (
                      <>
                        <Text size="sm" opacity={0.4}>·</Text>
                        <Text size="sm">{project.genre}</Text>
                      </>
                    )}
                    {!isLoading && userIsConfirmedMember && ( 
                      <Menu shadow="md" width={200} position="right-start" withArrow>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" size="md">
                            <IconSettings stroke={1.4} size={21} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item 
                            leftSection={<IconDoor size={14} />}
                            onClick={() => navigate(`/backstage?project=${slug}`)}
                          >
                            Acessar Backstage
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item leftSection={<IconPencil size={14} />}>
                            Editar dados do projeto
                          </Menu.Item>
                          <Menu.Item leftSection={<IconSettings size={14} />}>
                            Gerenciar minha participação
                          </Menu.Item>
                          {userIsAdmin && 
                            <Menu.Item leftSection={<IconUserCog size={14} />}>
                              Gerenciar pessoas
                            </Menu.Item>
                          }
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconLogout size={14} />}
                          >
                            Sair deste projeto
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Group>
                  {!isLoading && userHasNoParticipation && (
                    <Button
                      size='xs'
                      mt={10} 
                      onClick={openJoinModal}
                      color="indigo"
                      leftSection={<IconUserUp size={16} />}
                    >
                      Solicitar associação
                    </Button>
                  )}
                  {!isLoading && userHasRequestedParticipation && (
                    <Button
                      size='xs'
                      mt={10} 
                      variant="light"
                      color="red"
                      onClick={() => cancelRequest()}
                      loading={isCancelling}
                      leftSection={<IconClock size={16} />}
                    >
                      Cancelar solicitação
                    </Button>
                  )}
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
                      size="lg"
                    >
                      <IconBrandInstagram size={22} />
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
                      size="lg"
                    >
                      <IconBrandSpotify size={22} />
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
                      size="lg"
                    >
                      <IconBrandSoundcloud size={22} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            )}
          </Flex>
        </Card>

        {/* ── Descrição / Purpose ── */}
        {(isLoading || project?.description || project?.purpose) && (
          <>
            <Stack gap={6} mt="md">
              {isLoading ? (
                <>
                  <Skeleton height={14} width="90%" />
                  <Skeleton height={14} width="75%" />
                </>
              ) : (
                <Card shadow="sm" padding="lg" radius="md">
                  {project?.description && (
                    <Card.Section p="xs" withBorder>
                      <Text size="sm">{project.description}</Text>
                    </Card.Section>
                  )}
                  {project?.purpose && (
                    <Card.Section p="xs" withBorder>
                      <Text size="xs" fw={400} c="dimmed">Objetivo deste projeto</Text>
                      <Text size="sm">{project.purpose}</Text>
                    </Card.Section>
                  )}
                </Card>
              )}
            </Stack>
          </>
        )}

        {/* ── Integrantes confirmados ── */}
        <Stack gap="sm" mt={18}>
          <Group gap={6}>
            <IconUsers size={16} />
            <Title order={4} fz="h5" ta="left" fw={700} lts="-0.02em">
              Integrantes e Staff ({confirmedMembers.length})
            </Title>
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
                  to={`/${member.username}`}
                  style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                >
                  <Avatar
                    src={AVATAR_PATH + member.avatar}
                    size={50}
                    radius="xl"
                  />
                  <Stack gap={3} align="center">
                    <Text size="0.7rem" fw={500} ta="center" w={70} lineClamp={1}>
                      {member.name}
                    </Text>
                    <Text size="0.65rem" c="dimmed" ta="center" w={70} lineClamp={1}>
                      {member.role}
                      {member.role_2 ? ` · ${member.role_2}` : ''}
                    </Text>
                  </Stack>
                  {member.username === profile?.username && (
                    <Pill size="xs">Você</Pill>
                  )}
                  {member.is_founder && (
                    <Badge size="xs" variant="light" color="green">Fundador</Badge>
                  )}
                </Flex>
              ))}
            </Flex>
          )}
        </Stack>

      </Container>
      <JoinProjectModal
        opened={modalJoinOpened}
        onClose={handleCloseJoinModal}
        project={project}
        rolesProjectManagement={rolesProjectManagement}
        rolesProjectMusicians={rolesProjectMusicians}
        joinRole={joinRole}
        setJoinRole={setJoinRole}
        joinYear={joinYear}
        setJoinYear={setJoinYear}
        onConfirm={() => joinProject()}
        loading={joiningProject}
        currentYear={currentYear}
      />
    </>
  )
}
