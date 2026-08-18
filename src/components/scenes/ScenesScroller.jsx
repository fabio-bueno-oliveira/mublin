import { useState, useEffect, useRef, useCallback } from 'react'
import { ScrollArea, Group, Box, Skeleton, Image } from '@mantine/core'
import { IconPlayerPlayFilled } from '@tabler/icons-react'
import ScenePlayer from './ScenePlayer'
import { getSceneMediaUrl } from './sceneMedia'

function SceneThumb({ scene, onOpen }) {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const posterUrl = getSceneMediaUrl(scene.video_url, 'poster')
  const previewUrl = getSceneMediaUrl(scene.video_url, 'preview')

  useEffect(() => {
    const container = containerRef.current
    const video = videoRef.current

    if (!container || !video) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.4
        setIsVisible(visible)

        if (visible) {
          if (!video.src) {
            video.src = previewUrl
            video.load()
          }

          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      {
        threshold: [0, 0.4],
        rootMargin: '200px',
      },
    )

    observer.observe(container)

    return () => observer.disconnect()
  }, [previewUrl])

  return (
    <Box
      ref={containerRef}
      onClick={onOpen}
      style={{
        position: 'relative',
        flex: '0 0 auto',
        width: 130,
        height: 230,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        backgroundColor: '#000',
      }}
    >
      {!isLoaded && !hasError && (
        <Skeleton
          style={{ position: 'absolute', inset: 0, zIndex: 1 }}
          radius={0}
          animate={isVisible}
        />
      )}

      {hasError ? (
        <Image src={posterUrl} w={130} h={230} fit="cover" />
      ) : (
        <video
          ref={videoRef}
          poster={posterUrl}
          muted
          loop
          playsInline
          preload="none"
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 250ms ease',
          }}
        />
      )}

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
      <ScrollArea type={isMobile ? 'never' : 'scroll'} scrollbarSize={6} offsetScrollbars>
        <Group wrap="nowrap" gap={10} py={4}>
          {scenes.map((scene, index) => (
            <SceneThumb key={scene.id} scene={scene} onOpen={() => handleOpen(index)} />
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
    </>
  )
}
