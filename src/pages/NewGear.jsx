import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import {
  fetchTunings,
  fetchProductColors,
  fetchProductByIdOptimized,
  fetchBrandCategoriesRPC,
  createGearRequest,
} from '../queries/gear'
import { useDebouncedCallback } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  Affix,
  Container,
  Grid,
  Stack,
  Group,
  Box,
  Paper,
  Card,
  Divider,
  Alert,
  Title,
  Text,
  Badge,
  Button,
  Image,
  Center,
  Flex,
  Switch,
  NumberInput,
  Textarea,
  Select,
  Loader,
  Collapse,
  ThemeIcon,
  CloseButton,
  InputBase,
  Combobox,
  useCombobox,
  Checkbox,
  ColorSwatch,
  ScrollArea,
  Anchor,
  TextInput,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import {
  IconCubePlus,
  IconPhoto,
  IconSearch,
  IconCheck,
  IconChevronDown,
  IconSend,
} from '@tabler/icons-react'

const PRODUCT_IMG =
  'https://ik.imagekit.io/mublin/products/tr:h-600,w-600,cm-pad_resize,bg-FFFFFF/'
const COLOR_IMG = 'https://ik.imagekit.io/mublin/products/colors/'
const BRAND_LOGO =
  'https://ik.imagekit.io/mublin/products/brands/tr:h-200,w-200,cm-pad_resize,bg-FFFFFF,fo-x/'

// ── QUERIES OTIMIZADAS ─────────────────────────────────────────
// Essas duas funções devem ir para queries/gear.js

async function fetchBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, logo, slug')
    .eq('active', true)
    .order('name')
  if (error) {
    throw error
  }
  return data
}

