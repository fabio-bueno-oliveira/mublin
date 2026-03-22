import { useNavigate } from 'react-router-dom'
import {
  Group, Text, TextInput, ActionIcon, Avatar,
  Menu, Box, Container, useComputedColorScheme, useMantineColorScheme
} from '@mantine/core'
import {
  IconSearch, IconGuitarPickFilled,
  IconBell, IconChevronDown, IconSun, IconMoon
} from '@tabler/icons-react'
import { useAuth } from '../contexts/AuthContext'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function AppNavbar({ children }) {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'
  const toggleColorScheme = () => setColorScheme(isDark ? 'light' : 'dark')

  return (
    <Box h="100%" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
      <Container size="xl" h="100%">
        <Group justify="space-between" align="center" h="100%" gap="md">

          <Group gap="md">
            {children}
            <Group
              gap={8}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/home')}
            >
              <IconGuitarPickFilled size={20} />
              <Text fw={800} size="lg" style={{ letterSpacing: '-0.03em' }} visibleFrom="sm">
                mublin
              </Text>
            </Group>
          </Group>

          {/* Centro: Busca */}
          <TextInput
            placeholder="Buscar músicos, projetos, gigs..."
            leftSection={<IconSearch size={15} />}
            radius="xl"
            size="sm"
            style={{ flex: 1, maxWidth: 400 }}
            styles={{ input: { cursor: 'pointer' } }}
            readOnly
            visibleFrom="sm"
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

            <ActionIcon
              variant="subtle"
              color="gray"
              radius="xl"
              size="lg"
              onClick={toggleColorScheme}
              aria-label="Alternar tema"
            >
              {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>

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
                <Menu.Item onClick={() => navigate(`/profile/${profile?.username}`)}>
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
