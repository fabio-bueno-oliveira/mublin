import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchFeed,
  fetchUserLikedPosts,
  fetchLikesCountByPosts,
  deletePost,
} from '../queries/feed'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import {
  useMantineColorScheme,
  ScrollArea,
  Flex,
  Group,
  Stack,
  Center,
  Box,
  ActionIcon,
  Card,
  Paper,
  Text,
  Button,
  Image,
  Avatar,
  Menu,
  Loader,
  Modal,
  Title,
  Anchor,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import {
  IconRosetteDiscountCheckFilled,
  IconMessageCircle,
  IconDots,
  IconLink,
  IconTrash,
} from '@tabler/icons-react'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayer from '../components/feed/VideoPlayer'
import LikeButton from '../components/feed/LikeButton'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

export default function Projects() {
  const { colorScheme } = useMantineColorScheme()
  const queryClient = useQueryClient()
  const { profile, user, loading } = useAuth()
  const [feedType, setFeedType] = useState('explore')

  const {
    data: feedData,
    error: error,
    isLoading: loadingFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed', feedType, user?.id],
    queryFn: ({ pageParam = 0 }) =>
      fetchFeed(10, pageParam, feedType === 'following' ? user?.id : null),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 10 ? allPages.flat().length : undefined,
    staleTime: 1000 * 60 * 2,
    retry: 1,
    // refetchInterval: 1000 * 60 * 10,
    // refetchIntervalInBackground: false,
  })

  useEffect(() => {
    if (error) {
      notifications.show({
        title: 'Erro ao carregar feed',
        message: 'Não conseguimos atualizar as postagens. Tente novamente em instantes.',
        color: 'red',
        position: 'top-center',
      })
    }
  }, [error])

  const feedPosts = feedData?.pages.flat() ?? []
  const feedPostIds = feedPosts.map((p) => p.id)

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

  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [
    confirmDeletePostOpened,
    { open: openConfirmDeletePost, close: closeConfirmDeletePost },
  ] = useDisclosure(false)

  async function handleDeletePost() {
    setIsDeletingPost(true)
    try {
      await deletePost(postToDelete)
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Postagem apagada!',
      })
      closeConfirmDeletePost()
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao apagar postagem.',
      })
    } finally {
      setIsDeletingPost(false)
    }
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
        <Button.Group>
          <Button
            size="sm"
            variant={feedType === 'explore' ? 'filled' : 'subtle'}
            onClick={() => setFeedType('explore')}
          >
            Explorar
          </Button>
          <Button
            size="sm"
            variant={feedType === 'following' ? 'filled' : 'subtle'}
            onClick={() => setFeedType('following')}
          >
            Seguindo
          </Button>
        </Button.Group>
      </Flex>
      {loading ? (
        <Center my={40}>
          <Loader />
        </Center>
      ) : (
        <>
          <Group
            align="center"
            justify="space-between"
            mb="xs"
            className="paddingX"
            visibleFrom="sm"
          >
            <Title order={2} fz="h3" fw={600}>
              Feed
            </Title>

            <Flex gap="sm">
              <Title
                order={3}
                fz="h4"
                fw={600}
                opacity={feedType === 'explore' ? 1 : 0.4}
                component={Anchor}
                underline="never"
                c="var(--mantine-color-text)"
                onClick={() => setFeedType('explore')}
              >
                Explorar
              </Title>
              <Title
                order={3}
                fz="h4"
                fw={600}
                opacity={feedType === 'following' ? 1 : 0.4}
                component={Anchor}
                underline="never"
                c="var(--mantine-color-text)"
                onClick={() => setFeedType('following')}
              >
                Seguindo
              </Title>
            </Flex>
          </Group>
          <ScrollArea h={{ base: 'auto', md: 'calc(100vh - 120px)' }} scrollHideDelay={0}>
            {/* Caixa de novo post */}
            <Paper className="paperWrapper" mb="sm" py="xs" px={{ base: 'md', md: 0 }}>
              <Flex gap={10} align="center">
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
                  w="100%"
                  c="dimmed"
                  size="md"
                  lh={0}
                  component={Link}
                  to="/new/post"
                >
                  Quais as novidades?
                </Text>
              </Flex>
            </Paper>

            {/* Feed */}
            {loadingFeed ? (
              <Center mt="lg">
                <Loader type="bars" />
              </Center>
            ) : error ? (
              <Paper p="md" withBorder radius="md" mx="sm" mt="xl">
                <Center style={{ flexDirection: 'column' }}>
                  <Text size="sm" c="dimmed" mb="md">
                    Ocorreu um erro ao carregar o feed.
                  </Text>
                  <Button
                    variant="light"
                    color="red"
                    size="xs"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['feed'] })}
                  >
                    Tentar novamente
                  </Button>
                </Center>
              </Paper>
            ) : (
              <>
                <Stack gap={14}>
                  {feedPosts.map((post) => (
                    <Card className="feedPostWrapper" key={post.id}>
                      <Group
                        gap={6}
                        align="flex-start"
                        justify="space-between"
                        className="paddingX"
                      >
                        <Avatar
                          size={36}
                          radius="xl"
                          src={
                            post.author_avatar
                              ? AVATAR_PATH + post.author_avatar
                              : undefined
                          }
                          component={Link}
                          to={`/${post.author_username}`}
                          title={post.author_full_name}
                        />
                        <Box flex={1}>
                          <Stack gap={0}>
                            <Flex
                              gap={post.author_is_verified ? 2 : 6}
                              align="center"
                              wrap="wrap"
                            >
                              <Text
                                component={Link}
                                to={`/${post.author_username}`}
                                size="md"
                                fw={600}
                                lh={1}
                                c="var(--mantine-color-text)"
                                className="noDecoration"
                              >
                                {post.author_username}
                              </Text>
                              {!!post.author_is_verified && (
                                <IconRosetteDiscountCheckFilled
                                  className="iconVerified small"
                                  title="Usuário verificado"
                                />
                              )}
                              {post.author_project_id && (
                                <Text size="xs" c="dimmed">
                                  Projeto
                                </Text>
                              )}
                              <Text
                                size="xs"
                                fw={400}
                                c="dimmed"
                                title={dayjs(post.created_at).format(
                                  'dddd, D [de] MMMM [de] YYYY [às] HH:mm',
                                )}
                                component={Link}
                                to={`/post/${post.id}`}
                                style={{ textDecoration: 'none' }}
                                lh={1}
                                ml={3}
                              >
                                {dayjs(post.created_at).fromNow()}
                              </Text>
                            </Flex>
                            <Text
                              size="xs"
                              c="dimmed"
                              maw={200}
                              truncate="end"
                              title={post.author_title}
                            >
                              {post.author_title}
                            </Text>
                          </Stack>
                        </Box>
                        <Menu shadow="md" radius="md" position="bottom-end">
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              radius="xl"
                              mr={{ base: 0, sm: 'xs' }}
                            >
                              <IconDots size={18} color="gray" />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconLink size={14} />}
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/post/${post.id}`,
                                )
                              }
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
                      {post.body && (
                        <Text
                          size="sm"
                          opacity={0.8}
                          lh={1.3}
                          mt={6}
                          mb={4}
                          component={Link}
                          to={`/post/${post.id}`}
                          c="var(--mantine-color-text)"
                          style={{
                            textDecoration: 'none',
                            whiteSpace: 'pre-line',
                          }}
                          className="paddingX"
                        >
                          {post.body}
                        </Text>
                      )}
                      {post.image && (
                        <Link to={`/post/${post.id}`}>
                          <Image
                            src={`https://ik.imagekit.io/mublin/posts/tr:w-700/${post.image}`}
                            className="post-image"
                            mt={2}
                          />
                        </Link>
                      )}
                      {post.video_url && (
                        <VideoPlayer
                          url={post.video_url}
                          title={post.body?.slice(0, 60)}
                        />
                      )}
                      {(post.linked_gig_id || post.linked_product_id) && (
                        <Box className="paddingX">
                          <LinkedItem post={post} />
                        </Box>
                      )}
                      {/* Ações */}
                      <Group gap={4} mt={6} px={{ base: '0.4rem', sm: 0 }}>
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
                            {post.comments_count === 0 && <IconMessageCircle size={21} />}{' '}
                            {post.comments_count > 0 ? post.comments_count : ''}
                          </Button>
                        )}
                      </Group>
                    </Card>
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
              </>
            )}
          </ScrollArea>
        </>
      )}

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
          <Button
            color="red"
            size="sm"
            loading={isDeletingPost}
            onClick={handleDeletePost}
          >
            Apagar
          </Button>
        </Group>
      </Modal>
    </>
  )
}
