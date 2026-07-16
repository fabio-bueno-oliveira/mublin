import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import {
  fetchProjectProfile,
  fetchProjectAdmins,
  fetchProjectPeople,
} from '../queries/projects'
import {
  useMantineColorScheme,
  Skeleton,
  Container,
  Affix,
  Flex,
  Box,
  Alert,
  Avatar,
  Button,
  Image,
  Title,
  Text,
  TextInput,
  Textarea,
  Badge,
  Group,
  Stack,
  Tabs,
  Card,
  Scroller,
  em,
  Divider,
  Center,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconBrandInstagram,
  IconBrandSpotify,
  IconBrandSoundcloud,
  IconSettings,
  IconRoad,
} from '@tabler/icons-react'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { MEMBER_REQUEST_STATUS } from '../constants/projects'

export default function Project() {
  const { user } = useAuth()
  const { slug } = useParams()
  const { colorScheme } = useMantineColorScheme()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  const [activeTab, setActiveTab] = useState('about')

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

  const { data: projectAdmins = [], isLoading: loadingProjectAdmins } = useQuery({
    queryKey: ['project-admins', project?.id],
    queryFn: () => fetchProjectAdmins(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: projectPeople = [], isLoading: loadingProjectPeople } = useQuery({
    queryKey: ['project-people', project?.id],
    queryFn: () => fetchProjectPeople(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const AVATAR_PATH =
    'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
  const PICTURE_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-200,w-200,c-maintain_ratio/`
  const PICTURE_COVER_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-100,w-1042,fo-top,c-maintain_ratio/`
  const DEFAULT_COVER_PICTURE =
    'https://ik.imagekit.io/mublin/bg/tr:fo-bottom,bl-8/project-cover-default-b.png'

  const userMembership = project?.members?.find((m) => m.profile_id === user.id)

  const userIsAdmin =
    userMembership?.is_admin === true &&
    userMembership?.status === MEMBER_REQUEST_STATUS.ACCEPTED

  if (isError) {
    return (
      <Container size="md" py="xl">
        <Text c="dimmed" ta="center">
          Projeto não encontrado.
        </Text>
      </Container>
    )
  }

  const handleRequestAdminStatus = () => {
    notifications.show({
      title: 'Ops!',
      message:
        'Não conseguimos solicitar acesso de admin a este projeto neste momento. Tente novamente em instantes.',
      color: 'red',
      position: 'top-center',
    })
  }

  return (
    <>
      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%">
          <AppNavbarMobile
            pageName={`${project?.name} (${project?.project_type})`}
            // profile={profile}
            // featured={profile.is_open_to_work}
          />
        </Affix>
      )}
      <Container fluid pb="lg" px={0} mt={{ base: 51, sm: 0 }}>
        <Card
          mx={{ base: 0, sm: 'md' }}
          mt={{ base: 0, sm: 'xs' }}
          mb="md"
          px={0}
          pt={0}
          pb="md"
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
                <Badge size="lg" color="dark" leftSection={<IconRoad size={18} />}>
                  Em turnê
                </Badge>
              )}
            </Group>

            {/* Avatar do projeto sobreposto */}
            <Box pos="absolute" bottom={-30} left={16} style={{ zIndex: 2 }}>
              {isLoading ? (
                <Skeleton height={100} width={100} />
              ) : (
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
              )}
            </Box>
          </Box>

          {/* ── Identidade ── */}
          <Flex justify="space-between" align="flex-start" wrap="wrap" gap="sm" px="lg">
            <Stack gap={2} w="100%">
              {isLoading ? (
                <>
                  <Skeleton height={28} width={200} />
                  <Skeleton height={16} width={120} mt={4} />
                </>
              ) : (
                <>
                  <Group>
                    <Title order={1} fz="h3" fw={600} lts="-0.01em">
                      {project?.name}
                    </Title>
                  </Group>
                  <Group w="100%" gap={8} align="center">
                    {project?.project_type && (
                      <Text size="md" c="dimmed">
                        {project.project_type}
                      </Text>
                    )}
                    {project?.genre && (
                      <>
                        <Text size="md" opacity={0.4} style={{ cursor: 'default' }}>
                          ·
                        </Text>
                        <Text size="md" c="dimmed">
                          {project.genre}
                        </Text>
                      </>
                    )}
                  </Group>
                </>
              )}
            </Stack>
          </Flex>
          <Tabs ml="md" variant="pills" mt="md" value={activeTab} onChange={setActiveTab}>
            <Tabs.List grow>
              <Scroller>
                <Tabs.Tab value="about" mr="xs">
                  Sobre
                </Tabs.Tab>
                <Tabs.Tab value="people" mr="xs">
                  Pessoas
                </Tabs.Tab>
                <Tabs.Tab value="jobs" mr="xs">
                  Vagas
                </Tabs.Tab>
                <Tabs.Tab value="gigs" mr="xs">
                  Gigs
                </Tabs.Tab>
                <Tabs.Tab value="social" mr="xs">
                  Redes
                </Tabs.Tab>
                {userIsAdmin && (
                  <Tabs.Tab
                    value="admin"
                    leftSection={<IconSettings size={16} />}
                    mr="xs"
                  >
                    Admin
                  </Tabs.Tab>
                )}
              </Scroller>
            </Tabs.List>
          </Tabs>
        </Card>

        {activeTab === 'about' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600}>
              Visão geral
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
            <Title mt="md" order={5} fw={600}>
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
        )}

        {activeTab === 'people' && (
          <Stack gap="xs">
            <Card mx={{ base: 0, sm: 'md' }}>
              <Group justify="space-between">
                <Title order={5} fw={600}>
                  Administradores ({projectAdmins.length})
                </Title>
                <Button size="xs" onClick={() => handleRequestAdminStatus()}>
                  Solicitar acesso admin
                </Button>
              </Group>
              {loadingProjectAdmins ? (
                <Text size="sm">Carregando...</Text>
              ) : (
                <>
                  {projectAdmins.length > 0 ? (
                    <Group mt="xs">
                      {projectAdmins.map((person) => (
                        <Flex
                          key={person.id}
                          gap={6}
                          direction="column"
                          w={85}
                          justify="center"
                        >
                          <Center>
                            <Link to={`/${person.profile.username}`}>
                              <Avatar
                                size={50}
                                src={`${AVATAR_PATH}${person.profile.avatar}`}
                              />
                            </Link>
                          </Center>
                          <Text size="11px" ta="center" truncate="end">
                            {person.profile.full_name}
                          </Text>
                        </Flex>
                      ))}
                    </Group>
                  ) : (
                    <Text span c="dimmed" size="sm">
                      Nenhum administrador neste projeto. <b>Quero ser administrador</b>
                    </Text>
                  )}
                </>
              )}
            </Card>
            <Card mx={{ base: 0, sm: 'md' }}>
              <Title order={5} fw={600}>
                Pessoas associadas ({projectPeople.length})
              </Title>
              {loadingProjectPeople ? (
                <Text size="sm">Carregando...</Text>
              ) : (
                <>
                  {projectPeople.length > 0 ? (
                    <Group mt="xs">
                      {projectPeople.map((person) => (
                        <Flex
                          key={person.id}
                          gap={2}
                          direction="column"
                          w={85}
                          justify="center"
                        >
                          <Center>
                            <Link to={`/${person.profile.username}`}>
                              <Avatar
                                size={50}
                                src={`${AVATAR_PATH}${person.profile.avatar}`}
                              />
                            </Link>
                          </Center>
                          <Text fz="12px" ta="center" truncate="end">
                            {person.profile.full_name}
                          </Text>
                          <Text fz="11px" ta="center" c="dimmed" lh={1.2}>
                            {person.roles.map((r) => r.role.name_ptbr).join(', ')}
                          </Text>
                          <Badge size="xs" fw={300}>
                            {person.engagement_types
                              .map((e) => e.engagement_type.name_ptbr)
                              .join(', ')}
                          </Badge>
                          <Text fz="11px" ta="center" opacity={0.7}>
                            {person.year_start} ›{' '}
                            {person.year_end ? person.year_end : 'Atualmente'}
                          </Text>
                        </Flex>
                      ))}
                    </Group>
                  ) : (
                    <Text span c="dimmed" size="sm">
                      Nenhum perfil associado a este projeto até o momento
                    </Text>
                  )}
                </>
              )}
            </Card>
          </Stack>
        )}

        {activeTab === 'jobs' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600}>
              Vagas
            </Title>
            <Text span c="dimmed" size="sm">
              Nenhuma vaga para este projeto no momento
            </Text>
          </Card>
        )}

        {activeTab === 'gigs' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600}>
              Gigs
            </Title>
            <Text span c="dimmed" size="sm">
              Nenhuma gig deste projeto cadastrada no momento
            </Text>
          </Card>
        )}

        {activeTab === 'social' && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600} mb="md">
              Redes
            </Title>

            <Stack gap="sm" w={180}>
              {project?.instagram && (
                <Button
                  size="sm"
                  color="pink.8"
                  component="a"
                  target="_blank"
                  href={`https://instagram.com/${project.instagram}`}
                  leftSection={<IconBrandInstagram size={22} />}
                >
                  Instagram
                </Button>
              )}
              {project?.spotify_id && (
                <Button
                  size="sm"
                  color="green"
                  component="a"
                  target="_blank"
                  href={`https://open.spotify.com/artist/${project.spotify_id}`}
                  leftSection={<IconBrandSpotify size={22} />}
                >
                  Spotify
                </Button>
              )}
              {project?.soundcloud && (
                <Button
                  size="sm"
                  color="orange"
                  component="a"
                  target="_blank"
                  href={`https://soundcloud.com/${project.soundcloud}`}
                  leftSection={<IconBrandSoundcloud size={22} />}
                >
                  SoundCloud
                </Button>
              )}
            </Stack>

            {!project?.instagram && !project?.spotify_id && !project?.soundcloud && (
              <Text span c="dimmed" size="sm">
                Não disponível
              </Text>
            )}
          </Card>
        )}

        {activeTab === 'admin' && userIsAdmin && (
          <Card mx={{ base: 0, sm: 'md' }}>
            <Title order={5} fw={600} mb="md" c="dimmed">
              Administrar projeto
            </Title>
            <Title order={5} fw={600} mb="xs">
              Editar dados do projeto
            </Title>
            <Alert variant="light" color="red" p="xs" mb="xs">
              A edição do projeto está em manutenção e não está disponível no momento.
              Retorne em instantes
            </Alert>
            <Stack gap="xs">
              <TextInput label="Nome do projeto" defaultValue={project?.name} disabled />
              <Textarea
                label="Descrição"
                defaultValue={project?.description}
                rows={3}
                disabled
              />
              <Textarea
                label="Propósito"
                defaultValue={project?.purpose}
                rows={3}
                disabled
              />
              <Group justify="flex-end">
                <Button disabled color="mublinColor" size="md" w={240}>
                  Salvar
                </Button>
              </Group>
            </Stack>
            <Divider my="lg" />
            <Title order={5} fw={600} mb="xs">
              Gerenciar administração
            </Title>
            <Button variant="outline" color="red.9" size="xs" w={220}>
              Deixar de ser administrador
            </Button>
          </Card>
        )}
      </Container>
    </>
  )
}
