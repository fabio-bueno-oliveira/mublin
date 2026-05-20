import { useState, useRef } from 'react'
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
  searchBrands,
  searchArtists,
} from '../queries/search'
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
  Badge,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import {
  IconSearch,
  IconRosetteDiscountCheckFilled,
  IconClock,
  IconX,
} from '@tabler/icons-react'
import ProPlanBadge from '../components/ProPlanBadge'

const PATH_USER_AVATAR =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
const PATH_PROJECT_AVATAR = 'https://ik.imagekit.io/mublin/projects/'
const PATH_PRODUCT_IMAGE_DESKTOP =
  'https://ik.imagekit.io/mublin/products/tr:w-180,h-180,cm-pad_resize,bg-FFFFFF,fo-x/'
const PATH_BRAND_IMAGES = 'https://ik.imagekit.io/mublin/products/brands/'
const MAX_OWNERS_VISIBLE = 5

function GearOwners({ productId, totalOwners }) {
  const { data: owners = [] } = useQuery({
    queryKey: ['gear-owners', productId],
    queryFn: () => fetchGearOwners(productId, MAX_OWNERS_VISIBLE + 1),
    enabled: !!productId && totalOwners > 0,
    staleTime: 1000 * 60 * 10,
  })

  if (!totalOwners || owners.length === 0) {
    return null
  }

  const visible = owners.slice(0, MAX_OWNERS_VISIBLE)
  const extra = totalOwners - MAX_OWNERS_VISIBLE

  return (
    <Avatar.Group spacing="xs">
      {visible.map((owner) => (
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

  const { data: profileResults = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['searched-profiles', q],
    queryFn: () => searchProfiles(q),
    enabled: !!q,
    staleTime: 1000 * 60 * 5,
  })

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

  const { data: brandResults = [], isLoading: loadingBrands } = useQuery({
    queryKey: ['searched-brands', q],
    queryFn: () => searchBrands(q),
    enabled: !!q,
    staleTime: 1000 * 60 * 5,
  })

  const { data: artistsResults, isLoading: isLoadingArtists } = useQuery({
    queryKey: ['searchArtists', q],
    queryFn: () => searchArtists(q),
    enabled: q.trim().length > 1,
    staleTime: 1000 * 60 * 3,
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
    <Container size="xl" py="sm">
      {/* Busca Mobile */}
      <Box hiddenFrom="sm" mb="sm">
        <TextInput
          ref={mobileInputRef}
          placeholder="Buscar músicos, projetos, gigs..."
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
        {/* Buscas recentes — só exibe quando campo vazio e sem query ativa */}
        {!q && recentSearches.length > 0 && isMobileFocused && (
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
              {recentSearches.map((s) => (
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
          <Title order={1} fz="h4" fw={600} mt={4} mb="md" visibleFrom="sm">
            {`Buscando por "${q}"`}
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6, lg: 3 }} visibleFrom="sm">
              <NavLink
                href="#people"
                label={
                  loadingProfiles ? 'Pessoas...' : `Pessoas (${profileResults.length})`
                }
                color="gray"
                variant="light"
                px={{ base: 0, sm: 'xs' }}
                py={{ base: 0, sm: 'xs' }}
              />
              <NavLink
                href="#projects"
                label={
                  loadingProjects ? 'Projetos...' : `Projetos (${projectResults.length})`
                }
                color="gray"
                variant="light"
                px={{ base: 0, sm: 'xs' }}
                py={{ base: 0, sm: 'xs' }}
              />
              <NavLink
                href="#gear"
                label={
                  loadingGear ? 'Equipamentos...' : `Equipamentos (${gearResults.length})`
                }
                color="gray"
                variant="light"
                px={{ base: 0, sm: 'xs' }}
                py={{ base: 0, sm: 'xs' }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 9 }}>
              <Stack gap="mb">
                {/* Pessoas */}
                <Box id="people">
                  <Title order={4} fw={600}>
                    Pessoas
                  </Title>
                  {loadingProfiles ? (
                    <Center mt="md">
                      <Loader size="sm" />
                    </Center>
                  ) : profileResults.length === 0 ? (
                    <Text c="dimmed">Nenhum resultado encontrado</Text>
                  ) : (
                    <Stack mt="xs">
                      {profileResults.map((profile) => (
                        <Flex gap="xs" align="center" key={profile.id}>
                          <Box w={80}>
                            <Link
                              component={Link}
                              to={`/${profile.username}`}
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              <Avatar
                                src={
                                  profile.avatar
                                    ? PATH_USER_AVATAR + profile.avatar
                                    : undefined
                                }
                                size={80}
                                radius="xl"
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
                              <Flex direction="column" justify="center">
                                <Group gap={2}>
                                  <Group gap={2} justify="center">
                                    <Text size="md" fw={600} lh={1.2}>
                                      {profile.full_name}
                                    </Text>
                                    {!!profile.is_verified && (
                                      <IconRosetteDiscountCheckFilled
                                        className="iconVerified"
                                        title="Usuário verificado"
                                      />
                                    )}
                                    {profile.plan === 'Pro' && <ProPlanBadge small />}
                                    {profile.is_open_to_work && (
                                      <Badge
                                        variant="light"
                                        color="green"
                                        mt={2}
                                        style={{ flexShrink: 0 }}
                                        size="xs"
                                        ml={1}
                                      >
                                        Disp
                                      </Badge>
                                    )}
                                  </Group>
                                  {/* <Text size="sm" fw={300} span c="dimmed" ml={2}>
                                    @{profile.username}
                                  </Text> */}
                                </Group>
                                {profile.title && <Text size="sm">{profile.title}</Text>}
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
                                {/* <Text size="13px" opacity={0.4} mt={6}>
                                Ativo em {profile.total_active_projects} projeto
                                {profile.total_active_projects !== 1 ? 's' : ''}
                              </Text> */}
                              </Flex>
                            </Flex>
                          </Box>
                        </Flex>
                      ))}
                    </Stack>
                  )}
                </Box>

                {/* Projetos */}
                <Box id="projects">
                  <Title order={4} fw={600}>
                    Projetos
                  </Title>
                  {loadingProjects ? (
                    <Center mt="xl">
                      <Loader size="sm" />
                    </Center>
                  ) : projectResults.length === 0 ? (
                    <Text c="dimmed">Nenhum resultado encontrado</Text>
                  ) : (
                    projectResults.map((project) => (
                      <Flex
                        key={project.id}
                        component={Link}
                        to={`/project/${project.slug}`}
                        justify="flex-start"
                        mb="lg"
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
                        <Flex direction="column" justify="flex-start">
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
                          {!!project.total_members && (
                            <Text size="xs" opacity={0.8}>
                              {project.total_members} integrantes
                            </Text>
                          )}
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

                {/* Equipamentos */}
                <Box id="gear">
                  <Title order={4} fw={600}>
                    Equipamentos
                  </Title>

                  {/* Marcas relacionadas */}
                  {!loadingBrands && brandResults.length > 0 && (
                    <Box>
                      <Text size="xs" mb={6}>
                        {brandResults.length} marca{brandResults.length !== 1 ? 's' : ''}{' '}
                        relacionada{brandResults.length !== 1 ? 's' : ''}
                      </Text>
                      <Scroller>
                        {brandResults.map((brand) => (
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
                              radius="xl"
                              fallbackSrc="https://placehold.co/48x48?text=?"
                              title={brand.name}
                            />
                          </Link>
                        ))}
                      </Scroller>
                    </Box>
                  )}

                  {/* Equipamentos */}
                  {loadingGear ? (
                    <Center mt="xl">
                      <Loader size="sm" />
                    </Center>
                  ) : gearResults.length === 0 ? (
                    <Text c="dimmed">Nenhum resultado encontrado</Text>
                  ) : (
                    <Stack mt="xs">
                      {gearResults.map((gear) => (
                        <Flex key={gear.id} justify="flex-start" gap="md">
                          <Link to={`/gear/${gear.slug}`}>
                            <Avatar
                              src={
                                gear.picture
                                  ? PATH_PRODUCT_IMAGE_DESKTOP + gear.picture
                                  : undefined
                              }
                              size={80}
                              radius="sm"
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
                </Box>
                <Box id="artists">
                  <Title order={4} fw={600}>
                    Figuras consagradas
                  </Title>
                  {isLoadingArtists && q ? (
                    <Group gap="xs" c="dimmed">
                      <Loader size="xs" color="dimmed" type="dots" />
                      <Text size="sm">Buscando artistas...</Text>
                    </Group>
                  ) : !artistsResults?.length && q ? (
                    <Text size="sm" c="dimmed">
                      Nenhum artista, banda ou personalidade encontrado
                    </Text>
                  ) : (
                    artistsResults?.map((artist) => (
                      <Flex
                        key={artist.id}
                        gap="sm"
                        align="center"
                        py="xs"
                        component={Link}
                        to={`/artist/${artist.slug}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Avatar
                          src={
                            artist.picture
                              ? `https://ik.imagekit.io/mublin/artists/tr:h-80,w-80,c-maintain_ratio/${artist.picture}`
                              : null
                          }
                          size={40}
                          radius="xl"
                        />
                        <Flex direction="column">
                          <Group gap={5} align="center">
                            <Text size="sm" fw={600} lh={1.2}>
                              {artist.name}
                            </Text>
                            {/* {artist.is_verified && (
                              <IconRosetteDiscountCheckFilled
                                size={14}
                                color="var(--mantine-color-blue-6)"
                              />
                            )} */}
                          </Group>
                          <Text size="xs" c="dimmed">
                            {artist.artist_roles?.length > 0 &&
                              artist.artist_roles
                                .map((ar) => ar.roles?.name_ptbr)
                                .join(', ')}
                          </Text>
                        </Flex>
                      </Flex>
                    ))
                  )}
                </Box>
              </Stack>
            </Grid.Col>
          </Grid>
        </>
      ) : (
        !isMobileFocused && (
          <>
            <Box hiddenFrom="sm">{/* <Text>Teste</Text> */}</Box>
          </>
        )
      )}
    </Container>
  )
}
