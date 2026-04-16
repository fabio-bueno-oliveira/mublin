// src/pages/admin/AdminPlans.jsx
// Visão analítica de planos e cortesias — backoffice Mublin
// Stack: React + Mantine + Supabase

import { useEffect, useState, useCallback } from 'react'
import {
  Stack, Group, Title, Text, Badge, Avatar, ActionIcon,
  Skeleton, Table, Pagination, Tooltip, Button, Modal,
  Box, SimpleGrid, Card, ThemeIcon, Divider, Textarea,
  SegmentedControl, Alert, Anchor,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconCrown, IconRefresh, IconClock, IconAlertTriangle,
  IconCircleCheck, IconInfinity, IconBrandStripe,
  IconGift, IconHeartHandshake, IconUsers, IconExternalLink,
} from '@tabler/icons-react'
import { supabase } from '../../lib/supabaseClient'

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAGE_SIZE    = 30
const IK_AVATAR    = 'https://ik.imagekit.io/mublin/users/avatars/tr:w-80,h-80,fo-face/'

const DURATION_OPTIONS = [
  { value: '30',  label: '1 mês'      },
  { value: '90',  label: '3 meses'    },
  { value: '180', label: '6 meses'    },
  { value: '365', label: '1 ano'      },
  { value: '0',   label: 'Permanente' },
]

