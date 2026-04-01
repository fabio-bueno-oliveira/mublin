import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchFeed, fetchUserLikedPosts, fetchRandomFeedPhrase,
  fetchLikesCountByPosts, toggleLike
} from '../queries/feed'
import { fetchUserProjects } from '../queries/user'
import { fetchRandomOtherProjects } from '../queries/projects'
import {
  Box, Container, Grid, Stack, Group, Anchor, Text, Title, Card,
  Avatar, Badge, Button, Flex, ActionIcon, Menu,
  ScrollArea, Skeleton, Image, Modal
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconCirclePlus, IconClock, IconRosetteDiscountCheckFilled, IconMessageCircle, 
  IconDots, IconMicrophone2, IconLink, IconHeart, IconHeartFilled, IconTrash
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
const PATH_PRODUCT_IMAGE = 'https://ik.imagekit.io/mublin/products/tr:w-64,h-64,cm-pad_resize,bg-FFFFFF/'

function ProjectSkeletons({ count = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <Flex key={i} direction="column" align="center" gap={10}>
      <Skeleton radius="md" width={90} height={130} />
      <Skeleton radius="xl" width={50} height={10} />
    </Flex>
  ))
}

function LinkedItem({ post }) {
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
  )

  return null
}

function getYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

function VideoPlayer({ url, title }) {
  const [expanded, setExpanded] = useState(false)
  const ytId = getYouTubeId(url)
  if (!ytId) return null

  return (
    <Box
      mt={4}
      style={{
        position: 'relative',
        paddingTop: '56.25%',
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
        cursor: expanded ? 'default' : 'pointer',
      }}
      onClick={() => !expanded && setExpanded(true)}
    >
      {expanded ? (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0, border: 'none' }}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title={title ?? 'Vídeo'}
        />
      ) : (
        <>
          <img
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            alt="Thumbnail do vídeo"
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />
          <Flex
            align="center"
            justify="center"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.25)',
              transition: 'background 0.2s',
            }}
          >
            <Box
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#000000">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </Box>
          </Flex>
        </>
      )}
    </Box>
  )
}

function LikeButton({ postId, userId, likedPostIds, likesCount }) {
  const queryClient = useQueryClient()
  const liked = likedPostIds.includes(postId)

  const { mutate, isPending } = useMutation({
    mutationFn: () => toggleLike({ postId, userId, liked }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['likedPosts', userId] })
      await queryClient.cancelQueries({ queryKey: ['likesCount'] })

      const previousLiked = queryClient.getQueryData(['likedPosts', userId])
      const previousCount = queryClient.getQueryData(
        queryClient.getQueryCache().findAll({ queryKey: ['likesCount'] })[0]?.queryKey
      )

      // Atualiza lista de posts curtidos
      queryClient.setQueryData(['likedPosts', userId], (old = []) =>
        liked ? old.filter(id => id !== postId) : [...old, postId]
      )

      // Atualiza o mapa de contagens
      const countKey = queryClient.getQueryCache()
        .findAll({ queryKey: ['likesCount'] })[0]?.queryKey
      if (countKey) {
        queryClient.setQueryData(countKey, (old = {}) => ({
          ...old,
          [postId]: Math.max(0, (old[postId] ?? 0) + (liked ? -1 : 1)),
        }))
      }

      return { previousLiked, previousCount, countKey }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLiked !== undefined) {
        queryClient.setQueryData(['likedPosts', userId], context.previousLiked)
      }
      if (context?.countKey && context?.previousCount !== undefined) {
        queryClient.setQueryData(context.countKey, context.previousCount)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['likedPosts', userId] })
      queryClient.invalidateQueries({ queryKey: ['likesCount'] })
    },
  })

  return (
    <Group gap={2} align="center">
      <ActionIcon
        variant="subtle"
        color="gray"
        size="md"
        radius="md"
        aria-label={liked ? 'Descurtir' : 'Curtir'}
        title={liked ? 'Descurtir' : 'Curtir'}
        loading={isPending}
        onClick={() => mutate()}
        style={{ cursor: isPending ? 'default' : 'pointer' }}
      >
        {liked
          ? <IconHeartFilled size={18} color="red" />
          : <IconHeart size={18} />
        }
      </ActionIcon>
      {likesCount > 0 && (
        <Text size="sm" lh={0}>{likesCount}</Text>
      )}
    </Group>
  )
}

// ── Página principal ─────────────────────────────────────

export default function Home() {
  const queryClient = useQueryClient()
  const { profile, user } = useAuth()

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
            <Title order={2} fz="h4" ta="left" fw={600} lts="-0.02em" mb="lg">
              Meus projetos
            </Title>
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
                    <IconCirclePlus size="1.5rem" color="gray" stroke={1.5} />
                  </Avatar>
                  <Text size="0.75rem" fw={480}>Novo Projeto</Text>
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
            <Flex 
              gap={10} 
              align="center" 
              mt={{ base: "lg", sm: 0 }} 
              mb={{ base: "lg", sm: "md" }} 
              mr="xs" 
              justify="space-between"
            >
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
                fz="16px"
                lh="0"
                w="100%"
                component={Link}
                to={`/new/post`}
              >
                {feedPhrase ?? 'Quais são as novidades?'}
              </Text>
            </Flex>
            {loadingFeed ? (
              <Text>Carregando postagens...</Text>
            ) : (
              <>
                <Card
                  shadow={{ base: 'none', sm: 'sm' }}
                  pl={{ base: 0, sm: 3 }}
                  pr={{ base: 0, sm: "lg" }}
                  pb="xs"
                  radius={{ base: 0, sm: 'md' }}
                  withBorder={false}
                  bg={{ base: 'transparent', sm: 'var(--mantine-color-body)' }}
                  mt="xs"
                >
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
                            <Flex gap={post.author_is_verified ? 2 : 6} align="center">
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
                              {!!post.author_is_verified && 
                                <IconRosetteDiscountCheckFilled 
                                  className='iconVerified'
                                  title='Usuário verificado'
                                />
                              }
                              {post.author_project_id &&
                                <Text span color="gray">
                                  Projeto
                                </Text>
                              }
                              <Text
                                c="dimmed"
                                size="sm"
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
                          <Text 
                            size="0.9em" fw="480" lh={1.5} 
                            opacity={0.85}
                            component={Link}
                            to={`/post/${post.id}`}
                            c="var(--mantine-color-text)"
                          >
                            {post.body}
                          </Text>
                          {/* Player de vídeo */}
                          {post.video_url && (
                            <VideoPlayer
                              url={post.video_url}
                              title={post.body?.slice(0, 60)}
                            />
                          )}
                          {post.linked_gig_id || post.linked_product_id && 
                            <LinkedItem post={post} />
                          }
                          <Group mt={4} ml={-4}>
                            <LikeButton
                              postId={post.id}
                              userId={user?.id}
                              likedPostIds={likedPostIds}
                              likesCount={likesCountMap[post.id] ?? 0}
                            />
                            {!post.comments_disabled && 
                              <ActionIcon
                                component={Link}
                                to={`/post/${post.id}`}
                                c="var(--mantine-color-text)"
                                variant="subtle"
                                color="gray"
                                size="md"
                                radius="md"
                                px={post.comments_count > 0 ? 23 : 12}
                              >
                                <Flex gap={6} align="center">
                                  <IconMessageCircle size={18} />
                                  {post.comments_count > 0 &&
                                    <Text size="sm" lh={0}>{post.comments_count}</Text>
                                  }
                                </Flex>
                              </ActionIcon>
                            }
                          </Group>
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
