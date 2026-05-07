import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects, fetchUserGearCount } from '../queries/user'
import { fetchUserGigs } from '../queries/gigs'
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
  RingProgress,
  ActionIcon,
  Scroller,
  Card,
  Flex,
  Skeleton,
  Indicator,
  Tooltip,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { PROJECT_ACTIVITY_STATUS } from '../constants/projects'
import Feed from './Feed'
import {
  IconUsersGroup,
  IconArrowRight,
  IconMicrophone2,
  IconPlus,
  IconMapPin,
  IconCalendar,
  IconBulb,
  IconRadar,
  IconStar,
  IconGuitarPick,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'

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

  const { data: gearCount = [], isLoading: loadingGearCount } = useQuery({
    queryKey: ['user-gear-count', user?.id],
    queryFn: () => fetchUserGearCount(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  })

  return (
    <>
      <AppNavbarMobile />

      <Container size="xl" pt="xs" px={{ base: 0, sm: 0 }}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }} className="paddingX">
            {loading || loadingProjects ? (
              <Paper c="white" p="sm" className="alphaBg" mb="sm" radius="lg">
                <Skeleton radius="xl" w={100} h={23} mt={2} mb={3} />
                <Skeleton radius="xl" w={150} h={30} mt={6} mb={3} />
                <Skeleton radius="xl" w={84} h={22} mb={3} />
                <Group gap="xs" mt="xs">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} radius="xl" w={35} h={35} />
                  ))}
                </Group>
                <Skeleton mt="sm" radius="xl" w={230} h={34} />
              </Paper>
            ) : (
              <Paper
                c="white"
                p="sm"
                bg="mublinColor.9"
                className="alphaBg"
                mb="sm"
                radius="lg"
              >
                <Title
                  order={4}
                  fz="h5"
                  fw={300}
                  lts="-0.02em"
                  mb={2}
                  opacity={0.8}
                >
                  Olá, {profile.username}
                </Title>
                <Text size="xl" fw={500} lts="-0.02em">
                  Você está associado a {userProjects.length} projetos
                </Text>
                <Text size="sm" fw={300}>
                  {userProjectsActive.length}{' '}
                  {userProjectsActive.length === 1 ? 'projeto' : 'projetos'} em
                  atividade
                </Text>
                <Scroller mt="xs">
                  <Group gap="xs">
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
                          <Avatar
                            size={35}
                            src={
                              project?.picture
                                ? `${PROJECT_AVATAR_PATH}/${project?.id}/tr:h-70,w-70,c-maintain_ratio/${project?.picture}`
                                : undefined
                            }
                            title={project.name}
                          />
                        </Tooltip>
                      </Indicator>
                    ))}
                  </Group>
                </Scroller>
                <Button
                  size="sm"
                  mt={10}
                  radius="xl"
                  leftSection={<IconPlus size={14} />}
                >
                  Criar novo projeto de música
                </Button>
              </Paper>
            )}

            <Button
              fullWidth
              variant="gradient"
              gradient={{ from: 'grape.8', to: 'mublinColor.8', deg: 55 }}
              radius="xl"
              size="sm"
              leftSection={<IconMicrophone2 size={18} />}
              rightSection={<IconArrowRight size={18} />}
              justify="space-between"
              mt="md"
              mb="lg"
            >
              Encontre gigs para tocar!
            </Button>

            <Title order={2} fz="h4" fw={600} lts="-0.02em" mb="xs">
              Próximas gigs
            </Title>

            <Scroller mb="md">
              <Group gap="xs" wrap="nowrap">
                {loadingGigs
                  ? [1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} w={250} h={111} />
                    ))
                  : gigs.map((gig) => (
                      <Card key={gig.id} shadow="xs" padding="xs" w={250}>
                        <Card.Section withBorder px="xs" py={8}>
                          <Group gap={5} justify="space-between">
                            <Text size="xs" lh={1} c="dimmed">
                              {dayjs(gig.gigs?.events?.date_start).fromNow()}
                            </Text>
                            <Badge size="xs" color="green">
                              Aceito
                            </Badge>
                          </Group>
                        </Card.Section>
                        <Stack gap={3} mt={6}>
                          <Group gap={5} justify="flex-start">
                            <Text size="xs" fw={600} key={gig.id} lh={1}>
                              {gig.gig_roles?.roles?.description_ptbr}
                            </Text>

                            <Text size="xs" fw={300} key={gig.id} lh={1}>
                              em
                            </Text>
                            <Avatar
                              size={20}
                              src={
                                gig.gigs?.projects?.picture
                                  ? `${PROJECT_AVATAR_PATH}/${gig.gigs?.projects?.id}/tr:h-40,w-40,c-maintain_ratio/${gig.gigs?.projects?.picture}`
                                  : undefined
                              }
                            />
                            <Text
                              size="xs"
                              fw={300}
                              w={65}
                              truncate="end"
                              lh={1}
                            >
                              {gig.gigs?.projects?.name}
                            </Text>
                          </Group>
                          <Text size="md" fw={200} lineClamp={1}>
                            {gig.gigs?.events?.name}
                          </Text>
                          <Text size="xs" fw={400} lh={1}>
                            {dayjs(gig.gigs?.events?.date_start).format(
                              'dddd, D [de] MMMM [de] YYYY',
                            )}
                          </Text>
                          <Group gap={2} align="center" mt={6}>
                            <IconMapPin size={14} color="gray" />
                            <Text size="xs" c="dimmed" lh={1}>
                              {gig.gigs?.events?.venues?.name}{' '}
                              {gig.gigs?.events?.venues?.cities?.name},{' '}
                              {gig.gigs?.events?.venues?.cities?.regions?.uf
                                ? gig.gigs?.events?.venues?.cities?.regions?.uf
                                : gig.gigs?.events?.venues?.cities?.regions
                                    ?.name}
                            </Text>
                          </Group>
                        </Stack>
                      </Card>
                    ))}
              </Group>
            </Scroller>

            <Title order={2} fz="h4" fw={600} lts="-0.02em" mb="xs">
              Para o dia a dia
            </Title>

            <Scroller mb="lg">
              <Group gap="xs" wrap="nowrap">
                <Flex direction="column" align="center" w={80}>
                  <ActionIcon
                    variant="gradient"
                    gradient={{ from: 'grape.8', to: 'mublinColor.8', deg: 55 }}
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

            <Title order={2} fz="h4" fw={600} lts="-0.02em" mb="xs">
              Foco de atividades nos últimos meses
            </Title>

            <Paper withBorder p="md" radius="md">
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
          </Grid.Col>

          {isDesktop && (
            <Grid.Col span={{ base: 12, md: 5 }} px={0}>
              {/* <Group
                align="center"
                justify="space-between"
                mb="xs"
                className="paddingX"
              >
                <Flex gap="sm">
                  <Title order={2} fz="h3" fw={600} lts="-0.02em">
                    Feed
                  </Title>
                  <ActionIcon
                    size="lg"
                    variant="subtle"
                    color="var(--mantine-color-text)"
                    aria-description="Nova postagem"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Flex>

                <Flex gap="sm">
                  <Title order={3} fz="h4" fw={600} lts="-0.02em">
                    Explorar
                  </Title>
                  <Title order={3} fz="h4" fw={600} lts="-0.02em" opacity={0.3}>
                    Seguindo
                  </Title>
                </Flex>
              </Group> */}
              <Feed />
            </Grid.Col>
          )}
        </Grid>
      </Container>
    </>
  )
}
