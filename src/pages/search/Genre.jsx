import { useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import AppNavbarMobile from '../../components/AppNavbarMobile'
import {
  Container,
  Loader,
  Title,
  Stack,
  Group,
  Affix,
  Flex,
  Image,
  Box,
  Text,
  Avatar,
  Button,
  SimpleGrid,
} from '@mantine/core'
import EmptyStageSvg from '../../assets/svg/empty-stage.svg'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchGenreCategoryDetails } from '../../queries/genres'
import { fetchArtistsByGenreCategory } from '../../queries/artists'
import { IconMusic, IconChevronDown } from '@tabler/icons-react'

const PROJECTS_PATH =
  'https://ik.imagekit.io/mublin/projects/tr:h-100,w-100,c-maintain_ratio/'

// altura aproximada de ~2.5 linhas da grade (avatar + nome + gênero + role + espaçamento)
// a altura muda um pouco conforme os artistas têm ou não role/gênero preenchidos,
// por isso o corte real é medido via ResizeObserver, isso aqui é só o valor inicial
const ARTISTS_COLLAPSED_HEIGHT = 240

function getArtistMainRole(artist) {
  const roles = artist.artist_roles ?? []
  if (!roles.length) {
    return null
  }
  const main = roles.find((role) => role.is_main_role) ?? roles[0]
  return main?.roles?.name_ptbr ?? null
}

function getArtistGenreNames(artist) {
  return (artist.project_genres ?? [])
    .map((pg) => pg.genre?.name_ptbr)
    .filter(Boolean)
    .join(', ')
}

