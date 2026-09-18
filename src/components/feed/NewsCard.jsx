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
  if (!url) return null
  let cleaned = url
    .replace(
      'https://www.tenhomaisdiscosqueamigos.com/uploads.tenhomaisdiscosqueamigos.com/',
      'https://uploads.tenhomaisdiscosqueamigos.com/',
    )
    .replace(/-\d+x\d+(?=\.(jpg|jpeg|png|webp)$)/i, '')
    // Jetpack resize: i0.wp.com/.../foto.jpg?resize=370,265 -> /foto.jpg
    .replace(/https?:\/\/i\d+\.wp\.com\/([^?]+).*/, (m, p1) => `https://${p1}`)
    .replace(/\?resize=.*$/, '')
    .replace(/&amp;/g, '&')

  // Se ainda tiver query de resize, remove
  try {
    const u = new URL(cleaned)
    u.searchParams.delete('resize')
    u.searchParams.delete('ssl')
    cleaned = u.toString()
  } catch {}

  return cleaned
}

export default function NewsCard({
  item,
  width,
  subtle = false,
  isTrending = false,
  trendingCount = 0,
}) {
  const timeAgo = item.published_at ? dayjs(item.published_at).fromNow() : ''

  const CATEGORY_COLORS = {
    noticias: 'blue',
    artistas: 'violet',
    instrumentos: 'orange',
    eventos: 'green',
    music_business: 'red',
    mercado: 'red',
  }

  const displayImage = normalizeImageForDisplay(item.image_url)

  return (
    <Card
      w={width ?? '100%'}
      radius="md"
      withBorder={!subtle}
      padding={subtle ? 0 : 'sm'}
      component="a"
      href={subtle ? '/feed' : item.url}
      target={subtle ? '_self' : '_blank'}
      rel="noopener noreferrer"
      bg={subtle ? 'transparent' : undefined}
      style={{
        textDecoration: 'none',
        display: 'block',
        cursor: 'pointer',
        boxShadow: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Faixa sutil de trending no topo */}
      {/* {isTrending && !subtle && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, #ff6b35, #f7931e)',
          }}
        />
      )} */}

      <Stack gap={subtle ? 0 : 4} style={{ flex: 1, minWidth: 0 }}>
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
              e.currentTarget.style.display = 'none'
            }}
          />
        )}

        {!subtle && (
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Group gap={6}>
              <Badge
                size="xs"
                variant="light"
                color={CATEGORY_COLORS[item.category] ?? 'gray'}
              >
                {item.category === 'mercado' ? 'mercado' : item.category}
              </Badge>

              {isTrending && (
                <Tooltip
                  label={`${trendingCount} portais falando sobre isso agora`}
                  withArrow
                >
                  <Badge
                    size="xs"
                    variant="transparent"
                    color="orange.9"
                    style={{ cursor: 'default' }}
                  >
                    em alta 🔥
                  </Badge>
                </Tooltip>
              )}
            </Group>

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

        <Text fw={subtle ? 400 : 600} size="sm" lineClamp={2} style={{ lineHeight: 1.3 }}>
          {item.title}
        </Text>

        {item.description && !subtle && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {item.description}
          </Text>
        )}

        <Group gap={4} mt={2} wrap="nowrap">
          <Text size="11px" c="dimmed" truncate="end">
            {item.source_name}
          </Text>
          <Text size="11px" c="dimmed">
            ·
          </Text>
          <Text size="11px" c="dimmed" truncate="end">
            {timeAgo}
          </Text>
          {/* {isTrending && subtle && trendingCount > 1 && (
            <>
              <Text size="xs" c="dimmed">
                ·
              </Text>
              <Text size="xs" c="orange" fw={500}>
                {trendingCount} fontes
              </Text>
            </>
          )} */}
          {isTrending && subtle && trendingCount > 1 && (
            <Badge
              size="xs"
              variant="transparent"
              color="orange.9"
              style={{ cursor: 'default' }}
            >
              em alta 🔥
            </Badge>
          )}
        </Group>
      </Stack>
    </Card>
  )
}
