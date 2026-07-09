import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchProjectProfile, cancelParticipationRequest } from '../queries/projects'
import { fetchAllRoles } from '../queries/roles'
import JoinProjectModal from '../components/modals/JoinProjectModal'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  useMantineColorScheme,
  Grid,
  Container,
  Flex,
  Box,
  Button,
  Avatar,
  Image,
  Menu,
  Title,
  Text,
  Badge,
  Skeleton,
  Group,
  Stack,
  Card,
  Tooltip,
  ActionIcon,
  Pill,
} from '@mantine/core'
import {
  IconBrandInstagram,
  IconBrandSpotify,
  IconPencil,
  IconDoor,
  IconBrandSoundcloud,
  IconSettings,
  IconX,
  IconUserUp,
  IconLogout,
  IconUserCog,
} from '@tabler/icons-react'

export default function Project() {
  const { user, profile } = useAuth()
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { colorScheme } = useMantineColorScheme()

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => fetchProjectProfile(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const AVATAR_PATH =
    'https://ik.imagekit.io/mublin/tr:h-240,c-maintain_ratio/users/avatars/'
  const PICTURE_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-200,w-200,c-maintain_ratio/`
  const PICTURE_COVER_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-100,w-1042,fo-top,c-maintain_ratio/`
  const DEFAULT_COVER_PICTURE =
    'https://ik.imagekit.io/mublin/bg/tr:fo-bottom,bl-8/project-cover-default-b.png'

  const currentYear = new Date().getFullYear()
  const [modalJoinOpened, { open: openJoinModal, close: closeJoinModal }] =
    useDisclosure(false)
  const [joinRole, setJoinRole] = useState('')
  const [joinYear, setJoinYear] = useState(currentYear)

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchAllRoles,
    staleTime: 1000 * 60 * 30,
  })

  const rolesProjectMusicians = roles
    .filter((r) => r.applies_to_a_project && r.instrumentalist)
    .map((r) => ({ label: r.name_ptbr, value: String(r.id) }))

  const rolesProjectManagement = roles
    .filter((r) => r.applies_to_a_project && !r.instrumentalist)
    .map((r) => ({ label: r.name_ptbr, value: String(r.id) }))

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
      const { error } = await supabase.from('project_members').insert({
        project_id: project.id,
        profile_id: user.id,
        role_id: Number(joinRole),
        joined_at: `${joinYear}-01-01`,
        is_founder: false,
        is_admin: false,
        status: 1,
      })
      if (error) {
        throw new Error(error.message)
      }
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

  const confirmedMembers = project?.members?.filter((m) => m.status === 2) ?? []
  const userMembership = project?.members?.find((m) => m.profile_id === user.id)
  const userHasRequestedParticipation = userMembership?.status === 1
  const userIsConfirmedMember = userMembership?.status === 2
  const userHasNoParticipation = !userMembership
  const userIsAdmin = userMembership?.is_admin === true

  if (isError) {
    return (
      <Container size="md" py="xl">
        <Text c="dimmed" ta="center">
          Projeto não encontrado.
        </Text>
      </Container>
    )
  }

  return (
    <>
      <Container fluid pb="lg" px={0}>
        <Card
          mx={{ base: 0, sm: 'lg' }}
          mt={{ base: 0, sm: 'xs' }}
          px={0}
          pt={0}
          pb={4}
          shadow="xs"
          radius={{ base: false, sm: 'lg' }}
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
                fallbackSrc="https://placehold.co/1042x100?text=."
                height={100}
                radius={false}
                fit="cover"
                w="100%"
                alt="Imagem de capa"
              />
            )}

            {/* Gradiente escuro sobre a capa (sempre por cima da imagem) */}
            <Box
              pos="absolute"
              bottom={0}
              left={0}
              right={0}
              h={70}
              style={{
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.8) 100%)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            <Group pos="absolute" top={12} right={20}>
              {project?.on_tour && (
                <Badge size="md" color="dark">
                  Em turnê
                </Badge>
              )}
            </Group>

            {/* Avatar do projeto sobreposto */}
            <Box pos="absolute" bottom={-30} left={30} style={{ zIndex: 2 }}>
              {isLoading ? (
                <Skeleton height={100} width={100} />
              ) : (
                <Group align="flex-start" gap={18}>
                  <Avatar
                    src={PICTURE_AVATAR_PATH + project?.picture}
                    size={100}
                    radius={0}
                    style={
                      colorScheme === 'light'
                        ? { border: '3px solid white' }
                        : { border: '3px solid #1c1c1c' }
                    }
                  />
                  {project?.logo && (
                    <Avatar
                      src={PICTURE_AVATAR_PATH + project.logo}
                      size={85}
                      radius={0}
                      style={
                        colorScheme === 'light'
                          ? { border: '3px solid white' }
                          : { border: '3px solid #1c1c1c' }
                      }
                    />
                  )}
                </Group>
              )}
            </Box>
          </Box>

          {/* ── Identidade ── */}
          <Flex justify="space-between" align="flex-start" wrap="wrap" gap="sm" px="xl">
            <Stack gap={2} w="100%">
              {isLoading ? (
                <>
                  <Skeleton height={28} width={200} />
                  <Skeleton height={16} width={120} mt={4} />
                </>
              ) : (
                <>
                  <Group gap={10} justify="space-between" align="center">
                    <Group>
                      <Title order={1} fz="h2" fw={550} lts="-0.01em">
                        {project?.name}
                      </Title>
                      {!isLoading && userIsConfirmedMember && (
                        <Menu shadow="md" width={200} position="right-start" withArrow>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" size="md">
                              <IconSettings stroke={1.4} size={24} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconDoor size={14} />}
                              onClick={() => navigate(`/backstage/${slug}`)}
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
                            {userIsAdmin && (
                              <Menu.Item leftSection={<IconUserCog size={14} />}>
                                Gerenciar pessoas
                              </Menu.Item>
                            )}
                            <Menu.Divider />
                            <Menu.Item color="red" leftSection={<IconLogout size={14} />}>
                              Sair deste projeto
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Group>
                    <Group gap={3}>
                      {project?.instagram && (
                        <Tooltip label="Instagram" position="bottom" mb="xs">
                          <ActionIcon
                            component="a"
                            href={`https://instagram.com/${project.instagram}`}
                            target="_blank"
                            variant="subtle"
                            color="gray"
                            size="lg"
                          >
                            <IconBrandInstagram size={22} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      {project?.spotify_id && (
                        <Tooltip label="Spotify" position="bottom" mb="xs">
                          <ActionIcon
                            component="a"
                            href={`https://open.spotify.com/artist/${project.spotify_id}`}
                            target="_blank"
                            variant="subtle"
                            color="gray"
                            size="lg"
                          >
                            <IconBrandSpotify size={22} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      {project?.soundcloud && (
                        <Tooltip label="SoundCloud" position="bottom" mb="xs">
                          <ActionIcon
                            component="a"
                            href={`https://soundcloud.com/${project.soundcloud}`}
                            target="_blank"
                            variant="subtle"
                            color="gray"
                            size="lg"
                          >
                            <IconBrandSoundcloud size={22} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Group>
                  <Group w="100%" gap={8} align="center">
                    {project?.project_type && (
                      <Text size="sm" c="dimmed">
                        {project.project_type}
                      </Text>
                    )}
                    {project?.genre && (
                      <>
                        <Text size="sm" opacity={0.4} style={{ cursor: 'default' }}>
                          ·
                        </Text>
                        <Text size="sm" c="dimmed">
                          {project.genre}
                        </Text>
                      </>
                    )}
                  </Group>
                </>
              )}
            </Stack>

            {/* Ações */}
            {!isLoading && (
              <Group gap={6} align="center">
                {userHasNoParticipation && (
                  <Button
                    size="xs"
                    variant="default"
                    onClick={openJoinModal}
                    leftSection={<IconUserUp size={16} />}
                  >
                    Solicitar associação
                  </Button>
                )}
                {userHasRequestedParticipation && (
                  <Button
                    size="xs"
                    variant="light"
                    color="gray"
                    onClick={() => cancelRequest()}
                    loading={isCancelling}
                    leftSection={<IconX size={16} />}
                  >
                    Cancelar solicitação
                  </Button>
                )}
              </Group>
            )}
          </Flex>
        </Card>

        <Box px="lg" py="lg">
          {isLoading && (
            <Grid gap="md" rowGap="xl" columnGap="sm">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Skeleton height={130} width="100%" />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Skeleton height={130} width="100%" />
              </Grid.Col>
            </Grid>
          )}

          {!isLoading && (
            <Grid gap="md" rowGap="xl" columnGap="sm">
              <Grid.Col span={{ base: 12, md: 6, lg: 6 }}>
                <Stack gap="md">
                  <Card>
                    <Title order={5} fw={600} mb="xs">
                      Sobre
                    </Title>
                    <Text size="sm">
                      {project?.description ? (
                        project.description
                      ) : (
                        <Text span c="dimmed">
                          Descrição não disponível
                        </Text>
                      )}
                    </Text>
                  </Card>
                  <Card>
                    <Title order={5} fw={600} mb="xs">
                      Objetivo do projeto
                    </Title>
                    <Text size="sm">
                      {project?.purpose ? (
                        project.purpose
                      ) : (
                        <Text span c="dimmed">
                          Não disponível
                        </Text>
                      )}
                    </Text>
                  </Card>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6, lg: 6 }}>
                <Card mih={300}>
                  <Title order={5} fw={600} mb="xs">
                    Integrantes e Staff ({confirmedMembers.length})
                  </Title>
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
                    <Text size="sm" c="dimmed">
                      Nenhum integrante confirmado.
                    </Text>
                  )}

                  {!isLoading && confirmedMembers.length > 0 && (
                    <Flex gap={16} wrap="wrap">
                      {confirmedMembers.map((member) => (
                        <Card p="xs" withBorder>
                          <Flex
                            key={member.id}
                            direction="column"
                            align="center"
                            gap={6}
                            component={Link}
                            to={`/${member.username}`}
                            style={{
                              textDecoration: 'none',
                              color: 'inherit',
                              cursor: 'pointer',
                            }}
                          >
                            <Avatar
                              src={AVATAR_PATH + member.avatar}
                              size={50}
                              radius="xl"
                            />
                            <Stack gap={3} align="center">
                              <Text size="xs" fw={500} ta="center" w={70} lineClamp={1}>
                                {member.name}
                              </Text>
                              <Text
                                size="xs"
                                ta="center"
                                w={70}
                                lineClamp={1}
                                title={[member.role, member.role_2]
                                  .filter(Boolean)
                                  .join(', ')}
                              >
                                {[member.role, member.role_2].filter(Boolean).join(', ')}
                              </Text>
                            </Stack>
                            {member.username === profile?.username && (
                              <Pill size="xs">Você</Pill>
                            )}
                            {member.is_founder && (
                              <Badge size="xs" variant="light" color="green">
                                Fundador
                              </Badge>
                            )}
                          </Flex>
                        </Card>
                      ))}
                    </Flex>
                  )}
                </Card>
              </Grid.Col>
              {/* <Grid.Col span={{ base: 12, md: 6, lg: 6 }}>3</Grid.Col>
              <Grid.Col span={{ base: 12, md: 6, lg: 6 }}>4</Grid.Col> */}
            </Grid>
          )}
        </Box>
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
