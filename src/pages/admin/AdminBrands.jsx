// src/pages/admin/AdminBrands.jsx
// Gerenciamento de marcas de equipamentos — backoffice Mublin
// Stack: React + Mantine + Supabase + ImageKit

import { useEffect, useState, useCallback } from 'react'
import {
  Stack, Group, Title, Text, TextInput, Select, Badge,
  Avatar, ActionIcon, Modal, Skeleton, Table, Pagination,
  Tooltip, Button, Switch, Textarea, Box, SimpleGrid,
  Anchor, Image, Divider, Progress,
} from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconSearch, IconPlus, IconPencil, IconRefresh,
  IconBuildingStore, IconWorld, IconTrash, IconFilter, IconExternalLink,
} from '@tabler/icons-react'
import { upload } from '@imagekit/react'
import { supabase } from '../../lib/supabaseClient'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20
const IK_BASE   = 'https://ik.imagekit.io/mublin'

const ACTIVE_OPTIONS = [
  { value: '',      label: 'Todas'    },
  { value: 'true',  label: 'Ativas'   },
  { value: 'false', label: 'Inativas' },
]

const EMPTY_FORM = {
  name: '', slug: '', description: '', website: '', category_id: '', active: true,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function brandLogoUrl(logo) {
  if (!logo) return null
  if (logo.startsWith('http')) return logo
  return `${IK_BASE}/products/brands/tr:h-150,w-150,cm-pad_resize,bg-FFFFFF/${logo}`
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

// ─── Formulário ───────────────────────────────────────────────────────────────

function BrandForm({ brand, categories, onSave, onClose }) {
  const isEditing = !!brand?.id

  const [form, setForm] = useState(
    isEditing
      ? {
          name:        brand.name        ?? '',
          slug:        brand.slug        ?? '',
          description: brand.description ?? '',
          website:     brand.website     ?? '',
          category_id: brand.category_id ? String(brand.category_id) : '',
          active:      brand.active      ?? true,
        }
      : { ...EMPTY_FORM }
  )

  const [logoFile,     setLogoFile]     = useState(null)
  const [logoFileId,   setLogoFileId]   = useState(null)  // IK fileId (para deletar se cancelar)
  const [logoFileName, setLogoFileName] = useState(null)  // nome do arquivo salvo no DB
  const [logoProgress, setLogoProgress] = useState(0)
  const [saving,       setSaving]       = useState(false)
  const [errors,       setErrors]       = useState({})

  function setField(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && !isEditing) next.slug = slugify(value)
      return next
    })
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nome é obrigatório'
    if (!form.slug.trim()) errs.slug = 'Slug é obrigatório'
    if (form.website && !/^https?:\/\/.+/.test(form.website))
      errs.website = 'URL deve começar com http:// ou https://'
    return errs
  }

  // Faz upload ao selecionar o arquivo — mesmo padrão do NewProject
  async function handleLogoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoProgress(1)
    try {
      const res = await uploadToImageKit({
        file,
        fileName: `${slugify(form.name || 'brand')}_logo_.png`,
        folder:   '/products/brands/',
        tags:     ['brand', 'logo'],
        onProgress: setLogoProgress,
      })
      setLogoFileName(res.filePath.split('/').pop())
      setLogoFileId(res.fileId)
      setLogoProgress(0)
    } catch (err) {
      notifications.show({ color: 'red', message: 'Erro no upload: ' + err.message })
      setLogoFile(null)
      setLogoProgress(0)
    }
  }

  async function handleRemoveLogo() {
    if (logoFileId) await deleteFromImageKit(logoFileId).catch(console.error)
    setLogoFile(null)
    setLogoFileId(null)
    setLogoFileName(null)
    setLogoProgress(0)
    const el = document.querySelector('#brandLogo')
    if (el) el.value = null
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        name:        form.name.trim(),
        slug:        form.slug.trim(),
        description: form.description.trim() || null,
        website:     form.website.trim()     || null,
        category_id: form.category_id ? Number(form.category_id) : null,
        active:      form.active,
        ...(logoFileName && { logo: logoFileName }),
      }

      if (isEditing) {
        const { error } = await supabase.from('brands').update(payload).eq('id', brand.id)
        if (error) throw new Error(error.message)
        notifications.show({ color: 'teal', message: `Marca "${form.name}" atualizada.` })
        onSave({ ...brand, ...payload })
      } else {
        const { data, error } = await supabase.from('brands').insert(payload).select().single()
        if (error) throw new Error(error.message)
        notifications.show({ color: 'teal', message: `Marca "${form.name}" criada.` })
        onSave(data)
      }
    } catch (err) {
      notifications.show({ color: 'red', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  // URL para preview: logo recém-uploadada ou logo atual (edição)
  const previewUrl = logoFileName
    ? `${IK_BASE}/products/brands/tr:h-150,w-150,cm-pad_resize,bg-FFFFFF/${logoFileName}`
    : (isEditing && brand.logo ? brandLogoUrl(brand.logo) : null)

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="Nome" placeholder="Ex: Fender" required
          value={form.name} error={errors.name}
          onChange={(e) => setField('name', e.currentTarget.value)}
        />
        <TextInput
          label="Slug" placeholder="Ex: fender" required
          description="Gerado automaticamente"
          value={form.slug} error={errors.slug}
          onChange={(e) => setField('slug', slugify(e.currentTarget.value))}
        />
      </SimpleGrid>

      <Select
        label="Categoria" placeholder="Selecione uma categoria"
        data={categories.map(c => ({ value: String(c.id), label: c.name_ptbr }))}
        value={form.category_id} clearable searchable
        onChange={(v) => setField('category_id', v ?? '')}
      />

      <Textarea
        label="Descrição" placeholder="Breve descrição da marca..."
        value={form.description} rows={3} maxLength={2000}
        onChange={(e) => setField('description', e.currentTarget.value)}
      />

      <TextInput
        label="Website" placeholder="https://fender.com"
        leftSection={<IconWorld size={14} />}
        value={form.website} error={errors.website}
        onChange={(e) => setField('website', e.currentTarget.value)}
      />

      <Divider label="Logo" labelPosition="left" />

      {previewUrl ? (
        <Group gap="md" align="center">
          <Image
            src={previewUrl} w={64} h={64} fit="contain" radius="md"
            style={{ border: '1px solid var(--mantine-color-default-border)' }}
          />
          <Button
            size="xs" color="red" variant="light"
            leftSection={<IconTrash size={14} />}
            onClick={handleRemoveLogo}
            loading={logoProgress > 0}
          >
            Remover logo
          </Button>
        </Group>
      ) : (
        <Box>
          <Text size="xs" c="dimmed" mb={6}>
            PNG, JPG ou SVG · fundo transparente ou branco · boa qualidade
          </Text>
          <input
            id="brandLogo"
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleLogoSelect}
          />
          {logoProgress > 0 && logoProgress < 100 && (
            <Progress value={logoProgress} size="xs" mt={6} animated />
          )}
        </Box>
      )}

      <Group justify="space-between" align="center" pt="xs">
        <Switch
          label="Marca ativa" checked={form.active} color="teal" size="sm"
          onChange={(e) => setField('active', e.currentTarget.checked)}
        />
        <Group gap="sm">
          <Button variant="default" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" loading={saving} onClick={handleSubmit}>
            {isEditing ? 'Salvar alterações' : 'Criar marca'}
          </Button>
        </Group>
      </Group>
    </Stack>
  )
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function BrandRow({ brand, categories, onEdit, onToggleActive }) {
  const catName = categories.find(c => c.id === brand.category_id)?.name_ptbr

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <Avatar src={brandLogoUrl(brand.logo)} size={32} radius="sm" color="teal">
            <IconBuildingStore size={16} />
          </Avatar>
          <Box>
            <Text size="sm" fw={500}>{brand.name}</Text>
            <Text size="xs" c="dimmed" ff="monospace">{brand.slug}</Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td visibleFrom="sm">
        <Text size="xs" c="dimmed">{catName ?? '—'}</Text>
      </Table.Td>
      <Table.Td visibleFrom="md">
        {brand.website
          ? <Anchor href={brand.website} target="_blank" rel="noopener" size="xs">
              <Group gap={4} wrap="nowrap">
                <IconExternalLink size={12} />
                {brand.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </Group>
            </Anchor>
          : <Text size="xs" c="dimmed">—</Text>
        }
      </Table.Td>
      <Table.Td>
        <Badge size="xs" color={brand.active ? 'teal' : 'gray'} variant="light">
          {brand.active ? 'Ativa' : 'Inativa'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap={4} justify="flex-end" wrap="nowrap">
          <Tooltip label="Editar">
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => onEdit(brand)}>
              <IconPencil size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={brand.active ? 'Desativar' : 'Ativar'}>
            <ActionIcon
              variant="subtle" size="sm"
              color={brand.active ? 'orange' : 'teal'}
              onClick={() => onToggleActive(brand)}
            >
              {brand.active ? <IconTrash size={14} /> : <IconRefresh size={14} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminBrands() {
  const [brands,     setBrands]     = useState([])
  const [categories, setCategories] = useState([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)

  const [search,         setSearch]         = useState('')
  const [debouncedSearch]                   = useDebouncedValue(search, 350)
  const [activeFilter,   setActiveFilter]   = useState('true')
  const [categoryFilter, setCategoryFilter] = useState('')

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editingBrand, setEditingBrand] = useState(null)

  useEffect(() => {
    supabase.from('brands_categories').select('id, name_ptbr').order('name_ptbr')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  const fetchBrands = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = supabase
      .from('brands')
      .select('id, name, slug, logo, description, website, active, category_id', { count: 'exact' })
      .order('name')
      .range(from, to)

    if (debouncedSearch)   query = query.or(`name.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`)
    if (activeFilter !== '') query = query.eq('active', activeFilter === 'true')
    if (categoryFilter)    query = query.eq('category_id', Number(categoryFilter))

    const { data, count, error } = await query
    if (error) notifications.show({ color: 'red', message: 'Erro ao carregar marcas: ' + error.message })
    else { setBrands(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [page, debouncedSearch, activeFilter, categoryFilter])

  useEffect(() => { fetchBrands() }, [fetchBrands])
  useEffect(() => { setPage(1) }, [debouncedSearch, activeFilter, categoryFilter])

  function openCreate() { setEditingBrand(null); openModal() }
  function openEdit(brand) { setEditingBrand(brand); openModal() }

  function handleSaved(saved) {
    if (editingBrand) setBrands(prev => prev.map(b => b.id === saved.id ? saved : b))
    else { setBrands(prev => [saved, ...prev].slice(0, PAGE_SIZE)); setTotal(t => t + 1) }
    closeModal()
  }

  async function handleToggleActive(brand) {
    const next = !brand.active
    const { error } = await supabase.from('brands').update({ active: next }).eq('id', brand.id)
    if (error) notifications.show({ color: 'red', message: 'Erro: ' + error.message })
    else {
      notifications.show({ color: next ? 'teal' : 'orange', message: `"${brand.name}" ${next ? 'ativada' : 'desativada'}.` })
      setBrands(prev => prev.map(b => b.id === brand.id ? { ...b, active: next } : b))
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = categoryFilter || activeFilter === 'false' || activeFilter === ''

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={3} fw={500}>Marcas</Title>
            <Text size="sm" c="dimmed">
              {loading ? '...' : `${total.toLocaleString('pt-BR')} marca${total !== 1 ? 's' : ''}`}
            </Text>
          </Box>
          <Group gap="sm">
            <ActionIcon variant="subtle" color="gray" onClick={fetchBrands} loading={loading}>
              <IconRefresh size={16} />
            </ActionIcon>
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={openCreate}>
              Nova marca
            </Button>
          </Group>
        </Group>

        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Buscar por nome ou slug"
            leftSection={<IconSearch size={14} />}
            value={search} size="sm" style={{ flex: 1, minWidth: 200 }}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            placeholder="Categoria"
            data={[{ value: '', label: 'Todas as categorias' }, ...categories.map(c => ({ value: String(c.id), label: c.name_ptbr }))]}
            value={categoryFilter} size="sm" w={200} clearable searchable
            onChange={(v) => setCategoryFilter(v ?? '')}
          />
          <Select
            placeholder="Status" data={ACTIVE_OPTIONS}
            value={activeFilter} size="sm" w={130} clearable
            onChange={(v) => setActiveFilter(v ?? '')}
          />
          {hasActiveFilters && (
            <Tooltip label="Limpar filtros">
              <ActionIcon variant="light" color="gray" size="sm"
                onClick={() => { setCategoryFilter(''); setActiveFilter('true') }}>
                <IconFilter size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        <Box style={{ overflowX: 'auto' }}>
          <Table highlightOnHover verticalSpacing="sm" striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Marca</Table.Th>
                <Table.Th visibleFrom="sm">Categoria</Table.Th>
                <Table.Th visibleFrom="md">Website</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Table.Tr key={i}>
                      <Table.Td><Group gap="sm"><Skeleton circle height={32} /><Box><Skeleton height={12} width={120} mb={4} /><Skeleton height={10} width={80} /></Box></Group></Table.Td>
                      <Table.Td visibleFrom="sm"><Skeleton height={10} width={90} /></Table.Td>
                      <Table.Td visibleFrom="md"><Skeleton height={10} width={140} /></Table.Td>
                      <Table.Td><Skeleton height={18} width={50} radius="xl" /></Table.Td>
                      <Table.Td><Skeleton height={24} width={56} /></Table.Td>
                    </Table.Tr>
                  ))
                : brands.length === 0
                ? <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" size="sm" ta="center" py="xl">Nenhuma marca encontrada.</Text></Table.Td></Table.Tr>
                : brands.map(brand => (
                    <BrandRow key={brand.id} brand={brand} categories={categories}
                      onEdit={openEdit} onToggleActive={handleToggleActive} />
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
        opened={modalOpened} onClose={closeModal} size="lg" centered
        title={editingBrand ? `Editar: ${editingBrand.name}` : 'Nova marca'}
        scrollAreaComponent={Modal.NativeScrollArea}
      >
        <BrandForm
          key={editingBrand?.id ?? 'new'}
          brand={editingBrand}
          categories={categories}
          onSave={handleSaved}
          onClose={closeModal}
        />
      </Modal>
    </>
  )
}
