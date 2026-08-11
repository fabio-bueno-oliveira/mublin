import { useEffect, useState } from 'react'
import {
  SimpleGrid,
  Card,
  Text,
  Title,
  Skeleton,
  Group,
  ThemeIcon,
  Stack,
  Table,
  Avatar,
} from '@mantine/core'
import {
  IconUsers,
  IconCrown,
  IconMapPin,
  IconPackage,
  IconBuildingStore,
  IconCalendarEvent,
} from '@tabler/icons-react'
import { supabase } from '../../lib/supabaseClient'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

// Quantidade de usuários recentes exibidos na tabela
const RECENT_LOGINS_LIMIT = 10

// Formata a data de último login em algo tipo "12 min atrás"
function timeAgo(dateString) {
  if (!dateString) {
    return 'nunca logou'
  }
  const diffMs = Date.now() - new Date(dateString).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) {
    return 'agora mesmo'
  }
  if (minutes < 60) {
    return `${minutes} min atrás`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} h atrás`
  }
  const days = Math.floor(hours / 24)
  if (days < 30) {
    return `${days} d atrás`
  }
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const STATS = [
  {
    key: 'users',
    label: 'Usuários',
    icon: IconUsers,
    color: 'violet',
    query: () => supabase.from('profiles').select('id', { count: 'exact', head: true }),
  },
  {
    key: 'pro',
    label: 'Usuários Pro',
    icon: IconCrown,
    color: 'yellow',
    query: () =>
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('plan', 'Pro'),
    // Query extra: conta cortesias dentro do total Pro
    extraQuery: () =>
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('plan', 'Pro')
        .eq('plan_origin', 'courtesy'),
    extraLabel: 'cortesia',
  },
  {
    key: 'brands',
    label: 'Marcas',
    icon: IconBuildingStore,
    color: 'teal',
    query: () => supabase.from('brands').select('id', { count: 'exact', head: true }),
  },
  {
    key: 'products',
    label: 'Produtos',
    icon: IconPackage,
    color: 'blue',
    query: () => supabase.from('products').select('id', { count: 'exact', head: true }),
  },
  {
    key: 'venues',
    label: 'Venues',
    icon: IconMapPin,
    color: 'orange',
    query: () => supabase.from('venues').select('id', { count: 'exact', head: true }),
  },
  {
    key: 'events',
    label: 'Eventos',
    icon: IconCalendarEvent,
    color: 'pink',
    query: () => supabase.from('events').select('id', { count: 'exact', head: true }),
  },
]

function StatCard({ stat, value, extraValue, loading }) {
  const Icon = stat.icon

  return (
    <Card withBorder radius="md" padding="lg">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
            {stat.label}
          </Text>
          {loading ? (
            <Skeleton height={32} width={60} />
          ) : (
            <Text size="xl" fw={700}>
              {value?.toLocaleString('pt-BR') ?? '—'}
            </Text>
          )}
          {/* Detalhe de cortesias — só aparece se o stat tiver extraLabel */}
          {stat.extraLabel &&
            (loading ? (
              <Skeleton height={12} width={80} mt={2} />
            ) : extraValue != null && extraValue > 0 ? (
              <Text size="xs" c="dimmed">
                {extraValue.toLocaleString('pt-BR')} {stat.extraLabel}
              </Text>
            ) : (
              <Text size="xs" c="dimmed">
                nenhuma cortesia
              </Text>
            ))}
        </Stack>
        <ThemeIcon variant="light" color={stat.color} size="lg" radius="md">
          <Icon size={18} stroke={1.5} />
        </ThemeIcon>
      </Group>
    </Card>
  )
}

function RecentLoginsTable({ users, loading }) {
  return (
    <Card withBorder radius="md" padding="lg">
      <Title order={5} fw={600} mb="md">
        Logins recentes
      </Title>

      {loading ? (
        <Stack gap="xs">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={36} radius="sm" />
          ))}
        </Stack>
      ) : users.length === 0 ? (
        <Text size="sm" c="dimmed">
          Nenhum login registrado ainda.
        </Text>
      ) : (
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Usuário</Table.Th>
              <Table.Th>Último login</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((user) => (
              <Table.Tr key={user.id}>
                <Table.Td>
                  <Group gap="sm">
                    <Avatar src={AVATAR_PATH + user.avatar} radius="xl" size={28}>
                      {user.full_name?.charAt(0) ?? '?'}
                    </Avatar>
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>
                        {user.full_name}
                      </Text>
                      {user.username && (
                        <Text size="xs" c="dimmed">
                          @{user.username}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {timeAgo(user.last_sign_in_at)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  )
}

export default function AdminIndex() {
  const [data, setData] = useState({})
  const [extraData, setExtraData] = useState({})
  const [loading, setLoading] = useState(true)
  const [recentUsers, setRecentUsers] = useState([])
  const [loadingRecent, setLoadingRecent] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const results = await Promise.all(
        STATS.map(async (stat) => {
          const main = stat.query()
          const extra = stat.extraQuery
            ? stat.extraQuery()
            : Promise.resolve({ count: null })
          const [{ count }, { count: extraCount }] = await Promise.all([main, extra])
          return { key: stat.key, count, extraCount }
        }),
      )
      setData(Object.fromEntries(results.map((r) => [r.key, r.count])))
      setExtraData(Object.fromEntries(results.map((r) => [r.key, r.extraCount])))
      setLoading(false)
    }

    // Chama a função SQL get_recent_logins (ver get_recent_logins.sql),
    // que junta profiles com auth.users — sem precisar de coluna extra,
    // trigger ou código no fluxo de auth.
    async function fetchRecentLogins() {
      const { data: users, error } = await supabase.rpc('get_recent_logins', {
        limit_count: RECENT_LOGINS_LIMIT,
      })

      if (!error) {
        setRecentUsers(users)
      }
      setLoadingRecent(false)
    }

    fetchStats()
    fetchRecentLogins()
  }, [])

  return (
    <Stack gap="lg">
      <Title order={3} fw={500}>
        Dashboard
      </Title>

      <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="md">
        {STATS.map((stat) => (
          <StatCard
            key={stat.key}
            stat={stat}
            value={data[stat.key]}
            extraValue={extraData[stat.key]}
            loading={loading}
          />
        ))}
      </SimpleGrid>

      <RecentLoginsTable users={recentUsers} loading={loadingRecent} />
    </Stack>
  )
}
