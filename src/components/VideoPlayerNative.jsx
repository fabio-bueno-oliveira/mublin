import {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  useCallback,
} from 'react'
import Hls from 'hls.js'
import { Box, Center, Loader } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconMaximize,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconVolume,
  IconVolumeOff,
} from '@tabler/icons-react'

const READY_TIMEOUT = 15000
const SEEK_STEP = 5
const MAX_NETWORK_RETRIES = 3

const VideoPlayerNative = forwardRef(
  (
    {
      src,
      poster,
      title,
      isVertical = false,
      autoPlay = false,
      startMuted = false,
      hideCaptionOnVideo = false,
      hideBottomControls = false,
      onProgress,
    },
    externalRef,
  ) => {
    const isMobile = useMediaQuery('(max-width: 48em)')

    const videoRef = useRef(null)
    const wrapRef = useRef(null)
    const hlsRef = useRef(null)
    const readyTimeoutRef = useRef(null)

    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [muted, setMuted] = useState(startMuted)
    const [ready, setReady] = useState(false)
    const [loadError, setLoadError] = useState(false)

    // Expõe o elemento <video> real para componentes pais.
    useImperativeHandle(externalRef, () => videoRef.current, [])

    const clearReadyTimeout = useCallback(() => {
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current)
        readyTimeoutRef.current = null
      }
    }, [])

    const markAsReady = useCallback(() => {
      clearReadyTimeout()
      setLoadError(false)
      setReady(true)
    }, [clearReadyTimeout])

    const handleLoadError = useCallback(
      (error) => {
        clearReadyTimeout()

        if (error) {
          console.error('[VideoPlayerNative] Erro ao carregar vídeo:', error)
        }

        setReady(false)
        setPlaying(false)
        setLoadError(true)
      },
      [clearReadyTimeout],
    )

    // Mantém o estado React e o elemento <video> sincronizados quando
    // startMuted for alterado externamente.
    useEffect(() => {
      setMuted(startMuted)

      if (videoRef.current) {
        videoRef.current.muted = startMuted
      }
    }, [startMuted])

    // Pausa automaticamente quando o player deixa de estar visível.
    useEffect(() => {
      const wrap = wrapRef.current

      if (!wrap) {
        return undefined
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          const video = videoRef.current

          if (!entry.isIntersecting && video && !video.paused) {
            video.pause()
            setPlaying(false)
          }
        },
        { threshold: 0.3 },
      )

      observer.observe(wrap)

      return () => {
        observer.disconnect()
      }
    }, [])

    // Inicialização e gerenciamento da fonte HLS.
    useEffect(() => {
      const video = videoRef.current

      if (!video || !src) {
        return undefined
      }

      let cancelled = false
      let networkRetries = 0

      // Estado inicial para uma nova source.
      clearReadyTimeout()
      setReady(false)
      setPlaying(false)
      setProgress(0)
      setLoadError(false)

      // Remove qualquer instância HLS anterior.
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }

      // Remove source anterior antes de carregar uma nova.
      video.pause()
      video.removeAttribute('src')
      video.load()

      const initPlay = () => {
        if (!autoPlay || cancelled) {
          return
        }

        video.muted = startMuted

        video
          .play()
          .then(() => {
            if (!cancelled) {
              setPlaying(true)
            }
          })
          .catch((error) => {
            // Browsers podem bloquear autoplay com áudio.
            console.warn('[VideoPlayerNative] Autoplay inicial falhou:', error)

            if (!video.muted && !cancelled) {
              video.muted = true
              setMuted(true)

              video
                .play()
                .then(() => {
                  if (!cancelled) {
                    setPlaying(true)
                  }
                })
                .catch((mutedError) => {
                  console.warn(
                    '[VideoPlayerNative] Autoplay mutado também falhou:',
                    mutedError,
                  )
                })
            }
          })
      }

      const handleReady = (source) => {
        if (cancelled) {
          return
        }

        console.log(`[VideoPlayerNative] Pronto para reprodução (via ${source}):`, src)

        markAsReady()
        initPlay()
      }

      const handleNativeError = () => {
        if (cancelled) {
          return
        }

        console.error('[VideoPlayerNative] Erro no elemento <video>:', video.error)

        handleLoadError(video.error)
      }

      // Timeout de segurança para impedir Loader infinito.
      readyTimeoutRef.current = setTimeout(() => {
        if (!cancelled) {
          console.error(
            '[VideoPlayerNative] Timeout esperando o vídeo ficar pronto:',
            src,
          )

          handleLoadError()
        }
      }, READY_TIMEOUT)

      // Safari possui suporte nativo a HLS.
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src

        video.addEventListener('canplay', () => handleReady('nativo/Safari'), {
          once: true,
        })

        video.addEventListener('error', handleNativeError, {
          once: true,
        })
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          capLevelToPlayerSize: true,
          maxBufferLength: 30,
        })

        hlsRef.current = hls

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!cancelled) {
            console.log('[VideoPlayerNative] Manifest HLS processado:', src)
          }
        })

        // canplay é um momento mais seguro para considerar o vídeo
        // realmente pronto para reprodução.
        hls.on(Hls.Events.LEVEL_LOADED, () => {
          if (!cancelled && video.readyState >= 3) {
            handleReady('hls.js')
          }
        })

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (cancelled) {
            return
          }

          console.error(
            '[VideoPlayerNative] Erro do hls.js:',
            data.type,
            data.details,
            data,
          )

          if (!data.fatal) {
            return
          }

          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (networkRetries < MAX_NETWORK_RETRIES) {
                networkRetries += 1

                console.warn(
                  `[VideoPlayerNative] Tentando recuperar erro de rede (${networkRetries}/${MAX_NETWORK_RETRIES})`,
                )

                hls.startLoad()
              } else {
                console.error(
                  '[VideoPlayerNative] Número máximo de tentativas de rede atingido.',
                )

                hls.destroy()
                hlsRef.current = null
                handleLoadError(data)
              }
              break

            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[VideoPlayerNative] Tentando recuperar erro de mídia.')

              hls.recoverMediaError()
              break

            default:
              console.error('[VideoPlayerNative] Erro fatal não recuperável.')

              hls.destroy()
              hlsRef.current = null
              handleLoadError(data)
          }
        })

        hls.loadSource(src)
        hls.attachMedia(video)
      } else {
        console.error('[VideoPlayerNative] Este navegador não suporta HLS nem hls.js.')

        handleLoadError()
      }

      return () => {
        cancelled = true

        clearReadyTimeout()

        // Remove listeners nativos.
        video.removeEventListener('error', handleNativeError)

        if (hlsRef.current) {
          hlsRef.current.destroy()
          hlsRef.current = null
        }
      }
    }, [src, autoPlay, startMuted, clearReadyTimeout, markAsReady, handleLoadError])

    const togglePlay = () => {
      const video = videoRef.current

      if (!video || loadError) {
        return
      }

      if (video.paused) {
        video
          .play()
          .then(() => {
            setPlaying(true)
          })
          .catch((error) => {
            console.warn(
              '[VideoPlayerNative] Não foi possível iniciar a reprodução:',
              error,
            )
          })
      } else {
        video.pause()
        setPlaying(false)
      }
    }

    const onTimeUpdate = () => {
      const video = videoRef.current

      if (!video?.duration || !Number.isFinite(video.duration)) {
        return
      }

      const ratio = (video.currentTime / video.duration) * 100

      setProgress(ratio)
      onProgress?.(ratio)
    }

    const seek = (event) => {
      const video = videoRef.current

      if (!video?.duration || !Number.isFinite(video.duration)) {
        return
      }

      const rect = event.currentTarget.getBoundingClientRect()

      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))

      video.currentTime = ratio * video.duration
    }

    const seekByKeyboard = (event) => {
      const video = videoRef.current

      if (!video?.duration || !Number.isFinite(video.duration)) {
        return
      }

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault()
          video.currentTime = Math.min(video.duration, video.currentTime + SEEK_STEP)
          break

        case 'ArrowLeft':
          event.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - SEEK_STEP)
          break

        case 'Home':
          event.preventDefault()
          video.currentTime = 0
          break

        case 'End':
          event.preventDefault()
          video.currentTime = video.duration
          break

        default:
          break
      }
    }

    const toggleMute = (event) => {
      event?.stopPropagation()

      const video = videoRef.current

      if (!video) {
        return
      }

      video.muted = !video.muted
      setMuted(video.muted)
    }

    const fullscreen = async () => {
      const video = videoRef.current
      const wrap = wrapRef.current

      if (!video || !wrap) {
        return
      }

      try {
        // Suporte específico para Safari/iOS quando disponível.
        if (video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen()
          return
        }

        if (!document.fullscreenElement) {
          await wrap.requestFullscreen?.()
        } else {
          await document.exitFullscreen?.()
        }
      } catch (error) {
        console.error('[VideoPlayerNative] Erro ao alternar fullscreen:', error)
      }
    }

    const playerStyle = isVertical
      ? {
          ...s.wrapVertical,
          width: isMobile ? '100%' : 280,
          height: isMobile ? '100%' : 500,
        }
      : s.wrapHorizontal

    const videoStyle = {
      ...s.video,
      aspectRatio: isVertical && !isMobile ? '9 / 16' : '16 / 9',
      height: isVertical && isMobile ? '100%' : undefined,
    }

    return (
      <Box ref={wrapRef} className="mublin-player" style={playerStyle}>
        {!ready && !loadError && (
          <Center
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              background: '#000',
            }}
          >
            <Loader color="white" />
          </Center>
        )}

        {loadError && (
          <Center
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              background: '#000',
              flexDirection: 'column',
              gap: 8,
              padding: 16,
            }}
          >
            <Box
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              Não foi possível carregar este vídeo.
            </Box>
          </Center>
        )}

        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          poster={poster}
          crossOrigin="anonymous"
          style={videoStyle}
          muted={muted}
          playsInline
          preload="metadata"
          onCanPlay={() => {
            if (!ready && !loadError) {
              markAsReady()
            }
          }}
          onTimeUpdate={onTimeUpdate}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => {
            const video = videoRef.current

            if (video?.error) {
              handleLoadError(video.error)
            }
          }}
          onClick={togglePlay}
        />

        {isVertical && title && !hideCaptionOnVideo && <div style={s.badge}>{title}</div>}

        {!playing && ready && !loadError && (
          <button
            type="button"
            style={s.overlay}
            onClick={togglePlay}
            aria-label="Reproduzir vídeo"
          >
            <Box style={s.playCircle}>
              <IconPlayerPlayFilled size={28} />
            </Box>
          </button>
        )}

        {!hideBottomControls && !loadError && (
          <div style={s.controls}>
            <div
              style={s.progressWrap}
              onClick={seek}
              onKeyDown={seekByKeyboard}
              role="slider"
              tabIndex={0}
              aria-label="Progresso do vídeo"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-valuetext={`${Math.round(progress)}%`}
            >
              <div
                style={{
                  ...s.progressFill,
                  width: `${progress}%`,
                }}
              />
            </div>

            <div style={s.bottomRow}>
              <button
                type="button"
                style={s.btn}
                onClick={togglePlay}
                aria-label={playing ? 'Pausar vídeo' : 'Reproduzir vídeo'}
              >
                {playing ? (
                  <IconPlayerPauseFilled size={18} />
                ) : (
                  <IconPlayerPlayFilled size={18} />
                )}
              </button>

              <button
                type="button"
                style={s.btn}
                onClick={toggleMute}
                aria-label={muted ? 'Ativar som' : 'Desativar som'}
              >
                {muted ? <IconVolumeOff size={18} /> : <IconVolume size={18} />}
              </button>

              <span style={s.time} />

              <button
                type="button"
                style={s.btn}
                onClick={fullscreen}
                aria-label="Tela cheia"
              >
                <IconMaximize size={18} stroke={2} />
              </button>
            </div>
          </div>
        )}
      </Box>
    )
  },
)

