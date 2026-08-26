import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { upload } from '@imagekit/react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useQueryClient } from '@tanstack/react-query'
import {
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
  Center,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconVideo,
  IconX,
  IconLock,
  IconSparkles,
  IconAlertTriangle,
  IconMovie,
} from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

const MAX_DURATION_SECONDS = 50 // precisa bater com o CHECK da tabela scenes (duration_seconds <= 50)
const MAX_SIZE_MB = 30
const MAX_CAPTION_LENGTH = 150

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

// ── Bloqueio para quem não é Pro ──────────────────────────
function ProUpsell() {
  const navigate = useNavigate()

  return (
    <Container size="xs" py="xl">
      <Stack align="center" gap="sm" ta="center" py={40}>
        <Center mb="xl">
          <IconMovie size={56} stroke={1} color="var(--mantine-color-text)" />
        </Center>

        <Center>
          <IconLock size={26} stroke={1.5} color="var(--mantine-color-dimmed)" />
        </Center>

        <Title order={3} mx="lg">
          A publicação de cenas é exclusiva para Mublin Pro
        </Title>

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
  const { profile, user } = useAuth()
  const queryClient = useQueryClient()
  const videoInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [duration, setDuration] = useState(0)
  const [isVertical, setIsVertical] = useState(true)
  const [caption, setCaption] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  if (profile?.plan !== 'Pro') {
    return <ProUpsell />
  }

  function resetSelection() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFile(null)
    setPreviewUrl('')
    setDuration(0)
    setIsVertical(true)
    setUploadProgress(0)
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
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Não foi possível ler esse vídeo. Tente outro arquivo.',
      })
    }
  }

  async function handlePublish() {
    if (!file) {
      return
    }

    setSubmitting(true)
    setUploadProgress(0)

    let uploadedFileId = null

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const authRes = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const { token: ikToken, expire, signature } = await authRes.json()

      const response = await upload({
        file,
        fileName: `${user.id}_scene`,
        folder: '/scenes/',
        tags: ['scene'],
        useUniqueFileName: true,
        publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
        token: ikToken,
        expire,
        signature,
        onProgress: (event) => {
          if (event?.total) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100))
          }
        },
      })

      uploadedFileId = response.fileId

      const { error: insertError } = await supabase.from('scenes').insert({
        profile_id: user.id,
        video_url: response.url,
        duration_seconds: Math.round(duration),
        caption: caption.trim() || null,
      })

      if (insertError) {
        throw insertError
      }

      notifications.show({
        color: 'green',
        message: 'Cena publicada!',
        position: 'top-center',
      })
      await queryClient.invalidateQueries({ queryKey: ['scenes'] })
      navigate('/home')
    } catch (err) {
      console.error('Erro ao publicar cena:', err)

      // Se o vídeo já subiu pro ImageKit mas o registro no banco falhou,
      // removemos o arquivo órfão em vez de deixar lixo no storage.
      if (uploadedFileId) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/imagekit-manage`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({ fileId: uploadedFileId }),
            },
          )
        } catch (cleanupErr) {
          console.error('Erro ao limpar vídeo órfão:', cleanupErr)
        }
      }

      notifications.show({
        color: 'red',
        title: 'Ops...',
        message: 'Não foi possível publicar sua Cena. Tente novamente.',
        position: 'top-center',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container size="sm" py="md">
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
              Nova Cena
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
            <IconVideo size={32} stroke={1.4} />
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
                controls
                loop
                style={{
                  display: 'block',
                  width: '100%',
                  aspectRatio: isVertical ? '9 / 16' : '16 / 9',
                  objectFit: 'cover',
                }}
              />
              <ActionIcon
                color="red"
                variant="filled"
                size="sm"
                radius="xl"
                style={{ position: 'absolute', top: 8, right: 8 }}
                onClick={resetSelection}
                disabled={submitting}
              >
                <IconX size={12} />
              </ActionIcon>
            </Box>

            <Text size="xs" c="dimmed" ta="center">
              Duração: {duration.toFixed(1)}s / {MAX_DURATION_SECONDS}s máx.
            </Text>

            {!isVertical && (
              <Group gap={6} justify="center" wrap="nowrap">
                <IconAlertTriangle size={14} color="var(--mantine-color-yellow-6)" />
                <Text size="xs" c="dimmed" ta="center">
                  Vídeos verticais (9:16) ficam melhores nas Cenas.
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
            />
            <Text size="xs" c="dimmed" ta="right">
              {caption.length}/{MAX_CAPTION_LENGTH}
            </Text>

            {submitting && uploadProgress > 0 && (
              <Progress value={uploadProgress} size="sm" radius="xl" animated />
            )}

            <Group justify="flex-end">
              <Button
                variant="subtle"
                color="gray"
                onClick={resetSelection}
                disabled={submitting}
              >
                Trocar vídeo
              </Button>
              <Button radius="xl" fw={700} loading={submitting} onClick={handlePublish}>
                Publicar Cena
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
