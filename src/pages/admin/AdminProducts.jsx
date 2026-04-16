// src/pages/admin/AdminProducts.jsx
// Gerenciamento de produtos (inventário de gear) — backoffice Mublin
// Stack: React + Mantine + Supabase + ImageKit

import { useEffect, useState, useCallback } from 'react'
import {
  Stack, Group, Title, Text, TextInput, Select, Badge,
  Avatar, ActionIcon, Modal, Skeleton, Table, Pagination,
  Tooltip, Button, Switch, Textarea, Box, SimpleGrid,
  Image, Divider, Progress, Alert, ScrollArea,
  Combobox, useCombobox, InputBase, Input, NumberInput,
} from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconSearch, IconPlus, IconPencil, IconRefresh, IconPackage,
  IconTrash, IconFilter, IconAlertCircle,
} from '@tabler/icons-react'
import { upload } from '@imagekit/react'
import { supabase } from '../../lib/supabaseClient'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20
const IK_BASE   = 'https://ik.imagekit.io/mublin'
// Mesmo padrão de PATH_PRODUCT_IMG em GearItem.jsx
const PRODUCT_IMG = `${IK_BASE}/products/tr:w-600,h-600,cm-pad_resize,bg-FFFFFF,fo-x/`

const EMPTY_FORM = {
  name: '', subtitle: '', id_brand: '', id_category: '', id_series: '',
  year: '', sku: '', keywords: '', description: '',
  description_source: '', description_source_url: '',
  is_discontinued: false, is_rare: false, is_featured: false, can_be_subproduct: false,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function productImageUrl(picture) {
  if (!picture) return null
  if (picture.startsWith('http')) return picture
  return `${PRODUCT_IMG}${picture}`
}

// Gera slug a partir do nome da marca + modelo — usado na criação do produto
function slugify(brandName, productName) {
  const raw = `${brandName} ${productName}`
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ─── ImageKit helpers (mesmo padrão de NewProject.jsx) ───────────────────────

async function getIkAuthTokens() {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  })
  if (!res.ok) throw new Error('Falha na autenticação do ImageKit')
  return { session, ...(await res.json()) }
}

async function uploadToImageKit({ file, fileName, folder, tags, onProgress }) {
  const { token, expire, signature } = await getIkAuthTokens()
  return upload({
    file, fileName, folder, tags,
    useUniqueFileName: true,
    publicKey:   import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
    token, expire, signature,
    onProgress: (e) => onProgress?.(Math.round((e.loaded / e.total) * 100)),
  })
}

