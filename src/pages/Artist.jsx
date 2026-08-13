import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { notifications } from '@mantine/notifications'
import {
  checkArtistIsInspiration,
  fetchArtistDetails,
  fetchArtistRoles,
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
  Button,
  Title,
  Text,
  Group,
  Stack,
  Skeleton,
  Badge,
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
  IconPlus,
} from '@tabler/icons-react'

const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-200,w-200,c-maintain_ratio/'
const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-80,c-maintain_ratio/users/avatars/'
const PRODUCT_IMAGE_PATH =
  'https://ik.imagekit.io/mublin/products/tr:w-144,h-144,cm-pad_resize,bg-FFFFFF,fo-x/'

export default function Artist() {
  const { user } = useAuth()
  const { slug } = useParams()
  const { colorScheme } = useMantineColorScheme()
  const queryClient = useQueryClient()
  const [isUpdatingInspiration, setIsUpdatingInspiration] = useState(false)

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

  const { data: isInspiration = false } = useQuery({
    queryKey: ['check-inspiration', user?.id, artist?.id],
    queryFn: () => checkArtistIsInspiration(user.id, artist.id),
    enabled: !!user?.id && !!artist?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: roles = [], isLoading: loadingArtistRoles } = useQuery({
    queryKey: ['artist-roles', artist?.id],
    queryFn: () => fetchArtistRoles(artist?.id),
    enabled: !!artist?.id,
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

  async function handleAddInspiration() {
    setIsUpdatingInspiration(true)
    const { error } = await supabase.from('profile_inspirations').insert({
      profile_id: user.id,
      artist_id: artist?.id,
      order_show: null,
    })
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar inspiração. Tente novamente em instantes',
      })
    } else {
      await queryClient.refetchQueries({
        queryKey: ['check-inspiration', user.id, artist.id],
      })
      await queryClient.refetchQueries({ queryKey: ['artist-inspirated', artist.id] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: `${artist.name} adicionado como inspiração!`,
      })
    }
    setIsUpdatingInspiration(false)
  }

  async function handleRemoveInspiration() {
    setIsUpdatingInspiration(true)
    const { error } = await supabase
      .from('profile_inspirations')
      .delete()
      .eq('profile_id', user.id)
      .eq('artist_id', artist?.id)
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover inspiração. Tente novamente em instantes',
      })
    } else {
      await queryClient.refetchQueries({
        queryKey: ['check-inspiration', user.id, artist.id],
      })
      await queryClient.refetchQueries({ queryKey: ['artist-inspirated', artist.id] })
      notifications.show({
        color: 'yellow',
        position: 'top-center',
        message: `${artist.name} removido das suas inspirações`,
      })
    }
    setIsUpdatingInspiration(false)
  }

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
        <AppNavbarMobile pageName="Figura mainstream" />
      </Affix>

      <Container size="xl" py="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 62, sm: 0 }}>
        <Stack gap="xs" mb="xl">
          {loadingArtistInfo ? (
            <Center>
              <Skeleton radius="xl" height={100} width={100} />
            </Center>
          ) : (
            <>
              {isSuccess && artist ? (
                <>
                  <Text ta="center" c="dimmed" size="13px" mb={6} visibleFrom="sm">
                    Figura mainstream
                  </Text>
                  <Center pos="relative">
                    <Avatar
                      size={100}
                      radius="xl"
                      src={artist?.picture ? ARTISTS_PATH + artist.picture : undefined}
                      title={artist?.name}
                      alt={artist?.name}
                    />
                    {artist.artist_related_slug && (
                      <Flex
                        direction="column"
                        align="center"
                        w={100}
                        pos="absolute"
                        top={0}
                        left="64%"
                        gap={1}
                        component={Link}
                        to={`/artist/${artist.artist_related_slug}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Avatar
                          size={75}
                          radius="xl"
                          src={
                            artist?.related_artist?.picture
                              ? ARTISTS_PATH + artist?.related_artist?.picture
                              : undefined
                          }
                          title={artist?.related_artist?.name}
                          alt={artist?.related_artist?.name}
                        />
                        <Text ta="center" size="10px" c="dimmed">
                          Relacionado:
                        </Text>
                        <Title lh={1} ta="center" order={4} fz="h5">
                          {artist?.related_artist?.name}
                        </Title>
                      </Flex>
                    )}
                  </Center>
                  <Flex direction="column" align="center">
                    <Title order={1} fz="h2">
                      {artist?.name}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {[
                        artist?.genre?.name_ptbr || artist?.genre?.name,
                        artist?.genre_2?.name_ptbr || artist?.genre_2?.name,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                    {/* Bloco de Roles/Papéis do Artista */}
                    {loadingArtistRoles ? (
                      <Skeleton width={200} height={16} />
                    ) : (
                      roles &&
                      roles.length > 0 && (
                        <Group justify="center" gap="xs" mt="xs" wrap="wrap" w="75%">
                          {roles.map((item) => (
                            <Badge
                              key={item.id}
                              variant="outline"
                              color="gray"
                              size="sm"
                              radius="sm"
                            >
                              {item.roles?.description_ptbr}
                            </Badge>
                          ))}
                        </Group>
                      )
                    )}
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
                          href={`https://www.youtube.com/${artist.youtube_handle}`}
                          target="_blank"
                          title="Youtube"
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
                  <Center my="xs">
                    {isInspiration ? (
                      <Button
                        size="xs"
                        variant="outline"
                        color="mublinColor"
                        loading={isUpdatingInspiration}
                        onClick={handleRemoveInspiration}
                      >
                        Remover como inspiração em meu perfil
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        color="green"
                        leftSection={<IconPlus size={16} />}
                        loading={isUpdatingInspiration}
                        onClick={handleAddInspiration}
                      >
                        Adicionar como inspiração em meu perfil
                      </Button>
                    )}
                  </Center>
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
                            : `https://api.dicebear.com/10.x/initials/svg?seed=${item.profiles?.full_name}`
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
              Itens relacionados a {artist?.name || '...'}
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
                      w={100}
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
                      <Text
                        mt={4}
                        size="xs"
                        c="dimmed"
                        ta="center"
                        lh={1}
                        lineClamp={1}
                        title={item.products?.brands?.name}
                      >
                        {item.products?.brands?.name}
                      </Text>
                      <Text
                        size="sm"
                        fw={500}
                        ta="center"
                        lh={1}
                        lineClamp={1}
                        w={80}
                        title={item.products?.name}
                      >
                        {item.products?.name}
                      </Text>
                      {item.gear_frequencies_of_use?.name_ptbr && (
                        <Stack gap={1}>
                          <Text mt={4} c="dimmed" size="9px" ta="center">
                            Frequência de uso:
                          </Text>
                          <Text size="10px" ta="center" lh={1} lineClamp={1}>
                            {item.gear_frequencies_of_use?.name_ptbr}
                          </Text>
                        </Stack>
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
