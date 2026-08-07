import { useEffect, useRef, useState } from 'react'
import { Box, Group, Avatar, Text, ActionIcon, Portal } from '@mantine/core'
import { IconX, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'motion/react'
import VideoPlayerNative from '../VideoPlayerNative'
import { supabase } from '../../lib/supabaseClient'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-80,c-maintain_ratio/users/avatars/'

const SWIPE_THRESHOLD = 60

const variants = {
  enter: (direction) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
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

  // Trava o scroll da página de fundo enquanto o player está aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Teclado: ESC fecha, setas navegam
  useEffect(() => {
    const handleKeyDown = (e) => {
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
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, scenes.length])

  // Incrementa views_count a cada scene exibida (troca de índice inclusa)
  useEffect(() => {
    supabase
      .from('scenes')
      .update({ views_count: (scene.views_count ?? 0) + 1 })
      .eq('id', scene.id)
      .then(({ error }) => {
        if (error) {
          console.error('Erro ao incrementar views_count:', error)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id])

  // --- Swipe touch (mobile) ---
  const onTouchStart = (e) => {
    dragStartX.current = e.touches[0].clientX
  }
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

  // --- Drag de mouse (desktop) ---
  const onMouseDown = (e) => {
    dragStartX.current = e.clientX
  }
  const onMouseUp = (e) => {
    if (dragStartX.current === null) {
      return
    }
    const delta = e.clientX - dragStartX.current
    dragStartX.current = null
    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      ignoreNextClick.current = true // evita que o click (disparado após o mouseup) feche o overlay
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
        {/* Indicador de progresso, estilo Stories */}
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

        {/* Header: perfil do músico */}
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

          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={onClose}
            aria-label="Fechar"
          >
            <IconX size={22} color="#fff" />
          </ActionIcon>
        </Group>

        {/* Setas de navegação — só aparecem em dispositivos com mouse (hover) */}
        {hasPrev && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xl"
            className="scenePlayerArrow"
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
            aria-label="Cena anterior"
          >
            <IconChevronLeft size={26} color="#fff" />
          </ActionIcon>
        )}
        {hasNext && (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xl"
            className="scenePlayerArrow"
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
            aria-label="Próxima cena"
          >
            <IconChevronRight size={26} color="#fff" />
          </ActionIcon>
        )}

        {/* Player, com stopPropagation pra clicar nos controles sem fechar o overlay */}
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
                src={scene.video_url}
                title={scene.caption}
                isVertical
                autoPlay
                hideCaptionOnVideo
                onProgress={setSegmentProgress}
              />
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Pré-carrega o próximo vídeo em segundo plano, sem exibir */}
        {hasNext && (
          <video
            key={`preload-${scenes[index + 1].id}`}
            src={scenes[index + 1].video_url}
            preload="auto"
            muted
            style={{ display: 'none' }}
          />
        )}

        {/* Caption, se houver */}
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

      <style>{`
        .scenePlayerArrow { display: none; }
        @media (hover: hover) and (pointer: fine) {
          .scenePlayerArrow { display: flex; }
        }
      `}</style>
    </Portal>
  )
}
