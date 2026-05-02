import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  Stack, Box, NavLink, ScrollArea, Scroller,
  Badge, Group, Text, Title, Divider,
  Avatar, Card, Anchor, Image
} from '@mantine/core'
import { NAV_ITEMS, QUICK_ACTIONS } from '../constants/navItems'
import {
  IconHome2, IconPlus, IconCubePlus, 
  IconBulb, IconPencilPlus, IconCalendarPlus,
  IconRosetteDiscountCheckFilled 
} from '@tabler/icons-react'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-96,c-maintain_ratio/users/avatars/'
const COVER_PATH = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
const DEFAULT_COVER_PICTURE = 'https://ik.imagekit.io/mublin/bg/tr:h-52,bg-F3F3F3,fo-top/mublin-hero-chatgpt-musicians2.png'
const DEFAULT_GRADIENT_LIGHT = 'linear-gradient(82deg, #e4e7eb, #ffffff)'
const DEFAULT_GRADIENT_DARK = 'linear-gradient(170deg, #1c1c1c, #101010)'

const GIG_MENU_ITEMS = [
  { label: 'Confirmadas', confirmed: true, path: '#', type: "confirmed" },
  { label: 'Pendentes', confirmed: false, path: '#', type: "pending" },
  { label: 'Sugeridas', confirmed: false, path: '#', type: "suggested" },
]

const UPCOMING_GIGS = [
  { id: 1, title: 'Show Acústico', project: 'Trio Acústico SP', date: '28 Mar', weekday: 'Sex', venue: 'Bar Sagarana', city: 'São Paulo, SP', confirmed: true, type: "confirmed" },
  { id: 2, title: 'Ensaio Geral', project: 'Banda Paralela', date: '02 Abr', weekday: 'Qua', venue: 'Estúdio B', city: 'São Paulo, SP', confirmed: true, type: "confirmed" },
  { id: 3, title: 'Festival Indie', project: 'Trio Acústico SP', date: '12 Abr', weekday: 'Sáb', venue: 'Cine Joia', city: 'São Paulo, SP', confirmed: false, type: "suggested" },
]

export default function AppSidebar() {
  const { profile } = useAuth()
  const [gigsToShow, setGigsToShow] = useState("confirmed")

  return (
    <Box p="md" h="100%">
      <Card withBorder radius="md" p={0} mt={4} mb={20} style={{ overflow: 'hidden' }}>
        {/* Cover */}
        <Box
          h={52}
          style={{
            background: profile?.cover_image
              ? `url(${COVER_PATH + profile.cover_image}) center/cover no-repeat`
              : `url(${DEFAULT_COVER_PICTURE}) center/cover no-repeat`
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
          <Stack gap={2}>
            <Group gap={4} align="center">
              <Anchor
                component={Link}
                to={`/${profile?.username}`}
                underline="hover"
                c="var(--mantine-color-text)"
                fw={600}
                size="md"
                lineClamp={1}
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
              <Text size="xs" fw={400} c="mublinColor.3" lineClamp={2} lh={1}>
                @{profile.username}
              </Text>
              {profile.plan &&
                <Badge size="xs" color="gray" variant="light">PRO</Badge>
              }
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
              variant={item.type === gigsToShow ? "filled" : "light"}
              size="md"
              tt="none"
              radius="xl"
              style={{ cursor: 'pointer' }}
              autoContrast={false}
              color={item.type === gigsToShow ? undefined : "gray"}
              onClick={() => setGigsToShow(item.type)}
            >
              {item.label}
            </Badge>
          ))}
        </Group>
      </Scroller>
      <ScrollArea h={180} type="hover" offsetScrollbars mt="md">
        <Stack gap="xs">
          {UPCOMING_GIGS.filter(gig => gig.type === gigsToShow).map((gig, i) => (
            <Box key={gig.id}>
              <Group gap="xs" align="flex-start">
                <Box
                  style={{
                    minWidth: 44,
                    textAlign: 'center',
                    background: 'var(--mantine-color-indigo-0)',
                    borderRadius: 8,
                    padding: '6px 4px',
                  }}
                >
                  <Text size="xs" c="dimmed" lh={1}>{gig.weekday}</Text>
                  <Text fw={800} size="sm" c="dark" lh={1.2}>{gig.date.split(' ')[0]}</Text>
                  <Text size="xs" c="dimmed" lh={1}>{gig.date.split(' ')[1]}</Text>
                </Box>
                <Stack gap={1} style={{ flex: 1 }}>
                  <Text size="xs" fw={600}>{gig.title}</Text>
                  <Text size="xs">{gig.project}</Text>
                  <Text size="xs" c="dimmed" truncate="end">
                    {gig.venue} · {gig.city}
                  </Text>
                  <Badge
                    size="xs"
                    variant="dot"
                    fw="400"
                    color={gig.confirmed ? 'green' : 'gray'}
                  >
                    {gig.confirmed ? 'Confirmado' : 'Pendente'}
                  </Badge>
                </Stack>
              </Group>
              {i < UPCOMING_GIGS.length - 1 && <Divider mt="xs" />}
            </Box>
          ))}
        </Stack>
      </ScrollArea>
    </Box>
  )
}