VideoPlayerNative.displayName = 'VideoPlayerNative'

export default VideoPlayerNative

const s = {
  wrapHorizontal: {
    position: 'relative',
    width: '100%',
    maxWidth: 640,
    background: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },

  wrapVertical: {
    position: 'relative',
    background: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    border: '0.5px solid rgba(255,255,255,0.1)',
  },

  video: {
    display: 'block',
    width: '100%',
    objectFit: 'cover',
    cursor: 'pointer',
    background: '#000',
  },

  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    background: 'rgba(0,0,0,0.45)',
    border: '0.5px solid rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 10,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
  },

  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: 'rgba(0,0,0,0.15)',
    border: 'none',
    padding: 0,
  },

  playCircle: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },

  controls: {
    position: 'absolute',
    zIndex: 2,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '48px 16px 16px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  progressWrap: {
    width: '100%',
    height: 3,
    background: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    cursor: 'pointer',
  },

  progressFill: {
    height: '100%',
    background: '#fff',
    borderRadius: 2,
    transition: 'width 0.1s linear',
    pointerEvents: 'none',
  },

  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },

  btn: {
    background: 'rgba(0,0,0,0.35)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    cursor: 'pointer',
    color: '#fff',
    padding: '6px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  time: {
    flex: 1,
  },
}
