// src/components/songs/public/SongPreviewButton.jsx
import { useId, useRef } from 'react'
import { Loader, Text, UnstyledButton } from '@mantine/core'
import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react'
import useAudioPreview from '../../../hooks/useAudioPreview'

const SIZE = 18
const STROKE = 2.5
const CENTER = SIZE / 2
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Botão "Ouvir prévia": ícone dentro de um mini anel degradê (mesma linguagem do
 * avatar do projeto). Em repouso o anel é completo; tocando, vira trilho e o
 * progresso corre por cima. Sem src (ou se o áudio falhar), não renderiza nada.
 *
 * Props: src, songName, delayMs, onPlay (1ª reprodução), onEnded
 */
export default function SongPreviewButton({
  src,
  songName,
  delayMs = 800,
  onPlay,
  onEnded,
}) {
  const progressRef = useRef(null)
  const gradientId = `song-ring-${useId().replace(/:/g, '')}`

  const {
    audioRef,
    audioProps,
    isPlaying,
    isBuffering,
    hasStarted,
    failed,
    toggle,
    arm,
  } = useAudioPreview({
    src,
    delayMs,
    onPlay,
    onEnded,
    onFrame: (ratio) => {
      if (progressRef.current) {
        progressRef.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - ratio))
      }
    },
  })

  if (!src || failed) return null

  const label = isPlaying
    ? `Pausar prévia${songName ? `: ${songName}` : ''}`
    : `Ouvir prévia${songName ? `: ${songName}` : ''}`

  return (
    <>
      <UnstyledButton
        onClick={toggle}
        onPointerEnter={arm}
        onPointerDown={arm}
        onFocus={arm}
        aria-label={label}
        aria-pressed={isPlaying}
        mt={6}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        <span
          style={{
            position: 'relative',
            width: SIZE,
            height: SIZE,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width={SIZE}
            height={SIZE}
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop
                  offset="0%"
                  style={{
                    stopColor:
                      'var(--mantine-color-text-filled, var(--mantine-color-text-filled))',
                  }}
                />
                <stop offset="100%" style={{ stopColor: 'var(--mantine-color-text)' }} />
              </linearGradient>
            </defs>

            {/* Repouso: anel completo. Tocando: trilho apagado. */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
              style={{ opacity: hasStarted ? 0.25 : 1, transition: 'opacity 0.3s ease' }}
            />
            {/* Progresso, começando no topo */}
            <circle
              ref={progressRef}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          </svg>

          {isBuffering ? (
            <Loader size={12} color="var(--mantine-color-text)" />
          ) : isPlaying ? (
            <IconPlayerPauseFilled size={10} />
          ) : (
            <IconPlayerPlayFilled size={10} />
          )}
        </span>

        <Text size="xs">{isPlaying ? 'Pausar prévia' : 'Ouvir prévia'}</Text>
      </UnstyledButton>

      <audio ref={audioRef} {...audioProps} />
    </>
  )
}
