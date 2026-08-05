import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProfileVisitors } from '../queries/user'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  Affix,
  Container,
  Card,
  Title,
  Text,
  Group,
  Stack,
  Avatar,
  Badge,
  ThemeIcon,
} from '@mantine/core'
import { IconEye, IconLock } from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const USER_AVATAR_IMG_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function ProfileVisitors() {
  const { user, profile } = useAuth()
  const isPro = profile?.plan === 'Pro'

  const { data: visitors = [], isLoading: loadingVisitors } = useQuery({
    queryKey: ['profile-visitors', user?.id],
    queryFn: () => fetchUserProfileVisitors(user.id),
    enabled: !!user?.id && isPro,
    staleTime: 1000 * 60 * 5,
  })

  const totalUniqueVisitors = visitors.length
  const totalViews = visitors.reduce(
    (sum, visitor) => sum + (visitor.total_views ?? 0),
    0,
  )

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Quem visualizou meu perfil · Mublin</title>
        <link rel="canonical" href="https://mublin.com/profile-visitors" />
        <meta name="description" content="Veja quem visualizou seu perfil no Mublin" />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Visualizações do perfil" />
      </Affix>

      <Container size="xl" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <Group gap="xs" mb={4} visibleFrom="sm">
          <IconEye size={32} />
          <Title order={1} fz="h3" ta="left" fw={600}>
            Quem viu seu perfil
          </Title>
        </Group>
        <Group gap="xs" mb="lg" align="center">
          <Text size="sm" c="dimmed">
            Pessoas que visualizaram seu perfil
          </Text>
          <Badge variant="light" color="gray" size="sm">
            Últimos 90 dias
          </Badge>
        </Group>

        {!isPro ? (
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Stack align="center" gap="sm" py="md">
              <ThemeIcon size={48} radius="xl" variant="light" color="dark">
                <IconLock size={24} />
              </ThemeIcon>
              <Text size="sm" fw={600} ta="center">
                Recurso exclusivo Mublin Pro
              </Text>
              <Text size="sm" c="dimmed" ta="center" maw={420}>
                Usuários Mublin Pro podem saber quem visualizou o perfil. Planos Pro serão
                disponibilizados para assinatura em breve.
              </Text>
            </Stack>
          </Card>
        ) : loadingVisitors ? (
          <Text size="sm">Carregando visualizações...</Text>
        ) : visitors.length > 0 ? (
          <Stack gap="md">
            <Text size="sm" fw={500}>
              {totalUniqueVisitors === 1
                ? '1 pessoa visualizou seu perfil'
                : `${totalUniqueVisitors} pessoas visualizaram seu perfil`}
              {totalViews > totalUniqueVisitors &&
                ` · ${totalViews} visualizações no total`}
            </Text>

            <Stack gap="xs">
              {visitors.map((visitor) => (
                <Card key={visitor.viewer_id} shadow="sm" p="sm" radius="md" withBorder>
                  <Group gap="xs" justify="space-between" wrap="nowrap">
                    <Link to={`/${visitor.username}`}>
                      <Avatar
                        size={50}
                        src={
                          visitor.avatar
                            ? `${USER_AVATAR_IMG_PATH}/${visitor.avatar}`
                            : null
                        }
                        radius="xl"
                      />
                    </Link>
                    <Stack gap={2} flex={1}>
                      <Text size="xs" c="dimmed">
                        @{visitor.username}
                      </Text>
                      <Text
                        component={Link}
                        to={`/${visitor.username}`}
                        size="md"
                        fw={600}
                        lh={1}
                        c="inherit"
                        style={{ textDecoration: 'none' }}
                      >
                        {visitor.full_name}
                      </Text>
                      {visitor.title && (
                        <Text size="xs" lineClamp={2}>
                          {visitor.title}
                        </Text>
                      )}
                    </Stack>
                    <Stack gap={2} align="flex-end">
                      <Text size="xs" c="dimmed" ta="right">
                        {dayjs(visitor.last_viewed_at).fromNow()}
                      </Text>
                      {visitor.total_views > 1 && (
                        <Badge variant="light" color="gray" size="xs">
                          {visitor.total_views}x
                        </Badge>
                      )}
                    </Stack>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            Ninguém visualizou seu perfil nos últimos 90 dias
          </Text>
        )}
      </Container>
    </>
  )
}
