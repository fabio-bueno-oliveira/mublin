import {
  Collapse,
  Box,
  Card,
  Text,
  Title,
  Badge,
  Group,
  Stack,
  Tabs,
  Image,
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
  IconExternalLink,
  IconFilter,
} from '@tabler/icons-react'
import { useState } from 'react'
import { useNews } from '../../hooks/useNews'
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
]

const CATEGORY_COLORS = {
  noticias: 'blue',
  artistas: 'violet',
  instrumentos: 'orange',
  eventos: 'green',
  music_business: 'red',
}

// ─── NewsCard ────────────────────────────────────────────────────────────────
function NewsCard({ item }) {
  const timeAgo = item.published_at ? dayjs(item.published_at).fromNow() : ''

  return (
    <Card
      radius="md"
      withBorder
      padding="sm"
      component="a"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: 'none', display: 'block', cursor: 'pointer' }}
      styles={{
        root: {
          '&:hover': { borderColor: 'var(--mantine-color-blue-4)' },
          transition: 'border-color 150ms ease',
        },
      }}
    >
      {/* Conteúdo */}
      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        {/* Thumbnail */}
        {item.image_url && (
          <Image
            src={item.image_url}
            alt={item.title}
            w="100%"
            h="auto"
            mb="xs"
            radius="sm"
            fit="cover"
            style={{ flexShrink: 0 }}
            fallbackSrc="https://placehold.co/80x80?text=🎵"
          />
        )}
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Badge
            size="xs"
            variant="light"
            color={CATEGORY_COLORS[item.category] ?? 'gray'}
          >
            {item.category}
          </Badge>
          <Tooltip label="Abrir fonte" withArrow position="top">
            <ActionIcon
              size="xs"
              variant="subtle"
              color="gray"
              component="span"
              onClick={(e) => e.stopPropagation()}
            >
              <IconExternalLink size={12} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Text fw={600} size="sm" lineClamp={2} style={{ lineHeight: 1.3 }}>
          {item.title}
        </Text>

        {item.description && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {item.description}
          </Text>
        )}

        <Group gap={4} mt={2}>
          <Text size="xs" c="dimmed">
            {item.source_name}
          </Text>
          <Text size="xs" c="dimmed">
            ·
          </Text>
          <Text size="xs" c="dimmed">
            {timeAgo}
          </Text>
        </Group>
      </Stack>
    </Card>
  )
}

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

// ─── NewsFeed (componente principal) ─────────────────────────────────────────
export function NewsFeed() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false)

  const { news, loading, error } = useNews({
    category: activeCategory === 'all' ? null : activeCategory,
  })

  return (
    <Box>
      <Flex justify="space-between" visibleFrom="sm">
        <Title order={4} mb="sm">
          Notícias da Música
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