async function deleteFromImageKit(fileId) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/imagekit-manage`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ fileId }),
    }
  )
  if (!res.ok) throw new Error('Erro ao deletar imagem no servidor')
}

// ─── Select de categoria agrupado por macro-categoria ─────────────────────────

function CategoryCombobox({ categories, value, onChange, error }) {
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() })
  const [search, setSearch] = useState('')

  const grouped = categories.reduce((acc, cat) => {
    const key = cat.macro_category ?? 'Outros'
    if (!acc[key]) acc[key] = []
    acc[key].push(cat)
    return acc
  }, {})

  const selectedLabel = categories.find(c => String(c.id) === String(value))?.name_ptbr
  const filtered = search.trim()
    ? categories.filter(c =>
        c.name_ptbr.toLowerCase().includes(search.toLowerCase()) ||
        c.macro_category?.toLowerCase().includes(search.toLowerCase())
      )
    : null

  return (
    <Input.Wrapper label="Categoria" required error={error}>
      <Combobox
        store={combobox}
        onOptionSubmit={(val) => { onChange(val); combobox.closeDropdown(); setSearch('') }}
      >
        <Combobox.Target>
          <InputBase
            component="button" type="button" pointer
            rightSection={<Combobox.Chevron />}
            rightSectionPointerEvents="none"
            error={!!error}
            onClick={() => combobox.toggleDropdown()}
          >
            {selectedLabel ?? <Input.Placeholder>Selecione uma categoria</Input.Placeholder>}
          </InputBase>
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Search
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Buscar categoria..."
          />
          <Combobox.Options>
            <ScrollArea.Autosize mah={260} type="scroll">
              {filtered ? (
                filtered.length === 0
                  ? <Combobox.Empty>Nenhuma categoria encontrada</Combobox.Empty>
                  : filtered.map(cat => (
                      <Combobox.Option key={cat.id} value={String(cat.id)}>
                        <Text size="sm">{cat.name_ptbr}</Text>
                        <Text size="xs" c="dimmed">{cat.macro_category}</Text>
                      </Combobox.Option>
                    ))
              ) : (
                Object.entries(grouped).map(([macro, cats]) => (
                  <Combobox.Group key={macro} label={macro}>
                    {cats.map(cat => (
                      <Combobox.Option key={cat.id} value={String(cat.id)}>
                        {cat.name_ptbr}
                      </Combobox.Option>
                    ))}
                  </Combobox.Group>
                ))
              )}
            </ScrollArea.Autosize>
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </Input.Wrapper>
  )
}

// ─── Formulário ───────────────────────────────────────────────────────────────

function ProductForm({ product, brands, categories, onSave, onClose }) {
  const isEditing = !!product?.id
  const currentYear = new Date().getFullYear()

  const [form, setForm] = useState(
    isEditing
      ? {
          name:                    product.name                    ?? '',
          subtitle:                product.subtitle                ?? '',
          id_brand:                product.id_brand                ? String(product.id_brand)    : '',
          id_category:             product.id_category             ? String(product.id_category) : '',
          id_series:               product.id_series               ? String(product.id_series)   : '',
          year:                    product.year                    ?? '',
          sku:                     product.sku                     ?? '',
          keywords:                product.keywords                ?? '',
          description:             product.description             ?? '',
          description_source:      product.description_source      ?? '',
          description_source_url:  product.description_source_url  ?? '',
          is_discontinued:         product.is_discontinued         ?? false,
          is_rare:                 product.is_rare                 ?? false,
          is_featured:             product.is_featured             ?? false,
          can_be_subproduct:       product.can_be_subproduct       ?? false,
        }
      : { ...EMPTY_FORM }
  )

  // Imagem do produto
  const [picFile,     setPicFile]     = useState(null)
  const [picFileId,   setPicFileId]   = useState(null)
  const [picFileName, setPicFileName] = useState(null)
  const [picProgress, setPicProgress] = useState(0)

  const [series,  setSeries]  = useState([])
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState({})

  // Carrega séries quando a marca muda
  useEffect(() => {
    if (!form.id_brand) { setSeries([]); return }
    supabase.from('product_series').select('id, name')
      .eq('id_brand', Number(form.id_brand)).order('name')
      .then(({ data }) => setSeries(data ?? []))
  }, [form.id_brand])

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())    errs.name        = 'Nome é obrigatório'
    if (!form.id_brand)       errs.id_brand     = 'Marca é obrigatória'
    if (!form.id_category)    errs.id_category  = 'Categoria é obrigatória'
    if (form.year && (form.year < 1900 || form.year > currentYear))
      errs.year = `Ano entre 1900 e ${currentYear}`
    if (form.description_source_url && !/^https?:\/\/.+/.test(form.description_source_url))
      errs.description_source_url = 'URL deve começar com http:// ou https://'
    return errs
  }

  // Upload ao selecionar — mesmo padrão do NewProject.jsx
  async function handlePicSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPicFile(file)
    setPicProgress(1)
    try {
      const res = await uploadToImageKit({
        file,
        fileName: `${form.name.replace(/\s+/g, '_') || 'product'}_.jpg`,
        folder:   '/products/',
        tags:     ['gear', 'product'],
        onProgress: setPicProgress,
      })
      setPicFileName(res.filePath.split('/').pop())
      setPicFileId(res.fileId)
      setPicProgress(0)
    } catch (err) {
      notifications.show({ color: 'red', message: 'Erro no upload: ' + err.message })
      setPicFile(null)
      setPicProgress(0)
    }
  }

  async function handleRemovePic() {
    if (picFileId) await deleteFromImageKit(picFileId).catch(console.error)
    setPicFile(null)
    setPicFileId(null)
    setPicFileName(null)
    setPicProgress(0)
    const el = document.querySelector('#productPicture')
    if (el) el.value = null
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        name:                   form.name.trim(),
        subtitle:               form.subtitle.trim()              || null,
        id_brand:               Number(form.id_brand),
        id_category:            Number(form.id_category),
        id_series:              form.id_series ? Number(form.id_series) : null,
        year:                   form.year      ? Number(form.year)      : null,
        sku:                    form.sku.trim()                   || null,
        keywords:               form.keywords.trim()              || null,
        description:            form.description.trim()           || null,
        description_source:     form.description_source.trim()    || null,
        description_source_url: form.description_source_url.trim()|| null,
        is_discontinued:        form.is_discontinued,
        is_rare:                form.is_rare,
        is_featured:            form.is_featured,
        can_be_subproduct:      form.can_be_subproduct,
        ...(picFileName && { picture: picFileName }),
      }

      if (isEditing) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id)
        if (error) throw new Error(error.message)
        notifications.show({ color: 'teal', message: `Produto "${form.name}" atualizado.` })
        onSave({ ...product, ...payload })
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        payload.id_user_creator = session.user.id

        // Slug = "marca-modelo", com sufixo aleatório para evitar colisões
        // A marca selecionada é buscada dos dados já carregados pelo pai via prop brands
        // mas aqui dentro não temos acesso direto — usamos o id para buscar o nome
        const { data: brandData } = await supabase
          .from('brands').select('name').eq('id', Number(form.id_brand)).single()
        const brandName   = brandData?.name ?? ''
        const suffix      = Math.random().toString(36).substring(2, 6)
        payload.slug      = `${slugify(brandName, form.name)}-${suffix}`

        const { data, error } = await supabase.from('products').insert(payload).select().single()
        if (error) throw new Error(error.message)
        notifications.show({ color: 'teal', message: `Produto "${form.name}" criado.` })
        onSave(data)
      }
    } catch (err) {
      notifications.show({ color: 'red', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  // URL de preview: arquivo recém-uploaded ou imagem atual (edição)
  const previewUrl = picFileName
    ? productImageUrl(picFileName)
    : (isEditing && product.picture ? productImageUrl(product.picture) : null)

  return (
    <Stack gap="md">

      {/* Marca + Categoria */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Select
          label="Marca" placeholder="Selecione a marca" required
          data={brands.map(b => ({ value: String(b.id), label: b.name }))}
          value={form.id_brand} searchable error={errors.id_brand}
          onChange={(v) => { setField('id_brand', v ?? ''); setField('id_series', '') }}
        />
        <CategoryCombobox
          categories={categories} value={form.id_category}
          onChange={(v) => setField('id_category', v)} error={errors.id_category}
        />
      </SimpleGrid>

      {/* Nome + Subtítulo */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="Modelo (sem a marca)" placeholder="Ex: BD-2 Blues Driver" required
          value={form.name} error={errors.name}
          onChange={(e) => setField('name', e.currentTarget.value)}
        />
        <TextInput
          label="Subtítulo" placeholder="Ex: Boutique Overdrive Pedal"
          value={form.subtitle}
          onChange={(e) => setField('subtitle', e.currentTarget.value)}
        />
      </SimpleGrid>

      {/* Série + Ano + SKU */}
      <SimpleGrid cols={{ base: 1, sm: series.length > 0 ? 3 : 2 }} spacing="md">
        {series.length > 0 && (
          <Select
            label="Série" placeholder="Opcional"
            data={series.map(s => ({ value: String(s.id), label: s.name }))}
            value={form.id_series} clearable
            onChange={(v) => setField('id_series', v ?? '')}
          />
        )}
        <NumberInput
          label="Ano de lançamento" placeholder={String(currentYear)}
          min={1900} max={currentYear} allowDecimal={false}
          value={form.year} error={errors.year}
          onChange={(v) => setField('year', v)}
        />
        <TextInput
          label="SKU / Código" placeholder="Ex: 013-1002-306"
          value={form.sku}
          onChange={(e) => setField('sku', e.currentTarget.value)}
        />
      </SimpleGrid>

      <TextInput
        label="Keywords" placeholder="Ex: guitarra, strat, single coil (separe por vírgula)"
        description="Ajuda na busca interna"
        value={form.keywords}
        onChange={(e) => setField('keywords', e.currentTarget.value)}
      />

      <Divider label="Descrição" labelPosition="left" />

      <Textarea
        label="Descrição" placeholder="Descrição técnica do produto..."
        value={form.description} rows={4} maxLength={10000}
        onChange={(e) => setField('description', e.currentTarget.value)}
      />

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="Fonte da descrição" placeholder="Ex: Wikipedia, site oficial..."
          value={form.description_source}
          onChange={(e) => setField('description_source', e.currentTarget.value)}
        />
        <TextInput
          label="URL da fonte" placeholder="https://..."
          value={form.description_source_url} error={errors.description_source_url}
          onChange={(e) => setField('description_source_url', e.currentTarget.value)}
        />
      </SimpleGrid>

      <Divider label="Imagem do produto" labelPosition="left" />

      <Alert variant="light" color="gray" icon={<IconAlertCircle size={14} />}>
        Foto genérica · de frente · sem inclinação · fundo branco ou transparente · ~22px de margem em cada extremidade · máx. 2mb
      </Alert>

      {previewUrl ? (
        <Group gap="md" align="center">
          <Image
            src={previewUrl} w={100} h={100} fit="contain" radius="md"
            style={{ border: '1px solid var(--mantine-color-default-border)', background: '#fff' }}
          />
          <Button
            size="xs" color="red" variant="light"
            leftSection={<IconTrash size={14} />}
            onClick={handleRemovePic}
          >
            Remover foto
          </Button>
        </Group>
      ) : (
        <Box>
          <input
            id="productPicture"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePicSelect}
          />
          {picProgress > 0 && picProgress < 100 && (
            <Progress value={picProgress} size="xs" mt={6} animated />
          )}
        </Box>
      )}

      <Divider label="Flags" labelPosition="left" />

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
        <Switch label="Descontinuado"       checked={form.is_discontinued}  size="sm"
          onChange={(e) => setField('is_discontinued',  e.currentTarget.checked)} />
        <Switch label="Raro / vintage"      checked={form.is_rare}          size="sm"
          onChange={(e) => setField('is_rare',          e.currentTarget.checked)} />
        <Switch label="Produto em destaque" checked={form.is_featured}      size="sm" color="yellow"
          onChange={(e) => setField('is_featured',      e.currentTarget.checked)} />
        <Switch label="Pode ser subproduto" checked={form.can_be_subproduct} size="sm"
          description="Ex: captação dentro de uma guitarra"
          onChange={(e) => setField('can_be_subproduct', e.currentTarget.checked)} />
      </SimpleGrid>

      <Group justify="flex-end" pt="xs">
        <Button variant="default" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button size="sm" loading={saving} onClick={handleSubmit}>
          {isEditing ? 'Salvar alterações' : 'Criar produto'}
        </Button>
      </Group>
    </Stack>
  )
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function ProductRow({ product, brands, categories, onEdit }) {
  const brandName = brands.find(b => b.id === product.id_brand)?.name
  const catName   = categories.find(c => c.id === product.id_category)?.name_ptbr

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <Avatar src={productImageUrl(product.picture)} size={36} radius="sm" color="blue">
            <IconPackage size={18} />
          </Avatar>
          <Box>
            <Group gap={6} wrap="nowrap">
              <Text size="sm" fw={500} lineClamp={1}>{product.name}</Text>
              {product.is_featured    && <Badge size="xs" color="yellow" variant="light">Destaque</Badge>}
              {product.is_discontinued&& <Badge size="xs" color="gray"   variant="light">Descontinuado</Badge>}
              {product.is_rare        && <Badge size="xs" color="orange" variant="light">Raro</Badge>}
            </Group>
            {product.subtitle && <Text size="xs" c="dimmed" lineClamp={1}>{product.subtitle}</Text>}
          </Box>
        </Group>
      </Table.Td>
      <Table.Td visibleFrom="sm"><Text size="xs" c="dimmed">{brandName ?? '—'}</Text></Table.Td>
      <Table.Td visibleFrom="md"><Text size="xs" c="dimmed">{catName   ?? '—'}</Text></Table.Td>
      <Table.Td visibleFrom="lg"><Text size="xs" c="dimmed">{product.year ?? '—'}</Text></Table.Td>
      <Table.Td>
        <Tooltip label="Editar">
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => onEdit(product)}>
            <IconPencil size={14} />
          </ActionIcon>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminProducts() {
  const [products,   setProducts]   = useState([])
  const [brands,     setBrands]     = useState([])
  const [categories, setCategories] = useState([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)

  const [search,          setSearch]          = useState('')
  const [debouncedSearch]                     = useDebouncedValue(search, 350)
  const [brandFilter,     setBrandFilter]     = useState('')
  const [categoryFilter,  setCategoryFilter]  = useState('')
  const [featuredFilter,  setFeaturedFilter]  = useState('')

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => {
    supabase.from('brands').select('id, name').eq('active', true).order('name')
      .then(({ data }) => setBrands(data ?? []))
    supabase.from('product_categories').select('id, name_ptbr, macro_category').order('macro_category')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = supabase
      .from('products')
      .select(
        `id, name, subtitle, picture, year, is_featured, is_discontinued, is_rare,
         can_be_subproduct, id_brand, id_category, id_series, sku, keywords,
         description, description_source, description_source_url`,
        { count: 'exact' }
      )
      .order('name')
      .range(from, to)

    if (debouncedSearch)  query = query.or(`name.ilike.%${debouncedSearch}%,subtitle.ilike.%${debouncedSearch}%,keywords.ilike.%${debouncedSearch}%`)
    if (brandFilter)      query = query.eq('id_brand',    Number(brandFilter))
    if (categoryFilter)   query = query.eq('id_category', Number(categoryFilter))
    if (featuredFilter !== '') query = query.eq('is_featured', featuredFilter === 'true')

    const { data, count, error } = await query
    if (error) notifications.show({ color: 'red', message: 'Erro ao carregar produtos: ' + error.message })
    else { setProducts(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [page, debouncedSearch, brandFilter, categoryFilter, featuredFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { setPage(1) }, [debouncedSearch, brandFilter, categoryFilter, featuredFilter])

  function openCreate() { setEditingProduct(null); openModal() }
  function openEdit(p)  { setEditingProduct(p);    openModal() }

  function handleSaved(saved) {
    if (editingProduct) setProducts(prev => prev.map(p => p.id === saved.id ? saved : p))
    else { setProducts(prev => [saved, ...prev].slice(0, PAGE_SIZE)); setTotal(t => t + 1) }
    closeModal()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = brandFilter || categoryFilter || featuredFilter

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={3} fw={500}>Produtos</Title>
            <Text size="sm" c="dimmed">
              {loading ? '...' : `${total.toLocaleString('pt-BR')} produto${total !== 1 ? 's' : ''} cadastrados`}
            </Text>
          </Box>
          <Group gap="sm">
            <ActionIcon variant="subtle" color="gray" onClick={fetchProducts} loading={loading}>
              <IconRefresh size={16} />
            </ActionIcon>
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={openCreate}>
              Novo produto
            </Button>
          </Group>
        </Group>

        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Buscar por nome, subtítulo ou keyword"
            leftSection={<IconSearch size={14} />}
            value={search} size="sm" style={{ flex: 1, minWidth: 220 }}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            placeholder="Marca"
            data={[{ value: '', label: 'Todas as marcas' }, ...brands.map(b => ({ value: String(b.id), label: b.name }))]}
            value={brandFilter} size="sm" w={180} clearable searchable
            onChange={(v) => setBrandFilter(v ?? '')}
          />
          <Select
            placeholder="Categoria"
            data={[{ value: '', label: 'Todas' }, ...categories.map(c => ({ value: String(c.id), label: c.name_ptbr }))]}
            value={categoryFilter} size="sm" w={180} clearable searchable
            onChange={(v) => setCategoryFilter(v ?? '')}
          />
          <Select
            placeholder="Destaque"
            data={[{ value: '', label: 'Todos' }, { value: 'true', label: 'Em destaque' }, { value: 'false', label: 'Sem destaque' }]}
            value={featuredFilter} size="sm" w={150} clearable
            onChange={(v) => setFeaturedFilter(v ?? '')}
          />
          {hasActiveFilters && (
            <Tooltip label="Limpar filtros">
              <ActionIcon variant="light" color="gray" size="sm"
                onClick={() => { setBrandFilter(''); setCategoryFilter(''); setFeaturedFilter('') }}>
                <IconFilter size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        <Box style={{ overflowX: 'auto' }}>
          <Table highlightOnHover verticalSpacing="sm" striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Produto</Table.Th>
                <Table.Th visibleFrom="sm">Marca</Table.Th>
                <Table.Th visibleFrom="md">Categoria</Table.Th>
                <Table.Th visibleFrom="lg">Ano</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Table.Tr key={i}>
                      <Table.Td><Group gap="sm"><Skeleton height={36} width={36} radius="sm" /><Box><Skeleton height={12} width={140} mb={4} /><Skeleton height={10} width={100} /></Box></Group></Table.Td>
                      <Table.Td visibleFrom="sm"><Skeleton height={10} width={80} /></Table.Td>
                      <Table.Td visibleFrom="md"><Skeleton height={10} width={100} /></Table.Td>
                      <Table.Td visibleFrom="lg"><Skeleton height={10} width={40} /></Table.Td>
                      <Table.Td><Skeleton height={24} width={28} /></Table.Td>
                    </Table.Tr>
                  ))
                : products.length === 0
                ? <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" size="sm" ta="center" py="xl">Nenhum produto encontrado.</Text></Table.Td></Table.Tr>
                : products.map(p => (
                    <ProductRow key={p.id} product={p} brands={brands} categories={categories} onEdit={openEdit} />
                  ))
              }
            </Table.Tbody>
          </Table>
        </Box>

        {totalPages > 1 && (
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">Página {page} de {totalPages}</Text>
            <Pagination value={page} onChange={setPage} total={totalPages} size="sm" withEdges />
          </Group>
        )}
      </Stack>

      <Modal
        opened={modalOpened} onClose={closeModal} size="xl" centered
        title={editingProduct ? `Editar: ${editingProduct.name}` : 'Novo produto'}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <ProductForm
          key={editingProduct?.id ?? 'new'}
          product={editingProduct}
          brands={brands}
          categories={categories}
          onSave={handleSaved}
          onClose={closeModal}
        />
      </Modal>
    </>
  )
}
