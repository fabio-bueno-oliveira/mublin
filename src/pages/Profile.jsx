import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchBasicProfile } from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import {
  Container, Modal, Center,
  Avatar, Title, Text, Group, Flex, Stack,
  Skeleton, Alert, Badge, Scroller
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconMoodSad } from '@tabler/icons-react'
import styles from './Profile.module.scss'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
const AVATAR_PATH_LG = 'https://ik.imagekit.io/mublin/tr:h-600,c-maintain_ratio/users/avatars/'

export default function Profile() {
  const { username } = useParams()
  const { loading: authLoading } = useAuth()
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchBasicProfile(username),
    enabled: !!username && !authLoading,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const roles = profile?.profile_roles.sort((a, b) => b.main_activity - a.main_activity)

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
              onClick={openModal}
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
        </Stack>
      </Container>

      {/* Modal avatar expandido */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        withCloseButton={false}
        centered
        size="lg"
        overlayProps={{ backgroundOpacity: 0.7, blur: 4 }}
        classNames={{ content: styles.modalTransparent }}
      >
        <Center onClick={closeModal} style={{ cursor: 'pointer' }}>
          <Avatar
            w={240}
            h={240}
            src={profile.avatar ? AVATAR_PATH_LG + profile.avatar : undefined}
          />
        </Center>
      </Modal>
    </>
  )
}
