import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { fetchUserAdminProjects } from '../queries/user'
import {
  useComputedColorScheme,
  Skeleton,
  ScrollArea,
  Group,
  Stack,
  Box,
  Card,
  Title,
  Text,
  Avatar,
  Anchor,
  ActionIcon,
  Collapse,
  TextInput,
} from '@mantine/core'
// import ProPlanBadge from './ProPlanBadge'
import {
  IconRosetteDiscountCheck,
  IconSearch,
  IconEye,
  IconCaretDownFilled,
} from '@tabler/icons-react'
import { getAvatarUrl } from '../utils/profile'

const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'

export default function AppSidebar() {
  const { user, profile, loading } = useAuth()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

  const [searchOpened, setSearchOpened] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)

  const { data: profileViewCount, isLoading: loadingProfileViews } = useQuery({
    queryKey: ['profile-view-count', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_profile_view_count', {
        p_profile_id: profile?.id,
      })
      if (error) {
        throw error
      }
      return data
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  })

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserAdminProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const userProjects = projects
    .filter((x) => x.is_admin)
    .map((p) => ({
      id: p.project.id,
      name: p.project.name,
      slug: p.project.slug,
      end_year: p.project.end_year,
      is_admin: p.is_admin,
      is_founder: p.is_founder,
      picture: p.project.picture,
      request_status: p.status,
      activity_status: p.project.activity_status,
      activity_status_name: p.project.status?.description_ptbr,
      activity_status_color: p.project.status?.color,
      genre: p.project.genre?.name,
      type: p.project.type?.name_ptbr,
      totalMembers: p.project.members?.length || 0,
    }))

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredProjects = normalizedQuery
    ? userProjects.filter((project) =>
        project.name?.toLowerCase().includes(normalizedQuery),
      )
    : userProjects

  useEffect(() => {
    if (searchOpened) {
      searchInputRef.current?.focus()
    }
  }, [searchOpened])

  function toggleSearch() {
    setSearchOpened((opened) => {
      if (opened) {
        setSearchQuery('')
      }
      return !opened
    })
  }

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
        <Stack gap="sm" mt={4}>
          <Card
            withBorder={false}
            shadow="xs"
            radius="md"
            p={0}
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
                  src={getAvatarUrl(profile?.avatar, profile?.is_open_to_work, 70)}
                  // src={profile?.avatar ? AVATAR_PATH + profile?.avatar : undefined}
                  component={Link}
                  to={`/${profile?.username}`}
                  style={{
                    border: '2px solid var(--mantine-color-body)',
                  }}
                />
              </Box>
              <Stack gap={2}>
                <Group gap={4} align="center">
                  <Anchor
                    component={Link}
                    to={`/${profile?.username}`}
                    underline="never"
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
                    <IconRosetteDiscountCheck
                      className="iconVerified"
                      title="Perfil verificado"
                    />
                  )}
                </Group>
                <Group gap={4} align="center">
                  <Text size="xs" opacity={0.7} fw={400} lineClamp={1} lh={1}>
                    @{profile?.username}
                  </Text>
                  {/* {profile?.plan === 'Pro' && <ProPlanBadge small />} */}
                </Group>
                {profile?.title && (
                  <Text size="12px" lh={1.3} mt={4} c="dimmed" lineClamp={3}>
                    {profile.title}
                  </Text>
                )}
              </Stack>
            </Box>
          </Card>

          <Card withBorder={false} shadow="xs" radius="md" p="xs">
            <Group gap="xs" wrap="nowrap">
              {/* <IconRocket color="gray" size={16} /> */}
              <Text size="xs" c="dimmed">
                Plano atual: {profile.plan === 'Pro' ? 'Mublin Pro' : 'Mublin Free'}
              </Text>
            </Group>
          </Card>

          <Card withBorder={false} shadow="xs" radius="md" p="xs">
            <Group gap="xs" wrap="nowrap">
              <IconEye color="gray" size={16} />
              {loadingProfileViews ? (
                <Text size="xs" c="dimmed">
                  Carregando visualizações ao perfil...
                </Text>
              ) : (
                <Link
                  to="/profile-visitors"
                  style={{
                    whiteSpace: 'pre-wrap',
                    display: 'block',
                  }}
                  className="noDecoration"
                >
                  <Text size="xs" c="dimmed">
                    {profileViewCount === 0
                      ? 'Ninguém visualizou seu perfil ainda'
                      : profileViewCount === 1
                        ? '1 pessoa visualizou seu perfil'
                        : `${profileViewCount} pessoas visualizaram seu perfil`}
                  </Text>
                </Link>
              )}
            </Group>
          </Card>

          <Card withBorder={false} shadow="xs" radius="md" p="xs">
            <Group
              justify="flex-start"
              align="center"
              gap="xs"
              mb={searchOpened ? 4 : 'xs'}
              wrap="nowrap"
            >
              <Title order={3} fw={600} fz="sm">
                Projetos que sou administrador
              </Title>
              {!loadingProjects && userProjects.length > 0 && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={toggleSearch}
                  aria-label="Buscar projeto"
                >
                  <IconSearch
                    size={16}
                    color={searchOpened ? 'var(--mantine-color-text)' : 'gray'}
                  />
                </ActionIcon>
              )}
            </Group>

            {!loadingProjects && userProjects.length > 0 && (
              <Collapse expanded={searchOpened}>
                <TextInput
                  ref={searchInputRef}
                  placeholder="Buscar por nome..."
                  size="xs"
                  mb="sm"
                  variant="unstyled"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Collapse>
            )}

            {loadingProjects ? (
              <Text>Carregando...</Text>
            ) : userProjects.length > 0 ? (
              <ScrollArea h={158} scrollHideDelay={0}>
                {filteredProjects.length > 0 ? (
                  <Stack gap="sm">
                    {filteredProjects.map((project) => (
                      <Link
                        key={project.id}
                        to={`/project/${project?.slug}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Box>
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

                            <Stack gap={2}>
                              <Text size="sm">{project.name}</Text>
                              <Text size="10px" fw={200}>
                                {project.type} {project.genre && ` · ${project.genre}`}
                              </Text>
                              {project.end_year && (
                                <Group gap={0}>
                                  <IconCaretDownFilled color="#c82f2f" size={12} />
                                  <Text fw={200} size="8px" c="dimmed">
                                    Encerrado em {project.end_year}
                                  </Text>
                                </Group>
                              )}
                            </Stack>
                          </Group>
                        </Box>
                      </Link>
                    ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    Nenhum projeto encontrado
                  </Text>
                )}
              </ScrollArea>
            ) : (
              <Text size="xs" c="dimmed">
                Você não gerencia nenhum projeto no momento
              </Text>
            )}
          </Card>
        </Stack>
      )}
    </Box>
  )
}
