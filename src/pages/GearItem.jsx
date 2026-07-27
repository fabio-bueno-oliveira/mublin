import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import {
  fetchProductInfo,
  fetchProductColors,
  fetchProductOwners,
  fetchCheckFavoriteProduct,
  toggleFavoriteProduct,
} from '../queries/gear'
import {
  Container,
  Grid,
  Box,
  Group,
  Flex,
  Stack,
  Center,
  Button,
  Title,
  Text,
  Image,
  Anchor,
  Badge,
  ColorSwatch,
  ActionIcon,
  Skeleton,
  Affix,
  Paper,
  Avatar,
  em,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMediaQuery, useWindowScroll } from '@mantine/hooks'

import {
  IconZoom,
  IconX,
  IconDiamond,
  IconChevronUp,
  IconMessage,
  IconBookmark,
  IconBookmarkFilled,
  IconPlus,
} from '@tabler/icons-react'
import AppNavbarMobile from '../components/AppNavbarMobile'
import parse from 'html-react-parser'
import linkifyStr from 'linkify-string'

const PATH_BRAND_LOGO =
  'https://ik.imagekit.io/mublin/products/brands/tr:h-150,w-150,cm-pad_resize,bg-FFFFFF/'
const PATH_PRODUCT_IMG =
  'https://ik.imagekit.io/mublin/products/tr:w-600,h-600,cm-pad_resize,bg-FFFFFF,fo-x/'
const PATH_COLOR_SAMPLE = 'https://ik.imagekit.io/mublin/products/colors/'

