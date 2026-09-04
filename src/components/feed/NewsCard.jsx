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

function normalizeImageForDisplay(url) {
  if (!url) {
    return null
  }
  // Corrige o mesmo bug no front para registros antigos já salvos
  const cleaned = url
    .replace(
      'https://www.tenhomaisdiscosqueamigos.com/uploads.tenhomaisdiscosqueamigos.com/',
      'https://uploads.tenhomaisdiscosqueamigos.com/',
    )
    .replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp)$)/i, '')
  return cleaned
}

export default function NewsCard({ item, width, subtle = false }) {
  const timeAgo = item.published_at ? dayjs(item.published_at).fromNow() : ''

  const CATEGORY_COLORS = {
    noticias: 'blue',
    artistas: 'violet',
    instrumentos: 'orange',
    eventos: 'green',
    music_business: 'red',
    mercado: 'red', // mapeia nova categoria 'mercado' para vermelho também
  }

  const displayImage = normalizeImageForDisplay(item.image_url)

  return (
    <Card
      w={width ?? '100%'}
      radius="md"
      withBorder={!subtle}
      padding={subtle ? 0 : 'sm'}
      component="a"
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      bg={subtle ? 'transparent' : undefined}
      style={{
        textDecoration: 'none',
        display: 'block',
        cursor: 'pointer',
        boxShadow: 'none',
      }}
    >
      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
        {/* Thumbnail com tratamento de erro duplo */}
        {displayImage && !subtle && (
          <Image
            src={displayImage}
            alt={item.title}
            w="100%"
            h={180}
            mb="xs"
            radius="sm"
            fit="cover"
            style={{ flexShrink: 0 }}
            fallbackSrc="https://placehold.co/600x400/1a1a1a/FFF?text=Mublin"
            onError={(e) => {
              // Se quebrar, esconde a imagem em vez de mostrar ícone quebrado
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        {!subtle && (
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Badge
              size="xs"
              variant="light"
              color={CATEGORY_COLORS[item.category] ?? 'gray'}
            >
              {item.category === 'mercado' ? 'mercado' : item.category}
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
        )}

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
