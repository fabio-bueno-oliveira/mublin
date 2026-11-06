import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchInstitutionDetails } from '../queries/locations'
import AppNavbarMobile from '../components/AppNavbarMobile'
import InstitutionAvatar from '../components/InstitutionAvatar'
import {
  Container,
  Center,
  Anchor,
  Title,
  Text,
  Stack,
  Skeleton,
  Avatar,
  Flex,
  Affix,
} from '@mantine/core'

const VENUES_PATH =
  'https://ik.imagekit.io/mublin/institutions/tr:h-200,w-200,c-maintain_ratio/'

export default function Venue() {
  const { slug } = useParams()

  useEffect(() => {
    scrollTo({ y: 0 })
  }, [])

  const {
    data: institution,
    isLoading: loadingInstitutionDetails,
    isSuccess,
  } = useQuery({
    queryKey: ['institution-details', slug],
    queryFn: () => fetchInstitutionDetails(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 4,
  })

  return (
    <>
      <title>{institution?.name ? `${institution.name} | Mublin` : 'Mublin'}</title>
      <link
        rel="canonical"
        href={`https://mublin.com/institution/${institution?.slug || ''}`}
      />
      <meta
        name="description"
        content={`Informações de '${institution?.name || ''}' no Mublin`}
      />

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Instituição de ensino" />
      </Affix>

      <Container size="sm" py="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 62, sm: 0 }}>
        <Stack gap="xs" mb="xl">
          {loadingInstitutionDetails ? (
            <Center>
              <Skeleton radius="xl" height={100} width={100} />
            </Center>
          ) : (
            <>
              {isSuccess && institution ? (
                <>
                  <Text ta="center" c="dimmed" size="13px" mb={6} visibleFrom="sm">
                    Instituição de ensino
                  </Text>
                  <Center pos="relative" mb={4}>
                    <InstitutionAvatar institution={institution} size={100} />
                  </Center>
                  <Flex justify="center">
                    <Stack align="center" gap={2}>
                      <Title order={1} fz="h2">
                        {institution?.name}
                      </Title>
                      <Text mt="sm" size="sm" c="dimmed">
                        {institution?.description}
                      </Text>
                      <Text size="sm">{institution?.address}</Text>
                      <Text size="sm" c="dimmed">
                        {institution?.cities?.name}, {institution?.cities?.regions?.name}{' '}
                        -{' '}
                        {institution?.cities?.countries?.name_ptbr
                          ? institution?.cities?.countries?.name_ptbr
                          : institution?.cities?.countries?.name}
                      </Text>
                      {institution?.instagram_handle && (
                        <Anchor
                          mt="md"
                          size="xs"
                          href={`https://instagram.com/${institution?.instagram_handle}`}
                          target="_blank"
                        >
                          https://instagram.com/{institution?.instagram_handle}
                        </Anchor>
                      )}
                      {institution?.website && (
                        <Anchor
                          mt="md"
                          size="xs"
                          href={institution.website}
                          target="_blank"
                        >
                          {institution.website}
                        </Anchor>
                      )}
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
