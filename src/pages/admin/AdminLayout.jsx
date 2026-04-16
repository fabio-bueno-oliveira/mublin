import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  AppShell,
  Group,
  Stack,
  Text,
  Badge,
  Avatar,
  UnstyledButton,
  Tooltip,
  Divider,
  ScrollArea,
  Burger,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconLayoutDashboard,
  IconUsers,
  IconBuildingStore,
  IconPackage,
  IconMapPin,
  IconCrown,
  IconChevronLeft,
  IconPalette
} from '@tabler/icons-react'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: IconLayoutDashboard,
    to: '/admin',
    end: true, // NavLink exact match
  },
  { type: 'divider' },
  {
    label: 'Usuários',
    icon: IconUsers,
    to: '/admin/users',
  },
  {
    label: 'Planos',
    icon: IconCrown,
    to: '/admin/plans',
  },
  { type: 'divider' },
  {
    label: 'Marcas',
    icon: IconBuildingStore,
    to: '/admin/brands',
  },
  {
    label: 'Produtos',
    icon: IconPackage,
    to: '/admin/products',
  },
  { type: 'divider' },
  {
    label: 'Venues',
    icon: IconMapPin,
    to: '/admin/venues',
  },
  {
    label: 'Cores',
    icon: IconPalette,
    to: '/admin/colors',
  },
]

function NavItem({ item }) {
  if (item.type === 'divider') {
    return <Divider my={4} />
  }

  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.end}
      style={{ textDecoration: 'none' }}
    >
      {({ isActive }) => (
        <UnstyledButton
          px="sm"
          py={8}
          w="100%"
          style={(theme) => ({
            borderRadius: theme.radius.md,
            backgroundColor: isActive
              ? theme.colorScheme === 'dark'
                ? theme.colors.dark[5]
                : theme.colors.gray[1]
              : 'transparent',
            color: isActive
              ? theme.colorScheme === 'dark'
                ? theme.white
                : theme.black
              : theme.colorScheme === 'dark'
              ? theme.colors.dark[1]
              : theme.colors.gray[7],
          })}
        >
          <Group gap="sm" wrap="nowrap">
            <Icon size={16} stroke={1.5} />
            <Text size="sm">{item.label}</Text>
          </Group>
        </UnstyledButton>
      )}
    </NavLink>
  )
}

export default function AdminLayout() {
  const [opened, { toggle }] = useDisclosure()
  const navigate = useNavigate()

  return (
    <AppShell
      navbar={{
        width: 220,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Navbar p="sm">
        {/* Logo / título */}
        <AppShell.Section>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <Text fw={600} size="sm">Mublin</Text>
              <Badge size="xs" variant="light" color="violet">Admin</Badge>
            </Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          </Group>
        </AppShell.Section>

        <Divider mb="xs" />

        {/* Navegação */}
        <AppShell.Section grow component={ScrollArea}>
          <Stack gap={2}>
            {NAV_ITEMS.map((item, i) => (
              <NavItem key={i} item={item} />
            ))}
          </Stack>
        </AppShell.Section>

        <Divider mt="xs" mb="xs" />

        {/* Rodapé: voltar pro app */}
        <AppShell.Section>
          <UnstyledButton
            px="sm"
            py={8}
            w="100%"
            onClick={() => navigate('/')}
            style={(theme) => ({
              borderRadius: theme.radius.md,
              color:
                theme.colorScheme === 'dark'
                  ? theme.colors.dark[2]
                  : theme.colors.gray[6],
            })}
          >
            <Group gap="sm" wrap="nowrap">
              <IconChevronLeft size={16} stroke={1.5} />
              <Text size="sm">Voltar ao app</Text>
            </Group>
          </UnstyledButton>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* Header mobile */}
      <AppShell.Header hiddenFrom="sm" h={52} px="md">
        <Group h="100%" justify="space-between">
          <Group gap="xs">
            <Text fw={600} size="sm">Mublin</Text>
            <Badge size="xs" variant="light" color="violet">Admin</Badge>
          </Group>
          <Burger opened={opened} onClick={toggle} size="sm" />
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}