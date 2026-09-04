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
import { useState } from 'react'
import { useNews } from '../../hooks/useNews'
import NewsCard from './NewsCard'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

// ─── Config de categorias ────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'all', label: 'Todas', icon: <IconNews size={14} /> },
  { value: 'noticias', label: 'Notícias', icon: <IconNews size={14} /> },
  { value: 'artistas', label: 'Artistas', icon: <IconMicrophone2 size={14} /> },
  { value: 'instrumentos', label: 'Instrumentos', icon: <IconMusic size={14} /> },
  { value: 'eventos', label: 'Eventos', icon: <IconCalendarEvent size={14} /> },
  { value: 'music_business', label: 'Music Business', icon: <IconBriefcase size={14} /> },
  { value: 'mercado', label: 'Mercado', icon: <IconBriefcase size={14} /> },
]

// ─── Skeleton de loading ─────────────────────────────────────────────────────
function NewsCardSkeleton() {
  return (
    <Card radius="md" withBorder padding="sm">
      <Group wrap="nowrap" gap="sm">
        <Skeleton w={80} h={80} radius="sm" style={{ flexShrink: 0 }} />
        <Stack gap={6} style={{ flex: 1 }}>
          <Skeleton h={14} w={60} radius="sm" />
          <Skeleton h={14} radius="sm" />
          <Skeleton h={14} w="80%" radius="sm" />
          <Skeleton h={10} w={120} radius="sm" />
        </Stack>
      </Group>
    </Card>
  )
}

export function NewsFeed() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false)

  const { news, loading, error } = useNews({
    category: activeCategory === 'all' ? null : activeCategory,
  })

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="xs" visibleFrom="sm">
        <Title order={3} fz="h4" fw={500}>
          Notícias do Mercado
        </Title>
        <Tooltip label={filtersOpened ? 'Ocultar filtros' : 'Mostrar filtros'}>
          <ActionIcon variant="subtle" color="gray" onClick={toggleFilters}>
            <IconFilter size={18} />
          </ActionIcon>
        </Tooltip>
      </Flex>

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

      {/* Estado de erro */}
      {error && (
        <Alert color="red" mb="md">
          Não foi possível carregar as notícias. Tente novamente mais tarde.
        </Alert>
      )}

      {/* Lista de notícias */}
      <Stack gap="sm">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <NewsCardSkeleton key={i} />)
          : news.map((item) => <NewsCard key={item.id} item={item} />)}

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
