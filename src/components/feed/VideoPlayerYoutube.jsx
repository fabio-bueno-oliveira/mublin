import { useState } from 'react'
import { Box, Flex } from '@mantine/core'

// FLAG TEMPORÁRIA: true = o clique abre o vídeo em uma nova aba do YouTube (sem iframe).
// false = comportamento original, reproduzindo o vídeo internamente via iframe.
// Para reverter ao player embutido, basta trocar para false.
const LINK_MODE = true

function getYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  return match ? match[1] : null
}

export default function VideoPlayerYoutube({
  url,
  title,
  thumbnailOnly = false,
  height,
}) {
  const [expanded, setExpanded] = useState(false)
  const ytId = getYouTubeId(url)
  if (!ytId) {
    return null
  }

  const watchUrl = `https://www.youtube.com/watch?v=${ytId}`

  const thumbnail = (
    <img
      src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
      alt="Thumbnail do vídeo"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  )

  const playOverlay = (
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
          <path d="M8 5v14l11-7z" />
        </svg>
      </Box>
    </Flex>
  )

  // Estilo base do container: por padrão, a proporção 16:9 é calculada a partir
  // da LARGURA (paddingTop percentual). Quando `height` é informado, a proporção
  // passa a ser calculada a partir da ALTURA fixa (aspect-ratio), garantindo que
  // o vídeo fique com a mesma altura de outros elementos ao lado (ex.: imagens
  // de posts com altura fixa), evitando desalinhamento vertical entre cards.
  const containerStyle = height
    ? {
        position: 'relative',
        display: 'block',
        height,
        aspectRatio: '16 / 9',
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
      }
    : {
        position: 'relative',
        display: 'block',
        paddingTop: '56.25%',
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
      }

  // Modo "link": não renderiza iframe, o clique leva ao vídeo no YouTube em nova aba.
  if (LINK_MODE) {
    return (
      <Box
        mt={4}
        className="video-player-box"
        component={thumbnailOnly ? 'div' : 'a'}
        href={thumbnailOnly ? undefined : watchUrl}
        target={thumbnailOnly ? undefined : '_blank'}
        rel={thumbnailOnly ? undefined : 'noopener noreferrer'}
        title={thumbnailOnly ? undefined : (title ?? 'Assistir no YouTube')}
        style={{
          ...containerStyle,
          cursor: thumbnailOnly ? 'default' : 'pointer',
          textDecoration: 'none',
        }}
      >
        {thumbnail}
        {!thumbnailOnly && playOverlay}
      </Box>
    )
  }

  // Modo "iframe" (comportamento original): reproduz o vídeo embutido ao clicar.
  return (
    <Box
      mt={4}
      className="video-player-box"
      style={{
        ...containerStyle,
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
          {playOverlay}
        </>
      )}
    </Box>
  )
}
