import { useState } from 'react'
import { Box, Flex } from '@mantine/core'

function getYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

export default function VideoPlayer({ url, title, thumbnailOnly = false }) {
  const [expanded, setExpanded] = useState(false)
  const ytId = getYouTubeId(url)
  if (!ytId) return null

  const thumbnail = (
    <img
      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
      alt="Thumbnail do vídeo"
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        objectFit: 'cover',
      }}
    />
  )

  return (
    <Box
      mt={4}
      style={{
        position: 'relative',
        paddingTop: '56.25%',
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
        cursor: thumbnailOnly ? 'default' : expanded ? 'default' : 'pointer',
      }}
      onClick={() => !thumbnailOnly && !expanded && setExpanded(true)}
    >
      {thumbnailOnly ? (
        thumbnail
      ) : expanded ? (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0, border: 'none' }}
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title={title ?? 'Vídeo'}
        />
      ) : (
        <>
          {thumbnail}
          <Flex
            align="center"
            justify="center"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.25)',
              transition: 'background 0.2s',
            }}
          >
            <Box
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#000000">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </Box>
          </Flex>
        </>
      )}
    </Box>
  )
}