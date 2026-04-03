import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchTunings, fetchProductColors } from '../queries/gear'
import { supabase } from '../lib/supabaseClient'
import {
  Container, Title, Text, Stack, Group, Button, Divider,
  NativeSelect, Image, Center, Flex, Switch, NumberInput,
  Textarea, ColorSwatch, Loader, Box, ThemeIcon, Checkbox,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconCubePlus, IconChevronUp, IconPhoto } from '@tabler/icons-react'

const PRODUCT_IMG = 'https://ik.imagekit.io/mublin/products/tr:h-600,w-600,cm-pad_resize,bg-FFFFFF/'
const COLOR_IMG   = 'https://ik.imagekit.io/mublin/products/colors/'

// ── Queries locais ────────────────────────────────────────

async function fetchBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name')
    .eq('active', true)
    .order('name')
  if (error) throw new Error(error.message)
  return data
}

async function fetchCategoriesByBrand(brandId) {
  const { data, error } = await supabase
    .from('products')
    .select('product_categories ( id, name_ptbr, macro_category )')
    .eq('id_brand', brandId)
    .eq('is_discontinued', false)
  if (error) throw new Error(error.message)
  // Deduplica categorias
  const seen = new Set()
  return data
    .map(p => p.product_categories)
    .filter(c => c && !seen.has(c.id) && seen.add(c.id))
    .sort((a, b) => a.name_ptbr.localeCompare(b.name_ptbr))
}

async function fetchProductsByBrandAndCategory(brandId, categoryId) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, picture, product_categories ( macro_category, name_en )')
    .eq('id_brand', brandId)
    .eq('id_category', categoryId)
    .order('name')
  if (error) throw new Error(error.message)
  return data
}

async function fetchUserGearIds(userId) {
  const { data, error } = await supabase
    .from('profile_gear')
    .select('id_product')
    .eq('id_user', userId)
  if (error) throw new Error(error.message)
  return data.map(g => g.id_product)
}

// ── Componente principal ──────────────────────────────────

