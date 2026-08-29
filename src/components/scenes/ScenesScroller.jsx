import { useState, useEffect, useCallback } from 'react'
import { ScrollArea, Group, Box, Skeleton, Image } from '@mantine/core'
import { IconPlayerPlayFilled } from '@tabler/icons-react'
import ScenePlayer from './ScenePlayer'
import { getSceneMediaUrl } from './sceneMedia'

// Paleta cíclica pra dar variedade entre os thumbs, no estilo "Stories"
const BORDER_COLORS = ['#ff6b6b', '#ffd43b', '#63e6be', '#4dabf7', '#da77f2', '#ff922b']

function SceneThumb({ scene, index, onOpen }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const posterUrl = getSceneMediaUrl(scene.video_url, 'poster')
  const borderColor = BORDER_COLORS[index % BORDER_COLORS.length]

  return (
    <Box
      onClick={onOpen}
      className="sceneThumbBorder"
      style={{
        '--scene-thumb-color': borderColor,
        flex: '0 0 auto',
        cursor: 'pointer',
      }}
    >
      <Box
        className="sceneThumbInner"
        style={{
          width: 130,
          height: 230,
          position: 'relative',
          backgroundColor: '#000',
        }}
      >
        {!isLoaded && !hasError && (
          <Skeleton style={{ position: 'absolute', inset: 0, zIndex: 1 }} radius={0} />
        )}

        <Image
          src={posterUrl}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          fallbackSrc="https://placehold.co/130x230?text=Cena"
          w={130}
          h={230}
          fit="cover"
          style={{
            opacity: isLoaded || hasError ? 1 : 0,
            transition: 'opacity 250ms ease',
          }}
        />

        <Box
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '8px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
            color: '#fff',
            fontSize: 11,
            pointerEvents: 'none',
          }}
        >
          por <b>@{scene.profile?.username || scene.profile?.full_name}</b>
        </Box>

        <Box
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <IconPlayerPlayFilled size={12} color="#fff" />
        </Box>
      </Box>
    </Box>
  )
}

export default function ScenesScroller({ scenes, isMobile }) {
  const [activeIndex, setActiveIndex] = useState(null)

  const handleOpen = useCallback((index) => {
    setActiveIndex(index)

    if (window.history.state?.scenesOpen !== true) {
      window.history.pushState({ scenesOpen: true }, '', window.location.href)
    }
  }, [])

  const handleClose = useCallback(() => {
    if (window.history.state?.scenesOpen === true) {
      window.history.back()
    } else {
      setActiveIndex(null)
    }
  }, [])

  useEffect(() => {
    const onPopState = () => {
      if (activeIndex !== null) {
        setActiveIndex(null)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [activeIndex])

  if (!scenes?.length) {
    return null
  }

  return (
    <>
      <ScrollArea type={isMobile ? 'never' : 'always'} scrollbarSize={8} offsetScrollbars>
        <Group wrap="nowrap" gap={10} py={4}>
          {scenes.map((scene, index) => (
            <SceneThumb
              key={scene.id}
              scene={scene}
              index={index}
              onOpen={() => handleOpen(index)}
            />
          ))}
        </Group>
      </ScrollArea>

      {activeIndex !== null && (
        <ScenePlayer
          scenes={scenes}
          initialIndex={activeIndex}
          onClose={handleClose}
          onForceClose={() => setActiveIndex(null)}
        />
      )}

      <style>{`
        .sceneThumbBorder {
          position: relative;
          border-radius: 14px;
          padding: 2px;
          overflow: hidden;
        }

        .sceneThumbBorder::before {
          content: '';
          position: absolute;
          inset: -60%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            var(--scene-thumb-color, #fff) 40deg,
            transparent 100deg,
            transparent 360deg
          );
          animation: sceneThumbSpin 2.8s linear infinite;
        }

        @keyframes sceneThumbSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .sceneThumbInner {
          position: relative;
          z-index: 1;
          border-radius: 12px;
          overflow: hidden;
        }

        @media (prefers-reduced-motion: reduce) {
          .sceneThumbBorder::before {
            animation: none;
          }
        }
      `}</style>
    </>
  )
}
