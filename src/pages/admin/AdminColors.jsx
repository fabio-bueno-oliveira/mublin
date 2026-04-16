// src/pages/admin/AdminColors.jsx
// Gerenciamento de cores de produtos — backoffice Mublin
// Stack: React + Mantine + Supabase + ImageKit

import { useEffect, useState, useCallback } from 'react'
import {
  Stack, Group, Title, Text, TextInput, Select, Badge,
  ActionIcon, Modal, Skeleton, Table, Pagination,
  Tooltip, Button, Box, SimpleGrid, Divider, Progress,
  ColorSwatch, ColorInput, ScrollArea, SegmentedControl,
} from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconSearch, IconPlus, IconPencil, IconRefresh, IconFilter,
  IconTrash, IconPhoto,
} from '@tabler/icons-react'
import { upload } from '@imagekit/react'
import { supabase } from '../../lib/supabaseClient'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE  = 30
const IK_COLORS  = 'https://ik.imagekit.io/mublin/products/colors/'

const TYPE_OPTIONS = [
  { value: '',        label: 'Todos os tipos' },
  { value: 'primary', label: 'Primária'       },
  { value: 'wood',    label: 'Madeira'        },
  { value: 'custom',  label: 'Custom'         },
]

const TYPE_SEGMENT = [
  { value: 'primary', label: 'Primária' },
  { value: 'wood',    label: 'Madeira'  },
  { value: 'custom',  label: 'Custom'   },
]

const TYPE_META = {
  primary: { label: 'Primária', color: 'blue'   },
  wood:    { label: 'Madeira',  color: 'orange'  },
  custom:  { label: 'Custom',   color: 'violet'  },
}

const EMPTY_FORM = {
  name:      '',
  name_ptbr: '',
  rgb:       '',
  type:      'primary',
  brand_id:  '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sampleUrl(img_sample) {
  if (!img_sample) return null
  if (img_sample.startsWith('http')) return img_sample
  return `${IK_COLORS}${img_sample}`
}

function typeBadge(type) {
  const meta = TYPE_META[type] ?? { label: type, color: 'gray' }
  return <Badge size="xs" color={meta.color} variant="light">{meta.label}</Badge>
}

// ─── ImageKit helpers ─────────────────────────────────────────────────────────

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
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ fileId }),
    }
  )
  if (!res.ok) throw new Error('Erro ao deletar imagem no servidor')
}

// ─── Formulário ───────────────────────────────────────────────────────────────

