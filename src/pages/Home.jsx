import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects, fetchUserGearCount } from '../queries/user'
import { fetchUserGigs } from '../queries/gigs'
import { fetchFeaturedProducts } from '../queries/gear'
import {
  Grid,
  Group,
  Container,
  Stack,
  Badge,
  Button,
  Text,
  Title,
  Table,
  Paper,
  Avatar,
  ActionIcon,
  Scroller,
  Card,
  Flex,
  Skeleton,
  Indicator,
  Tooltip,
  Box,
  Progress,
  Image,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { PROJECT_ACTIVITY_STATUS } from '../constants/projects'
import Feed from './Feed'
import {
  IconArrowRight,
  IconMicrophone2,
  IconPlus,
  IconMapPin,
  IconCalendar,
  IconBulb,
  IconRadar,
  IconStar,
  IconGuitarPick,
  IconExclamationCircleFilled,
  IconClock,
  IconCheck,
  IconCircleArrowLeftFilled,
  IconCircleArrowRightFilled,
} from '@tabler/icons-react'
import { showYears } from '../utils/formatter'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'
const PATH_PRODUCT_IMAGE_MOBILE =
  'https://ik.imagekit.io/mublin/products/tr:w-200,bg-FFFFFF,fo-x/'

export default function Home() {
  const { profile, user, loading } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 48em)')

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
    is_founder: p.is_founder,
    is_ex_member: p.is_ex_member,
    picture: p.projects.picture,
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

  // const userProjectsActive = userProjects.filter(
  //   (p) => p.activity_status === PROJECT_ACTIVITY_STATUS.RUNNING,
  // )

  const { data: gigs = [], isLoading: loadingGigs } = useQuery({
    queryKey: ['user-gigs', user?.id],
    queryFn: () => fetchUserGigs(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: gearCount = [], isLoading: loadingGearCount } = useQuery({
    queryKey: ['user-gear-count', user?.id],
    queryFn: () => fetchUserGearCount(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  })

  const { data: featuredProducts = [], isLoading: loadingFeaturedProducts } =
    useQuery({
      queryKey: ['featured-products'],
      queryFn: () => fetchFeaturedProducts(),
      staleTime: 1000 * 60 * 10,
    })

  // Deriva gêneros dos projetos com percentual
  const genreStats = (() => {
    const projectsWithGenre = userProjects.filter((p) => p.genre)
    if (!projectsWithGenre.length) {
      return []
    }

    const counts = projectsWithGenre.reduce((acc, p) => {
      acc[p.genre] = (acc[p.genre] ?? 0) + 1
      return acc
    }, {})

    const total = projectsWithGenre.length

    const COLORS = [
      'blue.7',
      'pink.6',
      'green.8',
      'orange.6',
      'violet.7',
      'teal.6',
      'red.7',
      'yellow.6',
    ]

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count], i) => ({
        label,
        value: Math.round((count / total) * 100),
        color: COLORS[i % COLORS.length],
      }))
  })()

  const currentYear = new Date().getFullYear()

  return (
    <>
      <AppNavbarMobile />

      <Container size="xl" pt="xs" px={{ base: 0, sm: 0 }}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }} className="paddingX">
            {loading || loadingProjects ? (
              <Paper
                c="white"
                p="md"
                className="alphaBg"
                mb="sm"
                radius="lg"
                h={212}
              >
                <Skeleton radius="xl" w={100} h={23} mt={2} mb={3} />
                <Skeleton radius="xl" w={180} h={28} mt={6} mb={3} />
                <Skeleton radius="xl" w={84} h={22} mb={3} />
                <Group gap="xs" mt="xs">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} radius="xl" w={35} h={35} />
                  ))}
                </Group>
                <Skeleton mt="sm" radius="xl" w={230} h={34} />
              </Paper>
            ) : (
              <Box>
                <Text fz="h2" fw={700} lts="-0.02em">
                  Olá, {profile.username}
                </Text>
                <Text fz="md" opacity={0.8} lh={1}>
                  Você está associado a {userProjects.length} projetos
                </Text>
                <Scroller
                  mt="lg"
                  key={userProjects.length}
                  draggable
                  controlSize="xl"
                  startControlIcon={<IconCircleArrowLeftFilled size={36} />}
                  endControlIcon={<IconCircleArrowRightFilled size={36} />}
                >
                  <Group gap="sm" wrap="nowrap" pr="md">
                    {userProjects.map((project) => (
                      <Indicator
                        color={project.activity_status_color ?? undefined}
                        disabled={!project.activity_status}
                        key={project.id}
                        offset={4}
                        size={6}
                      >
                        <Tooltip
                          withArrow
                          label={project.name}
                          position="bottom"
                        >
                          <Stack gap={6} size={80}>
                            <Avatar
                              size={80}
                              radius="md"
                              src={
                                project?.picture
                                  ? `${PROJECT_AVATAR_PATH}/${project?.id}/tr:h-160,w-160,c-maintain_ratio/${project?.picture}`
                                  : undefined
                              }
                              title={project.name}
                            />
                            <Flex direction="column">
                              <Text w={80} size="xs" fw={700} truncate="end">
                                {project.name}
                              </Text>
                              <Text w={80} size="xs" c="dimmed" truncate="end">
                                {project.type}
                              </Text>
                            </Flex>
                          </Stack>
                        </Tooltip>
                      </Indicator>
                    ))}
                  </Group>
                </Scroller>
                {/* <Button
                  size="sm"
                  mt={10}
                  radius="xl"
                  leftSection={<IconPlus size={14} />}
                >
                  Novo projeto de música
                </Button> */}
              </Box>
            )}

            <Button
              fullWidth
              mt="lg"
              mb="xl"
              variant="gradient"
              gradient={{ from: 'grape.8', to: 'mublinColor.8', deg: 55 }}
              radius="xl"
              size="sm"
              leftSection={<IconMicrophone2 size={18} />}
              rightSection={<IconArrowRight size={18} />}
              justify="space-between"
            >
              Encontre gigs para tocar!
            </Button>

            <Title order={2} fz="xl" fw={700} lts="-0.02em" mb="xs">
              Próximas gigs
            </Title>

            {loadingGigs ? (
              <Scroller mb="md">
                <Group gap="xs" wrap="nowrap">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} w={250} h={111} radius="md" />
                  ))}
                </Group>
              </Scroller>
            ) : gigs.length > 0 ? (
              <Scroller mb="md">
                <Group gap="xs" wrap="nowrap">
                  {gigs.map((gig) => (
                    <Card
                      key={gig.id}
                      shadow="xs"
                      padding="xs"
                      w={250}
                      withBorder
                    >
                      <Card.Section px="xs" py={8}>
                        <Group gap={5} justify="space-between" wrap="nowrap">
                          <Text size="xs" truncate="end">
                            <Text span fw={600}>
                              {gig.gig_roles?.roles?.description_ptbr}
                            </Text>{' '}
                            em {gig.gigs?.projects?.name}
                          </Text>

                          <Avatar
                            size={24}
                            radius="xl"
                            src={
                              gig.gigs?.projects?.picture
                                ? `${PROJECT_AVATAR_PATH}/${gig.gigs?.projects?.id}/tr:h-48,w-48,c-maintain_ratio/${gig.gigs?.projects?.picture}`
                                : undefined
                            }
                          />
                        </Group>
                      </Card.Section>

                      <Card.Section px="xs" py={2}>
                        <Group gap={5} justify="space-between">
                          <Group gap={3}>
                            <Text size="xs" c="dimmed" lh={1}>
                              {dayjs(gig.gigs?.events?.date_start).fromNow()}
                            </Text>
                            {dayjs(gig.gigs?.events?.date_start).diff(
                              dayjs(),
                              'day',
                            ) <= 2 && (
                              <IconExclamationCircleFilled
                                color="orange"
                                size={15}
                                title="Gig próxima! Verifique os detalhes e prepare-se para se sair bem!"
                              />
                            )}
                          </Group>
                          <Badge
                            size="xs"
                            color="green.9"
                            autoContrast
                            variant="light"
                            leftSection={<IconCheck stroke={3} size={12} />}
                          >
                            Aceito
                          </Badge>
                        </Group>
                      </Card.Section>

                      <Stack gap={0} mt={6}>
                        <Text size="lg" fw={600} lineClamp={1} lts="-0.01em">
                          {gig.gigs?.events?.name}
                        </Text>

                        <Text size="sm" truncate>
                          {gig.gigs?.events?.venues?.name} (
                          {gig.gigs?.events?.venues?.cities?.name},{' '}
                          {gig.gigs?.events?.venues?.cities?.regions?.uf})
                        </Text>

                        <Text size="sm" fw={400} c="dimmed">
                          {dayjs(gig.gigs?.events?.date_start).format(
                            'dddd, D [de] MMMM',
                          )}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </Group>
              </Scroller>
            ) : (
              <Paper
                withBorder
                radius="md"
                mb="md"
                h={110}
                display="flex"
                style={{
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Stack align="center" gap="xs">
                  <Text size="sm" c="dimmed" ta="center" fw={500}>
                    Nenhuma gig agendada no momento :(
                  </Text>
                  <Button
                    size="xs"
                    variant="transparent"
                    radius="xl"
                    color="gray"
                    onClick={() => navigate('/search')}
                  >
                    Encontrar gigs
                  </Button>
                </Stack>
              </Paper>
            )}

            <Title order={2} fz="xl" fw={700} lts="-0.02em" mb="xs">
              Para o dia a dia
            </Title>

            <Scroller mb="lg">
              <Group gap="xs" wrap="nowrap">
                <Flex direction="column" align="center" w={80}>
                  <ActionIcon
                    variant="default"
                    color="gray"
                    // variant="gradient"
                    // gradient={{ from: 'grape.8', to: 'mublinColor.8', deg: 55 }}
                    size="xl"
                    aria-label="Teste"
                    w={80}
                    h={80}
                    mb="xs"
                  >
                    <IconCalendar size={32} stroke={1.5} />
                  </ActionIcon>
                  <Text
                    ta="center"
                    size="xs"
                    style={{ wordBreak: 'break-word' }}
                    w={80}
                  >
                    Novo
                    <br />
                    evento
                  </Text>
                </Flex>
                <Flex direction="column" align="center" w={80}>
                  <ActionIcon
                    variant="default"
                    color="gray"
                    size="xl"
                    aria-label="Teste"
                    w={80}
                    h={80}
                    mb="xs"
                  >
                    <IconBulb size={32} stroke={1.5} />
                  </ActionIcon>
                  <Text
                    ta="center"
                    size="xs"
                    style={{ wordBreak: 'break-word' }}
                    w={80}
                  >
                    Nova
                    <br />
                    composição
                  </Text>
                </Flex>
                <Flex direction="column" align="center" w={80}>
                  <ActionIcon
                    variant="default"
                    color="gray"
                    size="xl"
                    aria-label="Teste"
                    w={80}
                    h={80}
                    mb="xs"
                  >
                    <IconRadar size={32} stroke={1.5} />
                  </ActionIcon>
                  <Text
                    ta="center"
                    size="xs"
                    style={{ wordBreak: 'break-word' }}
                    w={80}
                  >
                    Gigs
                    <br />
                    próximas
                  </Text>
                </Flex>
                <Flex direction="column" align="center" w={80}>
                  <ActionIcon
                    variant="default"
                    color="gray"
                    size="xl"
                    aria-label="Teste"
                    w={80}
                    h={80}
                    mb="xs"
                  >
                    <IconStar size={32} stroke={1.5} />
                  </ActionIcon>
                  <Text
                    ta="center"
                    size="xs"
                    style={{ wordBreak: 'break-word' }}
                    w={80}
                  >
                    Novos
                    <br />
                    artistas
                  </Text>
                </Flex>
                <Flex direction="column" align="center" w={80}>
                  <ActionIcon
                    variant="default"
                    color="gray"
                    size="xl"
                    aria-label="Teste"
                    w={80}
                    h={80}
                    mb="xs"
                  >
                    <IconGuitarPick size={32} stroke={1.5} />
                  </ActionIcon>
                  <Text
                    ta="center"
                    size="xs"
                    style={{ wordBreak: 'break-word' }}
                    w={80}
                  >
                    Buscar
                    <br />
                    marcas
                  </Text>
                </Flex>
              </Group>
            </Scroller>

            {genreStats.length > 0 && (
              <Title order={2} fz="h3" fw={600} lts="-0.02em" mb="xs">
                Gêneros mais tocados por você
              </Title>
            )}

            {genreStats.length > 0 ? (
              <Paper p="md" className="alphaBg" mb="lg" radius="lg">
                <Stack gap="xs">
                  <Progress.Root size={20} radius="xl">
                    {genreStats.map((stat) => (
                      <Progress.Section
                        value={stat.value}
                        color={stat.color}
                        key={stat.label}
                      >
                        {stat.value > 10 && (
                          <Progress.Label>{stat.value}%</Progress.Label>
                        )}
                      </Progress.Section>
                    ))}
                  </Progress.Root>
                  <Stack gap={4}>
                    {genreStats.map((stat) => (
                      <Group
                        key={stat.label}
                        justify="space-between"
                        wrap="nowrap"
                      >
                        <Group gap={8}>
                          <Box
                            w={10}
                            h={10}
                            style={{
                              backgroundColor: `var(--mantine-color-${stat.color.split('.')[0]}-${stat.color.split('.')[1] || '6'})`,
                              borderRadius: '50%',
                            }}
                          />
                          <Text size="sm" fw={500}>
                            {stat.label}
                          </Text>
                        </Group>
                        <Text size="sm" c="dimmed">
                          {stat.value}%
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            ) : null}

            <Title order={2} fz="h3" fw={600} lts="-0.02em" mb="xs">
              Meus projetos associados
            </Title>

            <Table
              highlightOnHover={false}
              horizontalSpacing={0}
              verticalSpacing={10}
            >
              {/* <Table.Thead>
                <Table.Tr>
                  <Table.Th w="50%">Projeto</Table.Th>
                  <Table.Th w="50%">Atividade principal</Table.Th>
                </Table.Tr>
              </Table.Thead> */}
              <Table.Tbody>
                {userProjects.length > 0 ? (
                  userProjects.map((project) => (
                    <Table.Tr key={project.id}>
                      <Table.Td
                        w="55%"
                        opacity={project.request_status === 1 ? 0.4 : 1}
                      >
                        <Link
                          to={`/project/${project.slug}`}
                          className="noDecoration"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            color: 'var(--mantine-color-text)',
                          }}
                        >
                          <Avatar
                            size={40}
                            src={
                              project?.picture
                                ? `${PROJECT_AVATAR_PATH}/${project?.id}/tr:h-80,w-80,c-maintain_ratio/${project?.picture}`
                                : undefined
                            }
                            alt={project.name}
                          />
                          <Flex direction="column" gap={3}>
                            <Text
                              size="sm"
                              fw={700}
                              lh={1}
                              w={100}
                              truncate="end"
                            >
                              {project.name}{' '}
                            </Text>
                            <Text size="xs" c="dimmed" w={100} truncate="end">
                              {project.type}{' '}
                              {project.genre ? `· ${project.genre}` : ''}
                            </Text>
                            {project.activity_status && (
                              <Group gap={8} wrap="nowrap">
                                <Indicator
                                  color={
                                    project.activity_status_color ?? 'gray'
                                  }
                                  processing={project.activity_status === 1}
                                  size={5}
                                />
                                <Text
                                  size="11px"
                                  lh={1}
                                  c={
                                    !project.activity_status_color
                                      ? 'dimmed'
                                      : undefined
                                  }
                                >
                                  {project.activity_status_name
                                    ? project.activity_status_name
                                    : 'Não informado'}
                                  {project.end_year &&
                                    ` em ${project.end_year}`}
                                </Text>
                              </Group>
                            )}
                          </Flex>
                        </Link>
                      </Table.Td>
                      <Table.Td w="45%">
                        <Flex direction="column" gap={2}>
                          <Text
                            size="sm"
                            fw={300}
                            opacity={project.request_status === 1 ? 0.4 : 1}
                            w={150}
                            truncate="end"
                          >
                            {project.main_role}{' '}
                            {project.is_founder && (
                              <Text span c="dimmed" size="xs">
                                (Fundador)
                              </Text>
                            )}
                          </Text>
                          {project.request_status !== 1 && (
                            <>
                              {!project.end_year ? (
                                <Flex gap={8} align="center">
                                  <Indicator
                                    color={project.left_at ? 'red' : 'green'}
                                    size={5}
                                  />
                                  <Text size="11px" className="lhNormal">
                                    {`${project.joined_at} ➜ ${project.left_at ? project.left_at : currentYear}`}{' '}
                                    {project.left_at
                                      ? showYears(
                                          project.left_at - project.joined_at,
                                        )
                                      : showYears(
                                          currentYear - project.joined_at,
                                        )}
                                  </Text>
                                </Flex>
                              ) : (
                                <Flex gap={8} align="center">
                                  <Indicator color="red" size={5} />
                                  <Text size="11px" className="lhNormal">
                                    {`${project.joined_at} ➜ ${project.end_year}`}{' '}
                                    {showYears(
                                      project.end_year - project.joined_at,
                                    )}
                                  </Text>
                                </Flex>
                              )}
                            </>
                          )}
                          <Group>
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
                              <Text c="dimmed" size="xs">
                                Ex integrante
                              </Text>
                            )}
                          </Group>
                        </Flex>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td c="dimmed" colSpan={4} ta="center">
                      Nenhum projeto associado ao seu perfil
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>

            {userProjects.length > 0 ? (
              <Stack gap="xs">
                {userProjects.map((project) => (
                  <Paper key={project.id} p="sm">
                    <Grid>
                      <Grid.Col
                        span={{ base: 12, md: 6, lg: 6 }}
                        opacity={project.request_status === 1 ? 0.4 : 1}
                      >
                        <Link
                          to={`/project/${project.slug}`}
                          className="noDecoration"
                          mb="md"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            color: 'var(--mantine-color-text)',
                          }}
                        >
                          <Avatar
                            size={50}
                            src={
                              project?.picture
                                ? `${PROJECT_AVATAR_PATH}/${project?.id}/tr:h-100,w-100,c-maintain_ratio/${project?.picture}`
                                : undefined
                            }
                            alt={project.name}
                          />
                          <Flex direction="column" gap={3}>
                            <Title
                              order={3}
                              size="md"
                              fw={600}
                              lh={1}
                              w={120}
                              truncate="end"
                            >
                              {project.name}{' '}
                            </Title>
                            <Text size="sm" c="dimmed" w={120} truncate="end">
                              {project.type}{' '}
                              {project.genre ? `· ${project.genre}` : ''}
                            </Text>
                            {project.activity_status && (
                              <Group gap={8} wrap="nowrap">
                                <Indicator
                                  color={
                                    project.activity_status_color ?? 'gray'
                                  }
                                  processing={project.activity_status === 1}
                                  size={5}
                                />
                                <Text
                                  size="11px"
                                  lh={1}
                                  c={
                                    !project.activity_status_color
                                      ? 'dimmed'
                                      : undefined
                                  }
                                >
                                  {project.activity_status_name
                                    ? project.activity_status_name
                                    : 'Não informado'}
                                  {project.end_year &&
                                    ` em ${project.end_year}`}
                                </Text>
                              </Group>
                            )}
                          </Flex>
                        </Link>
                        <Text
                          size="sm"
                          fw={300}
                          opacity={project.request_status === 1 ? 0.4 : 1}
                          w={150}
                          truncate="end"
                        >
                          {project.main_role}{' '}
                          {project.is_founder && (
                            <Text span c="dimmed" size="xs">
                              (Fundador)
                            </Text>
                          )}
                        </Text>
                        {project.request_status !== 1 && (
                          <>
                            {!project.end_year ? (
                              <Flex gap={8} align="center">
                                <Indicator
                                  color={project.left_at ? 'red' : 'green'}
                                  size={5}
                                />
                                <Text size="11px" className="lhNormal">
                                  {`${project.joined_at} ➜ ${project.left_at ? project.left_at : currentYear}`}{' '}
                                  {project.left_at
                                    ? showYears(
                                        project.left_at - project.joined_at,
                                      )
                                    : showYears(
                                        currentYear - project.joined_at,
                                      )}
                                </Text>
                              </Flex>
                            ) : (
                              <Flex gap={8} align="center">
                                <Indicator color="red" size={5} />
                                <Text size="11px" className="lhNormal">
                                  {`${project.joined_at} ➜ ${project.end_year}`}{' '}
                                  {showYears(
                                    project.end_year - project.joined_at,
                                  )}
                                </Text>
                              </Flex>
                            )}
                          </>
                        )}
                        <Group>
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
                            <Text c="dimmed" size="xs">
                              Ex integrante
                            </Text>
                          )}
                        </Group>
                      </Grid.Col>
                      <Grid.Col
                        span={{ base: 12, md: 6, lg: 6 }}
                        opacity={project.request_status === 1 ? 0.4 : 1}
                      >
                        <Flex direction="column" gap={2}>
                          <Text
                            size="sm"
                            fw={300}
                            opacity={project.request_status === 1 ? 0.4 : 1}
                            w={150}
                            truncate="end"
                          >
                            {project.main_role}{' '}
                            {project.is_founder && (
                              <Text span c="dimmed" size="xs">
                                (Fundador)
                              </Text>
                            )}
                          </Text>
                          {project.request_status !== 1 && (
                            <>
                              {!project.end_year ? (
                                <Flex gap={8} align="center">
                                  <Indicator
                                    color={project.left_at ? 'red' : 'green'}
                                    size={5}
                                  />
                                  <Text size="11px" className="lhNormal">
                                    {`${project.joined_at} ➜ ${project.left_at ? project.left_at : currentYear}`}{' '}
                                    {project.left_at
                                      ? showYears(
                                          project.left_at - project.joined_at,
                                        )
                                      : showYears(
                                          currentYear - project.joined_at,
                                        )}
                                  </Text>
                                </Flex>
                              ) : (
                                <Flex gap={8} align="center">
                                  <Indicator color="red" size={5} />
                                  <Text size="11px" className="lhNormal">
                                    {`${project.joined_at} ➜ ${project.end_year}`}{' '}
                                    {showYears(
                                      project.end_year - project.joined_at,
                                    )}
                                  </Text>
                                </Flex>
                              )}
                            </>
                          )}
                          <Group>
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
                              <Text c="dimmed" size="xs">
                                Ex integrante
                              </Text>
                            )}
                          </Group>
                        </Flex>
                      </Grid.Col>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Paper>
                <Text c="dimmed" ta="center">
                  Nenhum projeto associado ao seu perfil
                </Text>
              </Paper>
            )}

            <Title order={2} fz="h3" fw={600} lts="-0.02em" mt="lg" mb="md">
              Itens em destaque
            </Title>

            <Scroller
              key={featuredProducts.length}
              draggable
              controlSize="xl"
              showEndControl={featuredProducts.length > 4}
              startControlIcon={<IconCircleArrowLeftFilled size={36} />}
              endControlIcon={<IconCircleArrowRightFilled size={36} />}
              mb="sm"
            >
              <Group gap="xs" wrap="nowrap">
                {featuredProducts.map((item) => (
                  <Flex key={item.id} direction="column" wrap="wrap">
                    <Link to={`/gear/${item.slug}`}>
                      <Image
                        src={
                          item.picture
                            ? PATH_PRODUCT_IMAGE_MOBILE + item.picture
                            : undefined
                        }
                        bg="white"
                        h={120}
                        mah={120}
                        miw={90}
                        fit="contain"
                        mb={4}
                        radius="md"
                        alt={`${item.brand_name} ${item.name}`}
                        style={{ pointerEvents: 'none' }}
                      />
                    </Link>
                    <Text
                      size="11px"
                      truncate="end"
                      fw={300}
                      my={4}
                      c="dimmed"
                      w={75}
                    >
                      {item.brand_name}
                    </Text>
                    <Text
                      size="xs"
                      fw={500}
                      fz="xs"
                      h={40}
                      w={75}
                      truncate="end"
                    >
                      {item.name}
                    </Text>
                  </Flex>
                ))}
              </Group>
            </Scroller>
          </Grid.Col>

          {isDesktop && (
            <Grid.Col span={{ base: 12, md: 5 }} px={0}>
              <Feed />
            </Grid.Col>
          )}
        </Grid>
      </Container>
    </>
  )
}
