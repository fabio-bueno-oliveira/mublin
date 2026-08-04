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
  NavLink,
  Tabs,
  Title,
  Text,
  Group,
  Stack,
  TextInput,
  Avatar,
} from '@mantine/core'
import { IconMusic, IconDisc } from '@tabler/icons-react'

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
        <TextInput
          ref={searchInputRef}
          placeholder="Buscar por nome..."
          size="lg"
          mb="xs"
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
          <Tabs defaultValue="admin">
            <Tabs.List>
              <Tabs.Tab value="admin">
                Sou administrador ({filteredProjects.length})
              </Tabs.Tab>
              <Tabs.Tab value="portfolio">
                Portfolio ({filteredPortfolio.length})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="admin" mt="sm">
              {userProjects.length > 0 ? (
                <>
                  {filteredProjects.length > 0 ? (
                    <Stack gap={0}>
                      {filteredProjects.map((project) => (
                        <NavLink
                          key={project.id}
                          // href={`#/project/${project?.slug}`}
                          component={Link}
                          to={`/project/${project?.slug}`}
                          label={project.name}
                          description={[
                            project.type,
                            project.genre,
                            project.end_year && `Encerrado em ${project.end_year}`,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                          leftSection={
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
                          }
                        />
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
            </Tabs.Panel>
            <Tabs.Panel value="portfolio" mt="sm">
              {userPortfolio.length > 0 ? (
                <>
                  {filteredPortfolio.length > 0 ? (
                    <Stack gap={0}>
                      {filteredPortfolio.map((item, index) => {
                        const isProject = !!item.projects
                        const entity = item.projects || item.artists
                        const url = isProject
                          ? `/project/${item.projects?.slug}`
                          : `/artist/${item.artists?.slug}`

                        return (
                          <NavLink
                            key={index}
                            // href={url}
                            component={Link}
                            to={url}
                            label={entity?.name || 'Sem título'}
                            description={item.portfolio_roles
                              ?.slice(0, 3)
                              .map((pr) => pr.roles?.name_ptbr)
                              .filter(Boolean)
                              .join(', ')}
                            leftSection={
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
                            }
                          />
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
                  Você ainda não possui projetos no seu portfólio
                </Text>
              )}
            </Tabs.Panel>
          </Tabs>
        )}
      </Container>
    </>
  )
}
