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
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import {
  useMantineColorScheme, Box, Container, Grid, Flex, Stack, Group, 
  Text, Title, Loader, Avatar, Badge, Button, ActionIcon, Menu,
  ScrollArea, Scroller, Skeleton, Image, Modal, Paper, Card
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayer from '../components/feed/VideoPlayer'
import LikeButton from '../components/feed/LikeButton'
import {
  IconCircleArrowLeftFilled, IconCircleArrowRightFilled,
  IconRosetteDiscountCheckFilled, IconMessageCircle, 
  IconDots, IconLink, IconTrash, IconClock,
  IconUsersGroup,
  IconUser
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const IMG_PATH = 'https://ik.imagekit.io/mublin/'
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

  const userProjects = savedProjects.map((r) => ({
    id: r.projects.id,
    name: r.projects.name,
    slug: r.projects.slug,
    picture: r.projects.picture,
    status: r.status,
    main_role: r.roles.name_ptbr,
    genre: r.projects.genres?.name,
    totalMembers: r.projects.project_members?.length || 0
  }))

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
      <Container size="xl" py="lg" px="lg">
        <Grid gutter="md">
          <Grid.Col 
            span={{ base: 12, md: 7 }}
            px={{ base: '1rem', sm: 0 }}
          >
            <Title order={2} fz="h3" fw={600} lts="-0.02em" mb="md">
              Meus projetos
            </Title>
            <Scroller
              key={userProjects.length}
              draggable
              controlSize="xl"
              startControlIcon={<IconCircleArrowLeftFilled size={36} />}
              endControlIcon={<IconCircleArrowRightFilled size={36} />}
            >
              <Group gap="xs" wrap="nowrap">
                {!loadingProjects && userProjects?.map(item => (
                  <Link key={item.id}  to={`/project/${item.slug}`} className="noDecoration">
                    <Card 
                      w={140}
                      shadow="sm" 
                      padding="xs"  
                      withBorder
                    >
                      <Card.Section>
                        <Box 
                          style={{ 
                            position: 'relative', 
                            width: '100%', 
                            height: '100%',
                            overflow: 'hidden' 
                          }}
                        >                      
                          <Image
                            src={
                              item.picture
                                ? `${IMG_PATH}projects/${item.id}/tr:h-120,w-140,c-maintain_ratio/${item.picture}`
                                : undefined
                            }
                            fallbackSrc="https://placehold.co/140x120?text=?"
                            height={120}
                            alt={item.name}
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
                      </Card.Section>
                      <Stack mt={8} gap={1} pos="relative" style={{ minWidth: 0 }}>
                        <Text
                          size="sm"
                          fw={550}
                          truncate="end"
                        >
                          {item.name}
                        </Text>

                        <Flex gap={4} align="center" style={{ minWidth: 0 }}>
                          {item.genre && (
                            <>
                              <Text 
                                size="11px" c="dimmed" truncate="end" 
                                style={{ minWidth: 0, flexShrink: 1 }}
                                title={item.genre}
                              >
                                {item.genre}
                              </Text>
                              <Text size="11px" c="dimmed" style={{ flexShrink: 0 }}>·</Text>
                            </>
                          )}
                          <Flex gap={0} align="center" style={{ flexShrink: 0 }}>
                            <IconUser size={12} color="gray" />
                            <Text size="11px" c="dimmed" ml={2}>{item.totalMembers} pessoas</Text>
                          </Flex>
                        </Flex>

                        <Flex gap={3} align="center" style={{ minWidth: 0 }}>
                          <Avatar
                            size={14}
                            src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
                            radius="xl"
                            style={{ flexShrink: 0 }}
                          />
                          <Text size="xs" c="dimmed" truncate="end" style={{ minWidth: 0 }}>
                            {item.main_role}
                          </Text>
                        </Flex>
                      </Stack>
                    </Card>
                  </Link>
                ))}
              </Group>
            </Scroller>
            <ScrollArea w="600" type="never">
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

                

                {/* {!loadingProjects && userProjects?.map(item => (
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
                ))} */}
              </Flex>
            </ScrollArea>
            <Box mt="lg">
              <Title order={2} fz="h3" fw={600} lts="-0.02em" mb="lg">
                Gigs para você
              </Title>
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
                <Paper 
                  className="paperWrapper" 
                  mb="sm" 
                  py="xs"
                  visibleFrom="sm"
                >
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
                      component={Link}
                      to="/new/post"
                    >
                      {feedPhrase ?? 'Quais são as novidades?'}
                    </Text>
                  </Flex>
                </Paper>

                {/* Feed */}
                {loadingFeed ? (
                  <Text size="sm" c="dimmed">Carregando postagens...</Text>
                ) : (
                  <>
                    <Stack gap={14}>
                      {feedPosts.map(post => (
                        <Card className="paperWrapper" key={post.id}>  
                          <Group gap="xs" align="center" justify="space-between">
                            <Avatar
                              size={36}
                              radius="xl"
                              // style={{ border: '1px solid var(--mantine-color-gray-8)' }}
                              src={post.author_avatar ? AVATAR_PATH + post.author_avatar : undefined}
                              component={Link}
                              to={`/${post.author_username}`}
                              title={post.author_full_name}
                            />
                            <Box flex={1}>
                              {/* Cabeçalho do post */}
                              <Stack gap={0}>
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
                                    size="xs"
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
                                <Text size="xs" c="dimmed" truncate="end" title={post.author_title}>
                                  {post.author_title}
                                </Text>
                              </Stack>
                            </Box>
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
                            size="0.88em"
                            fw={480}
                            lh={1.5}
                            my={4}
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
