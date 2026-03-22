import { useLocation, Link } from 'react-router-dom'
import { Stack, Box, NavLink, Badge } from '@mantine/core'
import {
  IconHome, IconCalendarEvent,
  IconUser, IconGuitarPick
} from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { label: 'Home',         icon: IconHome,          path: '/home' },
  { label: 'Gigs',         icon: IconCalendarEvent, path: '/gigs', badge: 'Novo' },
  { label: 'Meu Perfil',   icon: IconUser,          path: null },
  { label: 'Equipamentos', icon: IconGuitarPick,    path: '/gear' },
]

export default function AppSidebar() {
  const location = useLocation()
  const { profile } = useAuth()

  function getPath(item) {
    if (item.label === 'Meu Perfil') return `/profile/${profile?.username}`
    return item.path
  }

  function isActive(item) {
    return location.pathname === getPath(item)
  }

  return (
    <Box p="md" h="100%">
      <Stack gap={4}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              component={Link}
              to={getPath(item)}
              label={item.label}
              color="gray"
              leftSection={<Icon size={20} />}
              rightSection={item.badge && (
                <Badge size="xs" color="amber" variant="light">
                  {item.badge}
                </Badge>
              )}
              variant="light"
              active={isActive(item)}
            />
          )
        })}
      </Stack>
    </Box>
  )
}
