import {
  Stack,
  Card,
  ActionIcon,
  Text,
  Group,
  Image,
  Badge,
  Tooltip,
} from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import dayjs from 'dayjs'

export default function NewsCard({ item }) {
  const timeAgo = item.published_at ? dayjs(item.published_at).fromNow() : ''

  const CATEGORY_COLORS = {
    noticias: 'blue',
    artistas: 'violet',
    instrumentos: 'orange',
    eventos: 'green',
    music_business: 'red',
  }

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
