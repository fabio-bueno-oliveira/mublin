import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProductInfo, fetchProductOwners } from '../queries/gear'
import {
  Container,
  Card,
  Avatar,
  Title,
  Text,
  Skeleton,
  Group,
  Stack,
  SimpleGrid,
  Button,
  UnstyledButton,
  Scroller,
} from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { truncateDescription } from '../utils/formatter'

export default function GearItemPublic() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const {
    data: product,
    isLoading: isLoadingItemDetails,
    isError,
  } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductInfo(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })

  const { data: owners = [], isLoading: isLoadingOwners } = useQuery({
    queryKey: ['productOwners', product?.id],
    queryFn: () => fetchProductOwners(product?.id),
    enabled: !!product?.id,
    staleTime: 1000 * 60 * 5,
  })

  if (!isLoadingItemDetails && (isError || !product)) {
    return (
      <Container size="md" py="xl">
        <Text c="dimmed" ta="center">
          Item não encontrado.
        </Text>
      </Container>
    )
  }

  const PATH_PRODUCT_IMG =
    'https://ik.imagekit.io/mublin/products/tr:w-180,h-180,cm-pad_resize,bg-FFFFFF,fo-x/'

  const PATH_BRAND_IMG =
    'https://ik.imagekit.io/mublin/products/brands/tr:w-100,h-100,cm-pad_resize,bg-FFFFFF,fo-x/'

  const metaDescription = product
    ? truncateDescription(
        product.description ||
          `Confira ${product.name} no Mublin. Pessoas que utilizam, gigs e muito mais!`,
      )
    : ''

  const PATH_PRODUCT_OG_IMG =
    'https://ik.imagekit.io/mublin/products/tr:w-600,h-600,cm-pad_resize,bg-FFFFFF,fo-x/'

  const brandAndName = `${product.brands?.name} ${product.name}`

  const pageTitle = product ? [brandAndName, 'Mublin'].filter(Boolean).join(' | ') : ''

  const canonicalUrl = product
    ? `https://mublin.com/gear/${encodeURIComponent(product.slug)}`
    : ''

  const ogImage = product?.picture
    ? PATH_PRODUCT_OG_IMG + encodeURIComponent(product.picture)
    : 'https://mublin.com/og-default.png'

  return (
    <>
      {product && (
        <Helmet>
          <title>{pageTitle}</title>
          <meta name="description" content={metaDescription} />
          <link rel="canonical" href={canonicalUrl} />

          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Mublin" />
          <meta property="og:locale" content="pt_BR" />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:image" content={ogImage} />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={metaDescription} />
          <meta name="twitter:image" content={ogImage} />
        </Helmet>
      )}

      <Container px="lg" size="md" mt={{ base: 22, sm: 30 }}>
        <Group wrap="nowrap" px="xs">
          {isLoadingItemDetails ? (
            <Skeleton circle height={90} width={90} />
          ) : (
            <Avatar
              src={product?.picture ? PATH_PRODUCT_IMG + product.picture : null}
              size={90}
              alt={`Foto de ${product?.name}`}
              bg="white"
              styles={{
                image: {
                  objectFit: 'contain',
                  padding: 14,
                  backgroundColor: 'white',
                },
              }}
            />
          )}

          <Stack gap={0}>
            {isLoadingItemDetails ? (
              <>
                <Skeleton height={28} width={200} />
                <Skeleton height={16} width={120} mt={4} />
              </>
            ) : (
              <>
                {/* <Image
                  src={
                    product?.brands?.logo ? PATH_BRAND_IMG + product?.brands?.logo : null
                  }
                  w={50}
                  h={50}
                  radius="md"
                  alt={`Logo de ${product?.brands?.name}`}
                /> */}
                <Text size="md" c="dimmed" lh={1}>
                  {product?.brands?.name}
                </Text>
                <Title
                  order={1}
                  fz={{
                    base: 24,
                    sm: 30,
                  }}
                  fw={600}
                  lineClamp={1}
                >
                  {product?.name}
                </Title>
              </>
            )}
          </Stack>
        </Group>

        <Stack gap={6} mt="md">
          {isLoadingItemDetails ? (
            <Stack gap="xs" px="xs">
              <Skeleton height={10} width="40%" hiddenFrom="sm" />
              <Skeleton height={14} width="85%" />
              <Skeleton height={14} width="75%" />
            </Stack>
          ) : (
            <Stack gap={6} px="xs">
              {product?.description && (
                <Text size="sm" lineClamp={3}>
                  {product.description}
                </Text>
              )}
            </Stack>
          )}
        </Stack>

        {/* Perfis que possuem o item */}
        {(isLoadingOwners || owners.length > 0) && (
          <Stack gap="sm" mt="md" px="xs">
            <Text size="xs" fw={500} c="dimmed">
              Quem utiliza
            </Text>
            <Scroller>
              <Group wrap="nowrap" gap="xs" align="flex-start">
                {isLoadingOwners
                  ? [1, 2, 3].map((i) => (
                      <Stack key={i} gap={6} align="center" w={84}>
                        <Skeleton circle height={64} width={64} />
                        <Skeleton height={10} width={56} />
                      </Stack>
                    ))
                  : owners.map((owner) => (
                      <UnstyledButton
                        key={owner.id}
                        onClick={() => navigate(`/${owner.profiles?.username}`)}
                        aria-label={`Ver perfil de ${owner.profiles?.full_name}`}
                        w={80}
                      >
                        <Stack gap={3} align="center">
                          <Avatar
                            src={`https://ik.imagekit.io/mublin/users/avatars/tr:w-100,h-100/${owner.profiles.avatar}`}
                            size={50}
                            alt={`Foto de perfil de ${owner.profiles?.username}`}
                          />
                          <Text
                            w={79}
                            size="xs"
                            ta="center"
                            lineClamp={1}
                            title={owner.profiles?.full_name}
                          >
                            {owner.profiles?.full_name}
                          </Text>
                          {(owner.profiles?.cities?.name ||
                            owner.profiles?.regions?.uf) && (
                            <Text size="xs" c="dimmed" lh={1}>
                              {[owner.profiles.cities.name, owner.profiles.regions.uf]
                                .filter(Boolean)
                                .join('/')}
                            </Text>
                          )}
                        </Stack>
                      </UnstyledButton>
                    ))}
              </Group>
            </Scroller>
          </Stack>
        )}

        {/* CTA */}
        <Card mt={owners.length > 0 ? 20 : 36} px="lg" py="md">
          <SimpleGrid spacing="md" cols={{ base: 1, sm: 2, lg: 2 }}>
            <Stack gap={2}>
              <Text size="lg">
                Entre pra ver mais sobre <b>{product?.name}</b> no Mublin
              </Text>
              <Text size="sm" c="dimmed">
                Pessoas que usam esse item, gigs e muito mais
              </Text>
            </Stack>
            <Group gap="sm" mb="xs">
              <Button
                variant="outline"
                color="var(--mantine-color-text)"
                size="sm"
                radius="xl"
                onClick={() => navigate('/login')}
              >
                Entrar
              </Button>
              <Button
                size="sm"
                radius="xl"
                rightSection={<IconArrowRight size={14} />}
                onClick={() => navigate('/signup')}
              >
                Criar conta grátis
              </Button>
            </Group>
          </SimpleGrid>
        </Card>
      </Container>
    </>
  )
}
