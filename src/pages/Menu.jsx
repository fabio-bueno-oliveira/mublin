import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { upload } from '@imagekit/react'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  Container,
  Center,
  Stack,
  Group,
  Text,
  Avatar,
  ActionIcon,
  Button,
  Modal,
  Image,
  LoadingOverlay,
  useMantineColorScheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconUser,
  IconSettings,
  IconCamera,
  IconChevronRight,
  IconLogout,
  IconBrightnessUp,
  IconMoon,
  IconUpload,
  IconMusic,
  IconCalendar,
  IconBookmark,
} from '@tabler/icons-react'

const AVATAR_BASE =
  'https://ik.imagekit.io/mublin/tr:h-200,w-200,c-maintain_ratio/users/avatars/'
const iconStyle = { width: 17, height: 17 }

export default function Menu() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  const [modalOpen, setModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewSrc, setPreviewSrc] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)

  const buttonColor = colorScheme === 'light' ? 'dark' : 'gray'
  const avatarSrc =
    previewSrc ?? (profile?.avatar ? AVATAR_BASE + profile.avatar : undefined)

  // ── Upload ──────────────────────────────────────────────
  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    setAvatarFile(file)
    setPreviewSrc(URL.createObjectURL(file))
  }

  async function handleUpload() {
    if (!avatarFile) {
      return
    }
    setUploading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const authRes = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const { token: ikToken, expire, signature } = await authRes.json()

      const response = await upload({
        file: avatarFile,
        fileName: `${profile?.username || user.id}_.jpg`,
        folder: '/users/avatars/',
        tags: ['avatar', 'user'],
        useUniqueFileName: true,
        publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
        token: ikToken,
        expire,
        signature,
      })

      const fileName = response.filePath.split('/').pop()

      await supabase.from('profiles').update({ avatar: fileName }).eq('id', user.id)

      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Foto de perfil atualizada com sucesso!',
      })
      setModalOpen(false)
      setAvatarFile(null)
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao enviar a foto. Tente novamente.',
      })
    } finally {
      setUploading(false)
    }
  }

  // ── Logout ──────────────────────────────────────────────
  async function handleLogout() {
    // setColorScheme('light')
    await signOut()
    navigate('/', { replace: true })
  }

  // ── Menu items ──────────────────────────────────────────
  const menuItems = [
    // { icon: IconHome, label: 'Home', to: '/home' },
    { icon: IconUser, label: 'Ir para meu perfil', to: `/${profile?.username}` },
    { icon: IconMusic, label: 'Meus projetos de música', to: `/projects` },
    { icon: IconCalendar, label: 'Minhas gigs', to: `/gigs` },
    { icon: IconBookmark, label: 'Meus itens salvos', to: `/saved` },
    { icon: IconSettings, label: 'Configurações', to: `/settings` },
  ]

  return (
    <>
      <AppNavbarMobile />

      <Container size="xs" mt={74}>
        {/* ── Avatar + câmera ── */}
        <Center>
          <Avatar radius="xl" size={80} src={avatarSrc} alt="Foto de perfil" />
        </Center>
        <Center style={{ position: 'relative', marginTop: -24, marginLeft: 80 }}>
          <ActionIcon
            variant="filled"
            radius="xl"
            size="lg"
            color="gray"
            onClick={() => setModalOpen(true)}
          >
            <IconCamera style={{ width: '70%', height: '70%' }} stroke={1.5} />
          </ActionIcon>
        </Center>

        {/* ── Greetings ── */}
        <Text ta="center" size="xl" fw={600} mt="lg">
          {profile?.full_name}
        </Text>
        <Text ta="center" size="sm">
          <Text span c="dimmed">
            @{profile?.username}
          </Text>
          {profile?.plan === 'Pro' && (
            <Text span c="dimmed">
              {' '}
              · Plano Pro
            </Text>
          )}
        </Text>

        {/* ── Tema ── */}
        <Center my="md">
          <Button
            size="xs"
            fw={500}
            variant="filled"
            radius="xl"
            leftSection={
              colorScheme === 'dark' ? (
                <IconBrightnessUp size="1.2rem" stroke={1.5} />
              ) : (
                <IconMoon size="1.2rem" stroke={1.5} />
              )
            }
            onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
          >
            {colorScheme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          </Button>
        </Center>

        {/* ── Menu items ── */}
        <Stack gap={3} pt="xs">
          {menuItems.map(({ icon: Icon, label, to }) => (
            <Button
              key={to}
              component={Link}
              to={to}
              variant="transparent"
              color={buttonColor}
              size="md"
              justify="space-between"
              leftSection={<Icon style={iconStyle} />}
              rightSection={<IconChevronRight />}
              fw={550}
            >
              {label}
            </Button>
          ))}

          {/* Logout — separado pois é action, não rota */}
          <Button
            mt="sm"
            variant="light"
            color="var(--mantine-color-text)"
            size="md"
            justify="center"
            leftSection={<IconLogout style={iconStyle} />}
            // rightSection={<IconChevronRight />}
            fw={550}
            onClick={handleLogout}
          >
            Sair
          </Button>
        </Stack>
      </Container>

      {/* ── Modal troca de foto ── */}
      <Modal
        centered
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setPreviewSrc(null)
          setAvatarFile(null)
        }}
        title="Alterar foto de perfil"
        size="xs"
        radius="md"
      >
        <Stack align="center" gap="md" mt="lg">
          <LoadingOverlay
            visible={uploading}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />
          <Image
            radius="md"
            src={
              previewSrc ??
              (profile?.avatar
                ? AVATAR_BASE + profile.avatar
                : 'https://ik.imagekit.io/mublin/tr:h-100,w-100,r-max/sample-folder/avatar-undefined_Kblh5CBKPp.jpg')
            }
            w={100}
            h={100}
            fit="cover"
          />
          <Group gap="sm">
            <Button
              variant="default"
              radius="xl"
              leftSection={<IconUpload size={16} />}
              component="label"
              htmlFor="menu-avatar-input"
            >
              {previewSrc ? 'Trocar foto' : 'Selecionar foto'}
            </Button>
            <input
              id="menu-avatar-input"
              type="file"
              accept="image/png,image/jpeg"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            {avatarFile && (
              <Button
                color="indigo"
                radius="xl"
                loading={uploading}
                onClick={handleUpload}
              >
                Salvar
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
