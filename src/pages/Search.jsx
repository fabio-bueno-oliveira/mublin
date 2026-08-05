import { useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  fetchRecentSearches,
  saveSearchQuery,
  clearSearchHistory,
  searchProfiles,
  searchProjects,
  searchGear,
  fetchGearOwners,
  searchGearCategories,
  searchBrands,
  searchArtists,
  searchEvents,
} from '../queries/search'
import { fetchGenreCategories } from '../queries/genres'
import { fetchRandomProjectOpening } from '../queries/projects'
import { useAuth } from '../hooks/useAuth'
import {
  Grid,
  Box,
  NavLink,
  Flex,
  Container,
  Loader,
  Group,
  Center,
  Scroller,
  Title,
  Text,
  Image,
  Avatar,
  Tooltip,
  TextInput,
  ActionIcon,
  Button,
  Stack,
  EmptyState,
  SimpleGrid,
  UnstyledButton,
  Paper,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import {
  IconSearch,
  IconRosetteDiscountCheck,
  IconClock,
  IconX,
  IconArrowLeft,
  IconZoom,
  IconCircleArrowLeftFilled,
  IconCircleArrowRightFilled,
  IconBriefcase,
} from '@tabler/icons-react'
import { getAvatarUrl } from '../utils/profile'

const PATH_USER_AVATAR =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
const PATH_PROJECT_AVATAR = 'https://ik.imagekit.io/mublin/projects/'
const PATH_PRODUCT_IMAGE_DESKTOP =
  'https://ik.imagekit.io/mublin/products/tr:w-180,h-180,cm-pad_resize,bg-FFFFFF,fo-x/'
const PATH_BRAND_IMAGES = 'https://ik.imagekit.io/mublin/products/brands/'
const PATH_EVENTS_IMAGES = 'https://ik.imagekit.io/mublin/events/'
const MAX_OWNERS_VISIBLE = 5

function GearOwners({ productId, totalOwners }) {
  const { data: owners = [] } = useQuery({
    queryKey: ['gear-owners', productId],
    queryFn: () => fetchGearOwners(productId, MAX_OWNERS_VISIBLE + 1),
    enabled: !!productId && totalOwners > 0,
    staleTime: 1000 * 60 * 10,
  })

  if (!totalOwners || owners?.length === 0) {
    return null
  }

  const visible = owners.slice(0, MAX_OWNERS_VISIBLE)
  const extra = totalOwners - MAX_OWNERS_VISIBLE

  return (
    <Avatar.Group spacing="xs">
      {visible?.map((owner) => (
        <Tooltip key={owner.id} label={owner.full_name} withArrow position="top">
          <Avatar
            size={25}
            radius="xl"
            src={owner.avatar ? PATH_USER_AVATAR + owner.avatar : undefined}
            component={Link}
            to={`/${owner.username}`}
            style={{ textDecoration: 'none' }}
          />
        </Tooltip>
      ))}
      {extra > 0 && (
        <Avatar size={22} radius="xl">
          <Text size="9px" fw={600}>
            +{extra}
          </Text>
        </Avatar>
      )}
    </Avatar.Group>
  )
}

export default function Search() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const [mobileInput, setMobileInput] = useState(q)
  const [isMobileFocused, setIsMobileFocused] = useState(false)

  const { data: recentSearches = [] } = useQuery({
    queryKey: ['recent-searches', user?.id],
    queryFn: () => fetchRecentSearches(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: profilesData, isLoading: loadingProfiles } = useQuery({
    queryKey: ['searched-profiles', q],
    queryFn: () => searchProfiles(q, { pageSize: 3 }),
    enabled: !!q,
    staleTime: 1000 * 60 * 5,
  })

  const profileResults = profilesData?.results ?? []
  const totalProfiles = profilesData?.total ?? 0

  const { data: projectResults = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['searched-projects', q],
    queryFn: () => searchProjects(q),
    enabled: !!q,
    staleTime: 1000 * 60 * 5,
  })

  const { data: gearResults = [], isLoading: loadingGear } = useQuery({
    queryKey: ['searched-gear', q],
    queryFn: () => searchGear(q),
    enabled: !!q,
    staleTime: 1000 * 60 * 5,
  })

  const { data: gearCategories = [] } = useQuery({
    queryKey: ['searched-gear-categories', q],
    queryFn: () => searchGearCategories(q),
    enabled: !!q,
    staleTime: 1000 * 60 * 5,
  })

  const { data: brandResults = [], isLoading: loadingBrands } = useQuery({
    queryKey: ['searched-brands', q],
    queryFn: () => searchBrands(q),
    enabled: !!q,
    staleTime: 1000 * 60 * 5,
  })

  const { data: artistsResults, isLoading: loadingArtists } = useQuery({
    queryKey: ['searchArtists', q],
    queryFn: () => searchArtists(q),
    enabled: q.trim().length > 1,
    staleTime: 1000 * 60 * 3,
  })

  const { data: eventsResults, isLoading: loadingEvents } = useQuery({
    queryKey: ['searchEvents', q],
    queryFn: () => searchEvents(q),
    enabled: q.trim().length > 1,
    staleTime: 1000 * 60 * 3,
  })

  // Categorias de gênero — exibidas apenas na tela inicial da busca (sem "q")
  const { data: genreCategories = [] } = useQuery({
    queryKey: ['genre-categories'],
    queryFn: fetchGenreCategories,
    enabled: !q,
    staleTime: 1000 * 60 * 60, // muda raramente
  })

  // Vaga aleatória — uma nova a cada vez que a tela de busca é aberta sem "q"
  const { data: randomOpening } = useQuery({
    queryKey: ['random-project-opening'],
    queryFn: fetchRandomProjectOpening,
    enabled: !q,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })

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

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Busca · Mublin</title>
        <link rel="canonical" href={`https://mublin.com/search/${q || ''}`} />
      </Helmet>
      <Container size="xl" py="sm">
        {/* Busca Mobile */}
        <Box hiddenFrom="sm" mb="sm" mt="xs">
          <Group gap="xs">
            <IconArrowLeft
              size={22}
              // style={{ flexShrink: 0, cursor: 'pointer' }}
              onClick={() => navigate(-1) || navigate('/home')}
            />
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
          {/* Buscas recentes — só exibe quando campo vazio e sem query ativa */}
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
            <Grid>
              <Grid.Col span={{ base: 12, md: 6, lg: 3 }} visibleFrom="sm">
                <NavLink
                  href="#people"
                  label={loadingProfiles ? 'Pessoas...' : `Pessoas (${totalProfiles})`}
                  color="gray"
                  variant="light"
                  px={{ base: 0, sm: 'xs' }}
                  py={{ base: 0, sm: 'xs' }}
                />
                <NavLink
                  href="#projects"
                  label={
                    loadingProjects
                      ? 'Projetos...'
                      : `Projetos (${projectResults?.length})`
                  }
                  color="gray"
                  variant="light"
                  px={{ base: 0, sm: 'xs' }}
                  py={{ base: 0, sm: 'xs' }}
                />
                <NavLink
                  href="#brands"
                  label={loadingBrands ? 'Marcas...' : `Marcas (${brandResults?.length})`}
                  color="gray"
                  variant="light"
                  px={{ base: 0, sm: 'xs' }}
                  py={{ base: 0, sm: 'xs' }}
                />
                <NavLink
                  href="#events"
                  label={
                    loadingEvents ? 'Eventos...' : `Eventos (${eventsResults?.length})`
                  }
                  color="gray"
                  variant="light"
                  px={{ base: 0, sm: 'xs' }}
                  py={{ base: 0, sm: 'xs' }}
                />
                <NavLink
                  href="#gear"
                  label={
                    loadingGear
                      ? 'Equipamentos...'
                      : `Equipamentos (${gearResults?.length})`
                  }
                  color="gray"
                  variant="light"
                  px={{ base: 0, sm: 'xs' }}
                  py={{ base: 0, sm: 'xs' }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6, lg: 9 }}>
                <Stack gap="sm">
                  <Box id="people">
                    <Title order={4} fw={600}>
                      Perfis
                    </Title>
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
                        <Stack mt="xs">
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
                                    {profile.title && (
                                      <Text size="sm">{profile.title}</Text>
                                    )}
                                    {locationLabel(
                                      profile.city_name,
                                      profile.region_name,
                                    ) && (
                                      <Text size="13px" opacity={0.7}>
                                        {locationLabel(
                                          profile.city_name,
                                          profile.region_name,
                                        )}
                                      </Text>
                                    )}
                                  </Flex>
                                </Flex>
                              </Box>
                            </Flex>
                          ))}
                        </Stack>

                        {totalProfiles > profileResults.length && (
                          <Text
                            component={Link}
                            to={`/search/people?q=${encodeURIComponent(q)}`}
                            size="sm"
                            fw={500}
                            mt="sm"
                            style={{ textDecoration: 'none', display: 'inline-block' }}
                          >
                            Ver todos os {totalProfiles} resultados
                          </Text>
                        )}
                      </>
                    )}
                  </Box>

                  {!!artistsResults?.length && (
                    <Box id="artists">
                      <Title order={4} fw={600}>
                        Artistas e personalidades mainstream
                      </Title>
                      {!!artistsResults?.length && (
                        <Scroller
                          key={artistsResults.length}
                          draggable
                          controlSize="xl"
                          showEndControl={artistsResults.length > 2}
                          startControlIcon={<IconCircleArrowLeftFilled size={26} />}
                          endControlIcon={<IconCircleArrowRightFilled size={26} />}
                        >
                          <Group gap="xs" wrap="nowrap">
                            {artistsResults?.map((artist) => (
                              <Flex
                                key={artist.id}
                                w={82}
                                mt="xs"
                                gap="xs"
                                align="center"
                                direction="column"
                                component={Link}
                                to={`/artist/${artist.slug}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                              >
                                <Avatar
                                  src={
                                    artist.picture
                                      ? `https://ik.imagekit.io/mublin/artists/tr:h-100,w-100,c-maintain_ratio/${artist.picture}`
                                      : null
                                  }
                                  size={50}
                                  radius="xl"
                                />
                                <Flex
                                  justify="flex-start"
                                  align="center"
                                  direction="column"
                                >
                                  <Text
                                    size="xs"
                                    truncate="end"
                                    w={72}
                                    fw={500}
                                    title={artist.name}
                                  >
                                    {artist.name}
                                  </Text>
                                  {artist.genre_name && (
                                    <Text
                                      size="10px"
                                      c="dimmed"
                                      ta="center"
                                      truncate="end"
                                      w="100%"
                                    >
                                      {artist.genre_name}
                                    </Text>
                                  )}
                                  {/* <Text
                                    size="xs"
                                    ta="center"
                                    c="dimmed"
                                    w="90%"
                                    truncate="end"
                                  >
                                    {artist.artist_roles?.length > 0 &&
                                      artist.artist_roles
                                        .map((ar) => ar.roles?.name_ptbr)
                                        .join(', ')}
                                  </Text> */}
                                </Flex>
                              </Flex>
                            ))}
                          </Group>
                        </Scroller>
                      )}
                    </Box>
                  )}

                  <Box id="projects">
                    <Title order={4} fw={600}>
                      Projetos
                    </Title>

                    {loadingProjects ? (
                      <Text size="sm" c="dimmed">
                        Buscando...
                      </Text>
                    ) : projectResults?.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        Nenhum resultado encontrado
                      </Text>
                    ) : (
                      projectResults?.map((project) => (
                        <Flex
                          mt="xs"
                          mb={4}
                          key={project.id}
                          component={Link}
                          to={`/project/${project.slug}`}
                          justify="flex-start"
                          gap="md"
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Avatar
                            src={
                              project.picture
                                ? `${PATH_PROJECT_AVATAR}${project.id}/tr:h-200,w-200,c-maintain_ratio/${project.picture}`
                                : undefined
                            }
                            size={80}
                            radius="sm"
                          />
                          <Flex direction="column" justify="center">
                            <Text size="md" fw={600} lh={1.2}>
                              {project.name}
                            </Text>
                            <Text size="xs" opacity={0.8}>
                              {project.project_type_name}
                              {project.project_type_name &&
                                project.main_genre_name &&
                                ' • '}
                              {project.main_genre_name}
                            </Text>
                            {/* {!!project.total_members && (
                                <Text size="xs" opacity={0.8}>
                                  {project.total_members} integrantes
                                </Text>
                              )} */}
                            {!!project.related_member_username && (
                              <Text size="xs" opacity={0.4} mt={4}>
                                Pessoa relacionada: {project.related_member_full_name}
                              </Text>
                            )}
                          </Flex>
                        </Flex>
                      ))
                    )}
                  </Box>

                  {/* Marcas e Empresas */}
                  <Box id="brands">
                    <Title order={4} fw={600}>
                      Marcas e Empresas
                    </Title>

                    {loadingBrands ? (
                      <Center mt="xl">
                        <Loader size="sm" />
                      </Center>
                    ) : brandResults?.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        Nenhum resultado encontrado
                      </Text>
                    ) : (
                      <Scroller pt={6}>
                        <Group gap="xs" wrap="nowrap">
                          {brandResults?.map((brand) => (
                            <Link key={brand.id} to={`/brand/${brand.slug}`}>
                              <Image
                                src={
                                  brand.logo
                                    ? `${PATH_BRAND_IMAGES}tr:w-130,h-130,cm-pad_resize,bg-FFFFFF,fo-x/${brand.logo}`
                                    : undefined
                                }
                                h={65}
                                w={65}
                                fit="contain"
                                radius="lg"
                                fallbackSrc="https://placehold.co/48x48?text=?"
                                title={brand.name}
                              />
                            </Link>
                          ))}
                        </Group>
                      </Scroller>
                    )}
                  </Box>

                  {/* Eventos */}
                  <Box id="events">
                    <Title order={4} fw={600}>
                      Eventos
                    </Title>

                    {loadingEvents ? (
                      <Center mt="xl">
                        <Loader size="sm" />
                      </Center>
                    ) : eventsResults?.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        Nenhum resultado encontrado
                      </Text>
                    ) : (
                      <Scroller pt={6}>
                        <Group gap="xs" wrap="nowrap">
                          {eventsResults?.map((event) => (
                            <Link key={event.id} to={`/event/${event.slug}`}>
                              <Image
                                src={
                                  event.picture_url
                                    ? `${PATH_EVENTS_IMAGES}tr:w-130,h-130,cm-pad_resize,bg-FFFFFF,fo-x/${event.picture_url}`
                                    : undefined
                                }
                                h={65}
                                w={65}
                                fit="contain"
                                radius="lg"
                                fallbackSrc="https://placehold.co/48x48?text=?"
                                title={event.name}
                              />
                            </Link>
                          ))}
                        </Group>
                      </Scroller>
                    )}
                  </Box>

                  {/* Equipamentos */}
                  <Box id="gear">
                    <Title order={4} fw={600}>
                      Equipamentos
                    </Title>

                    {loadingGear ? (
                      <Center mt="xl">
                        <Loader size="sm" />
                      </Center>
                    ) : gearResults?.length === 0 ? (
                      <Text c="dimmed" size="sm">
                        Nenhum item encontrado
                      </Text>
                    ) : (
                      <Stack mt="xs">
                        {gearResults?.map((gear) => (
                          <Flex key={gear.id} justify="flex-start" gap="md">
                            <Link to={`/gear/${gear.slug}`}>
                              <Avatar
                                src={
                                  gear.picture
                                    ? PATH_PRODUCT_IMAGE_DESKTOP + gear.picture
                                    : undefined
                                }
                                size={80}
                                radius="md"
                              />
                            </Link>
                            <Flex direction="column" justify="flex-start" maw="70%">
                              <Text size="sm" opacity={0.8}>
                                {gear.brand_name}
                              </Text>
                              <Text
                                size="md"
                                fw={600}
                                lh={1.2}
                                truncate="end"
                                component={Link}
                                to={`/gear/${gear.slug}`}
                                c="var(--mantine-color-text)"
                              >
                                {gear.name}
                              </Text>
                              {gear.subtitle && (
                                <Text size="sm" opacity={0.7}>
                                  {gear.subtitle}
                                </Text>
                              )}
                              {gear.category_name_ptbr && (
                                <Text size="xs" opacity={0.5}>
                                  {gear.category_name_ptbr}
                                </Text>
                              )}
                              {/* {gear.total_owners > 0 && (
                                <Text size="11px" mt={3}>
                                  {gear.total_owners} usuário
                                  {gear.total_owners !== 1 ? 's' : ''} tem este equipamento
                                </Text>
                              )} */}
                              <GearOwners
                                productId={gear.id}
                                totalOwners={gear.total_owners}
                              />
                            </Flex>
                          </Flex>
                        ))}
                      </Stack>
                    )}

                    {!!gearCategories?.length && (
                      <>
                        <Text c="dimmed" size="xs" mt="md">
                          Categorias de equipamentos relacionadas a "{q}"
                        </Text>

                        <Stack gap="xs" justify="flex-start">
                          {gearCategories?.map((category) => (
                            <Box
                              key={category.id}
                              component={Link}
                              to={`/gear/category/${category.slug}`}
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              <Text size="sm" fw={500} title={category.name_ptbr}>
                                Ver todos os itens da categoria {category.name_ptbr}
                              </Text>
                            </Box>
                          ))}
                        </Stack>
                      </>
                    )}
                  </Box>
                </Stack>
              </Grid.Col>
            </Grid>
          </>
        ) : (
          !isMobileFocused && (
            <Stack gap="xl" mt={{ base: 'md', sm: 60 }}>
              <EmptyState>
                <EmptyState.Indicator>
                  <IconZoom />
                </EmptyState.Indicator>
                <EmptyState.Title>Use o campo acima para procurar</EmptyState.Title>
                <EmptyState.Description>
                  Busque por pessoas, projetos, equipamentos, marcas, eventos...
                </EmptyState.Description>
              </EmptyState>

              {randomOpening && (
                <Paper
                  component={Link}
                  to={`/project/${randomOpening.project_slug}`}
                  withBorder
                  radius="lg"
                  p="md"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Group justify="space-between" wrap="nowrap" gap="md">
                    <Group gap="md" wrap="nowrap" style={{ minWidth: 0 }}>
                      <Avatar
                        size={52}
                        radius="md"
                        src={
                          randomOpening.project_picture
                            ? PATH_PROJECT_AVATAR + randomOpening.project_picture
                            : undefined
                        }
                      >
                        <IconBriefcase size={22} />
                      </Avatar>
                      <Box style={{ minWidth: 0 }}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts="0.03em">
                          Vaga em destaque
                        </Text>
                        <Text fw={600} truncate="end">
                          {randomOpening.project_name}
                          {randomOpening.genre_name_ptbr &&
                            `, ${randomOpening.genre_name_ptbr}`}
                          {`, busca ${randomOpening.role_name_ptbr}`}
                        </Text>
                      </Box>
                    </Group>
                    <Button size="xs" variant="light" component="span" flex="0 0 auto">
                      Ver vaga
                    </Button>
                  </Group>
                </Paper>
              )}

              {!!genreCategories?.length && (
                <Box>
                  <Title order={4} fw={600} mb="sm">
                    Explore por gênero
                  </Title>
                  <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5, lg: 6 }} spacing="sm">
                    {genreCategories.map((genre) => {
                      const color = genre.color || 'indigo'
                      return (
                        <UnstyledButton
                          key={genre.id}
                          component={Link}
                          to={`/genre/${genre.id}`}
                          style={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: 16,
                            height: 92,
                            border: '1px solid var(--mantine-color-default-border)',
                            background: 'var(--mantine-color-body)',
                            padding: 0,
                            transition:
                              'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
                          }}
                          onMouseEnter={(e) => {
                            // e.currentTarget.style.transform = 'translateY(-2px)'
                            // e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)'
                            e.currentTarget.style.borderColor = `var(--mantine-color-${color}-3)`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                            e.currentTarget.style.borderColor =
                              'var(--mantine-color-default-border)'
                          }}
                        >
                          {/* barra lateral com a cor do gênero */}
                          <Box
                            aria-hidden
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: 4,
                              background: `var(--mantine-color-${color}-6)`,
                            }}
                          />
                          {/* bolha grande suave */}
                          <Box
                            aria-hidden
                            style={{
                              position: 'absolute',
                              right: -18,
                              bottom: -18,
                              width: 68,
                              height: 68,
                              borderRadius: '50%',
                              background: `var(--mantine-color-${color}-light)`,
                              opacity: 0.4,
                            }}
                          />
                          {/* letra inicial gigante fantasma */}
                          <Text
                            aria-hidden
                            fw={700}
                            fz={46}
                            lh={1}
                            style={{
                              position: 'absolute',
                              right: 8,
                              bottom: -4,
                              color: `var(--mantine-color-${color}-6)`,
                              opacity: 0.09,
                              pointerEvents: 'none',
                              userSelect: 'none',
                            }}
                          >
                            {genre.name_ptbr?.charAt(0)?.toUpperCase()}
                          </Text>

                          <Flex
                            h="100%"
                            align="flex-start"
                            direction="column"
                            justify="center"
                            pl={18}
                            pr={44}
                            gap={2}
                            style={{ position: 'relative', zIndex: 1 }}
                          >
                            <Text
                              fw={700}
                              size="sm"
                              lh={1.15}
                              lineClamp={2}
                              style={{ letterSpacing: '-0.01em' }}
                            >
                              {genre.name_ptbr}
                            </Text>
                          </Flex>
                        </UnstyledButton>
                      )
                    })}
                  </SimpleGrid>
                </Box>
              )}
            </Stack>
          )
        )}
      </Container>
    </>
  )
}
