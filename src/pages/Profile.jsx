import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchBasicProfile } from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import {
  Container, Grid, Avatar, Paper, Spoiler,
  Button, Title, Text, Group, Flex, Stack, ActionIcon,
  Skeleton, Alert, Badge, Scroller
} from '@mantine/core'
import { 
  IconMoodSad, IconRosetteDiscountCheckFilled, 
  IconMusic, IconDots, IconAlignJustified 
} from '@tabler/icons-react'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

// eslint-disable-next-line no-unused-vars
function SectionCard({ title, icon: Icon, action, children }) {
  return (
    <Paper p="lg" radius="md" withBorder h="100%">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Icon size={15} />
          <Text fw={700} size="sm">{title}</Text>
        </Group>
        {action && (
          <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
            <IconDots size={15} />
          </ActionIcon>
        )}
      </Group>
      {children}
    </Paper>
  )
}

export default function Profile() {
  const { username } = useParams()
  const { loading: authLoading, user } = useAuth()

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
      <Container size="xl" py="sm">
        <Group align="center" gap="md" mb="xl">
          <Avatar
            size={96}
            src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
          />
          <Stack gap={3}>
            <Flex align="center" gap={2} wrap="wrap">
              <Title order={1} size={20} lts='-0.02em' lh='1'>
                {profile.full_name}
              </Title>
              {!!profile.is_verified && 
                <IconRosetteDiscountCheckFilled 
                  className='iconVerified'
                  title='Usuário verificado'
                />
              }
            </Flex>
            <Flex align="center" gap={6} mt={3}>
              <Text size="sm" c='dimmed' fw='500'>
                @{profile.username}
              </Text>
              {user?.id === profile.id && (
                <Button size="compact-xs" variant="default">Editar meu perfil</Button>
              )}
            </Flex>
            {roles && roles.length > 0 && (
              <Scroller>
                <Group gap={4} wrap="nowrap">
                  {roles && roles.map(({ id, main_activity, roles: role }) => (
                    <Badge 
                      key={id} 
                      variant="light" 
                      fw='500' 
                      size="sm" 
                      color={'gray'}
                    >
                      {role.name_ptbr}
                    </Badge>
                  ))}
                </Group>
              </Scroller>
            )}
            {profile.title && (
              <Text size="xs" maw={420} lh={1.6} mt={4}>
                {profile.title}
              </Text>
            )}
          </Stack>
        </Group>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SectionCard title="Sobre" icon={IconAlignJustified} action>
              <Spoiler
                maxHeight={60}
                showLabel={<Text fz="sm">Ver mais</Text>}
                hideLabel={<Text fz="sm">Ver menos</Text>}
                fz="sm"
                pb="xs"
              >
                {profile.bio}
              </Spoiler>
            </SectionCard>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SectionCard title="Gigs sugeridas" icon={IconMusic} action>
              <Text>Lorem ipsum dolor</Text>
            </SectionCard>
          </Grid.Col>
        </Grid>
      </Container>
    </>
  )
}
