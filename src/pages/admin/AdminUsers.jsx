// src/pages/admin/AdminUsers.jsx
// Listagem e gestão de usuários — backoffice Mublin
// Stack: React + Mantine + Supabase

import { useEffect, useState, useCallback } from 'react'
import {
  Stack,
  Group,
  Title,
  Text,
  TextInput,
  Select,
  Badge,
  Avatar,
  ActionIcon,
  Drawer,
  Divider,
  Skeleton,
  Table,
  Pagination,
  Tooltip,
  CopyButton,
  ThemeIcon,
  SimpleGrid,
  Card,
  Anchor,
  Button,
  Switch,
  Modal,
  Textarea,
  ScrollArea,
  Box,
  Indicator,
  SegmentedControl,
  Alert,
} from '@mantine/core'
import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconSearch,
  IconCrown,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconShieldCheck,
  IconMapPin,
  IconCalendar,
  IconPhone,
  IconWorld,
  IconRefresh,
  IconFilter,
  IconUserShield,
  IconClock,
  IconAlertTriangle,
} from '@tabler/icons-react'
import { supabase } from '../../lib/supabaseClient'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20
const IK_AVATAR = 'https://ik.imagekit.io/mublin/users/avatars/tr:w-80,h-80,fo-face/'

// Opções de duração — valor em dias, label exibido ao admin
const DURATION_OPTIONS = [
  { value: '30', label: '1 mês' },
  { value: '90', label: '3 meses' },
  { value: '180', label: '6 meses' },
  { value: '365', label: '1 ano' },
  { value: '0', label: 'Permanente' }, // 0 = sem expiração
]

const PLAN_OPTIONS = [
  { value: '', label: 'Todos os planos' },
  { value: 'Free', label: 'Free' },
  { value: 'Pro', label: 'Pro' },
]

const ORIGIN_OPTIONS = [
  { value: '', label: 'Todas as origens' },
  { value: 'none', label: 'Sem plano pago' },
  { value: 'purchase', label: 'Compra' },
  { value: 'courtesy', label: 'Cortesia' },
  { value: 'partner', label: 'Parceiro' },
]

const VERIFIED_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Verificados' },
  { value: 'false', label: 'Não verificados' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarUrl(avatar) {
  if (!avatar) {
    return null
  }
  if (avatar.startsWith('http')) {
    return avatar
  }
  return `${IK_AVATAR}${avatar}`
}

function planBadge(plan, origin, expiresAt) {
  if (plan === 'Pro') {
    const expired = expiresAt && new Date(expiresAt) < new Date()
    if (expired) {
      return (
        <Badge size="xs" color="red" variant="light">
          Pro · Expirado
        </Badge>
      )
    }
    const color =
      origin === 'courtesy' ? 'orange' : origin === 'partner' ? 'teal' : 'yellow'
    const label =
      origin === 'courtesy'
        ? 'Pro · Cortesia'
        : origin === 'partner'
          ? 'Pro · Parceiro'
          : 'Pro'
    return (
      <Badge size="xs" color={color} variant="light">
        {label}
      </Badge>
    )
  }
  return (
    <Badge size="xs" color="gray" variant="light">
      Free
    </Badge>
  )
}

function formatDate(iso, opts = {}) {
  if (!iso) {
    return '—'
  }
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  })
}

