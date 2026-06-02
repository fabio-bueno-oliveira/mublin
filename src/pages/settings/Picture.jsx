import { useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { upload } from '@imagekit/react'
import {
  Stack,
  Button,
  Group,
  Text,
  Divider,
  Box,
  Loader,
  Avatar,
  Image,
  ActionIcon,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconCheck, IconPhoto, IconTrash } from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
const COVER_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

// ── ImageKit helpers ──────────────────────────────────────

async function getIkAuthTokens() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const authRes = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  })
  if (!authRes.ok) {
    throw new Error('Falha na autenticação do ImageKit')
  }
  return { session, ...(await authRes.json()) }
}

async function uploadToImageKit({ file, fileName, folder, tags, onProgress }) {
  const { token: ikToken, expire, signature } = await getIkAuthTokens()
  return upload({
    file,
    fileName,
    folder,
    tags,
    useUniqueFileName: true,
    publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
    token: ikToken,
    expire,
    signature,
    onProgress: (e) => onProgress?.(Math.round((e.loaded / e.total) * 100)),
  })
}

async function deleteFromImageKit(fileId) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/imagekit-manage`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ fileId }),
    },
  )
  if (!response.ok) {
    throw new Error('Erro ao deletar no servidor')
  }
}

// ── Componente principal ──────────────────────────────────

export default function Picture() {
  const { profile, user, refreshProfile } = useAuth()
  const queryClient = useQueryClient()

  // ── Avatar ────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState(null) // URL local para preview
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarFileId, setAvatarFileId] = useState('') // fileId do IK (upload pendente)
  const [avatarProgress, setAvatarProgress] = useState(0)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const avatarInputRef = useRef(null)

  // ── Cover ─────────────────────────────────────────────
  const [coverPreview, setCoverPreview] = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverFileId, setCoverFileId] = useState('')
  const [coverProgress, setCoverProgress] = useState(0)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [savingCover, setSavingCover] = useState(false)
  const coverInputRef = useRef(null)

  // ── Handlers: Avatar ──────────────────────────────────

  async function handleAvatarSelect(file) {
    if (!file) {
      return
    }
    // Preview imediato
    setAvatarPreview(URL.createObjectURL(file))
    setAvatarFile(file)
    setUploadingAvatar(true)
    try {
      const response = await uploadToImageKit({
        file,
        fileName: `${user.id}_avatar`,
        folder: '/users/avatars/',
        tags: ['profile', 'avatar'],
        onProgress: setAvatarProgress,
      })
      const fileName = response.filePath.split('/').pop()
      setAvatarFileId(response.fileId)
      // Guarda o nome final mas ainda não salva no banco
      setAvatarFile({ ...file, _ikFileName: fileName })
      setAvatarProgress(0)
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao enviar a foto. Tente novamente.',
      })
      handleCancelAvatar()
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleCancelAvatar() {
    // Remove do IK se já foi enviado
    if (avatarFileId) {
      try {
        await deleteFromImageKit(avatarFileId)
      } catch {}
    }
    setAvatarPreview(null)
    setAvatarFile(null)
    setAvatarFileId('')
    setAvatarProgress(0)
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }

  async function handleSaveAvatar() {
    if (!avatarFile?._ikFileName) {
      return
    }
    setSavingAvatar(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar: avatarFile._ikFileName })
        .eq('id', user.id)
      if (error) {
        throw error
      }
      await refreshProfile()
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Foto de perfil atualizada!',
      })
      setAvatarPreview(null)
      setAvatarFile(null)
      setAvatarFileId('')
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao salvar. Tente novamente.',
      })
    } finally {
      setSavingAvatar(false)
    }
  }

  // ── Handlers: Cover ───────────────────────────────────

  async function handleCoverSelect(file) {
    if (!file) {
      return
    }
    setCoverPreview(URL.createObjectURL(file))
    setCoverFile(file)
    setUploadingCover(true)
    try {
      const response = await uploadToImageKit({
        file,
        fileName: `${user.id}_cover`,
        folder: '/users/avatars/',
        tags: ['profile', 'cover'],
        onProgress: setCoverProgress,
      })
      const fileName = response.filePath.split('/').pop()
      setCoverFileId(response.fileId)
      setCoverFile({ ...file, _ikFileName: fileName })
      setCoverProgress(0)
      await refreshProfile()
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao enviar a capa. Tente novamente.',
      })
      handleCancelCover()
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleCancelCover() {
    if (coverFileId) {
      try {
        await deleteFromImageKit(coverFileId)
      } catch {}
    }
    setCoverPreview(null)
    setCoverFile(null)
    setCoverFileId('')
    setCoverProgress(0)
    if (coverInputRef.current) {
      coverInputRef.current.value = ''
    }
  }

  async function handleSaveCover() {
    if (!coverFile?._ikFileName) {
      return
    }
    setSavingCover(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ cover_image: coverFile._ikFileName })
        .eq('id', user.id)
      if (error) {
        throw error
      }
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Foto de capa atualizada!',
      })
      setCoverPreview(null)
      setCoverFile(null)
      setCoverFileId('')
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao salvar. Tente novamente.',
      })
    } finally {
      setSavingCover(false)
    }
  }

  // ── Render ────────────────────────────────────────────

  return (
    <Stack gap="lg">
      {/* ── Foto de Perfil ─────────────────────────── */}
      <Stack gap="md">
        <Text fw={600} size="sm" c="dimmed" tt="uppercase" lts="0.05em">
          Foto de Perfil
        </Text>

        <Group align="flex-end" gap="lg">
          {/* Preview */}
          <Box style={{ position: 'relative' }}>
            <Avatar
              size="lg"
              radius="xl"
              src={
                avatarPreview ??
                (profile?.avatar ? AVATAR_PATH + profile.avatar : undefined)
              }
            />
            {uploadingAvatar && (
              <Box
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.45)',
                  borderRadius: 'var(--mantine-radius-xl)',
                }}
              >
                <Loader size="sm" color="white" />
              </Box>
            )}
          </Box>

          {/* Ações */}
          <Stack gap="xs">
            <Text size="xs" c="dimmed">
              JPG ou PNG. Recomendado: 400×400px.
            </Text>
            {!avatarPreview ? (
              <Button
                size="xs"
                variant="default"
                leftSection={<IconPhoto size={14} />}
                component="label"
                htmlFor="avatar-input"
                disabled={uploadingAvatar}
              >
                Escolher foto
              </Button>
            ) : (
              <Group gap="xs">
                <Button
                  size="xs"
                  color="indigo"
                  leftSection={
                    savingAvatar ? <Loader size={13} /> : <IconCheck size={14} />
                  }
                  disabled={uploadingAvatar || savingAvatar}
                  onClick={handleSaveAvatar}
                >
                  {savingAvatar ? 'Salvando...' : 'Salvar'}
                </Button>
                <ActionIcon
                  variant="default"
                  size="md"
                  onClick={handleCancelAvatar}
                  disabled={savingAvatar}
                  title="Cancelar e remover do servidor"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            )}
            {avatarProgress > 0 && avatarProgress < 100 && (
              <Text size="xs" c="dimmed">
                Enviando... {avatarProgress}%
              </Text>
            )}
          </Stack>
        </Group>

        <input
          ref={avatarInputRef}
          id="avatar-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleAvatarSelect(e.target.files[0])
            }
          }}
        />
      </Stack>

      <Divider />

      {/* ── Foto de Capa ───────────────────────────── */}
      <Stack gap="md">
        <Text fw={600} size="sm" c="dimmed" tt="uppercase" lts="0.05em">
          Foto de Capa
        </Text>

        <Stack gap="xs">
          {/* Preview da capa */}
          <Box
            style={{
              position: 'relative',
              width: '100%',
              height: 120,
              borderRadius: 'var(--mantine-radius-md)',
              overflow: 'hidden',
              background: 'light-dark(#e9ecef, #2c2c2c)',
            }}
          >
            {(coverPreview || profile?.cover_image) && (
              <Image
                src={coverPreview ?? COVER_PATH + profile.cover_image}
                h={120}
                w="100%"
                fit="cover"
              />
            )}
            {uploadingCover && (
              <Box
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.45)',
                }}
              >
                <Loader size="sm" color="white" />
              </Box>
            )}
          </Box>

          <Text size="xs" c="dimmed">
            JPG ou PNG. Recomendado: 870×90px
          </Text>

          {!coverPreview ? (
            <Group gap="xs">
              <Button
                size="xs"
                variant="default"
                leftSection={<IconPhoto size={14} />}
                component="label"
                htmlFor="cover-input"
                disabled={uploadingCover}
              >
                Escolher foto de capa
              </Button>
            </Group>
          ) : (
            <Group gap="xs">
              <Button
                size="xs"
                color="indigo"
                leftSection={savingCover ? <Loader size={13} /> : <IconCheck size={14} />}
                disabled={uploadingCover || savingCover}
                onClick={handleSaveCover}
              >
                {savingCover ? 'Salvando...' : 'Salvar capa'}
              </Button>
              <ActionIcon
                variant="default"
                size="md"
                onClick={handleCancelCover}
                disabled={savingCover}
                title="Cancelar e remover do servidor"
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          )}

          {coverProgress > 0 && coverProgress < 100 && (
            <Text size="xs" c="dimmed">
              Enviando... {coverProgress}%
            </Text>
          )}
        </Stack>

        <input
          ref={coverInputRef}
          id="cover-input"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleCoverSelect(e.target.files[0])
            }
          }}
        />
      </Stack>
    </Stack>
  )
}