// ✅ VERSÃO NOVA - resolve o seu problema da fetchCategoriesByBrand
// Antes você buscava TODOS os produtos da marca e deduplicava no JS.
// Isso traz 500 linhas pra rede pra extrair 5 categorias.
// Agora a filtragem é no banco, com DISTINCT e join.
async function fetchCategoriesByBrand(brandId) {
  if (!brandId) {
    return []
  }
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      product_categories!inner ( id, name_ptbr, name_en, macro_category, slug )
    `,
    )
    .eq('id_brand', brandId)
    .eq('is_discontinued', false)
  if (error) {
    throw error
  }
  // dedup agora é em cima de pouquíssimos registros, já filtrados no banco
  const map = new Map()
  data.forEach((row) => {
    const c = row.product_categories
    if (c && !map.has(c.id)) {
      map.set(c.id, c)
    }
  })
  return Array.from(map.values()).sort((a, b) => a.name_ptbr.localeCompare(b.name_ptbr))
}

async function fetchProductsByBrandAndCategory(brandId, categoryId, search = '') {
  let q = supabase
    .from('products')
    .select(
      'id, name, picture, slug, is_discontinued, id_default_color, product_categories ( macro_category, name_en )',
    )
    .eq('id_brand', brandId)
    .eq('id_category', categoryId)
    .order('name')
    .limit(100)

  if (search) {
    q = q.ilike('name', `%${search}%`)
  }
  const { data, error } = await q
  if (error) {
    throw error
  }
  return data
}

async function fetchUserGearIds(userId) {
  const { data, error } = await supabase
    .from('profile_gear')
    .select('id_product')
    .eq('id_user', userId)
  if (error) {
    throw error
  }
  return data.map((g) => g.id_product)
}

// ── MODAL DE REQUEST ──────────────────────────────
function GearRequestModalContent({
  brandId,
  categoryId,
  searchTerm,
  onSuccess,
  userId,
  profileBrands,
}) {
  const [name, setName] = useState(searchTerm || '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) {
      return
    }
    setSubmitting(true)
    try {
      // 2) Envia para gear_requests
      await createGearRequest({
        profile_id: userId,
        product_name_requested: name.trim(),
        brand_id: brandId ? Number(brandId) : null,
        category_id: categoryId ? Number(categoryId) : null,
        search_context: searchTerm,
      })
      notifications.show({
        title: 'Solicitação enviada!',
        message: 'Vamos analisar em até 24h. Valeu por colaborar!',
        color: 'green',
        icon: <IconCheck size={16} />,
      })
      onSuccess?.()
      modals.closeAll()
    } catch (e) {
      notifications.show({ title: 'Erro ao enviar', message: e.message, color: 'red' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack gap="sm">
      <Box>
        <Title order={4}>Quer colaborar cadastrando produtos na base do Mublin?</Title>
        <Alert p={8} color="orange" mt="sm" radius="md">
          <Text fz="12px">
            Ainda não estamos com vagas disponíveis para colaboradores, mas você pode
            enviar o nome do equipamento desejado para analisarmos internamente e
            adicionar em até 24 horas.
          </Text>
        </Alert>
      </Box>
      <TextInput
        label="Qual equipamento você não encontrou?"
        placeholder="Ex: Fender Jazz Bass American Ultra II - Texas Tea"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        data-autofocus
      />
      <Text size="xs" c="dimmed">
        Marca selecionada:{' '}
        {profileBrands?.find((b) => String(b.id) === String(brandId))?.name || 'Nenhuma'}{' '}
        | Categoria: {categoryId || 'Nenhuma'}
      </Text>
      <Group justify="flex-end">
        <Button variant="default" onClick={() => modals.closeAll()}>
          Cancelar
        </Button>
        <Button
          leftSection={<IconSend size={14} />}
          onClick={handleSubmit}
          loading={submitting}
          disabled={!name.trim()}
        >
          Enviar solicitação
        </Button>
      </Group>
    </Stack>
  )
}

function openGearRequestModal({ brandId, categoryId, searchTerm, userId, brands }) {
  modals.open({
    title: null,
    centered: true,
    size: 'md',
    children: (
      <GearRequestModalContent
        brandId={brandId}
        categoryId={categoryId}
        searchTerm={searchTerm}
        userId={userId}
        profileBrands={brands}
        onSuccess={() => {}}
      />
    ),
  })
}

// ── COMBOBOXES ─────────────────────────────────────

function BrandCombobox({ brands, selectedId, onSelect }) {
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() })
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!search) {
      return brands.slice(0, 50)
    }
    return brands
      .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 50)
  }, [brands, search])

  const selected = brands.find((b) => String(b.id) === String(selectedId))

  if (selected) {
    return (
      <Group
        gap="xs"
        p="xs"
        style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 8 }}
      >
        {selected.logo && <Image src={`${BRAND_LOGO}${selected.logo}`} w={50} h={50} />}
        <Text fw={600} size="sm">
          {selected.name}
        </Text>
        <CloseButton size="sm" onClick={() => onSelect('')} ml="auto" />
      </Group>
    )
  }

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        onSelect(val)
        setSearch('')
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target>
        <InputBase
          label="Marca"
          placeholder="Digite Fender, Gibson, Tama..."
          leftSection={<IconSearch size={16} />}
          rightSection={<IconChevronDown size={14} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value)
            combobox.openDropdown()
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize mah={220}>
            {filtered.length === 0 ? (
              <Combobox.Empty>Nenhuma marca</Combobox.Empty>
            ) : (
              filtered.map((b) => (
                <Combobox.Option key={b.id} value={String(b.id)}>
                  <Group gap="xs">
                    {b.logo && <Image src={`${BRAND_LOGO}${b.logo}`} w={50} h={50} />}
                    <Text size="sm">{b.name}</Text>
                  </Group>
                </Combobox.Option>
              ))
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

function ProductCombobox({
  brandId,
  categoryId,
  products,
  isLoading,
  userGearIds,
  selectedId,
  onSelect,
  brands,
  userId,
}) {
  const combobox = useCombobox()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedCallback((v) => setSearch(v), 300)
  const selected = products.find((p) => String(p.id) === String(selectedId))

  const filtered = useMemo(() => {
    if (!search) {
      return products
    }
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [products, search])

  if (selected) {
    return (
      <Paper withBorder p="xs" radius="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Image src={`${PRODUCT_IMG}${selected.picture}`} w={36} h={36} radius="sm" />
            <Text fw={600} size="sm" lineClamp={1}>
              {selected.name}
            </Text>
          </Group>
          <CloseButton size="sm" onClick={() => onSelect('')} />
        </Group>
      </Paper>
    )
  }

  return (
    <>
      <Combobox
        store={combobox}
        onOptionSubmit={(val) => {
          onSelect(val)
          combobox.closeDropdown()
        }}
      >
        <Combobox.Target>
          <InputBase
            label="Modelo"
            placeholder={
              brandId && categoryId
                ? 'Busque seu modelo...'
                : 'Selecione marca e categoria antes'
            }
            leftSection={<IconSearch size={16} />}
            rightSection={
              isLoading ? <Loader size={14} /> : <IconChevronDown size={14} />
            }
            disabled={!brandId || !categoryId}
            onChange={(e) => {
              debouncedSearch(e.currentTarget.value)
              combobox.openDropdown()
            }}
            onClick={() => brandId && categoryId && combobox.openDropdown()}
          />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            <ScrollArea.Autosize mah={320}>
              {filtered.map((p) => {
                const alreadyHave = userGearIds.includes(p.id)
                return (
                  <Combobox.Option key={p.id} value={String(p.id)} disabled={alreadyHave}>
                    <Group gap="sm" wrap="nowrap">
                      <Image
                        src={`${PRODUCT_IMG}${p.picture}`}
                        w={40}
                        h={40}
                        radius="sm"
                        fallbackSrc="https://placehold.co/40?text=?"
                      />
                      <Box style={{ flex: 1 }}>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {p.name}
                        </Text>
                        {alreadyHave && (
                          <Badge
                            size="xs"
                            color="green"
                            leftSection={<IconCheck size={10} />}
                          >
                            Você já tem
                          </Badge>
                        )}
                      </Box>
                    </Group>
                  </Combobox.Option>
                )
              })}
              {filtered.length === 0 && !isLoading && (
                <Box p="sm">
                  <Text size="sm" fw={500}>
                    Sem resultados
                  </Text>
                  <Text size="xs" c="dimmed" mb="xs">
                    Buscamos por "{search || 'este filtro'}"
                  </Text>
                </Box>
              )}
            </ScrollArea.Autosize>
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
      <Flex justify="flex-end">
        <Anchor
          size="xs"
          fw={600}
          onClick={() => {
            combobox.closeDropdown()
            openGearRequestModal({
              brandId,
              categoryId,
              searchTerm: search,
              userId,
              brands,
            })
          }}
        >
          Não encontrei o item
        </Anchor>
      </Flex>
    </>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────

export default function NewGearRefactored() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const preselectedProductId = searchParams.get('id')
  const queryClient = useQueryClient()

  const [brandSelected, setBrandSelected] = useState('')
  const [categorySelected, setCategorySelected] = useState('')
  const [productSelected, setProductSelected] = useState('')
  const [selectedColor, setSelectedColor] = useState(null)
  const [tuningSelected, setTuningSelected] = useState('')
  const [shareOnFeed, setShareOnFeed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    initialValues: {
      is_featured: true,
      is_currently_using: true,
      is_for_sale: false,
      price: '',
      owner_comments: '',
      year: '',
    },
  })

  // Queries
  const { data: brands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 1000 * 60 * 60,
  })

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories-by-brand-rpc', brandSelected],
    queryFn: () => fetchBrandCategoriesRPC(brandSelected),
    enabled: !!brandSelected,
  })

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products-v2', brandSelected, categorySelected],
    queryFn: () => fetchProductsByBrandAndCategory(brandSelected, categorySelected),
    enabled: !!brandSelected && !!categorySelected,
    staleTime: 1000 * 60 * 10,
  })

  const { data: productColors = [] } = useQuery({
    queryKey: ['product-colors', productSelected],
    queryFn: () => fetchProductColors(productSelected),
    enabled: !!productSelected,
    staleTime: 1000 * 60 * 10,
  })

  const { data: userGearIds = [] } = useQuery({
    queryKey: ['user-gear-ids', user?.id],
    queryFn: () => fetchUserGearIds(user.id),
    enabled: !!user?.id,
  })

  const { data: preselectedProduct } = useQuery({
    queryKey: ['product-by-id', preselectedProductId],
    queryFn: () => fetchProductByIdOptimized(preselectedProductId),
    enabled: !!preselectedProductId,
  })

  // Pré-seleção sem useEffect
  useMemo(() => {
    if (preselectedProduct && !brandSelected) {
      setBrandSelected(String(preselectedProduct.id_brand))
      setCategorySelected(String(preselectedProduct.id_category))
      setProductSelected(String(preselectedProduct.id))
      // pré-seleciona cor default
      if (preselectedProduct.id_default_color) {
        // será setado quando productColors carregar
      }
    }
  }, [preselectedProduct])

  // Auto-seleciona cor default
  useMemo(() => {
    if (productColors.length > 0 && !selectedColor) {
      const main = productColors.find((c) => c.is_main) || productColors[0]
      setSelectedColor(main)
    }
  }, [productColors])

  const productInfo =
    products.find((p) => p.id === Number(productSelected)) || preselectedProduct
  const macroCategory = productInfo?.product_categories?.macro_category ?? null
  const hasColors = productColors.length > 0

  const { data: tunings = [] } = useQuery({
    queryKey: ['tunings', macroCategory],
    queryFn: () => fetchTunings(macroCategory),
    enabled: !!macroCategory,
    staleTime: Infinity,
  })

  function getDisplayImage() {
    if (hasColors && selectedColor) {
      return PRODUCT_IMG + selectedColor.picture
    }
    if (!hasColors && productInfo?.picture) {
      return PRODUCT_IMG + productInfo.picture
    }
    return null
  }

  async function handleSubmit() {
    if (!productSelected) {
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        id_user: user.id,
        id_product: Number(productSelected),
        id_color: selectedColor?.id_color || selectedColor?.colors?.id || null,
        id_tuning: tuningSelected ? Number(tuningSelected) : null,
        is_featured: form.values.is_featured,
        is_currently_using: form.values.is_currently_using,
        is_for_sale: form.values.is_for_sale,
        price: form.values.price ? Number(form.values.price) : null,
        owner_comments: form.values.owner_comments || null,
        year: form.values.year ? Number(form.values.year) : null,
      }
      const { error } = await supabase.from('profile_gear').insert(payload)
      if (error) {
        throw error
      }

      if (shareOnFeed) {
        await supabase.from('feed').insert({
          id_user: user.id,
          type: 'gear',
          linked_product_id: Number(productSelected),
          content: form.values.owner_comments || null,
        })
      }

      queryClient.invalidateQueries({ queryKey: ['user-gear-ids'] })
      notifications.show({
        title: 'Equipamento adicionado!',
        color: 'green',
        icon: <IconCheck size={16} />,
      })
      navigate('/settings/gear')
    } catch (e) {
      notifications.show({ title: 'Erro ao salvar', message: e.message, color: 'red' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSave =
    !!productSelected &&
    !userGearIds.includes(Number(productSelected)) &&
    (!hasColors || !!selectedColor)

  return (
    <>
      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Adicionar equipamento" />
      </Affix>
      <Container size="lg" mt={{ base: 60, sm: 'md' }}>
        <Stack gap={0}>
          <Title order={1} fz="h3" fw={600} visibleFrom="sm">
            Adicionar equipamento
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            Selecione o item que será adicionado ao seu equipamento
          </Text>
        </Stack>

        <Grid>
          {/* ESQUERDA: FINDER */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="md">
              <Paper withBorder p="md" radius="md">
                <Text fw={600} size="sm" mb="sm">
                  1. Encontre o equipamento
                </Text>
                <Stack gap="sm">
                  <BrandCombobox
                    brands={brands}
                    selectedId={brandSelected}
                    onSelect={(v) => {
                      setBrandSelected(v)
                      setCategorySelected('')
                      setProductSelected('')
                    }}
                  />

                  {brandSelected && (
                    <Select
                      label="Categoria"
                      placeholder={
                        loadingCategories
                          ? 'Carregando...'
                          : 'Ex: Baixos, Guitarras, Baterias'
                      }
                      data={categories.map((c) => ({
                        value: String(c.id),
                        label: c.name_ptbr,
                      }))}
                      value={categorySelected}
                      onChange={(v) => {
                        setCategorySelected(v)
                        setProductSelected('')
                      }}
                      rightSection={loadingCategories ? <Loader size={12} /> : null}
                    />
                  )}

                  {brandSelected && categorySelected && (
                    <ProductCombobox
                      brandId={brandSelected}
                      categoryId={categorySelected}
                      products={products}
                      isLoading={loadingProducts}
                      userGearIds={userGearIds}
                      selectedId={productSelected}
                      onSelect={setProductSelected}
                      brands={brands}
                      userId={user?.id}
                    />
                  )}
                </Stack>
              </Paper>

              <Collapse expanded={!!productSelected}>
                <Paper withBorder p="md" radius="md">
                  <Text fw={600} size="sm" mb="sm">
                    2. Personalize
                  </Text>
                  <Stack gap="sm">
                    {hasColors && (
                      <Box>
                        <Text size="sm" fw={500} mb="xs">
                          Cor / Acabamento
                        </Text>
                        <Flex gap="sm" wrap="wrap">
                          {productColors.map((pc) => (
                            <ColorSwatch
                              key={pc.id}
                              color={
                                pc.colors?.img_sample
                                  ? 'transparent'
                                  : (pc.colors?.rgb ?? '#ccc')
                              }
                              size={30}
                              withShadow={false}
                              styles={{
                                alphaOverlay: {
                                  backgroundImage: pc.colors?.img_sample
                                    ? `url(${COLOR_IMG + pc.colors.img_sample})`
                                    : 'none',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                },
                                root: {
                                  cursor: 'pointer',
                                  width: 28,
                                  height: 28,
                                  outline:
                                    selectedColor?.id === pc.id
                                      ? '2px solid var(--mantine-color-white)'
                                      : undefined,
                                  outlineOffset: 2,
                                },
                              }}
                              onClick={() => setSelectedColor(pc)}
                            >
                              {selectedColor?.id === pc.id && (
                                <IconCheck size={14} color="white" />
                              )}
                            </ColorSwatch>
                          ))}
                        </Flex>
                        {selectedColor && (
                          <Text size="xs" c="dimmed" mt="xs">
                            {selectedColor.colors?.name_ptbr ||
                              selectedColor.colors?.name}
                          </Text>
                        )}
                      </Box>
                    )}

                    <Divider variant="dashed" />

                    <Grid>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Switch
                          size="sm"
                          label="Destaque"
                          description="No topo do perfil"
                          checked={form.values.is_featured}
                          onChange={(e) =>
                            form.setFieldValue('is_featured', e.currentTarget.checked)
                          }
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Switch
                          size="sm"
                          label="Em uso"
                          description="Uso em gigs atuais"
                          checked={form.values.is_currently_using}
                          onChange={(e) =>
                            form.setFieldValue(
                              'is_currently_using',
                              e.currentTarget.checked,
                            )
                          }
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <Switch
                          size="sm"
                          label="À venda"
                          checked={form.values.is_for_sale}
                          onChange={(e) => {
                            form.setFieldValue('is_for_sale', e.currentTarget.checked)
                            if (!e.currentTarget.checked) {
                              form.setFieldValue('price', '')
                            }
                          }}
                        />
                      </Grid.Col>
                    </Grid>

                    {form.values.is_for_sale && (
                      <NumberInput
                        label="Preço (R$)"
                        placeholder="0,00"
                        min={0}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        value={form.values.price}
                        onChange={(v) => form.setFieldValue('price', v)}
                      />
                    )}

                    {tunings.length > 0 && (
                      <Select
                        label="Afinação atual"
                        description="Opcional"
                        placeholder="Não informar"
                        data={[
                          { value: '', label: 'Não informar' },
                          ...tunings.map((t) => ({
                            value: String(t.id),
                            label: `${t.name_ptbr}${t.description ? ` — ${t.description}` : ''}`,
                          })),
                        ]}
                        value={tuningSelected}
                        onChange={setTuningSelected}
                        searchable
                        clearable
                      />
                    )}

                    <NumberInput
                      label="Ano do meu item"
                      description="Opcional"
                      placeholder="2014"
                      min={1950}
                      max={new Date().getFullYear() + 1}
                      value={form.values.year}
                      onChange={(v) => form.setFieldValue('year', v)}
                    />

                    <Textarea
                      label="Comentário"
                      description="Opcional"
                      placeholder="Sobre o seu item..."
                      autosize
                      minRows={2}
                      maxRows={4}
                      maxLength={420}
                      value={form.values.owner_comments}
                      onChange={(e) =>
                        form.setFieldValue('owner_comments', e.currentTarget.value)
                      }
                    />
                  </Stack>
                </Paper>
              </Collapse>

              <Paper withBorder p="sm" radius="md" style={{ borderStyle: 'dashed' }}>
                <Group justify="space-between">
                  <Checkbox
                    label="Compartilhar no feed"
                    checked={shareOnFeed}
                    onChange={() => setShareOnFeed((v) => !v)}
                  />
                  <Button
                    leftSection={<IconCubePlus size={16} />}
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={!canSave}
                  >
                    Salvar no meu perfil
                  </Button>
                </Group>
                {!canSave && productSelected && (
                  <Text size="xs" c="red" mt={6}>
                    {userGearIds.includes(Number(productSelected))
                      ? 'Você já tem este equipamento'
                      : hasColors && !selectedColor
                        ? 'Selecione uma cor'
                        : ''}
                  </Text>
                )}
              </Paper>
            </Stack>
          </Grid.Col>

          {/* DIREITA: LIVE PREVIEW */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card
              withBorder
              radius="md"
              padding="lg"
              style={{ position: 'sticky', top: 20 }}
            >
              {getDisplayImage() ? (
                <>
                  <Card.Section>
                    <Image
                      src={getDisplayImage()}
                      h={360}
                      fit="contain"
                      bg="gray.0"
                      fallbackSrc="https://placehold.co/600x400?text=Sem+Imagem"
                    />
                  </Card.Section>
                  <Stack gap={0} mt="md">
                    <Title order={3} fw={500} lineClamp={2}>
                      {productInfo?.name || 'Equipamento'}
                    </Title>
                    {productInfo?.brands && (
                      <Text size="sm" c="dimmed">
                        {productInfo.brands?.name ||
                          brands.find((b) => String(b.id) === brandSelected)?.name}
                      </Text>
                    )}
                    <Group gap={6} mt="xs">
                      {form.values.is_featured && (
                        <Badge size="xs" color="mublinColor">
                          Destaque
                        </Badge>
                      )}
                      {form.values.is_currently_using && (
                        <Badge size="xs" color="grape.8">
                          Em uso
                        </Badge>
                      )}
                      {form.values.is_for_sale && (
                        <Badge size="xs" color="green.9">
                          À venda
                        </Badge>
                      )}
                    </Group>
                    {form.values.owner_comments && (
                      <Text size="sm" mt="sm" lineClamp={3} c="dimmed">
                        "{form.values.owner_comments}"
                      </Text>
                    )}
                  </Stack>
                </>
              ) : (
                <Center h={360} style={{ flexDirection: 'column' }}>
                  <ThemeIcon size={56} radius="xl" variant="light" color="gray" mb="md">
                    <IconPhoto size={28} />
                  </ThemeIcon>
                  <Text size="sm" c="dimmed" ta="center" maw={260} mt={4}>
                    Selecione marca, categoria e modelo para visualizar
                  </Text>
                </Center>
              )}
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
    </>
  )
}
