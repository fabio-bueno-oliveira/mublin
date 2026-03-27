import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { fetchFeed } from '../queries/feed'
import { fetchUserProjects } from '../queries/user'
import { fetchRandomOtherProjects } from '../queries/projects'
import {
  Box, Container, Grid, Stack, Group, Anchor, Text, Title, Card,
  Avatar, Badge, Button, Flex, ActionIcon, Menu,
  ScrollArea, Skeleton, Image, TextInput,
} from '@mantine/core'
import {
  IconHexagonPlus, IconClock, IconArrowRight,
  IconDots, IconMicrophone2, IconLink
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
const PATH_PRODUCT_IMAGE = 'https://ik.imagekit.io/mublin/products/tr:w-64,h-64,cm-pad_resize,bg-FFFFFF/'

// ── Mock data ────────────────────────────────────────────

function ProjectSkeletons({ count = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <Flex key={i} direction="column" align="center" gap={10}>
      <Skeleton radius="md" width={90} height={130} />
      <Skeleton radius="xl" width={50} height={10} />
    </Flex>
  ))
}

function LinkedItem({ post }) {
  console.log(post)
  if (post.linked_gig_id) return (
    <Card
      component={Link}
      to={`/gig/${post.slug}`}
      withBorder
      radius="md"
      p="xs"
      mt="xs"
      style={{ textDecoration: 'none' }}
    >
      <Group gap="xs">
        <Avatar size={32} radius="md" color="violet" variant="light">
          <IconMicrophone2 size={16} />
        </Avatar>
        <Stack gap={0}>
          <Text size="xs" c="dimmed" fw={500}>Gig vinculada</Text>
          <Text size="sm" fw={600} truncate="end">{post.title}</Text>
        </Stack>
        {post.has_remuneration && (
          <Badge size="xs" color="green" variant="light" ml="auto">
            Remunerada
          </Badge>
        )}
      </Group>
    </Card>
  )

  if (post.linked_product_id > 0) return (
    <>
    {console.log("product")}
    <Card
      component={Link}
      to={`/gear/${post.linked_product_slug}`}
      withBorder
      radius="md"
      p="xs"
      mt="xs"
      style={{ textDecoration: 'none' }}
    >
      <Group gap="xs">
        <Image
          src={post.linked_product_picture
            ? PATH_PRODUCT_IMAGE + post.linked_product_picture
            : undefined}
          w={32}
          h={32}
          radius="md"
          fit="contain"
        />
        <Stack gap={0}>
          <Text size="xs" c="dimmed" fw={500}>{post.linked_product_brand_name}</Text>
          <Text size="sm" fw={600}>{post.linked_product_name}</Text>
        </Stack>
      </Group>
    </Card>
    </>
  )

  return null
}

// ── Página principal ─────────────────────────────────────

export default function Home() {
  const { profile, user } = useAuth()

  const {
    data: feedData,
    isLoading: loadingFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 0 }) => fetchFeed(10, pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.flat().length : undefined,
    staleTime: 1000 * 60 * 2,
  })

  const feedPosts = feedData?.pages.flat() ?? []

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
            <Flex gap={14} align="center" mb='sm' mr="xs" justify="space-between">
              <Group>
                <Avatar
                  w={35}
                  h={35}
                  src={
                    profile?.avatar
                      ? `https://ik.imagekit.io/mublin/tr:h-76,w-76,r-max,c-maintain_ratio/users/avatars/${profile.avatar}`
                      : undefined
                  }
                  alt={profile?.username}
                  component={Link}
                  to={`/${profile?.username}`}
                />
              </Group>
              <Text 
                c="dimmed" 
                size="md" 
                lh="0" 
                w="100%" 
                component={Link}
                to={`/new/post`}
              >
                O que quer postar hoje?
              </Text>
              <ActionIcon 
                variant="subtle" color="gray" size="sm" radius="xl"
                component={Link}
                to={`/new/post`}
              >
                <IconArrowRight size={22} color="gray" />
              </ActionIcon>
            </Flex>
            {loadingFeed ? (
              <Text>Carregando postagens...</Text>
            ) : (
              <>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  {feedPosts.map(post => (
                    <Card.Section key={post.id} px="xs" withBorder>
                      <Group gap="sm" align="flex-start" pt="xs" pb="sm">
                        <Avatar 
                          size={36} 
                          radius="xl" 
                          src={post.author_avatar ? AVATAR_PATH + post.author_avatar : undefined}
                          component={Link}
                          to={`/${post.author_username}`}
                          title={post.author_full_name}
                        >
                          {post.author_full_name}
                        </Avatar>
                        <Stack gap={4} style={{ flex: 1 }}>
                          <Group gap="xs" justify="space-between" align="flex-start">
                            <Flex gap="xs" align="center">
                              <Anchor 
                                component={Link}
                                to={`/${post.author_username}`}
                                underline='hover'  
                                size="sm"
                                c="var(--mantine-color-text)"
                                fw="600"
                              >
                                {post.author_username}
                              </Anchor>
                              {post.author_project_id &&
                                <Text span color="gray">
                                  Projeto
                                </Text>
                              }
                              <Text 
                                c="dimmed"
                                size="xs"
                                lh="0" 
                                title={dayjs(post.created_at).format('DD/MM/YYYY HH:mm:ss')}
                                component={Link}
                                to={`/post/${post.id}`}
                              >
                                {dayjs(post.created_at).fromNow()}
                              </Text>
                            </Flex>
                            <Menu shadow="md" radius="md" position="bottom-end">
                              <Menu.Target>
                                <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
                                  <IconDots size={15} color="gray" />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<IconLink size={14} />}
                                  onClick={
                                    () => navigator.clipboard.writeText(
                                      `${window.location.origin}/post/${post.id}`
                                    )
                                  }
                                >
                                  Copiar link
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>
                          <Text size="0.9em" lh={1.5} opacity={0.8}>
                            {post.body}
                          </Text>
                          {post.linked_gig_id || post.linked_product_id && 
                            <LinkedItem post={post} />
                          }
                        </Stack>
                      </Group>
                    </Card.Section>
                  ))}
                </Card>
                {hasNextPage && (
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    fullWidth
                    mt="sm"
                    loading={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                  >
                    Carregar mais
                  </Button>
                )}
              </>
            )}
          </Grid.Col>
        </Grid>
      </Container>
    </>
  )
}
