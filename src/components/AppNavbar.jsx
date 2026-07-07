import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'
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
} from '@tabler/icons-react'
import { NAV_ITEMS, QUICK_ACTIONS } from '../constants/navItems'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function AppNavbar({ children }) {
  const navigate = useNavigate()
  const isActive = (path) => pathname === path
  const { pathname } = useLocation()
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
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('read', false)
      return count ?? 0
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 3, // 3 min
    refetchInterval: 1000 * 60 * 3, // polling a cada 3 min
    refetchOnWindowFocus: true, // mas atualiza sempre que voltar à aba
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

  const suggestions = recentSearches.filter(
    (s) =>
      searchQuery.trim() === '' ||
      s.query.toLowerCase().includes(searchQuery.toLowerCase()),
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
              <Group gap="md" ml="lg" align="center" visibleFrom="sm">
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
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      {/* <Button
                        key={item.path}
                        component={Link}
                        to={item.path}
                        variant="transparent"
                        color="gray"
                        size="compact-sm"
                        radius="0"
                        opacity={isActive(item.path) ? 1 : 0.8}
                        leftSection={<Icon size={20} stroke={1.7} />}
                      >
                        {item.label}
                      </Button> */}
                      <Icon size={20} stroke={1.7} />
                      <Text size="xs">{item.label}</Text>
                    </Flex>
                  )
                })}
                {/* Quick Actions — apenas desktop */}
                {/* <Button
                  variant="transparent"
                  color="gray"
                  size="compact-sm"
                  radius="0"
                  opacity={isActive('/create') ? 1 : 0.8}
                  leftSection={<IconPlus size={24} stroke={1.7} />}
                  onClick={() => openActionsMenu()}
                >
                  Criar
                </Button> */}
                <Flex
                  direction="column"
                  align="center"
                  gap={1}
                  opacity={isActive('/create') ? 1 : 0.8}
                  onClick={() => openActionsMenu()}
                  style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
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
                  <ActionIcon variant="default" color="gray" size="lg" radius="xl">
                    <Indicator
                      inline
                      label={
                        <Text fw={500} fz="10px">
                          {unreadNotifications}
                        </Text>
                      }
                      maxValue={99}
                      color="red.8"
                      size={16}
                      offset={2}
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
                      {profile?.username}
                    </Text>
                    <IconChevronDown
                      size={14}
                      style={{ color: 'var(--mantine-color-dimmed)' }}
                    />
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
      {actionsMenuOpened && (
        <Modal
          centered
          opened={openActionsMenu}
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
                  onClick={() => closeActionsMenu()}
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
      )}
    </>
  )
}