// Retorna texto descritivo da expiração + cor para o badge
function expiryInfo(expiresAt) {
  if (!expiresAt) {
    return { label: 'Sem prazo (permanente)', color: 'teal', expired: false }
  }
  const now = new Date()
  const exp = new Date(expiresAt)
  const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24)) // dias restantes

  if (diff < 0) {
    return { label: `Expirou em ${formatDate(expiresAt)}`, color: 'red', expired: true }
  }
  if (diff === 0) {
    return { label: 'Expira hoje', color: 'red', expired: false }
  }
  if (diff <= 7) {
    return {
      label: `Expira em ${diff} dia${diff > 1 ? 's' : ''}`,
      color: 'orange',
      expired: false,
    }
  }
  if (diff <= 30) {
    return { label: `Expira em ${diff} dias`, color: 'yellow', expired: false }
  }
  return { label: `Válido até ${formatDate(expiresAt)}`, color: 'teal', expired: false }
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function UserRow({ user, onSelect }) {
  return (
    <Table.Tr style={{ cursor: 'pointer' }} onClick={() => onSelect(user)}>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <Indicator
            disabled={!user.is_live}
            color="green"
            size={8}
            offset={3}
            withBorder
          >
            <Avatar src={avatarUrl(user.avatar)} size={32} radius="xl" color="violet">
              {user.full_name?.[0] ?? '?'}
            </Avatar>
          </Indicator>
          <Box>
            <Group gap={4} wrap="nowrap">
              <Text size="sm" fw={500} lineClamp={1}>
                {user.full_name}
              </Text>
              {user.is_verified && (
                <Tooltip label="Verificado">
                  <ThemeIcon
                    size={14}
                    color="blue"
                    variant="transparent"
                    style={{ flexShrink: 0 }}
                  >
                    <IconShieldCheck size={14} />
                  </ThemeIcon>
                </Tooltip>
              )}
              {user.is_admin && (
                <Tooltip label="Admin">
                  <ThemeIcon
                    size={14}
                    color="violet"
                    variant="transparent"
                    style={{ flexShrink: 0 }}
                  >
                    <IconUserShield size={14} />
                  </ThemeIcon>
                </Tooltip>
              )}
            </Group>
            <Text size="xs" c="dimmed">
              @{user.username ?? '—'}
            </Text>
          </Box>
        </Group>
      </Table.Td>
      <Table.Td visibleFrom="sm">
        <Text size="xs" c="dimmed" ff="monospace" lineClamp={1} maw={220}>
          {user.id}
        </Text>
      </Table.Td>
      <Table.Td>
        <Stack gap={2}>
          {planBadge(user.plan, user.plan_origin, user.plan_expires_at)}
          {/* Exibe prazo na linha quando é cortesia */}
          {user.plan === 'Pro' && user.plan_origin === 'courtesy' && (
            <Text size="xs" c={expiryInfo(user.plan_expires_at).color}>
              {expiryInfo(user.plan_expires_at).label}
            </Text>
          )}
        </Stack>
      </Table.Td>
      <Table.Td visibleFrom="md">
        <Text size="xs" c="dimmed">
          {formatDate(user.created_at)}
        </Text>
      </Table.Td>
      <Table.Td visibleFrom="lg">
        <Text size="xs" c="dimmed" lineClamp={1}>
          {user.title ?? '—'}
        </Text>
      </Table.Td>
    </Table.Tr>
  )
}

// ─── Drawer de detalhe ────────────────────────────────────────────────────────

