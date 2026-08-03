import { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserAdminProjects, fetchUserPortfolio } from '../queries/user'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  Affix,
  Container,
  Accordion,
  Box,
  Title,
  Text,
  Group,
  Stack,
  TextInput,
  Avatar,
} from '@mantine/core'
import {
  IconCaretDownFilled,
  IconMusic,
  IconDisc,
  IconSettings2,
  IconIdBadge,
  IconDiamond,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'
const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-120,w-120,c-maintain_ratio/'

export default function MyProjects() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserAdminProjects(user?.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const userProjects = projects
    .filter((x) => x.is_admin)
    .map((p) => ({
      id: p.project.id,
      name: p.project.name,
      slug: p.project.slug,
      end_year: p.project.end_year,
      is_admin: p.is_admin,
      is_founder: p.is_founder,
      picture: p.project.picture,
      request_status: p.status,
      activity_status: p.project.activity_status,
      activity_status_name: p.project.status?.description_ptbr,
      activity_status_color: p.project.status?.color,
      genre: p.project.genre?.name,
      type: p.project.type?.name_ptbr,
      totalMembers: p.project.members?.length || 0,
    }))

  const filteredProjects = normalizedQuery
    ? userProjects.filter((project) =>
        project.name?.toLowerCase().includes(normalizedQuery),
      )
    : userProjects

  const { data: userPortfolio = [], isLoading: loadingPortfolio } = useQuery({
    queryKey: ['user-portfolio', user?.id],
    queryFn: () => fetchUserPortfolio(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const filteredPortfolio = normalizedQuery
    ? userPortfolio.filter(
        (project) =>
          project.projects?.name?.toLowerCase().includes(normalizedQuery) ||
          project.artists?.name?.toLowerCase().includes(normalizedQuery),
      )
    : userPortfolio

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Meus projetos · Mublin</title>
        <link rel="canonical" href="https://mublin.com/projects" />
        <meta name="description" content="Projetos de música em que estou associado" />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Meus projetos" />
      </Affix>

      <Container size="xl" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <Group gap="xs" mb={4} visibleFrom="sm">
          <IconMusic size={32} />
          <Title order={1} fz="h3" ta="left" fw={600}>
            Meus projetos
          </Title>
        </Group>
        <Text size="sm" c="dimmed" mb="md">
          Projetos em que estou associado
        </Text>
        <TextInput
          ref={searchInputRef}
          placeholder="Buscar por nome..."
          size="lg"
          mb="sm"
          variant="unstyled"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={loadingProjects || loadingPortfolio}
        />
        {loadingProjects || loadingPortfolio ? (
          <Text c="dimmed" ta="center" size="md" mt="lg">
            Carregando seus projetos...
          </Text>
        ) : (
          <Accordion order={1} variant="separated" radius="md" defaultValue="admin">
            <Accordion.Item value="admin">
              <Accordion.Control icon={<IconSettings2 size={18} stroke={1.7} />}>
                Projetos que sou administrador ({filteredProjects.length})
              </Accordion.Control>
              <Accordion.Panel px="lg">
                {userProjects.length > 0 ? (
                  <>
                    {filteredProjects.length > 0 ? (
                      <Stack gap="md">
                        {filteredProjects.map((project) => (
                          <Link
                            key={project.id}
                            to={`/project/${project?.slug}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Box>
                              <Group gap={10} align="flex-start">
                                <Avatar
                                  size={40}
                                  radius="md"
                                  src={
                                    project?.picture
                                      ? `${PROJECT_AVATAR_PATH}/${project?.id}/tr:h-80,w-80,c-maintain_ratio/${project?.picture}`
                                      : undefined
                                  }
                                  title={project.name}
                                />

                                <Stack gap={2}>
                                  <Text size="md" lh={1}>
                                    {project.name}
                                  </Text>
                                  <Text size="xs" fw={200}>
                                    {project.type}{' '}
                                    {project.genre && ` · ${project.genre}`}
                                  </Text>
                                  {project.end_year && (
                                    <Group gap={0}>
                                      <IconCaretDownFilled color="#c82f2f" size={14} />
                                      <Text fw={200} size="10px" c="dimmed" lh={1}>
                                        Encerrado em {project.end_year}
                                      </Text>
                                    </Group>
                                  )}
                                </Stack>
                              </Group>
                            </Box>
                          </Link>
                        ))}
                      </Stack>
                    ) : (
                      <Text size="sm" c="dimmed">
                        Nenhum projeto encontrado
                      </Text>
                    )}
                  </>
                ) : (
                  <Text size="xs" c="dimmed">
                    Você não é administrador de nenhum projeto no momento
                  </Text>
                )}
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="portfolio">
              <Accordion.Control icon={<IconDiamond size={18} stroke={1.7} />}>
                Projetos em meu portfolio ({filteredPortfolio.length})
              </Accordion.Control>
              <Accordion.Panel px="lg">
                {userPortfolio.length > 0 ? (
                  <>
                    {filteredPortfolio.length > 0 ? (
                      <Stack gap="md">
                        {filteredPortfolio.map((item, index) => {
                          const isProject = !!item.projects
                          const entity = item.projects || item.artists
                          const url = isProject
                            ? `/project/${item.projects?.slug}`
                            : `/artist/${item.artists?.slug}`

                          return (
                            <Link
                              key={index}
                              to={url}
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              <Box>
                                <Group gap={10} align="flex-start">
                                  <Avatar
                                    size={40}
                                    radius="md"
                                    src={
                                      isProject
                                        ? `https://ik.imagekit.io/mublin/projects/${entity.id}/tr:h-120,w-120,c-maintain_ratio/${entity.picture}`
                                        : ARTISTS_PATH + entity.picture
                                    }
                                    title={entity?.name}
                                  >
                                    <IconDisc size={18} />
                                  </Avatar>

                                  <Stack gap={2}>
                                    {item?.portfolio_roles?.[0]?.roles?.name_ptbr && (
                                      <Text size="xs" fw={200}>
                                        {item.portfolio_roles[0].roles.name_ptbr} em
                                      </Text>
                                    )}
                                    <Text size="md" lh={1}>
                                      {entity?.name || 'Sem título'}
                                    </Text>
                                  </Stack>
                                </Group>
                              </Box>
                            </Link>
                          )
                        })}
                      </Stack>
                    ) : (
                      <Text size="sm" c="dimmed">
                        Nenhum projeto encontrado
                      </Text>
                    )}
                  </>
                ) : (
                  <Text size="xs" c="dimmed">
                    Você não é administrador de nenhum projeto no momento
                  </Text>
                )}
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        )}
      </Container>
    </>
  )
}
