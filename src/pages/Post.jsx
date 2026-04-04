import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { 
  fetchPostById, fetchUserLikedPosts, 
  fetchPostLikes, toggleLike, 
  fetchPostComments, postComment
} from '../queries/feed'
import {
  Container, Group, Flex, Stack, Box, Text, Avatar,
  Card, Image, Loader, Center, Modal,
  ActionIcon, Menu, Anchor, Textarea, Button, Divider, em
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayer from '../components/feed/VideoPlayer'
import {
  IconDots, IconLink, IconRosetteDiscountCheckFilled, IconPlus,
  IconArrowLeft, IconHeart, IconHeartFilled, 
  IconMessageCircle, IconTrash
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

function LikeButton({ postId, userId, likedPostIds, likesCount }) {
  const queryClient = useQueryClient()
  const liked = likedPostIds.includes(postId)

  const { mutate, isPending } = useMutation({
    mutationFn: () => toggleLike({ postId, userId, liked }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['likedPosts', userId] })
      await queryClient.cancelQueries({ queryKey: ['postLikes', postId] })

      const previousLiked = queryClient.getQueryData(['likedPosts', userId])
      const previousCount = queryClient.getQueryData(['postLikes', postId])

      // Atualiza lista de posts curtidos
      queryClient.setQueryData(['likedPosts', userId], (old = []) =>
        liked ? old.filter(id => id !== postId) : [...old, postId]
      )

      // Atualiza contador diretamente
      queryClient.setQueryData(['postLikes', postId], (old = 0) =>
        Math.max(0, old + (liked ? -1 : 1))
      )

      return { previousLiked, previousCount }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['likedPosts', userId], context.previousLiked)
      queryClient.setQueryData(['postLikes', postId], context.previousCount)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['likedPosts', userId] })
      queryClient.invalidateQueries({ queryKey: ['postLikes', postId] })
    },
  })

  return (
    <Group gap={4} align="center">
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
          ? <IconHeartFilled size={20} color="red" />
          : <IconHeart size={20} />
        }
      </ActionIcon>
      {likesCount > 0 && (
        <Text size="sm" lh={0}>{likesCount}</Text>
      )}
    </Group>
  )
}

