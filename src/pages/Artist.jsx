import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchArtistDetails,
  fetchArtistGear,
  fetchArtistsInspirated,
} from '../queries/artists'
import AppNavbarMobile from '../components/AppNavbarMobile'
import MublinMLogoBlack from '../assets/svg/mublin-m-logo-black.svg'
import MublinMLogoWhite from '../assets/svg/mublin-m-logo-white.svg'
import {
  useMantineColorScheme,
  Container,
  Anchor,
  Title,
  Text,
  Group,
  Stack,
  Skeleton,
  Avatar,
  ActionIcon,
  Center,
  Flex,
  Image,
  Affix,
} from '@mantine/core'
import {
  IconBrandSpotify,
  IconBrandInstagram,
  IconApple,
  IconBrandYoutube,
} from '@tabler/icons-react'

const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-200,w-200,c-maintain_ratio/'
const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-80,c-maintain_ratio/users/avatars/'
const PRODUCT_IMAGE_PATH =
  'https://ik.imagekit.io/mublin/products/tr:w-144,h-144,cm-pad_resize,bg-FFFFFF,fo-x/'

export default function Artist() {
  const { slug } = useParams()
  const { colorScheme } = useMantineColorScheme()

  useEffect(() => {
    scrollTo({ y: 0 })
  }, [])

  const {
    data: artist,
    isLoading: loadingArtistInfo,
    isSuccess,
  } = useQuery({
    queryKey: ['artist-details', slug],
    queryFn: () => fetchArtistDetails(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 4,
  })

  const { data: inspirated = [], isLoading: loadingInspirated } = useQuery({
    queryKey: ['artist-inspirated', artist?.id],
    queryFn: () => fetchArtistsInspirated(artist?.id),
    enabled: !!artist?.id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: gear = [], isLoading: loadingArtistGear } = useQuery({
    queryKey: ['artist-gear', artist?.id],
    queryFn: () => fetchArtistGear(artist?.id),
    enabled: !!artist?.id,
    staleTime: 1000 * 60 * 4,
  })

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{artist?.name ? `${artist.name} · Mublin` : 'Mublin'}</title>
        <link rel="canonical" href={`https://mublin.com/artist/${artist?.slug || ''}`} />
        <meta
          name="description"
          content={`Informações de '${artist?.name || ''}' no Mublin`}
        />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Perfil de figura mainstream" />
      </Affix>

      <Container size="xl" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 62, sm: 0 }}>
        <Stack gap="xs" mb="xl">
          {loadingArtistInfo ? (
            <Center>
              <Skeleton radius="xl" height={100} width={100} />
            </Center>
          ) : (
            <>
              {isSuccess && artist ? (
                <>
                  <Center>
                    <Avatar
                      size={100}
                      radius="xl"
                      src={artist?.picture ? ARTISTS_PATH + artist.picture : undefined}
                      title={artist?.name}
                      alt={artist?.name}
                    />
                  </Center>
                  <Flex direction="column" align="center">
                    <Text c="dimmed" size="13px" mb={6} visibleFrom="sm">
                      Página de artista mainstream
                    </Text>
                    <Title order={1} fz="h2">
                      {artist?.name}
                    </Title>
                    <Text>
                      {artist?.is_band ? 'Banda' : 'Artista'} ·{' '}
                      {artist?.genres?.name_ptbr || artist?.genres?.name}
                    </Text>
                  </Flex>
                  {(artist.spotify_id ||
                    artist.instagram ||
                    artist.apple_music_id ||
                    artist.youtube_handle) && (
                    <Group justify="center">
                      {artist.spotify_id && (
                        <ActionIcon
                          color="gray"
                          c="var(--mantine-color-text)"
                          variant="subtle"
                          component={Anchor}
                          href={`https://open.spotify.com/artist/${artist.spotify_id}`}
                          target="_blank"
                          title="Spotify"
                        >
                          <IconBrandSpotify />
                        </ActionIcon>
                      )}
                      {artist.apple_music_id && (
                        <ActionIcon
                          color="gray"
                          c="var(--mantine-color-text)"
                          variant="subtle"
                          component={Anchor}
                          href={`https://music.apple.com/br/artist/${artist.apple_music_id}`}
                          target="_blank"
                          title="Apple Music"
                        >
                          <IconApple />
                        </ActionIcon>
                      )}
                      {artist.instagram && (
                        <ActionIcon
                          color="gray"
                          c="var(--mantine-color-text)"
                          variant="subtle"
                          component={Anchor}
                          href={`https://www.instagram.com/${artist.instagram}`}
                          target="_blank"
                          title="Instagram"
                        >
                          <IconBrandInstagram />
                        </ActionIcon>
                      )}
                      {artist.youtube_handle && (
                        <ActionIcon
                          color="gray"
                          c="var(--mantine-color-text)"
                          variant="subtle"
                          component={Anchor}
                          href={`https://www.youtube.com/channel/${artist.youtube_handle}`}
                          target="_blank"
                          title="Instagram"
                        >
                          <IconBrandYoutube />
                        </ActionIcon>
                      )}
                    </Group>
                  )}
                  {!artist?.is_band && (
                    <Group gap={8} justify="center" align="flex-end">
                      {artist?.is_active_in_business && (
                        <>
                          <Image
                            src={
                              colorScheme === 'light'
                                ? MublinMLogoBlack
                                : MublinMLogoWhite
                            }
                            h={20}
                            w="auto"
                            fit="contain"
                            opacity={artist?.profile_id ? 1 : 0.4}
                          />
                          <Text c={artist?.profile_id ? undefined : 'dimmed'} size="xs">
                            {artist?.profile_id
                              ? 'Possui perfil pessoal no Mublin'
                              : 'Não possui perfil pessoal no Mublin'}
                          </Text>
                        </>
                      )}
                    </Group>
                  )}
                </>
              ) : (
                <Flex mt="lg" align="center" direction="column">
                  <Text size="lg" ta="center">
                    Artista não encontrado
                  </Text>
                  <Text size="xs" c="dimmed">
                    Verifique o endereço e tente novamente
                  </Text>
                </Flex>
              )}
            </>
          )}
        </Stack>

        {inspirated.length > 0 && (
          <>
            <Title order={2} fz="h5" fw={500} mt="md" mb="xs">
              Pessoas inspiradas por {artist?.name || '...'}
            </Title>

            <Group wrap="wrap">
              {loadingInspirated
                ? [1, 2].map((i) => (
                    <Skeleton key={i} circle height={40} width={40} radius="xl" />
                  ))
                : inspirated.map((item) => (
                    <Flex
                      key={item.id}
                      direction="column"
                      align="center"
                      gap={4}
                      w={80}
                      component={Link}
                      to={`/${item.profiles?.username}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Avatar
                        size={40}
                        radius="xl"
                        src={
                          item.profiles?.avatar
                            ? AVATAR_PATH + item.profiles?.avatar
                            : undefined
                        }
                        title={item.profiles?.full_name}
                      />
                      <Text size="xs" fw={500} ta="center" lineClamp={1} lh={1.2} w={80}>
                        {item.profiles?.full_name}
                      </Text>
                      <Text size="10px" c="dimmed" ta="center" lineClamp={1}>
                        {item.profiles?.username}
                      </Text>
                    </Flex>
                  ))}
            </Group>
          </>
        )}

        {gear.length > 0 && (
          <>
            <Title order={2} fz="h5" fw={500} mt="lg" mb="xs">
              Equipamentos relacionados a {artist?.name || '...'}
            </Title>

            <Group mb="xl" align="flex-start" wrap="wrap">
              {loadingArtistGear
                ? [1, 2].map((i) => (
                    <Skeleton key={i} circle height={40} width={40} radius="xl" />
                  ))
                : gear.map((item) => (
                    <Flex
                      key={item.id}
                      direction="column"
                      align="center"
                      gap={4}
                      w={80}
                      component={Link}
                      to={`/gear/${item.products?.slug}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Image
                        size={72}
                        radius="xl"
                        src={
                          item.products?.picture
                            ? PRODUCT_IMAGE_PATH + item.products?.picture
                            : undefined
                        }
                        title={item.products?.full_name}
                      />
                      <Text mt={4} size="xs" c="dimmed" ta="center" lh={1} lineClamp={1}>
                        {item.products?.brands?.name}
                      </Text>
                      <Text size="sm" fw={500} ta="center" lh={1} lineClamp={1} w={80}>
                        {item.products?.name}
                      </Text>
                      {item.gear_frequencies_of_use?.name_ptbr && (
                        <>
                          <Text mt={4} c="dimmed" size="9px" ta="center" lineClamp={1}>
                            Frequência de uso:
                          </Text>

                          <Text size="10px" ta="center" lh={1} lineClamp={1}>
                            {item.gear_frequencies_of_use?.name_ptbr}
                          </Text>
                        </>
                      )}
                    </Flex>
                  ))}
            </Group>
          </>
        )}
      </Container>
    </>
  )
}
