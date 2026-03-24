import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchBasicProfile } from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import {
  Container, Box, Avatar, 
  Title, Text, Button, Group, Flex, Stack,
  Skeleton, Alert, Badge, Scroller
} from '@mantine/core'
import { IconMusic, IconArrowRight, IconMoodSad } from '@tabler/icons-react'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function ProfilePublic() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchBasicProfile(username),
    enabled: !!username && !authLoading && !session,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const roles = profile?.profile_roles?.sort((a, b) => b.main_activity - a.main_activity)

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
      <Container size="sm" py={48}>
        <Stack gap="xl">
          <Group align="center" gap="xl">
            <Avatar
              size={96}
              src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
            />
            <Stack gap={1}>
              <Flex align="center" gap={6} wrap="wrap">
                <Title order={1} size={24} letterSpacing='-0.02em'>
                  {profile.full_name}
                </Title>
                <Badge size="md" color="gray" c='dimmed' variant="light" tt='lowercase' fw='500'>
                  @{profile.username}
                </Badge>
              </Flex>
              {roles && roles.length > 0 && (
                <Scroller>
                  <Group gap={4} wrap="nowrap">
                    {roles && roles.map(({ id, main_activity, roles: role }) => (
                      <Badge key={id} variant="light" fw='500' size="sm" color={main_activity ? 'amber' : 'gray'}>
                        {role.name_ptbr}
                      </Badge>
                    ))}
                  </Group>
                </Scroller>
              )}
              {profile.bio && (
                <Text size="sm" maw={420} lh={1.6} mt={4}>
                  {profile.bio}
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
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              <Stack gap={2}>
                <Group gap={6}>
                  <IconMusic size={16} color="var(--mantine-color-amber-6)" />
                  <Text size="sm" fw={600}>Veja o perfil completo no Mublin</Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Projetos, gigs, setlists e muito mais.
                </Text>
              </Stack>
              <Group gap="sm">
                <Button
                  variant="subtle"
                  color="gray"
                  size="sm"
                  radius="xl"
                  onClick={() => navigate('/login')}
                >
                  Entrar
                </Button>
                <Button
                  color="amber"
                  size="sm"
                  radius="xl"
                  rightSection={<IconArrowRight size={14} />}
                  onClick={() => navigate('/signup')}
                >
                  Criar conta grátis
                </Button>
              </Group>
            </Group>
          </Box>

        </Stack>
      </Container>
    </>
  )
}