export default function Post() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [commentBody, setCommentBody] = useState('')
  const [showNewPostSection, setShowNewPostSection] = useState(false)

  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [confirmDeletePostOpened, { open: openConfirmDeletePost, close: closeConfirmDeletePost }] = useDisclosure(false)

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPostById(id),
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
    mutationFn: () => postComment({
      postId: postIdNum,
      authorId: user.id,
      body: commentBody.trim(),
    }),
    onSuccess: () => {
      setCommentBody('')
      queryClient.invalidateQueries({ queryKey: ['post-comments', postIdNum] })
    },
  })

  if (isLoading) return (
    <Center h="50vh"><Loader color="indigo" /></Center>
  )
  if (!post) return (
    <Center h="50vh">
      <Text c="dimmed">Post não encontrado.</Text>
    </Center>
  )

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
      navigate('/home')
    }
    setIsDeletingPost(false)
  }

  return (
    <>
      <Container size="sm" px={{ base: 0, sm: 'xs' }} pt={{ base:"xs", sm: "sm" }} mb="xl">
        <Anchor 
          component={Link} 
          to="/home" 
          c="dimmed" 
          size="sm" 
          mb={{ base: 0, sm: 'xs' }}
          display="inline-flex" 
          style={{ alignItems: 'center', gap: 4 }}
          mx={isMobile ? 14 : 0}
        >
          <IconArrowLeft size={14} /> Voltar
        </Anchor>
        <Card
          shadow={{ base: 'none', sm: 'sm' }}
          px={{ base: 0, sm: 'md' }}
          pb="xs"
          radius={{ base: 0, sm: 'md' }}
          withBorder={false}
          bg={{ base: 'transparent', sm: 'var(--mantine-color-body)' }}
          mt="xs"
        >
          <Box px={isMobile ? 14 : 0}>
            <Group gap="sm" align="flex-start">
              <Avatar
                size={40}
                radius="xl"
                src={post.author_avatar ? AVATAR_PATH + post.author_avatar : undefined}
                component={Link}
                to={`/${post.author_username}`}
              />
              <Stack gap={3} style={{ flex: 1 }}>
                <Group gap="xs" justify="space-between">
                  <Flex gap={post.author_is_verified ? 2 : 6} align="center">
                    <Anchor
                      component={Link}
                      to={`/${post.author_username}`}
                      underline='hover'
                      size="0.9em"
                      c="var(--mantine-color-text)"
                      fw="600"
                    >
                      {post.author_full_name}
                    </Anchor>
                    {!!post.author_is_verified &&
                      <IconRosetteDiscountCheckFilled
                        className='iconVerified'
                        title='Usuário verificado'
                      />
                    }
                    {post.author_project_id &&
                      <Text span color="gray">Projeto</Text>
                    }
                    <Text
                      c="dimmed"
                      size="0.9em"
                      title={dayjs(post.created_at).format('dddd, D [de] MMMM [de] YYYY [às] HH:mm')}
                    >
                      {dayjs(post.created_at).fromNow()}
                    </Text>
                  </Flex>
                  <Menu shadow="md" radius="md" position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
                        <IconDots size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconLink size={14} />}
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)}
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
                {post.author_title && (
                  <Text size="12px" lh="1" opacity={0.7}>{post.author_title}</Text>
                )}
              </Stack>
            </Group>
            <Text size="0.94em" fw="500" lh={1.5} opacity={0.9} mt="sm">
              {post.body}
            </Text>
          </Box>
          {/* Player de vídeo */}
          {post.video_url && (
            <VideoPlayer
              url={post.video_url}
              title={post.body?.slice(0, 60)}
            />
          )}
          {post.image && (
            <Image
              src={`https://ik.imagekit.io/mublin/posts/tr:w-700/${post.image}`}
              mt="sm"
            />
          )}
          <Box px={isMobile ? 14 : 0}>
            <LinkedItem post={post} />
            <Group mt={16} ml={-4}>
              <LikeButton
                postId={postIdNum}
                userId={user?.id}
                likedPostIds={likedPostIds}
                likesCount={likesCount}
              />
              {!post.comments_disabled && (
                <Group gap={10} align="center">
                  <IconMessageCircle size={20} />
                  {comments.length > 0 &&
                    <Text size="sm" lh={0}>{comments.length}</Text>
                  }
                </Group>
              )}
              {!post.comments_disabled && showNewPostSection === false && (
                <Button 
                  leftSection={<IconPlus size={16} />} 
                  variant="default"
                  size='xs'
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
            {showNewPostSection && 
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
                    <Text size="xs" c="dimmed">{commentBody.length}/1000</Text>
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
            }

            {/* Lista de comentários */}
            {loadingComments ? (
              <Center mt="md"><Loader size="xs" /></Center>
            ) : comments.length > 0 ? (
              <Stack gap={0} mt="md">
                {comments.map((comment, i) => (
                  <Box key={comment.id}>
                    {i > 0 && <Divider opacity={0.4} />}
                    <Group gap="sm" align="flex-start" py="sm">
                      <Avatar
                        size={30}
                        radius="xl"
                        src={comment.profiles?.avatar ? AVATAR_PATH + comment.profiles.avatar : undefined}
                        component={Link}
                        to={`/${comment.profiles?.username}`}
                      />
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Flex gap={4} align="center">
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
                            title={dayjs(comment.created_at).format('dddd, D [de] MMMM [de] YYYY [às] HH:mm')}
                          >
                            {dayjs(comment.created_at).fromNow()}
                          </Text>
                          {comment.updated_at && (
                            <Text size="xs" c="dimmed" fs="italic">(editado)</Text>
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
          <Button color="red" size="sm" loading={isDeletingPost} onClick={handleDeletePost}>
            Apagar
          </Button>
        </Group>
      </Modal>
    </>
  )
}
