import { useState, useEffect, useRef } from 'react'
import { ScrollArea, Group, Box } from '@mantine/core'
import { IconPlayerPlayFilled } from '@tabler/icons-react'
import ScenePlayer from './ScenePlayer'

function SceneThumb({ scene, onOpen }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.6 },
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  return (
    <Box
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
      <video
        ref={videoRef}
        src={scene.video_url}
        muted
        loop
        playsInline
        preload="metadata"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      <Box
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '8px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          color: '#fff',
          fontSize: 11,
          fontWeight: 200,
          textTransform: 'lowercase',
        }}
        opacity={0.8}
      >
        por <b>@{scene.profile?.full_name}</b>
      </Box>

      <Box
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          opacity: 0.85,
        }}
      >
        <IconPlayerPlayFilled size={16} color="#fff" />
      </Box>
    </Box>
  )
}

export default function ScenesScroller({ scenes, isMobile }) {
  const [activeIndex, setActiveIndex] = useState(null)

  if (!scenes?.length) {
    return null
  }

  return (
    <>
      <ScrollArea type={isMobile ? 'never' : 'scroll'} scrollbarSize={6} offsetScrollbars>
        <Group wrap="nowrap" gap={10} py={4}>
          {scenes.map((scene, index) => (
            <SceneThumb
              key={scene.id}
              scene={scene}
              onOpen={() => setActiveIndex(index)}
            />
          ))}
        </Group>
      </ScrollArea>

      {activeIndex !== null && (
        <ScenePlayer
          scenes={scenes}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  )
}
