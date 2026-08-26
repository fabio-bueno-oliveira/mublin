import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import {
  Box,
  Avatar,
  Text,
  ActionIcon,
  Group,
  Center,
  Loader,
  Button,
  Modal,
  Stack,
  ThemeIcon,
} from '@mantine/core'
import {
  IconX,
  IconHeart,
  IconShare,
  IconMusic,
  IconVolume,
  IconVolumeOff,
  IconHeartFilled,
  IconMovie,
} from '@tabler/icons-react'
import { getSceneMediaUrl } from '../components/scenes/sceneMedia'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-80,c-maintain_ratio/users/avatars/'
const WELCOME_KEY = 'mublin_scenes_welcome_seen'

function SceneItem({
  scene,
  isActive,
  initialLiked,
  initialLikesCount,
  onLikeChange,
  autoUnmute,
}) {
  const videoRef = useRef(null)
  const { profile: currentUser } = useAuth()
  const [progress, setProgress] = useState(0)
  // 1) Se veio com startId, começa com som ativo
  const [muted, setMuted] = useState(!autoUnmute)
  const [liked, setLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [likeLoading, setLikeLoading] = useState(false)

  useEffect(() => {
    setLiked(initialLiked)
    setLikesCount(initialLikesCount)
  }, [initialLiked, initialLikesCount])

  const playerUrl = getSceneMediaUrl(scene.video_url, 'player')
  const posterUrl = getSceneMediaUrl(scene.video_url, 'poster')

  // auto unmute quando é o startId
  useEffect(() => {
    if (autoUnmute && isActive) {
      setMuted(false)
      // tenta garantir que o vídeo toque com som após interação do usuário (clique no thumb já conta)
      const v = videoRef.current
      if (v) {
        v.muted = false
        v.play().catch(() => {
          // se o browser bloquear autoplay com som, mantém muted false e tenta no click
          setMuted(false)
        })
      }
    }
  }, [autoUnmute, isActive])

  const handleToggleLike = useCallback(async () => {
    if (!currentUser?.id || likeLoading) {
      return
    }
    setLikeLoading(true)
    const prevLiked = liked
    const prevCount = likesCount
    const nextLiked = !prevLiked
    const nextCount = prevLiked ? prevCount - 1 : prevCount + 1
    setLiked(nextLiked)
    setLikesCount(nextCount)
    onLikeChange?.(scene.id, nextLiked, nextCount)
    try {
      if (prevLiked) {
        const { error } = await supabase
          .from('scene_likes')
          .delete()
          .eq('scene_id', scene.id)
          .eq('profile_id', currentUser.id)
        if (error) {
          throw error
        }
      } else {
        const { error } = await supabase
          .from('scene_likes')
          .insert({ scene_id: scene.id, profile_id: currentUser.id })
        if (error) {
          throw error
        }
      }
    } catch (err) {
      setLiked(prevLiked)
      setLikesCount(prevCount)
      onLikeChange?.(scene.id, prevLiked, prevCount)
    } finally {
      setLikeLoading(false)
    }
  }, [currentUser?.id, liked, likesCount, likeLoading, scene.id, onLikeChange])

  const viewedRef = useRef(false)
  useEffect(() => {
    const v = videoRef.current
    if (!v) {
      return
    }
    if (isActive) {
      v.play().catch(() => {})
      if (!viewedRef.current) {
        const t = setTimeout(() => {
          viewedRef.current = true
          supabase
            .rpc('increment_scene_views', { scene_id: scene.id })
            .then(({ error }) => {
              if (error) {
                supabase
                  .from('scenes')
                  .update({ views_count: (scene.views_count || 0) + 1 })
                  .eq('id', scene.id)
                  .then()
              }
            })
        }, 2500)
        return () => clearTimeout(t)
      }
    } else {
      v.pause()
    }
  }, [isActive, scene.id, scene.views_count])

  return (
    <Box
      data-scene-id={scene.id}
      style={{
        position: 'relative',
        height: '89dvh',
        width: '100%',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        background: '#000',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 5,
          background: 'rgba(255,255,255,0.15)',
        }}
      >
        <Box
          style={{
            height: '100%',
            width: `${progress}%`,
            background: '#fff',
            transition: 'width 0.12s linear',
          }}
        />
      </Box>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={playerUrl}
        poster={posterUrl}
        loop
        playsInline
        muted={muted}
        preload={isActive ? 'auto' : 'metadata'}
        onTimeUpdate={(e) => {
          const v = e.currentTarget
          if (v.duration) {
            setProgress((v.currentTime / v.duration) * 100)
          }
        }}
        onClick={() => setMuted((m) => !m)}
        style={{
          height: '100%',
          width: '100%',
          maxWidth: 420,
          objectFit: 'cover',
          background: '#000',
        }}
      />
      <ActionIcon
        onClick={() => setMuted((m) => !m)}
        variant="filled"
        radius="xl"
        size="lg"
        style={{
          position: 'absolute',
          top: 68,
          right: 16,
          zIndex: 4,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
        }}
      >
        {muted ? (
          <IconVolumeOff size={22} color="white" />
        ) : (
          <IconVolume size={22} color="white" />
        )}
      </ActionIcon>
      <Box
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 14px calc(16px + env(safe-area-inset-bottom))',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
          zIndex: 3,
        }}
      >
        <Group gap={4} mb={8}>
          <Avatar
            src={AVATAR_PATH + scene.profile?.avatar}
            size={38}
            radius="xl"
            component={Link}
            to={`/${scene.profile?.username}`}
          />
          <Box>
            <Text fw={700} c="white" size="sm">
              @{scene.profile?.username}
            </Text>
            <Text c="rgba(255,255,255,0.7)" size="xs">
              {scene.profile?.full_name}
            </Text>
          </Box>
          <Button
            size="xs"
            variant="outline"
            color="var(--mantine-color-text)"
            radius="xl"
            ml={8}
            component={Link}
            to={`/${scene.profile?.username}`}
            style={{ height: 26 }}
          >
            Ver perfil
          </Button>
        </Group>
        {scene.caption && (
          <Text
            c="white"
            size="sm"
            lineClamp={2}
            maw={320}
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
          >
            {scene.caption}
          </Text>
        )}
        <Group gap={6} mt={6}>
          <IconMusic size={13} color="white" />
          <Text c="white" size="xs" opacity={0.85}>
            som original • {scene.profile?.username}
          </Text>
        </Group>
      </Box>
      <Box
        style={{
          position: 'absolute',
          right: 10,
          bottom: 110,
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <Box style={{ textAlign: 'center' }}>
          <ActionIcon
            onClick={handleToggleLike}
            loading={likeLoading}
            size={48}
            radius="xl"
            variant="filled"
            bg={liked ? '#ff3040' : 'rgba(255,255,255,0.18)'}
            style={{
              backdropFilter: 'blur(8px)',
              transition: 'transform 0.15s',
              transform: liked ? 'scale(1.08)' : 'scale(1)',
            }}
          >
            {liked ? (
              <IconHeartFilled size={24} color="white" />
            ) : (
              <IconHeart size={24} color="white" />
            )}
          </ActionIcon>
          <Text c="white" size="xs" fw={600} mt={4}>
            {likesCount}
          </Text>
        </Box>
        <ActionIcon
          size={48}
          radius="xl"
          variant="filled"
          bg="rgba(255,255,255,0.18)"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <IconShare size={22} color="white" />
        </ActionIcon>
      </Box>
    </Box>
  )
}

export default function Scenes() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const startId = searchParams.get('start')
  const containerRef = useRef(null)
  const [activeId, setActiveId] = useState(startId || null)
  const { profile: currentUser } = useAuth()

  // 2) Modal de boas-vindas com localStorage
  const [welcomeOpened, setWelcomeOpened] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(WELCOME_KEY)
    if (!seen) {
      // delayzinho pra não competir com o autoplay
      const t = setTimeout(() => setWelcomeOpened(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  const handleCloseWelcome = () => {
    localStorage.setItem(WELCOME_KEY, '1')
    // quando fechar, se quiser salvar no banco depois, é só fazer:
    // supabase.from('profiles').update({ has_seen_scenes_welcome: true }).eq('id', currentUser.id)
    setWelcomeOpened(false)
  }

  const { data: startScene } = useQuery({
    queryKey: ['scene-start', startId],
    enabled: !!startId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scenes')
        .select(
          `id, video_url, caption, views_count, duration_seconds, created_at, profile:profiles!scenes_profile_id_fkey ( id, username, full_name, avatar )`,
        )
        .eq('id', startId)
        .eq('is_active', true)
        .single()
      if (error) {
        throw error
      }
      return data
    },
  })

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['scenes-feed-vertical', startId],
      queryFn: async ({ pageParam = 0 }) => {
        const from = pageParam * 10
        const to = from + 9
        let query = supabase
          .from('scenes')
          .select(
            `id, video_url, caption, views_count, duration_seconds, created_at, profile:profiles!scenes_profile_id_fkey ( id, username, full_name, avatar )`,
          )
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(from, to)
        if (startId) {
          query = query.neq('id', startId)
        }
        const { data, error } = await query
        if (error) {
          throw error
        }
        return data
      },
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === 10 ? allPages.length : undefined,
      staleTime: 1000 * 60 * 2,
    })

  const fetchedScenes = data?.pages.flat() || []
  const scenes = startScene
    ? [startScene, ...fetchedScenes.filter((s) => s.id !== startScene.id)]
    : fetchedScenes

  const sceneIds = useMemo(() => scenes.map((s) => s.id), [scenes])
  const { data: likesBatch } = useQuery({
    queryKey: ['scene-likes-batch', sceneIds.join(','), currentUser?.id],
    enabled: sceneIds.length > 0,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scene_likes')
        .select('scene_id, profile_id')
        .in('scene_id', sceneIds)
      if (error) {
        throw error
      }
      const countMap = {}
      const likedMap = {}
      data.forEach((row) => {
        countMap[row.scene_id] = (countMap[row.scene_id] || 0) + 1
        if (row.profile_id === currentUser?.id) {
          likedMap[row.scene_id] = true
        }
      })
      return { countMap, likedMap }
    },
  })

  const [localLikes, setLocalLikes] = useState({ countMap: {}, likedMap: {} })
  useEffect(() => {
    if (likesBatch) {
      setLocalLikes(likesBatch)
    }
  }, [likesBatch])
  const handleLikeChange = useCallback((sceneId, isLiked, count) => {
    setLocalLikes((prev) => ({
      countMap: { ...prev.countMap, [sceneId]: count },
      likedMap: { ...prev.likedMap, [sceneId]: isLiked },
    }))
  }, [])

  useEffect(() => {
    if (startId) {
      setActiveId(startId)
    }
  }, [startId])

  useEffect(() => {
    if (!containerRef.current || !scenes.length) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.75) {
            setActiveId(e.target.getAttribute('data-scene-id'))
          }
        })
      },
      { root: containerRef.current, threshold: 0.75 },
    )
    const els = containerRef.current.querySelectorAll('[data-scene-id]')
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [scenes])

  useEffect(() => {
    if (!activeId || !hasNextPage) {
      return
    }
    const idx = scenes.findIndex((s) => s.id === activeId)
    if (idx >= scenes.length - 2 && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [activeId, scenes, hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    if (scenes.length && startId && containerRef.current) {
      setTimeout(() => {
        const el = containerRef.current.querySelector(`[data-scene-id="${startId}"]`)
        if (el) {
          el.scrollIntoView({ behavior: 'instant' })
        }
      }, 100)
    }
  }, [scenes.length, startId])

  useEffect(() => {
    const onKey = (e) => {
      if (!containerRef.current) {
        return
      }
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        containerRef.current.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        containerRef.current.scrollBy({ top: -window.innerHeight, behavior: 'smooth' })
      }
      if (e.key === 'Escape') {
        navigate('/home')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  if (isLoading) {
    return (
      <Center h="100dvh" bg="black">
        <Loader color="white" />
      </Center>
    )
  }

  return (
    <>
      <Helmet>
        <title>Scenes · Mublin</title>
      </Helmet>

      {/* Modal de boas-vindas - só na primeira vez */}
      <Modal
        opened={welcomeOpened}
        onClose={handleCloseWelcome}
        centered
        radius="lg"
        size="sm"
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      >
        <Stack align="center" gap="md" py="sm">
          <ThemeIcon size={56} radius="xl" variant="transparent">
            <IconMovie size={28} />
          </ThemeIcon>
          <Box ta="center">
            <Text fw={800} size="lg">
              Bem-vindo ao Cenas!
            </Text>
            <Text size="sm" c="dimmed" mt={8} lh={1.4}>
              Aqui você vê vídeos de performances, mercado musical, opiniões e mais. Aqui
              o algoritmo é focado <b>só em música</b>!
            </Text>
          </Box>
          <Button fullWidth radius="xl" size="md" onClick={handleCloseWelcome}>
            Bora
          </Button>
        </Stack>
      </Modal>

      <Box
        mt={{ base: 0, sm: 110 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
        }}
      >
        <Text
          c="white"
          fw={800}
          size="lg"
          hiddenFrom="sm"
          style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}
        >
          Scenes
        </Text>
        <Box w={30} h={30} visibleFrom="sm" />
        <ActionIcon
          onClick={() => navigate('/home')}
          radius="xl"
          size="lg"
          bg="rgba(0,0,0,0.4)"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <IconX size={20} color="white" />
        </ActionIcon>
      </Box>

      <Box
        ref={containerRef}
        style={{
          height: '89dvh',
          width: '100vw',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          background: '#000',
        }}
      >
        {scenes.map((scene, i) => (
          <SceneItem
            key={scene.id}
            scene={scene}
            isActive={activeId ? activeId === scene.id : i === 0}
            initialLiked={!!localLikes.likedMap[scene.id]}
            initialLikesCount={localLikes.countMap[scene.id] || 0}
            onLikeChange={handleLikeChange}
            autoUnmute={!!startId && scene.id === startId}
          />
        ))}
        {isFetchingNextPage && (
          <Center h="20vh">
            <Loader size="sm" color="white" />
          </Center>
        )}
      </Box>
      <style>{`::-webkit-scrollbar { display: none; } * { scrollbar-width: none; -ms-overflow-style: none; }`}</style>
    </>
  )
}
