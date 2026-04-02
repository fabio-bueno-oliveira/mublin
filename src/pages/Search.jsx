import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchRandomBrands, fetchFeaturedProducts } from '../queries/gear'
import { searchProfiles, searchProjects, searchGear } from '../queries/search'
import {
  Grid, Box, NavLink, Flex, Container,
  Loader, Group, Space, Marquee, Center,
  Card, Scroller, Title, Text, Image, Avatar
} from '@mantine/core'
import {
  IconCircleArrowLeftFilled, IconCircleArrowRightFilled,
  IconRosetteDiscountCheckFilled
} from '@tabler/icons-react'

const PATH_USER_AVATAR = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
const PATH_PROJECT_AVATAR = 'https://ik.imagekit.io/mublin/projects/tr:h-200,w-200,c-maintain_ratio/'
const PATH_PRODUCT_IMAGE = 'https://ik.imagekit.io/mublin/products/tr:w-300,h-300,cm-pad_resize,bg-FFFFFF,fo-x/'

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

  const { data: projectResults = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['searched-projects', q],
    queryFn: () => searchProjects(q),
    enabled: !!q,
    staleTime: 1000 * 60 * 5,
  })

  const { data: gearResults = [], isLoading: loadingGear } = useQuery({
    queryKey: ['searched-gear', q],
    queryFn: () => searchGear(q),
    enabled: !!q,
    staleTime: 1000 * 60 * 5,
  })

  const locationLabel = (city, region) => {
    const parts = [city, region].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  return (
    <Container size="xl" py="sm">
      {q ? (
        <>
          <Title order={1} fz="h2" fw={700} lts="-0.02em" mb={{ base: 4, sm: 24 }}>
            {`Buscando por "${q}"`}
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
              <Title order={4} fw={400} fz="h5" mb="sm" c="dimmed">
                Resultados nesta página
              </Title>
              <NavLink
                href="#people"
                label={loadingProfiles ? 'Pessoas...' : `Pessoas (${profileResults.length})`}
                color="gray"
                variant="light"
                px={{ base: 0, sm: "xs" }}
                py={{ base: 0, sm: "xs" }}
              />
              <NavLink
                href="#projects"
                label={loadingProjects ? 'Projetos...' : `Projetos (${projectResults.length})`}
                color="gray"
                variant="light"
                px={{ base: 0, sm: "xs" }}
                py={{ base: 0, sm: "xs" }}
              />
              <NavLink
                href="#gear"
                label={loadingGear ? 'Equipamentos...' : `Equipamentos (${gearResults.length})`}
                color="gray"
                variant="light"
                px={{ base: 0, sm: "xs" }}
                py={{ base: 0, sm: "xs" }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6, lg: 9 }}>

              {/* Pessoas */}
              <Box id="people" mb="md">
                <Title order={4} fw={600} fz="h5" mb="sm">
                  Pessoas
                </Title>
                {loadingProfiles ? (
                  <Center mt="xl"><Loader size="sm" /></Center>
                ) : profileResults.length === 0 ? (
                  <Text c="dimmed">Nenhum resultado encontrado.</Text>
                ) : (
                  profileResults.map(profile => (
                    <Flex
                      key={profile.id}
                      component={Link}
                      to={`/${profile.username}`}
                      justify="flex-start"
                      mb="lg"
                      gap="md"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Avatar
                        src={profile.avatar ? PATH_USER_AVATAR + profile.avatar : undefined}
                        size={80}
                        radius="sm"
                      />
                      <Flex direction="column" justify="flex-start">
                        <Group gap={2}>
                          <Group gap={0}>
                            <Text size="sm" fw={600}>{profile.full_name}</Text>
                            {!!profile.is_verified &&
                              <IconRosetteDiscountCheckFilled
                                className="iconVerified"
                                title="Usuário verificado"
                              />
                            }
                          </Group>
                          <Text size="sm" fw={600} span c="dimmed" ml={3}>
                            @{profile.username}
                          </Text>
                        </Group>
                        {profile.title && (
                          <Text size="sm">{profile.title}</Text>
                        )}
                        {locationLabel(profile.city_name, profile.region_name) && (
                          <Text size="13px" opacity={0.7}>
                            {locationLabel(profile.city_name, profile.region_name)}
                          </Text>
                        )}
                        <Text size="11px" fw={400} opacity={0.4} mt={4}>
                          Ativo em {profile.total_active_projects} projeto{profile.total_active_projects !== 1 ? 's' : ''}
                        </Text>
                      </Flex>
                    </Flex>
                  ))
                )}
              </Box>

              {/* Projetos */}
              <Box id="projects" mb="md">
                <Title order={4} fw={600} fz="h5" mb="sm">
                  Projetos
                </Title>
                {loadingProjects ? (
                  <Center mt="xl"><Loader size="sm" /></Center>
                ) : projectResults.length === 0 ? (
                  <Text c="dimmed">Nenhum resultado encontrado.</Text>
                ) : (
                  projectResults.map(project => (
                    <Flex
                      key={project.id}
                      component={Link}
                      to={`/gear/${project.slug}`}
                      justify="flex-start"
                      mb="lg"
                      gap="md"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Avatar
                        src={project.picture ? PATH_PROJECT_AVATAR + project.picture : undefined}
                        size={80}
                        radius="sm"
                      />
                      <Flex direction="column" justify="flex-start">
                        <Text size="sm" fw={600}>{project.name}</Text>
                        <Text size="xs" opacity={0.8}>
                          {project.project_type_name}
                          {(project.project_type_name && project.main_genre_name) && ' • '}
                          {project.main_genre_name}
                        </Text>
                        {!!project.total_members && (
                          <Text size="xs" opacity={0.8}>
                            {project.total_members} integrantes
                          </Text>
                        )}
                        {!!project.related_member_username && (
                          <Text size="11px" opacity={0.4} mt={4}>
                            Integrante relacionado: {project.related_member_full_name}
                          </Text>
                        )}
                      </Flex>
                    </Flex>
                  ))
                )}
              </Box>

              {/* Equipamentos */}
              <Box id="gear">
                <Title order={4} fw={600} fz="h5" mb="sm">
                  Equipamentos
                </Title>
                {loadingGear ? (
                  <Center mt="xl"><Loader size="sm" /></Center>
                ) : gearResults.length === 0 ? (
                  <Text c="dimmed">Nenhum resultado encontrado.</Text>
                ) : (
                  gearResults.map(gear => (
                    <Flex
                      key={gear.id}
                      component={Link}
                      to={`/gear/${gear.slug}`}
                      justify="flex-start"
                      mb="lg"
                      gap="md"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Avatar
                        src={gear.picture ? PATH_PRODUCT_IMAGE + gear.picture : undefined}
                        size={80}
                        radius="sm"
                      />
                      <Flex direction="column" justify="flex-start">
                        <Text size="xs" opacity={0.8}>
                          {gear.brand_name}
                        </Text>
                        <Text size="sm" fw={600}>
                          {gear.name}
                        </Text>
                        {gear.subtitle && (
                          <Text size="sm" opacity={0.7}>{gear.subtitle}</Text>
                        )}
                        {gear.category_name_ptbr && (
                          <Text size="xs" opacity={0.5} mt={2}>{gear.category_name_ptbr}</Text>
                        )}
                        {gear.total_owners > 0 && (
                          <Text size="11px" opacity={0.4} mt={6}>
                            {gear.total_owners} usuário{gear.total_owners !== 1 ? 's' : ''} tem este equipamento
                          </Text>
                        )}
                      </Flex>
                    </Flex>
                  ))
                )}
              </Box>

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
