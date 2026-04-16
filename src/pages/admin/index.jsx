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
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'Pro'),
    // Query extra: conta cortesias dentro do total Pro
    extraQuery: () =>
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'Pro').eq('plan_origin', 'courtesy'),
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
          {stat.extraLabel && (
            loading
              ? <Skeleton height={12} width={80} mt={2} />
              : extraValue != null && extraValue > 0
              ? (
                  <Text size="xs" c="dimmed">
                    {extraValue.toLocaleString('pt-BR')} {stat.extraLabel}
                  </Text>
                )
              : (
                  <Text size="xs" c="dimmed">nenhuma cortesia</Text>
                )
          )}
        </Stack>
        <ThemeIcon variant="light" color={stat.color} size="lg" radius="md">
          <Icon size={18} stroke={1.5} />
        </ThemeIcon>
      </Group>
    </Card>
  )
}

export default function AdminIndex() {
  const [data,      setData]      = useState({})
  const [extraData, setExtraData] = useState({})
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const results = await Promise.all(
        STATS.map(async (stat) => {
          const main  = stat.query()
          const extra = stat.extraQuery ? stat.extraQuery() : Promise.resolve({ count: null })
          const [{ count }, { count: extraCount }] = await Promise.all([main, extra])
          return { key: stat.key, count, extraCount }
        })
      )
      setData(Object.fromEntries(results.map(r => [r.key, r.count])))
      setExtraData(Object.fromEntries(results.map(r => [r.key, r.extraCount])))
      setLoading(false)
    }

    fetchStats()
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
    </Stack>
  )
}