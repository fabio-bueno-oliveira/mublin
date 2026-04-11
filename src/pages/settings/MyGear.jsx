import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import {
  Stack, Group, Text, Button, Divider, Modal, Drawer,
  TextInput, Textarea, Loader, Box, Avatar,
  ActionIcon, Flex, Skeleton, Image, Badge, Switch, Grid,
  NativeSelect, NumberInput, Paper, Card, ThemeIcon
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { upload } from '@imagekit/react'
import {
  IconPlus, IconTrash, IconPencil, IconPackages,
  IconRoute, IconCheck, IconX, IconMinus, IconPhoto,
} from '@tabler/icons-react'

const PRODUCT_IMG  = 'https://ik.imagekit.io/mublin/products/tr:h-160,cm-pad_resize,bg-FFFFFF/'
const SETUP_IMG    = 'https://ik.imagekit.io/mublin/users/gear-setups/tr:w-140,h-140/'
const SETUP_IMG_FALLBACK = 'https://ik.imagekit.io/mublin/bg/tr:w-140,h-140/blue-soft_1_.jpg'

// ── Queries locais ────────────────────────────────────────

async function fetchUserGear(userId) {
  const { data, error } = await supabase
    .from('profile_gear')
    .select(`
      id, is_featured, is_for_sale, is_currently_using,
      is_subproduct, parent_gear_id, price, owner_comments,
      products (
        id, name, picture, slug,
        brands ( id, name ),
        product_categories ( id, name_ptbr )
      )
    `)
    .eq('id_user', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

async function fetchUserSetups(userId) {
  const { data, error } = await supabase
    .from('gear_setups')
    .select('id, name, image, description')
    .eq('id_user', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

async function fetchSetupItems(setupId) {
  const { data, error } = await supabase
    .from('gear_setup_items')
    .select(`
      id, order_show, comments,
      products (
        id, name, picture,
        brands ( name )
      )
    `)
    .eq('id_setup', setupId)
    .order('order_show', { ascending: true })
  if (error) throw new Error(error.message)
  return data
}

// ── Componente principal ──────────────────────────────────

export default function MyGear() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // ── Modais e Drawer ───────────────────────────────────
  const [editItemOpened,      { open: openEditItem,      close: closeEditItem      }] = useDisclosure(false)
  const [confirmDeleteOpened, { open: openConfirmDelete, close: closeConfirmDelete }] = useDisclosure(false)
  const [setupDrawerOpened,   { open: openSetupDrawer,   close: closeSetupDrawer   }] = useDisclosure(false)
  const [newSetupOpened,      { open: openNewSetup,      close: closeNewSetup      }] = useDisclosure(false)
  const [confirmDeleteSetupOpened, { open: openConfirmDeleteSetup, close: closeConfirmDeleteSetup }] = useDisclosure(false)

  // ── Estado: editar item ───────────────────────────────
  const [editingItem, setEditingItem] = useState(null)
  const [isSavingItem, setIsSavingItem] = useState(false)

  // ── Estado: remover item ──────────────────────────────
  const [itemToDelete, setItemToDelete] = useState(null)
  const [isDeletingItem, setIsDeletingItem] = useState(false)

  // ── Estado: setup selecionado no drawer ───────────────
  const [activeSetup, setActiveSetup] = useState(null)
  const [showAddToSetup, setShowAddToSetup] = useState(false)
  const [isAddingToSetup, setIsAddingToSetup] = useState(false)
  const [isDeletingSetupItem, setIsDeletingSetupItem] = useState(null)
  const [editingSetupItem, setEditingSetupItem] = useState(null)
  const [isSavingSetupItem, setIsSavingSetupItem] = useState(false)
  const [editingSetup, setEditingSetup] = useState({ name: '', description: '' })
  const [isSavingSetup, setIsSavingSetup] = useState(false)

  // ── Estado: novo setup ────────────────────────────────
  const [newSetup, setNewSetup] = useState({ name: '', description: '', image: '' })
  const [isCreatingSetup, setIsCreatingSetup] = useState(false)
  const [isUploadingSetupImg, setIsUploadingSetupImg] = useState(false)
  const [setupImgFileId, setSetupImgFileId] = useState('')

  // ── Estado: remover setup ─────────────────────────────
  const [setupToDelete, setSetupToDelete] = useState(null)
  const [isDeletingSetup, setIsDeletingSetup] = useState(false)

  // ── Queries ───────────────────────────────────────────
  const { data: userGear = [], isLoading: loadingGear } = useQuery({
    queryKey: ['user-gear', user?.id],
    queryFn: () => fetchUserGear(user.id),
    enabled: !!user?.id,
  })

  const { data: userSetups = [], isLoading: loadingSetups } = useQuery({
    queryKey: ['user-setups', user?.id],
    queryFn: () => fetchUserSetups(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: setupItems = [], isLoading: loadingSetupItems } = useQuery({
    queryKey: ['setup-items', activeSetup?.id],
    queryFn: () => fetchSetupItems(activeSetup.id),
    enabled: !!activeSetup?.id,
    staleTime: 0,
  })

  // ── Gear separado: principal vs sub ──────────────────
  const mainGear = userGear.filter(g => !g.is_subproduct)
  const subGear  = userGear.filter(g =>  g.is_subproduct)

  // ── Handlers: editar item ─────────────────────────────
  function handleOpenEditItem(item) {
    setEditingItem({
      id:                 item.id,
      name:               item.products?.name,
      brand:              item.products?.brands?.name,
      picture:            item.products?.picture,
      is_featured:        item.is_featured,
      is_currently_using: item.is_currently_using,
      is_for_sale:        item.is_for_sale,
      price:              item.price ?? '',
      owner_comments:     item.owner_comments ?? '',
    })
    openEditItem()
  }

  async function handleSaveItem() {
    setIsSavingItem(true)
    const { error } = await supabase
      .from('profile_gear')
      .update({
        is_featured:        editingItem.is_featured,
        is_currently_using: editingItem.is_currently_using,
        is_for_sale:        editingItem.is_for_sale,
        price:              editingItem.is_for_sale ? (editingItem.price || null) : null,
        owner_comments:     editingItem.owner_comments || null,
      })
      .eq('id', editingItem.id)
    if (error) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Erro ao salvar. Tente novamente.' })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-gear', user.id] })
      notifications.show({ color: 'green', position: 'top-center', message: 'Item atualizado!' })
      closeEditItem()
    }
    setIsSavingItem(false)
  }

  // ── Handlers: remover item ────────────────────────────
  function handleOpenConfirmDelete(item) {
    setItemToDelete({
      id:    item.id,
      name:  item.products?.name,
      brand: item.products?.brands?.name,
    })
    openConfirmDelete()
  }

  async function handleDeleteItem() {
    setIsDeletingItem(true)
    const { error } = await supabase
      .from('profile_gear')
      .delete()
      .eq('id', itemToDelete.id)
    if (error) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Erro ao remover. Tente novamente.' })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-gear', user.id] })
      notifications.show({ color: 'green', position: 'top-center', message: 'Item removido.' })
      closeConfirmDelete()
    }
    setIsDeletingItem(false)
  }

  // ── Handlers: setup drawer ────────────────────────────
  function handleOpenSetupDrawer(setup) {
    setActiveSetup(setup)
    setEditingSetup({ name: setup.name, description: setup.description ?? '' })
    setShowAddToSetup(false)
    setEditingSetupItem(null)
    openSetupDrawer()
  }

  function handleCloseSetupDrawer() {
    closeSetupDrawer()
    setActiveSetup(null)
    setShowAddToSetup(false)
    setEditingSetupItem(null)
  }

  async function handleAddToSetup(productId) {
    if (!productId || !activeSetup) return
    const alreadyIn = setupItems.some(i => i.products?.id === Number(productId))
    if (alreadyIn) return
    setIsAddingToSetup(true)
    const nextOrder = setupItems.length > 0
      ? Math.max(...setupItems.map(i => i.order_show)) + 1
      : 1
    const { error } = await supabase
      .from('gear_setup_items')
      .insert({
        id_user:    user.id,
        id_product: Number(productId),
        id_setup:   activeSetup.id,
        order_show: nextOrder,
      })
    if (error) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Erro ao adicionar item ao setup.' })
    } else {
      await queryClient.refetchQueries({ queryKey: ['setup-items', activeSetup.id] })
      await queryClient.refetchQueries({ queryKey: ['user-setups', user.id] })
      setShowAddToSetup(false)
    }
    setIsAddingToSetup(false)
  }

  async function handleDeleteSetupItem(itemId) {
    setIsDeletingSetupItem(itemId)
    const { error } = await supabase
      .from('gear_setup_items')
      .delete()
      .eq('id', itemId)
    if (!error) {
      await queryClient.refetchQueries({ queryKey: ['setup-items', activeSetup.id] })
      await queryClient.refetchQueries({ queryKey: ['user-setups', user.id] })
    }
    setIsDeletingSetupItem(null)
  }

  async function handleSaveSetupItem() {
    if (!editingSetupItem) return
    setIsSavingSetupItem(true)
    const { error } = await supabase
      .from('gear_setup_items')
      .update({
        order_show: editingSetupItem.order_show,
        comments:   editingSetupItem.comments || null,
      })
      .eq('id', editingSetupItem.id)
    if (!error) {
      await queryClient.refetchQueries({ queryKey: ['setup-items', activeSetup.id] })
      setEditingSetupItem(null)
    }
    setIsSavingSetupItem(false)
  }

  async function handleSaveSetup() {
    if (!editingSetup.name.trim()) return
    setIsSavingSetup(true)
    const { error } = await supabase
      .from('gear_setups')
      .update({
        name:        editingSetup.name.trim(),
        description: editingSetup.description.trim() || null,
        updated_at:  new Date().toISOString(),
      })
      .eq('id', activeSetup.id)
    if (error) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Erro ao salvar. Tente novamente.' })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-setups', user.id] })
      setActiveSetup(prev => ({ ...prev, name: editingSetup.name, description: editingSetup.description }))
      notifications.show({ color: 'green', position: 'top-center', message: 'Setup atualizado!' })
    }
    setIsSavingSetup(false)
  }

  // ── Handlers: criar setup ─────────────────────────────
  async function handleSetupImageUpload(file) {
    if (!file) return
    setIsUploadingSetupImg(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const authRes = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const { token: ikToken, expire, signature } = await authRes.json()
      const response = await upload({
        file,
        fileName: `${user.id}_setup`,
        folder: '/users/gear-setups/',
        tags: ['setup'],
        useUniqueFileName: true,
        publicKey:   import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
        token: ikToken, expire, signature,
      })
      const n = response.filePath.lastIndexOf('/')
      const fileName = response.filePath.substring(n + 1)
      setSetupImgFileId(response.fileId)
      setNewSetup(prev => ({ ...prev, image: fileName }))
    } catch {
      notifications.show({ color: 'red', position: 'top-center', message: 'Erro ao enviar imagem. Tente novamente.' })
    } finally {
      setIsUploadingSetupImg(false)
    }
  }

  async function handleCreateSetup() {
    if (!newSetup.name) return
    setIsCreatingSetup(true)
    const { error } = await supabase
      .from('gear_setups')
      .insert({
        id_user:     user.id,
        name:        newSetup.name.trim(),
        description: newSetup.description.trim() || null,
        image:       newSetup.image || null,
      })
    if (error) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Erro ao criar setup. Tente novamente.' })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-setups', user.id] })
      notifications.show({ color: 'green', position: 'top-center', message: 'Setup criado!' })
      setNewSetup({ name: '', description: '', image: '' })
      setSetupImgFileId('')
      closeNewSetup()
    }
    setIsCreatingSetup(false)
  }

  async function handleRemoveSetupImage() {
    if (!setupImgFileId) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/imagekit-manage`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ fileId: setupImgFileId }),
        }
      )
      if (!response.ok) throw new Error('Erro ao deletar no servidor')
      setNewSetup(prev => ({ ...prev, image: '' }))
      setSetupImgFileId('')
    } catch (err) {
      console.error(err)
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover imagem do servidor. Tente novamente.',
      })
    }
  }

  // ── Handlers: remover setup ───────────────────────────
  async function handleDeleteSetup() {
    setIsDeletingSetup(true)
    const { error } = await supabase
      .from('gear_setups')
      .delete()
      .eq('id', setupToDelete.id)
    if (error) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Erro ao remover setup.' })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-setups', user.id] })
      notifications.show({ color: 'green', position: 'top-center', message: 'Setup removido.' })
      closeConfirmDeleteSetup()
    }
    setIsDeletingSetup(false)
  }

  // ── Itens disponíveis para adicionar ao setup ─────────
  const setupItemProductIds = setupItems.map(i => i.products?.id)
  const gearAvailableForSetup = mainGear.filter(
    g => !setupItemProductIds.includes(g.products?.id)
  )

  // ── Render ────────────────────────────────────────────
  return (
    <>
      <Stack gap="lg">

        {/* ── Setups ──────────────────────────────────── */}
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap={6}>
                <ThemeIcon variant="transparent" color="dimmed" size="sm">
                  <IconRoute size={16} />
                </ThemeIcon>
                <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
                  Meus setups
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt={2}>
                Grupos de equipamentos para ocasiões específicas
              </Text>
            </div>
            <Button
              size="sm"
              variant="default"
              leftSection={<IconPlus size={13} />}
              onClick={openNewSetup}
            >
              Novo setup
            </Button>
          </Group>

          {loadingSetups ? (
            <Flex gap="md">
              {[1, 2, 3].map(i => <Skeleton key={i} width={80} height={90} radius="md" />)}
            </Flex>
          ) : userSetups.length === 0 ? (
            <Text size="sm" c="dimmed">Nenhum setup criado ainda.</Text>
          ) : (
            <Flex gap="md" wrap="wrap">
              {userSetups.map(setup => (
                <Flex key={setup.id} direction="column" align="center" gap={4} w={80}>
                  <Image
                    src={setup.image ? SETUP_IMG + setup.image : SETUP_IMG_FALLBACK}
                    h={70} w={70}
                    mb={4} 
                    radius="md" 
                    fit="cover"
                    style={{ cursor: 'pointer', opacity: setup.image ? 1 : 0.5 }}
                    onClick={() => handleOpenSetupDrawer(setup)}
                  />
                  <Text 
                    size="xs" fw={550} ta="center" 
                    lineClamp={1} 
                    style={{ lineHeight: 1.2 }}
                    title={setup.name}
                  >
                    {setup.name}
                  </Text>
                  <ActionIcon.Group>
                    <ActionIcon variant="default" size="lg" onClick={() => handleOpenSetupDrawer(setup)}>
                      <IconPencil size={14} />
                    </ActionIcon>
                    <ActionIcon
                      variant="default" size="lg" color="red"
                      onClick={() => { setSetupToDelete(setup); openConfirmDeleteSetup() }}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </ActionIcon.Group>
                </Flex>
              ))}
            </Flex>
          )}
        </Stack>

        <Divider />

        {/* ── Equipamentos ─────────────────────────────── */}
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap={6}>
                <ThemeIcon variant="transparent" color="dimmed" size="sm">
                  <IconPackages size={16} />
                </ThemeIcon>
                <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
                  Equipamentos ({mainGear.length})
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mt={2}>
                Adicionar, editar e remover itens
              </Text>
            </div>
            <Button
              size="sm"
              variant="default"
              leftSection={<IconPlus size={13} />}
              component={Link}
              to="/new/gear"
            >
              Adicionar
            </Button>
          </Group>

          {loadingGear ? (
            <Grid>
              {[1, 2, 3, 4].map(i => (
                <Grid.Col key={i} span={{ base: 6, sm: 4, md: 3 }}>
                  <Skeleton height={180} radius="md" />
                </Grid.Col>
              ))}
            </Grid>
          ) : mainGear.length === 0 ? (
            <Text size="sm" c="dimmed">
              Nenhum equipamento adicionado ainda.
            </Text>
          ) : (
            <Grid gutter="sm">
              {mainGear.map(item => (
                <Grid.Col key={item.id} span={{ base: 6, sm: 4, md: 3 }}>
                  <Card withBorder px="sm" shadow="sm">
                    <Card.Section bg="white" withBorder inheritPadding py="xs">
                      <Image
                        src={item.products?.picture ? PRODUCT_IMG + item.products.picture : undefined}
                        h={80} fit="contain" radius="sm"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenEditItem(item)}
                        fallbackSrc="https://placehold.co/160x160?text=?"
                      />
                    </Card.Section>
                    <Card.Section withBorder inheritPadding pt="xs" pb="sm">
                      <Stack gap={2} style={{ flex: 1 }}>
                        <Text size="xs" ta="center" truncate="end">
                          {item.products?.product_categories?.name_ptbr} · {item.products?.brands?.name}
                        </Text>
                        <Text 
                          size="sm" fw={500} ta="center" 
                          lineClamp={1}
                          style={{ lineHeight: 1 }}
                        >
                          {item.products?.name}
                        </Text>
                        <Flex mt="xs" gap={4} wrap="wrap" justify="center">
                          {item.is_featured        && <Badge size="xs" variant="light" color="yellow">Destaque</Badge>}
                          {item.is_currently_using && <Badge size="xs" variant="light" color="green">Em uso</Badge>}
                          {item.is_for_sale        && <Badge size="xs" variant="light" color="blue">À venda</Badge>}
                        </Flex>

                        {/* Sub itens */}
                        {subGear.filter(s => s.parent_gear_id === item.id).length > 0 && (
                          <Flex gap={4} justify="center" wrap="wrap">
                            {subGear.filter(s => s.parent_gear_id === item.id).map(s => (
                              <Avatar
                                key={s.id}
                                size={24}
                                radius="sm"
                                src={s.products?.picture ? PRODUCT_IMG + s.products.picture : undefined}
                                title={s.products?.name}
                              />
                            ))}
                          </Flex>
                        )}
                      </Stack>                    
                      <ActionIcon.Group mt={12} width="100%">
                        <ActionIcon
                          w="50%"
                          variant="default" 
                          size="md"
                          onClick={() => handleOpenEditItem(item)}
                          title="Editar item"
                        >
                          <IconPencil size={13} />
                        </ActionIcon>
                        <ActionIcon
                          w="50%"
                          variant="default" color="red"
                          size="md" 
                          onClick={() => handleOpenConfirmDelete(item)}
                          title="Remover item do meu equipamento"
                        >
                          <IconTrash size={13} />
                        </ActionIcon>
                      </ActionIcon.Group>
                    </Card.Section>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}
        </Stack>

      </Stack>

      {/* ── Modal: editar item ────────────────────────── */}
      <Modal
        title="Editar item"
        opened={editItemOpened}
        onClose={closeEditItem}
        size="sm"
        radius="md"
      >
        {editingItem && (
          <Stack gap="md">
            <Flex direction="column" align="center" gap={4}>
              <Image
                src={editingItem.picture ? PRODUCT_IMG + editingItem.picture : undefined}
                h={80} w={80} fit="contain" radius="sm"
                fallbackSrc="https://placehold.co/160x160?text=?"
              />
              <Text size="sm" c="dimmed">{editingItem.brand}</Text>
              <Text size="sm" fw={600} ta="center">{editingItem.name}</Text>
            </Flex>

            <Divider />

            <Switch
              label="Em destaque"
              description="Exibir entre os primeiros no perfil"
              checked={editingItem.is_featured}
              onChange={(e) => {
                const checked = e.currentTarget.checked
                setEditingItem(prev => ({ ...prev, is_featured: checked }))
              }}
            />
            <Switch
              label="Em uso atualmente"
              checked={editingItem.is_currently_using}
              onChange={(e) => {
                const checked = e.currentTarget.checked
                setEditingItem(prev => ({ ...prev, is_currently_using: checked }))
              }}
            />
            <Switch
              label="À venda"
              checked={editingItem.is_for_sale}
              onChange={(e) => {
                const checked = e.currentTarget.checked
                setEditingItem(prev => (
                  { ...prev, is_for_sale: checked, price: checked ? prev.price : '' }
                ))
              }}
            />
            {editingItem.is_for_sale && (
              <NumberInput
                label="Preço de venda (R$)"
                placeholder="0,00"
                min={0}
                decimalScale={2}
                fixedDecimalScale
                value={editingItem.price}
                onChange={(v) => setEditingItem(prev => ({ ...prev, price: v }))}
              />
            )}
            <Textarea
              label="Meus comentários"
              placeholder="Observações pessoais sobre este item..."
              autosize
              minRows={2}
              maxLength={500}
              value={editingItem.owner_comments}
              onChange={(e) => {
                const value = e.currentTarget.value
                setEditingItem(prev => ({ ...prev, owner_comments: value }))
              }}
            />

            <Group justify="flex-end" gap={8}>
              <Button variant="default" radius="xl" onClick={closeEditItem}>Cancelar</Button>
              <Button
                leftSection={<IconCheck size={15} />}
                loading={isSavingItem}
                onClick={handleSaveItem}
              >
                Salvar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* ── Modal: confirmar remoção de item ──────────── */}
      <Modal
        opened={confirmDeleteOpened}
        onClose={closeConfirmDelete}
        withCloseButton={false}
        size="xs"
        radius="md"
      >
        <Text size="sm">
          Remover <strong>{itemToDelete?.brand} {itemToDelete?.name}</strong> do seu equipamento?
        </Text>
        <Group justify="flex-end" gap={8} mt="md">
          <Button variant="default" size="sm" onClick={closeConfirmDelete}>Cancelar</Button>
          <Button color="red" size="sm" loading={isDeletingItem} onClick={handleDeleteItem}>
            Remover
          </Button>
        </Group>
      </Modal>

      {/* ── Modal: novo setup ─────────────────────────── */}
      <Modal
        title="Criar novo setup"
        opened={newSetupOpened}
        onClose={closeNewSetup}
        size="sm"
        radius="md"
      >
        <Stack gap="md">
          <TextInput
            label="Nome do setup"
            placeholder="Ex: Acústico"
            withAsterisk
            maxLength={50}
            value={newSetup.name}
            onChange={(e) => {
              const value = e.currentTarget.value
              setNewSetup(prev => ({ ...prev, name: value }))
            }}
          />
          <TextInput
            label="Descrição"
            placeholder="Ex: Para apresentações com violão e voz"
            maxLength={200}
            value={newSetup.description}
            onChange={(e) => {
              const value = e.currentTarget.value
              setNewSetup(prev => ({ ...prev, description: value }))
            }}
          />

          {/* Upload de imagem */}
          <Box>
            <Text size="sm" fw={500} mb={4}>Imagem (opcional)</Text>
            {newSetup.image ? (
              <Flex align="center" gap="sm">
                <Image
                  src={SETUP_IMG + newSetup.image}
                  h={60} w={60} radius="md" fit="cover"
                />
                <Button
                  size="xs" color="red" variant="light"
                  leftSection={<IconX size={13} />}
                  onClick={handleRemoveSetupImage}
                >
                  Remover
                </Button>
              </Flex>
            ) : (
              <Button
                size="xs"
                variant="default"
                leftSection={isUploadingSetupImg ? <Loader size={13} /> : <IconPhoto size={13} />}
                component="label"
                htmlFor="setup-image-input"
                disabled={isUploadingSetupImg}
              >
                {isUploadingSetupImg ? 'Enviando...' : 'Escolher imagem'}
              </Button>
            )}
            <input
              id="setup-image-input"
              type="file"
              accept="image/png,image/jpeg"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files?.[0]) handleSetupImageUpload(e.target.files[0]) }}
            />
          </Box>

          <Group justify="flex-end" gap={8}>
            <Button variant="default" radius="xl" onClick={closeNewSetup}>Cancelar</Button>
            <Button
              color="indigo" radius="xl"
              loading={isCreatingSetup}
              disabled={!newSetup.name}
              leftSection={<IconCheck size={15} />}
              onClick={handleCreateSetup}
            >
              Criar setup
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ── Modal: confirmar remoção de setup ─────────── */}
      <Modal
        opened={confirmDeleteSetupOpened}
        onClose={closeConfirmDeleteSetup}
        withCloseButton={false}
        size="xs"
        radius="md"
      >
        <Text size="sm">
          Remover o setup <strong>{setupToDelete?.name}</strong>?
          Os itens do setup serão desvinculados, mas não removidos do seu equipamento.
        </Text>
        <Group justify="flex-end" gap={8} mt="md">
          <Button variant="default" size="sm" onClick={closeConfirmDeleteSetup}>Cancelar</Button>
          <Button color="red" size="sm" loading={isDeletingSetup} onClick={handleDeleteSetup}>
            Remover
          </Button>
        </Group>
      </Modal>

      {/* ── Drawer: editar setup ──────────────────────── */}
      <Drawer
        opened={setupDrawerOpened}
        onClose={handleCloseSetupDrawer}
        title={activeSetup?.name ?? 'Setup'}
        position="right"
        size="sm"
      >
        <Stack gap="md">

          {/* ── Dados do setup ─────────────────────────── */}
          <Stack gap="sm">
            <TextInput
              label="Nome do setup"
              withAsterisk
              maxLength={50}
              value={editingSetup.name}
              onChange={(e) => {
                const value = e.currentTarget.value
                setEditingSetup(prev => ({ ...prev, name: value }))
              }}
            />
            <TextInput
              label="Descrição"
              maxLength={200}
              value={editingSetup.description}
              onChange={(e) => {
                const value = e.currentTarget.value
                setEditingSetup(prev => ({ ...prev, description: value }))
              }}
            />
            <Group justify="flex-end">
              <Button
                size="sm"
                variant="default"
                loading={isSavingSetup}
                disabled={!editingSetup.name.trim()}
                onClick={handleSaveSetup}
              >
                Atualizar
              </Button>
            </Group>
          </Stack>

          <Divider label="Itens do setup" labelPosition="left" />

          {/* ── Botão adicionar item ────────────────────── */}
          <Button
            size="sm"
            variant="light"
            color="indigo"
            leftSection={showAddToSetup ? <IconMinus size={13} /> : <IconPlus size={13} />}
            onClick={() => setShowAddToSetup(v => !v)}
          >
            {showAddToSetup ? 'Cancelar' : 'Adicionar item ao setup'}
          </Button>

          {showAddToSetup && (
            <NativeSelect
              size="sm"
              disabled={isAddingToSetup}
              value=""
              onChange={(e) => {
                if (e.currentTarget.value) handleAddToSetup(e.currentTarget.value)
              }}
            >
              <option value="">
                {isAddingToSetup
                  ? 'Adicionando...'
                  : gearAvailableForSetup.length === 0
                  ? 'Todos os itens já foram adicionados'
                  : 'Selecione o item para adicionar'}
              </option>
              {gearAvailableForSetup.map(g => (
                <option key={g.id} value={String(g.products?.id)}>
                  {g.products?.brands?.name} {g.products?.name}
                </option>
              ))}
            </NativeSelect>
          )}

          {/* ── Lista de itens do setup ─────────────────── */}
          {loadingSetupItems ? (
            <Stack gap="sm">
              {[1, 2].map(i => <Skeleton key={i} height={60} radius="md" />)}
            </Stack>
          ) : setupItems.length === 0 ? (
            <Text size="sm" c="dimmed">Nenhum item adicionado a este setup.</Text>
          ) : (
            <Stack gap="sm">
              {setupItems.map(item => (
                <Paper key={item.id} withBorder radius="md" p="sm">
                  <Flex justify="space-between" align="flex-start">
                    <Group gap="sm">
                      <Image
                        src={item.products?.picture ? PRODUCT_IMG + item.products.picture : undefined}
                        h={44} w={44} fit="contain" radius="sm"
                        fallbackSrc="https://placehold.co/80x80?text=?"
                      />
                      <Stack gap={2}>
                        <Text size="10px" c="dimmed">{item.products?.brands?.name}</Text>
                        <Text size="xs" fw={600} lineClamp={1}>{item.products?.name}</Text>
                        <Text size="10px" c="dimmed">Ordem: {item.order_show}</Text>
                      </Stack>
                    </Group>
                    <ActionIcon.Group>
                      {editingSetupItem?.id === item.id ? (
                        <ActionIcon
                          variant="default" size="md"
                          loading={isSavingSetupItem}
                          onClick={handleSaveSetupItem}
                        >
                          <Text size="xs" fw={600}>OK</Text>
                        </ActionIcon>
                      ) : (
                        <ActionIcon
                          variant="default" size="md"
                          onClick={() => setEditingSetupItem({
                            id:         item.id,
                            order_show: item.order_show,
                            comments:   item.comments ?? '',
                          })}
                        >
                          <IconPencil size={13} />
                        </ActionIcon>
                      )}
                      <ActionIcon
                        variant="default" size="md" color="red"
                        loading={isDeletingSetupItem === item.id}
                        onClick={() => handleDeleteSetupItem(item.id)}
                      >
                        <IconTrash size={13} />
                      </ActionIcon>
                    </ActionIcon.Group>
                  </Flex>

                  {/* ── Edição inline ───────────────────── */}
                  {editingSetupItem?.id === item.id && (
                    <Flex gap="sm" mt="sm">
                      <NumberInput
                        size="xs" label="Ordem" min={1} w={70}
                        value={editingSetupItem.order_show}
                        onChange={(v) => setEditingSetupItem(prev => ({ ...prev, order_show: v }))}
                      />
                      <TextInput
                        size="xs" label="Observação" style={{ flex: 1 }}
                        maxLength={300}
                        value={editingSetupItem.comments}
                        onChange={(e) => setEditingSetupItem(prev => ({ ...prev, comments: e.currentTarget.value }))}
                      />
                    </Flex>
                  )}
                </Paper>
              ))}
            </Stack>
          )}

        </Stack>
      </Drawer>
    </>
  )
}
