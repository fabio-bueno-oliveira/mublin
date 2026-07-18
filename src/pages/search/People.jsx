import { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import {
  useQuery,
  useQueryClient,
  useMutation,
  keepPreviousData,
} from '@tanstack/react-query'
import {
  fetchRecentSearches,
  saveSearchQuery,
  clearSearchHistory,
  searchProfiles,
} from '../../queries/search'
import { useAuth } from '../../hooks/useAuth'
import {
  Box,
  Flex,
  Container,
  Select,
  Group,
  Title,
  Text,
  Avatar,
  TextInput,
  ActionIcon,
  Button,
  Stack,
  Pagination,
  EmptyState,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import {
  IconSearch,
  IconRosetteDiscountCheck,
  IconClock,
  IconX,
  IconArrowLeft,
  IconZoom,
} from '@tabler/icons-react'
import { getAvatarUrl } from '../../utils/profile'
import { SEARCH_ENTITIES_LIST } from '../../constants/search'

const PAGE_SIZE = 15

export default function SearchPeople() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [mobileInput, setMobileInput] = useState(q)
  const [isMobileFocused, setIsMobileFocused] = useState(false)
  const [page, setPage] = useState(1)
  const [prevQ, setPrevQ] = useState(q)

  if (q !== prevQ) {
    setPrevQ(q)
    setPage(1)
  }

  const { data: recentSearches = [] } = useQuery({
    queryKey: ['recent-searches', user?.id],
    queryFn: () => fetchRecentSearches(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const {
    data,
    isLoading: loadingProfiles,
    isFetching,
  } = useQuery({
    queryKey: ['searched-profiles', q, page, PAGE_SIZE],
    queryFn: () => searchProfiles(q, { page, pageSize: PAGE_SIZE }),
    enabled: !!q,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData, // evita "piscar" a lista ao trocar de página
  })

  const profileResults = data?.results ?? []
  const totalResults = data?.total ?? 0
  const totalPages = Math.ceil(totalResults / PAGE_SIZE)

  async function doMobileSearch(keyword) {
    const trimmed = keyword.trim()
    if (!trimmed) {
      navigate('/search')
      return
    }
    if (user?.id) {
      await saveSearchQuery(user.id, trimmed)
      queryClient.invalidateQueries({ queryKey: ['recent-searches', user?.id] })
    }
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const mobileInputRef = useRef(null)

  const debouncedSearch = useDebouncedCallback((value) => {
    doMobileSearch(value)
    mobileInputRef.current?.blur()
  }, 600)

  const locationLabel = (city, region) => {
    const parts = [city, region].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  const { mutate: clearHistory } = useMutation({
    mutationFn: () => clearSearchHistory(user.id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['recent-searches', user?.id] }),
  })

  function handlePageChange(newPage) {
    setPage(newPage)
    // Scroll pro topo da lista ao trocar de página
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Busca · Pessoas · Mublin</title>
        <link rel="canonical" href={`https://mublin.com/search/people/${q || ''}`} />
      </Helmet>
      <Container size="xl" py="sm">
        {/* Busca Mobile */}
        <Box hiddenFrom="sm" mb="sm" mt="xs">
          <Group gap="xs">
            <IconArrowLeft size={22} onClick={() => navigate(-1) || navigate('/home')} />
            <TextInput
              flex={1}
              ref={mobileInputRef}
              placeholder="Pessoas, projetos, gigs, itens..."
              leftSection={<IconSearch size={15} />}
              rightSection={
                mobileInput ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    radius="xl"
                    size="md"
                    onClick={() => {
                      setMobileInput('')
                      navigate('/search')
                    }}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                ) : null
              }
              radius="xl"
              size="md"
              value={mobileInput}
              onChange={(e) => {
                setMobileInput(e.target.value)
                debouncedSearch(e.target.value)
              }}
              onFocus={() => setIsMobileFocused(true)}
              onBlur={() => setIsMobileFocused(false)}
            />
          </Group>
          {!q && recentSearches?.length > 0 && isMobileFocused && (
            <Box mt="sm">
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed">
                  <IconClock
                    size={11}
                    style={{ marginRight: 4, verticalAlign: 'middle' }}
                  />
                  Buscas recentes
                </Text>
                <Text
                  size="xs"
                  c="dimmed"
                  style={{ cursor: 'pointer' }}
                  onClick={() => clearHistory()}
                >
                  Deletar recentes
                </Text>
              </Group>
              <Group gap="xs" wrap="wrap">
                {recentSearches?.map((s) => (
                  <Button
                    key={s.id}
                    size="xs"
                    variant="default"
                    radius="xl"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setMobileInput(s.query)
                      doMobileSearch(s.query)
                    }}
                  >
                    {s.query}
                  </Button>
                ))}
              </Group>
            </Box>
          )}
        </Box>
        {q ? (
          <>
            <Select data={SEARCH_ENTITIES_LIST} defaultValue="/search/people" />
            <Stack gap="sm" mt="md">
              <Flex direction="column">
                <Title order={4} fw={600}>
                  Resultados para "{q}"
                </Title>
                <Text size="sm" c="dimmed">
                  {totalResults} resultado{totalResults !== 1 ? 's' : ''}
                </Text>
              </Flex>
              {loadingProfiles ? (
                <Text size="sm" c="dimmed">
                  Buscando...
                </Text>
              ) : profileResults?.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Nenhum resultado encontrado
                </Text>
              ) : (
                <>
                  <Stack
                    mt="xs"
                    opacity={isFetching ? 0.5 : 1}
                    style={{ transition: 'opacity 0.15s' }}
                  >
                    {profileResults?.map((profile) => (
                      <Flex gap="xs" align="center" key={profile.id}>
                        <Box w={80}>
                          <Link
                            component={Link}
                            to={`/${profile.username}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Avatar
                              size={80}
                              src={
                                profile.avatar
                                  ? getAvatarUrl(
                                      profile.avatar,
                                      profile.is_open_to_work,
                                      80,
                                    )
                                  : undefined
                              }
                            />
                          </Link>
                        </Box>
                        <Box>
                          <Flex
                            component={Link}
                            to={`/${profile.username}`}
                            justify="flex-start"
                            gap="md"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Flex direction="column" gap={2} justify="center">
                              <Group gap={2}>
                                <Group gap={2} justify="center">
                                  <Text size="md" fw={600} lh={1}>
                                    {profile.full_name}
                                  </Text>
                                  {!!profile.is_verified && (
                                    <IconRosetteDiscountCheck
                                      className="iconVerified small"
                                      title="Usuário verificado"
                                    />
                                  )}
                                </Group>
                              </Group>
                              {profile.title && <Text size="sm">{profile.title}</Text>}
                              {locationLabel(profile.city_name, profile.region_name) && (
                                <Text size="13px" opacity={0.7}>
                                  {locationLabel(profile.city_name, profile.region_name)}
                                </Text>
                              )}
                            </Flex>
                          </Flex>
                        </Box>
                      </Flex>
                    ))}
                  </Stack>
                  {totalPages > 1 && (
                    <Group justify="center" mt="lg">
                      <Pagination
                        value={page}
                        onChange={handlePageChange}
                        total={totalPages}
                        siblings={1}
                        boundaries={1}
                      />
                    </Group>
                  )}
                </>
              )}
            </Stack>
          </>
        ) : (
          !isMobileFocused && (
            <EmptyState mt={100}>
              <EmptyState.Indicator>
                <IconZoom />
              </EmptyState.Indicator>
              <EmptyState.Title>Use o campo acima para procurar</EmptyState.Title>
              <EmptyState.Description>
                Busque por pessoas, projetos, equipamentos, marcas, eventos...
              </EmptyState.Description>
            </EmptyState>
          )
        )}
      </Container>
    </>
  )
}