export default function GearItem() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedColorId, setSelectedColorId] = useState(null)
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)
  const [, scrollTo] = useWindowScroll()

  useEffect(() => {
    scrollTo({ y: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductInfo(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })

  const { data: productColors = [] } = useQuery({
    queryKey: ['productColors', product?.id],
    queryFn: () => fetchProductColors(product?.id),
    enabled: !!product?.id,
    staleTime: 1000 * 60 * 10,
    onSuccess: (data) => {
      const main = data.find((c) => c.is_main) ?? data[0]
      if (main) {
        setSelectedColorId(main.id)
      }
    },
  })

  const { data: userGearItem, isLoading: loadingUserGearItem } = useQuery({
    queryKey: ['user-gear-item', user?.id, product?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_gear')
        .select('id')
        .eq('id_user', user.id)
        .eq('id_product', product.id)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }
      return data
    },
    enabled: !!user?.id && !!product?.id,
    staleTime: 1000 * 60 * 5,
  })

  const alreadyAdded = !!userGearItem

  const { data: owners = [], isLoading: isLoadingOwners } = useQuery({
    queryKey: ['productOwners', product?.id],
    queryFn: () => fetchProductOwners(product?.id),
    enabled: !!product?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: favoriteInfo, isLoading: loadingFavoriteInfo } = useQuery({
    queryKey: ['product-favorite-info', product?.id],
    queryFn: () => fetchCheckFavoriteProduct(product.id, user.id),
    enabled: !!product?.id && !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const selectedColor =
    productColors.find((c) => c.id === selectedColorId) ??
    productColors.find((c) => c.is_main) ??
    productColors[0] ??
    null

  const hasColors = productColors.length > 0
  const activePicture = hasColors ? selectedColor?.picture : product?.picture
  const zoomSrc = activePicture ? activePicture : undefined

  const { mutate: handleToggleFavorite, isPending: togglingFavorite } = useMutation({
    mutationFn: (currentlyFavorited) =>
      toggleFavoriteProduct(product.id, user.id, currentlyFavorited),

    onMutate: async (currentlyFavorited) => {
      const queryKey = ['product-favorite-info', product.id]

      await queryClient.cancelQueries({ queryKey })

      const previousFavoriteInfo = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, currentlyFavorited ? null : { id: 'optimistic' })

      return { previousFavoriteInfo }
    },

    onError: (error, _currentlyFavorited, context) => {
      queryClient.setQueryData(
        ['product-favorite-info', product.id],
        context?.previousFavoriteInfo,
      )
      notifications.show({
        title: 'Ops!',
        message: error.message || 'Não foi possível alterar o favorito',
        color: 'red',
      })
    },

    onSuccess: (_data, currentlyFavorited) => {
      notifications.show({
        title: currentlyFavorited ? 'Removido' : 'Adicionado',
        message: currentlyFavorited
          ? 'Produto removido dos seus favoritos'
          : 'Produto adicionado aos seus favoritos',
        color: 'green',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['product-favorite-info', product.id] })
      queryClient.invalidateQueries({ queryKey: ['user-favorite-products', user.id] })
    },
  })

  const { mutate: handleDeleteFromGear, isPending: deletingFromGear } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profile_gear')
        .delete()
        .eq('id_user', user.id)
        .eq('id_product', product.id)

      if (error) {
        throw new Error(error.message)
      }
    },

    onMutate: async () => {
      const queryKey = ['user-gear-item', user.id, product.id]

      await queryClient.cancelQueries({ queryKey })

      const previousUserGearItem = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, null)

      return { previousUserGearItem }
    },

    onError: (error, _variables, context) => {
      queryClient.setQueryData(
        ['user-gear-item', user.id, product.id],
        context?.previousUserGearItem,
      )
      notifications.show({
        title: 'Ops!',
        message: error.message || 'Não foi possível remover o item do seu equipamento',
        color: 'red',
      })
    },

    onSuccess: () => {
      notifications.show({
        title: 'Removido',
        message: 'Item removido do seu equipamento',
        color: 'green',
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-gear-item', user.id, product.id] })
      queryClient.invalidateQueries({ queryKey: ['productOwners', product.id] })
    },
  })

  if (isLoading) {
    return (
      <Container size="lg" mt={16}>
        <Flex gap={12} align="center" mb="xl">
          <Skeleton height={75} width={75} radius="md" />
          <Stack gap={6}>
            <Skeleton height={10} width={120} radius="md" />
            <Skeleton height={18} width={240} radius="md" />
          </Stack>
        </Flex>
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Skeleton height={300} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Skeleton height={12} width="80%" mb={8} radius="md" />
            <Skeleton height={12} width="60%" mb={8} radius="md" />
            <Skeleton height={12} width="70%" radius="md" />
          </Grid.Col>
        </Grid>
      </Container>
    )
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`${product?.name} | ${product?.brands?.name} | Mublin`}</title>
        <link rel="canonical" href={`https://mublin.com/gear/${product?.slug}`} />
        <meta
          name="description"
          content={
            product?.description ?? `${product?.brands?.name} ${product?.name} no Mublin`
          }
        />
      </Helmet>

      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%">
          <AppNavbarMobile pageName="Detalhes do item" />
        </Affix>
      )}

      <Container size="lg" mt={{ base: 60, sm: 16 }} pb={20}>
        {/* Header: logo da marca + nome */}
        <Flex gap={14} align="center" mb={14}>
          <Anchor component={Link} to={`/brand/${product?.brands?.slug}`}>
            <Image
              src={
                product?.brands?.logo ? PATH_BRAND_LOGO + product?.brands.logo : undefined
              }
              h={70}
              w={70}
              radius="md"
              fit="contain"
            />
          </Anchor>
          <Box>
            <Text size="sm" c="dimmed" lh={1.3}>
              {product?.product_categories?.name_ptbr}

              {product?.product_categories?.name_ptbr && product?.brands?.name && ' · '}

              {product?.brands?.name && (
                <Text
                  component={Link}
                  to={`/brand/${product?.brands?.slug}`}
                  style={{ display: 'inline', hover: { textDecoration: 'underline' } }}
                  c="dimmed"
                  inherit
                  className="brand-link"
                >
                  {product?.brands?.name}
                </Text>
              )}

              {product?.brands?.name && product?.product_series?.name && ' · '}

              {product?.product_series?.name}
            </Text>
            <Title order={1} fz="h3" fw={600} lh={1.2}>
              {product?.name}
            </Title>
            {product?.subtitle && (
              <Text size="sm" lh={1.2} opacity={0.8}>
                {product?.subtitle}
              </Text>
            )}
            {product?.is_rare && (
              <Group gap={4} align="center">
                <IconDiamond size={14} color="var(--mantine-color-indigo-5)" />
                <Text size="xs" c="indigo" fw={500}>
                  Item raro ou limitado
                </Text>
              </Group>
            )}
            {product?.is_discontinued && (
              <Badge color="gray" variant="outline" size="xs" opacity={0.6}>
                Descontinuado pelo fabricante
              </Badge>
            )}
          </Box>
        </Flex>

        <Group gap="xs" mb={14}>
          <ActionIcon
            size="md"
            variant="default"
            radius="md"
            onClick={() => handleToggleFavorite(!!favoriteInfo?.id)}
            loading={togglingFavorite}
            disabled={loadingFavoriteInfo}
            title={favoriteInfo?.id ? 'Remover dos salvos' : 'Salvar'}
          >
            {favoriteInfo?.id ? (
              <IconBookmarkFilled size={20} color="var(--mantine-color-red-6)" />
            ) : (
              <IconBookmark size={20} />
            )}
          </ActionIcon>
          <Button
            leftSection={alreadyAdded ? <IconX size={16} /> : <IconPlus size={16} />}
            variant="default"
            size="sm"
            radius="md"
            onClick={
              alreadyAdded
                ? () => handleDeleteFromGear()
                : () => navigate(`/new/gear?id=${product?.id}`)
            }
            loading={isLoading || loadingUserGearItem || deletingFromGear}
            disabled={isLoading || loadingUserGearItem || deletingFromGear}
          >
            {alreadyAdded ? 'Remover do meu equipamento' : 'Adicionar ao meu equipamento'}
          </Button>
        </Group>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Box pos="relative">
              <Center
                style={{
                  background: 'var(--mantine-color-default-border)',
                  borderRadius: 'var(--mantine-radius-md)',
                  overflow: 'hidden',
                  aspectRatio: '1 / 1',
                }}
              >
                <Image
                  src={activePicture ? PATH_PRODUCT_IMG + activePicture : undefined}
                  fit="contain"
                  h="100%"
                  w="100%"
                  style={{ pointerEvents: 'none' }}
                />
              </Center>
              {activePicture && (
                <ActionIcon
                  variant="default"
                  size="xl"
                  radius="xl"
                  aria-label="Zoom"
                  pos="absolute"
                  bottom={10}
                  left={10}
                  component={Link}
                  to={`zoom?src=${zoomSrc}`}
                >
                  <IconZoom size={22} stroke={1.5} />
                </ActionIcon>
              )}
            </Box>

            {/* Swatches de cor */}
            {hasColors && (
              <Box mt="sm">
                <Text size="xs" ta="center" c="dimmed" mb={6}>
                  {selectedColor?.colors?.name_ptbr ?? selectedColor?.colors?.name}
                </Text>
                <Flex justify="center" gap={8} wrap="wrap">
                  {productColors.map((item) => (
                    <Flex key={item.id} direction="column" align="center" gap={2}>
                      <ColorSwatch
                        component="div"
                        color={
                          item.colors?.img_sample
                            ? 'transparent'
                            : (item.colors?.rgb ?? '#ccc')
                        }
                        withShadow={false}
                        onClick={() => setSelectedColorId(item.id)}
                        title={item.colors?.name_ptbr ?? item.colors?.name}
                        styles={{
                          alphaOverlay: {
                            backgroundImage: item.colors?.img_sample
                              ? `url(${PATH_COLOR_SAMPLE + item.colors.img_sample})`
                              : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          },
                          root: {
                            cursor: 'pointer',
                            width: 28,
                            height: 28,
                            outline:
                              item.id === selectedColor?.id
                                ? '2px solid var(--mantine-color-indigo-6)'
                                : 'none',
                            outlineOffset: 2,
                          },
                        }}
                      />
                      {item.id === selectedColor?.id && (
                        <IconChevronUp style={{ width: 14, height: 14 }} />
                      )}
                    </Flex>
                  ))}
                </Flex>
              </Box>
            )}
          </Grid.Col>

          {/* Coluna direita: descrição + owners */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            {/* Descrição */}
            <Box mb={28}>
              <Title size="md" fw={600} mb={3}>
                Sobre
              </Title>
              {product?.description ? (
                <Stack gap={4}>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {product?.description}
                  </Text>
                  {product?.description_source && (
                    <Text size="xs" c="dimmed">
                      Fonte: {product?.description_source}
                    </Text>
                  )}
                  {product?.description_source_url && (
                    <Anchor
                      href={product?.description_source_url}
                      target="_blank"
                      underline="hover"
                      size="xs"
                      c="dimmed"
                    >
                      {product?.description_source_url}
                    </Anchor>
                  )}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">
                  Descrição não disponível
                </Text>
              )}
            </Box>

            {/* Quem utiliza */}
            <Box>
              <Title size="md" fw={600} mb={3}>
                Quem utiliza {owners.length > 0 ? `(${owners.length})` : null}
              </Title>
              {isLoadingOwners ? (
                <Stack gap={10}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={60} radius="md" />
                  ))}
                </Stack>
              ) : owners.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Ninguém por aqui ainda
                </Text>
              ) : (
                <Stack gap={10}>
                  {owners.map((owner) => (
                    <Box key={owner.id} radius="md" p="sm">
                      <Flex gap={10} align="center">
                        <Anchor
                          component={Link}
                          to={`/${owner.profiles?.username}`}
                          style={{ flexShrink: 0 }}
                        >
                          <Avatar
                            src={
                              owner.profiles?.avatar
                                ? `https://ik.imagekit.io/mublin/users/avatars/tr:w-80,h-80,fo-face/${owner.profiles.avatar}`
                                : undefined
                            }
                            size={44}
                            radius="xl"
                          />
                        </Anchor>

                        <Box style={{ flex: 1, minWidth: 0 }}>
                          {/* Nome + localização */}
                          <Anchor
                            component={Link}
                            to={`/${owner.profiles?.username}`}
                            underline="hover"
                            c="inherit"
                          >
                            <Text size="sm" fw={600} truncate>
                              {owner.profiles?.full_name}
                            </Text>
                          </Anchor>
                          {(owner.profiles?.cities?.name ||
                            owner.profiles?.regions?.uf) && (
                            <Text size="xs" c="dimmed" lh={1.3}>
                              {[owner.profiles.cities.name, owner.profiles.regions.uf]
                                .filter(Boolean)
                                .join(' / ')}
                            </Text>
                          )}

                          {/* Badges */}
                          <Group gap={6} mt={6}>
                            {owner.is_currently_using && (
                              <Badge size="sm" color="lime" variant="filled">
                                Em uso
                              </Badge>
                            )}
                            {owner.is_for_sale && (
                              <Badge size="sm" color="dark" variant="filled">
                                À venda
                              </Badge>
                            )}
                            {owner.is_for_sale && owner.price && (
                              <Text size="xs" fw={500}>
                                {Number(owner.price).toLocaleString('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                })}
                              </Text>
                            )}
                          </Group>
                        </Box>

                        {/* Foto própria do equipamento */}
                        {owner.photo && (
                          <Image
                            src={`https://ik.imagekit.io/mublin/users/gear/tr:w-80,h-80,cm-pad_resize,bg-FFFFFF,fo-x/${owner.photo}`}
                            w={56}
                            h={56}
                            radius="sm"
                            fit="contain"
                            style={{
                              flexShrink: 0,
                              border: '1px solid var(--mantine-color-default-border)',
                            }}
                          />
                        )}
                      </Flex>

                      {owner.owner_comments && (
                        <Paper p="xs" mt={8} w="100%">
                          <Group gap={6}>
                            <IconMessage size={16} color="gray" />
                            <Text
                              size="xs"
                              style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                            >
                              {parse(
                                linkifyStr(owner.owner_comments, { target: '_blank' }),
                              )}
                            </Text>
                          </Group>
                        </Paper>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
    </>
  )
}
