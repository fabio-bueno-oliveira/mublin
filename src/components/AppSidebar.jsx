import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  Stack,
  Box,
  Scroller,
  Badge,
  Group,
  Text,
  Title,
  Avatar,
  Card,
  Anchor,
} from '@mantine/core'
import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-96,c-maintain_ratio/users/avatars/'
const COVER_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
const DEFAULT_COVER_PICTURE =
  'https://ik.imagekit.io/mublin/bg/tr:h-52,bg-F3F3F3,fo-top/mublin-hero-chatgpt-musicians2.png'

const GIG_MENU_ITEMS = [
  { label: 'Confirmadas', confirmed: true, path: '#', type: 'confirmed' },
  { label: 'Pendentes', confirmed: false, path: '#', type: 'pending' },
  { label: 'Sugeridas', confirmed: false, path: '#', type: 'suggested' },
]

export default function AppSidebar() {
  const { profile } = useAuth()
  const [gigsToShow, setGigsToShow] = useState('confirmed')

  return (
    <Box p="md" h="100%">
      <Card
        withBorder
        radius="md"
        p={0}
        mt={4}
        mb={20}
        style={{ overflow: 'hidden' }}
      >
        {/* Cover */}
        <Box
          h={52}
          style={{
            background: profile?.cover_image
              ? `url(${COVER_PATH + profile.cover_image}) center/cover no-repeat`
              : `url(${DEFAULT_COVER_PICTURE}) center/cover no-repeat`,
            // : DEFAULT_GRADIENT_LIGHT
            // : isDark ? DEFAULT_GRADIENT_DARK : DEFAULT_GRADIENT_LIGHT,
          }}
        />
        {/* Avatar flutuando sobre a cover */}
        <Box px="sm" pb="sm">
          <Box mt={-24} mb={4}>
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
              <Text size="xs" fw={400} lineClamp={2} lh={1}>
                @{profile.username}
              </Text>
              {profile.plan === 'Pro' && (
                <Badge size="xs" color="gray" variant="outline" radius="sm">
                  PRO
                </Badge>
              )}
            </Group>
            {profile?.title && (
              <Text size="xs" mt={2} c="dimmed" lineClamp={2}>
                {profile.title}
              </Text>
            )}
          </Stack>
        </Box>
      </Card>
      <Title order={2} fz="md" ta="left" fw={600} lts="-0.02em" mb="md">
        Suas próximas gigs
      </Title>
      <Scroller mb={20}>
        <Group gap={4} wrap="nowrap" miw={300}>
          {GIG_MENU_ITEMS.map((item, index) => (
            <Badge
              key={index}
              variant={item.type === gigsToShow ? 'filled' : 'light'}
              size="md"
              tt="none"
              radius="xl"
              style={{ cursor: 'pointer' }}
              autoContrast={false}
              color={item.type === gigsToShow ? undefined : 'gray'}
              onClick={() => setGigsToShow(item.type)}
            >
              {item.label}
            </Badge>
          ))}
        </Group>
      </Scroller>
    </Box>
  )
}
