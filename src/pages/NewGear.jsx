import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchTunings, fetchProductColors } from '../queries/gear'
import {
  Affix,
  Grid,
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Divider,
  NativeSelect,
  Select,
  Image,
  Center,
  Flex,
  Switch,
  NumberInput,
  Textarea,
  ColorSwatch,
  Loader,
  Checkbox,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconCubePlus, IconChevronUp, IconPhoto } from '@tabler/icons-react'
import AppNavbarMobile from '../components/AppNavbarMobile'

const PRODUCT_IMG =
  'https://ik.imagekit.io/mublin/products/tr:h-600,w-600,cm-pad_resize,bg-FFFFFF/'
const COLOR_IMG = 'https://ik.imagekit.io/mublin/products/colors/'

// ── Queries locais ────────────────────────────────────────

async function fetchBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name')
    .eq('active', true)
    .order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchCategoriesByBrand(brandId) {
  const { data, error } = await supabase
    .from('products')
    .select('product_categories ( id, name_ptbr, macro_category )')
    .eq('id_brand', brandId)
    .eq('is_discontinued', false)
  if (error) {
    throw new Error(error.message)
  }
  const seen = new Set()
  return data
    .map((p) => p.product_categories)
    .filter((c) => c && !seen.has(c.id) && seen.add(c.id))
    .sort((a, b) => a.name_ptbr.localeCompare(b.name_ptbr))
}

