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
  ActionIcon,
  Scroller,
  Card,
  Flex,
  Skeleton,
  Indicator,
  Tooltip,
  Box,
  Progress,
} from '@mantine/core'
import { BorderAnimate } from '@gfazioli/mantine-border-animate'
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

  const stats = [
    { label: 'Rock', value: 60, color: 'blue.7' },
    { label: 'Pop', value: 20, color: 'pink.6' },
    { label: 'Reggae', value: 20, color: 'green.8' },
  ]

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
              <Paper
                c="white"
                p="md"
                bg="mublinColor.9"
                className="alphaBg"
                mb="sm"
                radius="lg"
              >
                <Text fz="19px" fw={500} lts="-0.02em" mb={1}>
                  Olá, {profile.username}
                </Text>
                <Text fz="19px" fw={500}>
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

            <BorderAnimate
              beamMode="path"
              size="lg"
              radius="xl"
              borderWidth="xs"
              mt="md"
              mb="lg"
            >
              <Button
                fullWidth
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
            </BorderAnimate>

            <Title order={2} fz="h4" fw={600} lts="-0.02em" mb="xs">
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
                      <Card.Section withBorder px="xs" py={8}>
                        <Group gap={5} justify="space-between">
                          <Text size="xs" lh={1} c="dimmed">
                            {dayjs(gig.gigs?.events?.date_start).fromNow()}
                          </Text>
                          <Badge size="xs" color="green" variant="light">
                            Aceito
                          </Badge>
                        </Group>
                      </Card.Section>

                      <Stack gap={3} mt={6}>
                        <Group gap={5} justify="flex-start" wrap="nowrap">
                          <Text size="xs" fw={600} lh={1} truncate>
                            {gig.gig_roles?.roles?.description_ptbr}
                          </Text>
                          <Text size="xs" fw={300} lh={1}>
                            em
                          </Text>
                          <Avatar
                            size={20}
                            radius="xl"
                            src={
                              gig.gigs?.projects?.picture
                                ? `${PROJECT_AVATAR_PATH}/${gig.gigs?.projects?.id}/tr:h-40,w-40,c-maintain_ratio/${gig.gigs?.projects?.picture}`
                                : undefined
                            }
                          />
                          <Text size="xs" fw={300} w={65} truncate="end" lh={1}>
                            {gig.gigs?.projects?.name}
                          </Text>
                        </Group>

                        <Text size="md" fw={500} lineClamp={1} lts="-0.01em">
                          {gig.gigs?.events?.name}
                        </Text>

                        <Text size="xs" fw={400} lh={1} c="dimmed">
                          {dayjs(gig.gigs?.events?.date_start).format(
                            'dddd, D [de] MMMM',
                          )}
                        </Text>

                        <Group gap={2} align="center" mt={4}>
                          <IconMapPin size={12} color="gray" />
                          <Text size="xs" c="dimmed" lh={1} truncate>
                            {gig.gigs?.events?.venues?.name}
                          </Text>
                        </Group>
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
              Gêneros mais tocados nas gigs
            </Title>

            <Paper c="white" p="md" className="alphaBg" mb="sm" radius="lg">
              <Stack gap="xs">
                {/* Gráfico de Barras Segmentado */}
                <Progress.Root size={24} radius="xl">
                  {stats.map((stat) => (
                    <Progress.Section
                      value={stat.value}
                      color={stat.color}
                      key={stat.label}
                    >
                      {/* O label dentro da seção aparece se houver espaço (opcional) */}
                      {stat.value > 10 && (
                        <Progress.Label>{stat.value}%</Progress.Label>
                      )}
                    </Progress.Section>
                  ))}
                </Progress.Root>

                <Stack gap={4} mt="sm">
                  {stats.map((stat) => (
                    <Group
                      key={stat.label}
                      justify="space-between"
                      wrap="nowrap"
                    >
                      <Group gap={8}>
                        <Box
                          w={12}
                          h={12}
                          style={{
                            backgroundColor: `var(--mantine-color-${stat.color.split('.')[0]}-${stat.color.split('.')[1] || '6'})`,
                            borderRadius: '50%',
                          }}
                        />
                        <Text size="sm" fw={500}>
                          {stat.label}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" fw={600}>
                        {stat.value}%
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Stack>
            </Paper>

            <Title order={2} fz="h4" fw={600} lts="-0.02em" mb="xs">
              Lista de projetos
            </Title>

            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Projeto</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>
                    <IconUsersGroup size={18} />
                  </Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {userProjects.length > 0 ? (
                  userProjects.map((project) => (
                    <Table.Tr key={project.id}>
                      <Table.Td>{project.name}</Table.Td>
                      <Table.Td>{project.type}</Table.Td>
                      <Table.Td>{project.totalMembers}</Table.Td>
                      <Table.Td>4</Table.Td>
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