function UserDrawer({ user, opened, onClose, onUpdate }) {
  const [saving, setSaving] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null) // null | 'grant' | 'revoke' | 'admin'
  const [courtesyNote, setCourtesyNote] = useState('')
  const [durationDays, setDurationDays] = useState('30') // padrão: 1 mês

  if (!user) {
    return null
  }

  const isPro = user.plan === 'Pro'
  const isCourtesy = user.plan_origin === 'courtesy'
  const expiry = isPro && isCourtesy ? expiryInfo(user.plan_expires_at) : null

  async function grantPro() {
    setSaving(true)
    const days = parseInt(durationDays, 10)
    const note = courtesyNote.trim() || null
    let error
    if (days === 0) {
      // Permanente: sem expiração — update direto incluindo plan_note
      ;({ error } = await supabase
        .from('profiles')
        .update({
          plan: 'Pro',
          plan_origin: 'courtesy',
          plan_expires_at: null,
          plan_note: note,
        })
        .eq('id', user.id))
    } else {
      ;({ error } = await supabase.rpc('grant_pro_courtesy', {
        target_id: user.id,
        duration_days: days,
        note,
      }))
    }
    setSaving(false)
    if (error) {
      notifications.show({
        color: 'red',
        message: `Erro ao conceder Pro: ${error.message}`,
      })
    } else {
      const expiresAt =
        days === 0 ? null : new Date(Date.now() + days * 86400000).toISOString()
      notifications.show({
        color: 'teal',
        message: `Plano Pro (cortesia) concedido para @${user.username}.`,
      })
      onUpdate({
        ...user,
        plan: 'Pro',
        plan_origin: 'courtesy',
        plan_expires_at: expiresAt,
        plan_note: note,
      })
      setConfirmModal(null)
    }
  }

  async function revokePro() {
    setSaving(true)
    const note = courtesyNote.trim() || null
    const { error } = await supabase.rpc('revoke_pro_courtesy', {
      target_id: user.id,
      note,
    })
    setSaving(false)
    if (error) {
      notifications.show({
        color: 'red',
        message: `Erro ao revogar Pro: ${error.message}`,
      })
    } else {
      notifications.show({
        color: 'orange',
        message: `Plano Pro revogado de @${user.username}.`,
      })
      onUpdate({
        ...user,
        plan: 'Free',
        plan_origin: 'none',
        plan_expires_at: null,
        plan_note: note,
      })
      setConfirmModal(null)
    }
  }

  async function toggleAdmin() {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !user.is_admin })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      notifications.show({
        color: 'red',
        message: `Erro ao alterar admin: ${error.message}`,
      })
    } else {
      notifications.show({
        color: 'violet',
        message: `Status admin atualizado para @${user.username}.`,
      })
      onUpdate({ ...user, is_admin: !user.is_admin })
      setConfirmModal(null)
    }
  }

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        position="right"
        size="md"
        title={
          <Group gap="sm">
            <Avatar src={avatarUrl(user.avatar)} size={36} radius="xl" color="violet">
              {user.full_name?.[0] ?? '?'}
            </Avatar>
            <Box>
              <Text fw={600} size="sm">
                {user.full_name}
              </Text>
              <Text size="xs" c="dimmed">
                @{user.username ?? '—'}
              </Text>
            </Box>
          </Group>
        }
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="md">
          {/* Badges */}
          <Group gap="xs">
            {planBadge(user.plan, user.plan_origin, user.plan_expires_at)}
            {user.is_verified && (
              <Badge
                size="xs"
                color="blue"
                variant="light"
                leftSection={<IconShieldCheck size={10} />}
              >
                Verificado
              </Badge>
            )}
            {user.is_admin && (
              <Badge
                size="xs"
                color="violet"
                variant="light"
                leftSection={<IconUserShield size={10} />}
              >
                Admin
              </Badge>
            )}
            {user.is_live && (
              <Badge size="xs" color="green" variant="dot">
                Ao vivo
              </Badge>
            )}
          </Group>

          <Divider />

          {/* Info básica */}
          <SimpleGrid cols={2} spacing="xs">
            <Box>
              <Text size="xs" c="dimmed" mb={2}>
                UUID
              </Text>
              <Group gap={4} wrap="nowrap">
                <Text size="xs" ff="monospace" lineClamp={1} style={{ maxWidth: 140 }}>
                  {user.id}
                </Text>
                <CopyButton value={user.id} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copiado!' : 'Copiar UUID'}>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color={copied ? 'teal' : 'gray'}
                        onClick={copy}
                      >
                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Box>
            <Box>
              <Text size="xs" c="dimmed" mb={2}>
                Cadastro
              </Text>
              <Group gap={4}>
                <IconCalendar
                  size={12}
                  style={{ color: 'var(--mantine-color-dimmed)' }}
                />
                <Text size="xs">{formatDate(user.created_at)}</Text>
              </Group>
            </Box>
            {user.title && (
              <Box style={{ gridColumn: 'span 2' }}>
                <Text size="xs" c="dimmed" mb={2}>
                  Título
                </Text>
                <Text size="sm">{user.title}</Text>
              </Box>
            )}
            {user.bio && (
              <Box style={{ gridColumn: 'span 2' }}>
                <Text size="xs" c="dimmed" mb={2}>
                  Bio
                </Text>
                <Text size="xs" c="dimmed" lineClamp={4}>
                  {user.bio}
                </Text>
              </Box>
            )}
          </SimpleGrid>

          {/* Localização */}
          {(user.cities?.name || user.regions?.name) && (
            <Group gap={6}>
              <IconMapPin size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
              <Text size="sm" c="dimmed">
                {[user.cities?.name, user.regions?.uf].filter(Boolean).join(', ')}
              </Text>
            </Group>
          )}

          {/* Contato */}
          {user.website && (
            <Group gap={6}>
              <IconWorld size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
              <Anchor size="sm" href={user.website} target="_blank" rel="noopener">
                {user.website.replace(/^https?:\/\//, '')}
              </Anchor>
            </Group>
          )}
          {user.phone_number && user.phone_number_is_public && (
            <Group gap={6}>
              <IconPhone size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
              <Text size="sm">{user.phone_number}</Text>
            </Group>
          )}

          <Divider label="Plano" labelPosition="left" />

          <Card withBorder radius="md" padding="sm">
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                Plano atual
              </Text>
              {planBadge(user.plan, user.plan_origin, user.plan_expires_at)}
            </Group>

            {/* Detalhes da cortesia ativa */}
            {isPro && isCourtesy && expiry && (
              <Group gap={6} mb="sm">
                <IconClock
                  size={13}
                  style={{ color: `var(--mantine-color-${expiry.color}-6)` }}
                />
                <Text size="xs" c={expiry.color}>
                  {expiry.label}
                </Text>
              </Group>
            )}

            {/* Cortesia expirada: alerta para reconcessão */}
            {isPro && isCourtesy && expiry?.expired && (
              <Alert
                variant="light"
                color="red"
                mb="sm"
                icon={<IconAlertTriangle size={14} />}
              >
                <Text size="xs">
                  Esta cortesia expirou. O usuário ainda aparece como Pro no banco, mas{' '}
                  <code>effective_plan()</code> já retorna Free para o app. Reconcedam ou
                  revoguem abaixo.
                </Text>
              </Alert>
            )}

            {isPro && (
              <Text size="xs" c="dimmed" mb="sm">
                Origem: <strong>{user.plan_origin}</strong>
              </Text>
            )}

            {/* Observação interna salva */}
            {user.plan_note && (
              <Text size="xs" c="dimmed" mb="sm" fs="italic">
                "{user.plan_note}"
              </Text>
            )}

            {!isPro ? (
              <Button
                size="xs"
                variant="light"
                color="yellow"
                leftSection={<IconCrown size={14} />}
                onClick={() => setConfirmModal('grant')}
              >
                Conceder Pro (cortesia)
              </Button>
            ) : isCourtesy ? (
              <Group gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="orange"
                  leftSection={<IconCrown size={14} />}
                  onClick={() => setConfirmModal('grant')}
                >
                  Renovar cortesia
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  onClick={() => setConfirmModal('revoke')}
                >
                  Revogar
                </Button>
              </Group>
            ) : (
              <Text size="xs" c="dimmed">
                Plano pago — não gerenciável aqui.
              </Text>
            )}
          </Card>

          <Divider label="Acesso" labelPosition="left" />

          <Card withBorder radius="md" padding="sm">
            <Group justify="space-between">
              <Box>
                <Text size="sm" fw={500}>
                  Acesso admin
                </Text>
                <Text size="xs" c="dimmed">
                  Permite acessar o backoffice
                </Text>
              </Box>
              <Switch
                checked={user.is_admin}
                onChange={() => setConfirmModal('admin')}
                color="violet"
                size="sm"
              />
            </Group>
          </Card>

          <Divider />

          <Anchor href={`/${user.username}`} target="_blank" rel="noopener" size="sm">
            <Group gap={6}>
              <IconExternalLink size={14} />
              Ver perfil público
            </Group>
          </Anchor>
        </Stack>
      </Drawer>

      {/* Modal: conceder / renovar Pro */}
      <Modal
        opened={confirmModal === 'grant'}
        onClose={() => setConfirmModal(null)}
        title={
          isCourtesy
            ? `Renovar cortesia — @${user.username}`
            : `Conceder Pro (cortesia) — @${user.username}`
        }
        size="sm"
        centered
      >
        <Stack gap="md">
          <Box>
            <Text size="xs" c="dimmed" mb={8}>
              Duração da cortesia
            </Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={durationDays}
              onChange={setDurationDays}
              data={DURATION_OPTIONS}
            />
          </Box>

          {durationDays !== '0' && (
            <Text size="xs" c="dimmed">
              Válido até{' '}
              <strong>
                {formatDate(
                  new Date(Date.now() + parseInt(durationDays) * 86400000).toISOString(),
                )}
              </strong>
              . Após esse prazo, <code>effective_plan()</code> retornará Free
              automaticamente — sem ação adicional necessária.
            </Text>
          )}

          {durationDays === '0' && (
            <Text size="xs" c="dimmed">
              Sem data de expiração. A cortesia será permanente até ser revogada
              manualmente.
            </Text>
          )}

          <Textarea
            label="Observação interna (opcional)"
            placeholder="Ex: músico parceiro, influencer, testador beta..."
            value={courtesyNote}
            onChange={(e) => setCourtesyNote(e.currentTarget.value)}
            rows={2}
          />

          <Group justify="flex-end">
            <Button variant="default" size="xs" onClick={() => setConfirmModal(null)}>
              Cancelar
            </Button>
            <Button size="xs" color="yellow" loading={saving} onClick={grantPro}>
              {isCourtesy ? 'Renovar' : 'Confirmar'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal: revogar Pro */}
      <Modal
        opened={confirmModal === 'revoke'}
        onClose={() => setConfirmModal(null)}
        title="Revogar plano Pro"
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Isso vai rebaixar <strong>@{user.username}</strong> para o plano{' '}
            <strong>Free</strong> e limpar o prazo de expiração. Tem certeza?
          </Text>
          <Textarea
            label="Motivo da revogação (opcional)"
            placeholder="Ex: período de teste encerrado, solicitação do usuário..."
            value={courtesyNote}
            onChange={(e) => setCourtesyNote(e.currentTarget.value)}
            rows={2}
          />
          <Group justify="flex-end">
            <Button variant="default" size="xs" onClick={() => setConfirmModal(null)}>
              Cancelar
            </Button>
            <Button size="xs" color="red" loading={saving} onClick={revokePro}>
              Revogar
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal: toggle admin */}
      <Modal
        opened={confirmModal === 'admin'}
        onClose={() => setConfirmModal(null)}
        title={user.is_admin ? 'Remover acesso admin' : 'Conceder acesso admin'}
        size="sm"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {user.is_admin
              ? `@${user.username} perderá acesso ao backoffice.`
              : `@${user.username} poderá acessar o backoffice. Use com cautela.`}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" size="xs" onClick={() => setConfirmModal(null)}>
              Cancelar
            </Button>
            <Button size="xs" color="violet" loading={saving} onClick={toggleAdmin}>
              Confirmar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 350)
  const [planFilter, setPlanFilter] = useState('')
  const [originFilter, setOriginFilter] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')

  const [selectedUser, setSelectedUser] = useState(null)
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false)

  const fetchUsers = useCallback(
    async (currentPage) => {
      setLoading(true)
      const from = (currentPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      let query = supabase
        .from('profiles')
        .select(
          `id, full_name, username, avatar, plan, plan_origin, plan_expires_at, plan_note,
         is_verified, is_admin, is_live, title, bio,
         website, phone_number, phone_number_is_public, created_at,
         cities ( name ), regions ( name, uf )`,
          { count: 'exact' },
        )
        .order('created_at', { ascending: false })
        .range(from, to)

      if (debouncedSearch) {
        query = query.or(
          `full_name.ilike.%${debouncedSearch}%,username.ilike.%${debouncedSearch}%`,
        )
      }
      if (planFilter) {
        query = query.eq('plan', planFilter)
      }
      if (originFilter) {
        query = query.eq('plan_origin', originFilter)
      }
      if (verifiedFilter !== '') {
        query = query.eq('is_verified', verifiedFilter === 'true')
      }

      const { data, count, error } = await query

      if (error) {
        notifications.show({
          color: 'red',
          message: `Erro ao carregar usuários: ${error.message}`,
        })
      } else {
        setUsers(data ?? [])
        setTotal(count ?? 0)
      }
      setLoading(false)
    },
    [debouncedSearch, planFilter, originFilter, verifiedFilter],
  )

  useEffect(() => {
    setPage(1)
    fetchUsers(1)
  }, [debouncedSearch, planFilter, originFilter, verifiedFilter])

  useEffect(() => {
    fetchUsers(page)
  }, [page])

  function handleSelectUser(user) {
    setSelectedUser(user)
    openDrawer()
  }

  function handleUserUpdate(updatedUser) {
    setSelectedUser(updatedUser)
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const hasActiveFilters = planFilter || originFilter || verifiedFilter

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={3} fw={500}>
              Usuários
            </Title>
            <Text size="sm" c="dimmed">
              {loading ? '...' : `${total.toLocaleString('pt-BR')} usuários cadastrados`}
            </Text>
          </Box>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => fetchUsers(page)}
            loading={loading}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>

        <Group gap="sm" wrap="wrap">
          <TextInput
            placeholder="Buscar por nome ou @username"
            leftSection={<IconSearch size={14} />}
            value={search}
            size="sm"
            style={{ flex: 1, minWidth: 200 }}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            placeholder="Plano"
            data={PLAN_OPTIONS}
            value={planFilter}
            size="sm"
            w={150}
            clearable
            onChange={(v) => setPlanFilter(v ?? '')}
          />
          <Select
            placeholder="Origem"
            data={ORIGIN_OPTIONS}
            value={originFilter}
            size="sm"
            w={160}
            clearable
            onChange={(v) => setOriginFilter(v ?? '')}
          />
          <Select
            placeholder="Verificação"
            data={VERIFIED_OPTIONS}
            value={verifiedFilter}
            size="sm"
            w={150}
            clearable
            onChange={(v) => setVerifiedFilter(v ?? '')}
          />
          {hasActiveFilters && (
            <Tooltip label="Limpar filtros">
              <ActionIcon
                variant="light"
                color="gray"
                size="sm"
                onClick={() => {
                  setPlanFilter('')
                  setOriginFilter('')
                  setVerifiedFilter('')
                }}
              >
                <IconFilter size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        <Box style={{ overflowX: 'auto' }}>
          <Table highlightOnHover verticalSpacing="sm" striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Usuário</Table.Th>
                <Table.Th visibleFrom="sm">UUID</Table.Th>
                <Table.Th>Plano</Table.Th>
                <Table.Th visibleFrom="md">Cadastro</Table.Th>
                <Table.Th visibleFrom="lg">Título</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Group gap="sm">
                        <Skeleton circle height={32} />
                        <Box>
                          <Skeleton height={12} width={120} mb={4} />
                          <Skeleton height={10} width={80} />
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td visibleFrom="sm">
                      <Skeleton height={10} width={180} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton height={18} width={80} radius="xl" />
                    </Table.Td>
                    <Table.Td visibleFrom="md">
                      <Skeleton height={10} width={90} />
                    </Table.Td>
                    <Table.Td visibleFrom="lg">
                      <Skeleton height={10} width={120} />
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : users.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" size="sm" ta="center" py="xl">
                      Nenhum usuário encontrado.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                users.map((user) => (
                  <UserRow key={user.id} user={user} onSelect={handleSelectUser} />
                ))
              )}
            </Table.Tbody>
          </Table>
        </Box>

        {totalPages > 1 && (
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              Página {page} de {totalPages}
            </Text>
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
              withEdges
            />
          </Group>
        )}
      </Stack>

      <UserDrawer
        user={selectedUser}
        opened={drawerOpened}
        onClose={closeDrawer}
        onUpdate={handleUserUpdate}
      />
    </>
  )
}
