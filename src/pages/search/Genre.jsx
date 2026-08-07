import AppNavbarMobile from '../../components/AppNavbarMobile'
import {
  Container,
  Loader,
  Title,
  Stack,
  Group,
  Affix,
  Flex,
  Text,
  Avatar,
  Scroller,
} from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchGenreCategoryDetails } from '../../queries/genres'
import { fetchArtistsByGenreCategory } from '../../queries/artists'
import {
  IconMusic,
  IconCircleArrowLeftFilled,
  IconCircleArrowRightFilled,
} from '@tabler/icons-react'

const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-100,w-100,c-maintain_ratio/'

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
            Artistas mainstream <br />
            neste gênero
          </Text>

          {loadingArtists && <Loader size="sm" variant="dots" color="gray" />}

          {!loadingArtists && !!artists?.length && (
            <Scroller
              key={artists.length}
              draggable
              controlSize="xl"
              showEndControl={artists.length > 2}
              startControlIcon={<IconCircleArrowLeftFilled size={26} />}
              endControlIcon={<IconCircleArrowRightFilled size={26} />}
            >
              <Group gap="xs" wrap="nowrap">
                {artists.map((artist) => (
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
                      src={artist.picture ? ARTISTS_PATH + artist.picture : undefined}
                      size={50}
                      radius="xl"
                    />
                    <Flex justify="flex-start" align="center" direction="column">
                      <Text size="xs" truncate="end" w={72} fw={500} title={artist.name}>
                        {artist.name}
                      </Text>
                      {(artist.genre?.name_ptbr || artist.genre_2?.name_ptbr) && (
                        <Text size="10px" c="dimmed" ta="center" truncate="end" w="100%">
                          {artist.genre?.name_ptbr || artist.genre_2?.name_ptbr}
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                ))}
              </Group>
            </Scroller>
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
