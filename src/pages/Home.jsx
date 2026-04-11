import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { 
  fetchFeed, fetchUserLikedPosts,
  fetchRandomFeedPhrase, fetchLikesCountByPosts
} from '../queries/feed'
import { fetchUserProjects } from '../queries/user'
import { fetchRandomOtherProjects } from '../queries/projects'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import {
  useMantineColorScheme, Box, Container, Grid, Stack, Group, Text, Title, Loader,
  Avatar, Badge, Button, Flex, ActionIcon, Menu,
  ScrollArea, Skeleton, Image, Modal, Divider,
  Paper
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayer from '../components/feed/VideoPlayer'
import LikeButton from '../components/feed/LikeButton'
import {
  IconClock, IconRosetteDiscountCheckFilled, IconMessageCircle, 
  IconDots, IconLink, IconTrash
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

function ProjectSkeletons({ count = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <Flex key={i} direction="column" align="center" gap={10}>
      <Skeleton radius="md" width={90} height={130} />
      <Skeleton radius="xl" width={50} height={10} />
    </Flex>
  ))
}

// ── Página principal ─────────────────────────────────────

export default function Home() {
  const { colorScheme } = useMantineColorScheme()
  const queryClient = useQueryClient()
  const { profile, user, loading } = useAuth()

  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [confirmDeletePostOpened, { open: openConfirmDeletePost, close: closeConfirmDeletePost }] = useDisclosure(false)

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
    queryKey: ['user-projects', user?.id],
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

  const feedPostIds = feedPosts.map(p => p.id)

  const { data: likedPostIds = [] } = useQuery({
    queryKey: ['likedPosts', user?.id],
    queryFn: () => fetchUserLikedPosts(user.id, feedPostIds),
    enabled: !!user?.id && feedPostIds.length > 0,
    staleTime: 1000 * 60 * 2,
  })

  const { data: likesCountMap = {} } = useQuery({
    queryKey: ['likesCount', feedPostIds],
    queryFn: () => fetchLikesCountByPosts(feedPostIds),
    enabled: feedPostIds.length > 0,
    staleTime: 1000 * 60 * 2,
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

  const { data: feedPhrase } = useQuery({
    queryKey: ['feed-phrase'],
    queryFn: fetchRandomFeedPhrase,
    staleTime: 1000 * 60 * 10, // muda a cada 10 min ou ao recarregar
  })

  async function handleDeletePost() {
    setIsDeletingPost(true)
    const { error } = await supabase
      .from('feed')
      .delete()
      .eq('id', postToDelete)
    if (error) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Erro ao apagar postagem.' })
    } else {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      notifications.show({ color: 'green', position: 'top-center', message: 'Postagem apagada!' })
      closeConfirmDeletePost()
    }
    setIsDeletingPost(false)
  }

  return (
    <>
      <Flex 
        gap="xs" 
        align="center" 
        justify="space-between"
        my="md" 
        hiddenFrom="sm"
        px={{ base: '0.8rem', sm: 0 }}
      >
        <Image 
          src={colorScheme === 'light' ? MublinLogoBlack : MublinLogoWhite} 
          h={26} 
          w="auto"
          fit="contain"
        />
        <Avatar
          size={34}
          src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
          radius="xl"
          component={Link}
          to={`/${profile?.username}`}
        />
      </Flex>
      <Container size="xl" py={0} px={0}>
        <Grid gutter="md">
          <Grid.Col 
            span={{ base: 12, md: 7 }}
            px={{ base: '1rem', sm: 0 }}
          >
            <Title order={2} fz="h4" ta="left" fw={600} lts="-0.02em" mb="lg">
              Meus projetos
            </Title>
            <ScrollArea w="100%" type="never">
              <Flex gap={14}>
                {/* <Flex direction="column" align="center" gap={10}>
                  <Avatar
                    w={90}
                    h={130}
                    color="gray"
                    radius="md"
                    variant="light"
                    component={Link}
                    to='/new/project'
                  >
                    <IconCirclePlus size="1.5rem" color="gray" stroke={1.5} />
                  </Avatar>
                  <Text size="0.75rem" fw={480}>Novo Projeto</Text>
                </Flex> */}

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
                            ? `https://ik.imagekit.io/mublin/projects/${item.id}/tr:h-260,w-180,c-maintain_ratio/${item.picture}`
                            : undefined
                        }
                        fallbackSrc="https://placehold.co/90x130?text=Sem+foto"
                        style={{ opacity: item.status === 1 ? 0.4 : 1, transition: 'opacity 0.2s' }}
                      />
                      {item.status === 1 && (
                        <Flex
                          align="center"
                          justify="center"
                          pos="absolute"
                          direction="column"
                          gap="xs"
                          inset={0}
                          bg="rgba(0,0,0,0.55)"
                        >
                          <IconClock size={24} color="white" stroke={1.5} />
                          <Badge size="xs" variant="outline" fw="400" color="white">
                            Pendente
                          </Badge>
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
              <Title order={2} fz="h4" ta="left" fw={600} lts="-0.02em" mb="lg">
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
            {loading ? (
              <Loader />
            ) : (
              <ScrollArea
                h={{ base: 'auto', md: 'calc(100vh - 120px)' }}
                scrollHideDelay={0}
              >
                {/* Caixa de novo post */}
                <Flex
                  gap={10}
                  align="center"
                  mt={{ base: 'lg', sm: 'xs' }}
                  mb="sm"
                  visibleFrom="sm"
                >
                  <Link to={`/${profile?.username}`}>
                    <Avatar
                      size={36}
                      radius="xl"
                      src={
                        profile?.avatar
                          ? `https://ik.imagekit.io/mublin/tr:h-76,w-76,r-max,c-maintain_ratio/users/avatars/${profile.avatar}`
                          : undefined
                      }
                      alt={profile?.username}
                    />
                  </Link>
                  <Text
                    c="dimmed" fz="15px" w="100%"
                    component={Link}
                    to="/new/post"
                  >
                    {feedPhrase ?? 'Quais são as novidades?'}
                  </Text>
                </Flex>

                {/* Feed */}
                {loadingFeed ? (
                  <Text size="sm" c="dimmed">Carregando postagens...</Text>
                ) : (
                  <Paper className="paperWrapper">
                    <Stack gap={0}>
                      {feedPosts.map((post, i) => (
                        <Box key={post.id}>
                          {i > 0 && <Divider />}
                          <Group gap="sm" align="flex-start" pt="md" pb="xs">
                            <Avatar
                              size={36}
                              radius="xl"
                              // style={{ border: '1px solid var(--mantine-color-gray-8)' }}
                              src={post.author_avatar ? AVATAR_PATH + post.author_avatar : undefined}
                              component={Link}
                              to={`/${post.author_username}`}
                              title={post.author_full_name}
                            />
                            <Stack gap={2} style={{ flex: 1 }}>
                              {/* Cabeçalho do post */}
                              <Group justify="space-between" align="flex-start">
                                <Flex 
                                  gap={post.author_is_verified ? 2 : 6} 
                                  align="center" wrap="wrap"
                                >
                                  <Text
                                    component={Link}
                                    to={`/${post.author_username}`}
                                    size="sm"
                                    fw={600}
                                    lh={1}
                                    c="var(--mantine-color-text)"
                                    className="link"
                                  >
                                    {post.author_username}
                                  </Text>
                                  {!!post.author_is_verified &&
                                    <IconRosetteDiscountCheckFilled
                                      className="iconVerified"
                                      title="Usuário verificado"
                                    />
                                  }
                                  {post.author_project_id &&
                                    <Text size="xs" c="dimmed">Projeto</Text>
                                  }
                                  <Text
                                    size="sm"
                                    c="dimmed"
                                    title={dayjs(post.created_at).format('dddd, D [de] MMMM [de] YYYY [às] HH:mm')}
                                    component={Link}
                                    to={`/post/${post.id}`}
                                    style={{ textDecoration: 'none' }}
                                    lh={1}
                                    ml={3}
                                  >
                                    {dayjs(post.created_at).fromNow()}
                                  </Text>
                                </Flex>
                                <Menu shadow="md" radius="md" position="bottom-end">
                                  <Menu.Target>
                                    <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
                                      <IconDots size={18} color="gray" />
                                    </ActionIcon>
                                  </Menu.Target>
                                  <Menu.Dropdown>
                                    <Menu.Item
                                      leftSection={<IconLink size={14} />}
                                      onClick={() => navigator.clipboard.writeText(
                                        `${window.location.origin}/post/${post.id}`
                                      )}
                                    >
                                      Copiar link
                                    </Menu.Item>
                                    {post.author_profile_id === user?.id && (
                                      <>
                                        <Menu.Divider />
                                        <Menu.Item
                                          color="red"
                                          leftSection={<IconTrash size={14} />}
                                          onClick={() => {
                                            setPostToDelete(post.id)
                                            openConfirmDeletePost()
                                          }}
                                        >
                                          Apagar postagem
                                        </Menu.Item>
                                      </>
                                    )}
                                  </Menu.Dropdown>
                                </Menu>
                              </Group>

                              {/* Corpo */}
                              <Text
                                size="0.9em"
                                fw={480}
                                lh={1.5}
                                opacity={0.85}
                                component={Link}
                                to={`/post/${post.id}`}
                                c="var(--mantine-color-text)"
                                style={{ textDecoration: 'none' }}
                              >
                                {post.body}
                              </Text>

                              {post.image && (
                                <Link to={`/post/${post.id}`}>
                                  <Image
                                    src={`https://ik.imagekit.io/mublin/posts/tr:w-700/${post.image}`}
                                    radius="md"
                                    mt={2}
                                  />
                                </Link>
                              )}

                              {post.video_url && (
                                <VideoPlayer url={post.video_url} title={post.body?.slice(0, 60)} />
                              )}

                              {(post.linked_gig_id || post.linked_product_id) &&
                                <LinkedItem post={post} />
                              }

                              {/* Ações */}
                              <Group gap={4} mt={6}>
                                <LikeButton
                                  postId={post.id}
                                  userId={user?.id}
                                  likedPostIds={likedPostIds}
                                  likesCount={likesCountMap[post.id] ?? 0}
                                />
                                {!post.comments_disabled && (
                                  <Button
                                    component={Link}
                                    to={`/post/${post.id}`}
                                    variant="subtle"
                                    color="gray"
                                    size="sm"
                                    radius="md"
                                    fw={400}
                                    px={10}
                                    leftSection={
                                      post.comments_count > 0 && <IconMessageCircle size={21} />
                                    }
                                  >
                                    {post.comments_count === 0 && <IconMessageCircle size={21} />} {post.comments_count > 0 ? post.comments_count : ''}
                                  </Button>
                                )}
                              </Group>
                            </Stack>
                          </Group>
                        </Box>
                      ))}
                    </Stack>

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
                  </Paper>
                )}
              </ScrollArea>
            )}
          </Grid.Col>
        </Grid>
      </Container>

      <Modal
        opened={confirmDeletePostOpened}
        onClose={closeConfirmDeletePost}
        withCloseButton={false}
        size="xs"
        radius="md"
        centered
      >
        <Text size="sm">
          Tem certeza que deseja apagar esta postagem? Esta ação não pode ser desfeita.
        </Text>
        <Group justify="flex-end" gap={8} mt="md">
          <Button variant="default" size="sm" onClick={closeConfirmDeletePost}>
            Cancelar
          </Button>
          <Button color="red" size="sm" loading={isDeletingPost} onClick={handleDeletePost}>
            Apagar
          </Button>
        </Group>
      </Modal>
    </>
  )
}
