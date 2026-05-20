import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import {
  fetchBrandInfo,
  fetchBrandArtists,
  fetchBrandProducts,
  fetchBrandProductColors,
  getBrandOwners,
} from '../queries/gear'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  em,
  Affix,
  Loader,
  Container,
  Flex,
  Group,
  Skeleton,
  Title,
  Text,
  Card,
  Image,
  Anchor,
  Box,
  SimpleGrid,
  Avatar,
  Badge,
  Stack,
  Center,
  ColorSwatch,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconDiamond } from '@tabler/icons-react'

const PATH_PRODUCT_IMG =
  'https://ik.imagekit.io/mublin/products/tr:w-600,h-600,cm-pad_resize,bg-FFFFFF,fo-x/'
const PATH_COLOR_SAMPLE = 'https://ik.imagekit.io/mublin/products/colors/'

export default function Brand() {
  const { slug } = useParams()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  const { data: brand, isLoading: isLoadingBrand } = useQuery({
    queryKey: ['brand', slug],
    queryFn: () => fetchBrandInfo(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const { data: artists, isLoading: isLoadingArtists } = useQuery({
    queryKey: ['brandArtists', brand?.id],
    queryFn: () => fetchBrandArtists(brand.id),
    enabled: !!brand?.id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['brand-products', brand?.id],
    queryFn: () => fetchBrandProducts(brand.id),
    enabled: !!brand?.id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const { data: colors, isLoading: isLoadingColors } = useQuery({
    queryKey: ['brand-colors', brand?.id],
    queryFn: () => fetchBrandProductColors(brand.id),
    enabled: !!brand?.id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const { data: owners, isLoading: isLoadingOwners } = useQuery({
    queryKey: ['brand-owners', brand?.id],
    queryFn: () => getBrandOwners(brand.id),
    enabled: !!brand?.id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  if (isLoadingBrand) {
    return (
      <Container size="xl" py="sm">
        <Skeleton height={65} width={65} mb="xl" />
      </Container>
    )
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`${brand?.name} · Mublin`}</title>
        <link rel="canonical" href={`https://mublin.com/company/${brand?.slug}`} />
        <meta
          name="description"
          content={`Produtos e artistas da ${brand?.name} no Mublin`}
        />
        <meta
          property="og:image"
          content={`https://ik.imagekit.io/mublin/products/brands/tr:w-130,h-130,cm-pad_resize,bg-FFFFFF,fo-x/${brand?.logo}`}
        />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName={brand?.name} />
      </Affix>

      <Container size="xl" py="sm" px={{ base: 0, sm: 0 }} mt={{ base: 50, sm: 0 }}>
        {/* Hero Cover */}
        {brand?.cover ? (
          <Box
            style={{
              width: '100%',
              height: isMobile ? 80 : 100,
              overflow: 'hidden',
            }}
          >
            <Image
              src={`https://ik.imagekit.io/mublin/products/brands/tr:w-870,h-100,cm-extract,fo-auto/${brand?.cover}`}
              alt={`${brand?.name} cover`}
              mih={isMobile ? 80 : 100}
              w="100%"
              fit="cover"
            />
          </Box>
        ) : (
          <Box
            bg="transparent"
            style={{
              width: '100%',
              height: 70,
              overflow: 'hidden',
            }}
          />
        )}
        {/* Logo */}
        <Center
          mt={-60}
          mb="xs"
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            // boxShadow: brand?.cover ? '0 2px 12px rgba(0,0,0,0.18)' : undefined,
          }}
        >
          <Avatar
            src={
              brand?.logo
                ? `https://ik.imagekit.io/mublin/products/brands/tr:h-200,w-200,cm-pad_resize,bg-FFFFFF,fo-x/${brand?.logo}`
                : undefined
            }
            size={100}
            radius="xl"
          />
        </Center>
        <Flex direction="column" align="center">
          <Title order={1} fz="h2" visibleFrom="sm">
            {brand?.name}
          </Title>
          <Text size="xs" c="dimmed" ta="center">
            {brand?.brands_categories?.name_ptbr}
          </Text>
          {brand?.website && (
            <Center>
              <Anchor href={brand?.website} underline="hover" fz="xs" target="_blank">
                {brand?.website}
              </Anchor>
            </Center>
          )}
        </Flex>

        <Stack gap={10} mx={{ base: 'lg', sm: 0 }}>
          {/* Artists Section */}
          <Box mt="md">
            <Title order={2} fz="h5" fw={500} mb="xs">
              Artistas
            </Title>

            {isLoadingArtists ? (
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} height={64} radius="md" />
                ))}
              </SimpleGrid>
            ) : artists?.length > 0 ? (
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                {artists.map((item) => (
                  <Flex align="flex-start" key={item.id} gap="sm" wrap="nowrap">
                    <Avatar
                      src={
                        item.profiles?.avatar
                          ? `https://ik.imagekit.io/mublin/users/avatars/tr:w-90,h-90,cm-pad_resize,fo-face/${item.profiles.avatar}`
                          : undefined
                      }
                      size={45}
                      radius="xl"
                    />
                    <Stack gap={0}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {item.profiles?.full_name}
                      </Text>
                      <Badge
                        size="xs"
                        variant="filled"
                        color={item.type === 'Endorser' ? 'mublinColor.5' : 'mublinColor'}
                      >
                        {item.type === 'Endorser' && 'Endorsee'}
                        {item.type === 'Partner' && 'Parceiro'}
                      </Badge>
                    </Stack>
                  </Flex>
                ))}
              </SimpleGrid>
            ) : (
              <Text size="sm" c="dimmed">
                Nenhum artista cadastrado até o momento
              </Text>
            )}
          </Box>

          {/* Products Section */}
          <Box mt="md">
            <Title order={2} fz="h5" fw={500}>
              Itens
            </Title>
          </Box>
          {isLoadingProducts ? (
            <Center pt={30}>
              <Loader size="lg" color="primary" type="bars" opacity={0.5} />
            </Center>
          ) : (
            <ResponsiveMasonry
              columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 4 }}
              gutterBreakpoints={{ 350: '8px', 750: '8px', 900: '8px' }}
              style={{ marginTop: '6px' }}
            >
              <Masonry>
                {products?.map((item) => (
                  <Card
                    bg="white"
                    withBorder
                    className="mublinModule gearDetailCard"
                    px={10}
                    pb={10}
                    pt={0}
                    key={item.id}
                    w="100%"
                  >
                    <Card.Section>
                      <Center pt={20}>
                        <Link to={{ pathname: `/gear/${item.slug}` }}>
                          <Image
                            src={PATH_PRODUCT_IMG + item.picture}
                            h={150}
                            w="auto"
                            fit="contain"
                            alt={item.name}
                          />
                        </Link>
                      </Center>
                    </Card.Section>
                    {colors?.length > 0 && (
                      <Link to={{ pathname: `/gear/${item.slug}` }}>
                        <Group gap={5} mt={14}>
                          {colors
                            ?.find((x) => x.id === item.id)
                            ?.product_colors?.slice()
                            ?.sort((a, b) => b.is_main - a.is_main)
                            ?.map((colorItem, index) => (
                              <ColorSwatch
                                key={index}
                                color={
                                  colorItem.colors?.img_sample
                                    ? undefined
                                    : colorItem.colors?.rgb
                                }
                                title={colorItem.colors?.name}
                                className={
                                  colorItem.colors?.img_sample ? 'removeAlpha' : undefined
                                }
                                style={{
                                  backgroundSize: '28px 28px',
                                  backgroundImage: colorItem.colors?.img_sample
                                    ? `url(${PATH_COLOR_SAMPLE}${colorItem.colors.img_sample})`
                                    : undefined,
                                  width: '14px',
                                  minWidth: '14px',
                                  height: '14px',
                                  minHeight: '14px',
                                }}
                              />
                            ))}
                        </Group>
                      </Link>
                    )}
                    <Text size="13px" fw={500} mt="xs" c="dimmed">
                      {item.product_categories?.name_ptbr}
                    </Text>
                    <Text size="sm" fw={500} c="black">
                      {item.name}
                    </Text>
                    <Text size="xs" fw={500} c="dimmed">
                      {item.subtitle}
                    </Text>
                    <Flex gap={3} mt={4} align="center" justify="space-between">
                      <Group gap={2} align="center">
                        {item.product_series?.id > 0 && (
                          <Badge size="xs" color="gray" variant="light" radius="sm">
                            {item.product_series?.name}
                          </Badge>
                        )}
                        {!!item.is_rare && (
                          <Badge
                            size="xs"
                            variant="gradient"
                            gradient={{
                              from: 'mublinColor.9',
                              to: 'teal.8',
                              deg: 90,
                            }}
                            radius="sm"
                            leftSection={
                              <IconDiamond
                                style={{ width: '0.8rem', height: '0.8rem' }}
                              />
                            }
                          >
                            Raro ou Limitado
                          </Badge>
                        )}
                      </Group>
                      <Flex
                        opacity={0.6}
                        gap={3}
                        align="center"
                        title={`${item.totalOwners} pessoas possuem`}
                      >
                        <Text size="xs" className="lhNormal">
                          {item.totalOwners}
                        </Text>
                      </Flex>
                    </Flex>
                    <Flex justify="flex-end" mt={6}>
                      <Avatar.Group>
                        {owners
                          ?.filter((x) => x.products.id === item.id)
                          .map((profile) => (
                            <Link
                              key={profile.id}
                              to={{ pathname: `/${profile?.profiles?.username}` }}
                            >
                              <Avatar
                                size={35}
                                src={
                                  profile?.profiles?.avatar
                                    ? `https://ik.imagekit.io/mublin/tr:h-70,w-70,c-maintain_ratio/users/avatars/${profile?.profiles?.avatar}`
                                    : undefined
                                }
                                title={`${profile?.profiles?.full_name}`}
                              />
                            </Link>
                          ))}
                      </Avatar.Group>
                    </Flex>
                  </Card>
                ))}
              </Masonry>
            </ResponsiveMasonry>
          )}
        </Stack>
      </Container>
    </>
  )
}
