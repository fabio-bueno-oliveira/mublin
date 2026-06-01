import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import {
  Container,
  Grid,
  Flex,
  Group,
  Center,
  Avatar,
  Badge,
  Title,
  Text,
  Loader,
  Stack,
  Paper,
  Indicator,
  TextInput,
  MultiSelect,
  Switch,
  Collapse,
  ActionIcon,
  Tooltip,
  Divider,
  Skeleton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconClock,
  IconSearch,
  IconFilter,
  IconX,
  IconBrandSpotify,
  IconBrandInstagram,
  IconBulb,
  IconSettings,
} from '@tabler/icons-react'
import { showYears } from '../utils/formatter'

const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'
const USER_AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
const currentYear = new Date().getFullYear()

const PROJECT_STATUSES = [
  { value: '1', label: 'Em atividade' },
  { value: '2', label: 'Encerrado' },
  { value: '3', label: 'Ativo ocasionalmente' },
  { value: '4', label: 'Sazonal / Temporada' },
  { value: '5', label: 'Em construção' },
  { value: '6', label: 'Em hiato' },
]

export default function Projects() {
  const { user, profile } = useAuth()

  // Filtros
  const [search, setSearch] = useState('')
  const [selectedGenres, setSelectedGenres] = useState([])
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [selectedRoles, setSelectedRoles] = useState([])
  const [onlyFounder, setOnlyFounder] = useState(false)
  const [onlyExMember, setOnlyExMember] = useState(false)
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false)

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const userProjects = projects.map((p) => ({
    id: p.projects.id,
    name: p.projects.name,
    slug: p.projects.slug,
    end_year: p.projects.end_year,
    spotify_id: p.projects.spotify_id,
    instagram: p.projects.instagram,
    is_founder: p.is_founder,
    is_admin: p.is_admin,
    is_ex_member: p.is_ex_member,
    picture: p.projects.picture,
    city: p.projects.cities?.name,
    uf: p.projects.cities?.regions?.uf,
    request_status: p.status,
    activity_status: p.projects.activity_status,
    activity_status_name: p.projects.project_statuses?.description_ptbr,
    activity_status_color: p.projects.project_statuses?.color,
    main_role: p.roles.name_ptbr,
    genre: p.projects.genres?.name,
    type: p.projects.project_types?.name_ptbr,
    joined_at: p.joined_at ? new Date(p.joined_at).getFullYear() : null,
    left_at: p.left_at ? new Date(p.left_at).getFullYear() : null,
    totalMembers: p.projects.project_members?.length || 0,
  }))

  // Opções dinâmicas para os selects
  const genreOptions = useMemo(() => {
    const genres = [...new Set(userProjects.map((p) => p.genre).filter(Boolean))]
    return genres.map((g) => ({ value: g, label: g }))
  }, [userProjects])

  const roleOptions = useMemo(() => {
    const roles = [...new Set(userProjects.map((p) => p.main_role).filter(Boolean))]
    return roles.map((r) => ({ value: r, label: r }))
  }, [userProjects])

  // Filtros aplicados
  const filteredProjects = useMemo(() => {
    return userProjects.filter((project) => {
      if (search && !project.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (selectedGenres.length > 0 && !selectedGenres.includes(project.genre)) {
        return false
      }
      if (
        selectedStatuses.length > 0 &&
        !selectedStatuses.includes(String(project.activity_status))
      ) {
        return false
      }
      if (selectedRoles.length > 0 && !selectedRoles.includes(project.main_role)) {
        return false
      }
      if (onlyFounder && !project.is_founder) {
        return false
      }
      if (onlyExMember && !project.is_ex_member) {
        return false
      }
      return true
    })
  }, [
    userProjects,
    search,
    selectedGenres,
    selectedStatuses,
    selectedRoles,
    onlyFounder,
    onlyExMember,
  ])

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (search) {
      count++
    }
    if (selectedGenres.length) {
      count++
    }
    if (selectedStatuses.length) {
      count++
    }
    if (selectedRoles.length) {
      count++
    }
    if (onlyFounder) {
      count++
    }
    if (onlyExMember) {
      count++
    }
    return count
  }, [search, selectedGenres, selectedStatuses, selectedRoles, onlyFounder, onlyExMember])

  const clearFilters = () => {
    setSearch('')
    setSelectedGenres([])
    setSelectedStatuses([])
    setSelectedRoles([])
    setOnlyFounder(false)
    setOnlyExMember(false)
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Meus Projetos · Mublin</title>
        <link rel="canonical" href="https://mublin.com/projects" />
        <meta name="description" content="Meus projetos musicais no Mublin" />
      </Helmet>
      <Container size="xl" py="sm">
        <Flex justify="space-between" align="center" mb={16}>
          <Group>
            <Title order={1} fz="h3" fw={600}>
              Meus projetos
            </Title>
            {activeFiltersCount > 0 && (
              <Badge size="xs" variant="filled" color="mublinColor">
                {activeFiltersCount} filtro aplicado
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            {activeFiltersCount > 0 && (
              <Tooltip label="Limpar filtros">
                <ActionIcon variant="subtle" color="gray" onClick={clearFilters}>
                  <IconX size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label={filtersOpened ? 'Ocultar filtros' : 'Mostrar filtros'}>
              <ActionIcon
                variant={filtersOpened ? 'filled' : 'light'}
                color={activeFiltersCount > 0 ? 'mublinColor' : 'gray'}
                onClick={toggleFilters}
              >
                <IconFilter size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Flex>

        <Collapse expanded={filtersOpened}>
          <Paper p="sm" mb="lg" withBorder>
            <Stack gap="sm">
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <TextInput
                    placeholder="Buscar por nome..."
                    leftSection={<IconSearch size={14} />}
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    size="sm"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <MultiSelect
                    placeholder="Gênero"
                    data={genreOptions}
                    value={selectedGenres}
                    onChange={setSelectedGenres}
                    size="sm"
                    clearable
                    searchable
                    disabled={genreOptions.length === 0}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <MultiSelect
                    placeholder="Status do projeto"
                    data={PROJECT_STATUSES}
                    value={selectedStatuses}
                    onChange={setSelectedStatuses}
                    size="sm"
                    clearable
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                  <MultiSelect
                    placeholder="Papel (role)"
                    data={roleOptions}
                    value={selectedRoles}
                    onChange={setSelectedRoles}
                    size="sm"
                    clearable
                    searchable
                    disabled={roleOptions.length === 0}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 'content' }}>
                  <Flex align="center" h="100%" gap="lg">
                    <Switch
                      label="Sou fundador"
                      size="sm"
                      checked={onlyFounder}
                      onChange={(e) => setOnlyFounder(e.currentTarget.checked)}
                    />
                    <Switch
                      label="Ex integrante"
                      color="red"
                      size="sm"
                      checked={onlyExMember}
                      onChange={(e) => setOnlyExMember(e.currentTarget.checked)}
                    />
                  </Flex>
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>
        </Collapse>

        {loadingProjects ? (
          <Stack gap="xs">
            {[1, 2, 3, 4].map((i) => (
              <Paper key={i} p="sm">
                <Flex gap="sm">
                  <Skeleton radius="md" width={100} height={100} mb={6} />
                  <Stack gap={6} w="100%">
                    <Skeleton radius="md" width={130} height={18} />
                    <Skeleton radius="md" width={190} height={12} />
                    <Skeleton radius="md" width={70} height={10} />
                  </Stack>
                </Flex>
                <Divider my="xs" />
                <Flex gap={6} align="center">
                  <Skeleton circle width={34} height={34} radius="xl" />
                  <Stack gap={6}>
                    <Skeleton radius="md" width={110} height={10} />
                    <Skeleton radius="md" width={70} height={10} />
                  </Stack>
                </Flex>
              </Paper>
            ))}
          </Stack>
        ) : (
          <>
            {filteredProjects.length > 0 ? (
              <Stack gap="xs">
                {filteredProjects.map((project) => (
                  <Paper
                    key={project.id}
                    p="sm"
                    opacity={project.request_status === 1 ? 0.4 : 1}
                  >
                    <Flex gap="sm">
                      <Avatar
                        size={100}
                        radius="md"
                        src={
                          project?.picture
                            ? `${PROJECT_AVATAR_PATH}/${project?.id}/tr:h-200,w-200,c-maintain_ratio/${project?.picture}`
                            : undefined
                        }
                        alt={project.name}
                      />
                      <Stack gap={3} w="100%">
                        <Group
                          w="100%"
                          justify="space-between"
                          align="flex-start"
                          pos="relative"
                        >
                          <Title
                            order={2}
                            size="lg"
                            fw={600}
                            lh={1}
                            lineClamp={2}
                            flex={1}
                            maw="80%"
                          >
                            {project.name}
                          </Title>
                          <Group gap={10} pos="absolute" right={0}>
                            {project.spotify_id && (
                              <ActionIcon
                                component="a"
                                href={`https://open.spotify.com/artist/${project.spotify_id}`}
                                target="_blank"
                                variant="filled"
                                color="green"
                                size="xs"
                                title="Perfil no Spotify"
                              >
                                <IconBrandSpotify />
                              </ActionIcon>
                            )}
                            {project.instagram && (
                              <ActionIcon
                                component="a"
                                href={`https://instagram.com/${project.instagram}`}
                                target="_blank"
                                variant="filled"
                                color="pink"
                                size="xs"
                                title="Perfil no Instagram"
                              >
                                <IconBrandInstagram />
                              </ActionIcon>
                            )}
                          </Group>
                        </Group>
                        <Text size="xs" opacity={0.7} truncate="end">
                          {project.type} {project.genre ? `· ${project.genre}` : ''}{' '}
                          {project.city && (
                            <Text span>
                              · {project.city}/{project.uf}
                            </Text>
                          )}
                        </Text>
                        {project.activity_status && (
                          <Group pl={4} gap={10} mt={3} wrap="nowrap">
                            <Indicator
                              color={project.activity_status_color ?? 'gray'}
                              processing={project.activity_status === 1}
                              size={8}
                            />
                            <Text size="11px">
                              {project.activity_status_name
                                ? project.activity_status_name
                                : 'Não informado'}
                              {project.end_year && ` em ${project.end_year}`}
                            </Text>
                          </Group>
                        )}
                        {!project.end_year && project.request_status !== 1 && (
                          <>
                            <Text size="xs" mt={10} lh={0.7}>
                              Próxima gig:
                            </Text>
                            <Text size="xs" c="dimmed" mt={4} lh={1}>
                              Nenhuma gig próxima
                            </Text>
                          </>
                        )}
                      </Stack>
                    </Flex>
                    <Divider my="xs" />
                    <Flex gap={6} align="center">
                      <Avatar
                        size={34}
                        src={
                          profile?.avatar ? USER_AVATAR_PATH + profile.avatar : undefined
                        }
                        radius="xl"
                      />
                      <Stack gap={3}>
                        <Text size="sm" lh={1}>
                          {profile.full_name}{' '}
                          {project.main_role && `- ${project.main_role}`}
                        </Text>
                        {project.request_status !== 1 && (
                          <>
                            {!project.end_year ? (
                              <Flex pl={4} gap={8} align="center">
                                <Indicator
                                  color={project.left_at ? 'red' : 'lime'}
                                  size={5}
                                />
                                <Text size="xs" opacity={0.7}>
                                  {`${project.joined_at} ➜ ${project.left_at ? project.left_at : currentYear}`}{' '}
                                  {project.left_at
                                    ? showYears(project.left_at - project.joined_at)
                                    : showYears(currentYear - project.joined_at)}
                                </Text>
                              </Flex>
                            ) : (
                              <Flex gap={8} align="center">
                                <Indicator color="red" size={5} />
                                <Text size="xs" opacity={0.7}>
                                  {`${project.joined_at} ➜ ${project.end_year}`}{' '}
                                  {showYears(project.end_year - project.joined_at)}
                                </Text>
                              </Flex>
                            )}
                          </>
                        )}
                      </Stack>
                    </Flex>
                    <Group gap={6} mt="xs">
                      {project.is_founder && (
                        <Badge
                          variant="filled"
                          color="mublinColor"
                          size="xs"
                          autoContrast
                          leftSection={<IconBulb size={12} />}
                        >
                          Fundador
                        </Badge>
                      )}
                      {project.is_admin && (
                        <Badge
                          variant="filled"
                          color="gray"
                          size="xs"
                          leftSection={<IconSettings size={12} />}
                        >
                          Admin
                        </Badge>
                      )}
                      {project.request_status === 1 && (
                        <Badge
                          color="orange"
                          size="xs"
                          autoContrast
                          leftSection={<IconClock size={12} />}
                        >
                          Pendente
                        </Badge>
                      )}
                      {project.is_ex_member && (
                        <Badge variant="filled" color="red" size="xs" autoContrast>
                          Ex integrante
                        </Badge>
                      )}
                    </Group>
                    <Divider my="xs" />
                    <Tooltip.Group openDelay={300} closeDelay={100}>
                      <Avatar.Group spacing="sm">
                        <Tooltip label="Salazar Troop" withArrow>
                          <Avatar
                            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-9.png"
                            radius="xl"
                          />
                        </Tooltip>
                        <Tooltip label="Bandit Crimes" withArrow>
                          <Avatar
                            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-8.png"
                            radius="xl"
                          />
                        </Tooltip>
                        <Tooltip label="Jane Rata" withArrow>
                          <Avatar
                            src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-9.png"
                            radius="xl"
                          />
                        </Tooltip>
                        <Tooltip
                          withArrow
                          label={
                            <>
                              <div>John Outcast</div>
                              <div>Levi Capitan</div>
                            </>
                          }
                        >
                          <Avatar radius="xl">+2</Avatar>
                        </Tooltip>
                      </Avatar.Group>
                    </Tooltip.Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Paper p="md">
                <Text c="dimmed" ta="center">
                  {userProjects.length === 0
                    ? 'Nenhum projeto associado ao seu perfil'
                    : 'Nenhum projeto encontrado com os filtros aplicados'}
                </Text>
              </Paper>
            )}
          </>
        )}
      </Container>
    </>
  )
}
