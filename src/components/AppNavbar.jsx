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
import { IconExplore } from '../components/icons/IconExplore'
import Notifications from './Notifications'
import {
  useMantineColorScheme,
  useComputedColorScheme,
  ScrollArea,
  Group,
  Box,
  Menu,
  Badge,
  Text,
  TextInput,
  ActionIcon,
  Avatar,
  UnstyledButton,
  Container,
  Combobox,
  useCombobox,
  Image,
  Indicator,
  Loader,
} from '@mantine/core'
import {
  IconSearch,
  IconArrowRight,
  IconBell,
  IconChevronDown,
  IconClock,
  IconUser,
  IconSettings2,
  IconBookmark,
  IconKey,
  IconArrowLeft,
} from '@tabler/icons-react'
import { truncateString } from '../utils/formatter'
import { useHover } from '@mantine/hooks'
import { useSearchPreview } from '../hooks/useSearchPreview'
import { getAvatarUrl } from '../utils/profile'

const MUBLIN_IMG_PATH = 'https://ik.imagekit.io/mublin'
const PATH_PROJECT_AVATAR = MUBLIN_IMG_PATH + '/projects/'
const AVATAR_PATH = MUBLIN_IMG_PATH + '/tr:h-64,c-maintain_ratio/users/avatars/'
const PATH_PRODUCT_THUMB =
  MUBLIN_IMG_PATH + '/products/tr:w-64,h-64,cm-pad_resize,bg-FFFFFF,fo-x/'

