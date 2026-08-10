import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { fetchProfileDetails } from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  em,
  Grid,
  Affix,
  Alert,
  Anchor,
  Avatar,
  Container,
  Group,
  Skeleton,
  Stack,
  Flex,
  Text,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { getAvatarUrl } from '../utils/profile'
import {
  IconAlignLeft,
  IconArrowLeft,
  IconMoodSad,
  IconRosetteDiscountCheckFilled,
} from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function ProfileBio() {
  const { username } = useParams()
  const { loading: authLoading } = useAuth()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  useEffect(() => {
    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTo?.({ top: 0, left: 0, behavior: 'instant' })
      document.body.scrollTo?.({ top: 0, left: 0, behavior: 'instant' })
    }
    scrollTop()
    requestAnimationFrame(scrollTop)
  }, [username])

  const {
    data: profile,
    isLoading: isLoadingProfileInfo,
    isError,
  } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchProfileDetails(username),
    enabled: !!username && !authLoading,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  if (isLoadingProfileInfo) {
    return (
      <Container size="xl" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <Stack gap="md" py="xl">
          <Skeleton height={20} width={160} radius="xl" />
          <Skeleton height={14} radius="xl" />
          <Skeleton height={14} radius="xl" />
          <Skeleton height={14} width="70%" radius="xl" />
        </Stack>
      </Container>
    )
  }

  if (isError || !profile) {
    return (
      <Container size="sm" py={48}>
        <Alert
          icon={<IconMoodSad size={18} />}
          title="Perfil não encontrado"
          color="gray"
          radius="md"
        >
          O usuário <strong>@{username}</strong> não existe ou foi removido.
        </Alert>
      </Container>
    )
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`Sobre ${profile.full_name} · Mublin`}</title>
        <link rel="canonical" href={`https://mublin.com/${profile.username}/bio`} />
        <meta name="description" content={`Bio de ${profile.full_name} no Mublin`} />
        {profile.avatar && (
          <meta property="og:image" content={AVATAR_PATH + profile.avatar} />
        )}
      </Helmet>

      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%">
          <AppNavbarMobile pageName={`Sobre ${profile.username}`} profile={profile} />
        </Affix>
      )}

      <Container size="lg" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 6 }}>
        <Grid gap="xl">
          <Grid.Col span={{ base: 12, md: 2 }} mt="md" visibleFrom="sm">
            <Stack gap="md" mb="sm" mt="xs">
              <Link to={`/${profile.username}`}>
                <Avatar
                  size={120}
                  src={getAvatarUrl(profile.avatar, profile.is_open_to_work, 120)}
                />
              </Link>
              <Anchor
                component={Link}
                to={`/${profile.username}`}
                underline="never"
                size="sm"
                fw={500}
                c="var(--mantine-color-text)"
              >
                <Group gap={4} wrap="nowrap">
                  <IconArrowLeft size={15} />
                  Voltar ao perfil
                </Group>
              </Anchor>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 10 }} mt="md">
            <Container size="sm">
              <Stack gap="lg">
                <Flex align="center" gap={4} visibleFrom="sm">
                  <IconAlignLeft size={28} opacity={0.8} />
                  <Text size="lg" fw={500} lineClamp={1} truncate="end">
                    Sobre {profile.full_name}
                  </Text>
                  {!!profile.is_verified && (
                    <IconRosetteDiscountCheckFilled
                      className="iconVerified"
                      title="Perfil verificado"
                    />
                  )}
                </Flex>

                <Group gap="xs" wrap="nowrap" hiddenFrom="sm">
                  <Avatar
                    src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
                    size={40}
                    radius="xl"
                  />
                  <Stack gap={4}>
                    <Flex align="center" gap={4}>
                      <Text fw={600} size="md" lh={1.2}>
                        {profile.full_name}
                      </Text>
                      {!!profile.is_verified && (
                        <IconRosetteDiscountCheckFilled
                          className="iconVerified"
                          title="Perfil verificado"
                        />
                      )}
                    </Flex>
                    <Text size="sm" c="dimmed" lh={1.2}>
                      @{profile.username}
                    </Text>
                  </Stack>
                </Group>

                <Text fz="md" lh={1.6} style={{ whiteSpace: 'pre-line' }}>
                  {profile.bio || 'Este usuário ainda não escreveu uma bio.'}
                </Text>
              </Stack>
            </Container>
          </Grid.Col>
        </Grid>
      </Container>
    </>
  )
}