export default function SearchGenre() {
  const { genreId } = useParams()

  const { data: genreCategory, isLoading: loadingGenreCategory } = useQuery({
    queryKey: ['genre-category-details', genreId],
    queryFn: () => fetchGenreCategoryDetails(genreId),
    enabled: !!genreId,
    staleTime: 1000 * 60 * 10,
  })

  const { data: artists = [], isLoading: loadingArtists } = useQuery({
    queryKey: ['artists-by-genre-category', genreId],
    queryFn: () => fetchArtistsByGenreCategory(genreId),
    enabled: !!genreId,
    staleTime: 1000 * 60 * 10,
  })

  // "Artistas relacionados" mostra só quem está nos tiers 4 (Consagrado) e 5
  // (Global) de popularidade — corte fixo, não relativo aos resultados de
  // cada categoria. Quem não tem tier definido (ainda não curado) ou está
  // em tier 1–3 cai em "Projetos".
  const topTierArtists = useMemo(
    () => artists.filter((a) => a.popularity_tier_id === 4 || a.popularity_tier_id === 5),
    [artists],
  )

  const otherProjects = useMemo(
    () => artists.filter((a) => a.popularity_tier_id !== 4 && a.popularity_tier_id !== 5),
    [artists],
  )

  const artistsGridRef = useRef(null)
  const [artistsExpanded, setArtistsExpanded] = useState(false)
  const [artistsFullHeight, setArtistsFullHeight] = useState(null)
  const [artistsOverflowing, setArtistsOverflowing] = useState(false)

  useEffect(() => {
    const el = artistsGridRef.current
    if (!el) {
      return
    }

    const measure = () => {
      const height = el.scrollHeight
      setArtistsFullHeight(height)
      setArtistsOverflowing(height > ARTISTS_COLLAPSED_HEIGHT)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [topTierArtists])

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`${genreCategory?.name_ptbr} · Mublin`}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Página de categoria de música no Mublin" />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName={genreCategory?.name_ptbr} />
      </Affix>

      <Container size="xl" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <Group gap="xs" mb={4} visibleFrom="sm">
          <IconMusic size={32} />
          <Title order={1} fz="h3" ta="left" fw={600}>
            {genreCategory?.name_ptbr}
          </Title>
        </Group>

        {loadingGenreCategory && <Loader size="sm" variant="dots" color="gray" mt={20} />}

        <Stack gap="xs" mb="xl">
          {topTierArtists?.length > 0 && (
            <Title fw={600} size="20px" mt="xl">
              Artistas relacionados
            </Title>
          )}

          {loadingArtists && <Loader size="sm" variant="dots" color="gray" />}

          {!loadingArtists && topTierArtists?.length > 0 && (
            <>
              <Box
                ref={artistsGridRef}
                style={{
                  maxHeight: artistsExpanded
                    ? (artistsFullHeight ?? undefined)
                    : ARTISTS_COLLAPSED_HEIGHT,
                  overflow: 'hidden',
                  transition: 'max-height 250ms ease',
                }}
              >
                <SimpleGrid
                  cols={{ base: 4, sm: 5, md: 7 }}
                  spacing="xs"
                  verticalSpacing="md"
                >
                  {topTierArtists.map((artist) => (
                    <Flex
                      key={artist.id}
                      gap={4}
                      align="center"
                      direction="column"
                      component={Link}
                      to={`/artist/${artist.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Avatar
                        src={
                          artist.picture
                            ? `${PROJECTS_PATH}${artist.id}/${artist.picture}`
                            : undefined
                        }
                        size={50}
                        radius="xl"
                      />
                      <Flex justify="flex-start" align="center" direction="column">
                        <Text
                          size="xs"
                          truncate="end"
                          w="100%"
                          ta="center"
                          fw={500}
                          title={artist.name}
                        >
                          {artist.name}
                        </Text>
                        {getArtistMainRole(artist) && (
                          <Text
                            size="11px"
                            c="dimmed"
                            ta="center"
                            truncate="end"
                            w="100%"
                          >
                            {getArtistMainRole(artist)}
                          </Text>
                        )}
                        {getArtistGenreNames(artist) && (
                          <Text
                            size="10px"
                            c="dimmed"
                            ta="center"
                            truncate="end"
                            w="100%"
                          >
                            {getArtistGenreNames(artist)}
                          </Text>
                        )}
                      </Flex>
                    </Flex>
                  ))}
                </SimpleGrid>
              </Box>

              {artistsOverflowing && (
                <Flex justify="center" mt="sm">
                  <Button
                    variant="light"
                    color="gray"
                    size="xs"
                    radius="xl"
                    rightSection={
                      <IconChevronDown
                        size={14}
                        style={{
                          transform: artistsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 200ms ease',
                        }}
                      />
                    }
                    onClick={() => setArtistsExpanded((v) => !v)}
                  >
                    {artistsExpanded ? 'Mostrar menos' : 'Mostrar mais'}
                  </Button>
                </Flex>
              )}
            </>
          )}

          <Title fw={600} size="20px" mt="xl">
            Projetos
          </Title>
          {loadingArtists && <Loader size="sm" variant="dots" color="gray" />}
          {!loadingArtists && !!otherProjects?.length && (
            <SimpleGrid
              cols={{ base: 4, sm: 5, md: 7 }}
              spacing="xs"
              verticalSpacing="md"
            >
              {otherProjects.map((project) => (
                <Flex
                  key={project.id}
                  gap={4}
                  align="center"
                  direction="column"
                  component={Link}
                  to={`/artist/${project.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <Avatar
                    src={
                      project.picture
                        ? `${PROJECTS_PATH}${project.id}/${project.picture}`
                        : undefined
                    }
                    size={50}
                    radius="xl"
                  />
                  <Flex justify="flex-start" align="center" direction="column">
                    <Text
                      size="xs"
                      truncate="end"
                      w="100%"
                      ta="center"
                      fw={500}
                      title={project.name}
                    >
                      {project.name}
                    </Text>
                    {getArtistMainRole(project) && (
                      <Text size="11px" c="dimmed" ta="center" truncate="end" w="100%">
                        {getArtistMainRole(project)}
                      </Text>
                    )}
                    {getArtistGenreNames(project) && (
                      <Text size="10px" c="dimmed" ta="center" truncate="end" w="100%">
                        {getArtistGenreNames(project)}
                      </Text>
                    )}
                  </Flex>
                </Flex>
              ))}
            </SimpleGrid>
          )}
          {!loadingArtists && !otherProjects?.length && (
            <Stack>
              <Text size="sm" c="dimmed">
                Nenhum projeto por aqui no momento
              </Text>
              <Flex justify="center">
                {/* <Image
                src="https://ik.imagekit.io/mublin/misc/empty_stage_cozy.webp"
                maw={600}
                mah={600}
                radius="md"
                fallbackSrc="https://placehold.co/320x320?text=404"
              /> */}
                <Image src={EmptyStageSvg} maw={450} w="100%" mt="lg" alt="Palco vazio" />
              </Flex>
            </Stack>
          )}

          {/* <Divider label="Pessoas" my="lg" labelPosition="left" />
          <Divider label="Projetos" my="lg" labelPosition="left" />
          <Divider label="Gigs" my="lg" labelPosition="left" /> */}
        </Stack>
      </Container>
    </>
  )
}
