import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { fetchRandomOtherProjects } from '../queries/projects'
import {
  Box, Container, Grid, Stack, Group, Text, Title,
  Avatar, Badge, Button, Divider, Flex,
  ScrollArea, Skeleton, Image
} from '@mantine/core'
import {
  IconChevronRight,
  IconHexagonPlus, IconClock, 
} from '@tabler/icons-react'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

// ── Mock data ────────────────────────────────────────────

const FEED_POSTS = [
  { id: 1, author: 'Banda Paralela', type: 'project', text: 'Acabamos de publicar nossa nova gig: precisamos de um tecladista para show em maio.', time: 'há 2h', initials: 'BP', color: '#3AC87A' },
  { id: 2, author: 'Carlos Mota', type: 'user', text: 'Acabei de atualizar meu setup de som. Novo console Allen & Heath SQ5 disponível para gigs!', time: 'há 4h', initials: 'CM', color: '#C83A3A' },
  { id: 3, author: 'Trio Acústico SP', type: 'project', text: 'Show confirmado no Bar Sagarana no dia 28/03. Ingressos disponíveis no link do perfil.', time: 'há 6h', initials: 'TA', color: '#C8853A' },
]

function ProjectSkeletons({ count = 10 }) {
  return Array.from({ length: count }).map((_, i) => (
    <Flex key={i} direction="column" align="center" gap={10}>
      <Skeleton radius="md" width={90} height={130} />
      <Skeleton radius="xl" width={50} height={10} />
    </Flex>
  ))
}

// ── Página principal ─────────────────────────────────────

export default function Home() {
  const { profile, user } = useAuth()

  const { data: savedProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-home-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: randomProjects = [], isLoading: loadingRandomProjects } = useQuery({
    queryKey: ['random-projects', user?.id],
    queryFn: () => fetchRandomOtherProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const userProjects = savedProjects.map((r) => ({
    id: r.projects.id,
    name: r.projects.name,
    slug: r.projects.slug,
    picture: r.projects.picture,
    status: r.status,
  }))

  const randomProjectsList = randomProjects.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    picture: r.picture,
  }))

  return (
    <>
      {/* {isMobile && // Logo + header para mobile
        <Text>Teste</Text>
      } */}
      <Flex gap="xs" align="flex-start" mb="lg" hiddenFrom="sm">
        <Avatar
          size={34}
          src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
          radius="xl"
          component={Link}
          to={`/${profile?.username}`}
        />
        <Button>Gigs</Button>
      </Flex>
      <Container size="xl" py="xs" px={0}>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <ScrollArea w="100%" type="never">
              <Flex gap={14}>
                <Flex direction="column" align="center" gap={10}>
                  <Avatar
                    w={90}
                    h={130}
                    color="gray"
                    radius="md"
                    variant="light"
                    component={Link}
                    to='/new/project'
                  >
                    <IconHexagonPlus size="1.5rem" color="gray" stroke={1.5} />
                  </Avatar>
                  <Text size="0.75rem" fw={480}>Novo projeto</Text>
                </Flex>

                {loadingProjects && <ProjectSkeletons />}

                {!loadingProjects && userProjects?.map(item => (
                  <Flex
                    key={item.id}
                    direction="column"
                    align="center"
                    gap={10}
                    component={Link}
                    to={`/project/${item.slug ?? item.id}`}
                    style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                  >
                    <Box style={{ position: 'relative', width: 90, height: 130, borderRadius: 8, overflow: 'hidden' }}>
                      <Image
                        w={90}
                        h={130}
                        fit="cover"
                        src={
                          item.picture
                            ? `https://ik.imagekit.io/mublin/projects/tr:h-260,w-180,c-maintain_ratio/${item.picture}`
                            : undefined
                        }
                        fallbackSrc="https://placehold.co/90x130?text=Sem+foto"
                        style={{ opacity: item.status === 1 ? 0.4 : 1, transition: 'opacity 0.2s' }}
                      />
                      {item.status === 1 && (
                        <Flex
                          align="center"
                          justify="center"
                          pos='absolute'
                          style={{
                            inset: 0,
                            background: 'rgba(0,0,0,0.18)',
                          }}
                        >
                          <IconClock size={24} color="white" stroke={1.5} />
                        </Flex>
                      )}
                    </Box>
                    <Text
                      ta="center"
                      w={65}
                      size="0.75rem"
                      fw={480}
                      truncate="end"
                      title={item.status === 1 ? `${item.name} (pendente de aprovação)` : item.name}
                      c={item.status === 1 ? 'dimmed' : 'inherit'}
                    >
                      {item.name}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </ScrollArea>
            <Box mt="xl">
              <Title order={2} fz="h3" ta="left" fw={700} lts="-0.02em" mb="lg">
                Gigs para você
              </Title>
              <Flex gap={18}>
                {loadingRandomProjects && <ProjectSkeletons />}

                {!loadingRandomProjects && randomProjectsList?.map(item => (
                  <Flex
                    key={item.id}
                    direction="column"
                    align="center"
                    gap={10}
                    component={Link}
                    to={`/project/${item.slug ?? item.id}`}
                    style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                  >
                    <Image
                      radius="md"
                      w={90}
                      h={90}
                      fit="cover"
                      src={
                        item.picture
                          ? `https://ik.imagekit.io/mublin/projects/tr:h-180,w-180,c-maintain_ratio/${item.picture}`
                          : undefined
                      }
                      fallbackSrc="https://placehold.co/90x130?text=Sem+foto"
                    />
                    <Text
                      w={65}
                      ta="center" 
                      size="0.75rem" 
                      fw={480} 
                      truncate="end"
                      title={item.name}
                    >
                      {item.name}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Box>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Title order={2} fz="h3" ta="left" fw={700} lts="-0.02em" mb="xs">
              Feed
            </Title>
            {FEED_POSTS.map((post, i) => (
              <Box key={post.id}>
                <Group gap="sm" align="flex-start" py="sm">
                  <Avatar
                    size={36}
                    radius="xl"
                    style={{ background: post.color, color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}
                  >
                    {post.initials}
                  </Avatar>
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Group gap="xs">
                      <Text size="sm" fw={700}>{post.author}</Text>
                      <Badge size="xs" variant="light" color={post.type === 'project' ? 'amber' : 'blue'}>
                        {post.type === 'project' ? 'Projeto' : 'Músico'}
                      </Badge>
                      <Text size="xs" c="dimmed" ml="auto">{post.time}</Text>
                    </Group>
                    <Text size="sm" c="dimmed" lh={1.5}>{post.text}</Text>
                  </Stack>
                </Group>
                {i < FEED_POSTS.length - 1 && <Divider />}
              </Box>
            ))}
            <Button variant="subtle" color="gray" size="xs" fullWidth mt="sm" rightSection={<IconChevronRight size={13} />}>
              Ver feed completo
            </Button>
          </Grid.Col>
        </Grid>
      </Container>
    </>
  )
}
