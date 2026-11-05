import { useEffect, useRef, useState } from 'react'
import { Avatar, Loader, Tooltip } from '@mantine/core'
import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react'
import classes from './ProjectAvatarPlayer.module.css'

// O anel fica por FORA do avatar, então o layout da página não muda
// com ou sem áudio.
const STROKE = 3
const GAP = 3
const OFFSET = STROKE + GAP

/**
 * Avatar do projeto que toca um trecho de áudio ao ser clicado.
 *
 * Props
 *  - imageSrc  URL da foto do avatar
 *  - alt       texto alternativo do avatar
 *  - size      diâmetro do avatar (px)
 *  - src       URL pública do mp3. Sem src, é só um avatar normal.
 *  - songName  nome da faixa (acessibilidade e tooltip)
 *  - delayMs   tempo até o botão de play aparecer
 *  - onPlay    chamado na PRIMEIRA reprodução (bom para analytics)
 *  - onEnded   chamado quando o trecho termina
 */
export default function ProjectAvatarPlayer({
  imageSrc,
  alt,
  size = 90,
  src,
  songName,
  delayMs = 1000,
  onPlay,
  onEnded,
}) {
  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const rafRef = useRef(null)
  const playedOnceRef = useRef(false)

  const [armed, setArmed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [failed, setFailed] = useState(false)

  const hasAudio = Boolean(src)
  const showControl = hasAudio && armed && !failed

  const ringSize = size + OFFSET * 2
  const center = ringSize / 2
  const radius = (ringSize - STROKE) / 2
  const circumference = 2 * Math.PI * radius

  // O progresso é escrito direto no SVG, sem re-render a cada frame.
  const setProgress = (ratio) => {
    if (progressRef.current) {
      progressRef.current.style.strokeDashoffset = String(circumference * (1 - ratio))
    }
  }

  const stopLoop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }

  const startLoop = () => {
    stopLoop()
    const tick = () => {
      const audio = audioRef.current
      if (audio && audio.duration) setProgress(audio.currentTime / audio.duration)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  // O botão só aparece depois do delay, e só então o áudio começa a baixar.
  useEffect(() => {
    if (!hasAudio) return
    const timer = setTimeout(() => setArmed(true), delayMs)
    return () => clearTimeout(timer)
  }, [hasAudio, delayMs])

  // Pausa ao trocar de aba e limpa tudo ao sair da página.
  useEffect(() => {
    const pauseIfHidden = () => {
      if (document.hidden) audioRef.current?.pause()
    }
    document.addEventListener('visibilitychange', pauseIfHidden)
    return () => {
      document.removeEventListener('visibilitychange', pauseIfHidden)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      audioRef.current?.pause()
    }
  }, [])

  // play() precisa ser chamado direto no clique, senão o iOS Safari bloqueia.
  const handleToggle = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (!audio.paused) {
      audio.pause()
      return
    }

    if (audio.readyState < 3) setIsBuffering(true)
    try {
      await audio.play()
    } catch (err) {
      setIsBuffering(false)
      if (err?.name === 'NotSupportedError') setFailed(true)
    }
  }

  const label = isPlaying
    ? `Pausar trecho${songName ? `: ${songName}` : ''}`
    : `Ouvir trecho${songName ? `: ${songName}` : ''}`

  return (
    <div className={classes.root} style={{ width: size, height: size }}>
      <Avatar src={imageSrc} size={size} alt={alt} />

      {showControl && (
        <>
          <svg
            className={`${classes.ring} ${hasStarted ? classes.ringActive : ''}`}
            width={ringSize}
            height={ringSize}
            style={{ top: -OFFSET, left: -OFFSET }}
            aria-hidden="true"
          >
            <circle
              className={classes.track}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={STROKE}
            />
            <circle
              ref={progressRef}
              className={classes.progress}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
            />
          </svg>

          <Tooltip label={label} openDelay={400} withArrow disabled={isPlaying}>
            <button
              type="button"
              className={classes.hit}
              onClick={handleToggle}
              aria-label={label}
              aria-pressed={isPlaying}
            >
              <span className={`${classes.control} ${!hasStarted ? classes.glow : ''}`}>
                {isBuffering ? (
                  <Loader size={16} color="white" />
                ) : isPlaying ? (
                  <IconPlayerPauseFilled size={18} />
                ) : (
                  <IconPlayerPlayFilled size={18} />
                )}
              </span>
            </button>
          </Tooltip>
        </>
      )}

      {hasAudio && (
        <audio
          ref={audioRef}
          src={armed ? src : undefined}
          preload={armed ? 'auto' : 'none'}
          onPlay={() => {
            setIsPlaying(true)
            setHasStarted(true)
            startLoop()
            if (!playedOnceRef.current) {
              playedOnceRef.current = true
              onPlay?.()
            }
          }}
          onPlaying={() => setIsBuffering(false)}
          onWaiting={() => setIsBuffering(true)}
          onPause={() => {
            setIsPlaying(false)
            setIsBuffering(false)
            stopLoop()
          }}
          onEnded={() => {
            stopLoop()
            setProgress(0)
            setHasStarted(false)
            setIsPlaying(false)
            if (audioRef.current) audioRef.current.currentTime = 0
            onEnded?.()
          }}
          onError={() => {
            stopLoop()
            setFailed(true)
          }}
        />
      )}
    </div>
  )
}