export default function AppNavbar({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { colorScheme } = useMantineColorScheme()
  const { profile, user, signOut } = useAuth()
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'
  const toggleColorScheme = () => setColorScheme(isDark ? 'light' : 'dark')
  const { hovered, ref: discoverRef } = useHover()

  const [searchParams] = useSearchParams()

  const isDiscoverActive = pathname === '/search' && !searchParams.has('q')
  const [searchFocused, setSearchFocused] = useState(false)
  const currentQ = searchParams.get('q') ?? ''
  const [inputValue, setInputValue] = useState(null)
  const searchQuery = inputValue !== null ? inputValue : currentQ
  const trimmedQuery = searchQuery.trim()

  // Precisa vir DEPOIS de searchQuery e searchFocused
  const { people, projects, gear, isPreviewMode, isLoading, hasResults } =
    useSearchPreview(searchQuery, { enabled: searchFocused })

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

  const showDropdown = isPreviewMode || suggestions.length > 0

  // Valores das opções têm prefixo de tipo: user:, project:, gear:, search:, recent:
  function handleOptionSubmit(val) {
    const [type, ...rest] = val.split(':')
    const payload = rest.join(':') // preserva ":" caso exista no termo

    const routes = {
      user: `/${payload}`,
      project: `/project/${payload}`,
      gear: `/gear/${payload}`,
    }

    if (routes[type]) {
      setInputValue(null)
      combobox.closeDropdown()
      navigate(routes[type])
      return
    }

    // 'search' ou 'recent'
    setInputValue(payload)
    doSearch(payload)
  }

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
              <Group gap={2}>
                <Link to="/home">
                  <Image
                    src={colorScheme === 'light' ? MublinLogoBlack : MublinLogoWhite}
                    h={28}
                    w="auto"
                    fit="contain"
                  />
                </Link>
                <Badge
                  color="mColor2"
                  size="sm"
                  mt={4}
                  px={6}
                  py={1}
                  component={Link}
                  to="/home"
                  tt="capitalize"
                  style={{ cursor: 'pointer' }}
                  lts={-0.5}
                >
                  Beta
                </Badge>
              </Group>

              {pathname.includes('backstage') && (
                <>
                  <UnstyledButton
                    align="center"
                    component={Link}
                    to="/home"
                    style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                  >
                    <IconArrowLeft size={18} />
                    <Text size="sm" lh={1}>
                      Voltar ao app
                    </Text>
                  </UnstyledButton>
                </>
              )}
            </Group>

            {/* Busca Desktop */}
            <Group flex={1} visibleFrom="sm" mx={90} className="desktop-search">
              <Combobox store={combobox} onOptionSubmit={handleOptionSubmit} flex={1}>
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
                      searchQuery ? (
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
                      ) : undefined
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
                      showDropdown && combobox.openDropdown()
                    }}
                    onBlur={() => {
                      setSearchFocused(false)
                      combobox.closeDropdown()
                    }}
                    onKeyDown={(e) => {
                      // Só faz a busca genérica se nenhuma opção estiver selecionada
                      // pelas setas; senão o Combobox dispara onOptionSubmit
                      if (e.key === 'Enter' && combobox.getSelectedOptionIndex() === -1) {
                        handleSearch(e)
                      }
                    }}
                  />
                </Combobox.Target>

                {showDropdown && (
                  <Combobox.Dropdown>
                    <Combobox.Options>
                      {isPreviewMode ? (
                        <>
                          {isLoading && !hasResults && (
                            <Combobox.Empty>
                              <Loader size="xs" />
                            </Combobox.Empty>
                          )}

                          {!isLoading && !hasResults && (
                            <Combobox.Empty>
                              Nenhum resultado rápido encontrado
                            </Combobox.Empty>
                          )}

                          {people.length > 0 && (
                            <Combobox.Group label="Pessoas">
                              {people.map((p) => (
                                <Combobox.Option key={p.id} value={`user:${p.username}`}>
                                  <Group gap="xs" wrap="nowrap">
                                    <Avatar
                                      size={28}
                                      radius="xl"
                                      src={
                                        p.avatar
                                          ? getAvatarUrl(p.avatar, p.is_open_to_work, 28)
                                          : undefined
                                      }
                                    />
                                    <Box>
                                      <Text size="sm" lh={1.2} fw={500}>
                                        {p.full_name}
                                      </Text>
                                      <Text size="xs" c="dimmed" lh={1.2}>
                                        @{p.username}
                                      </Text>
                                    </Box>
                                  </Group>
                                </Combobox.Option>
                              ))}
                            </Combobox.Group>
                          )}

                          {projects.length > 0 && (
                            <Combobox.Group label="Projetos">
                              {projects.map((pr) => (
                                <Combobox.Option key={pr.id} value={`project:${pr.slug}`}>
                                  <Group gap="xs" wrap="nowrap">
                                    <Avatar
                                      size={28}
                                      radius="sm"
                                      src={
                                        pr.picture
                                          ? `${PATH_PROJECT_AVATAR}${pr.id}/tr:h-64,w-64,c-maintain_ratio/${pr.picture}`
                                          : undefined
                                      }
                                    />
                                    <Box>
                                      <Text size="sm" lh={1.2} fw={500}>
                                        {pr.name}
                                      </Text>
                                      {pr.project_type_name && (
                                        <Text size="xs" c="dimmed" lh={1.2}>
                                          {pr.project_type_name}
                                        </Text>
                                      )}
                                    </Box>
                                  </Group>
                                </Combobox.Option>
                              ))}
                            </Combobox.Group>
                          )}

                          {gear.length > 0 && (
                            <Combobox.Group label="Equipamentos">
                              {gear.map((g) => (
                                <Combobox.Option key={g.id} value={`gear:${g.slug}`}>
                                  <Group gap="xs" wrap="nowrap">
                                    <Avatar
                                      size={28}
                                      radius="sm"
                                      src={
                                        g.picture
                                          ? PATH_PRODUCT_THUMB + g.picture
                                          : undefined
                                      }
                                    />
                                    <Box>
                                      {g.brand_name && (
                                        <Text size="xs" c="dimmed" lh={1.2}>
                                          {g.brand_name}
                                        </Text>
                                      )}
                                      <Text size="sm" lh={1.2} fw={500}>
                                        {g.name}
                                      </Text>
                                    </Box>
                                  </Group>
                                </Combobox.Option>
                              ))}
                            </Combobox.Group>
                          )}

                          <Combobox.Option value={`search:${trimmedQuery}`}>
                            <Group gap="xs">
                              <IconSearch size={14} opacity={0.5} />
                              <Text size="sm">Buscar por “{trimmedQuery}”</Text>
                            </Group>
                          </Combobox.Option>
                        </>
                      ) : (
                        <Combobox.Group label="Buscas recentes">
                          {suggestions.map((s) => (
                            <Combobox.Option key={s.id} value={`recent:${s.query}`}>
                              <Group gap="xs">
                                <IconClock size={13} opacity={0.4} />
                                <Text size="sm">{s.query}</Text>
                              </Group>
                            </Combobox.Option>
                          ))}
                        </Combobox.Group>
                      )}
                    </Combobox.Options>

                    {!isPreviewMode && (
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
                    )}
                  </Combobox.Dropdown>
                )}
              </Combobox>

              <UnstyledButton
                ref={discoverRef}
                component={Link}
                to="/search"
                opacity={isDiscoverActive || hovered ? 1 : 0.8}
                display="flex"
                style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  // transition: 'opacity 150ms ease',
                }}
              >
                <IconExplore size={24} />
                <Text size="xs">Descobrir</Text>
              </UnstyledButton>
            </Group>

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
                    variant="subtle"
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
                      <IconBell size={22} />
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
                    {profile?.username && (
                      <Text size="sm" fw={600} visibleFrom="sm">
                        {profile?.username ? truncateString(profile?.username, 10) : ''}
                      </Text>
                    )}
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
    </>
  )
}
