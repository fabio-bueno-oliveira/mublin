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
  SimpleGrid,
  Skeleton,
  Alert,
  Badge,
  Modal,
  Center,
} from '@mantine/core'
import { IconArrowRight, IconMoodSad } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function ProfilePublic() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const [ctaOpened, { close: closeCta }] = useDisclosure(true)

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
      {/* Modal CTA - abre automaticamente igual Instagram */}
      <Modal
        opened={ctaOpened}
        onClose={closeCta}
        centered
        radius="lg"
        size="sm"
        withCloseButton
      >
        <Stack align="center" gap="md" pt="xs">
          <Center>
            <Avatar
              size={88}
              radius="xl"
              src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
              style={{ border: '3px solid var(--mantine-color-default-border)' }}
            />
          </Center>
          <Stack gap={4} align="center">
            <Text ta="center" size="lg" fw={300} lh={1.2}>
              Veja o perfil completo de{' '}
              <Text span fw={600}>
                {profile.username}
              </Text>
            </Text>
            <Text ta="center" size="sm" c="dimmed" mt={6} maw={300}>
              Entre para ver projetos, gigs, equipamento e muito mais no Mublin
            </Text>
          </Stack>

          <Stack w="100%" gap="xs" mt="xs">
            <Button
              size="sm"
              radius="xl"
              fullWidth
              rightSection={<IconArrowRight size={16} />}
              onClick={() => navigate('/signup')}
            >
              Criar conta grátis
            </Button>
            <Button
              variant="transparent"
              color="var(--mantine-color-text)"
              size="sm"
              radius="xl"
              fullWidth
              onClick={() => navigate('/login')}
            >
              Entrar
            </Button>
          </Stack>
        </Stack>
      </Modal>

      <Container size="sm" mt={60}>
        <Stack gap="md">
          <Group align="center" gap="md" wrap="nowrap">
            <Avatar
              radius="xl"
              size={100}
              src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
            />
            <Stack gap={0}>
              <Text size="sm" c="dimmed" tt="lowercase" fw={300}>
                @{profile.username}
              </Text>
              <Flex align="center" gap="xs" wrap="wrap">
                <Title order={1} size="h2">
                  {profile.full_name}
                </Title>
              </Flex>
              {rolesOrdered && rolesOrdered.length > 0 && (
                <Text size="xs" c="dimmed">
                  {rolesOrdered
                    .map((role) => role?.roles?.description_ptbr)
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              )}
            </Stack>
          </Group>

          {profile.title && <Text size="sm">{profile.title}</Text>}

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
                    src={`https://ik.imagekit.io/mublin/products/tr:w-80,h-80,fo-auto,b-10_FFFFFF:r-max/${item.products?.picture}`}
                    h={40}
                    w={40}
                    fit="contain"
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
            mt="lg"
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
