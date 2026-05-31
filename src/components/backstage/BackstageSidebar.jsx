import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useComputedColorScheme, Box, Title, Card, Skeleton } from '@mantine/core'
import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-96,c-maintain_ratio/users/avatars/'

export default function BackstageSidebar() {
  const { profile, loading } = useAuth()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

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
      <Title>Projeto</Title>
    </Box>
  )
}
