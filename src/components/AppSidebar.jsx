import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import {
  useComputedColorScheme,
  Skeleton,
  Group,
  Stack,
  Box,
  Card,
  Text,
  Avatar,
  Anchor,
} from '@mantine/core'
import {
  IconEye,
  IconBookmark,
  IconRocket,
  IconRosetteDiscountCheckFilled,
} from '@tabler/icons-react'
import { getAvatarUrl } from '../utils/profile'

export default function AppSidebar() {
  const { user, profile, loading } = useAuth()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

  const { data: profileViewCount, isLoading: loadingProfileViews } = useQuery({
    queryKey: ['profile-unique-visitor-count', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_profile_unique_visitor_count', {
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
                  src={
                    profile?.avatar
                      ? getAvatarUrl(profile?.avatar, profile?.is_open_to_work, 70)
                      : `https://api.dicebear.com/10.x/initials/svg?seed=${profile?.full_name}`
                  }
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
                    <IconRosetteDiscountCheckFilled
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
            <Stack gap={4}>
              <Text
                size="xs"
                component={Link}
                to="/pro"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                Plano atual: {profile?.plan === 'Pro' ? 'Mublin Pro' : 'Mublin Free'}
              </Text>
              {profile?.plan === 'Pro' && (
                <Group gap={4}>
                  <IconRocket color="gray" size={14} />
                  <Text c="dimmed" size="11px">
                    Experiência otimizada
                  </Text>
                </Group>
              )}
            </Stack>
          </Card>

          <Card withBorder={false} shadow="xs" radius="md" p="xs">
            <Group gap="xs" wrap="nowrap">
              <IconEye size={16} />
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
                    color: 'inherit',
                  }}
                  className="noDecoration"
                >
                  <Text size="xs">
                    {profileViewCount === 0
                      ? 'Ninguém visualizou seu perfil ainda'
                      : profileViewCount === 1
                        ? '1 visualização ao perfil'
                        : `${profileViewCount} visualizações ao perfil`}
                  </Text>
                </Link>
              )}
            </Group>
          </Card>

          <Card withBorder={false} shadow="xs" radius="md" p="xs">
            <Group gap="xs" wrap="nowrap">
              <IconBookmark size={16} />
              <Link
                to="/saved"
                style={{
                  whiteSpace: 'pre-wrap',
                  display: 'block',
                  color: 'inherit',
                }}
                className="noDecoration"
              >
                <Text size="xs">Itens salvos</Text>
              </Link>
            </Group>
          </Card>
        </Stack>
      )}
    </Box>
  )
}