export default function NewGear() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [brandSelected,    setBrandSelected]    = useState('')
  const [categorySelected, setCategorySelected] = useState('')
  const [productSelected,  setProductSelected]  = useState('')
  const [selectedColor,    setSelectedColor]    = useState(null)
  const [tuningSelected, setTuningSelected] = useState('')
  const [shareOnFeed,      setShareOnFeed]      = useState(true)
  const [isSubmitting,     setIsSubmitting]     = useState(false)

  // ── Form ──────────────────────────────────────────────
  const form = useForm({
    initialValues: {
      is_featured:        false,
      is_currently_using: true,
      is_for_sale:        false,
      price:              '',
      owner_comments:     '',
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

  // ── Produto selecionado ───────────────────────────────
  const productInfo = products.find(p => p.id === Number(productSelected))
  const macroCategory = productInfo?.product_categories?.name_en ?? null
  const hasColors = productColors.length > 0

  const { data: tunings = [] } = useQuery({
    queryKey: ['tunings', macroCategory],
    queryFn: () => fetchTunings(macroCategory),
    enabled: !!macroCategory,
    staleTime: Infinity,
  })

  // ── Imagem a exibir ───────────────────────────────────
  function getDisplayImage() {
    if (hasColors && selectedColor) return PRODUCT_IMG + selectedColor.picture
    if (!hasColors && productInfo?.picture) return PRODUCT_IMG + productInfo.picture
    return null
  }

  // ── Handlers de seleção em cascata ───────────────────
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
    setTuningSelected('')  // ← adiciona esta linha
  }

  // ── Submit ────────────────────────────────────────────
  async function handleSubmit() {
    if (!productSelected) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Selecione um produto.' })
      return
    }
    if (hasColors && !selectedColor) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Selecione uma das cores disponíveis.' })
      return
    }

    setIsSubmitting(true)
    const values = form.values

    // 1. Insere o item no equipamento
    const { error } = await supabase
      .from('profile_gear')
      .insert({
        id_user:            user.id,
        id_product:         Number(productSelected),
        id_color:           selectedColor?.colors?.id ?? null,
        id_tuning:          tuningSelected ? Number(tuningSelected) : null,
        is_featured:        values.is_featured,
        is_currently_using: values.is_currently_using,
        is_for_sale:        values.is_for_sale,
        price:              values.is_for_sale ? (values.price || null) : null,
        owner_comments:     values.owner_comments || null,
      })

    if (error) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Erro ao salvar. Tente novamente.' })
      setIsSubmitting(false)
      return
    }

    // 2. Compartilha no feed se marcado
    if (shareOnFeed) {
      await supabase
        .from('feed')
        .insert({
          author_profile_id: user.id,
          linked_product_id: Number(productSelected),
          body:              'Adicionei um item ao meu setup',
          is_active:         true,
        })
    }

    notifications.show({
      color: 'green',
      position: 'top-center',
      message: shareOnFeed
        ? 'Item adicionado ao seu equipamento e compartilhado no feed!'
        : 'Item adicionado ao seu equipamento!',
    })
    navigate('/settings/gear')
  }

  // ── Render ────────────────────────────────────────────
  return (
    <Container size="xs" py="md">
      <Title order={2} fz="h4" fw={600} lts="-0.02em">
        Adicionar equipamento
      </Title>
      <Text size="sm" c="dimmed">
        Selecione o produto que será adicionado
      </Text>

      <Stack gap="md" mt={20}>

        {/* ── Seleção em cascata ─────────────────────── */}
        <NativeSelect
          withAsterisk
          label="Marca"
          disabled={loadingBrands}
          value={brandSelected}
          onChange={(e) => handleBrandChange(e.target.value)}
        >
          <option value="">
            {loadingBrands ? 'Carregando...' : 'Selecione a marca'}
          </option>
          {brands.map(b => (
            <option key={b.id} value={String(b.id)}>{b.name}</option>
          ))}
        </NativeSelect>

        <NativeSelect
          withAsterisk
          label="Categoria"
          disabled={!brandSelected || loadingCategories}
          value={categorySelected}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <option value="">
            {!brandSelected
              ? 'Selecione primeiro a marca'
              : loadingCategories ? 'Carregando...' : 'Selecione a categoria'}
          </option>
          {categories.map(c => (
            <option key={c.id} value={String(c.id)}>{c.name_ptbr}</option>
          ))}
        </NativeSelect>

        <NativeSelect
          withAsterisk
          label="Produto"
          disabled={!categorySelected || loadingProducts}
          value={productSelected}
          onChange={(e) => handleProductChange(e.target.value)}
        >
          <option value="">
            {!categorySelected
              ? 'Selecione primeiro a categoria'
              : loadingProducts ? 'Carregando...' : 'Selecione o produto'}
          </option>
          {products.map(p => {
            const alreadyAdded = userGearIds.includes(p.id)
            return (
              <option key={p.id} value={String(p.id)} disabled={alreadyAdded}>
                {p.name}{alreadyAdded ? ' (já adicionado)' : ''}
              </option>
            )
          })}
        </NativeSelect>

        {/* ── Preview do produto ────────────────────── */}
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
            {/* Cores disponíveis */}
            {loadingColors && (
              <Center><Loader size="sm" /></Center>
            )}

            {!loadingColors && hasColors && (
              <Stack gap="xs">
                <Text size="xs" ta="center">
                  {selectedColor
                    ? selectedColor.colors?.name_ptbr
                    : 'Selecione a cor do produto'}
                </Text>
                <Flex justify="center" gap={8} wrap="wrap">
                  {productColors.map(pc => (
                    <Flex key={pc.id} direction="column" align="center" gap={2}>
                      <ColorSwatch
                        component="div" // Garante que se comporte como uma div clicável
                        color={pc.colors?.img_sample ? 'transparent' : (pc.colors?.rgb ?? '#ccc')}
                        withShadow={false}
                        onClick={() => setSelectedColor(pc)}
                        title={pc.colors?.name_ptbr}
                        styles={{
                          alphaOverlay: {
                            // Se houver imagem, aplicamos ela no overlay interno
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
                            outline: selectedColor?.id === pc.id
                              ? '2px solid var(--mantine-color-indigo-6)'
                              : 'none',
                            outlineOffset: 2,
                          }
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

            {/* Imagem do produto */}
            {getDisplayImage() ? (
              <Center>
                <Image
                  src={getDisplayImage()}
                  radius='md'
                  w={300}
                  h={300}
                  // onClick={() => setModalZoomOpen(true)}
                  // style={{cursor:'pointer'}}
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

        {/* ── Opções do item ────────────────────────── */}
        <Switch
          label="Em destaque"
          description="Exibir entre os primeiros no perfil"
          checked={form.values.is_featured}
          onChange={(e) => {
            const checked = e.currentTarget.checked
            form.setFieldValue('is_featured', checked)
          }}
        />

        <Switch
          label="Em uso atualmente"
          description="Presente em algum dos meus setups"
          checked={form.values.is_currently_using}
          onChange={(e) => {
            const checked = e.currentTarget.checked
            form.setFieldValue('is_currently_using', checked)
          }}
        />

        <Switch
          label="À venda"
          checked={form.values.is_for_sale}
          onChange={(e) => {
            const checked = e.currentTarget.checked
            form.setFieldValue('is_for_sale', checked)
            if (!checked) form.setFieldValue('price', '')
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

        {/* Afinação — só para macro_category 'chords' */}
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
              {tunings.map(t => (
                <option key={t.id} value={String(t.id)}>
                  {t.name_ptbr}{t.description ? ` — ${t.description}` : ''}
                </option>
              ))}
            </NativeSelect>
          </>
        )}

        <Divider />

        <Textarea
          label="Meus comentários sobre este item"
          description="Opcional"
          placeholder="Observações pessoais, configurações, etc."
          autosize
          minRows={2}
          maxLength={420}
          value={form.values.owner_comments}
          onChange={(e) => form.setFieldValue('owner_comments', e.currentTarget.value)}
        />

        <Divider />

        {/* ── Ações ────────────────────────────────── */}
        <Group justify="space-between" align="center">
          <Checkbox
            label="Compartilhar no feed"
            color="indigo"
            checked={shareOnFeed}
            onChange={() => setShareOnFeed(v => !v)}
          />
          <Group gap={8}>
            <Button
              variant="default"
              radius="xl"
              onClick={() => navigate('/settings/gear')}
            >
              Cancelar
            </Button>
            <Button
              color="indigo"
              radius="xl"
              loading={isSubmitting}
              disabled={!productSelected || (hasColors && !selectedColor)}
              onClick={handleSubmit}
            >
              Salvar
            </Button>
          </Group>
        </Group>

      </Stack>
    </Container>
  )
}