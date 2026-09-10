import {
  Collapse,
  Box,
  Card,
  Text,
  Title,
  Group,
  Stack,
  Tabs,
  Skeleton,
  Alert,
  ActionIcon,
  Tooltip,
  Flex,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconNews,
  IconMicrophone2,
  IconMusic,
  IconCalendarEvent,
  IconBriefcase,
  IconFilter,
} from '@tabler/icons-react'
import { useState, useMemo } from 'react'
import { useNews } from '../../hooks/useNews'
import NewsCard from './NewsCard'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const CATEGORIES = [
  { value: 'all', label: 'Todas', icon: <IconNews size={14} /> },
  { value: 'noticias', label: 'Notícias', icon: <IconNews size={14} /> },
  { value: 'artistas', label: 'Artistas', icon: <IconMicrophone2 size={14} /> },
  { value: 'instrumentos', label: 'Instrumentos', icon: <IconMusic size={14} /> },
  { value: 'eventos', label: 'Eventos', icon: <IconCalendarEvent size={14} /> },
  { value: 'mercado', label: 'Mercado', icon: <IconBriefcase size={14} /> },
]

function NewsCardSkeleton() {
  return (
    <Card radius="md" withBorder padding="sm">
      <Stack gap={6} style={{ flex: 1 }}>
        <Skeleton h={14} w={60} radius="sm" />
        <Skeleton h={14} radius="sm" />
        <Skeleton h={14} w="80%" radius="sm" />
        <Skeleton h={10} w={120} radius="sm" />
      </Stack>
    </Card>
  )
}

// ─── Detecção de tópicos quentes (front-only) ──────────────────────────────
const STOPWORDS = new Set([
  'para',
  'com',
  'sobre',
  'entre',
  'como',
  'quando',
  'onde',
  'porque',
  'por que',
  'seu',
  'sua',
  'seus',
  'suas',
  'esse',
  'essa',
  'isso',
  'isto',
  'aquele',
  'aquela',
  'mais',
  'muito',
  'sendo',
  'apenas',
  'ainda',
  'tambem',
  'também',
  'depois',
  'antes',
  'nova',
  'novo',
  'novas',
  'novos',
  'primeira',
  'primeiro',
  'lança',
  'lanca',
  'single',
  'musica',
  'música',
  'ouça',
  'ouca',
  'confira',
  'veja',
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'have',
  'has',
  'will',
])

function tokenize(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acento
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens)
  const b = new Set(bTokens)
  const inter = [...a].filter((x) => b.has(x)).length
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : inter / union
}

function getTrendingMap(news) {
  // Agrupa apenas notícias das últimas 48h para evitar falsos positivos antigos
  const recent = news.filter((n) => dayjs().diff(dayjs(n.published_at), 'hour') <= 48)

  const clusters = [] // [{ representativeTokens, items: [] }]

  for (const item of recent) {
    const tokens = tokenize(item.title)
    if (tokens.length < 2) continue

    let found = false
    for (const cluster of clusters) {
      const sim = jaccard(tokens, cluster.representativeTokens)
      // Se compartilha 2+ palavras raras (ex: slipknot + arsenal + eloy) é hot
      const common = tokens.filter((t) => cluster.representativeTokens.includes(t))
      const hasRareMatch = common.filter((t) => t.length >= 5).length >= 1
      if (sim >= 0.45 || (common.length >= 2 && hasRareMatch)) {
        cluster.items.push(item)
        found = true
        break
      }
    }
    if (!found) {
      clusters.push({ representativeTokens: tokens, items: [item] })
    }
  }

  // Mapeia id -> { count, isTrending }
  const map = new Map()
  for (const cluster of clusters) {
    if (cluster.items.length >= 2) {
      // Só vira trending se forem de fontes diferentes
      const distinctSources = new Set(cluster.items.map((i) => i.source_name)).size
      if (distinctSources >= 2) {
        for (const it of cluster.items) {
          map.set(it.id, {
            count: cluster.items.length,
            isTrending: distinctSources >= 2,
          })
        }
      }
    }
  }
  return map
}

export function NewsFeed({ subtle = false } = {}) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false)

  const { news, loading, error } = useNews({
    category: activeCategory === 'all' ? null : activeCategory,
  })

  const trendingMap = useMemo(() => {
    if (!news || news.length === 0) return new Map()
    return getTrendingMap(news)
  }, [news])

  return (
    <Box>
      <Flex
        justify="space-between"
        align="center"
        mb="xs"
        visibleFrom={subtle ? 0 : 'sm'}
      >
        <Title order={3} fz={subtle ? 'h5' : 'h4'} fw={500}>
          Notícias do Mercado
        </Title>
        {!subtle && (
          <Tooltip label={filtersOpened ? 'Ocultar filtros' : 'Mostrar filtros'}>
            <ActionIcon variant="subtle" color="gray" onClick={toggleFilters}>
              <IconFilter size={18} color="gray" />
            </ActionIcon>
          </Tooltip>
        )}
      </Flex>

      {!subtle && (
        <Collapse expanded={filtersOpened}>
          <Tabs
            px={{ base: 'sm', sm: 0 }}
            value={activeCategory}
            onChange={setActiveCategory}
            mb="md"
            variant="pills"
          >
            <Tabs.List>
              {CATEGORIES.map((cat) => (
                <Tabs.Tab key={cat.value} value={cat.value} leftSection={cat.icon}>
                  {cat.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </Collapse>
      )}

      {error && (
        <Alert color="red" mb="md">
          Não foi possível carregar as notícias. Tente novamente mais tarde.
        </Alert>
      )}

      <Stack gap="sm">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <NewsCardSkeleton key={i} />)
          : news.map((item) => {
              const trend = trendingMap.get(item.id)
              return (
                <NewsCard
                  key={item.id}
                  item={item}
                  subtle={subtle}
                  trendingCount={trend?.count ?? 0}
                  isTrending={!!trend?.isTrending}
                />
              )
            })}

        {!loading && news.length === 0 && !error && (
          <Text c="dimmed" ta="center" py="xl">
            Nenhuma notícia disponível no momento.
          </Text>
        )}
      </Stack>
    </Box>
  )
}

export default NewsFeed
