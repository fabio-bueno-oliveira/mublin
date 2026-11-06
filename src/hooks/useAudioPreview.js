// src/hooks/useAudioPreview.js
// Lógica de reprodução de um trecho de áudio, separada da aparência.
// Mesma estratégia do ProjectAvatarPlayer: o mp3 só começa a baixar no primeiro
// hover/foco/toque (ou após delayMs), play() é chamado direto no clique (exigência
// do iOS Safari) e o progresso é entregue por requestAnimationFrame via onFrame,
// sem re-render a cada quadro.
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useAudioPreview({
  src,
  delayMs = 800,
  onPlay,
  onEnded,
  onFrame,
} = {}) {
  const audioRef = useRef(null)
  const rafRef = useRef(null)
  const armedRef = useRef(false)
  const playedOnceRef = useRef(false)
  const callbacksRef = useRef({ onPlay, onEnded, onFrame })

  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [failed, setFailed] = useState(false)

  // Callbacks sempre atualizados, sem recriar os handlers
  useEffect(() => {
    callbacksRef.current = { onPlay, onEnded, onFrame }
  })

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }, [])

  const startLoop = useCallback(() => {
    stopLoop()
    const tick = () => {
      const audio = audioRef.current
      if (audio && audio.duration) {
        callbacksRef.current.onFrame?.(audio.currentTime / audio.duration)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [stopLoop])

  // Começa a baixar o mp3 (uma vez, e nunca no meio de uma reprodução)
  const arm = useCallback(() => {
    if (armedRef.current) return
    const audio = audioRef.current
    if (!audio) return
    armedRef.current = true
    if (!audio.paused || audio.currentTime > 0) return
    audio.preload = 'auto'
    audio.load()
  }, [])

  // Trocou de música (ou de src): zera tudo
  useEffect(() => {
    armedRef.current = false
    playedOnceRef.current = false
    setIsPlaying(false)
    setIsBuffering(false)
    setHasStarted(false)
    setFailed(false)
    callbacksRef.current.onFrame?.(0)

    return () => {
      stopLoop()
      audioRef.current?.pause()
    }
  }, [src, stopLoop])

  // Plano B: pré-carrega depois do delay mesmo sem interação
  useEffect(() => {
    if (!src) return
    const timer = setTimeout(arm, delayMs)
    return () => clearTimeout(timer)
  }, [src, delayMs, arm])

  // Pausa ao trocar de aba
  useEffect(() => {
    const pauseIfHidden = () => {
      if (document.hidden) audioRef.current?.pause()
    }
    document.addEventListener('visibilitychange', pauseIfHidden)
    return () => document.removeEventListener('visibilitychange', pauseIfHidden)
  }, [])

  // play() precisa rodar direto no clique, senão o iOS Safari bloqueia
  const toggle = useCallback(async () => {
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
  }, [])

  // Props para espalhar no <audio ref={audioRef} {...audioProps} />
  const audioProps = {
    src,
    preload: 'none',
    onPlay: () => {
      setIsPlaying(true)
      setHasStarted(true)
      startLoop()
      if (!playedOnceRef.current) {
        playedOnceRef.current = true
        callbacksRef.current.onPlay?.()
      }
    },
    onPlaying: () => setIsBuffering(false),
    onWaiting: () => setIsBuffering(true),
    onPause: () => {
      setIsPlaying(false)
      setIsBuffering(false)
      stopLoop()
    },
    onEnded: () => {
      stopLoop()
      callbacksRef.current.onFrame?.(0)
      setHasStarted(false)
      setIsPlaying(false)
      if (audioRef.current) audioRef.current.currentTime = 0
      callbacksRef.current.onEnded?.()
    },
    onError: () => {
      stopLoop()
      setFailed(true)
    },
  }

  return { audioRef, audioProps, isPlaying, isBuffering, hasStarted, failed, toggle, arm }
}
