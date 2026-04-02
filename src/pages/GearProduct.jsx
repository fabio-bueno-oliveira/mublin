import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { fetchProductInfo, fetchProductColors, fetchProductOwners } from '../queries/gear'
import {
  Container, Grid, Box, Group, Flex, Stack, Center,
  Title, Text, Image, Anchor, Badge, ColorSwatch,
  ActionIcon, Skeleton, Modal, ScrollArea, Affix, Transition,
  Paper, Avatar, Divider
} from '@mantine/core'
import {
  IconZoom, IconX, IconDiamond, IconAlignJustified,
  IconUser, IconChevronUp
} from '@tabler/icons-react'

const PATH_BRAND_LOGO   = 'https://ik.imagekit.io/mublin/products/brands/tr:h-150,w-150,cm-pad_resize,bg-FFFFFF/'
const PATH_PRODUCT_IMG  = 'https://ik.imagekit.io/mublin/products/tr:w-600,h-600,cm-pad_resize,bg-FFFFFF,fo-x/'
const PATH_COLOR_SAMPLE = 'https://ik.imagekit.io/mublin/products/colors/'

export default function GearProduct() {
  const { slug } = useParams()
  const [modalZoomOpen, setModalZoomOpen] = useState(false)
  const [selectedColorId, setSelectedColorId] = useState(null)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductInfo(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })

  const { data: productColors = [] } = useQuery({
    queryKey: ['productColors', product?.id],
    queryFn: () => fetchProductColors(product.id),
    enabled: !!product?.id,
    staleTime: 1000 * 60 * 10,
    onSuccess: (data) => {
      const main = data.find(c => c.is_main) ?? data[0]
      if (main) setSelectedColorId(main.id)
    },
  })

  const { data: owners = [], isLoading: isLoadingOwners } = useQuery({
    queryKey: ['productOwners', product?.id],
    queryFn: () => fetchProductOwners(product.id),
    enabled: !!product?.id,
    staleTime: 1000 * 60 * 5,
  })

  const selectedColor = productColors.find(c => c.id === selectedColorId)
    ?? productColors.find(c => c.is_main)
    ?? productColors[0]
    ?? null

  const hasColors     = productColors.length > 0
  const activePicture = hasColors ? selectedColor?.picture : product?.picture
  const zoomSrc       = activePicture
    ? PATH_PRODUCT_IMG + activePicture
    : undefined

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
        <title>{`${product.name} | ${product.brands?.name} | Mublin`}</title>
        <link rel="canonical" href={`https://mublin.com/gear/${product.slug}`} />
        <meta name="description" content={product.description ?? `${product.brands?.name} ${product.name} no Mublin`} />
      </Helmet>

      <Container size="lg" mt={16} pb={60}>

        {/* Header: logo da marca + nome */}
        <Flex gap={14} align="center" mb={24}>
          <Anchor component={Link} to={`/brand/${product.brands?.slug}`}>
            <Image
              src={product.brands?.logo ? PATH_BRAND_LOGO + product.brands.logo : undefined}
              h={70}
              w={70}
              radius="md"
              fit="contain"
            />
          </Anchor>
          <Box>
            <Text size="sm" c="dimmed" lh={1.3}>
              {[
                product.product_categories?.name_ptbr,
                product.brands?.name,
                product.product_series?.name,
              ].filter(Boolean).join(' · ')}
            </Text>
            <Title order={1} fz="h3" fw={600} lts="-0.02em" lh={1.2}>
              {product.name}
            </Title>
            {product.subtitle && (
              <Text size="sm" c="dimmed">{product.subtitle}</Text>
            )}
            <Group gap={6} mt={4}>
              {product.is_rare && (
                <Group gap={4} align="center">
                  <IconDiamond size={14} color="var(--mantine-color-indigo-5)" />
                  <Text size="xs" c="indigo" fw={500}>Item raro ou limitado</Text>
                </Group>
              )}
              {product.is_discontinued && (
                <Text size="xs" c="dimmed">· Descontinuado pelo fabricante</Text>
              )}
            </Group>
          </Box>
        </Flex>

        <Grid gutter="xl">

          {/* Coluna esquerda: imagem + swatches */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Box pos="relative">
              <Center
                style={{
                  background: 'var(--mantine-color-default-border)',
                  borderRadius: 'var(--mantine-radius-md)',
                  overflow: 'hidden',
                  aspectRatio: '1 / 1',
                  cursor: activePicture ? 'zoom-in' : 'default',
                }}
                onClick={() => activePicture && setModalZoomOpen(true)}
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
                  size="lg"
                  radius="xl"
                  aria-label="Zoom"
                  pos="absolute"
                  bottom={10}
                  left={10}
                  onClick={() => setModalZoomOpen(true)}
                >
                  <IconZoom size={18} stroke={1.5} />
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
                  {productColors.map(item => (
                    <Flex key={item.id} direction="column" align="center" gap={2}>
                      <ColorSwatch
                        component="div"
                        color={item.colors?.img_sample ? 'transparent' : (item.colors?.rgb ?? '#ccc')}
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
                            outline: item.id === selectedColor?.id
                              ? '2px solid var(--mantine-color-indigo-6)'
                              : 'none',
                            outlineOffset: 2,
                          }
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
              <Title size="md" fw={600} mb={6}>Sobre</Title>
              {product.description ? (
                <Stack gap={4}>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {product.description}
                  </Text>
                  {product.description_source && (
                    <Text size="xs" c="dimmed">
                      Fonte: {product.description_source}
                    </Text>
                  )}
                  {product.description_source_url && (
                    <Anchor
                      href={product.description_source_url}
                      target="_blank"
                      underline="hover"
                      size="xs"
                      c="dimmed"
                    >
                      {product.description_source_url}
                    </Anchor>
                  )}
                </Stack>
              ) : (
                <Text size="sm" c="dimmed">Descrição não disponível</Text>
              )}
            </Box>

            {/* Quem utiliza */}
            <Box>
              <Title size="md" fw={600} mb={10}>
                Quem utiliza ({owners.length})
              </Title>
              {isLoadingOwners ? (
                <Stack gap={10}>
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} height={60} radius="md" />
                  ))}
                </Stack>
              ) : owners.length === 0 ? (
                <Text size="sm" c="dimmed">Ninguém por aqui ainda.</Text>
              ) : (
                <Stack gap={10}>
                  {owners.map(owner => (
                    <Paper
                      key={owner.id}
                      withBorder
                      radius="md"
                      p="sm"
                      style={{ backgroundColor: 'transparent' }}
                    >
                      <Flex gap={10} align="flex-start">

                        {/* Avatar clicável */}
                        <Anchor
                          component={Link}
                          to={`/${owner.profiles?.username}`}
                          style={{ flexShrink: 0 }}
                        >
                          <Avatar
                            src={owner.profiles?.avatar
                              ? `https://ik.imagekit.io/mublin/users/avatars/tr:w-80,h-80,fo-face/${owner.profiles.avatar}`
                              : undefined}
                            size={44}
                            radius="xl"
                          />
                        </Anchor>

                        <Box style={{ flex: 1, minWidth: 0 }}>
                          {/* Nome + localização */}
                          <Anchor
                            component={Link}
                            to={`/${owner.profiles?.username}`}
                            underline="never"
                            c="inherit"
                          >
                            <Text size="sm" fw={600} truncate>
                              {owner.profiles?.full_name}
                            </Text>
                          </Anchor>
                          {(owner.profiles?.cities?.name || owner.profiles?.regions?.uf) && (
                            <Text size="xs" c="dimmed" lh={1.3}>
                              {[owner.profiles.cities.name, owner.profiles.regions.uf]
                                .filter(Boolean)
                                .join(' / ')}
                            </Text>
                          )}

                          {/* Badges */}
                          <Group gap={6} mt={6}>
                            {owner.is_currently_using && (
                              <Badge size="xs" color="green" variant="light">
                                Em uso
                              </Badge>
                            )}
                            {owner.is_for_sale && (
                              <Badge size="xs" color="dark" variant="filled">
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
                            style={{ flexShrink: 0, border: '1px solid var(--mantine-color-default-border)' }}
                          />
                        )}
                      </Flex>

                      {/* Comentários do owner */}
                      {owner.owner_comments && (
                        <>
                          <Divider my="xs" />
                          <Text
                            size="sm"
                            c="dimmed"
                            style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}
                          >
                            {owner.owner_comments}
                          </Text>
                        </>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>

          </Grid.Col>
        </Grid>
      </Container>

      {/* Modal zoom */}
      <Modal
        centered
        fullScreen
        opened={modalZoomOpen}
        onClose={() => setModalZoomOpen(false)}
        title={
          <Box>
            <Text size="md" fw={500}>{product.brands?.name} · {product.name}</Text>
            {selectedColor?.colors && (
              <Text size="sm" c="dimmed">
                Cor: {selectedColor.colors.name_ptbr ?? selectedColor.colors.name}
              </Text>
            )}
          </Box>
        }
        withCloseButton
        closeButtonProps={{ icon: <IconX size={22} stroke={2} /> }}
      >
        <ScrollArea w="auto">
          <Flex justify="center" mb={34}>
            <Image
              w="auto"
              maw="100%"
              src={zoomSrc}
              fit="contain"
            />
          </Flex>
        </ScrollArea>
        <Affix position={{ bottom: 20, right: '48.5%' }}>
          <Transition transition="fade-up" mounted={modalZoomOpen}>
            {(styles) => (
              <ActionIcon
                style={styles}
                variant="default"
                size="xl"
                radius="xl"
                aria-label="Fechar zoom"
                onClick={() => setModalZoomOpen(false)}
              >
                <IconX size={18} stroke={1.5} />
              </ActionIcon>
            )}
          </Transition>
        </Affix>
      </Modal>
    </>
  )
}
