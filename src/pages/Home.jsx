import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import {
  fetchUserProjects,
  fetchUserGigsCount,
  fetchUserGearCount,
} from '../queries/user'
import { fetchUserGigs } from '../queries/gigs'
import {
  Grid,
  SimpleGrid,
  Group,
  Container,
  Stack,
  Badge,
  Box,
  Text,
  Title,
  Table,
  Paper,
  ThemeIcon,
  RingProgress,
  ActionIcon,
} from '@mantine/core'
import { BarChart } from '@mantine/charts'
import { useMediaQuery } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import WelcomeAlert from '../components/WelcomeAlertHome'
import { PROJECT_ACTIVITY_STATUS } from '../constants/projects'
import Feed from './Feed'
import {
  IconCircleFilled,
  IconMicrophone,
  IconGuitarPick,
  IconCalendarEvent,
  IconClipboardCheck,
  IconDeviceSpeaker,
  IconUsersGroup,
  IconPlus,
  IconMusic,
  IconBox,
  IconMicrophone2,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects/'

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

  const userProjectsActive = userProjects.filter(
    (p) => p.activity_status === PROJECT_ACTIVITY_STATUS.RUNNING,
  )

  const { data: gigs = [], isLoading: loadingGigs } = useQuery({
    queryKey: ['user-gigs', user?.id],
    queryFn: () => fetchUserGigs(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  console.log(gigs)

  const { data: gearCount = [], isLoading: loadingGearCount } = useQuery({
    queryKey: ['user-gear-count', user?.id],
    queryFn: () => fetchUserGearCount(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  })

  const { data: gigsCount = [], isLoading: loadingGigsCount } = useQuery({
    queryKey: ['user-gigs-count', user?.id],
    queryFn: () => fetchUserGigsCount(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  })

  const statsData = [
    {
      label: 'Gigs Confirmadas',
      value: '12',
      icon: IconCalendarEvent,
      color: 'blue',
    },
    {
      label: 'Projetos Ativos',
      value: '4',
      icon: IconMicrophone,
      color: 'teal',
    },
    {
      label: 'Equipamentos',
      value: '28',
      icon: IconGuitarPick,
      color: 'orange',
    },
    {
      label: 'Candidaturas',
      value: '7',
      icon: IconClipboardCheck,
      color: 'grape',
    },
  ]

  const data = [
    {
      month: dayjs().month(0).format('MMMM'),
      Shows: 0,
      Ensaios: 0,
      Lives: 0,
      Workshops: 0,
    },
    {
      month: dayjs().month(1).format('MMMM'),
      Shows: 0,
      Ensaios: 0,
      Lives: 0,
      Workshops: 0,
    },
    {
      month: dayjs().month(2).format('MMMM'),
      Shows: 0,
      Ensaios: 0,
      Lives: 0,
      Workshops: 0,
    },
    {
      month: dayjs().month(3).format('MMMM'),
      Shows: 0,
      Ensaios: 0,
      Lives: 0,
      Workshops: 0,
    },
    {
      month: dayjs().month(4).format('MMMM'),
      Shows: 0,
      Ensaios: 0,
      Lives: 0,
      Workshops: 0,
    },
    {
      month: dayjs().month(5).format('MMMM'),
      Shows: 0,
      Ensaios: 0,
      Lives: 0,
      Workshops: 0,
    },
  ]

  return (
    <>
      <AppNavbarMobile />

      <Container size="xl" pt="xs" px={{ base: 0, sm: 0 }}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }} className="paddingX">
            <Title order={2} fz="h3" fw={600} lts="-0.02em" mb="sm">
              Olá, {profile.username}
            </Title>

            {/* <WelcomeAlert /> */}

            <Grid mb="md">
              <Grid.Col span={4} h={66}>
                <Paper p="sm" pos="relative" className="alphaBg" h="100%">
                  <Box pos="absolute" right={10} top={10}>
                    <IconMusic size={16} color="gray" />
                  </Box>
                  <Title order={4} fw={400} size="xs" mb={4}>
                    Total de Projetos
                  </Title>
                  <Group gap="xs">
                    <Text size="lg" fw={600} lh={1}>
                      {userProjects.length}
                    </Text>
                    <Badge size="xs" color="green">
                      {userProjectsActive.length} ativos
                    </Badge>
                  </Group>
                </Paper>
              </Grid.Col>
              <Grid.Col span={4}>
                <Paper p="sm" pos="relative" className="alphaBg" h="100%">
                  <Box pos="absolute" right={10} top={10}>
                    <IconMicrophone2 size={16} color="gray" />
                  </Box>
                  <Title order={4} fw={400} size="xs" mb={4}>
                    Total de Gigs
                  </Title>
                  <Text size="lg" fw={600} lh={1}>
                    {gigsCount ?? 0}
                  </Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={4}>
                <Paper p="sm" pos="relative" className="alphaBg" h="100%">
                  <Box pos="absolute" right={10} top={10}>
                    <IconBox size={16} color="gray" />
                  </Box>
                  <Title order={4} fw={400} size="xs" mb={4}>
                    Equipamentos
                  </Title>
                  <Text size="lg" fw={600} lh={1}>
                    {gearCount ?? 0}
                  </Text>
                </Paper>
              </Grid.Col>
            </Grid>

            <Title order={3} fz="h5" fw={600} lts="-0.02em" mb="xs">
              Próximas gigs
            </Title>
            <Table
              mb="lg"
              horizontalSpacing={4}
              verticalSpacing={4}
              highlightOnHover
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w="10%">Projeto</Table.Th>
                  <Table.Th w="30%">Evento</Table.Th>
                  <Table.Th w="15%">Data</Table.Th>
                  <Table.Th w="10%">Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {gigs.map((gig) => (
                  <Table.Tr>
                    <Table.Td>
                      <Text size="xs" lineClamp={2}>
                        {gig.gigs?.projects?.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" fw={600} lineClamp={1}>
                        {gig.gigs?.events?.name}
                      </Text>
                      <Text size="xs" lineClamp={2}>
                        {gig.gigs?.title}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">
                        {/* {dayjs(gig.gigs?.events?.date_start).fromNow()} */}
                        {dayjs(gig.gigs?.events?.date_start).format(
                          'dddd, D [de] MMMM [de] YYYY',
                        )}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge size="xs" color="green">
                        Aceito
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Box mb="lg">
              <Title order={3} fz="h5" fw={600} lts="-0.02em" mb="xs">
                Gigs nos últimos meses
              </Title>
              <BarChart
                h={160}
                data={data}
                dataKey="month"
                withLegend
                withTooltip
                series={[
                  { name: 'Shows', color: 'violet.6' },
                  { name: 'Ensaios', color: 'blue.6' },
                  { name: 'Lives', color: 'red.6' },
                  { name: 'Workshops', color: 'gray.6' },
                ]}
              />
            </Box>

            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Projeto</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>
                    <IconUsersGroup size={18} />
                  </Table.Th>
                  <Table.Th>Atomic mass</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {userProjects.map((project) => (
                  <Table.Tr key={project.id}>
                    <Table.Td>{project.name}</Table.Td>
                    <Table.Td>{project.type}</Table.Td>
                    <Table.Td>{project.totalMembers}</Table.Td>
                    <Table.Td>4</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
              <Text size="xs">Você possui {userProjects.length} projetos</Text>
              <Grid>
                <Grid.Col span={6}>
                  <IconCircleFilled size={10} color="#eba800" /> Pendentes
                </Grid.Col>
                <Grid.Col span={6}>
                  <IconCircleFilled size={10} color="#198a4c" /> Aceitos
                </Grid.Col>
              </Grid>
            </Paper>

            <Stack gap="md">
              {/* 1. Métricas Rápidas (Cards de Resumo) */}
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
                {statsData.map((stat) => (
                  <Paper key={stat.label} withBorder p="md" radius="md">
                    <Group justify="space-between">
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                          {stat.label}
                        </Text>
                        <Text fw={700} fz="xl">
                          {stat.value}
                        </Text>
                      </Stack>
                      <ThemeIcon
                        color={stat.color}
                        variant="light"
                        size="xl"
                        radius="md"
                      >
                        <stat.icon size="1.4rem" />
                      </ThemeIcon>
                    </Group>
                  </Paper>
                ))}
              </SimpleGrid>

              <Grid>
                {/* 2. Gráfico de Distribuição de Atividade (Foco de Trabalho) */}
                {/* Refere-se a public.profile_work_focus no seu DB */}
                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Paper withBorder p="md" radius="md" h="100%">
                    <Title order={4} mb="lg" fz="sm" fw={600} c="dimmed">
                      FOCO DE ATIVIDADE
                    </Title>
                    <Group justify="center">
                      <RingProgress
                        size={170}
                        thickness={16}
                        label={
                          <Text size="xs" ta="center" px="xs" lh="xs">
                            Composição vs Performance
                          </Text>
                        }
                        sections={[
                          { value: 40, color: 'cyan', tooltip: 'Autoral' },
                          {
                            value: 35,
                            color: 'orange',
                            tooltip: 'Cover/Tributo',
                          },
                          {
                            value: 25,
                            color: 'gray',
                            tooltip: 'Estudo/Outros',
                          },
                        ]}
                      />
                      <Stack gap="xs">
                        <Badge color="cyan" variant="dot">
                          Autoral (40%)
                        </Badge>
                        <Badge color="orange" variant="dot">
                          Cover (35%)
                        </Badge>
                        <Badge color="gray" variant="dot">
                          Freelance (25%)
                        </Badge>
                      </Stack>
                    </Group>
                  </Paper>
                </Grid.Col>

                {/* 3. Próximos Compromissos (public.gigs + public.events) */}
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <Paper withBorder p="md" radius="md" h="100%">
                    <Title order={4} mb="md" fz="sm" fw={600} c="dimmed">
                      PRÓXIMAS GIGS & ENSAIOS
                    </Title>
                    <Stack gap="sm">
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm">
                          <ThemeIcon variant="light" color="blue">
                            <IconDeviceSpeaker size="1rem" />
                          </ThemeIcon>
                          <Box>
                            <Text size="sm" fw={500}>
                              Show: Festival de Inverno
                            </Text>
                            <Text size="xs" c="dimmed">
                              Sábado, 20:00 • Palco Principal
                            </Text>
                          </Box>
                        </Group>
                        <Badge size="sm">Confirmado</Badge>
                      </Group>

                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm">
                          <ThemeIcon variant="light" color="teal">
                            <IconMicrophone size="1rem" />
                          </ThemeIcon>
                          <Box>
                            <Text size="sm" fw={500}>
                              Ensaio: Banda Rock Indie
                            </Text>
                            <Text size="xs" c="dimmed">
                              Terça, 18:00 • Estúdio X
                            </Text>
                          </Box>
                        </Group>
                        <Badge size="sm" color="yellow">
                          Pendente
                        </Badge>
                      </Group>
                    </Stack>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Stack>
          </Grid.Col>

          {isDesktop && (
            <Grid.Col span={{ base: 12, md: 5 }} px={0}>
              <Group
                align="center"
                justify="space-between"
                mb="xs"
                className="paddingX"
              >
                <Title order={2} fz="h3" fw={600} lts="-0.02em">
                  Feed
                </Title>
                {/* <Button
                  size="xs"
                  variant="subtle"
                  color="var(--mantine-color-text)"
                  leftSection={<IconPencil size={16} />}
                >
                  Postar
                </Button> */}
                <ActionIcon
                  size="lg"
                  variant="subtle"
                  color="var(--mantine-color-text)"
                  aria-description="Nova postagem"
                >
                  <IconPlus size={16} />
                </ActionIcon>
              </Group>
              <Feed />
            </Grid.Col>
          )}
        </Grid>
      </Container>
    </>
  )
}
