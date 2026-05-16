import { useState, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { fetchProjectProfile } from '../queries/projects'
import { useAuth } from '../hooks/useAuth'
import { motion, AnimatePresence } from 'motion/react'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import {
  Grid,
  Group,
  Stack,
  Box,
  ActionIcon,
  Avatar,
  Tooltip,
  Modal,
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
import { Link } from 'react-router-dom'

const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects/'

export default function AppProjectDashbar() {
  const { user } = useAuth()
  const isMobile = useMediaQuery('(max-width: 48em)')
  // const { pathname } = useLocation()

  const [opened, { close, toggle }] = useDisclosure(false)
  const [search, setSearch] = useState('')
  const [index, setIndex] = useState(0)
  const [selectedProjectSlug, setSelectedProjectSlug] = useState('')

  // const isActive = (path) => pathname === path
  // const isActivePrefix = (prefix) => pathname.startsWith(prefix)

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', selectedProjectSlug],
    queryFn: () => fetchProjectProfile(selectedProjectSlug),
    enabled: !!selectedProjectSlug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

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
        setIndex(0)
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
        </Text>
      </Box>
    </Group>
  )

  // Vertical Text Loop

  const STATS_ITEMS = [
    {
      label: 'Evento 1',
      showLabel: true,
      content: (
        <Text size="14px" truncate="end">
          Próxima Gig: 22/Mai no Bar do Rock
        </Text>
      ),
      active: true,
    },
    {
      label: 'Notificação',
      showLabel: true,
      content: (
        <Text size="14px" truncate="end">
          3 novas candidaturas recebidas
        </Text>
      ),
      active: true,
    },
    {
      label: 'Evento 3',
      showLabel: true,
      content: (
        <Text size="14px" truncate="end">
          Ensaio Geral: Quinta às 20h
        </Text>
      ),
      active: true,
    },
    {
      label: 'People',
      showLabel: false,
      content: (
        <Flex justify="center">
          <Tooltip.Group openDelay={300} closeDelay={100}>
            <Avatar.Group spacing={7}>
              <Tooltip label="Salazar Troop" withArrow position="top">
                <Avatar
                  src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-9.png"
                  radius="xl"
                  size={28}
                />
              </Tooltip>
              <Tooltip label="Bandit Crimes" withArrow position="top">
                <Avatar
                  src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-8.png"
                  radius="xl"
                  size={28}
                />
              </Tooltip>
              <Tooltip label="Jane Rata" withArrow position="top">
                <Avatar
                  src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-7.png"
                  radius="xl"
                  size={28}
                />
              </Tooltip>
              <Tooltip label="Bandit Crimes" withArrow position="top">
                <Avatar
                  src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-8.png"
                  radius="xl"
                  size={28}
                />
              </Tooltip>
              <Tooltip
                withArrow
                position="top"
                label={
                  <>
                    <div>John Outcast</div>
                    <div>Levi Capitan</div>
                  </>
                }
              >
                <Avatar radius="xl" size={28}>
                  +2
                </Avatar>
              </Tooltip>
            </Avatar.Group>
          </Tooltip.Group>
        </Flex>
      ),
      active: !!isMobile,
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(
        (prevIndex) => (prevIndex + 1) % STATS_ITEMS.filter((x) => x.active).length,
      )
    }, 4000) // Alterna a cada 4 segundos

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

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
            {loadingProject && (
              <Grid.Col span={{ base: 7.5, md: 8.5 }} pt={8} pl={8} visibleFrom="sm">
                <Text size="sm" fw={300}>
                  Carregando informações do projeto...
                </Text>
              </Grid.Col>
            )}
            {!selectedProject && !loadingProject && (
              <Grid.Col span={{ base: 7.5, md: 8.5 }} pt={8} pl={8} visibleFrom="sm">
                <Group gap={4} opacity={0.4}>
                  <IconArrowLeft size={14} />
                  <Text size="sm" fw={300}>
                    Selecione um projeto ao lado e visualize aqui informações em tempo
                    real!
                  </Text>
                </Group>
              </Grid.Col>
            )}
            {selectedProject && !loadingProject && (
              <>
                <Grid.Col span={{ base: 6, md: 4 }} pt={4}>
                  <Box style={{ height: 28, overflow: 'hidden', position: 'relative' }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={index}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                        style={{ position: 'absolute', width: '100%' }}
                      >
                        {STATS_ITEMS[index]?.showLabel && (
                          <Text size="10px">{STATS_ITEMS[index]?.label}</Text>
                        )}
                        {STATS_ITEMS[index]?.content}
                      </motion.div>
                    </AnimatePresence>
                  </Box>
                </Grid.Col>

                <Grid.Col span={{ base: 0, md: 4 }} visibleFrom="sm">
                  <Flex justify="flex-end">
                    <Tooltip.Group closeDelay={100}>
                      <Avatar.Group spacing="sm">
                        <Tooltip label="Salazar Troop" withArrow position="top">
                          <Avatar
                            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-9.png"
                            radius="xl"
                            size={34}
                          />
                        </Tooltip>
                        <Tooltip label="Bandit Crimes" withArrow position="top">
                          <Avatar
                            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-8.png"
                            radius="xl"
                            size={34}
                          />
                        </Tooltip>
                        <Tooltip label="Jane Rata" withArrow position="top">
                          <Avatar
                            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-7.png"
                            radius="xl"
                            size={34}
                          />
                        </Tooltip>
                        <Tooltip
                          withArrow
                          position="top"
                          label={
                            <>
                              <div>John Outcast</div>
                              <div>Levi Capitan</div>
                            </>
                          }
                        >
                          <Avatar radius="xl" size={34}>
                            +2
                          </Avatar>
                        </Tooltip>
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