const ORIGIN_FILTER_OPTIONS = [
  { value: '',          label: 'Todas as origens' },
  { value: 'purchase',  label: 'Stripe / compra'  },
  { value: 'courtesy',  label: 'Cortesia'         },
  { value: 'partner',   label: 'Parceiro'         },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarUrl(avatar) {
  if (!avatar) return null
  if (avatar.startsWith('http')) return avatar
  return `${IK_AVATAR}${avatar}`
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// Retorna estado da expiração com label, cor e ícone
function expiryInfo(expiresAt) {
  if (!expiresAt) {
    return { label: 'Permanente', color: 'teal', icon: IconInfinity, expired: false }
  }
  const diff = Math.ceil((new Date(expiresAt) - new Date()) / 86400000)
  if (diff < 0)   return { label: `Expirou em ${formatDate(expiresAt)}`, color: 'red',    icon: IconAlertTriangle, expired: true  }
  if (diff === 0) return { label: 'Expira hoje',                          color: 'red',    icon: IconAlertTriangle, expired: false }
  if (diff <= 7)  return { label: `${diff}d restantes`,                   color: 'orange', icon: IconClock,         expired: false }
  if (diff <= 30) return { label: `${diff}d restantes`,                   color: 'yellow', icon: IconClock,         expired: false }
  return             { label: `Até ${formatDate(expiresAt)}`,             color: 'teal',   icon: IconCircleCheck,   expired: false }
}

// Metadados de cada origem — prontos para quando a Stripe chegar
const ORIGIN_META = {
  purchase: { label: 'Stripe',    color: 'blue',   icon: IconBrandStripe },
  courtesy: { label: 'Cortesia',  color: 'orange', icon: IconGift        },
  partner:  { label: 'Parceiro',  color: 'teal',   icon: IconHeartHandshake   },
  none:     { label: 'Free',      color: 'gray',   icon: IconUsers       },
}

function originBadge(origin) {
  const meta = ORIGIN_META[origin] ?? { label: origin, color: 'gray', icon: IconUsers }
  return (
    <Badge size="xs" color={meta.color} variant="light">
      {meta.label}
    </Badge>
  )
}

// ─── Cards de métricas ────────────────────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, color, sub, loading }) {
  return (
    <Card withBorder radius="md" padding="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>{label}</Text>
          {loading
            ? <Skeleton height={28} width={50} />
            : <Text size="xl" fw={700}>{value ?? '—'}</Text>
          }
          {sub && (
            loading
              ? <Skeleton height={11} width={80} mt={2} />
              : <Text size="xs" c="dimmed">{sub}</Text>
          )}
        </Stack>
        <ThemeIcon variant="light" color={color} size="lg" radius="md">
          <Icon size={18} stroke={1.5} />
        </ThemeIcon>
      </Group>
    </Card>
  )
}

// ─── Modal de gestão de cortesia ──────────────────────────────────────────────

function CourtesyModal({ user, opened, onClose, onUpdate }) {
  const [mode,          setMode]          = useState('grant') // 'grant' | 'revoke'
  const [durationDays,  setDurationDays]  = useState('30')
  const [note,          setNote]          = useState(user?.plan_note ?? '')
  const [saving,        setSaving]        = useState(false)

  useEffect(() => {
    if (opened) {
      setNote(user?.plan_note ?? '')
      setMode('grant')
      setDurationDays('30')
    }
  }, [opened, user])

  if (!user) return null

  const isCourtesy = user.plan_origin === 'courtesy'
  const expiry     = isCourtesy ? expiryInfo(user.plan_expires_at) : null

  async function handleGrant() {
    setSaving(true)
    const days    = parseInt(durationDays, 10)
    const trimmed = note.trim() || null
    let error

    if (days === 0) {
      ;({ error } = await supabase
        .from('profiles')
        .update({ plan: 'Pro', plan_origin: 'courtesy', plan_expires_at: null, plan_note: trimmed })
        .eq('id', user.id))
    } else {
      ;({ error } = await supabase.rpc('grant_pro_courtesy', {
        target_id:     user.id,
        duration_days: days,
        note:          trimmed,
      }))
    }

    setSaving(false)
    if (error) {
      notifications.show({ color: 'red', message: 'Erro: ' + error.message })
      return
    }
    const expiresAt = days === 0 ? null : new Date(Date.now() + days * 86400000).toISOString()
    notifications.show({ color: 'teal', message: `Cortesia ${isCourtesy ? 'renovada' : 'concedida'} para @${user.username}.` })
    onUpdate({ ...user, plan: 'Pro', plan_origin: 'courtesy', plan_expires_at: expiresAt, plan_note: trimmed })
    onClose()
  }

  async function handleRevoke() {
    setSaving(true)
    const trimmed = note.trim() || null
    const { error } = await supabase.rpc('revoke_pro_courtesy', {
      target_id: user.id,
      note:      trimmed,
    })
    setSaving(false)
    if (error) {
      notifications.show({ color: 'red', message: 'Erro: ' + error.message })
      return
    }
    notifications.show({ color: 'orange', message: `Cortesia revogada de @${user.username}.` })
    onUpdate({ ...user, plan: 'Free', plan_origin: 'none', plan_expires_at: null, plan_note: trimmed })
    onClose()
  }

  return (
    <Modal
      opened={opened} onClose={onClose} centered size="sm"
      title={
        <Group gap="sm">
          <Avatar src={avatarUrl(user.avatar)} size={28} radius="xl" color="violet">
            {user.full_name?.[0] ?? '?'}
          </Avatar>
          <Box>
            <Text size="sm" fw={600}>{user.full_name}</Text>
            <Text size="xs" c="dimmed">@{user.username}</Text>
          </Box>
        </Group>
      }
    >
      <Stack gap="md">

        {/* Situação atual */}
        {isCourtesy && expiry && (
          <Alert
            variant="light"
            color={expiry.color}
            icon={<expiry.icon size={14} />}
          >
            <Text size="xs">{expiry.label}</Text>
            {user.plan_note && <Text size="xs" c="dimmed" mt={2} fs="italic">"{user.plan_note}"</Text>}
          </Alert>
        )}

        {/* Tabs grant / revoke para cortesias existentes */}
        {isCourtesy && (
          <SegmentedControl
            fullWidth size="xs"
            value={mode}
            onChange={setMode}
            data={[
              { value: 'grant',  label: 'Renovar cortesia' },
              { value: 'revoke', label: 'Revogar'          },
            ]}
          />
        )}

        {/* Formulário de concessão / renovação */}
        {(!isCourtesy || mode === 'grant') && (
          <>
            <Box>
              <Text size="xs" c="dimmed" mb={8}>Duração</Text>
              <SegmentedControl
                fullWidth size="xs"
                value={durationDays}
                onChange={setDurationDays}
                data={DURATION_OPTIONS}
              />
            </Box>
            {durationDays !== '0' && (
              <Text size="xs" c="dimmed">
                Válido até{' '}
                <strong>
                  {formatDate(new Date(Date.now() + parseInt(durationDays) * 86400000).toISOString())}
                </strong>
              </Text>
            )}
          </>
        )}

        {/* Campo de observação — presente em ambos os modos */}
        <Textarea
          label={mode === 'revoke' ? 'Motivo da revogação (opcional)' : 'Observação interna (opcional)'}
          placeholder={
            mode === 'revoke'
              ? 'Ex: período de teste encerrado...'
              : 'Ex: músico parceiro, influencer, testador beta...'
          }
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          rows={2}
        />

        <Group justify="flex-end">
          <Button variant="default" size="xs" onClick={onClose} disabled={saving}>Cancelar</Button>
          {(!isCourtesy || mode === 'grant') && (
            <Button size="xs" color="yellow" loading={saving} onClick={handleGrant}>
              {isCourtesy ? 'Renovar' : 'Conceder Pro'}
            </Button>
          )}
          {isCourtesy && mode === 'revoke' && (
            <Button size="xs" color="red" loading={saving} onClick={handleRevoke}>
              Revogar
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  )
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function PlanRow({ user, onManage }) {
  const isCourtesy = user.plan_origin === 'courtesy'
  const isPurchase = user.plan_origin === 'purchase'
  const expiry     = isCourtesy ? expiryInfo(user.plan_expires_at) : null
  const ExpiryIcon = expiry?.icon

  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <Avatar src={avatarUrl(user.avatar)} size={32} radius="xl" color="violet">
            {user.full_name?.[0] ?? '?'}
          </Avatar>
          <Box>
            <Text size="sm" fw={500} lineClamp={1}>{user.full_name}</Text>
            <Text size="xs" c="dimmed">@{user.username ?? '—'}</Text>
          </Box>
        </Group>
      </Table.Td>

      <Table.Td>
        {originBadge(user.plan_origin)}
      </Table.Td>

      {/* Prazo — só relevante para cortesias */}
      <Table.Td visibleFrom="sm">
        {isCourtesy && expiry ? (
          <Group gap={4} wrap="nowrap">
            <ExpiryIcon size={13} color={`var(--mantine-color-${expiry.color}-6)`} />
            <Text size="xs" c={expiry.color}>{expiry.label}</Text>
          </Group>
        ) : isPurchase ? (
          <Text size="xs" c="dimmed">Stripe</Text>
        ) : (
          <Text size="xs" c="dimmed">—</Text>
        )}
      </Table.Td>

      {/* Observação interna */}
      <Table.Td visibleFrom="md">
        {user.plan_note
          ? <Text size="xs" c="dimmed" lineClamp={1} fs="italic">"{user.plan_note}"</Text>
          : <Text size="xs" c="dimmed">—</Text>
        }
      </Table.Td>

      <Table.Td visibleFrom="lg">
        <Text size="xs" c="dimmed">{formatDate(user.created_at)}</Text>
      </Table.Td>

      <Table.Td>
        <Group gap={6} justify="flex-end" wrap="nowrap">
          <Tooltip label="Ver perfil">
            <ActionIcon
              component="a"
              href={`/${user.username}`}
              target="_blank"
              variant="subtle" color="gray" size="sm"
            >
              <IconExternalLink size={14} />
            </ActionIcon>
          </Tooltip>
          {/* Ação de gestão só para cortesias — Stripe será gerenciado pelo próprio portal */}
          {isCourtesy && (
            <Tooltip label="Gerenciar cortesia">
              <ActionIcon
                variant="light" color="orange" size="sm"
                onClick={() => onManage(user)}
              >
                <IconGift size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {isPurchase && (
            <Tooltip label="Gerenciado pela Stripe (em breve)">
              <ActionIcon variant="subtle" color="blue" size="sm" disabled>
                <IconBrandStripe size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminPlans() {
  const [users,    setUsers]    = useState([])
  const [metrics,  setMetrics]  = useState(null)
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [mLoading, setMLoading] = useState(true)
  const [page,     setPage]     = useState(1)
  const [origin,   setOrigin]   = useState('')

  const [managingUser, setManagingUser] = useState(null)
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)

  // ─── Métricas ───────────────────────────────────────────────────────────────

  async function fetchMetrics() {
    setMLoading(true)
    const now = new Date().toISOString()

    const [
      { count: totalPro },
      { count: purchase },
      { count: courtesy },
      { count: partner  },
      { count: expiring },  // vence em até 30 dias
      { count: expired  },  // já expirou
      { count: permanent }, // cortesia sem prazo
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'Pro'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'Pro').eq('plan_origin', 'purchase'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'Pro').eq('plan_origin', 'courtesy'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'Pro').eq('plan_origin', 'partner'),
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .eq('plan_origin', 'courtesy')
        .gt('plan_expires_at', now)
        .lt('plan_expires_at', new Date(Date.now() + 30 * 86400000).toISOString()),
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .eq('plan_origin', 'courtesy')
        .lt('plan_expires_at', now),
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .eq('plan_origin', 'courtesy')
        .is('plan_expires_at', null),
    ])

    setMetrics({ totalPro, purchase, courtesy, partner, expiring, expired, permanent })
    setMLoading(false)
  }

  // ─── Listagem ────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async (currentPage) => {
    setLoading(true)
    const from = (currentPage - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1

    let query = supabase
      .from('profiles')
      .select(
        `id, full_name, username, avatar, plan, plan_origin,
         plan_expires_at, plan_note, created_at`,
        { count: 'exact' }
      )
      .eq('plan', 'Pro')
      // Ordena: expirados e vencendo primeiro (cortesias), depois resto por origem
      .order('plan_expires_at', { ascending: true, nullsFirst: false })
      .order('plan_origin', { ascending: true })
      .range(from, to)

    if (origin) query = query.eq('plan_origin', origin)

    const { data, count, error } = await query
    if (error) notifications.show({ color: 'red', message: 'Erro ao carregar: ' + error.message })
    else { setUsers(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [origin])

  useEffect(() => { fetchMetrics() }, [])

  useEffect(() => {
    setPage(1)
    fetchUsers(1)
  }, [origin])

  useEffect(() => {
    fetchUsers(page)
  }, [page])

  function handleManage(user) {
    setManagingUser(user)
    openModal()
  }

  function handleUpdate(updatedUser) {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
    // Atualiza métricas após uma ação
    fetchMetrics()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <Stack gap="lg">

        {/* Cabeçalho */}
        <Group justify="space-between" align="flex-end">
          <Box>
            <Title order={3} fw={500}>Planos</Title>
            <Text size="sm" c="dimmed">
              {mLoading ? '...' : `${metrics?.totalPro ?? 0} usuários com plano Pro`}
            </Text>
          </Box>
          <ActionIcon
            variant="subtle" color="gray"
            loading={loading || mLoading}
            onClick={() => { fetchMetrics(); fetchUsers(page) }}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>

        {/* Métricas por origem */}
        <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="sm">
          <MetricCard
            label="Pro total" value={metrics?.totalPro} color="yellow"
            icon={IconCrown} loading={mLoading}
          />
          <MetricCard
            label="Stripe" value={metrics?.purchase} color="blue"
            icon={IconBrandStripe} loading={mLoading}
            sub="planos pagos"
          />
          <MetricCard
            label="Cortesias" value={metrics?.courtesy} color="orange"
            icon={IconGift} loading={mLoading}
            sub="ativas + expiradas"
          />
          <MetricCard
            label="Parceiros" value={metrics?.partner} color="teal"
            icon={IconHeartHandshake} loading={mLoading}
          />
          <MetricCard
            label="Vencem em 30d" value={metrics?.expiring} color="yellow"
            icon={IconClock} loading={mLoading}
            sub="requer atenção"
          />
          <MetricCard
            label="Expiradas" value={metrics?.expired} color="red"
            icon={IconAlertTriangle} loading={mLoading}
            sub="banco ≠ app"
          />
        </SimpleGrid>

        <Divider />

        {/* Filtro de origem */}
        <Group>
          <SegmentedControl
            size="xs"
            value={origin}
            onChange={setOrigin}
            data={ORIGIN_FILTER_OPTIONS}
          />
        </Group>

        {/* Tabela */}
        <Box style={{ overflowX: 'auto' }}>
          <Table highlightOnHover verticalSpacing="sm" striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Usuário</Table.Th>
                <Table.Th>Origem</Table.Th>
                <Table.Th visibleFrom="sm">Prazo</Table.Th>
                <Table.Th visibleFrom="md">Observação</Table.Th>
                <Table.Th visibleFrom="lg">Cadastro</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Table.Tr key={i}>
                      <Table.Td>
                        <Group gap="sm">
                          <Skeleton circle height={32} />
                          <Box><Skeleton height={12} width={120} mb={4} /><Skeleton height={10} width={80} /></Box>
                        </Group>
                      </Table.Td>
                      <Table.Td><Skeleton height={18} width={70} radius="xl" /></Table.Td>
                      <Table.Td visibleFrom="sm"><Skeleton height={10} width={100} /></Table.Td>
                      <Table.Td visibleFrom="md"><Skeleton height={10} width={140} /></Table.Td>
                      <Table.Td visibleFrom="lg"><Skeleton height={10} width={90} /></Table.Td>
                      <Table.Td><Skeleton height={24} width={56} /></Table.Td>
                    </Table.Tr>
                  ))
                : users.length === 0
                ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text c="dimmed" size="sm" ta="center" py="xl">
                          Nenhum usuário Pro encontrado.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )
                : users.map(user => (
                    <PlanRow key={user.id} user={user} onManage={handleManage} />
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

      {/* Modal de gestão de cortesia */}
      <CourtesyModal
        user={managingUser}
        opened={modalOpened}
        onClose={closeModal}
        onUpdate={handleUpdate}
      />
    </>
  )
}
