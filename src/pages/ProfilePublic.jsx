import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProfileBasicDetails, fetchProfileGear } from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import {
  Container,
  Box,
  Image,
  Avatar,
  Title,
  Text,
  Button,
  Group,
  Flex,
  Paper,
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

  const { data: gear = [], isLoading: loadingGear } = useQuery({
    queryKey: ['user-gear', profile?.id],
    queryFn: () => fetchProfileGear(profile.id, 3),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

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

  if (authLoading || isLoading || loadingGear) {
    return (
      <Container size="sm" mt={60}>
        <Stack gap="xl">
          <Group align="center" gap="md">
            <Skeleton radius="xl" height={100} width={100} />
            <Stack gap={8}>
              <Skeleton height={16} width={120} radius="xl" />
              <Skeleton height={24} width={200} radius="xl" />
              <Skeleton height={14} width={120} radius="xl" />
            </Stack>
          </Group>
        </Stack>
      </Container>
    )
  }

  if (isError || !profile) {
    return (
      <Container size="sm" py={48}>
        <Alert
          icon={<IconMoodSad size={18} />}
          title="P />ão encontrado"
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
      <Container size="sm" mt={60}>
        <Stack gap="xl">
          <Group align="center" gap="md">
            <Avatar
              radius="xl"
              size={100}
              src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
            />
            <Stack gap={0}>
              <Badge
                size="md"
                color="var(--mantine-color-text)"
                c="gray"
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
              {profile.title && <Text size="sm">{profile.title}</Text>}
            </Stack>
          </Group>

          {gear.length >= 2 && (
            <Flex mx="sm" gap="xs" justify="flex-start" align="center" id="gear">
              {gear.map((item) => (
                <Flex
                  key={item.id_product}
                  direction="column"
                  justify="flex-start"
                  align="center"
                  w={60}
                >
                  <Image
                    src={`https://ik.imagekit.io/mublin/products/tr:w-80,h-80,cm-pad_resize,bg-FFFFFF,fo-x/${item.products?.picture}`}
                    h={40}
                    mah={40}
                    w="auto"
                    fit="inherit"
                    mb={8}
                    radius="xl"
                  />
                  <Text ta="center" size="11px" c="dimmed" fw={500} lineClamp={1}>
                    {item.products?.brands?.name}
                  </Text>
                  <Text
                    size="11px"
                    fw={500}
                    ta="center"
                    lineClamp={1}
                    style={{ whiteSpace: 'pre-wrap' }}
                    title={item.products?.name}
                  >
                    {item.products?.name}
                  </Text>
                </Flex>
              ))}
              <Paper withBorder p={8} w={64} ml={4} radius="lg">
                <Text size="11px" ta="center" lh={1.2} c="dimmed">
                  Entre para ver todos os itens
                </Text>
              </Paper>
            </Flex>
          )}

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
              <Group gap="sm" mb="xs">
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
