import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  useComputedColorScheme,
  Stack,
  Box,
  Group,
  Text,
  Avatar,
  Card,
  Anchor,
  Skeleton,
} from '@mantine/core'
import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react'
import ProPlanBadge from './ProPlanBadge'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-96,c-maintain_ratio/users/avatars/'

export default function AppSidebar() {
  const { profile, loading } = useAuth()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

  return (
    <Box px="sm" py="md" h="100%">
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
                  {profile.plan === 'Pro' && <ProPlanBadge small />}
                </Group>
                {profile?.title && (
                  <Text size="13px" lh={1.3} mt={4} c="dimmed" lineClamp={2}>
                    {profile.title}
                  </Text>
                )}
              </Stack>
            </Box>
          </Card>
        </>
      )}
    </Box>
  )
}
