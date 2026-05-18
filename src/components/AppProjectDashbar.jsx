import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { fetchProjectForDashbar } from '../queries/projects'
import { useAuth } from '../hooks/useAuth'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
// import Gif from '../assets/gif/electric-guitar-pixel-art.gif'
import DashbarTextLoop from './DashbarTextLoop'
import {
  Grid,
  Group,
  Stack,
  Box,
  ActionIcon,
  Avatar,
  Tooltip,
  Modal,
  Image,
  Text,
  Input,
  Container,
  Indicator,
  Flex,
  ScrollArea,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconCheck,
  IconCircleArrowRight,
  IconSelector,
  IconSwitchHorizontal,
} from '@tabler/icons-react'
import './AppProjectDashbar.css'

const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects/'
const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

export default function AppProjectDashbar() {
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 48em)')

  const [opened, { close, toggle }] = useDisclosure(false)
  const [search, setSearch] = useState('')
  const [selectedProjectSlug, setSelectedProjectSlug] = useState('')

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: project, isLoading: loadingProjectDashbar } = useQuery({
    queryKey: ['project', selectedProjectSlug],
    queryFn: () => fetchProjectForDashbar(selectedProjectSlug),
    enabled: !!selectedProjectSlug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const MAX_VISIBLE_AVATARS = 6
  const visibleAvatars = project?.members.slice(0, MAX_VISIBLE_AVATARS)
  const remainingAvatars = project?.members.length - MAX_VISIBLE_AVATARS

  const userProjects = projects.map((p) => ({
    id: p.projects.id,
    name: p.projects.name,
    slug: p.projects.slug,
    picture: p.projects.picture,
    request_status: p.status,
    activity_status: p.projects.activity_status,
    activity_status_name: p.projects.project_statuses?.description_ptbr,
    activity_status_color: p.projects.project_statuses?.color,
    main_role: p.roles.name_ptbr,
    genre: p.projects.genres?.name,
    type: p.projects.project_types?.name_ptbr,
    totalMembers: p.projects.project_members?.length || 0,
  }))

  const filteredProjects = userProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase().trim()),
  )

  const selectedProject = userProjects.find((p) => p.slug === selectedProjectSlug)

  const projectsByStatus = {
    accepted: filteredProjects?.filter((p) => p.request_status === 2) || [],
    pending: filteredProjects?.filter((p) => p.request_status === 1) || [],
  }

  const hasResults =
    projectsByStatus.accepted.length > 0 || projectsByStatus.pending.length > 0

  const ProjectOption = ({ project, active = false }) => (
    <Group
      key={project.id}
      gap={8}
      style={{ cursor: 'pointer' }}
      onClick={() => {
        setSelectedProjectSlug(project.slug)
        close()
        setSearch('')
      }}
    >
      {active && <IconCheck size={12} />}
      <Indicator
        size={10}
        color={project.activity_status_color}
        disabled={!project.activity_status_color}
        inline
        withBorder
        offset={2}
      >
        <Avatar
          src={
            project.picture
              ? `${PROJECT_AVATAR_PATH}${project.id}/tr:h-52,w-52,c-maintain_ratio/${project.picture}`
              : undefined
          }
          size="sm"
          radius="xl"
        />
      </Indicator>
      <Box>
        <Text size="sm" fw={500} truncate="end">
          {project.name}
        </Text>
        <Text size="xs" opacity={0.5} truncate="end">
          {project.type}
          {project.genre && ` · ${project.genre}`}
        </Text>
      </Box>
    </Group>
  )

  return (
    <>
      <Box
        bg="linear-gradient(45deg, var(--mantine-color-grape-9) 0%, var(--mantine-color-mublinColor-9) 100%)"
        className="project-dashbar"
      >
        <Container size="lg">
          <Grid py="xs" c="white">
            <Grid.Col span={{ base: 4.5, md: 3.5 }}>
              {loadingProjects ? (
                <Text size="15px" lh={1} pt="xs">
                  Carregando...
                </Text>
              ) : (
                <>
                  {selectedProject ? (
                    <Flex
                      gap={6}
                      w={isMobile ? 120 : 220}
                      pt={3}
                      align="center"
                      style={{ cursor: 'pointer' }}
                      onClick={toggle}
                    >
                      <Avatar
                        src={
                          selectedProject.picture
                            ? `${PROJECT_AVATAR_PATH}${selectedProject.id}/tr:h-60,w-60,c-maintain_ratio/${selectedProject.picture}`
                            : undefined
                        }
                        size={30}
                        radius="md"
                        // style={{ border: '1px solid white' }}
                      />
                      <Text size="15px" fw={500} truncate="end">
                        {selectedProject?.name}
                      </Text>
                      <Box opacity={0.7} p={0} w={16} h={16}>
                        <IconSwitchHorizontal size={16} stroke={2} />
                      </Box>
                    </Flex>
                  ) : (
                    <Flex
                      pt="xs"
                      gap={6}
                      w={154}
                      align="center"
                      style={{ cursor: 'pointer' }}
                      onClick={toggle}
                      className="projectSelector"
                    >
                      <Text size="15px">Selecionar projeto</Text>
                      <Box opacity={0.7} p={0} w={16} h={16}>
                        <IconSelector size={16} stroke={2} />
                      </Box>
                    </Flex>
                  )}
                </>
              )}
            </Grid.Col>
            {loadingProjectDashbar && (
              <Grid.Col span={{ base: 7.5, md: 8.5 }} pt={8} pl={8} visibleFrom="sm">
                <Text size="sm" fw={300}>
                  Carregando informações do projeto...
                </Text>
              </Grid.Col>
            )}
            {!selectedProject && !loadingProjectDashbar && (
              <Grid.Col span={{ base: 7.5, md: 8.5 }} pt={2} pl={8}>
                <Group gap={4}>
                  <Group gap={4} visibleFrom="sm">
                    <IconArrowLeft size={14} style={{ opacity: '0.4' }} />
                    <Text size="sm" fw={300} opacity={0.4}>
                      Selecione um projeto ao lado e visualize aqui informações em tempo
                      real!
                    </Text>
                  </Group>
                  {/* <Image src={Gif} h={32} w="auto" fit="contain" /> */}
                </Group>
              </Grid.Col>
            )}
            {selectedProject && !loadingProjectDashbar && (
              <>
                <Grid.Col span={{ base: 6, md: 4 }} pt={4}>
                  <DashbarTextLoop project={project} />
                </Grid.Col>

                <Grid.Col span={{ base: 0, md: 4 }} visibleFrom="sm">
                  <Flex justify="flex-end">
                    <Tooltip.Group closeDelay={100}>
                      <Avatar.Group spacing="sm">
                        {visibleAvatars?.map((user) => (
                          <Tooltip
                            key={user.id}
                            fz="xs"
                            label={
                              user.is_ex_member
                                ? `${user.name} (ex-integrante)`
                                : user.name
                            }
                            withArrow
                            position="top"
                          >
                            <Avatar
                              src={
                                user.avatar ? `${AVATAR_PATH}${user.avatar}` : undefined
                              }
                              size={34}
                              radius="xl"
                              opacity={user.is_ex_member ? 0.5 : 1}
                              component={Link}
                              to={`/${user?.username}`}
                            >
                              {user.name}
                            </Avatar>
                          </Tooltip>
                        ))}
                        {remainingAvatars > 0 && (
                          <Avatar radius="xl" size={34}>
                            +{remainingAvatars}
                          </Avatar>
                        )}
                      </Avatar.Group>
                    </Tooltip.Group>
                  </Flex>
                </Grid.Col>

                <Grid.Col span={{ base: 1.5, md: 0.5 }} pt={3}>
                  <Flex align="center" justify="flex-end" h="100%" opacity={0.8}>
                    <Tooltip label="Acessar projeto" withArrow position="top">
                      <ActionIcon
                        variant="filled"
                        radius="xl"
                        aria-label="Ir para a página do projeto"
                        component={Link}
                        to={`/project/${selectedProject.slug}`}
                      >
                        <IconCircleArrowRight size={24} stroke={1.4} />
                      </ActionIcon>
                    </Tooltip>
                  </Flex>
                </Grid.Col>
              </>
            )}
          </Grid>
        </Container>
      </Box>
      <Modal
        height={200}
        opened={opened}
        onClose={close}
        title="Selecione o projeto a ser exibido na barra inferior"
        scrollAreaComponent={ScrollArea.Autosize}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Stack gap={4} mt="xs">
          <Input
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Pesquisar projetos..."
            // data-autofocus
            mb="xs"
          />
          {hasResults ? (
            <>
              {projectsByStatus.accepted.length > 0 && (
                <>
                  {projectsByStatus.accepted.map((project) => (
                    <ProjectOption
                      key={project.id}
                      project={project}
                      active={String(project.slug) === String(selectedProjectSlug)}
                    />
                  ))}
                </>
              )}
              {projectsByStatus.pending.length > 0 && (
                <>
                  <Text size="sm" c="dimmed">
                    Pendentes de aprovação
                  </Text>
                  {projectsByStatus.pending.map((project) => (
                    <ProjectOption
                      key={project.id}
                      project={project}
                      active={String(project.slug) === String(selectedProjectSlug)}
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhum projeto encontrado
            </Text>
          )}
        </Stack>
      </Modal>
    </>
  )
}
