import { useAuth } from '../hooks/useAuth'
import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  fetchRecentSearches,
  saveSearchQuery,
  clearSearchHistory,
  fetchRandomSearchPhrase,
} from '../queries/search'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import Notifications from './Notifications'
import { useDisclosure } from '@mantine/hooks'
import {
  useMantineColorScheme,
  useComputedColorScheme,
  Box,
  Modal,
  Group,
  Menu,
  Text,
  TextInput,
  ActionIcon,
  Avatar,
  Button,
  Container,
  Combobox,
  useCombobox,
  Stack,
  Image,
  Indicator,
  ScrollArea,
  Flex,
} from '@mantine/core'
import {
  IconSearch,
  IconArrowRight,
  IconPlus,
  IconBell,
  IconChevronDown,
  IconClock,
  IconUser,
  IconSettings2,
  IconBookmark,
  IconKey,
} from '@tabler/icons-react'
import { NAV_ITEMS, QUICK_ACTIONS } from '../constants/navItems'
import { truncateString } from '../utils/formatter'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-64,c-maintain_ratio/users/avatars/'

const NAV_LINK_STYLE = { textDecoration: 'none', color: 'inherit' }

export default function AppNavbar({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isActive = (path) => pathname === path
  const { colorScheme } = useMantineColorScheme()
  const { profile, user, signOut } = useAuth()
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'
  const toggleColorScheme = () => setColorScheme(isDark ? 'light' : 'dark')
  const [actionsMenuOpened, { open: openActionsMenu, close: closeActionsMenu }] =
    useDisclosure(false)

  const [searchParams] = useSearchParams()
  const [searchFocused, setSearchFocused] = useState(false)

  const currentQ = searchParams.get('q') ?? ''
  const [inputValue, setInputValue] = useState(null)
  const searchQuery = inputValue !== null ? inputValue : currentQ

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const { data: unreadNotifications = 0 } = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('read', false)
      return count ?? 0
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 6, // 6 min
    refetchOnWindowFocus: true, // rede de segurança caso o WebSocket caia
  })

  const { data: recentSearches = [] } = useQuery({
    queryKey: ['recent-searches', user?.id],
    queryFn: () => fetchRecentSearches(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: searchPhrase } = useQuery({
    queryKey: ['search-phrase'],
    queryFn: fetchRandomSearchPhrase,
    staleTime: 1000 * 60 * 10,
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE ou DELETE
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['notifications-unread-count', user.id],
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  const { mutate: clearHistory } = useMutation({
    mutationFn: () => clearSearchHistory(user.id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['recent-searches', user?.id],
      }),
  })

  async function doSearch(q) {
    const trimmed = q.trim()
    if (trimmed && user?.id) {
      await saveSearchQuery(user.id, trimmed)
      queryClient.invalidateQueries({ queryKey: ['recent-searches', user?.id] })
    }
    setInputValue(null)
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

  const suggestions = useMemo(
    () =>
      recentSearches.filter(
        (s) =>
          searchQuery.trim() === '' ||
          s.query.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [recentSearches, searchQuery],
  )

  return (
    <>
      <Box
        h="100%"
        // style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        bg="var(--mantine-color-default)"
      >
        <Container size="lg" h="100%">
          <Group justify="space-between" align="center" h="100%" gap="md">
            {/* Logo + Nav items */}
            <Group gap="md">
              {children}
              <Link to="/home">
                <Image
                  src={colorScheme === 'light' ? MublinLogoBlack : MublinLogoWhite}
                  h={28}
                  w="auto"
                  fit="contain"
                />
              </Link>
              {/* Nav items — apenas desktop */}
              <Group gap="lg" ml="lg" align="center" visibleFrom="sm">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <Flex
                      key={item.path}
                      direction="column"
                      align="center"
                      gap={1}
                      component={Link}
                      to={item.path}
                      opacity={isActive(item.path) ? 1 : 0.8}
                      style={NAV_LINK_STYLE}
                    >
                      <Icon size={20} stroke={1.7} />
                      <Text size="xs">{item.label}</Text>
                    </Flex>
                  )
                })}
                {/* Quick Actions — apenas desktop */}
                <Flex
                  direction="column"
                  align="center"
                  gap={1}
                  opacity={isActive('/create') ? 1 : 0.8}
                  onClick={openActionsMenu}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openActionsMenu()
                    }
                  }}
                  style={{ ...NAV_LINK_STYLE, cursor: 'pointer' }}
                >
                  <IconPlus size={20} stroke={1.7} />
                  <Text size="xs">Criar</Text>
                </Flex>
              </Group>
            </Group>

            {/* Busca Desktop */}
            <Combobox
              store={combobox}
              onOptionSubmit={(val) => {
                setInputValue(val)
                doSearch(val)
              }}
              visibleFrom="sm"
              flex={2}
              maw="42%"
            >
              <Combobox.Target>
                <TextInput
                  placeholder={
                    searchFocused
                      ? searchPhrase
                        ? `ex: ${searchPhrase}`
                        : 'PRS Silversky'
                      : 'Pessoas, projetos, gigs, equipamentos...'
                  }
                  leftSection={<IconSearch size={15} />}
                  rightSection={
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      radius="xl"
                      size="md"
                      aria-label="Buscar"
                      onClick={() => doSearch(searchQuery)}
                    >
                      <IconArrowRight size={16} />
                    </ActionIcon>
                  }
                  radius="xl"
                  size="md"
                  variant="default"
                  color="var(--mantine-color-text)"
                  value={searchQuery}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    combobox.openDropdown()
                  }}
                  onFocus={() => {
                    setSearchFocused(true)
                    suggestions.length > 0 && combobox.openDropdown()
                  }}
                  onBlur={() => {
                    setSearchFocused(false)
                    combobox.closeDropdown()
                  }}
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
            <Group gap="sm">
              {/* Busca mobile */}
              <ActionIcon
                variant="subtle"
                color="gray"
                radius="xl"
                size="lg"
                hiddenFrom="sm"
                aria-label="Buscar"
                onClick={() => navigate('/search')}
              >
                <IconSearch size={18} />
              </ActionIcon>
              <Menu
                shadow="md"
                width={300}
                radius="md"
                position="bottom-end"
                offset={8}
                closeOnItemClick={false}
              >
                <Menu.Target>
                  <ActionIcon
                    variant="default"
                    color="gray"
                    size="lg"
                    radius="xl"
                    aria-label="Notificações"
                  >
                    <Indicator
                      inline
                      label={unreadNotifications}
                      maxValue={99}
                      color="red.8"
                      size={14}
                      offset={6}
                      disabled={unreadNotifications === 0}
                    >
                      <IconBell size={20} />
                    </Indicator>
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown p={0}>
                  <ScrollArea.Autosize mah={400} scrollbarSize={6} px="xs">
                    <Notifications />
                  </ScrollArea.Autosize>
                </Menu.Dropdown>
              </Menu>
              <Menu shadow="md" width={200} radius="md" position="bottom-end">
                <Menu.Target>
                  <Group gap={6} style={{ cursor: 'pointer' }}>
                    <Avatar
                      size={32}
                      src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
                      radius="xl"
                    />
                    <Text size="sm" fw={600} visibleFrom="sm">
                      {truncateString(profile?.username, 10)}
                    </Text>
                    <IconChevronDown
                      size={14}
                      style={{ color: 'var(--mantine-color-dimmed)' }}
                    />
                  </Group>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{profile?.full_name}</Menu.Label>
                  <Menu.Item
                    component={Link}
                    to={`/${profile?.username}`}
                    leftSection={<IconUser size={14} />}
                  >
                    Meu perfil
                  </Menu.Item>
                  <Menu.Item
                    component={Link}
                    to="/settings"
                    leftSection={<IconSettings2 size={14} />}
                  >
                    Configurações
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item
                    component={Link}
                    to="/saved"
                    leftSection={<IconBookmark size={14} />}
                  >
                    Salvos
                  </Menu.Item>
                  {profile?.is_admin && (
                    <>
                      <Menu.Divider />
                      <Menu.Item
                        component={Link}
                        to="/admin"
                        leftSection={<IconKey size={14} />}
                      >
                        Admin
                      </Menu.Item>
                    </>
                  )}
                  <Menu.Divider />
                  <Menu.Item onClick={toggleColorScheme}>
                    {isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item onClick={handleSignOut}>Sair</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Container>
      </Box>
      <Modal
        centered
        opened={actionsMenuOpened}
        onClose={closeActionsMenu}
        title="Criar"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Stack mt="lg">
          {QUICK_ACTIONS.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                onClick={closeActionsMenu}
                leftSection={<Icon size={20} />}
                variant="subtle"
                justify="flex-start"
                color="gray"
                size="sm"
              >
                {item.label}
              </Button>
            )
          })}
        </Stack>
      </Modal>
    </>
  )
}
