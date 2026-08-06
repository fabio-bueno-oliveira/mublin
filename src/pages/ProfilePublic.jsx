import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProfileBasicDetails } from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import {
  Container,
  Box,
  Avatar,
  Title,
  Text,
  Button,
  Group,
  Flex,
  Stack,
  Skeleton,
  Alert,
  Badge,
  SimpleGrid,
} from '@mantine/core'
import { IconArrowRight, IconMoodSad } from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function ProfilePublic() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchProfileBasicDetails(username),
    enabled: !!username && !authLoading && !session,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const rolesOrdered = profile?.roles
    ?.slice()
    ?.sort(
      (a, b) =>
        b.main_activity - a.main_activity ||
        Number(b.roles?.instrumentalist) - Number(a.roles?.instrumentalist),
    )

  if (authLoading) {
    return (
      <Container size="sm" py={48}>
        <Stack align="center" gap="md">
          <Skeleton circle height={96} />
          <Skeleton height={24} width={200} radius="xl" />
          <Skeleton height={16} width={120} radius="xl" />
        </Stack>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container size="sm" py={48}>
        <Stack align="center" gap="md">
          <Skeleton circle height={96} />
          <Skeleton height={24} width={200} radius="xl" />
          <Skeleton height={16} width={120} radius="xl" />
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
      <Container size="sm" pt={60}>
        <Stack gap="xl">
          <Group align="center" gap="md">
            <Avatar
              size={96}
              src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
            />
            <Stack gap={0}>
              <Badge
                size="md"
                color="var(--mantine-color-text)"
                variant="light"
                tt="lowercase"
                fw={300}
                mb={2}
              >
                @{profile.username}
              </Badge>
              <Flex align="center" gap="xs" wrap="wrap">
                <Title order={1} size="h2">
                  {profile.full_name}
                </Title>
              </Flex>
              {rolesOrdered && rolesOrdered.length > 0 && (
                <Text size="sm" c="dimmed">
                  {rolesOrdered
                    .map((role) => role?.roles?.description_ptbr)
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              )}
              {profile.title && (
                <Text size="sm" maw={420}>
                  {profile.title}
                </Text>
              )}
            </Stack>
          </Group>

          {/* CTA */}
          <Box
            p="lg"
            style={{
              borderRadius: 12,
              border: '1px solid var(--mantine-color-default-border)',
              background: 'var(--mantine-color-default)',
            }}
          >
            <SimpleGrid spacing="lg" cols={{ base: 1, sm: 2, lg: 2 }}>
              <Stack gap="xs">
                <Text size="lg">
                  Entre pra ver o perfil completo de <b>{profile.username}</b> no Mublin
                </Text>
                <Text size="sm" c="dimmed">
                  Projetos, gigs, equipamento e muito mais
                </Text>
              </Stack>
              <Group gap="sm">
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
          </Box>
        </Stack>
      </Container>
    </>
  )
}
