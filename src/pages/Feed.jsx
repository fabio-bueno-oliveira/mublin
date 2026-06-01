import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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
  Container,
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
  Skeleton,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDisclosure } from '@mantine/hooks'
import {
  IconRosetteDiscountCheckFilled,
  IconMessageCircle,
  IconDots,
  IconLink,
  IconTrash,
  IconArrowNarrowRightDashed,
  IconRefresh,
  IconUser,
} from '@tabler/icons-react'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayerNative from '../components/VideoPlayerNative'
import VideoPlayerYoutube from '../components/feed/VideoPlayerYoutube'
import LikeButton from '../components/feed/LikeButton'
import parse from 'html-react-parser'
import linkifyStr from 'linkify-string'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

export default function Feed({ from = '' }) {
  const navigate = useNavigate()
  const { colorScheme } = useMantineColorScheme()
  const queryClient = useQueryClient()
  const { profile, user, loading } = useAuth()
  const [isStale, setIsStale] = useState(false)
  const [feedType, setFeedType] = useState('explore')

  const {
    data: feedData,
    error: error,
    isLoading: loadingFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
    dataUpdatedAt,
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
    if (!dataUpdatedAt) {
      return
    }
    setIsStale(false)
    const timer = setTimeout(() => setIsStale(true), 1000 * 60 * 2)
    return () => clearTimeout(timer)
  }, [dataUpdatedAt])

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

  const handleTextClick = (event, postId) => {
    if (event.target.tagName === 'A') {
      return
    }

    navigate(`/post/${postId}`)
  }

  const formatLinkText = (value, type) => {
    const maxLength = 30

    if (type === 'url' && value.length > maxLength) {
      // const cleanUrl = value.replace(/^https?:\/\/(www\.)?/, '')

      return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value
    }
    return value
  }

  return (
    <>
      <Container size={580} px={0}>
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
              <Group>
                <Title order={2} fz="h3" fw={600}>
                  Feed
                </Title>
                {isStale && (
                  <ActionIcon
                    variant="light"
                    color="#717171"
                    c="dimmed"
                    onClick={() => refetch()}
                    loading={isRefetching}
                  >
                    <IconRefresh size={18} stroke={2} />
                  </ActionIcon>
                )}
              </Group>

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
            <ScrollArea
              h={{ base: 'auto', md: from ? 'calc(100vh - 120px)' : 'auto' }}
              scrollHideDelay={0}
            >
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
              {loadingFeed || isRefetching ? (
                [1, 2].map((i) => (
                  <Card key={i} mt="sm" className="feedPostWrapper">
                    <Group
                      gap={6}
                      align="center"
                      justify="flex-start"
                      className="paddingX"
                      mb="xs"
                    >
                      <Skeleton circle height={36} width={36} />
                      <Stack gap={5}>
                        <Skeleton width={110} height={14} />
                        <Skeleton width={150} height={8} />
                      </Stack>
                    </Group>
                    <Stack gap={5} mb="sm">
                      <Skeleton width="88%" height={12} />
                      <Skeleton width="84%" height={12} />
                      <Skeleton width="92%" height={12} />
                    </Stack>
                  </Card>
                ))
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
                      onClick={() =>
                        queryClient.invalidateQueries({ queryKey: ['feed'] })
                      }
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
                          <Flex mih={37} direction="column" justify="center" flex={1}>
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
                                maw={240}
                                truncate="end"
                                title={post.author_title}
                              >
                                {post.author_title}
                              </Text>
                            </Stack>
                          </Flex>
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
                                leftSection={<IconArrowNarrowRightDashed size={14} />}
                                onClick={() => navigate(`/post/${post.id}`)}
                              >
                                Ver postagem
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconUser size={14} />}
                                onClick={() => navigate(`/${post.author_username}`)}
                              >
                                Ver perfil de {post.author_username}
                              </Menu.Item>
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
                        {/* Corpo da postagem */}
                        {post.body && (
                          <Text
                            size="0.92em"
                            c="var(--mantine-color-text)"
                            lh={1.4}
                            fw={420}
                            my={7}
                            onClick={(event) => handleTextClick(event, post.id)}
                            style={{
                              textDecoration: 'none',
                              whiteSpace: 'pre-line',
                              cursor: 'pointer',
                            }}
                            className="paddingX"
                          >
                            {parse(
                              linkifyStr(post.body, {
                                target: '_blank',
                                format: (value, type) => formatLinkText(value, type),
                              }),
                            )}
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
                        {post.video_source === 'mublin' && (
                          <Box className="paddingX" mt={5}>
                            <VideoPlayerNative
                              src={post.video_storage_path}
                              title={post.video_title}
                              isVertical={post.video_is_vertical ?? true}
                            />
                          </Box>
                        )}
                        {post.video_url && (
                          <VideoPlayerYoutube
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
                              {post.comments_count === 0 && (
                                <IconMessageCircle size={21} />
                              )}{' '}
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
