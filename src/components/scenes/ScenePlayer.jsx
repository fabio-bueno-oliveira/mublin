import { useEffect, useRef, useState } from 'react'
import { Box, Group, Avatar, Text, ActionIcon, Portal } from '@mantine/core'
import { IconX, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'motion/react'
import VideoPlayerNative from '../VideoPlayerNative'
import { supabase } from '../../lib/supabaseClient'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-80,c-maintain_ratio/users/avatars/'
const SWIPE_THRESHOLD = 60

function getIKUrl(originalUrl, type) {
  if (!originalUrl?.includes('ik.imagekit.io')) {
    return originalUrl
  }
  const base = originalUrl.split('/tr:')[0].split('?')[0].replace(/\/$/, '')
  if (type === 'player') {
    return `${base}/tr:h-720,q-80`
  }
  return originalUrl
}

const variants = {
  enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
}

export default function ScenePlayer({ scenes, initialIndex, onClose }) {
  const [index, setIndex] = useState(initialIndex)
  const [direction, setDirection] = useState(0)
  const [segmentProgress, setSegmentProgress] = useState(0)
  const dragStartX = useRef(null)
  const ignoreNextClick = useRef(false)

  const scene = scenes[index]
  const hasNext = index < scenes.length - 1
  const hasPrev = index > 0

  const optimizedSrc = getIKUrl(scene.video_url, 'player')

  const goNext = () => {
    if (hasNext) {
      setDirection(1)
      setSegmentProgress(0)
      setIndex((i) => i + 1)
    } else {
      onClose()
    }
  }
  const goPrev = () => {
    if (hasPrev) {
      setDirection(-1)
      setSegmentProgress(0)
      setIndex((i) => i - 1)
    }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
      if (e.key === 'ArrowRight') {
        goNext()
      }
      if (e.key === 'ArrowLeft') {
        goPrev()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [index])
  useEffect(() => {
    supabase
      .from('scenes')
      .update({ views_count: (scene.views_count ?? 0) + 1 })
      .eq('id', scene.id)
      .then()
  }, [scene.id])

  const onTouchStart = (e) => (dragStartX.current = e.touches[0].clientX)
  const onTouchEnd = (e) => {
    if (dragStartX.current === null) {
      return
    }
    const delta = e.changedTouches[0].clientX - dragStartX.current
    dragStartX.current = null
    if (delta < -SWIPE_THRESHOLD) {
      goNext()
    } else if (delta > SWIPE_THRESHOLD) {
      goPrev()
    }
  }
  const onMouseDown = (e) => (dragStartX.current = e.clientX)
  const onMouseUp = (e) => {
    if (dragStartX.current === null) {
      return
    }
    const delta = e.clientX - dragStartX.current
    dragStartX.current = null
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      ignoreNextClick.current = true
      if (delta < 0) {
        goNext()
      } else {
        goPrev()
      }
    }
  }
  const handleOverlayClick = () => {
    if (ignoreNextClick.current) {
      ignoreNextClick.current = false
      return
    }
    onClose()
  }

  return (
    <Portal>
      <Box
        onClick={handleOverlayClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        <Group
          gap={4}
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: 12, left: 16, right: 16, zIndex: 3 }}
        >
          {scenes.map((s, i) => (
            <Box
              key={s.id}
              style={{
                flex: 1,
                height: 2,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.25)',
                overflow: 'hidden',
              }}
            >
              <Box
                style={{
                  height: '100%',
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.9)',
                  width: i < index ? '100%' : i === index ? `${segmentProgress}%` : '0%',
                  transition: i === index ? 'width 0.1s linear' : 'none',
                }}
              />
            </Box>
          ))}
        </Group>
        <Group
          justify="space-between"
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: 28, left: 16, right: 16, zIndex: 3 }}
        >
          <Group gap={8}>
            <Avatar src={AVATAR_PATH + scene.profile?.avatar} radius="xl" size={34} />
            <Box>
              <Text size="sm" fw={600} c="#fff">
                {scene.profile?.full_name}
              </Text>
              {scene.profile?.username && (
                <Text size="xs" c="rgba(255,255,255,0.6)">
                  @{scene.profile.username}
                </Text>
              )}
            </Box>
          </Group>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose}>
            <IconX size={22} color="#fff" />
          </ActionIcon>
        </Group>
        {hasPrev && (
          <ActionIcon
            className="scenePlayerArrow"
            variant="subtle"
            size="xl"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
            }}
          >
            <IconChevronLeft size={26} color="#fff" />
          </ActionIcon>
        )}
        {hasNext && (
          <ActionIcon
            className="scenePlayerArrow"
            variant="subtle"
            size="xl"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 3,
            }}
          >
            <IconChevronRight size={26} color="#fff" />
          </ActionIcon>
        )}
        <Box onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={scene.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <VideoPlayerNative
                src={optimizedSrc}
                title={scene.caption}
                isVertical
                autoPlay
                hideCaptionOnVideo
                hideBottomControls
                onProgress={setSegmentProgress}
              />
            </motion.div>
          </AnimatePresence>
        </Box>
        {scene.caption && (
          <Text
            size="sm"
            c="rgba(255,255,255,0.85)"
            ta="center"
            mt="md"
            maw={320}
            onClick={(e) => e.stopPropagation()}
          >
            {scene.caption}
          </Text>
        )}
      </Box>
      <style>{`.scenePlayerArrow { display: none; } @media (hover: hover) and (pointer: fine) { .scenePlayerArrow { display: flex; } }`}</style>
    </Portal>
  )
}
