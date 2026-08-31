import MuxPlayer from '@mux/mux-player-react'
import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import { useMediaQuery } from '@mantine/hooks'

const MuxVideoPlayer = forwardRef(
  (
    {
      playbackId,
      poster,
      title,
      isVertical = false,
      autoPlay = false,
      startMuted = true,
      volume = 1, // NOVO: 0 a 1 herdado do video anterior
      isActive = true,
      hideBottomControls = false,
      onProgress,
      onVolumeChange,
      styleOverride = {},
    },
    externalRef,
  ) => {
    const playerRef = useRef(null)

    useImperativeHandle(externalRef, () => {
      const el = playerRef.current
      const media = el?.media || el?.mediaElement || el?.querySelector?.('video')
      return {
        el,
        mediaElement: media,
        media,
        play: () => media?.play(),
        pause: () => media?.pause(),
        get current() {
          return media
        },
      }
    }, [])

    // Play/pause + sincroniza volume e mute
    useEffect(() => {
      const media =
        playerRef.current?.media ||
        playerRef.current?.mediaElement ||
        playerRef.current?.querySelector?.('video')
      if (!media) {
        return
      }

      media.muted = startMuted
      media.volume = volume

      if (isActive) {
        if (media.paused) {
          media.play().catch(() => {})
        }
      } else {
        media.pause()
      }
    }, [isActive, startMuted, volume, playbackId])

    useEffect(() => {
      const media = playerRef.current?.media || playerRef.current?.mediaElement
      if (!media) {
        return
      }
      media.muted = startMuted
      media.volume = volume
    }, [startMuted, volume])

    const isMobile = useMediaQuery('(max-width: 48em)')

    if (!playbackId) {
      return null
    }

    return (
      <>
        <MuxPlayer
          ref={playerRef}
          playbackId={playbackId}
          poster={poster}
          autoPlay={isActive ? (startMuted ? 'muted' : 'any') : false}
          muted={startMuted}
          loop={false}
          playsInline
          nohotkeys
          accentColor="#fff"
          metadata={title ? { video_title: title } : undefined}
          style={{
            width: isMobile ? '100%' : 280,
            height: isMobile ? '100%' : 500,
            aspectRatio: isVertical ? '9/16' : '16/9',
            background: '#000',
            '--media-object-fit': 'cover',
            // ESCONDE BOTÕES:
            '--media-fullscreen-button-display': 'none',
            '--media-rendition-menu-button-display': 'none',
            '--media-playback-rate-button-display': 'none',
            ...styleOverride,
          }}
          controls={!hideBottomControls}
          onVolumeChange={(e) => {
            if (onVolumeChange) {
              onVolumeChange(e)
            }
          }}
          onTimeUpdate={(e) => {
            const media = e.target
            if (onProgress && media.duration) {
              onProgress((media.currentTime / media.duration) * 100)
            }
          }}
          onLoadedData={(e) => {
            if (!isActive) {
              e.target.pause()
            }
          }}
        />
        <style>{`
        mux-player media-fullscreen-button,
        mux-player [part*="fullscreen"],
        mux-player media-rendition-menu-button,
        mux-player media-rendition-selectmenu,
        mux-player [part*="rendition"] {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
      </>
    )
  },
)

MuxVideoPlayer.displayName = 'MuxVideoPlayer'
export default MuxVideoPlayer
