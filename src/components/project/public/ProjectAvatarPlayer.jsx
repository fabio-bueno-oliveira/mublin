import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Avatar, Loader, Tooltip } from '@mantine/core'
import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react'
import classes from './ProjectAvatarPlayer.module.css'

// O anel fica por FORA do avatar (estilo "stories"), então o layout da
// página não muda com ou sem áudio.
const STROKE = 3
const GAP = 3
const OFFSET = STROKE + GAP

/**
 * Avatar do projeto com anel degradê e um badge de play no canto superior direito.
 * Ao clicar (em qualquer parte do avatar), toca o trecho e o progresso corre pelo anel.
 *
 * Props
 *  - imageSrc  URL da foto do avatar
 *  - alt       texto alternativo do avatar
 *  - size      diâmetro do avatar (px)
 *  - src       URL pública do mp3. Sem src, é só um avatar normal.
 *  - songName  nome da faixa (acessibilidade e tooltip)
 *  - delayMs   tempo até o badge "saltar" e o áudio começar a pré-carregar
 *              (o pré-carregamento também começa antes, no primeiro hover/foco/toque)
 *  - onPlay    chamado na PRIMEIRA reprodução (bom para analytics)
 *  - onEnded   chamado quando o trecho termina
 */
export default function ProjectAvatarPlayer({
  imageSrc,
  alt,
  size = 90,
  src,
  songName,
  delayMs = 800,
  onPlay,
  onEnded,
}) {
  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const rafRef = useRef(null)
  const armedRef = useRef(false)
  const playedOnceRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [failed, setFailed] = useState(false)

  const gradientId = `ring-${useId().replace(/:/g, '')}`

  const hasAudio = Boolean(src)
  const showControl = hasAudio && !failed

  // Geometria do anel
  const ringSize = size + OFFSET * 2
  const center = ringSize / 2
  const radius = (ringSize - STROKE) / 2
  const circumference = 2 * Math.PI * radius

  // Badge sobre o anel, na diagonal superior direita (como um Indicator)
  const badgeSize = Math.round(Math.max(22, size * 0.28))
  const badgeCenterX = size / 2 + radius * Math.SQRT1_2
  const badgeCenterY = size / 2 - radius * Math.SQRT1_2

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

  // Começa a baixar o mp3. Só acontece uma vez, e nunca no meio de uma reprodução.
  const arm = useCallback(() => {
    if (armedRef.current) return
    const audio = audioRef.current
    if (!audio) return
    armedRef.current = true
    if (!audio.paused || audio.currentTime > 0) return
    audio.preload = 'auto'
    audio.load()
  }, [])

  // Plano B: pré-carrega depois do delay mesmo sem interação.
  useEffect(() => {
    if (!hasAudio) return
    const timer = setTimeout(arm, delayMs)
    return () => clearTimeout(timer)
  }, [hasAudio, delayMs, arm])

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
            className={`${classes.ring} ${hasStarted ? classes.ringPlaying : ''}`}
            width={ringSize}
            height={ringSize}
            style={{ top: -OFFSET, left: -OFFSET }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop
                  offset="0%"
                  style={{
                    stopColor:
                      'var(--mantine-color-mublinColor-filled, var(--mantine-primary-color-filled))',
                  }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: 'var(--mantine-color-grape-filled)' }}
                />
              </linearGradient>
            </defs>

            {/* Em repouso: anel degradê completo. Tocando: vira trilho apagado. */}
            <circle
              className={classes.track}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
            />
            {/* Progresso do áudio, começando no topo */}
            <circle
              ref={progressRef}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference}
              transform={`rotate(-90 ${center} ${center})`}
            />
          </svg>

          <Tooltip
            label={label}
            color="dark"
            openDelay={50}
            withArrow
            position="top"
            disabled={isPlaying}
          >
            <button
              type="button"
              className={classes.hit}
              onClick={handleToggle}
              onPointerEnter={arm}
              onPointerDown={arm}
              onFocus={arm}
              aria-label={label}
              aria-pressed={isPlaying}
            >
              <span
                className={classes.badge}
                style={{
                  width: badgeSize,
                  height: badgeSize,
                  left: badgeCenterX - badgeSize / 2,
                  top: badgeCenterY - badgeSize / 2,
                  '--badge-delay': `${delayMs}ms`,
                }}
              >
                <span
                  className={`${classes.badgeInner} ${!hasStarted ? classes.glow : ''}`}
                >
                  {isBuffering ? (
                    <Loader size={Math.round(badgeSize * 0.5)} color="white" />
                  ) : isPlaying ? (
                    <IconPlayerPauseFilled size={Math.round(badgeSize * 0.52)} />
                  ) : (
                    <IconPlayerPlayFilled size={Math.round(badgeSize * 0.52)} />
                  )}
                </span>
              </span>
            </button>
          </Tooltip>
        </>
      )}

      {hasAudio && (
        <audio
          ref={audioRef}
          src={src}
          preload="none"
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
