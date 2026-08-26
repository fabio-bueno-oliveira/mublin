import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchSetupById,
  fetchSetupItems,
  fetchSetupCollaborators,
  fetchCanEditSetup,
  fetchSetupLikesCount,
  fetchHasLiked,
  toggleSetupLike,
  fetchSetupComments,
  fetchSetupCommentsCount,
  addSetupComment,
  deleteSetupComment,
  findProfileByUsername,
  searchProducts,
  updateSetupMeta,
  addSetupItem,
  updateSetupItem,
  removeSetupItem,
  addSetupCollaborator,
  removeSetupCollaborator,
} from '../queries/setups'
import { useAuth } from '../hooks/useAuth'
import {
  Affix,
  Container,
  Modal,
  ScrollArea,
  ThemeIcon,
  Box,
  EmptyState,
  Button,
  Avatar,
  Text,
  Title,
  Group,
  Flex,
  Stack,
  Badge,
  Image,
  Card,
  Center,
  Paper,
  Divider,
  TextInput,
  Textarea,
  NativeSelect,
  Switch,
  ActionIcon,
  Tooltip,
  Skeleton,
  Loader,
  Pagination,
  em,
  Accordion,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMediaQuery, useDisclosure, useDebouncedValue } from '@mantine/hooks'
import {
  IconMoodSad,
  IconWorld,
  IconLock,
  IconUsers,
  IconUserPlus,
  IconPencil,
  IconPlus,
  IconTrash,
  IconCheck,
  IconX,
  IconLogout2,
  IconRoute,
  IconArrowsMaximize,
  IconMessageCircle,
  IconSend,
  IconHeart,
  IconHeartFilled,
} from '@tabler/icons-react'
import AppNavbarMobile from '../components/AppNavbarMobile'

const SETUP_IMG = 'https://ik.imagekit.io/mublin/users/gear-setups/tr:w-500,h-500/'
const SETUP_PHOTO = 'https://ik.imagekit.io/mublin/users/gear-setups/tr:w-800/'
const SETUP_PHOTO_FULL = 'https://ik.imagekit.io/mublin/users/gear-setups/tr:w-1600/'
const PRODUCT_IMG =
  'https://ik.imagekit.io/mublin/products/tr:h-160,cm-pad_resize,bg-FFFFFF/'
const PRODUCT_IMG_LARGE =
  'https://ik.imagekit.io/mublin/products/tr:h-400,cm-pad_resize,bg-FFFFFF/'

