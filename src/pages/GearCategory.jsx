import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import { fetchGearCategoryInfo, fetchGearCategoryItems } from '../queries/gear'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
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
  Badge,
  Stack,
  Center,
  Pagination,
} from '@mantine/core'
import { IconDiamond, IconBox } from '@tabler/icons-react'

const PATH_PRODUCT_IMG =
  'https://ik.imagekit.io/mublin/products/tr:w-600,h-600,cm-pad_resize,bg-FFFFFF,fo-x/'

const PAGE_SIZE = 24

export default function GearCategory() {
  const { slug } = useParams()
  const [activePage, setActivePage] = useState(1)
  const itemsSectionRef = useRef(null)

  // Sempre que a categoria mudar, volta pra primeira página
  useEffect(() => {
    setActivePage(1)
  }, [slug])

  function handlePageChange(page) {
    setActivePage(page)
    itemsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const { data: gearCategory, isLoading: isLoadingGearCategory } = useQuery({
    queryKey: ['gearCategory', slug],
    queryFn: () => fetchGearCategoryInfo(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const {
    data: gearCategoryItemsData,
    isLoading: isLoadingGearCategoryItems,
    isFetching: isFetchingGearCategoryItems,
  } = useQuery({
    queryKey: ['gearCategoryItems', gearCategory?.id, activePage],
    queryFn: () => fetchGearCategoryItems(gearCategory?.id, activePage, PAGE_SIZE),
    enabled: !!gearCategory?.id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    placeholderData: keepPreviousData,
  })

  const gearCategoryItems = gearCategoryItemsData?.items ?? []
  const totalItems = gearCategoryItemsData?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  if (isLoadingGearCategory) {
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
        <title>{`${gearCategory?.name_ptbr} · Mublin`}</title>
        <link
          rel="canonical"
          href={`https://mublin.com/gear/category/${gearCategory?.name_ptbr}`}
        />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName={gearCategory?.name_ptbr} />
      </Affix>

      <Container size="xl" py="sm" px={{ base: 0, sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <Group gap="xs" mb={4} visibleFrom="sm">
          <IconBox size={32} />
          <Title order={1} fz="h3" ta="left" fw={600}>
            {gearCategory?.name_ptbr}
          </Title>
        </Group>
        <Text size="sm" c="dimmed" mb="lg">
          Itens na categoria <i>{gearCategory?.name_ptbr}</i>
        </Text>

        {isLoadingGearCategoryItems ? (
          <Center pt={30}>
            <Loader size="lg" color="primary" type="bars" opacity={0.5} />
          </Center>
        ) : (
          <>
            <div
              style={{
                opacity: isFetchingGearCategoryItems ? 0.5 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
              <ResponsiveMasonry
                columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 4 }}
                gutterBreakpoints={{ 350: '8px', 750: '8px', 900: '8px' }}
                style={{ marginTop: '6px' }}
              >
                <Masonry>
                  {gearCategoryItems?.map((item) => (
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
                    </Card>
                  ))}
                </Masonry>
              </ResponsiveMasonry>
            </div>

            {totalPages > 1 && (
              <Center mt="lg" mb="md">
                <Pagination
                  total={totalPages}
                  value={activePage}
                  onChange={handlePageChange}
                  withEdges
                  siblings={1}
                />
              </Center>
            )}
          </>
        )}
      </Container>
    </>
  )
}
