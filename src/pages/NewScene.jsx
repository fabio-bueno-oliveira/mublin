import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useQueryClient } from '@tanstack/react-query'
import {
  Affix,
  Container,
  Stack,
  Group,
  Box,
  Text,
  Title,
  Button,
  Textarea,
  Progress,
  ActionIcon,
  Avatar,
  Loader,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  IconMovie,
  IconX,
  IconLock,
  IconSparkles,
  IconAlertTriangle,
} from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

const MAX_DURATION_SECONDS = 50 // precisa bater com o CHECK das tabelas scenes/scene_uploads
const MAX_SIZE_MB = 30
const MAX_CAPTION_LENGTH = 150
const PROCESSING_TIMEOUT_MS = 90_000 // depois disso, deixamos de bloquear a tela
const POLL_INTERVAL_MS = 2_000

// Lê metadados do vídeo (duração e orientação) usando um <video> temporário,
// sem precisar subir o arquivo antes.
function readVideoMetadata(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const videoEl = document.createElement('video')
    videoEl.preload = 'metadata'
    videoEl.src = url

    videoEl.onloadedmetadata = () => {
      resolve({
        duration: videoEl.duration,
        isVertical: videoEl.videoHeight > videoEl.videoWidth,
        objectUrl: url,
      })
    }

    videoEl.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('invalid-video'))
    }
  })
}

// Sobe o arquivo direto pra URL de upload do Mux, com progresso via XHR
// (fetch não expõe progresso de upload de forma simples multiplataforma).
function uploadFileToMux(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload falhou (status ${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('Erro de rede durante o upload.'))
    xhr.send(file)
  })
}

// ── Bloqueio para quem não é Pro ──────────────────────────
function ProUpsell() {
  const navigate = useNavigate()

  return (
    <Container size="xs" py="xl">
      <Stack align="center" gap="sm" ta="center" py={40}>
        <Box
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--mantine-color-yellow-light)',
          }}
        >
          <IconLock size={26} stroke={1.5} />
        </Box>

        <Title order={3}>Cenas são exclusivas do Mublin Pro</Title>

        <Text c="dimmed" size="sm" maw={320}>
          Assine o Mublin Pro para publicar vídeos verticais de até {MAX_DURATION_SECONDS}{' '}
          segundos e aparecer na área de Cenas para toda a comunidade.
        </Text>

        <Button
          mt="sm"
          radius="xl"
          leftSection={<IconSparkles size={16} />}
          onClick={() => navigate('/pro')}
        >
          Conhecer o Mublin Pro
        </Button>

        <Button variant="subtle" color="gray" size="xs" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </Stack>
    </Container>
  )
}

