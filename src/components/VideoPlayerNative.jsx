import { useRef, useState, useEffect } from 'react'
import { Box, Center, Loader } from '@mantine/core'
import {
  IconMaximize,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconVolume,
  IconVolumeOff,
} from '@tabler/icons-react'

export default function VideoPlayerNative({
  src,
  title,
  isVertical = false,
  autoPlay = false,
  hideCaptionOnVideo = false,
  hideBottomControls = false,
  onProgress,
}) {
  const videoRef = useRef(null)
  const wrapRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [muted, setMuted] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause()
          setPlaying(false)
        }
      },
      { threshold: 0.3 },
    )

    const wrap = wrapRef.current

    if (wrap) {
      observer.observe(wrap)
    }

    return () => {
      if (wrap) {
        observer.unobserve(wrap)
      }
    }
  }, [])

  useEffect(() => {
    if (autoPlay && ready && videoRef.current) {
      videoRef.current.muted = false
      setMuted(false)

      videoRef.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          videoRef.current.muted = true
          setMuted(true)

          videoRef.current
            .play()
            .then(() => setPlaying(true))
            .catch(() => {})
        })
    }
  }, [autoPlay, ready])

  const togglePlay = () => {
    const v = videoRef.current

    if (v.paused) {
      v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  const onTimeUpdate = () => {
    const v = videoRef.current

    if (!v.duration) {
      return
    }

    const ratio = (v.currentTime / v.duration) * 100
    setProgress(ratio)
    onProgress?.(ratio)
  }

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    videoRef.current.currentTime = ratio * videoRef.current.duration
  }

  const toggleMute = () => {
    const v = videoRef.current
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const fullscreen = () => {
    const wrap = videoRef.current.closest('.mublin-player')

    if (!document.fullscreenElement) {
      wrap?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <Box
      ref={wrapRef}
      className="mublin-player"
      style={isVertical ? s.wrapVertical : s.wrapHorizontal}
    >
      {!ready && (
        <Center mt={280}>
          <Loader />
        </Center>
      )}

      <video
        ref={videoRef}
        src={src}
        style={{ ...s.video, aspectRatio: isVertical ? '9/16' : '16/9' }}
        muted
        playsInline
        preload="metadata"
        onLoadedData={() => setReady(true)}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => setPlaying(false)}
        onError={() => setReady(false)}
        onLoadStart={() => setReady(false)}
      >
        <track kind="captions" srcLang="pt" label="Português" default />
      </video>

      {isVertical && title && !hideCaptionOnVideo && <div style={s.badge}>{title}</div>}

      {!playing && ready && progress > 0 && (
        <button
          type="button"
          style={{ ...s.overlay, background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={togglePlay}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              togglePlay()
            }
          }}
          aria-label="Play"
        >
          <IconPlayerPlayFilled size={50} stroke={1} />
        </button>
      )}

      {!hideBottomControls && (
        <div style={s.controls}>
          <div
            style={s.progressWrap}
            onClick={seek}
            onKeyDown={(e) => {
              const v = videoRef.current

              if (e.key === 'ArrowRight') {
                v.currentTime = Math.min(v.duration, v.currentTime + 5)
              }

              if (e.key === 'ArrowLeft') {
                v.currentTime = Math.max(0, v.currentTime - 5)
              }
            }}
            role="slider"
            tabIndex={0}
            aria-label="Progresso do vídeo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div style={{ ...s.progressFill, width: `${progress}%` }} />
          </div>

          <div style={s.bottomRow}>
            <button type="button" style={s.btn} onClick={togglePlay}>
              {playing ? (
                <IconPlayerPauseFilled size={18} />
              ) : (
                <IconPlayerPlayFilled size={18} />
              )}
            </button>

            <button type="button" style={s.btn} onClick={toggleMute}>
              {muted ? <IconVolumeOff stroke={2} /> : <IconVolume stroke={2} />}
            </button>

            <span style={s.time}> </span>

            <button type="button" style={s.btn} onClick={fullscreen}>
              <IconMaximize size={18} stroke={2} />
            </button>
          </div>
        </div>
      )}
    </Box>
  )
}

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
    width: 280,
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
  loading: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    background: 'rgba(0,0,0,0.45)',
    border: '0.5px solid rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 10,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: '0.06em',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: 'rgba(0,0,0,0.3)',
  },
  playCircle: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    border: '1.5px solid rgba(255,255,255,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color: '#fff',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '48px 16px 20px',
    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 10,
  },
  progressWrap: {
    width: '100%',
    height: 2.5,
    background: 'rgba(255,255,255,0.2)',
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
  bottomRow: { display: 'flex', alignItems: 'center', gap: 8 },
  btn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    padding: 2,
  },
  time: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'monospace',
    letterSpacing: '0.04em',
  },
}
