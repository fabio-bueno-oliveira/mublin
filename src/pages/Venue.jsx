import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchVenueDetails } from '../queries/locations'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  Container,
  Anchor,
  Title,
  Text,
  Stack,
  Skeleton,
  Avatar,
  Center,
  Flex,
  Affix,
} from '@mantine/core'
import { IconBrandSpotify } from '@tabler/icons-react'

const VENUES_PATH =
  'https://ik.imagekit.io/mublin/venues/tr:h-200,w-200,c-maintain_ratio/'

export default function Venue() {
  const { user } = useAuth()
  const { slug } = useParams()

  useEffect(() => {
    scrollTo({ y: 0 })
  }, [])

  const {
    data: venue,
    isLoading: loadingVenueDetails,
    isSuccess,
  } = useQuery({
    queryKey: ['venue-details', slug],
    queryFn: () => fetchVenueDetails(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 4,
  })

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{venue?.name ? `${venue.name} · Mublin` : 'Mublin'}</title>
        <link rel="canonical" href={`https://mublin.com/venue/${venue?.slug || ''}`} />
        <meta
          name="description"
          content={`Informações de '${venue?.name || ''}' no Mublin`}
        />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Figura mainstream" />
      </Affix>

      <Container size="sm" py="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 62, sm: 0 }}>
        <Stack gap="xs" mb="xl">
          {loadingVenueDetails ? (
            <Center>
              <Skeleton radius="xl" height={100} width={100} />
            </Center>
          ) : (
            <>
              {isSuccess && venue ? (
                <>
                  <Text ta="center" c="dimmed" size="13px" mb={6} visibleFrom="sm">
                    Local ou Estabelecimento
                  </Text>
                  <Center pos="relative">
                    <Avatar
                      size={100}
                      radius="xl"
                      src={
                        venue?.picture_url ? VENUES_PATH + venue.picture_url : undefined
                      }
                      title={venue?.name}
                      alt={venue?.name}
                    />
                  </Center>
                  <Flex justify="center">
                    <Stack align="center" gap={2}>
                      <Title order={1} fz="h2">
                        {venue?.name}
                      </Title>
                      <Text size="xs" opacity={0.8}>
                        {venue?.venue_types.name} · Capacidade: {venue?.capacity} pessoas
                      </Text>
                      <Text mt="md" size="sm" c="dimmed" lineClamp={2}>
                        {venue?.description}
                      </Text>
                      <Text size="sm" mt="lg">
                        {venue?.address}, {venue?.address_number} - {venue?.neighborhood}
                      </Text>
                      <Text size="sm">
                        {venue?.cities.name},{' '}
                        {venue?.regions?.regions?.uf ?? venue?.regions?.regions?.name}
                      </Text>
                      <Anchor mt="md" size="xs" href={venue?.website_url} target="_blank">
                        {venue?.website_url}
                      </Anchor>
                    </Stack>
                  </Flex>
                </>
              ) : (
                <Flex mt="lg" align="center" direction="column">
                  <Text size="lg" ta="center">
                    Local ou estabelecimento não encontrado
                  </Text>
                  <Text size="xs" c="dimmed">
                    Verifique o endereço da página e tente novamente
                  </Text>
                </Flex>
              )}
            </>
          )}
        </Stack>
      </Container>
    </>
  )
}