export default function Setup() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, loading: authLoading } = useAuth()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  const [isEditingMeta, { open: openEditMeta, close: closeEditMeta }] =
    useDisclosure(false)
  const [photoModalOpened, { open: openPhotoModal, close: closePhotoModal }] =
    useDisclosure(false)
  const [chainModalOpened, { open: openChainModal, close: closeChainModal }] =
    useDisclosure(false)

  const [metaDraft, setMetaDraft] = useState({
    name: '',
    description: '',
    visibility: 'private',
    collab_mode: 'owner_only',
  })
  const [isSavingMeta, setIsSavingMeta] = useState(false)

  const [collabUsernameInput, setCollabUsernameInput] = useState('')
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false)
  const [isRemovingCollaboratorId, setIsRemovingCollaboratorId] = useState(null)

  const [productQuery, setProductQuery] = useState('')
  const [debouncedProductQuery] = useDebouncedValue(productQuery, 400)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [commentPage, setCommentPage] = useState(1)
  const COMMENTS_PER_PAGE = 10
  const [newComment, setNewComment] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingItemDraft, setEditingItemDraft] = useState({ comments: '' })

  // ── Queries ───────────────────────────────────────────
  const {
    data: setup,
    isLoading: loadingSetup,
    isError: setupNotFound,
  } = useQuery({
    queryKey: ['setup', id],
    queryFn: () => fetchSetupById(id),
    enabled: !!id,
    retry: 1,
  })

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['setup-items', id],
    queryFn: () => fetchSetupItems(id),
    enabled: !!id,
  })

  const isOwner = !!user?.id && !!setup?.id_user && user.id === setup.id_user

  // Só chamamos o RPC se tiver usuário logado e o setup não for owner_only
  // (nesse caso a resposta seria sempre false pra quem não é dono).
  const { data: canEditRpc = false } = useQuery({
    queryKey: ['can-edit-setup', id, user?.id],
    queryFn: () => fetchCanEditSetup(id),
    enabled: !!id && !!user?.id && !isOwner && setup?.collab_mode !== 'owner_only',
  })

  const canEditItems = isOwner || canEditRpc

  const isCollabEligible =
    setup?.visibility === 'public' && setup?.collab_mode === 'invite_only'

  const { data: collaborators = [], isLoading: loadingCollaborators } = useQuery({
    queryKey: ['setup-collaborators', id],
    queryFn: () => fetchSetupCollaborators(id),
    enabled: !!id && isCollabEligible,
  })

  const { data: commentsCount = 0 } = useQuery({
    queryKey: ['setup-comments-count', id],
    queryFn: () => fetchSetupCommentsCount(id),
    enabled: !!id,
  })

  const { data: commentsData, isLoading: loadingComments } = useQuery({
    queryKey: ['setup-comments', id, commentPage],
    queryFn: () => fetchSetupComments(id, commentPage, COMMENTS_PER_PAGE),
    enabled: !!id,
  })

  const comments = commentsData?.data ?? []
  const totalCommentPages = Math.ceil(commentsCount / COMMENTS_PER_PAGE) || 1

  const { data: likesCount = 0 } = useQuery({
    queryKey: ['setup-likes-count', id],
    queryFn: () => fetchSetupLikesCount(id),
    enabled: !!id,
  })

  const { data: hasLiked = false } = useQuery({
    queryKey: ['setup-has-liked', id, user?.id],
    queryFn: () => fetchHasLiked(id, user.id),
    enabled: !!id && !!user?.id,
  })

  const [isLiking, setIsLiking] = useState(false)

  const { data: productResults = [], isFetching: searchingProducts } = useQuery({
    queryKey: ['product-search', debouncedProductQuery],
    queryFn: () => searchProducts(debouncedProductQuery),
    enabled: debouncedProductQuery.trim().length >= 2,
  })

  // ── Handlers: metadados do setup (só dono) ────────────
  function handleOpenEditMeta() {
    setMetaDraft({
      name: setup.name,
      description: setup.description ?? '',
      visibility: setup.visibility,
      collab_mode: setup.collab_mode,
    })
    openEditMeta()
  }

  function handleChangeVisibility(nextVisibility) {
    setMetaDraft((prev) => ({
      ...prev,
      visibility: nextVisibility,
      collab_mode: nextVisibility === 'public' ? prev.collab_mode : 'owner_only',
    }))
  }

  async function handleSaveMeta() {
    if (!metaDraft.name.trim()) {
      return
    }
    setIsSavingMeta(true)
    try {
      await updateSetupMeta(id, metaDraft)
      await queryClient.refetchQueries({ queryKey: ['setup', id] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Setup atualizado!',
      })
      closeEditMeta()
    } catch (err) {
      notifications.show({ color: 'red', position: 'top-center', message: err.message })
    } finally {
      setIsSavingMeta(false)
    }
  }

  // ── Handlers: colaboradores ────────────────────────────
  async function handleAddCollaborator() {
    if (!collabUsernameInput.trim()) {
      return
    }
    setIsAddingCollaborator(true)
    try {
      const foundProfile = await findProfileByUsername(collabUsernameInput)
      if (!foundProfile) {
        notifications.show({
          color: 'red',
          position: 'top-center',
          message: 'Usuário não encontrado.',
        })
        return
      }
      if (foundProfile.id === setup.id_user) {
        notifications.show({
          color: 'red',
          position: 'top-center',
          message: 'Esse usuário já é o dono deste setup.',
        })
        return
      }
      await addSetupCollaborator({
        setupId: id,
        userId: foundProfile.id,
        invitedBy: user.id,
      })
      await queryClient.refetchQueries({ queryKey: ['setup-collaborators', id] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: `${foundProfile.full_name || foundProfile.username} adicionado como colaborador!`,
      })
      setCollabUsernameInput('')
    } catch (err) {
      notifications.show({ color: 'red', position: 'top-center', message: err.message })
    } finally {
      setIsAddingCollaborator(false)
    }
  }

  async function handleRemoveCollaborator(collaboratorRowId) {
    setIsRemovingCollaboratorId(collaboratorRowId)
    try {
      await removeSetupCollaborator(collaboratorRowId)
      await queryClient.refetchQueries({ queryKey: ['setup-collaborators', id] })
    } catch (err) {
      notifications.show({ color: 'red', position: 'top-center', message: err.message })
    } finally {
      setIsRemovingCollaboratorId(null)
    }
  }

  // ── Handlers: itens do setup ───────────────────────────
  async function handleAddItem(product) {
    if (items.some((i) => i.id_product === product.id)) {
      notifications.show({
        color: 'yellow',
        position: 'top-center',
        message: 'Este item já está no setup.',
      })
      return
    }
    setIsAddingItem(true)
    try {
      const nextOrder =
        items.length > 0 ? Math.max(...items.map((i) => i.order_show)) + 1 : 1
      await addSetupItem({
        setupId: id,
        userId: user.id,
        productId: product.id,
        orderShow: nextOrder,
      })
      await queryClient.refetchQueries({ queryKey: ['setup-items', id] })
      setProductQuery('')
    } catch (err) {
      notifications.show({ color: 'red', position: 'top-center', message: err.message })
    } finally {
      setIsAddingItem(false)
    }
  }

  function handleStartEditItem(item) {
    setEditingItemId(item.id)
    setEditingItemDraft({ comments: item.comments ?? '' })
  }

  async function handleSaveItemComment(itemId, orderShow) {
    try {
      await updateSetupItem(itemId, {
        order_show: orderShow,
        comments: editingItemDraft.comments.trim() || null,
      })
      await queryClient.refetchQueries({ queryKey: ['setup-items', id] })
      setEditingItemId(null)
    } catch (err) {
      notifications.show({ color: 'red', position: 'top-center', message: err.message })
    }
  }

  async function handleRemoveItem(itemId) {
    try {
      await removeSetupItem(itemId)
      await queryClient.refetchQueries({ queryKey: ['setup-items', id] })
    } catch (err) {
      notifications.show({ color: 'red', position: 'top-center', message: err.message })
    }
  }

  // ── Comentários ──
  async function handleSendComment() {
    if (!newComment.trim() || !user?.id) {
      return
    }
    setIsSendingComment(true)
    try {
      await addSetupComment({ setupId: id, userId: user.id, content: newComment.trim() })
      setNewComment('')
      setCommentPage(1)
      await queryClient.refetchQueries({ queryKey: ['setup-comments', id] })
      await queryClient.refetchQueries({ queryKey: ['setup-comments-count', id] })
    } catch (err) {
      notifications.show({ color: 'red', message: err.message })
    } finally {
      setIsSendingComment(false)
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await deleteSetupComment(commentId)
      await queryClient.refetchQueries({ queryKey: ['setup-comments', id] })
      await queryClient.refetchQueries({ queryKey: ['setup-comments-count', id] })
      notifications.show({ color: 'green', message: 'Comentário removido.' })
    } catch (err) {
      notifications.show({ color: 'red', message: err.message })
    }
  }

  async function handleToggleLike() {
    if (!user?.id) {
      notifications.show({ color: 'blue', message: 'Faça login para curtir' })
      return
    }
    setIsLiking(true)
    try {
      const newLiked = await toggleSetupLike({
        setupId: id,
        userId: user.id,
        currentlyLiked: hasLiked,
      })
      // optimistic update via cache
      queryClient.setQueryData(['setup-has-liked', id, user.id], newLiked)
      queryClient.setQueryData(['setup-likes-count', id], (prev) =>
        newLiked ? (prev ?? 0) + 1 : Math.max(0, (prev ?? 1) - 1),
      )
    } catch (err) {
      notifications.show({ color: 'red', message: err.message })
    } finally {
      setIsLiking(false)
    }
  }

  // ── Estados de carregamento / erro ─────────────────────
  if (authLoading || loadingSetup) {
    return (
      <Center mih="70vh">
        <Loader />
      </Center>
    )
  }

  if (setupNotFound || !setup) {
    return (
      <Container size="sm" py={80}>
        <EmptyState>
          <EmptyState.Indicator>
            <IconMoodSad />
          </EmptyState.Indicator>
          <EmptyState.Title>Setup não encontrado</EmptyState.Title>
          <EmptyState.Description>
            Ele pode ter sido removido ou o link está incorreto.
          </EmptyState.Description>
          <EmptyState.Actions>
            <Button variant="default" onClick={() => navigate('/')}>
              Voltar ao início
            </Button>
          </EmptyState.Actions>
        </EmptyState>
      </Container>
    )
  }

  const visibilityIcon =
    setup.visibility === 'public' ? (
      setup.collab_mode === 'owner_only' ? (
        <IconWorld size={13} />
      ) : (
        <IconUsers size={13} />
      )
    ) : (
      <IconLock size={13} />
    )

  const visibilityLabel =
    setup.visibility === 'private'
      ? 'Privado'
      : setup.collab_mode === 'open'
        ? 'Público para colaboração'
        : setup.collab_mode === 'invite_only'
          ? 'Público · colaboradores convidados'
          : 'Público · somente leitura'

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{`Setup · ${setup?.name} · Mublin`}</title>
        <link rel="canonical" href={`https://mublin.com/setup/${setup?.id}`} />
        <meta name="description" content={setup?.description} />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName={`Setup: ${setup.name}`} />
      </Affix>

      <Container size="lg" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 62, sm: 0 }}>
        <Stack gap="lg">
          {/* ── Cabeçalho do setup ── */}
          <Group align="flex-start" wrap="nowrap">
            <Image
              src={setup.image ? SETUP_IMG + setup.image : undefined}
              w={96}
              h={96}
              radius="md"
              fit="cover"
              fallbackSrc="https://placehold.co/96x96?text=%20"
            />
            <Box style={{ flex: 1 }}>
              <Group gap={6} wrap="nowrap">
                <Title order={3}>{setup.name}</Title>
                {isOwner && (
                  <ActionIcon variant="subtle" size="sm" onClick={handleOpenEditMeta}>
                    <IconPencil size={16} />
                  </ActionIcon>
                )}
              </Group>
              <Group gap={6} mt={8}>
                <Badge
                  size="xs"
                  variant="light"
                  radius="xl"
                  color="var(--mantine-color-dimmed)"
                  // color={setup.visibility === 'public' ? 'indigo' : 'gray'}
                  leftSection={visibilityIcon}
                >
                  {visibilityLabel}
                </Badge>
              </Group>
              <Flex justify="space-between" align="center" mt={10} gap="md">
                {setup.owner && (
                  <Group gap={6}>
                    <Text size="xs" c="dimmed">
                      Criado por
                    </Text>
                    <Avatar
                      component={Link}
                      to={`/${setup.owner.username}`}
                      src={
                        setup.owner.avatar
                          ? `https://ik.imagekit.io/mublin/tr:h-60,c-maintain_ratio/users/avatars/${setup.owner.avatar}`
                          : undefined
                      }
                      size={20}
                      radius="xl"
                    />
                    <Text
                      component={Link}
                      to={`/${setup.owner.username}`}
                      lineClamp={1}
                      size="xs"
                      fw={500}
                      style={{
                        display: 'inline',
                        hover: { textDecoration: 'underline' },
                        color: 'inherit',
                      }}
                    >
                      {setup.owner.full_name}
                    </Text>
                  </Group>
                )}

                {/* Like button */}
                <Tooltip label={hasLiked ? 'Descurtir' : 'Curtir este setup'}>
                  <Button
                    size="xs"
                    variant={hasLiked ? 'filled' : 'light'}
                    color={hasLiked ? 'red.9' : 'gray'}
                    radius="xl"
                    leftSection={
                      hasLiked ? <IconHeartFilled size={14} /> : <IconHeart size={14} />
                    }
                    loading={isLiking}
                    onClick={handleToggleLike}
                  >
                    {likesCount > 0 ? likesCount : ''}{' '}
                  </Button>
                </Tooltip>
              </Flex>
            </Box>
          </Group>

          {/* ── Edição de metadados (só dono) ── */}
          {isOwner && isEditingMeta && (
            <Paper withBorder radius="md" p="md">
              <Stack gap="sm">
                <TextInput
                  label="Nome"
                  value={metaDraft.name}
                  onChange={(e) => {
                    const value = e.currentTarget.value
                    setMetaDraft((prev) => ({ ...prev, name: value }))
                  }}
                />
                <Textarea
                  label="Descrição"
                  autosize
                  minRows={2}
                  value={metaDraft.description}
                  onChange={(e) => {
                    const value = e.currentTarget.value
                    setMetaDraft((prev) => ({ ...prev, description: value }))
                  }}
                />
                <Switch
                  label="Setup público"
                  description="Aparece na comunidade e pode ganhar um link próprio pra compartilhar. Por padrão, continua editável só por você"
                  checked={metaDraft.visibility === 'public'}
                  onChange={(e) =>
                    handleChangeVisibility(e.currentTarget.checked ? 'public' : 'private')
                  }
                />
                {metaDraft.visibility === 'public' && (
                  <NativeSelect
                    size="sm"
                    label="Quem pode editar (além de você)"
                    value={metaDraft.collab_mode}
                    onChange={(e) => {
                      const value = e.currentTarget.value
                      setMetaDraft((prev) => ({ ...prev, collab_mode: value }))
                    }}
                    data={[
                      { value: 'owner_only', label: 'Ninguém — só eu edito' },
                      { value: 'invite_only', label: 'Colaboradores que eu convidar' },
                      { value: 'open', label: 'Qualquer usuário da comunidade' },
                    ]}
                  />
                )}
                <Group justify="flex-end">
                  <Button variant="default" onClick={closeEditMeta}>
                    Cancelar
                  </Button>
                  <Button
                    loading={isSavingMeta}
                    disabled={!metaDraft.name.trim()}
                    onClick={handleSaveMeta}
                  >
                    Salvar
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}

          {/* ── Colaboradores ── */}
          {isCollabEligible && (
            <>
              {/* <Divider label="Colaboradores" labelPosition="left" /> */}
              <Stack gap="sm">
                {isOwner && (
                  <Group gap={6} align="flex-end">
                    <TextInput
                      size="sm"
                      style={{ flex: 1 }}
                      placeholder="username"
                      label="Convidar por @username"
                      value={collabUsernameInput}
                      onChange={(e) => setCollabUsernameInput(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && collabUsernameInput.trim()) {
                          handleAddCollaborator()
                        }
                      }}
                    />
                    <ActionIcon
                      variant="default"
                      size="lg"
                      loading={isAddingCollaborator}
                      disabled={!collabUsernameInput.trim()}
                      onClick={handleAddCollaborator}
                    >
                      <IconUserPlus size={16} />
                    </ActionIcon>
                  </Group>
                )}

                {loadingCollaborators ? (
                  <Skeleton height={40} radius="md" />
                ) : collaborators.length === 0 ? (
                  <Text size="xs" c="dimmed">
                    Nenhum colaborador adicional neste setup.
                  </Text>
                ) : (
                  <Stack gap={6}>
                    {collaborators.map((c) => (
                      <Paper key={c.id} withBorder radius="md" p="xs">
                        <Flex justify="space-between" align="center">
                          <Group gap="xs">
                            <Avatar
                              component={Link}
                              to={`/${c.profiles?.username}`}
                              src={
                                c.profiles?.avatar
                                  ? `https://ik.imagekit.io/mublin/tr:h-60,c-maintain_ratio/users/avatars/${c.profiles.avatar}`
                                  : undefined
                              }
                              radius="xl"
                              size={28}
                            />
                            <Stack gap={0}>
                              <Text size="xs" fw={600}>
                                {c.profiles?.full_name}
                              </Text>
                              <Text size="10px" c="dimmed">
                                @{c.profiles?.username}
                              </Text>
                            </Stack>
                          </Group>
                          {(isOwner || c.id_user === user?.id) && (
                            <Tooltip
                              label={
                                c.id_user === user?.id && !isOwner
                                  ? 'Sair da colaboração'
                                  : 'Remover colaborador'
                              }
                            >
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="sm"
                                loading={isRemovingCollaboratorId === c.id}
                                onClick={() => handleRemoveCollaborator(c.id)}
                              >
                                {c.id_user === user?.id && !isOwner ? (
                                  <IconLogout2 size={13} />
                                ) : (
                                  <IconX size={13} />
                                )}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Flex>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Stack>
            </>
          )}

          {setup.description && (
            <Text size="sm" c="dimmed">
              {setup.description}
            </Text>
          )}

          {/* ── Itens do setup ── */}
          {/* ── Foto real do setup + Chain visual ── */}
          {setup?.photo && (
            <Box>
              <Title order={3} fw={600} fz="lg" mb={8}>
                Foto real do setup
              </Title>
              <Box pos="relative" style={{ cursor: 'pointer' }} onClick={openPhotoModal}>
                <Image
                  src={SETUP_PHOTO + setup.photo}
                  radius="md"
                  h={120}
                  w="100%"
                  fit="cover"
                  fallbackSrc={SETUP_IMG + (setup.image ?? '')}
                />
                <Box
                  pos="absolute"
                  top={8}
                  right={8}
                  bg="rgba(0,0,0,0.6)"
                  style={{ borderRadius: 20, padding: 6, display: 'flex' }}
                >
                  <IconArrowsMaximize size={16} color="white" />
                </Box>
              </Box>
            </Box>
          )}

          {/* Chain scroller - thumbnails conectados por IconRoute */}
          {items.length > 1 && (
            <Box>
              <Group justify="space-between" align="center" mb={8}>
                <Title order={3} fw={600} fz="lg">
                  Composição do setup {items.length ? ` (${items.length})` : ''}
                </Title>

                <Button
                  size="sm"
                  variant="light"
                  color="var(--mantine-color-text)"
                  onClick={openChainModal}
                >
                  Expandir
                </Button>
              </Group>
              <ScrollArea
                style={{ cursor: 'pointer' }}
                type="scroll"
                scrollbarSize={6}
                offsetScrollbars
                onClick={openChainModal}
              >
                <Flex
                  gap={0}
                  align="center"
                  wrap="nowrap"
                  py={4}
                  style={{ minWidth: 'max-content' }}
                >
                  {items.map((item, idx) => (
                    <Flex key={item.id} align="center" gap={0} wrap="nowrap">
                      <Paper
                        bg="white"
                        withBorder
                        radius="md"
                        p={4}
                        style={{ flexShrink: 0 }}
                      >
                        <Image
                          src={
                            item.products?.picture
                              ? PRODUCT_IMG + item.products.picture
                              : undefined
                          }
                          w={52}
                          h={52}
                          fit="contain"
                          radius="sm"
                          fallbackSrc="https://placehold.co/52x52?text=?"
                        />
                      </Paper>
                      {idx < items.length - 1 && (
                        <ThemeIcon
                          variant="transparent"
                          color="indigo"
                          size="sm"
                          mx={2}
                          style={{ flexShrink: 0 }}
                        >
                          <IconRoute size={18} />
                        </ThemeIcon>
                      )}
                    </Flex>
                  ))}
                </Flex>
              </ScrollArea>
            </Box>
          )}

          <Accordion variant="separated" order={3} defaultValue="Apples">
            <Accordion.Item value="setup-items" disabled={!canEditItems}>
              <Accordion.Control disabled={!canEditItems}>
                <Title order={3} fw={600} fz="lg">
                  Editar setup
                </Title>
              </Accordion.Control>
              <Accordion.Panel px="md">
                {canEditItems && (
                  <Box mb="xs">
                    <TextInput
                      size="sm"
                      variant="default"
                      placeholder="Buscar equipamento pra adicionar..."
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.currentTarget.value)}
                    />
                    {productQuery.trim().length >= 2 && (
                      <Paper withBorder radius="md" mt={6} p={6}>
                        {searchingProducts ? (
                          <Skeleton height={32} />
                        ) : productResults.length === 0 ? (
                          <Text size="xs" c="dimmed" p={6}>
                            Nenhum produto encontrado.
                          </Text>
                        ) : (
                          <Stack gap={4}>
                            {productResults.map((product) => (
                              <Group key={product.id} justify="space-between" px={4}>
                                <Group gap={8}>
                                  <Image
                                    src={
                                      product.picture
                                        ? PRODUCT_IMG + product.picture
                                        : undefined
                                    }
                                    w={28}
                                    h={28}
                                    radius="sm"
                                    fallbackSrc="https://placehold.co/28x28?text=%20"
                                  />
                                  <Text size="xs">
                                    {product.brands?.name} {product.name}
                                  </Text>
                                </Group>
                                <ActionIcon
                                  size="sm"
                                  variant="light"
                                  loading={isAddingItem}
                                  onClick={() => handleAddItem(product)}
                                >
                                  <IconPlus size={13} />
                                </ActionIcon>
                              </Group>
                            ))}
                          </Stack>
                        )}
                      </Paper>
                    )}
                  </Box>
                )}

                {loadingItems ? (
                  <Skeleton height={120} radius="md" />
                ) : items.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    Nenhum item adicionado a este setup ainda.
                  </Text>
                ) : (
                  <Stack gap={8}>
                    {items.map((item) => (
                      <Card key={item.id} withBorder radius="md" p="sm">
                        <Flex justify="space-between" align="flex-start" wrap="nowrap">
                          <Group gap={10} wrap="nowrap" style={{ flex: 1 }}>
                            <Image
                              src={
                                item.products?.picture
                                  ? PRODUCT_IMG + item.products.picture
                                  : undefined
                              }
                              w={44}
                              h={44}
                              radius="sm"
                              fallbackSrc="https://placehold.co/44x44?text=%20"
                            />
                            <Box style={{ flex: 1 }}>
                              <Text size="sm" fw={600}>
                                {item.products?.brands?.name} {item.products?.name}
                              </Text>
                              {editingItemId === item.id ? (
                                <TextInput
                                  size="xs"
                                  mt={4}
                                  placeholder="Observação (opcional)"
                                  value={editingItemDraft.comments}
                                  onChange={(e) =>
                                    setEditingItemDraft({
                                      comments: e.currentTarget.value,
                                    })
                                  }
                                />
                              ) : (
                                item.comments && (
                                  <Text size="xs" c="dimmed" mt={2}>
                                    {item.comments}
                                  </Text>
                                )
                              )}
                              {isCollabEligible && item.added_by && (
                                <Text size="10px" c="dimmed" mt={4}>
                                  Adicionado por{' '}
                                  <Text component="span" size="10px" fw={600}>
                                    @{item.added_by.username}
                                  </Text>
                                </Text>
                              )}
                            </Box>
                          </Group>
                          {canEditItems && (
                            <Group gap={4} wrap="nowrap">
                              {editingItemId === item.id ? (
                                <>
                                  <ActionIcon
                                    size="sm"
                                    variant="light"
                                    color="green"
                                    onClick={() =>
                                      handleSaveItemComment(item.id, item.order_show)
                                    }
                                  >
                                    <IconCheck size={13} />
                                  </ActionIcon>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    onClick={() => setEditingItemId(null)}
                                  >
                                    <IconX size={13} />
                                  </ActionIcon>
                                </>
                              ) : (
                                <>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    onClick={() => handleStartEditItem(item)}
                                  >
                                    <IconPencil size={13} />
                                  </ActionIcon>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="red"
                                    onClick={() => handleRemoveItem(item.id)}
                                  >
                                    <IconTrash size={13} />
                                  </ActionIcon>
                                </>
                              )}
                            </Group>
                          )}
                        </Flex>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>

          {/* ── Comentários ── */}
          <Group gap={6}>
            <IconMessageCircle size={18} />
            <Title order={3} fw={600} fz="lg">
              {`Comentários${commentsCount ? ` (${commentsCount})` : ''}`}
            </Title>
          </Group>

          <Stack gap="md">
            {user && (
              <Group gap="xs" align="flex-end">
                <TextInput
                  placeholder="Deixe um comentário..."
                  style={{ flex: 1 }}
                  size="md"
                  variant="unstyled"
                  value={newComment}
                  maxLength={500}
                  onChange={(e) => setNewComment(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendComment()
                    }
                  }}
                />
                <ActionIcon
                  size="lg"
                  variant="filled"
                  color="indigo"
                  loading={isSendingComment}
                  disabled={!newComment.trim()}
                  onClick={handleSendComment}
                >
                  <IconSend size={16} />
                </ActionIcon>
              </Group>
            )}

            {loadingComments ? (
              <Stack gap="sm">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={60} radius="md" />
                ))}
              </Stack>
            ) : comments.length === 0 ? (
              <Paper withBorder radius="md" p="md">
                <Text size="sm" c="dimmed">
                  Nenhum comentário ainda. Seja o primeiro!
                </Text>
              </Paper>
            ) : (
              <>
                <Stack gap="sm">
                  {comments.map((c) => (
                    <Paper key={c.id} withBorder radius="md" p="sm">
                      <Flex justify="space-between" align="flex-start">
                        <Group gap="sm" align="flex-start">
                          <Avatar
                            src={
                              c.profiles?.avatar
                                ? `https://ik.imagekit.io/mublin/tr:h-60,c-maintain_ratio/users/avatars/${c.profiles.avatar}`
                                : undefined
                            }
                            size={32}
                            radius="xl"
                          />
                          <Box style={{ flex: 1 }}>
                            <Group gap={6}>
                              <Text size="xs" fw={600}>
                                {c.profiles?.full_name ?? c.profiles?.username}
                              </Text>
                              <Text size="10px" c="dimmed">
                                @{c.profiles?.username}
                              </Text>
                              <Text size="10px" c="dimmed">
                                ·{' '}
                                {new Date(c.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                              </Text>
                            </Group>
                            <Text
                              size="sm"
                              mt={4}
                              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                            >
                              {c.content}
                            </Text>
                          </Box>
                        </Group>
                        {(user?.id === c.id_user || isOwner) && (
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="red"
                            onClick={() => handleDeleteComment(c.id)}
                          >
                            <IconTrash size={12} />
                          </ActionIcon>
                        )}
                      </Flex>
                    </Paper>
                  ))}
                </Stack>

                {totalCommentPages > 1 && (
                  <Group justify="center" mt="md">
                    <Pagination
                      size="sm"
                      total={totalCommentPages}
                      value={commentPage}
                      onChange={setCommentPage}
                    />
                  </Group>
                )}
              </>
            )}
          </Stack>
        </Stack>
      </Container>

      {/* Modal - foto maximizada */}
      <Modal
        opened={photoModalOpened}
        onClose={closePhotoModal}
        size="xl"
        radius="md"
        centered
        withCloseButton={false}
        padding={0}
        styles={{ content: { backgroundColor: 'black' } }}
      >
        <Box pos="relative">
          <Image
            src={setup?.photo ? SETUP_PHOTO_FULL + setup.photo : undefined}
            w="100%"
            h="auto"
            fit="contain"
            style={{ maxHeight: '90vh' }}
          />
          <ActionIcon
            pos="absolute"
            top={12}
            right={12}
            size="lg"
            radius="xl"
            color="dark"
            variant="filled"
            onClick={closePhotoModal}
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <IconX size={18} color="white" />
          </ActionIcon>
        </Box>
      </Modal>

      <Modal
        opened={chainModalOpened}
        onClose={closeChainModal}
        title="Composição do setup"
        size="xl"
        centered
      >
        <Box
          style={{
            overflowX: 'visible',
            overflowY: 'hidden',
            paddingBottom: 8,
          }}
          p="md"
        >
          <Flex gap={0} align="center" wrap="nowrap" style={{ minWidth: 'max-content' }}>
            {items.map((item, idx) => (
              <Flex key={item.id} align="center" gap={0} wrap="nowrap">
                <Paper
                  withBorder
                  radius="md"
                  p="sm"
                  bg="white"
                  style={{
                    flexShrink: 0,
                  }}
                >
                  <Link to={`/gear/${item.products?.slug}`}>
                    <Image
                      src={
                        item.products?.picture
                          ? PRODUCT_IMG_LARGE + item.products.picture
                          : undefined
                      }
                      w={200}
                      h={200}
                      fit="contain"
                      radius="sm"
                      fallbackSrc="https://placehold.co/140x140?text=?"
                    />
                  </Link>
                </Paper>

                {idx < items.length - 1 && (
                  <ThemeIcon
                    variant="transparent"
                    color="indigo"
                    size="xl"
                    mx="md"
                    style={{ flexShrink: 0 }}
                  >
                    <IconRoute size={34} />
                  </ThemeIcon>
                )}
              </Flex>
            ))}
          </Flex>
        </Box>
      </Modal>
    </>
  )
}
