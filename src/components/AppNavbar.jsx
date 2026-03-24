import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Group, Text, TextInput, ActionIcon, Avatar, Switch,
  Menu, Box, Container, useComputedColorScheme, useMantineColorScheme
} from '@mantine/core'
import {
  IconSearch, IconCircuitResistor,
  IconBell, IconChevronDown, IconSun, IconMoon
} from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function AppNavbar({ children }) {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'
  const toggleColorScheme = () => setColorScheme(isDark ? 'light' : 'dark')

  function handleSearch(e) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <Box h="100%" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
      <Container size="xl" h="100%">
        <Group justify="space-between" align="center" h="100%" gap="md">

          <Group gap="md">
            {children}
            <Group
              gap={8}
              component={Link}
              to="/home"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <IconCircuitResistor size={30} />
              <Text fw={800} size="xl" style={{ letterSpacing: '-0.03em' }} visibleFrom="sm">
                mublin
              </Text>
            </Group>
          </Group>

          {/* Busca Desktop */}
          <TextInput
            placeholder="Buscar músicos, projetos, gigs..."
            leftSection={<IconSearch size={15} />}
            radius="xl"
            size="sm"
            flex={1}
            visibleFrom="sm"
            maw={400}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
          />

          {/* Direita: Notificações + Perfil */}
          <Group gap="xs">

            {/* Busca mobile */}
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="xl"
              size="lg"
              hiddenFrom="sm"
            >
              <IconSearch size={18} />
            </ActionIcon>

            <Switch
              size="lg"
              color={isDark ? "dark.4" : "gray.6"}
              onLabel={<IconSun size={16} color="white" />}
              offLabel={<IconMoon size={16} color="gray" />}
              onClick={toggleColorScheme}
              aria-label="Alternar tema"
            />

            {/* Notificações */}
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="xl"
              size="lg"
            >
              <IconBell size={18} />
            </ActionIcon>

            {/* Menu do perfil */}
            <Menu shadow="md" width={200} radius="md" position="bottom-end">
              <Menu.Target>
                <Group gap={6} style={{ cursor: 'pointer' }}>
                  <Avatar
                    size={32}
                    src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
                    radius="xl"
                  />
                  <Text size="sm" fw={600} visibleFrom="sm">
                    {profile?.full_name?.split(' ')[0]}
                  </Text>
                  <IconChevronDown size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
                </Group>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  {profile?.full_name}
                </Menu.Label>
                <Menu.Item onClick={() => navigate(`/${profile?.username}`)}>
                  Meu perfil
                </Menu.Item>
                <Menu.Item onClick={() => navigate('/settings')}>
                  Configurações
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" onClick={handleSignOut}>
                  Sair
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

          </Group>
        </Group>
      </Container>
    </Box>
  )
}
