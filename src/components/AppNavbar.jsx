import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { fetchRecentSearches, saveSearchQuery, clearSearchHistory } from '../queries/search'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import {
  useMantineColorScheme, useComputedColorScheme,
  Group, Text, TextInput, ActionIcon, Avatar, Switch,
  Menu, Box, Container, Combobox, useCombobox, Image,
} from '@mantine/core'
import {
  IconSearch, IconArrowRight,
  IconBell, IconChevronDown, IconSun, IconMoon, IconClock
} from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function AppNavbar({ children }) {
  const navigate = useNavigate()
  const { colorScheme } = useMantineColorScheme()
  const { profile, user, signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'
  const toggleColorScheme = () => setColorScheme(isDark ? 'light' : 'dark')

  const currentQ = searchParams.get('q') ?? ''
  const [inputValue, setInputValue] = useState('')
  const searchQuery = inputValue || currentQ

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const { data: recentSearches = [] } = useQuery({
    queryKey: ['recent-searches', user?.id],
    queryFn: () => fetchRecentSearches(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const queryClient = useQueryClient()

  const { mutate: clearHistory } = useMutation({
    mutationFn: () => clearSearchHistory(user.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recent-searches', user?.id] }),
  })

  async function doSearch(q) {
    const trimmed = q.trim()
    if (trimmed && user?.id) {
      await saveSearchQuery(user.id, trimmed)
      queryClient.invalidateQueries({ queryKey: ['recent-searches', user?.id] })
    }
    setInputValue('')
    combobox.closeDropdown()
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search')
  }

  function handleSearch(e) {
    e.preventDefault()
    doSearch(searchQuery)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const suggestions = recentSearches.filter(s =>
    searchQuery.trim() === '' || s.query.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box h="100%" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
      <Container fluid h="100%">
        <Group justify="space-between" align="center" h="100%" gap="md">
          <Group gap="md">
            {children}
            <Link
              component={Link}
              to="/home"
            >
              <Image 
                src={colorScheme === 'light' ? MublinLogoBlack : MublinLogoWhite} 
                h={26} 
                w="auto"
                fit="contain"
              />
            </Link>
          </Group>

          {/* Busca Desktop */}
          <Combobox
            store={combobox}
            onOptionSubmit={(val) => {
              setInputValue(val)
              doSearch(val)
            }}
            visibleFrom="sm"
            flex={1}
            maw={400}
          >
            <Combobox.Target>
              <TextInput
                placeholder="Buscar músicos, projetos, gigs..."
                leftSection={<IconSearch size={15} />}
                rightSection={
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    radius="xl"
                    size="md"
                    onClick={() => doSearch(searchQuery)}
                  >
                    <IconArrowRight size={16} />
                  </ActionIcon>
                }
                radius="xl"
                size="md"
                value={searchQuery}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  combobox.openDropdown()
                }}
                onFocus={() => suggestions.length > 0 && combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              />
            </Combobox.Target>
            {suggestions.length > 0 && (
              <Combobox.Dropdown>
                <Combobox.Group label="Buscas recentes">
                  {suggestions.map((s) => (
                    <Combobox.Option key={s.id} value={s.query}>
                      <Group gap="xs">
                        <IconClock size={13} opacity={0.4} />
                        <Text size="sm">{s.query}</Text>
                      </Group>
                    </Combobox.Option>
                  ))}
                </Combobox.Group>
                <Combobox.Footer>
                  <Text
                    size="xs"
                    c="dimmed"
                    ta="center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => clearHistory()}
                  >
                    Limpar buscas recentes
                  </Text>
                </Combobox.Footer>
              </Combobox.Dropdown>
            )}
          </Combobox>

          {/* Direita: Notificações + Perfil */}
          <Group gap="xs">
            {/* Busca mobile */}
            <ActionIcon variant="subtle" color="gray" radius="xl" size="lg" hiddenFrom="sm">
              <IconSearch size={18} />
            </ActionIcon>
            <Switch
              size="lg"
              color={isDark ? 'dark.4' : 'gray.6'}
              onLabel={<IconSun size={16} color="white" />}
              offLabel={<IconMoon size={16} color="gray" />}
              onClick={toggleColorScheme}
              aria-label="Alternar tema"
            />
            <ActionIcon variant="subtle" color="gray" radius="xl" size="lg">
              <IconBell size={18} />
            </ActionIcon>
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
                <Menu.Label>{profile?.full_name}</Menu.Label>
                <Menu.Item component={Link} to={`/${profile?.username}`}>
                  Meu perfil
                </Menu.Item>
                <Menu.Item component={Link} to="/settings">
                  Configurações
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={handleSignOut}>
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