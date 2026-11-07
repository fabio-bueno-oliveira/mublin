// src/components/songs/public/SongPreviewButton.jsx
import { useRef } from 'react'
import { Loader, Text, UnstyledButton } from '@mantine/core'
import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react'
import useAudioPreview from '../../../hooks/useAudioPreview'

const SIZE = 18
const STROKE = 2
const CENTER = SIZE / 2
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Botão "Ouvir prévia": ícone dentro de um mini anel na cor do texto do tema
 * (escuro no tema claro, claro no tema escuro). Em repouso o anel é completo;
 * tocando, vira trilho apagado e o progresso corre por cima.
 * Sem src (ou se o áudio falhar), não renderiza nada.
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
        {/* O anel e o ícone herdam esta cor (currentColor), que acompanha o tema */}
        <span
          style={{
            position: 'relative',
            width: SIZE,
            height: SIZE,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--mantine-color-text)',
          }}
        >
          <svg
            width={SIZE}
            height={SIZE}
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
          >
            {/* Repouso: anel completo. Tocando: trilho apagado. */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
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
              stroke="currentColor"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          </svg>

          {isBuffering ? (
            <Loader size={9} color="currentColor" />
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
