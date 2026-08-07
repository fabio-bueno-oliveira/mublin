import { useEffect, useRef, useState } from 'react'
import AppNavbarMobile from '../../components/AppNavbarMobile'
import {
  Container,
  Loader,
  Title,
  Stack,
  Group,
  Affix,
  Flex,
  Box,
  Text,
  Avatar,
  Button,
  SimpleGrid,
} from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchGenreCategoryDetails } from '../../queries/genres'
import { fetchArtistsByGenreCategory } from '../../queries/artists'
import { IconMusic, IconChevronDown } from '@tabler/icons-react'

const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-100,w-100,c-maintain_ratio/'

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
  }, [artists])

  return (
    <>
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

        <Stack gap="xs" mb="xl" mt="lg">
          <Text fw={600} size="26px" lh={1.2}>
            Artistas relacionados
          </Text>

          {loadingArtists && <Loader size="sm" variant="dots" color="gray" />}

          {!loadingArtists && !!artists?.length && (
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
                  {artists.map((artist) => (
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
                        src={artist.picture ? ARTISTS_PATH + artist.picture : undefined}
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
                        {(artist.genre?.name_ptbr || artist.genre_2?.name_ptbr) && (
                          <Text
                            size="10px"
                            c="dimmed"
                            ta="center"
                            truncate="end"
                            w="100%"
                          >
                            {artist.genre?.name_ptbr ?? artist.genre?.name_ptbr}
                            {artist.genre_2?.name_ptbr
                              ? `, ${artist.genre_2?.name_ptbr}`
                              : ''}
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

          {!loadingArtists && !artists?.length && (
            <Text size="sm" c="dimmed">
              Nenhum artista encontrado nessa categoria ainda.
            </Text>
          )}

          <Text fw={600} size="18px" mt="xl">
            Projetos
          </Text>
          <Text size="sm" c="dimmed">
            Nenhum projeto no momento
          </Text>

          {/* <Divider label="Pessoas" my="lg" labelPosition="left" />
          <Divider label="Projetos" my="lg" labelPosition="left" />
          <Divider label="Gigs" my="lg" labelPosition="left" /> */}
        </Stack>
      </Container>
    </>
  )
}