async function fetchProductsByBrandAndCategory(brandId, categoryId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, picture, product_categories ( macro_category, name_en )')
    .eq('id_brand', brandId)
    .eq('id_category', categoryId)
    .order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchUserGearIds(userId) {
  const { data, error } = await supabase
    .from('profile_gear')
    .select('id_product')
    .eq('id_user', userId)
  if (error) {
    throw new Error(error.message)
  }
  return data.map((g) => g.id_product)
}

// Nova: busca 1 produto por id pra pré-seleção via URL
async function fetchProductById(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, id_brand, id_category, picture')
    .eq('id', productId)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// ── Componente principal ──────────────────────────────────

export default function NewGear() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const preselectedProductId = searchParams.get('id')
  const currentYear = new Date().getFullYear()
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

  // ── Queries ───────────────────────────────────────────
  const { data: brands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
    staleTime: 1000 * 60 * 60,
  })

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories-by-brand', brandSelected],
    queryFn: () => fetchCategoriesByBrand(brandSelected),
    enabled: !!brandSelected,
    staleTime: 1000 * 60 * 30,
  })

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products-by-brand-category', brandSelected, categorySelected],
    queryFn: () => fetchProductsByBrandAndCategory(brandSelected, categorySelected),
    enabled: !!brandSelected && !!categorySelected,
    staleTime: 1000 * 60 * 10,
  })

  const { data: productColors = [], isLoading: loadingColors } = useQuery({
    queryKey: ['product-colors', productSelected],
    queryFn: () => fetchProductColors(productSelected),
    enabled: !!productSelected,
    staleTime: 1000 * 60 * 10,
  })

  const { data: userGearIds = [] } = useQuery({
    queryKey: ['user-gear-ids', user?.id],
    queryFn: () => fetchUserGearIds(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  // 2) Nova query: busca produto da URL pra pré-selecionar
  const { data: preselectedProduct } = useQuery({
    queryKey: ['product-by-id', preselectedProductId],
    queryFn: () => fetchProductById(preselectedProductId),
    enabled: !!preselectedProductId,
  })

  useEffect(() => {
    if (preselectedProduct) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBrandSelected(String(preselectedProduct.id_brand))
      setCategorySelected(String(preselectedProduct.id_category))
      setProductSelected(String(preselectedProduct.id))
    }
  }, [preselectedProduct])

  // ── Produto selecionado ───────────────────────────────
  const productInfo = products.find((p) => p.id === Number(productSelected))
  const macroCategory = productInfo?.product_categories?.name_en ?? null
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

  function handleBrandChange(brandId) {
    setBrandSelected(brandId)
    setCategorySelected('')
    setProductSelected('')
    setSelectedColor(null)
  }

  function handleCategoryChange(categoryId) {
    setCategorySelected(categoryId)
    setProductSelected('')
    setSelectedColor(null)
  }

  function handleProductChange(productId) {
    setProductSelected(productId)
    setSelectedColor(null)
    setTuningSelected('')
  }

  async function handleSubmit() {
    if (!productSelected) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Selecione um produto.',
      })
      return
    }
    if (hasColors && !selectedColor) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Selecione uma das cores disponíveis.',
      })
      return
    }

    setIsSubmitting(true)
    const values = form.values

    const { error } = await supabase.from('profile_gear').insert({
      id_user: user.id,
      id_product: Number(productSelected),
      id_color: selectedColor?.colors?.id ?? null,
      id_tuning: tuningSelected ? Number(tuningSelected) : null,
      is_featured: values.is_featured,
      is_currently_using: values.is_currently_using,
      is_for_sale: values.is_for_sale,
      price: values.is_for_sale ? values.price || null : null,
      owner_comments: values.owner_comments || null,
      year: values.year || null,
    })

    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao salvar. Tente novamente.',
      })
      setIsSubmitting(false)
      return
    }

    if (shareOnFeed) {
      await supabase.from('feed').insert({
        author_profile_id: user.id,
        linked_product_id: Number(productSelected),
        body: 'Adicionei um item ao meu setup',
        is_active: true,
      })
    }

    queryClient.invalidateQueries({
      queryKey: ['user-gear-item', user.id, Number(productSelected)],
    })

    notifications.show({
      color: 'green',
      position: 'top-center',
      message: shareOnFeed
        ? 'Item adicionado ao seu equipamento e compartilhado no feed!'
        : 'Item adicionado ao seu equipamento!',
    })
    navigate('/settings/gear')
  }

  return (
    <>
      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Adicionar equipamento" />
      </Affix>
      <Container size="xl" py="sm" mt={{ base: 50, sm: 0 }}>
        <Group gap="xs" mb={4} visibleFrom="sm">
          <IconCubePlus size={32} />
          <Title order={1} fz="h3" ta="left" fw={600}>
            Adicionar equipamento
          </Title>
        </Group>
        <Text size="sm" c="dimmed" mb={20}>
          Selecione o item que será adicionado ao seu equipamento
        </Text>

        <Stack gap="md" mt={20}>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Marca"
                placeholder={loadingBrands ? 'Carregando...' : 'Selecione a marca'}
                searchable
                clearable
                nothingFoundMessage="Nenhuma marca encontrada"
                disabled={loadingBrands}
                value={brandSelected}
                onChange={handleBrandChange}
                data={brands.map((b) => ({ value: String(b.id), label: b.name }))}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Categoria"
                placeholder={
                  !brandSelected
                    ? 'Selecione primeiro a marca'
                    : loadingCategories
                      ? 'Carregando...'
                      : 'Selecione a categoria'
                }
                searchable
                clearable
                nothingFoundMessage="Nenhuma categoria encontrada"
                disabled={!brandSelected || loadingCategories}
                value={categorySelected}
                onChange={handleCategoryChange}
                data={categories.map((c) => ({
                  value: String(c.id),
                  label: c.name_ptbr,
                }))}
              />
            </Grid.Col>
          </Grid>

          <Select
            label="Produto"
            placeholder={
              !categorySelected
                ? 'Selecione primeiro a categoria'
                : loadingProducts
                  ? 'Carregando...'
                  : 'Selecione o produto'
            }
            searchable
            clearable
            nothingFoundMessage="Nenhum produto encontrado"
            disabled={!categorySelected || loadingProducts}
            value={productSelected}
            onChange={handleProductChange}
            data={products.map((p) => {
              const alreadyAdded = userGearIds.includes(p.id)
              return {
                value: String(p.id),
                label: p.name + (alreadyAdded ? ' (já adicionado)' : ''),
                disabled: alreadyAdded,
              }
            })}
          />

          {/* Resto do arquivo igual... */}
          {!productSelected && (
            <Center py="md">
              <Flex direction="column" align="center" gap={6}>
                <IconPhoto size={28} color="gray" />
                <Text size="xs" c="dimmed" ta="center">
                  Selecione o produto para visualizar a imagem
                </Text>
              </Flex>
            </Center>
          )}

          {productSelected && (
            <>
              {loadingColors && (
                <Center>
                  <Loader size="sm" />
                </Center>
              )}

              {!loadingColors && hasColors && (
                <Stack gap="xs">
                  <Text size="xs" ta="center">
                    {selectedColor
                      ? selectedColor.colors?.name_ptbr
                      : 'Selecione a cor do produto'}
                  </Text>
                  <Flex justify="center" gap={8} wrap="wrap">
                    {productColors.map((pc) => (
                      <Flex key={pc.id} direction="column" align="center" gap={2}>
                        <ColorSwatch
                          component="div"
                          color={
                            pc.colors?.img_sample
                              ? 'transparent'
                              : (pc.colors?.rgb ?? '#ccc')
                          }
                          withShadow={false}
                          onClick={() => setSelectedColor(pc)}
                          title={pc.colors?.name_ptbr}
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
                                  ? '2px solid var(--mantine-color-indigo-6)'
                                  : 'none',
                              outlineOffset: 2,
                            },
                          }}
                        />
                        {selectedColor?.id === pc.id && (
                          <IconChevronUp style={{ width: 14, height: 14 }} />
                        )}
                      </Flex>
                    ))}
                  </Flex>
                </Stack>
              )}

              {getDisplayImage() ? (
                <Center>
                  <Image
                    src={getDisplayImage()}
                    radius="md"
                    w={300}
                    h={300}
                    fallbackSrc="https://placehold.co/300x300?text=?"
                  />
                </Center>
              ) : hasColors && !selectedColor ? (
                <Center py="sm">
                  <Text size="xs" c="dimmed">
                    Selecione a cor para carregar a imagem
                  </Text>
                </Center>
              ) : null}
            </>
          )}

          <Divider />

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Switch
                label="Em destaque"
                description="Exibir entre os primeiros no perfil"
                checked={form.values.is_featured}
                disabled={!productSelected || loadingProducts}
                onChange={(e) => {
                  const checked = e.currentTarget.checked
                  form.setFieldValue('is_featured', checked)
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Switch
                label="Em uso atualmente"
                description="Utilizo este item em minhas gigs atuais"
                checked={form.values.is_currently_using}
                disabled={!productSelected || loadingProducts}
                onChange={(e) => {
                  const checked = e.currentTarget.checked
                  form.setFieldValue('is_currently_using', checked)
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Switch
                label="À venda"
                checked={form.values.is_for_sale}
                disabled={!productSelected || loadingProducts}
                onChange={(e) => {
                  const checked = e.currentTarget.checked
                  form.setFieldValue('is_for_sale', checked)
                  if (!checked) {
                    form.setFieldValue('price', '')
                  }
                }}
              />
              {form.values.is_for_sale && (
                <NumberInput
                  label="Preço de venda (R$)"
                  placeholder="0,00"
                  min={0}
                  decimalScale={2}
                  fixedDecimalScale
                  value={form.values.price}
                  onChange={(v) => form.setFieldValue('price', v)}
                />
              )}
            </Grid.Col>
          </Grid>

          {tunings.length > 0 && (
            <>
              <Divider />
              <NativeSelect
                label="Afinação atual"
                description="Opcional"
                value={tuningSelected}
                onChange={(e) => setTuningSelected(e.target.value)}
              >
                <option value="">Não informar</option>
                {tunings.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name_ptbr}
                    {t.description ? ` — ${t.description}` : ''}
                  </option>
                ))}
              </NativeSelect>
            </>
          )}

          <Divider />

          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label="Ano do meu item"
                description="Opcional"
                placeholder="Ex: 2014"
                min={1700}
                max={currentYear}
                value={form.values.year}
                disabled={!productSelected || loadingProducts}
                onChange={(value) => form.setFieldValue('year', value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Textarea
                label="Meus comentários sobre este item"
                description="Opcional"
                placeholder="Observações pessoais, configurações, etc."
                autosize
                minRows={1}
                maxRows={4}
                maxLength={420}
                value={form.values.owner_comments}
                disabled={!productSelected || loadingProducts}
                onChange={(e) =>
                  form.setFieldValue('owner_comments', e.currentTarget.value)
                }
              />
            </Grid.Col>
          </Grid>

          <Divider />

          <Group justify="space-between" align="center">
            <Checkbox
              label="Compartilhar no feed"
              color="indigo"
              checked={shareOnFeed}
              onChange={() => setShareOnFeed((v) => !v)}
            />
            <Group gap={8}>
              {/* <Button variant="default" onClick={() => navigate('/settings/gear')}>
                Cancelar
              </Button> */}
              <Button
                loading={isSubmitting}
                disabled={
                  !productSelected ||
                  userGearIds.includes(Number(productSelected)) ||
                  (hasColors && !selectedColor)
                }
                onClick={handleSubmit}
              >
                Salvar
              </Button>
            </Group>
          </Group>
        </Stack>
      </Container>
    </>
  )
}
