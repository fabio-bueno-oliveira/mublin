import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabaseClient'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import {
  fetchPostDetailsById,
  fetchUserLikedPosts,
  fetchPostLikes,
  fetchPostComments,
  postComment,
} from '../queries/feed'
import {
  useMantineColorScheme,
  Container,
  Group,
  Flex,
  Stack,
  Box,
  Badge,
  Text,
  Avatar,
  Card,
  Image,
  Loader,
  Center,
  Modal,
  ActionIcon,
  Menu,
  Anchor,
  Textarea,
  Button,
  Divider,
  em,
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayerNative from '../components/VideoPlayerNative'
import VideoPlayerYoutube from '../components/feed/VideoPlayerYoutube'
import LikeButton from '../components/feed/LikeButton'
import {
  IconDots,
  IconLink,
  IconRosetteDiscountCheckFilled,
  IconPlus,
  IconArrowLeft,
  IconMessageCircle,
  IconTrash,
  IconUser,
} from '@tabler/icons-react'
import { truncateString } from '../utils/formatter'
import { getAvatarUrl } from '../utils/profile'
import parse from 'html-react-parser'
import linkifyStr from 'linkify-string'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
import ProPlanBadge from '../components/ProPlanBadge'
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

export default function Post() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [commentBody, setCommentBody] = useState('')
  const [showNewPostSection, setShowNewPostSection] = useState(false)

  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [
    confirmDeletePostOpened,
    { open: openConfirmDeletePost, close: closeConfirmDeletePost },
  ] = useDisclosure(false)

  const [commentToDelete, setCommentToDelete] = useState(null)
  const [isDeletingComment, setIsDeletingComment] = useState(false)
  const [
    confirmDeleteCommentOpened,
    { open: openConfirmDeleteComment, close: closeConfirmDeleteComment },
  ] = useDisclosure(false)

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPostDetailsById(id),
    staleTime: 1000 * 60 * 5,
  })

  const postIdNum = post?.id ? Number(post.id) : null

  const { data: likedPostIds = [] } = useQuery({
    queryKey: ['likedPosts', user?.id],
    queryFn: () => fetchUserLikedPosts(user.id, [postIdNum]),
    enabled: !!user?.id && !!postIdNum,
    staleTime: 1000 * 60 * 2,
  })

  const { data: likesCount = 0 } = useQuery({
    queryKey: ['postLikes', postIdNum],
    queryFn: () => fetchPostLikes(postIdNum),
    enabled: !!postIdNum,
    staleTime: 1000 * 60 * 2,
  })

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['post-comments', postIdNum],
    queryFn: () => fetchPostComments(postIdNum),
    enabled: !!postIdNum,
    staleTime: 1000 * 60 * 2,
  })

  const { mutate: submitComment, isPending: submittingComment } = useMutation({
    mutationFn: () =>
      postComment({
        postId: postIdNum,
        authorId: user.id,
        body: commentBody.trim(),
      }),
    onSuccess: () => {
      setCommentBody('')
      queryClient.invalidateQueries({ queryKey: ['post-comments', postIdNum] })
    },
  })

  if (isLoading) {
    return (
      <Center h="50vh">
        <Loader color="indigo" />
      </Center>
    )
  }
  if (!post) {
    return (
      <Center h="50vh">
        <Text c="dimmed">Post não encontrado.</Text>
      </Center>
    )
  }

  async function handleDeletePost() {
    setIsDeletingPost(true)
    const { error } = await supabase.from('feed').delete().eq('id', postToDelete)
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao apagar postagem.',
      })
    } else {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Postagem apagada!',
      })
      closeConfirmDeletePost()
      navigate('/home')
    }
    setIsDeletingPost(false)
  }

  async function handleDeleteComment() {
    setIsDeletingComment(true)
    const { error } = await supabase
      .from('feed_comments')
      .delete()
      .eq('id', commentToDelete)
    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao apagar comentário.',
      })
    } else {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postIdNum] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Comentário apagado!',
      })
      closeConfirmDeleteComment()
    }
    setIsDeletingComment(false)
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
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`${truncateString(post.body, 30)} · ${post.author_username} · Mublin`}</title>
        <link rel="canonical" href={`https://mublin.com/post/${post?.id}`} />
        <meta
          name="description"
          content={`Postagem de ${post.author_username} no Mublin`}
        />
      </Helmet>
      <Container
        size="sm"
        px={{ base: 0, sm: 'xs' }}
        pt={{ base: 'xs', sm: 'sm' }}
        mb="xl"
      >
        <Group justify="space-between">
          <ActionIcon
            variant="subtle"
            color="gray"
            radius="xl"
            mb={0}
            mt={isMobile ? 6 : 0}
            mx={isMobile ? 14 : 0}
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/home'))}
          >
            <IconArrowLeft size={22} />
          </ActionIcon>
          <Menu
            shadow="md"
            radius="md"
            position="bottom-end"
            mt={isMobile ? 6 : 0}
            mr={16}
          >
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
                <IconDots size={22} />
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
              <Menu.Item
                leftSection={<IconUser size={14} />}
                onClick={() => navigate(`/${post.author_username}`)}
              >
                Ver perfil de {post.author_username}
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
        <Card
          shadow={{ base: 'none', sm: 'sm' }}
          px={{ base: 0, sm: 'md' }}
          pb="xs"
          radius={{ base: 0, sm: 'md' }}
          mt={{ base: 0, sm: 'xs' }}
          className="transparent-in-mobile-dark"
        >
          <Box px={isMobile ? 14 : 0}>
            <Group gap="sm" align="center">
              <Avatar
                size={40}
                radius="xl"
                src={getAvatarUrl(post.author_avatar, post.author_is_open_to_work, 64)}
                component={Link}
                to={`/${post.author_username}`}
              />
              <Stack gap={3}>
                <Group gap="xs">
                  <Flex gap={post.author_is_verified ? 2 : 6} align="center">
                    <Anchor
                      component={Link}
                      to={`/${post.author_username}`}
                      underline="hover"
                      size="15px"
                      c="var(--mantine-color-text)"
                      fw="600"
                    >
                      {post.author_full_name}
                    </Anchor>
                    {post?.author_plan === 'Pro' && <ProPlanBadge small marginLeft={2} />}
                    {!!post.author_is_verified && (
                      <IconRosetteDiscountCheckFilled
                        className="iconVerified"
                        title="Usuário verificado"
                      />
                    )}
                    {post.author_project_id && (
                      <Text span color="gray">
                        Projeto
                      </Text>
                    )}
                    <Text
                      c="dimmed"
                      size="15px"
                      ml={3}
                      title={dayjs(post.created_at).format(
                        'dddd, D [de] MMMM [de] YYYY [às] HH:mm',
                      )}
                    >
                      {dayjs(post.created_at).fromNow()}
                    </Text>
                  </Flex>
                </Group>
                {post.author_title && (
                  <Text size="sm" lh="1" opacity={0.7}>
                    {post.author_title}
                  </Text>
                )}
              </Stack>
            </Group>
            <Text
              size="0.9em"
              c="var(--mantine-color-text)"
              lh={1.4}
              mt="sm"
              style={{
                textDecoration: 'none',
                whiteSpace: 'pre-line',
              }}
            >
              {parse(
                linkifyStr(post.body, {
                  target: '_blank',
                  format: (value, type) => formatLinkText(value, type),
                }),
              )}
            </Text>
            {/* <Badge
              mt="xs"
              size="xs"
              leftSection={<IconBrandInstagram size={14} />}
              variant="gradient"
              gradient={{ from: 'pink', to: 'grape', deg: 90 }}
            >
              Vídeo replicado do Instagram
            </Badge> */}
          </Box>
          {/* Player de vídeo */}
          {post.video_source === 'mublin' && (
            <Box className="paddingX" mt={{ base: 'md', sm: 'xs' }}>
              <VideoPlayerNative
                src={post.video_storage_path}
                title={post.video_title}
                isVertical={post.video_is_vertical ?? true}
              />
            </Box>
          )}
          {post.video_url && (
            <Box mt={{ base: 'md', sm: 'xs' }}>
              <VideoPlayerYoutube url={post.video_url} title={post.body?.slice(0, 60)} />
            </Box>
          )}
          {post.image && (
            <Image
              src={`https://ik.imagekit.io/mublin/posts/tr:w-700/${post.image}`}
              mt={{ base: 'md', sm: 'xs' }}
            />
          )}
          <Box px={isMobile ? 14 : 0}>
            <LinkedItem post={post} />
            <Group mt={12} ml={-4}>
              <LikeButton
                postId={postIdNum}
                userId={user?.id}
                likedPostIds={likedPostIds}
                likesCount={likesCount}
              />
              {!post.comments_disabled && (
                <Group gap={10} align="center">
                  <IconMessageCircle size={20} />
                  {comments.length > 0 && (
                    <Text size="sm" fw={600} lh={0}>
                      {comments.length}
                    </Text>
                  )}
                </Group>
              )}
              {!post.comments_disabled && showNewPostSection === false && (
                <Button
                  leftSection={<IconPlus size={16} />}
                  variant="subtle"
                  size="sm"
                  onClick={() => setShowNewPostSection(true)}
                >
                  Comentar
                </Button>
              )}
            </Group>
          </Box>
        </Card>
        {/* Comentários */}
        {!post.comments_disabled ? (
          <Box mt="md" px={isMobile ? 14 : 0}>
            {/* Campo de novo comentário */}
            {showNewPostSection && (
              <Group gap="sm" align="flex-start">
                <Avatar
                  size={34}
                  radius="xl"
                  src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
                />
                <Stack gap={6} style={{ flex: 1 }}>
                  <Textarea
                    placeholder="Escreva um comentário..."
                    radius="md"
                    autosize
                    minRows={2}
                    maxRows={5}
                    maxLength={1000}
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && commentBody.trim()) {
                        e.preventDefault()
                        submitComment()
                      }
                    }}
                  />
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      {commentBody.length}/1000
                    </Text>
                    <Button
                      size="sm"
                      radius="md"
                      variant="default"
                      disabled={!commentBody.trim()}
                      loading={submittingComment}
                      onClick={() => submitComment()}
                    >
                      Postar
                    </Button>
                  </Group>
                </Stack>
              </Group>
            )}

            {/* Lista de comentários */}
            {loadingComments ? (
              <Center mt="md">
                <Loader size="xs" />
              </Center>
            ) : comments.length > 0 ? (
              <Stack gap={0} mt="md">
                {comments.map((comment, i) => (
                  <Box key={comment.id}>
                    {i > 0 && <Divider opacity={0.4} />}
                    <Group gap="sm" align="flex-start" py="sm">
                      <Avatar
                        size={30}
                        radius="xl"
                        src={
                          comment.profiles?.avatar
                            ? AVATAR_PATH + comment.profiles.avatar
                            : undefined
                        }
                        component={Link}
                        to={`/${comment.profiles?.username}`}
                      />
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Flex gap={4} justify="flex-start" align="center">
                          <Anchor
                            component={Link}
                            to={`/${comment.profiles?.username}`}
                            underline="hover"
                            size="xs"
                            fw={700}
                            c="var(--mantine-color-text)"
                          >
                            {comment.profiles?.full_name}
                          </Anchor>
                          {comment.profiles?.is_verified && (
                            <IconRosetteDiscountCheckFilled
                              size={13}
                              className="iconVerified"
                              title="Usuário verificado"
                            />
                          )}
                          <Text
                            size="xs"
                            c="dimmed"
                            title={dayjs(comment.created_at).format(
                              'dddd, D [de] MMMM [de] YYYY [às] HH:mm',
                            )}
                          >
                            {dayjs(comment.created_at).fromNow()}
                          </Text>
                          {comment.updated_at && (
                            <Text size="xs" c="dimmed" fs="italic">
                              (editado)
                            </Text>
                          )}
                          {user.id === comment.profiles?.id && (
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              title="Deletar meu comentário"
                              radius="xl"
                              ml={3}
                              onClick={() => {
                                setCommentToDelete(comment.id)
                                openConfirmDeleteComment()
                              }}
                            >
                              <IconTrash size={13} />
                            </ActionIcon>
                          )}
                        </Flex>
                        <Text size="0.94em" lh={1.5} opacity={0.85}>
                          {comment.body}
                        </Text>
                      </Stack>
                    </Group>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed" ta="center" mt="md">
                Nenhum comentário ainda. Seja o primeiro!
              </Text>
            )}
          </Box>
        ) : (
          <Text size="sm" c="dimmed" ta="center" mt="md">
            Comentários desativados.
          </Text>
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
      <Modal
        opened={confirmDeleteCommentOpened}
        onClose={closeConfirmDeleteComment}
        withCloseButton={false}
        size="xs"
        radius="md"
        centered
      >
        <Text size="sm">
          Tem certeza que deseja apagar este comentário? Esta ação não pode ser desfeita.
        </Text>
        <Group justify="flex-end" gap={8} mt="md">
          <Button variant="default" size="sm" onClick={closeConfirmDeleteComment}>
            Cancelar
          </Button>
          <Button
            color="red"
            size="sm"
            loading={isDeletingComment}
            onClick={handleDeleteComment}
          >
            Apagar
          </Button>
        </Group>
      </Modal>
    </>
  )
}
