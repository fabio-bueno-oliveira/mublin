import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import {
  useMantineColorScheme,
  Grid,
  Container,
  Box,
  Flex,
  Group,
  Text,
  Title,
  Avatar,
  Scroller,
  Skeleton,
  Image,
  Paper,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import ProjectCard from '../components/ProjectCard'
import WelcomeAlert from '../components/WelcomeAlertHome'
import Feed from './Feed'
import {
  IconCircleArrowLeftFilled,
  IconCircleArrowRightFilled,
  IconCircleFilled,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects/'

function ProjectSkeletons({ count = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <Flex key={i} direction="column" align="center" gap={10}>
      <Skeleton radius="md" width={90} height={130} />
      <Skeleton radius="xl" width={50} height={10} />
    </Flex>
  ))
}

export default function Home() {
  const { colorScheme } = useMantineColorScheme()
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

  return (
    <>
      <Flex
        gap="xs"
        align="center"
        justify="space-between"
        my="md"
        hiddenFrom="sm"
        px={{ base: '0.8rem', sm: 0 }}
      >
        <Image
          src={colorScheme === 'light' ? MublinLogoBlack : MublinLogoWhite}
          h={26}
          w="auto"
          fit="contain"
        />
        <Avatar
          size={34}
          src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
          radius="xl"
          component={Link}
          to={`/${profile?.username}`}
        />
      </Flex>

      <Container size="xl" pt="xs" px={{ base: 0, sm: 0 }}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 7 }} className="paddingX">
            <Title order={2} fz="h3" fw={600} lts="-0.02em" mb="sm">
              Dashboard
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

            {/* Mobile — Scroller horizontal */}
            <Box hiddenFrom="sm">
              {loadingProjects ? (
                <Flex gap={14}>
                  <ProjectSkeletons count={4} />
                </Flex>
              ) : (
                <Scroller
                  key={userProjects.length}
                  draggable
                  controlSize="xl"
                  startControlIcon={<IconCircleArrowLeftFilled size={36} />}
                  endControlIcon={<IconCircleArrowRightFilled size={36} />}
                >
                  <Group gap="xs" wrap="nowrap">
                    {userProjects.map((item) => (
                      <ProjectCard
                        key={item.id}
                        item={item}
                        profile={profile}
                      />
                    ))}
                  </Group>
                </Scroller>
              )}
            </Box>
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
