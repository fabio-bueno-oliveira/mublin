import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  fetchFeed,
  fetchUserLikedPosts,
  fetchLikesCountByPosts,
  deletePost,
} from '../queries/feed'
import { fetchUserProjects } from '../queries/user'
import { fetchProjectDashboardInfo } from '../queries/projects'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import {
  useMantineColorScheme,
  Box,
  Container,
  Grid,
  Flex,
  Stack,
  Group,
  NativeSelect,
  Text,
  Title,
  Loader,
  Avatar,
  Button,
  ActionIcon,
  Menu,
  Badge,
  Pill,
  ScrollArea,
  Scroller,
  Skeleton,
  Image,
  Modal,
  Paper,
  Card,
  Spoiler,
  Center,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayer from '../components/feed/VideoPlayer'
import LikeButton from '../components/feed/LikeButton'
import ProjectCard from '../components/ProjectCard'
import {
  IconCircleArrowLeftFilled,
  IconCircleArrowRightFilled,
  IconRosetteDiscountCheckFilled,
  IconMessageCircle,
  IconDots,
  IconLink,
  IconTrash,
  IconCircleFilled,
  IconCircleChevronDownFilled,
  IconCircleChevronUpFilled,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects/'

function ProjectSkeletons({ count = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <Flex key={i} direction="column" align="center" gap={10}>
      <Skeleton radius="md" width={90} height={130} />
      <Skeleton radius="xl" width={50} height={10} />
    </Flex>
  ))
}

export default function Home() {
  const { colorScheme } = useMantineColorScheme()
  const queryClient = useQueryClient()
  const { profile, user, loading } = useAuth()

  const [postToDelete, setPostToDelete] = useState(null)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [
    confirmDeletePostOpened,
    { open: openConfirmDeletePost, close: closeConfirmDeletePost },
  ] = useDisclosure(false)

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

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const userProjects = projects.map((p) => ({
    id: p.projects.id,
    name: p.projects.name,
    slug: p.projects.slug,
    picture: p.projects.picture,
    status: p.status,
    main_role: p.roles.name_ptbr,
    genre: p.projects.genres?.name,
    type: p.projects.project_types?.name_ptbr,
    totalMembers: p.projects.project_members?.length || 0,
  }))

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

  const [selectedProjectSlug, setSelectedProjectSlug] = useState('')

  const { data: projectDashboard, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['project-dashboard', selectedProjectSlug],
    queryFn: () => fetchProjectDashboardInfo(selectedProjectSlug),
    enabled: !!selectedProjectSlug,
  })

  const projectsByStatus = {
    accepted: userProjects?.filter((p) => p.status === 2) || [],
    pending: userProjects?.filter((p) => p.status === 1) || [],
    declined: userProjects?.filter((p) => p.status === 3) || [],
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

      <Container size="xl" pt="xs" px={{ base: 0, sm: 'lg' }}>
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 7 }} className="paddingX">
            <Flex align="center" mb="sm" gap={6}>
              <Title order={2} fz="h3" fw={600} lts="-0.02em">
                Meus projetos
              </Title>
              {userProjects.length > 0 && (
                <Pill size="sm">{userProjects.length}</Pill>
              )}
            </Flex>

            <NativeSelect
              mb="md"
              description="Selecione um projeto para gerenciar"
              value={selectedProjectSlug}
              onChange={(e) => setSelectedProjectSlug(e.target.value)}
            >
              <option value="">Todos os projetos</option>

              {projectsByStatus.accepted.length > 0 && (
                <optgroup label="Aceitos / Ativos">
                  {projectsByStatus.accepted.map((project) => (
                    <option key={project.id} value={project.slug}>
                      {project.name}
                    </option>
                  ))}
                </optgroup>
              )}

              {projectsByStatus.pending.length > 0 && (
                <optgroup label="Pendentes de aprovação">
                  {projectsByStatus.pending.map((project) => (
                    <option key={project.id} value={project.slug}>
                      {project.name}
                    </option>
                  ))}
                </optgroup>
              )}

              {projectsByStatus.declined.length > 0 && (
                <optgroup label="Declinados / Encerrados">
                  {projectsByStatus.declined.map((project) => (
                    <option key={project.id} value={project.slug}>
                      {project.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </NativeSelect>

            {isLoadingDashboard && (
              <Paper
                withBorder
                p="md"
                radius="md"
                mt="md"
                bg="var(--mantine-color-body)"
              >
                <Stack>
                  <Skeleton height={20} width="70%" />
                  <Skeleton height={100} />
                </Stack>
              </Paper>
            )}

            {!selectedProjectSlug && (
              <Paper
                withBorder
                p="md"
                radius="md"
                mt="md"
                bg="var(--mantine-color-body)"
              >
                <Text size="xs">
                  Você possui {userProjects.length} projetos
                </Text>
                <Grid>
                  <Grid.Col span={6}>
                    <IconCircleFilled size={10} color="#eba800" /> Pendentes
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <IconCircleFilled size={10} color="#198a4c" /> Aceitos
                  </Grid.Col>
                </Grid>
              </Paper>
            )}

            {projectDashboard && !isLoadingDashboard && (
              <Paper
                withBorder
                p="md"
                radius="md"
                mt="md"
                bg="var(--mantine-color-body)"
              >
                <Group justify="space-between" align="flex-start" mb="xs">
                  <Flex gap={8}>
                    <Avatar
                      src={
                        projectDashboard.picture
                          ? `${PROJECT_AVATAR_PATH}${projectDashboard.id}/tr:h-180,w-180,c-maintain_ratio/${projectDashboard.picture}`
                          : undefined
                      }
                      alt={projectDashboard.name}
                      size={100}
                      radius="lg"
                      style={
                        colorScheme === 'light'
                          ? { border: '3px solid white' }
                          : { border: '3px solid #1c1c1c' }
                      }
                    />
                    <Flex direction="column">
                      <Title order={5}>{projectDashboard.name}</Title>
                      <Text size="sm">
                        {projectDashboard.project_types.name_ptbr}
                      </Text>
                    </Flex>
                  </Flex>
                  <Badge color="green" variant="light">
                    Ativo
                  </Badge>
                </Group>

                <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                  {projectDashboard.description}
                </Text>

                {/* Exemplo de exibição de dados vindos da sua query projects.js */}
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="xs" fw={700} tt="uppercase">
                      Membros
                    </Text>
                    <Text size="sm">
                      {projectDashboard.project_members?.length || 0}{' '}
                      integrantes
                    </Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="xs" fw={700} tt="uppercase">
                      Gênero
                    </Text>
                    <Text size="sm">
                      {projectDashboard.genres?.name_ptbr || 'N/A'}
                    </Text>
                  </Grid.Col>
                </Grid>

                <Button
                  component={Link}
                  to={`/projects/${projectDashboard.slug}`}
                  variant="light"
                  fullWidth
                  mt="md"
                  size="xs"
                >
                  Ver página completa do projeto
                </Button>
              </Paper>
            )}

            {/* Desktop — Spoiler com grid wrap */}
            <Box visibleFrom="sm" mt={200}>
              {loadingProjects ? (
                <Group gap="xs" wrap="wrap">
                  <ProjectSkeletons count={4} />
                </Group>
              ) : (
                <Spoiler
                  maxHeight={268}
                  showLabel={
                    <IconCircleChevronDownFilled
                      size={24}
                      color="gray"
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        transform: 'translateX(-50%)',
                      }}
                    />
                  }
                  hideLabel={
                    <IconCircleChevronUpFilled
                      size={24}
                      color="gray"
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        transform: 'translateX(-50%)',
                      }}
                    />
                  }
                  styles={{
                    control: {
                      display: 'flex',
                      justifyContent: 'center',
                      width: '100%',
                      paddingTop: 6,
                      borderTop: '1px solid rgba(128,128,128,0.2)',
                      marginTop: 8,
                    },
                  }}
                >
                  <Group gap="xs" wrap="wrap" mb={12}>
                    {userProjects.map((item) => (
                      <ProjectCard
                        key={item.id}
                        item={item}
                        profile={profile}
                      />
                    ))}
                  </Group>
                </Spoiler>
              )}
            </Box>

            {/* Mobile — Scroller horizontal */}
            <Box hiddenFrom="sm">
              {loadingProjects ? (
                <Flex gap={14}>
                  <ProjectSkeletons count={4} />
                </Flex>
              ) : (
                <Scroller
                  key={userProjects.length}
                  draggable
                  controlSize="xl"
                  startControlIcon={<IconCircleArrowLeftFilled size={36} />}
                  endControlIcon={<IconCircleArrowRightFilled size={36} />}
                >
                  <Group gap="xs" wrap="nowrap">
                    {userProjects.map((item) => (
                      <ProjectCard
                        key={item.id}
                        item={item}
                        profile={profile}
                      />
                    ))}
                  </Group>
                </Scroller>
              )}
            </Box>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }} px={0}>
            <Title
              order={2}
              fz="h3"
              fw={600}
              lts="-0.02em"
              mb="sm"
              className="paddingX"
            >
              Feed
            </Title>
            {loading ? (
              <Center my={40}>
                <Loader />
              </Center>
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
                  <Text size="sm" c="dimmed" px="1rem">
                    Carregando postagens...
                  </Text>
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
                                  post.comments_count > 0 && (
                                    <IconMessageCircle size={21} />
                                  )
                                }
                              >
                                {post.comments_count === 0 && (
                                  <IconMessageCircle size={21} />
                                )}{' '}
                                {post.comments_count > 0
                                  ? post.comments_count
                                  : ''}
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
          Tem certeza que deseja apagar esta postagem? Esta ação não pode ser
          desfeita.
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
