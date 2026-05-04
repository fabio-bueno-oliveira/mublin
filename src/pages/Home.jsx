import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
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
  Paper,
  ThemeIcon,
  RingProgress,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import WelcomeAlert from '../components/WelcomeAlertHome'
import Feed from './Feed'
import {
  IconCircleFilled,
  IconMicrophone,
  IconGuitarPick,
  IconCalendarEvent,
  IconClipboardCheck,
  IconDeviceSpeaker,
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
    status: p.status,
    main_role: p.roles.name_ptbr,
    genre: p.projects.genres?.name,
    type: p.projects.project_types?.name_ptbr,
    totalMembers: p.projects.project_members?.length || 0,
  }))

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

  return (
    <>
      <AppNavbarMobile />

      <Container size="xl" pt="xs" px={{ base: 0, sm: 0 }}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }} className="paddingX">
            <Title order={2} fz="h3" fw={600} lts="-0.02em" mb="sm">
              Olá, {profile.username}!
            </Title>

            <WelcomeAlert />

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
              <Title
                order={2}
                fz="h3"
                fw={600}
                lts="-0.02em"
                mb="sm"
                className="paddingX"
              >
                Feed
              </Title>
              <Feed />
            </Grid.Col>
          )}
        </Grid>
      </Container>
    </>
  )
}
