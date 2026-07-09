import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { upload } from '@imagekit/react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import {
  Container,
  Stack,
  Textarea,
  Button,
  Group,
  Avatar,
  Text,
  Combobox,
  useCombobox,
  InputBase,
  Loader,
  CloseButton,
  Image,
  Divider,
  TextInput,
  Box,
  Badge,
  ActionIcon,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconMicrophone2,
  IconBox,
  IconLink,
  IconPhoto,
  IconX,
  IconVideo,
  IconLock,
} from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
const PROJECT_PATH =
  'https://ik.imagekit.io/mublin/projects/tr:h-100,w-100,c-maintain_ratio/'

// ── Busca de gigs ─────────────────────────────────────────
async function searchGigs(keyword) {
  const { data, error } = await supabase
    .from('gigs')
    .select('id, title, slug, has_remuneration')
    .ilike('title', `%${keyword}%`)
    .eq('active', true)
    .limit(8)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// ── Busca de produtos ─────────────────────────────────────
async function searchProducts(keyword) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, picture, brands(name)')
    .ilike('name', `%${keyword}%`)
    .limit(8)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// ── Combobox de busca genérico ────────────────────────────
function SearchCombobox({
  onSelect,
  searchFn,
  placeholder,
  renderOption,
  renderSelected,
  selected,
  onClear,
  debounceMs = 400,
}) {
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() })
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const fetchDebounced = useDebouncedCallback(async (val) => {
    setSearching(true)
    try {
      const data = await searchFn(val)
      setResults(data)
      combobox.openDropdown()
    } catch (err) {
      console.error('Erro na busca:', err)
    } finally {
      setSearching(false)
    }
  }, debounceMs)

  function handleChange(val) {
    setValue(val)
    if (val.trim().length < 2) {
      setResults([])
      combobox.closeDropdown()
      return
    }
    fetchDebounced(val)
  }

  if (selected) {
    return (
      <Group gap="xs">
        {renderSelected(selected)}
        <CloseButton size="sm" onClick={onClear} />
      </Group>
    )
  }

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        const item = results.find((r) => String(r.id) === val)
        if (item) {
          onSelect(item)
          setValue('')
          setResults([])
        }
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target>
        <InputBase
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && combobox.openDropdown()}
          rightSection={searching ? <Loader size="xs" /> : <Combobox.Chevron />}
          rightSectionPointerEvents="none"
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {results.length === 0 && !searching && (
            <Combobox.Empty>Nenhum resultado</Combobox.Empty>
          )}
          {results.map((item) => (
            <Combobox.Option key={item.id} value={String(item.id)}>
              {renderOption(item)}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

// ── Página principal ──────────────────────────────────────
export default function NewPost() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const queryClient = useQueryClient()
  const imageInputRef = useRef(null)

  const [body, setBody] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [authorType, setAuthorType] = useState('profile') // 'profile' | 'project'
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [linkedGig, setLinkedGig] = useState(null)
  const [linkedProduct, setLinkedProduct] = useState(null)
  const [showVideoField, setShowVideoField] = useState(false)
  const [postImage, setPostImage] = useState('')
  const [postImageFileId, setPostImageFileId] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Vídeo nativo (upload direto para o Supabase Storage, exclusivo Pro)
  const videoInputRef = useRef(null)
  const [videoMode, setVideoMode] = useState('none') // 'none' | 'youtube' | 'upload'
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const [nativeVideoPreview, setNativeVideoPreview] = useState('')
  const [nativeVideoIsVertical, setNativeVideoIsVertical] = useState(false)
  const [nativeVideoPublicUrl, setNativeVideoPublicUrl] = useState('')
  const [nativeVideoStoragePath, setNativeVideoStoragePath] = useState('')
  const [nativeVideoId, setNativeVideoId] = useState(null)

  const { data: savedProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-home-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const userProjects = savedProjects
    .filter((r) => r.status === 2) // apenas membros ativos
    .map((r) => ({
      value: String(r.projects.id),
      label: `${r.projects.name} (projeto)`,
      slug: r.projects.slug,
      picture: r.projects.picture,
    }))

  const selectedProject = userProjects.find((p) => p.value === selectedProjectId)

  async function handleImageUpload(file) {
    if (!file) {
      return
    }
    setIsUploadingImage(true)
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
        fileName: `${user.id}_post`,
        folder: '/posts/',
        tags: ['post', 'feed'],
        useUniqueFileName: true,
        publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
        token: ikToken,
        expire,
        signature,
      })
      const n = response.filePath.lastIndexOf('/')
      const fileName = response.filePath.substring(n + 1)
      setPostImageFileId(response.fileId)
      setPostImage(fileName)
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao enviar imagem. Tente novamente.',
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  async function handleRemoveImage() {
    if (!postImageFileId) {
      return
    }
    try {
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
          body: JSON.stringify({ fileId: postImageFileId }),
        },
      )
      if (!response.ok) {
        throw new Error('Erro ao deletar no servidor')
      }
      setPostImage('')
      setPostImageFileId('')
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover imagem. Tente novamente.',
      })
    }
  }

  // Lê a orientação do vídeo (vertical/horizontal) antes de subir, usando um <video> temporário
  function readVideoOrientation(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const videoEl = document.createElement('video')
      videoEl.preload = 'metadata'
      videoEl.src = url
      videoEl.onloadedmetadata = () => {
        resolve(videoEl.videoHeight > videoEl.videoWidth)
      }
      videoEl.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(false)
      }
    })
  }

  async function handleVideoFileChange(file) {
    if (!file) {
      return
    }

    if (profile?.plan !== 'Pro') {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'O upload de vídeo é exclusivo para assinantes Pro.',
      })
      return
    }

    if (file.type !== 'video/mp4') {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Envie um arquivo no formato .mp4.',
      })
      return
    }

    const maxSizeMb = 25
    if (file.size > maxSizeMb * 1024 * 1024) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: `O vídeo deve ter no máximo ${maxSizeMb}MB.`,
      })
      return
    }

    setIsUploadingVideo(true)

    let uploadedPath = null

    try {
      const isVertical = await readVideoOrientation(file)
      const path = `${user.id}/${crypto.randomUUID()}.mp4`
      uploadedPath = path

      const { error: uploadError } = await supabase.storage
        .from('mublin-videos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('mublin-videos').getPublicUrl(path)

      const { data: videoRow, error: insertError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          source: 'mublin',
          storage_path: path,
          is_vertical: isVertical,
        })
        .select('id')
        .single()

      if (insertError) {
        throw insertError
      }

      setNativeVideoPreview(URL.createObjectURL(file))
      setNativeVideoIsVertical(isVertical)
      setNativeVideoPublicUrl(publicUrl)
      setNativeVideoStoragePath(path)
      setNativeVideoId(videoRow.id)
      setVideoMode('upload')
      setShowVideoField(false)
      setVideoUrl('')
    } catch (err) {
      console.error('Erro ao enviar vídeo:', err)
      if (uploadedPath) {
        await supabase.storage.from('mublin-videos').remove([uploadedPath])
      }
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao enviar vídeo. Tente novamente.',
      })
    } finally {
      setIsUploadingVideo(false)
    }
  }

  async function handleRemoveNativeVideo() {
    try {
      if (nativeVideoId) {
        await supabase.from('videos').delete().eq('id', nativeVideoId)
      }
      if (nativeVideoStoragePath) {
        await supabase.storage.from('mublin-videos').remove([nativeVideoStoragePath])
      }
    } catch (err) {
      console.error('Erro ao remover vídeo:', err)
    } finally {
      if (nativeVideoPreview) {
        URL.revokeObjectURL(nativeVideoPreview)
      }
      setNativeVideoPreview('')
      setNativeVideoIsVertical(false)
      setNativeVideoPublicUrl('')
      setNativeVideoStoragePath('')
      setNativeVideoId(null)
      setVideoMode('none')
      if (videoInputRef.current) {
        videoInputRef.current.value = ''
      }
    }
  }

  async function handleSubmit() {
    if (!body.trim()) {
      notifications.show({
        color: 'red',
        message: 'Escreva algo antes de publicar.',
        position: 'top-center',
      })
      return
    }

    setSubmitting(true)

    const payload = {
      body: body.trim(),
      video_url: videoMode === 'youtube' ? videoUrl.trim() || null : null,
      video_source: videoMode === 'upload' ? 'mublin' : null,
      video_storage_path: videoMode === 'upload' ? nativeVideoPublicUrl : null,
      video_title: videoMode === 'upload' ? body.trim().slice(0, 60) || null : null,
      video_is_vertical: videoMode === 'upload' ? nativeVideoIsVertical : null,
      image: postImage || null,
      author_profile_id: authorType === 'profile' ? user.id : null,
      author_project_id:
        authorType === 'project' && selectedProjectId ? Number(selectedProjectId) : null,
      linked_gig_id: linkedGig?.id ?? null,
      linked_product_id: linkedProduct?.id ?? null,
    }

    const { error } = await supabase.from('feed').insert(payload)

    if (error) {
      notifications.show({
        color: 'red',
        title: 'Ops...',
        message: 'Não foi possível publicar. Tente novamente.',
        position: 'top-center',
      })
      setSubmitting(false)
      return
    }

    notifications.show({
      color: 'green',
      message: 'Post publicado!',
      position: 'top-center',
    })
    await queryClient.invalidateQueries({ queryKey: ['feed'] })
    navigate('/home')
  }

  return (
    <Container size="sm" py="md">
      <Stack gap="sm">
        {/* Autor */}
        <Group gap="sm">
          {authorType === 'profile' || !selectedProject ? (
            <Avatar
              size={40}
              radius="xl"
              src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
            />
          ) : (
            <Avatar
              size={40}
              radius="md"
              src={
                selectedProject.picture
                  ? PROJECT_PATH + selectedProject.picture
                  : undefined
              }
            />
          )}
          <Stack gap={4}>
            <Text size="xs" c="dimmed" lh={1}>
              Postando como
            </Text>
            <Text lh={1}>{profile?.full_name}</Text>
            {/* <Select
              size="xs"
              radius="xl"
              variant="filled"
              value={authorType === 'profile' ? 'profile' : selectedProjectId}
              onChange={(val) => {
                if (val === 'profile') {
                  setAuthorType('profile')
                  setSelectedProjectId(null)
                } else {
                  setAuthorType('project')
                  setSelectedProjectId(val)
                }
              }}
              data={[
                {
                  value: 'profile',
                  label: profile?.full_name
                    ? `${profile?.full_name} (perfil)`
                    : 'Meu perfil',
                },
                ...userProjects,
              ]}
              disabled={loadingProjects}
              w={220}
            /> */}
          </Stack>
        </Group>

        <Divider />

        {/* Corpo do post */}
        <Textarea
          autoFocus
          placeholder="O que você quer compartilhar?"
          minRows={4}
          autosize
          size="lg"
          maxRows={12}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          variant="transparent"
          styles={{ input: { padding: 0 } }}
        />

        {/* Gig vinculada */}
        <Box>
          <Text size="xs" c="dimmed" fw={500} mb={6}>
            <IconMicrophone2
              size={16}
              stroke={1.4}
              style={{ marginRight: 4, verticalAlign: 'middle' }}
            />
            Vincular gig
          </Text>
          <SearchCombobox
            searchFn={searchGigs}
            placeholder="Buscar gig por título..."
            onSelect={setLinkedGig}
            onClear={() => setLinkedGig(null)}
            selected={linkedGig}
            renderOption={(item) => (
              <Group gap="xs">
                <Text size="sm">{item.title}</Text>
                {item.has_remuneration && (
                  <Badge size="xs" color="green" variant="light">
                    Remunerada
                  </Badge>
                )}
              </Group>
            )}
            renderSelected={(item) => (
              <Group gap="xs">
                <Avatar size={24} radius="md" color="violet" variant="light">
                  <IconMicrophone2 size={12} />
                </Avatar>
                <Text size="sm" fw={500}>
                  {item.title}
                </Text>
                {item.has_remuneration && (
                  <Badge size="xs" color="green" variant="light">
                    Remunerada
                  </Badge>
                )}
              </Group>
            )}
          />
        </Box>

        {/* Produto vinculado */}
        <Box>
          <Text size="xs" c="dimmed" fw={500} mb={6}>
            <IconBox
              size={16}
              stroke={1.4}
              style={{ marginRight: 4, verticalAlign: 'middle' }}
            />
            Vincular equipamento
          </Text>
          <SearchCombobox
            searchFn={searchProducts}
            placeholder="Buscar equipamento por nome..."
            onSelect={setLinkedProduct}
            onClear={() => setLinkedProduct(null)}
            selected={linkedProduct}
            renderOption={(item) => (
              <Text size="sm">
                {item.brands?.name} {item.name}
              </Text>
            )}
            renderSelected={(item) => (
              <Text size="sm" fw={500}>
                {item.brands?.name} {item.name}
              </Text>
            )}
          />
        </Box>

        {/* Vídeo */}
        <Box>
          {videoMode === 'none' && !showVideoField && (
            <Group gap="xs">
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={<IconLink size={13} />}
                onClick={() => {
                  setShowVideoField(true)
                  setVideoMode('youtube')
                }}
              >
                Adicionar link de vídeo do YouTube
              </Button>

              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={
                  isUploadingVideo ? (
                    <Loader size={13} />
                  ) : profile?.plan === 'Pro' ? (
                    <IconVideo size={13} />
                  ) : (
                    <IconLock size={13} />
                  )
                }
                component="label"
                htmlFor="post-video-input"
                disabled={isUploadingVideo}
              >
                {isUploadingVideo
                  ? 'Enviando vídeo...'
                  : profile?.plan === 'Pro'
                    ? 'Upload de vídeo'
                    : 'Upload de vídeo (exclusivo Pro)'}
              </Button>
              <input
                ref={videoInputRef}
                id="post-video-input"
                type="file"
                accept="video/mp4"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleVideoFileChange(e.target.files[0])
                  }
                }}
              />
            </Group>
          )}

          {showVideoField && videoMode === 'youtube' && (
            <Group gap="xs" align="flex-end">
              <TextInput
                flex={1}
                size="xs"
                placeholder="https://youtube.com/..."
                leftSection={<IconLink size={13} />}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => {
                  setShowVideoField(false)
                  setVideoUrl('')
                  setVideoMode('none')
                }}
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          )}

          {videoMode === 'upload' && nativeVideoPreview && (
            <Box style={{ position: 'relative', display: 'inline-block' }}>
              <video
                src={nativeVideoPreview}
                muted
                playsInline
                controls
                style={{
                  display: 'block',
                  maxWidth: nativeVideoIsVertical ? 220 : 400,
                  borderRadius: 12,
                }}
              />
              <ActionIcon
                color="red"
                variant="filled"
                size="sm"
                radius="xl"
                style={{ position: 'absolute', top: 6, right: 6 }}
                onClick={handleRemoveNativeVideo}
              >
                <IconX size={12} />
              </ActionIcon>
            </Box>
          )}
        </Box>

        {/* Imagem */}
        <Box>
          {postImage ? (
            <Box style={{ position: 'relative', display: 'inline-block' }}>
              <Image
                src={`https://ik.imagekit.io/mublin/posts/tr:w-500/${postImage}`}
                radius="md"
                maw={400}
              />
              <ActionIcon
                color="red"
                variant="filled"
                size="sm"
                radius="xl"
                style={{ position: 'absolute', top: 6, right: 6 }}
                onClick={handleRemoveImage}
              >
                <IconX size={12} />
              </ActionIcon>
            </Box>
          ) : (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={
                isUploadingImage ? <Loader size={13} /> : <IconPhoto size={13} />
              }
              component="label"
              htmlFor="post-image-input"
              disabled={isUploadingImage}
            >
              {isUploadingImage ? 'Enviando...' : 'Adicionar imagem'}
            </Button>
          )}
          <input
            ref={imageInputRef}
            id="post-image-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleImageUpload(e.target.files[0])
              }
            }}
          />
        </Box>

        <Divider />

        {/* Publicar */}
        <Group justify="flex-end">
          <Text size="xs" c="dimmed">
            {body.length} caracteres
          </Text>
          <Button
            radius="xl"
            size="sm"
            fw={700}
            loading={submitting}
            onClick={handleSubmit}
            disabled={!body.trim() || isUploadingVideo}
          >
            Publicar
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
