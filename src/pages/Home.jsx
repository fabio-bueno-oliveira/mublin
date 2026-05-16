import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects, fetchUserGearCount } from '../queries/user'
import { fetchUserGigs } from '../queries/gigs'
import { fetchFeaturedProducts } from '../queries/gear'
// prettier-ignore
import {
  Grid, Group,Flex,
  Container, Stack, Scroller,
  Badge, Button,
  Skeleton,
  Text, Title,
  Paper, Card, Box,
  Anchor, ActionIcon,
  Avatar, Image, Progress,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
// import { PROJECT_ACTIVITY_STATUS } from '../constants/projects'
import Feed from './Feed'
import {
  IconArrowRight,
  IconMicrophone2,
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
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

// const AVATAR_PATH =
//   'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
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
    role_2_id: p.role_2_id,
    role_3_id: p.role_3_id,
    totalMembers: p.projects.project_members?.length || 0,
  }))

  // const userProjectsActive = userProjects.filter(
  //   (p) => p.activity_status === PROJECT_ACTIVITY_STATUS.RUNNING,
  // )

  const additionalRolesCount = (project) => {
    if (project.role_2_id && !project.role_3_id) {
      return '+ 1'
    } else if (project.role_2_id && project.role_3_id) {
      return '+ 2'
    }
  }

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

  const { data: featuredProducts = [], isLoading: loadingFeaturedProducts } = useQuery({
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

  return (
    <>
      <AppNavbarMobile />

      <Container size="xl" pt="xs" px={{ base: 0, sm: 0 }}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }} className="paddingX">
            {loading || loadingProjects ? (
              <Box mb="sm">
                <Text fz="h2" fw={700} lts="-0.02em">
                  Carregando...
                </Text>
                <Text fz="md" opacity={0.8} lh={1}>
                  Buscando seus projetos...
                </Text>
                <Group mt="lg" align="flex-start" gap="md" wrap="nowrap" pr="md">
                  {[1, 2, 3, 4].map((i) => (
                    <Stack key={i} gap={6} size={80}>
                      <Skeleton radius="md" w={80} h={80} />
                      <Flex direction="column" gap={4}>
                        <Skeleton radius="xl" w={72} h={12} my={1} />
                        <Skeleton radius="xl" w={56} h={8} />
                        <Skeleton radius="xl" w={64} h={8} />
                      </Flex>
                    </Stack>
                  ))}
                </Group>
              </Box>
            ) : (
              <Box>
                <Text fz="h2" fw={700} lts="-0.02em">
                  Olá, {profile.username}
                </Text>
                <Group justify="space-between">
                  <Text fz="md" opacity={0.9} lh={1}>
                    Você está associado a{' '}
                    {userProjects.length === 1
                      ? '1 projeto'
                      : `${userProjects.length} projetos`}
                  </Text>
                  <Anchor component={Link} lh={1} to="/projects" fz="sm" fw={500}>
                    Ver todos
                  </Anchor>
                </Group>
                {!!userProjects.length && (
                  <Scroller
                    mt="lg"
                    key={userProjects.length}
                    draggable={!isDesktop}
                    controlSize="xl"
                    startControlIcon={
                      isDesktop ? <IconCircleArrowLeftFilled size={36} /> : undefined
                    }
                    endControlIcon={
                      isDesktop ? <IconCircleArrowRightFilled size={36} /> : undefined
                    }
                  >
                    <Group align="flex-start" gap="md" wrap="nowrap" pr="md">
                      {userProjects.map((project) => (
                        <Stack key={project.id} gap={6} size={90}>
                          <Link to={`/project/${project.slug}`}>
                            <Box
                              radius="md"
                              style={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                overflow: 'hidden',
                              }}
                            >
                              <Avatar
                                size={90}
                                radius="md"
                                src={
                                  project?.picture
                                    ? `${PROJECT_AVATAR_PATH}/${project?.id}/tr:h-180,w-180,c-maintain_ratio/${project?.picture}`
                                    : undefined
                                }
                                title={project.name}
                              />
                              {project.activity_status &&
                                project.request_status !== 1 && (
                                  <Badge
                                    pos="absolute"
                                    top={2}
                                    right={2}
                                    color={project.activity_status_color ?? undefined}
                                    size="xs"
                                    fz="8px"
                                    radius="md"
                                    variant="light"
                                    opacity={0.9}
                                    title={project.activity_status_name}
                                  >
                                    {project.activity_status_name}
                                  </Badge>
                                )}
                              {project.request_status === 1 && (
                                <Flex
                                  align="center"
                                  justify="center"
                                  pos="absolute"
                                  direction="column"
                                  gap="xs"
                                  inset={0}
                                  bg="rgba(0,0,0,0.6)"
                                >
                                  <IconClock size={24} color="#ffffff" stroke={1.2} />
                                  <Badge
                                    size="xs"
                                    fw="400"
                                    variant="outline"
                                    color="#ffffff"
                                  >
                                    Pendente
                                  </Badge>
                                </Flex>
                              )}
                            </Box>
                          </Link>
                          <Flex gap={0} direction="column">
                            <Text fz="10px" truncate="end">
                              {project.main_role} {additionalRolesCount(project)} em
                            </Text>
                            <Text
                              w={90}
                              size="sm"
                              fw={600}
                              truncate="end"
                              component={Link}
                              to={`/project/${project.slug}`}
                              className="noDecoration"
                              c="var(--mantine-color-text)"
                              title={project.name}
                              lh={1}
                            >
                              {project.name}
                            </Text>
                            <Text
                              mt={2}
                              lh={1}
                              w={90}
                              size="xs"
                              opacity={0.6}
                              truncate="end"
                            >
                              {project.type}
                            </Text>
                            {project.genre && (
                              <Text w={90} opacity={0.6} size="xs" truncate="end">
                                {project.genre}
                              </Text>
                            )}
                          </Flex>
                        </Stack>
                      ))}
                    </Group>
                  </Scroller>
                )}
              </Box>
            )}

            <Button
              fullWidth
              mt="xl"
              mb={3}
              variant="gradient"
              gradient={{ from: 'grape.8', to: 'mublinColor.8', deg: 55 }}
              radius="xl"
              size="sm"
              leftSection={<IconMicrophone2 size={18} />}
              rightSection={<IconArrowRight size={18} />}
              justify="space-between"
              component={Link}
              to="/search"
            >
              Encontre gigs para tocar!
            </Button>

            <Flex justify="center" mb="xl">
              <Anchor opacity={0.8} fz="xs" fw={300} component={Link} to="/new/project">
                ou associe-se a um projeto novo ou existente
              </Anchor>{' '}
            </Flex>

            <Group justify="space-between">
              <Title order={2} fz="xl" fw={700} lts="-0.02em" mb="xs">
                Próximas gigs
              </Title>
              <Anchor component={Link} to="/gigs" fz="sm" fw={500}>
                Ver todas
              </Anchor>
            </Group>

            {loadingGigs ? (
              <Group mb="md" gap="xs" wrap="nowrap">
                <Card shadow="xs" padding="xs" w={250} h={143} withBorder>
                  <Stack gap="xs" pt={4}>
                    <Skeleton width={130} height={14} radius="md" />
                    <Group gap={5} justify="flex-start">
                      <Skeleton width={60} height={14} radius="md" />
                      <Skeleton width={86} height={14} radius="md" />
                    </Group>
                    <Skeleton width={180} height={21} radius="md" />
                    <Skeleton width={130} height={14} radius="md" />
                    <Skeleton width={160} height={10} radius="md" />
                  </Stack>
                </Card>
              </Group>
            ) : gigs.length > 0 ? (
              <Scroller mb="md">
                <Group gap="xs" wrap="nowrap">
                  {gigs.map((gig) => (
                    <Card
                      key={gig.id}
                      shadow="xs"
                      padding="xs"
                      w={350}
                      withBorder
                      component={Link}
                      to={`/gig/${gig.gigs?.id}`}
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
                        <Group gap={5} justify="flex-start">
                          <Group gap={3}>
                            <Badge size="xs" variant="default">
                              {dayjs(gig.gigs?.events?.date_start).fromNow()}
                            </Badge>
                            {dayjs(gig.gigs?.events?.date_start).diff(dayjs(), 'day') <=
                              2 && (
                              <IconExclamationCircleFilled
                                color="orange"
                                size={15}
                                title="Gig próxima! Verifique os detalhes e prepare-se para se sair bem!"
                              />
                            )}
                          </Group>
                          <Badge
                            size="xs"
                            variant="default"
                            leftSection={<IconCheck color="lime" stroke={3} size={12} />}
                          >
                            Aceito
                          </Badge>
                        </Group>
                      </Card.Section>

                      <Stack gap={2} mt={6}>
                        <Text size="md" fw={600} lineClamp={1} lts="-0.01em">
                          {gig.gigs?.events?.name}
                        </Text>

                        <Text size="sm" truncate>
                          {gig.gigs?.events?.venues?.name} (
                          {gig.gigs?.events?.venues?.cities?.name},{' '}
                          {gig.gigs?.events?.venues?.cities?.regions?.uf})
                        </Text>

                        <Text size="xs" c="dimmed">
                          {dayjs(gig.gigs?.events?.date_start).format(
                            'dddd, D [de] MMMM [de] YYYY',
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
                h={100}
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
                    variant="default"
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

            <Scroller mb="xl">
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
                  <Text ta="center" size="xs" style={{ wordBreak: 'break-word' }} w={80}>
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
                  <Text ta="center" size="xs" style={{ wordBreak: 'break-word' }} w={80}>
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
                  <Text ta="center" size="xs" style={{ wordBreak: 'break-word' }} w={80}>
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
                  <Text ta="center" size="xs" style={{ wordBreak: 'break-word' }} w={80}>
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
                  <Text ta="center" size="xs" style={{ wordBreak: 'break-word' }} w={80}>
                    Buscar
                    <br />
                    marcas
                  </Text>
                </Flex>
              </Group>
            </Scroller>

            {genreStats.length > 0 && (
              <>
                <Title order={2} fz="xl" fw={700} lts="-0.02em" mb="xs">
                  Gêneros mais tocados por você
                </Title>
                <Paper p="md" className="alphaBg" mb="lg" radius="lg">
                  <Stack gap="xs">
                    <Stack gap={4}>
                      {genreStats.map((stat) => (
                        <Group key={stat.label} justify="space-between" wrap="nowrap">
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
                  </Stack>
                </Paper>
              </>
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
                    <Text size="11px" truncate="end" fw={300} my={4} c="dimmed" w={75}>
                      {item.brand_name}
                    </Text>
                    <Text size="xs" fw={500} fz="xs" h={40} w={75} truncate="end">
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
