import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchUserFavoriteProfiles,
  removeFavoriteProfile,
  fetchUserFavoriteProducts,
  removeFavoriteProduct,
} from '../queries/user'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  Affix,
  Container,
  Card,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Avatar,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconBookmark } from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const USER_AVATAR_IMG_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
const GEAR_ITEM_IMG_PATH =
  'https://ik.imagekit.io/mublin/products/tr:w-200,h-200,cm-pad_resize,bg-FFFFFF,fo-x/'

export default function MySavedFavorites() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [loadingIds, setLoadingIds] = useState([])

  const { data: userFavoriteProfiles = [], isLoading: loadingUserFavoriteProfiles } =
    useQuery({
      queryKey: ['user-favorite-profiles', user?.id],
      queryFn: () => fetchUserFavoriteProfiles(user.id),
      enabled: !!user?.id,
      // staleTime: 1000 * 60 * 5,
    })

  const { data: userFavoriteProducts = [], isLoading: loadingUserFavoriteProducts } =
    useQuery({
      queryKey: ['user-favorite-products', user?.id],
      queryFn: () => fetchUserFavoriteProducts(user.id),
      enabled: !!user?.id,
      // staleTime: 1000 * 60 * 5,
    })

  const handleRemoveFavoriteProfile = async (profileId) => {
    const userId = user?.id
    if (!userId) {
      return
    }

    setLoadingIds((prev) => [...prev, profileId])

    try {
      const result = await removeFavoriteProfile(profileId, userId)

      if (result.removed) {
        await queryClient.invalidateQueries({
          queryKey: ['user-favorite-profiles', userId],
        })

        notifications.show({
          title: 'Removido',
          message: 'Perfil removido dos favoritos',
          color: 'green',
        })
      } else {
        notifications.show({
          title: 'Ops',
          message: 'Esse perfil já não estava nos favoritos',
          color: 'yellow',
        })
      }
    } catch (err) {
      console.error(err)
      notifications.show({
        title: 'Erro',
        message: err.message || 'Não foi possível remover o favorito',
        color: 'red',
      })
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== profileId))
    }
  }

  const handleRemoveFavoriteProduct = async (productId) => {
    const userId = user?.id
    if (!userId) {
      return
    }

    setLoadingIds((prev) => [...prev, productId])

    try {
      const result = await removeFavoriteProduct(productId, userId)

      if (result.removed) {
        await queryClient.invalidateQueries({
          queryKey: ['user-favorite-products', userId],
        })

        notifications.show({
          title: 'Removido',
          message: 'Produto removido dos favoritos',
          color: 'green',
        })
      } else {
        notifications.show({
          title: 'Ops',
          message: 'Esse produto já não estava nos favoritos',
          color: 'yellow',
        })
      }
    } catch (err) {
      console.error(err)
      notifications.show({
        title: 'Erro',
        message: err.message || 'Não foi possível remover o favorito',
        color: 'red',
      })
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== productId))
    }
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Salvos · Mublin</title>
        <link rel="canonical" href="https://mublin.com/saved" />
        <meta name="description" content="Salvos nos meus favoritos do Mublin" />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Itens salvos" />
      </Affix>

      <Container size="xl" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <Group gap="xs" mb={4} visibleFrom="sm">
          <IconBookmark size={32} />
          <Title order={1} fz="h3" ta="left" fw={600}>
            Itens salvos
          </Title>
        </Group>
        <Text size="sm" c="dimmed" mb="lg">
          Perfis e equipamentos que você salvou nos seus favoritos
        </Text>
        <Stack gap="xs">
          <Title order={4} fw={500}>
            Perfis
          </Title>
          {loadingUserFavoriteProfiles ? (
            <Text size="sm">Carregando perfis salvos...</Text>
          ) : userFavoriteProfiles.length > 0 ? (
            <Stack>
              {userFavoriteProfiles.map((favorite) => (
                <Card key={favorite.id} shadow="sm" p="sm" radius="md" withBorder>
                  <Group gap="xs" justify="space-between">
                    <Link to={`/${favorite.profile.username}`}>
                      <Avatar
                        size={50}
                        src={
                          favorite.profile.avatar
                            ? `${USER_AVATAR_IMG_PATH}/${favorite.profile.avatar}`
                            : null
                        }
                        radius="xl"
                      />
                    </Link>
                    <Stack gap={2} flex={1}>
                      <Text size="xs" c="dimmed">
                        @{favorite.profile.username}
                      </Text>
                      <Text size="md" fw={600} lh={1}>
                        {favorite.profile.full_name}
                      </Text>
                      <Text size="xs" lineClamp={2}>
                        {favorite.profile.title}
                      </Text>
                    </Stack>
                    <Button
                      size="xs"
                      color="red"
                      variant="filled"
                      loading={loadingIds.includes(favorite.profile.id)}
                      disabled={loadingIds.includes(favorite.profile.id)}
                      onClick={() => handleRemoveFavoriteProfile(favorite.profile.id)}
                    >
                      Remover
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhum perfil salvo
            </Text>
          )}

          <Title order={4} fw={500}>
            Equipamentos
          </Title>
          {loadingUserFavoriteProducts ? (
            <Text size="sm">Carregando itens salvos...</Text>
          ) : userFavoriteProducts.length > 0 ? (
            <Stack>
              {userFavoriteProducts.map((favorite) => (
                <Card key={favorite.id} shadow="sm" p="sm" radius="md" withBorder>
                  <Group gap="xs" justify="space-between">
                    <Link to={`/gear/${favorite.product.slug}`}>
                      <Avatar
                        size={50}
                        src={
                          favorite.product.picture
                            ? `${GEAR_ITEM_IMG_PATH}/${favorite.product.picture}`
                            : null
                        }
                        radius="xl"
                      />
                    </Link>
                    <Stack gap={2} flex={1}>
                      <Text size="md" fw={600} lh={1} lineClamp={2}>
                        {favorite.product.name}
                      </Text>
                      {favorite.product.description && (
                        <Text size="xs" lineClamp={2}>
                          {favorite.product.description}
                        </Text>
                      )}
                    </Stack>
                    <Button
                      size="xs"
                      color="red"
                      variant="filled"
                      loading={loadingIds.includes(favorite.product.id)}
                      disabled={loadingIds.includes(favorite.product.id)}
                      onClick={() => handleRemoveFavoriteProduct(favorite.product.id)}
                    >
                      Remover
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhum equipamento salvo
            </Text>
          )}
        </Stack>
      </Container>
    </>
  )
}