function ColorForm({ color, brands, onSave, onClose }) {
  const isEditing = !!color?.id

  const [form, setForm] = useState(
    isEditing
      ? {
          name:      color.name      ?? '',
          name_ptbr: color.name_ptbr ?? '',
          rgb:       color.rgb       ?? '',
          type:      color.type      ?? 'primary',
          brand_id:  color.brand_id  ? String(color.brand_id) : '',
        }
      : { ...EMPTY_FORM }
  )

  // Sample image
  const [sampleFileId,   setSampleFileId]   = useState(null)
  const [sampleFileName, setSampleFileName] = useState(null)
  const [sampleProgress, setSampleProgress] = useState(0)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())      errs.name      = 'Nome (EN) é obrigatório'
    if (!form.name_ptbr.trim()) errs.name_ptbr = 'Nome (PT) é obrigatório'
    if (form.rgb && !/^#[0-9A-Fa-f]{6}$/.test(form.rgb))
      errs.rgb = 'Formato inválido — use #RRGGBB'
    return errs
  }

  async function handleSampleSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSampleProgress(1)
    try {
      const res = await uploadToImageKit({
        file,
        fileName: `${form.name.replace(/\s+/g, '_') || 'color'}_sample_.png`,
        folder:   '/products/colors/',
        tags:     ['color', 'sample'],
        onProgress: setSampleProgress,
      })
      setSampleFileName(res.filePath.split('/').pop())
      setSampleFileId(res.fileId)
      setSampleProgress(0)
    } catch (err) {
      notifications.show({ color: 'red', message: 'Erro no upload: ' + err.message })
      setSampleProgress(0)
    }
  }

  async function handleRemoveSample() {
    if (sampleFileId) await deleteFromImageKit(sampleFileId).catch(console.error)
    setSampleFileId(null)
    setSampleFileName(null)
    setSampleProgress(0)
    const el = document.querySelector('#colorSample')
    if (el) el.value = null
  }

  async function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      const payload = {
        name:      form.name.trim(),
        name_ptbr: form.name_ptbr.trim(),
        rgb:       form.rgb.trim() || null,
        type:      form.type,
        brand_id:  form.brand_id ? Number(form.brand_id) : null,
        ...(sampleFileName && { img_sample: sampleFileName }),
      }

      if (isEditing) {
        const { error } = await supabase.from('colors').update(payload).eq('id', color.id)
        if (error) throw new Error(error.message)
        notifications.show({ color: 'teal', message: `Cor "${form.name}" atualizada.` })
        onSave({ ...color, ...payload })
      } else {
        const { data, error } = await supabase.from('colors').insert(payload).select().single()
        if (error) throw new Error(error.message)
        notifications.show({ color: 'teal', message: `Cor "${form.name}" criada.` })
        onSave(data)
      }
    } catch (err) {
      notifications.show({ color: 'red', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  // Preview: arquivo recém-uploaded → img_sample atual → rgb como fallback
  const previewSample = sampleFileName
    ? sampleUrl(sampleFileName)
    : (isEditing && color.img_sample ? sampleUrl(color.img_sample) : null)

  const previewRgb = form.rgb && /^#[0-9A-Fa-f]{6}$/.test(form.rgb) ? form.rgb : null

  return (
    <Stack gap="md">

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label="Nome (EN)" placeholder="Ex: Lake Placid Blue" required
          value={form.name} error={errors.name}
          onChange={(e) => setField('name', e.currentTarget.value)}
        />
        <TextInput
          label="Nome (PT)" placeholder="Ex: Azul Lake Placid" required
          value={form.name_ptbr} error={errors.name_ptbr}
          onChange={(e) => setField('name_ptbr', e.currentTarget.value)}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Box>
          <Text size="xs" c="dimmed" mb={6}>Tipo</Text>
          <SegmentedControl
            fullWidth size="xs"
            value={form.type}
            onChange={(v) => setField('type', v)}
            data={TYPE_SEGMENT}
          />
        </Box>
        {/* Cor proprietária: marca responsável */}
        <Select
          label="Marca proprietária"
          placeholder="Genérica (nenhuma)"
          description="Preencha apenas se for cor exclusiva de uma marca"
          data={brands.map(b => ({ value: String(b.id), label: b.name }))}
          value={form.brand_id} clearable searchable
          onChange={(v) => setField('brand_id', v ?? '')}
        />
      </SimpleGrid>

      <Divider label="Cor" labelPosition="left" />

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <ColorInput
          label="Valor RGB"
          placeholder="#RRGGBB"
          description="Representação sólida da cor"
          value={form.rgb}
          error={errors.rgb}
          format="hex"
          swatches={[
            '#000000','#FFFFFF','#FF0000','#00FF00','#0000FF',
            '#FFFF00','#FF8800','#8800FF','#888888','#C4A35A',
          ]}
          onChange={(v) => setField('rgb', v)}
        />
        {/* Preview visual */}
        <Box>
          <Text size="xs" c="dimmed" mb={6}>Preview</Text>
          <Group gap="sm" align="center">
            {previewSample ? (
              <ColorSwatch
                color="transparent"
                size={44}
                styles={{
                  alphaOverlay: {
                    backgroundImage: `url(${previewSample})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  },
                  root: { borderRadius: 8 },
                }}
              />
            ) : previewRgb ? (
              <ColorSwatch color={previewRgb} size={44} style={{ borderRadius: 8 }} />
            ) : (
              <Box
                w={44} h={44}
                style={{ borderRadius: 8, border: '1px solid var(--mantine-color-default-border)', background: 'var(--mantine-color-default)' }}
              />
            )}
            <Text size="xs" c="dimmed">
              {previewSample ? 'Imagem sample' : previewRgb ? form.rgb : 'Sem preview'}
            </Text>
          </Group>
        </Box>
      </SimpleGrid>

      <Divider label="Imagem sample" labelPosition="left" />

      <Text size="xs" c="dimmed">
        Usada quando a cor tem textura (ex: sunburst, madeiras, pearloid). PNG com fundo
        transparente, quadrado, ~100×100px. Se não houver, o RGB é usado como fallback.
      </Text>

      {previewSample ? (
        <Group gap="md" align="center">
          <img
            src={previewSample}
            alt="Sample"
            style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--mantine-color-default-border)' }}
          />
          <Button
            size="xs" color="red" variant="light"
            leftSection={<IconTrash size={14} />}
            onClick={handleRemoveSample}
          >
            Remover sample
          </Button>
        </Group>
      ) : (
        <Box>
          <input
            id="colorSample"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleSampleSelect}
          />
          {sampleProgress > 0 && sampleProgress < 100 && (
            <Progress value={sampleProgress} size="xs" mt={6} animated />
          )}
        </Box>
      )}

      <Group justify="flex-end" pt="xs">
        <Button variant="default" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button size="sm" loading={saving} onClick={handleSubmit}>
          {isEditing ? 'Salvar alterações' : 'Criar cor'}
        </Button>
      </Group>

    </Stack>
  )
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function ColorRow({ color, brands, onEdit }) {
  const brandName  = brands.find(b => b.id === color.brand_id)?.name
  const hasSample  = !!color.img_sample
  const hasRgb     = color.rgb && /^#[0-9A-Fa-f]{6}$/.test(color.rgb.trim())

  return (
    <Table.Tr>
      <Table.Td>
        {/* Swatch: sample se houver, rgb como fallback, cinza se nada */}
        <Group gap="sm" wrap="nowrap">
          {hasSample ? (
            <ColorSwatch
              color="transparent"
              size={28}
              styles={{
                alphaOverlay: {
                  backgroundImage: `url(${sampleUrl(color.img_sample)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                },
                root: { flexShrink: 0 },
              }}
            />
          ) : (
            <ColorSwatch
              color={hasRgb ? color.rgb.trim() : '#cccccc'}
              size={28}
              style={{ flexShrink: 0 }}
            />
          )}
          <Box>
            <Text size="sm" fw={500}>{color.name}</Text>
            <Text size="xs" c="dimmed">{color.name_ptbr}</Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td visibleFrom="sm">
        {typeBadge(color.type)}
      </Table.Td>
      <Table.Td visibleFrom="md">
        {hasRgb
          ? <Text size="xs" ff="monospace" c="dimmed">{color.rgb.trim()}</Text>
          : <Text size="xs" c="dimmed">—</Text>
        }
      </Table.Td>
      <Table.Td visibleFrom="md">
        <Group gap={4} wrap="nowrap">
          {hasSample && (
            <Tooltip label="Tem imagem sample">
              <IconPhoto size={13} style={{ color: 'var(--mantine-color-teal-6)' }} />
            </Tooltip>
          )}
          <Text size="xs" c="dimmed">
            {hasSample ? color.img_sample : '—'}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td visibleFrom="lg">
        {brandName
          ? <Badge size="xs" color="gray" variant="outline">{brandName}</Badge>
          : <Text size="xs" c="dimmed">Genérica</Text>
        }
      </Table.Td>
      <Table.Td>
        <Tooltip label="Editar">
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => onEdit(color)}>
            <IconPencil size={14} />
          </ActionIcon>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminColors() {
  const [colors,  setColors]  = useState([])
  const [brands,  setBrands]  = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)

  const [search,     setSearch]     = useState('')
  const [debouncedSearch]           = useDebouncedValue(search, 350)
  const [typeFilter, setTypeFilter] = useState('')
  const [ownedFilter, setOwnedFilter] = useState('') // '' | 'generic' | 'branded'

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [editingColor, setEditingColor] = useState(null)

  // Carrega marcas ativas uma vez (para o select de proprietária)
  useEffect(() => {
    supabase.from('brands').select('id, name').eq('active', true).order('name')
      .then(({ data }) => setBrands(data ?? []))
  }, [])

  const fetchColors = useCallback(async (currentPage) => {
    setLoading(true)
    const from = (currentPage - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = supabase
      .from('colors')
      .select('id, name, name_ptbr, rgb, img_sample, type, brand_id', { count: 'exact' })
      .order('name', { ascending: true })
      .range(from, to)

    if (debouncedSearch) query = query.or(`name.ilike.%${debouncedSearch}%,name_ptbr.ilike.%${debouncedSearch}%`)
    if (typeFilter)      query = query.eq('type', typeFilter)
    if (ownedFilter === 'branded') query = query.not('brand_id', 'is', null)
    if (ownedFilter === 'generic') query = query.is('brand_id', null)

    const { data, count, error } = await query
    if (error) notifications.show({ color: 'red', message: 'Erro ao carregar cores: ' + error.message })
    else { setColors(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [debouncedSearch, typeFilter, ownedFilter])

  useEffect(() => {
    setPage(1)
    fetchColors(1)
  }, [debouncedSearch, typeFilter, ownedFilter])

  useEffect(() => {
    fetchColors(page)
  }, [page])

  function openCreate() { setEditingColor(null); openModal() }
  function openEdit(c)  { setEditingColor(c);    openModal() }

  function handleSaved(saved) {
    if (editingColor) setColors(prev => prev.map(c => c.id === saved.id ? saved : c))
    else { setColors(prev => [saved, ...prev].slice(0, PAGE_SIZE)); setTotal(t => t + 1) }
    closeModal()
  }

  const totalPages      = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = typeFilter || ownedFilter

  return (
    <>
      <Stack gap="lg">

        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={3} fw={500}>Cores</Title>
            <Text size="sm" c="dimmed">
              {loading ? '...' : `${total.toLocaleString('pt-BR')} cor${total !== 1 ? 'es' : ''} cadastrada${total !== 1 ? 's' : ''}`}
            </Text>
          </Box>
          <Group gap="sm">
            <ActionIcon variant="subtle" color="gray" onClick={() => fetchColors(page)} loading={loading}>
              <IconRefresh size={16} />
            </ActionIcon>
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={openCreate}>
              Nova cor
            </Button>
          </Group>
        </Group>

        {/* Filtros */}
        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Buscar por nome..."
            leftSection={<IconSearch size={14} />}
            value={search} size="sm" style={{ flex: 1, minWidth: 200 }}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            placeholder="Tipo" data={TYPE_OPTIONS}
            value={typeFilter} size="sm" w={150} clearable
            onChange={(v) => setTypeFilter(v ?? '')}
          />
          <Select
            placeholder="Propriedade"
            data={[
              { value: '',         label: 'Todas'        },
              { value: 'generic',  label: 'Genéricas'    },
              { value: 'branded',  label: 'Proprietárias'},
            ]}
            value={ownedFilter} size="sm" w={160} clearable
            onChange={(v) => setOwnedFilter(v ?? '')}
          />
          {hasActiveFilters && (
            <Tooltip label="Limpar filtros">
              <ActionIcon
                variant="light" color="gray" size="sm"
                onClick={() => { setTypeFilter(''); setOwnedFilter('') }}
              >
                <IconFilter size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        {/* Tabela */}
        <Box style={{ overflowX: 'auto' }}>
          <Table highlightOnHover verticalSpacing="sm" striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cor</Table.Th>
                <Table.Th visibleFrom="sm">Tipo</Table.Th>
                <Table.Th visibleFrom="md">RGB</Table.Th>
                <Table.Th visibleFrom="md">Sample</Table.Th>
                <Table.Th visibleFrom="lg">Marca</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>
                        <Group gap="sm">
                          <Skeleton circle height={28} />
                          <Box><Skeleton height={12} width={120} mb={4} /><Skeleton height={10} width={80} /></Box>
                        </Group>
                      </Table.Td>
                      <Table.Td visibleFrom="sm"><Skeleton height={18} width={60} radius="xl" /></Table.Td>
                      <Table.Td visibleFrom="md"><Skeleton height={10} width={70} /></Table.Td>
                      <Table.Td visibleFrom="md"><Skeleton height={10} width={100} /></Table.Td>
                      <Table.Td visibleFrom="lg"><Skeleton height={18} width={80} radius="xl" /></Table.Td>
                      <Table.Td><Skeleton height={24} width={28} /></Table.Td>
                    </Table.Tr>
                  ))
                : colors.length === 0
                ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" size="sm" ta="center" py="xl">Nenhuma cor encontrada.</Text>
                      </Table.Td>
                    </Table.Tr>
                  )
                : colors.map(c => (
                    <ColorRow key={c.id} color={c} brands={brands} onEdit={openEdit} />
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
        title={editingColor ? `Editar: ${editingColor.name}` : 'Nova cor'}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <ColorForm
          key={editingColor?.id ?? 'new'}
          color={editingColor}
          brands={brands}
          onSave={handleSaved}
          onClose={closeModal}
        />
      </Modal>
    </>
  )
}