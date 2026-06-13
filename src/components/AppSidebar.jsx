import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import {
  useComputedColorScheme,
  Skeleton,
  Group,
  Stack,
  Box,
  Card,
  Title,
  Text,
  Badge,
  Avatar,
  Anchor,
} from '@mantine/core'
import ProPlanBadge from './ProPlanBadge'
import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-140,c-maintain_ratio/users/avatars/'
const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'

export default function AppSidebar() {
  const { user, profile, loading } = useAuth()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

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
    main_role: p.roles.description_ptbr,
    genre: p.projects.genres?.name,
    type: p.projects.project_types?.name_ptbr,
    joined_at: p.joined_at ? new Date(p.joined_at).getFullYear() : null,
    left_at: p.left_at ? new Date(p.left_at).getFullYear() : null,
    role_2_id: p.role_2_id,
    role_3_id: p.role_3_id,
    totalMembers: p.projects.project_members?.length || 0,
  }))

  return (
    <Box px="sm" py="md" h="100%" component="aside">
      {loading ? (
        <Card withBorder={false} shadow="xs" radius="md" p="md" mt={4} mb="md">
          <Skeleton height={48} circle mb="sm" />
          <Skeleton width={160} height={20} radius="md" mb="xs" />
          <Skeleton width={120} height={16} radius="md" mb="xs" />
          <Skeleton width={136} height={12} radius="md" />
        </Card>
      ) : (
        <>
          <Card
            withBorder={false}
            shadow="xs"
            radius="md"
            p={0}
            mt={4}
            mb="sm"
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
                  size={70}
                  radius="xl"
                  src={profile?.avatar ? AVATAR_PATH + profile?.avatar : undefined}
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
                  {profile?.plan === 'Pro' && <ProPlanBadge small />}
                </Group>
                {profile?.title && (
                  <Text size="13px" lh={1.3} mt={4} c="dimmed" lineClamp={2}>
                    {profile.title}
                  </Text>
                )}
              </Stack>
            </Box>
          </Card>
          <Title order={3} fw={600} fz="16px" mb="xs">
            Projetos
          </Title>
          {loadingProjects ? (
            <Text>Carregando...</Text>
          ) : userProjects.length > 0 ? (
            <Stack gap="md">
              {userProjects.map((project) => (
                <Box key={project.id}>
                  <Group gap={10} align="flex-start">
                    <Avatar
                      size={40}
                      radius="md"
                      src={
                        project?.picture
                          ? `${PROJECT_AVATAR_PATH}/${project?.id}/tr:h-80,w-80,c-maintain_ratio/${project?.picture}`
                          : undefined
                      }
                      title={project.name}
                    />
                    <Stack gap={0}>
                      <Text size="11px" truncate="end" opacity={0.8}>
                        {project.main_role} em
                      </Text>
                      <Text size="sm">{project.name}</Text>
                      <Text size="10px" c="dimmed">
                        {project.type} {project.genre && ` · ${project.genre}`}
                      </Text>
                      {project.end_year && (
                        <Badge
                          px={4}
                          pt={0}
                          fz="8px"
                          size="xs"
                          fw={200}
                          mt={2}
                          color="red"
                          variant="light"
                        >
                          Encerrado em {project.end_year}
                        </Badge>
                      )}
                    </Stack>
                  </Group>
                </Box>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed">Você não está associado a nenhum projeto até o momento</Text>
          )}
        </>
      )}
    </Box>
  )
}
