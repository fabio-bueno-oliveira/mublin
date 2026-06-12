import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { MEMBER_ENGAGEMENT_TYPE } from '../constants/projects'
// prettier-ignore
import {
  useMantineColorScheme,
  Skeleton,
  Group, Flex, Tabs,
  Container, Stack, Box,
  Button, Badge, Pill, 
  Loader, Divider,
  Center, Indicator, Paper, 
  Text, Title, Anchor, TextInput,
  Avatar, ActionIcon, ThemeIcon,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
import {
  IconXboxXFilled,
  IconSearch,
  IconMicrophone2,
  IconArrowRight,
  IconUserCheck,
  IconIdBadge2,
  IconHeartHandshake,
} from '@tabler/icons-react'
import { showYears } from '../utils/formatter'
import EmptyProjects from '../components/project/EmptyProjects'

const CDN_PREFIX = 'https://ik.imagekit.io/mublin'
const USER_AVATAR_PATH = `${CDN_PREFIX}/tr:h-68,c-maintain_ratio/users/avatars/`
const PROJECT_AVATAR_PATH = `${CDN_PREFIX}/projects`
const currentYear = new Date().getFullYear()

function ProjectCard({ project, profile, isDark }) {
  return (
    <Paper
      key={project.id}
      px="sm"
      py={8}
      pos="relative"
      w="100%"
      style={{
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
        borderBottom: isDark
          ? project.end_year
            ? '2px solid #691313'
            : '2px solid #2a2a2a'
          : project.end_year
            ? '2px solid #cf9c9c'
            : '2px solid #bcbcbc',
      }}
      component={Link}
      to={`/project/${project.slug}`}
    >
      {/* <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <ActionIcon
            color="gray"
            variant="subtle"
            size="sm"
            pos="absolute"
            top={10}
            right={10}
          >
            <IconDotsVertical color="gray" size={16} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item leftSection={<IconMusic size={14} />}>Ir para o projeto</Menu.Item>
          <Menu.Item leftSection={<IconMusic size={14} />}>
            Gerenciar participação
          </Menu.Item>
        </Menu.Dropdown>
      </Menu> */}
      <Group align="flex-start" gap={10} wrap="nowrap">
        <Avatar
          size={50}
          radius="md"
          src={
            project?.picture
              ? `${PROJECT_AVATAR_PATH}/${project?.id}/tr:h-100,w-100,c-maintain_ratio/${project?.picture}`
              : undefined
          }
          alt={project.name}
        />
        <Stack gap={3} style={{ flexGrow: 1 }} maw="52%">
          <Text size="md" fw={500} lineClamp={1} truncate="end" lh={1}>
            {project.name}
          </Text>
          <Text size="xs" opacity={0.8} lh={1}>
            {project.type}
          </Text>
          {project.genre && (
            <Text size="11px" c="dimmed" lh={1}>
              {project.genre}
            </Text>
          )}
        </Stack>
      </Group>
      {project.description && (
        <Text size="xs" c="dimmed" lineClamp={2} mt={6}>
          {project.description}
        </Text>
      )}
      {project.end_year && (
        <Badge size="xs" fw={300} mt={6} color="red.9" variant="filled">
          Encerrado em {project.end_year}
        </Badge>
      )}
      <Divider my="xs" />
      <Flex gap={8} align="center">
        <Indicator
          color={project.end_year || project.left_at ? 'red' : 'lime'}
          size={5}
          offset={4}
          position="bottom-end"
        >
          <Avatar
            size={25}
            src={profile?.avatar ? USER_AVATAR_PATH + profile.avatar : undefined}
            radius="xl"
          />
        </Indicator>
        <Stack gap={4}>
          <Group gap={4}>
            <Text size="xs" lh={1}>
              {project.main_role && project.main_role}
            </Text>
          </Group>
          {project.request_status !== 1 && (
            <>
              {!project.end_year ? (
                <Text size="10px" opacity={0.7}>
                  {`${project.joined_at} ➜ ${project.left_at ? project.left_at : currentYear}`}{' '}
                  {project.left_at
                    ? showYears(project.left_at - project.joined_at)
                    : showYears(currentYear - project.joined_at)}
                </Text>
              ) : (
                <Text size="10px" opacity={0.7}>
                  {`${project.joined_at} ➜ ${project.end_year}`}{' '}
                  {showYears(project.end_year - project.joined_at)}
                </Text>
              )}
            </>
          )}
          {(project.is_founder || project.is_admin) && (
            <Group wrap="nowrap" gap={3}>
              {project.is_founder && (
                <Badge
                  variant="light"
                  color="dark"
                  size="xs"
                  fz="8px"
                  fw={300}
                  style={{ cursor: 'pointer' }}
                >
                  Fundador
                </Badge>
              )}
              {project.is_admin && (
                <Badge
                  variant="light"
                  color="dark"
                  size="xs"
                  fz="8px"
                  fw={300}
                  style={{ cursor: 'pointer' }}
                >
                  Admin
                </Badge>
              )}
            </Group>
          )}
        </Stack>
      </Flex>
    </Paper>
  )
}

export default function Home() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const isDesktop = useMediaQuery('(min-width: 48em)')
  const [search, setSearch] = useState('')
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  useEffect(() => {
    if (isDesktop && profile?.feed_as_home) {
      const redirected = sessionStorage.getItem('feed_redirected')
      if (!redirected) {
        sessionStorage.setItem('feed_redirected', 'true')
        navigate('/feed', { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  if (loading) {
    return null
  }

  const userProjects = projects.map((p) => ({
    id: p.projects.id,
    name: p.projects.name,
    slug: p.projects.slug,
    description: p.projects.description,
    end_year: p.projects.end_year,
    is_founder: p.is_founder,
    is_admin: p.is_admin,
    is_ex_member: p.is_ex_member,
    engagementType: p.engagement_type_id,
    picture: p.projects.picture,
    request_status: p.status,
    activity_status: p.projects.activity_status,
    activity_status_name: p.projects.project_statuses?.description_ptbr,
    activity_status_color: p.projects.project_statuses?.color,
    main_role: p.roles.name_ptbr,
    genre: p.projects.genres?.name,
    genreCategoryColor: p.projects.genres?.primary_category?.color,
    type: p.projects.project_types?.name_ptbr,
    joined_at: p.joined_at ? new Date(p.joined_at).getFullYear() : null,
    left_at: p.left_at ? new Date(p.left_at).getFullYear() : null,
    role_2_id: p.role_2_id,
    role_3_id: p.role_3_id,
    totalMembers: p.projects.project_members?.length || 0,
  }))

  const filteredProjects = userProjects.filter((project) =>
    !search?.trim()
      ? true
      : project.name.toLowerCase().includes(search.trim().toLowerCase()),
  )

  const userProjectsOfficialMember = filteredProjects.filter(
    (p) => p.engagementType === MEMBER_ENGAGEMENT_TYPE.MEMBER,
  )

  const userProjectsHired = filteredProjects.filter(
    (p) => p.engagementType === MEMBER_ENGAGEMENT_TYPE.HIRED,
  )

  const userProjectsGuest = filteredProjects.filter(
    (p) => p.engagementType === MEMBER_ENGAGEMENT_TYPE.GUEST,
  )

  // Saudação dinâmica
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <>
      {isMobile && <AppNavbarMobile fixed={false} />}

      <Container size="xl" pt="xs" px={{ base: 'sm', sm: 0 }} mt={{ base: 16, sm: 0 }}>
        {loading || loadingProjects ? (
          <>
            <Title size="h2" fw={600} lh={1.2} mt={4} mb={4}>
              Carregando...
            </Title>
            <Skeleton width={300} height={18} radius="md" />
          </>
        ) : (
          <>
            <Group justify="space-between" align="flex-start">
              <Title size="24px" fw={600} lh={1.2} mt={4}>
                {greeting}, {profile?.username}
              </Title>
              <Text size="sm" c="dimmed">
                {dayjs().format('dddd, D [de] MMMM [de] YYYY')}
              </Text>
            </Group>
            {userProjects.length > 0 ? (
              <TextInput
                placeholder="Filtrar por nome..."
                leftSection={<IconSearch size={14} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                rightSection={
                  search && (
                    <ActionIcon
                      size="sm"
                      radius="xl"
                      variant="transparent"
                      onClick={() => setSearch('')}
                    >
                      <IconXboxXFilled color="gray" size={22} />
                    </ActionIcon>
                  )
                }
                variant="unstyled"
                size="md"
                mb="sm"
              />
            ) : (
              <Flex mt="24px" direction="column" justify="center" align="center">
                <Button
                  mb={4}
                  variant="gradient"
                  gradient={{ from: 'grape.8', to: 'mublinColor.8', deg: 55 }}
                  radius="xl"
                  size="sm"
                  style={{ width: 'fit-content' }}
                  leftSection={<IconMicrophone2 size={18} />}
                  rightSection={<IconArrowRight size={18} />}
                  justify="space-between"
                  component={Link}
                  to="/search"
                >
                  Encontre gigs para tocar!
                </Button>

                <Flex justify="center" mb="xl">
                  <Anchor
                    c={isDark ? 'mublinColor.2' : 'mublinColor.8'}
                    opacity={0.9}
                    fz="xs"
                    fw={300}
                    component={Link}
                    to="/new/project"
                  >
                    ou associe-se a um projeto novo ou existente
                  </Anchor>{' '}
                </Flex>
              </Flex>
            )}
          </>
        )}

        {loadingProjects ? (
          <Center mt={200}>
            <Loader type="bars" />
          </Center>
        ) : (
          <Stack>
            <Box component="section">
              <Group gap={6} align="flex-start">
                <ThemeIcon color="dark" size="lg">
                  <IconUserCheck style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xs" opacity={0.7} lh={1}>
                    Projetos com vínculo de integrante oficial
                  </Text>
                  <Title order={3} fz="19px" fw={600}>
                    Integrante
                  </Title>
                </Stack>
              </Group>

              <Tabs defaultValue="gallery" variant="default" my="xl">
                <Tabs.List>
                  <Tabs.Tab value="gallery" leftSection={<IconUserCheck size={12} />}>
                    Gallery
                  </Tabs.Tab>
                  <Tabs.Tab value="messages" leftSection={<IconUserCheck size={12} />}>
                    Messages
                  </Tabs.Tab>
                  <Tabs.Tab value="settings" leftSection={<IconUserCheck size={12} />}>
                    Settings
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="gallery">Gallery tab content</Tabs.Panel>

                <Tabs.Panel value="messages">Messages tab content</Tabs.Panel>

                <Tabs.Panel value="settings">Settings tab content</Tabs.Panel>
              </Tabs>

              {userProjectsOfficialMember.length > 0 ? (
                <ResponsiveMasonry
                  columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 3 }}
                  gutterBreakpoints={{ 350: '8px', 750: '8px', 900: '8px' }}
                  style={{ marginTop: '18px', marginBottom: '18px' }}
                >
                  <Masonry>
                    {userProjectsOfficialMember.map((project) => (
                      <ProjectCard project={project} profile={profile} isDark={isDark} />
                    ))}
                  </Masonry>
                </ResponsiveMasonry>
              ) : (
                <EmptyProjects />
              )}
            </Box>

            <Box component="section">
              <Group gap={6} align="flex-start">
                <ThemeIcon color="mublinColor" size="lg">
                  <IconIdBadge2 style={{ width: '70%', height: '70%' }} />
                </ThemeIcon>
                <Stack gap={0}>
                  <Text size="xs" opacity={0.7} lh={1}>
                    Projetos com vínculo por contrato
                  </Text>
                  <Title order={3} fz="20px" fw={600}>
                    Contratado
                  </Title>
                </Stack>
              </Group>
              {userProjectsHired.length > 0 ? (
                <ResponsiveMasonry
                  columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 3 }}
                  gutterBreakpoints={{ 350: '8px', 750: '8px', 900: '8px' }}
                  style={{ marginTop: '10px' }}
                >
                  <Masonry>
                    {userProjectsHired.map((project) => (
                      <ProjectCard project={project} profile={profile} isDark={isDark} />
                    ))}
                  </Masonry>
                </ResponsiveMasonry>
              ) : (
                <EmptyProjects />
              )}
            </Box>

            <Box component="section">
              <Group gap={6} align="center">
                <IconHeartHandshake size={20} />
                <Title order={3} fz="20px" fw={600}>
                  Convidado
                </Title>
                <Pill size="sm">{userProjectsGuest.length}</Pill>
              </Group>
              <Text size="sm" mb="xs">
                Projetos com vínculo de convidado
              </Text>
              {userProjectsGuest.length > 0 ? (
                <ResponsiveMasonry
                  columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 3 }}
                  gutterBreakpoints={{ 350: '8px', 750: '8px', 900: '8px' }}
                  style={{ marginTop: '10px' }}
                >
                  <Masonry>
                    {userProjectsGuest.map((project) => (
                      <ProjectCard project={project} profile={profile} isDark={isDark} />
                    ))}
                  </Masonry>
                </ResponsiveMasonry>
              ) : (
                <EmptyProjects />
              )}
            </Box>
          </Stack>
        )}
      </Container>
    </>
  )
}
