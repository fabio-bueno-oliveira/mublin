import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { fetchBrandInfo, fetchBrandArtists } from '../queries/gear'
import {
  Container, Skeleton, Title, Text, Image, Anchor, Box,
  SimpleGrid, Avatar, Group, Badge, Stack
} from '@mantine/core'

export default function Brand() {
  const { slug } = useParams()

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
        <meta charSet='utf-8' />
        <title>{`${brand?.name} · Mublin`}</title>
        <link rel='canonical' href={`https://mublin.com/company/${brand?.slug}`} />
        <meta name='description' content={`Produtos e artistas da ${brand?.name} no Mublin`} />
        <meta property="og:image" content={`https://ik.imagekit.io/mublin/products/brands/tr:w-130,h-130,cm-pad_resize,bg-FFFFFF,fo-x/${brand?.logo}`} />
      </Helmet>

      <Container size="xl" py="sm">
        {/* Hero Cover */}
        {brand?.cover && (
          <Box
            style={{
              width: '100%',
              height: 128,
              overflow: 'hidden',
            }}
          >
            <img
              src={`https://ik.imagekit.io/mublin/products/brands/tr:w-1200,h-128,cm-extract,fo-auto/${brand?.cover}`}
              alt={`${brand?.name} cover`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>
        )}
        {/* Logo flutuando sobre a cover */}
        <Box
          mt={brand?.cover ? -60 : 0}
          ml={brand?.cover ? 24 : 0}
          mb="xs"
          w={92}
          h={92}
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
            boxShadow: brand?.cover ? '0 2px 12px rgba(0,0,0,0.18)' : undefined
          }}
        >
          <Image
            src={brand?.logo
              ? `https://ik.imagekit.io/mublin/products/brands/tr:w-200,h-200,cm-pad_resize,bg-FFFFFF,fo-x/${brand.logo}`
              : undefined}
            h={92}
            w={92}
            fit="contain"
          />
        </Box>

        <Box mt="lg">
          <Title order={1} fz="h2" fw={700} lts="-0.02em">
            {brand?.name}
          </Title>
          <Anchor href={brand?.website} underline='hover' target='_blank' size="sm">
            {brand?.website}
          </Anchor>
          <Text size="sm" my="md">
            {brand?.description}
          </Text>
        </Box>

        {/* Artists Section */}
        <Box mt="lg">
          <Title order={2} fz="h4" fw={600} mb="xs">
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
                <Group key={item.id} gap="sm" wrap="nowrap">
                  <Avatar
                    src={item.profiles?.avatar
                      ? `https://ik.imagekit.io/mublin/users/avatars/tr:w-80,h-80,cm-pad_resize,fo-face/${item.profiles.avatar}`
                      : undefined}
                    size={42}
                    radius="xl"
                  />
                  <Stack gap={2}>
                    <Text size="sm" fw={500} lineClamp={1}>
                      {item.profiles?.full_name}
                    </Text>
                    <Badge
                      size="xs"
                      variant="filled"
                      fw="400"
                      color={item.type === 'Endorser' ? "violet.9" : 'grape'}
                    >
                      {item.type === 'Endorser' && "Endorsee"}
                      {item.type === 'Partner' && "Partner"}
                    </Badge>
                  </Stack>
                </Group>
              ))}
            </SimpleGrid>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhum artista cadastrado para esta marca.
            </Text>
          )}
        </Box>
      </Container>
    </>
  )
}
