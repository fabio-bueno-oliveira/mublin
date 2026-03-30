import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { 
  fetchPostById, fetchUserLikedPosts, 
  fetchPostLikes, toggleLike, 
  fetchPostComments, postComment
} from '../queries/feed'
import {
  Container, Group, Flex, Stack, Box, Text, Avatar,
  Card, Badge, Image, Loader, Center,
  ActionIcon, Menu, Anchor, Textarea, Button, Divider
} from '@mantine/core'
import {
  IconDots, IconLink, IconRosetteDiscountCheckFilled, IconPlus,
  IconMicrophone2, IconArrowLeft, IconHeart, IconHeartFilled, IconMessageCircle
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
const PATH_PRODUCT_IMAGE = 'https://ik.imagekit.io/mublin/products/tr:w-64,h-64,cm-pad_resize,bg-FFFFFF/'

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
      mt={12}
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

export default function Post() {
  const { id } = useParams()
  const { user } = useAuth()

  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [commentBody, setCommentBody] = useState('')
  const [showNewPostSection, setShowNewPostSection] = useState(false)

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
    <Center h="50vh"><Loader color="amber" /></Center>
  )
  if (!post) return (
    <Center h="50vh">
      <Text c="dimmed">Post não encontrado.</Text>
    </Center>
  )

  return (
    <Container size="sm" px={{ base: 0, sm: 'xs' }} pt={{ base:"xs", sm: "sm" }} mb="xl">
      <Anchor 
        component={Link} 
        to="/home" 
        c="dimmed" 
        size="sm" 
        mb={{ base: 0, sm: 'xs' }}
        display="inline-flex" 
        style={{ alignItems: 'center', gap: 4 }}
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
                </Menu.Dropdown>
              </Menu>
            </Group>
            {post.author_title && (
              <Text size="11px" lh="1" opacity={0.7}>{post.author_title}</Text>
            )}
          </Stack>
        </Group>
        <Text size="0.94em" fw="500" lh={1.5} opacity={0.9} mt="sm">
          {post.body}
        </Text>
        {/* Player de vídeo */}
        {post.video_url && (
          <VideoPlayer
            url={post.video_url}
            title={post.body?.slice(0, 60)}
          />
        )}
        {post.image && (
          <Image
            src={`https://ik.imagekit.io/mublin/feed/${post.image}`}
            radius="md"
            mt="sm"
          />
        )}
        <LinkedItem post={post} />
        <Group mt={10} ml={-4}>
          <LikeButton
            postId={postIdNum}
            userId={user?.id}
            likedPostIds={likedPostIds}
            likesCount={likesCount}
          />
          {!post.comments_disabled && (
            <Group gap={10} align="center">
              <IconMessageCircle size={18} />
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
      </Card>
      {/* Comentários */}
      {!post.comments_disabled ? (
        <Box mt="md">

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
  )
}