// ── Página principal ──────────────────────────────────────
export default function NewScene() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const videoInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [duration, setDuration] = useState(0)
  const [isVertical, setIsVertical] = useState(true)
  const [caption, setCaption] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  // idle | uploading | processing | error
  const [phase, setPhase] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  if (profile?.plan !== 'Pro') {
    return <ProUpsell />
  }

  const isBusy = phase === 'uploading' || phase === 'processing'

  function resetSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(null)
    setPreviewUrl('')
    setDuration(0)
    setIsVertical(true)
    setUploadProgress(0)
    setPhase('idle')
    setErrorMessage('')
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  async function handleFileChange(selected) {
    if (!selected) {
      return
    }

    if (selected.type !== 'video/mp4') {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Envie um arquivo no formato .mp4.',
      })
      return
    }

    const maxSizeBytes = MAX_SIZE_MB * 1024 * 1024
    if (selected.size > maxSizeBytes) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: `O vídeo deve ter no máximo ${MAX_SIZE_MB}MB.`,
      })
      return
    }

    try {
      const meta = await readVideoMetadata(selected)

      if (!meta.duration || meta.duration <= 0) {
        throw new Error('invalid-duration')
      }

      if (meta.duration > MAX_DURATION_SECONDS) {
        URL.revokeObjectURL(meta.objectUrl)
        notifications.show({
          color: 'red',
          position: 'top-center',
          message: `Sua Cena precisa ter no máximo ${MAX_DURATION_SECONDS} segundos. Corte o vídeo e tente novamente.`,
        })
        return
      }

      setFile(selected)
      setPreviewUrl(meta.objectUrl)
      setDuration(meta.duration)
      setIsVertical(meta.isVertical)
      setPhase('idle')
      setErrorMessage('')
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Não foi possível ler esse vídeo. Tente outro arquivo.',
      })
    }
  }

  // Consulta scene_uploads até o webhook do Mux marcar como pronto (ou falho)
  function waitForProcessing(pendingId) {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now()

      const interval = setInterval(async () => {
        if (Date.now() - startedAt > PROCESSING_TIMEOUT_MS) {
          clearInterval(interval)
          reject(new Error('timeout'))
          return
        }

        const { data, error } = await supabase
          .from('scene_uploads')
          .select('status, error_message')
          .eq('id', pendingId)
          .single()

        if (error) {
          clearInterval(interval)
          reject(error)
          return
        }

        if (data.status === 'ready') {
          clearInterval(interval)
          resolve()
        } else if (data.status === 'errored') {
          clearInterval(interval)
          reject(
            new Error(data.error_message || 'O Mux não conseguiu processar o vídeo.'),
          )
        }
        // se ainda for 'waiting', o intervalo tenta de novo na próxima rodada
      }, POLL_INTERVAL_MS)
    })
  }

  async function handlePublish() {
    if (!file) {
      return
    }

    setPhase('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      // 1) Pede ao servidor uma URL de upload direto no Mux
      const createRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mux-create-upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ duration, caption }),
        },
      )

      const createData = await createRes.json()

      if (!createRes.ok) {
        throw new Error(createData?.error || 'Não foi possível preparar o upload.')
      }

      const { pendingId, uploadUrl } = createData

      // 2) Sobe o arquivo direto pro Mux
      await uploadFileToMux(uploadUrl, file, setUploadProgress)

      // 3) Aguarda o Mux processar — o webhook cria a Scene de verdade
      setPhase('processing')
      await waitForProcessing(pendingId)

      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Cena publicada!',
      })
      await queryClient.invalidateQueries({ queryKey: ['scenes'] })
      navigate('/home')
    } catch (err) {
      console.error('Erro ao publicar cena:', err)

      if (err.message === 'timeout') {
        // Não é uma falha — o vídeo só está demorando mais que o normal.
        // Não faz sentido travar o usuário na tela por isso: a Cena aparece
        // sozinha assim que o webhook terminar de processar.
        notifications.show({
          color: 'yellow',
          position: 'top-center',
          message:
            'Seu vídeo ainda está sendo processado — ele vai aparecer em instantes.',
        })
        navigate('/home')
        return
      }

      setPhase('error')
      setErrorMessage(err.message || 'Não foi possível publicar sua Cena.')
    }
  }

  return (
    <>
      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Nova Scene" />
      </Affix>
      <Container size="sm" py="md" mt={{ base: 50, sm: 0 }}>
        <Stack gap="sm">
          {/* Autor */}
          <Group gap="sm">
            <Avatar
              size={40}
              radius="xl"
              src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
            />
            <Stack gap={4}>
              <Text size="xs" c="dimmed" lh={1}>
                Enviar nova Scene
              </Text>
              <Text lh={1}>{profile?.full_name}</Text>
            </Stack>
          </Group>

          {!file ? (
            <Box
              component="label"
              htmlFor="scene-video-input"
              style={{
                cursor: 'pointer',
                border: '1.5px dashed var(--mantine-color-default-border)',
                borderRadius: 16,
                padding: '48px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                textAlign: 'center',
              }}
            >
              <IconMovie size={66} stroke={1} />
              <Text size="sm" fw={600}>
                Toque para escolher um vídeo
              </Text>
              <Text size="xs" c="dimmed" maw={280}>
                Vertical, .mp4, até {MAX_DURATION_SECONDS} segundos e {MAX_SIZE_MB}MB
              </Text>
              <input
                ref={videoInputRef}
                id="scene-video-input"
                type="file"
                accept="video/mp4"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
            </Box>
          ) : (
            <Stack gap="sm">
              <Box
                style={{
                  position: 'relative',
                  width: 220,
                  margin: '0 auto',
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: '#000',
                }}
              >
                <video
                  src={previewUrl}
                  muted
                  playsInline
                  controls={!isBusy}
                  loop
                  style={{
                    display: 'block',
                    width: '100%',
                    aspectRatio: isVertical ? '9 / 16' : '16 / 9',
                    objectFit: 'cover',
                    opacity: isBusy ? 0.4 : 1,
                  }}
                />

                {isBusy && (
                  <Box
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Loader color="white" size="md" />
                  </Box>
                )}

                {!isBusy && (
                  <ActionIcon
                    color="red"
                    variant="filled"
                    size="sm"
                    radius="xl"
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={resetSelection}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                )}
              </Box>

              <Text size="xs" c="dimmed" ta="center">
                Duração: {duration.toFixed(1)}s / {MAX_DURATION_SECONDS}s máx.
              </Text>

              {!isVertical && phase === 'idle' && (
                <Group gap={6} justify="center" wrap="nowrap">
                  <IconAlertTriangle size={14} color="var(--mantine-color-yellow-6)" />
                  <Text size="xs" c="dimmed" ta="center">
                    Vídeos verticais (9:16) ficam melhores nas Cenas.
                  </Text>
                </Group>
              )}

              {phase === 'uploading' && (
                <Stack gap={4}>
                  <Progress value={uploadProgress} size="sm" radius="xl" animated />
                  <Text size="xs" c="dimmed" ta="center">
                    Enviando vídeo... {uploadProgress}%
                  </Text>
                </Stack>
              )}

              {phase === 'processing' && (
                <Text size="xs" c="dimmed" ta="center">
                  Vídeo enviado! Processando (isso pode levar até um minuto)...
                </Text>
              )}

              {phase === 'error' && (
                <Group gap={6} justify="center" wrap="nowrap">
                  <IconAlertTriangle size={14} color="var(--mantine-color-red-6)" />
                  <Text size="xs" c="red" ta="center">
                    {errorMessage}
                  </Text>
                </Group>
              )}

              <Textarea
                placeholder="Escreva uma legenda (opcional)"
                minRows={2}
                autosize
                maxRows={4}
                maxLength={MAX_CAPTION_LENGTH}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isBusy}
              />
              <Text size="xs" c="dimmed" ta="right">
                {caption.length}/{MAX_CAPTION_LENGTH}
              </Text>

              <Group justify="flex-end">
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={resetSelection}
                  disabled={isBusy}
                >
                  Trocar vídeo
                </Button>
                <Button radius="xl" fw={700} loading={isBusy} onClick={handlePublish}>
                  {phase === 'error' ? 'Tentar novamente' : 'Publicar Cena'}
                </Button>
              </Group>
            </Stack>
          )}
        </Stack>
      </Container>
    </>
  )
}
