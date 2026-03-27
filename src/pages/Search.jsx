import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchRandomBrands, fetchFeaturedProducts } from '../queries/gear'
import { searchProfiles } from '../queries/search'
import { 
  Grid, NavLink, Flex, Box,
  Container, Loader, Group, Space, Marquee, Center,
  Card, Scroller, Title, Text, Image, Avatar
} from '@mantine/core'
import {
  IconCircleArrowLeftFilled, IconCircleArrowRightFilled,
  IconRosetteDiscountCheckFilled
} from '@tabler/icons-react'

const PATH_PRODUCT_IMAGE = 'https://ik.imagekit.io/mublin/products/tr:w-300,h-300,cm-pad_resize,bg-FFFFFF,fo-x/'
const PATH_AVATAR = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function Search() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''

  const { data: featuredProducts = [], isLoading: loadingFeaturedProducts } = useQuery({
    queryKey: ['search-featured-products'],
    queryFn: fetchFeaturedProducts,
    staleTime: 1000 * 60 * 10,
  })

  const { data: randomBrands = [], isLoading: loadingRandomBrands } = useQuery({
    queryKey: ['random-brands'],
    queryFn: fetchRandomBrands,
    staleTime: 1000 * 60 * 30,
  })

  const { data: profileResults = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['searched-profiles', q],
    queryFn: () => searchProfiles(q),
    enabled: !!q,
    staleTime: 1000 * 60 * 5,
  })

  return (
    <Container size="xl" py="sm">
      {q ? (
        <>
          <Title order={1} fz="h2" fw={700} lts="-0.02em" mb={24}>
            {`Buscando por "${q}"`}
          </Title>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
              <Title order={4} fw={600} fz="h5" mb="sm">
                Resultados nesta página
              </Title>
              <NavLink
                href="#required-for-focus1"
                label={`Pessoas (${profileResults.length})`}
              />
              <NavLink
                href="#required-for-focus2"
                label="Projetos (0)"
              />
              <NavLink
                href="#required-for-focus3"
                label="Equipamentos (0)"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6, lg: 9 }}>
              <Title order={4} fw={600} fz="h5" mb="lg">
                Pessoas
              </Title>
              {loadingProfiles ? (
                <Center mt="xl">
                  <Loader size="sm" />
                </Center>
              ) : profileResults.length === 0 ? (
                <Text c="dimmed">Nenhum resultado encontrado.</Text>
              ) : (
                profileResults.map(profile => (
                  <Flex justify="flex-start" mb="lg" gap="md" key={profile.id}>
                    <Avatar
                      src={profile.avatar ? PATH_AVATAR + profile.avatar : undefined}
                      size={80}
                      radius="xl"
                    />
                    <Flex direction="column" justify="center">
                      <Group gap={3}>
                        <Group gap={0}>
                          <Text size="sm" fw={600}>
                            {profile.full_name} 
                          </Text>
                          {!!profile.is_verified && 
                            <IconRosetteDiscountCheckFilled 
                              className='iconVerified'
                              title='Usuário verificado'
                            />
                          }
                        </Group>
                        <Text size="sm" fw={600} span c="dimmed" ml={3}>
                          @{profile.username}
                        </Text>
                      </Group>
                      <Text size="sm">
                        {profile.title}
                      </Text>
                      <Text size="13px" opacity={0.7}>
                        {profile.city_name ?? ''}, {profile.region_name ?? ''}
                      </Text>
                      <Text size="11px" fw={400} opacity={0.7} mt={6}>
                        {profile.total_active_projects} projetos
                      </Text>
                    </Flex>
                  </Flex>
                ))
              )}
            </Grid.Col>
          </Grid>
        </>
      ) : (
        <>
          <Title order={1} fz="h2" ta="left" fw={700} lts="-0.02em" mb="sm">
            Explorar
          </Title>
          <Space h="md" />
          <Title order={3} fz="h4" ta="left" fw={700} lts="-0.02em" mb="sm" opacity={0.8}>
            Equipamentos em destaque
          </Title>
          <Scroller
            mb="lg"
            startControlIcon={<IconCircleArrowLeftFilled size={36} />}
            endControlIcon={<IconCircleArrowRightFilled size={36} />}
          >
            <Group gap="lg" wrap="nowrap" miw={1200}>
              {loadingFeaturedProducts ? (
                <Center w="100%"><Loader size="sm" /></Center>
              ) : (
                featuredProducts.map(item => (
                  <Card
                    key={item.id}
                    component={Link}
                    to={`/item/${item.slug}`}
                    shadow="sm"
                    padding="sm"
                    radius="md"
                    withBorder
                    w={180}
                  >
                    <Card.Section style={{ pointerEvents: 'none' }}>
                      <Image
                        src={item.picture ? PATH_PRODUCT_IMAGE + item.picture : undefined}
                        height={180}
                        alt={item.name}
                      />
                    </Card.Section>
                    <Text size="sm" fw={500} mt="sm" truncate="end">
                      {item.brand_name} {item.name}
                    </Text>
                  </Card>
                ))
              )}
            </Group>
          </Scroller>

          <Title order={3} fz="h4" ta="left" fw={700} lts="-0.02em" mb="sm" opacity={0.8}>
            Marcas em destaque
          </Title>
          {loadingRandomBrands ? (
            <Center><Loader size="sm" /></Center>
          ) : (
            <Marquee duration={48000} gap="xs">
              {randomBrands.map(brand => (
                <Link key={brand.id} to={`/brand/${brand.slug}`}>
                  <Image
                    src={brand.logo ? `https://ik.imagekit.io/mublin/products/brands/tr:w-130,h-130,cm-pad_resize,bg-FFFFFF,fo-x/${brand.logo}` : undefined}
                    h={65}
                    w="auto"
                    fit="contain"
                  />
                </Link>
              ))}
            </Marquee>
          )}
        </>
      )}
    </Container>
  )
}
