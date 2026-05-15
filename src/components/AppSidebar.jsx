import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import {
  useComputedColorScheme,
  Stack,
  Box,
  Badge,
  Group,
  Text,
  Title,
  Avatar,
  Card,
  Anchor,
  Combobox,
  useCombobox,
  InputBase,
  ScrollArea,
  Indicator,
  Skeleton,
} from '@mantine/core'
import { IconCheck, IconRosetteDiscountCheckFilled } from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-96,c-maintain_ratio/users/avatars/'
const COVER_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
const DEFAULT_COVER_PICTURE =
  'https://ik.imagekit.io/mublin/bg/tr:h-52,bg-F3F3F3,fo-top/mublin-hero-chatgpt-musicians2.png'
const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects/'

const ProjectOption = ({ project, active = false }) => (
  <Combobox.Option value={project.slug} key={project.id} active={active}>
    <Group gap={10}>
      {active && <IconCheck size={12} />}
      <Indicator
        size={10}
        color={project.activity_status_color}
        disabled={!project.activity_status_color}
        inline
        withBorder
        offset={2}
      >
        <Avatar
          src={
            project.picture
              ? `${PROJECT_AVATAR_PATH}${project.id}/tr:h-52,w-52,c-maintain_ratio/${project.picture}`
              : undefined
          }
          size="sm"
          radius="xl"
        />
      </Indicator>
      <div>
        <Text size="sm" fw={500} truncate="end" w={110}>
          {project.name}
        </Text>
        <Text size="xs" opacity={0.5} truncate="end" w={110}>
          {project.type}
        </Text>
      </div>
    </Group>
  </Combobox.Option>
)

export default function AppSidebar() {
  const { profile, user, loading } = useAuth()
  const navigate = useNavigate()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

  const [search, setSearch] = useState('')
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption()
      setSearch('')
    },
    onDropdownOpen: () => {
      combobox.focusSearchInput() // Foca no input automaticamente ao abrir
    },
  })

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

  const [selectedProjectSlug, setSelectedProjectSlug] = useState('')
  const selectedProject = userProjects.find(
    (p) => p.slug === selectedProjectSlug,
  )

  const filteredProjects = userProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase().trim()),
  )

  const projectsByStatus = {
    accepted: filteredProjects?.filter((p) => p.request_status === 2) || [],
    pending: filteredProjects?.filter((p) => p.request_status === 1) || [],
  }

  const hasResults =
    projectsByStatus.accepted.length > 0 || projectsByStatus.pending.length > 0

  return (
    <Box p="md" h="100%">
      {loading && (
        <Card withBorder={false} shadow="xs" radius="md" p="md" mt={4} mb="md">
          <Skeleton height={48} circle mb="sm" />
          <Skeleton width={160} height={20} radius="md" mb="xs" />
          <Skeleton width={120} height={16} radius="md" mb="xs" />
          <Skeleton width={136} height={12} radius="md" />
        </Card>
      )}

      {!loading && (
        <Card
          withBorder={false}
          shadow="xs"
          radius="md"
          p={0}
          mt={4}
          mb={20}
          style={{ overflow: 'hidden' }}
          pos="relative"
        >
          {/* Cover */}
          <Card.Section
            h={52}
            withBorder
            style={{
              border: isDark
                ? '1px solid var(--mantine-color-dark-9)'
                : '1px solid var(--mantine-color-gray-2)',
              background: isDark
                ? 'var(--mantine-color-dark-9)'
                : 'var(--mantine-color-gray-0)',
            }}
          />

          {/* Avatar sobre a cover */}
          <Box px="sm" pb="sm">
            <Box mt={-24} mb={5}>
              <Avatar
                size={48}
                radius="xl"
                src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
                component={Link}
                to={`/${profile?.username}`}
                style={{
                  border: '2px solid var(--mantine-color-body)',
                }}
              />
            </Box>
            <Stack gap={1}>
              <Group gap={4} align="center">
                <Anchor
                  component={Link}
                  to={`/${profile?.username}`}
                  underline="hover"
                  c="var(--mantine-color-text)"
                  fw={600}
                  size="lg"
                  maw={180}
                  lineClamp={1}
                  truncate="end"
                >
                  {profile?.full_name}
                </Anchor>
                {!!profile?.is_verified && (
                  <IconRosetteDiscountCheckFilled
                    className="iconVerified small"
                    title="Perfil verificado"
                  />
                )}
              </Group>
              <Group gap={4} align="center">
                <Text size="xs" opacity={0.7} fw={400} lineClamp={1} lh={1}>
                  @{profile?.username}
                </Text>
                {profile.plan === 'Pro' && (
                  <Badge
                    size="xs"
                    variant="transparent"
                    color="gray"
                    radius="sm"
                  >
                    PRO
                  </Badge>
                )}
              </Group>
              {profile?.title && (
                <Text size="13px" lh={1.3} mt={4} c="dimmed" lineClamp={2}>
                  {profile.title}
                </Text>
              )}
            </Stack>
          </Box>
        </Card>
      )}

      <Combobox
        w="100%"
        mb="md"
        store={combobox}
        onOptionSubmit={(val) => {
          setSelectedProjectSlug(val)
          combobox.closeDropdown()
          navigate(`/project/${val}`)
        }}
      >
        <Combobox.Target>
          <InputBase
            component="button"
            type="button"
            variant="unstyled"
            pointer
            disabled={loadingProjects}
            rightSection={<Combobox.Chevron />}
            rightSectionPointerEvents="none"
            onClick={() => combobox.toggleDropdown()}
          >
            {loadingProjects ? (
              'Carregando projetos...'
            ) : selectedProject ? (
              <Group pl={3} gap="xs">
                <Avatar
                  src={
                    selectedProject.picture
                      ? `${PROJECT_AVATAR_PATH}${selectedProject.id}/tr:h-40,w-40,c-maintain_ratio/${selectedProject.picture}`
                      : undefined
                  }
                  size={20}
                  radius="xl"
                />
                <Title order={2} fz="lg" fw={600} lts="-0.02em" truncate="end">
                  {selectedProject.name}
                </Title>
              </Group>
            ) : (
              <Title order={2} fz="lg" fw={600} lts="-0.02em">
                Selecionar projeto
              </Title>
            )}
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Search
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Pesquisar projetos..."
          />
          <Combobox.Options>
            <ScrollArea.Autosize mah={170} type="always" scrollHideDelay={0}>
              {hasResults ? (
                <>
                  {projectsByStatus.accepted.map((project) => (
                    <ProjectOption
                      key={project.id}
                      project={project}
                      active={
                        String(project.slug) === String(selectedProjectSlug)
                      }
                    />
                  ))}

                  {projectsByStatus.pending.map((project) => (
                    <ProjectOption
                      key={project.id}
                      project={project}
                      active={
                        String(project.slug) === String(selectedProjectSlug)
                      }
                    />
                  ))}
                </>
              ) : (
                <Combobox.Empty>Nenhum projeto encontrado</Combobox.Empty>
              )}
            </ScrollArea.Autosize>
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </Box>
  )
}
