import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { upload } from '@imagekit/react'
import {
  Container, Center, Flex, Stack, Group,
  Text, Avatar, ActionIcon,
  Button, Modal, Image, LoadingOverlay,
  useMantineColorScheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconCircuitResistor, IconUser, IconLock, IconEye, IconAdjustmentsHorizontal,
  IconCamera, IconHeartHandshake, IconPackages, IconCalendarMonth,
  IconChevronRight, IconLogout, IconBrightnessUp, IconMoon,
  IconEdit, IconUpload,
  IconMusic, IconCalendarEvent, IconHome
} from '@tabler/icons-react'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'

const AVATAR_BASE = 'https://ik.imagekit.io/mublin/tr:h-200,w-200,c-maintain_ratio/users/avatars/'
const iconStyle  = { width: 17, height: 17 }

export default function Menu() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  const [modalOpen,  setModalOpen]  = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [previewSrc, setPreviewSrc] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)

  const buttonColor = colorScheme === 'light' ? 'dark' : 'gray'
  const avatarSrc   = previewSrc
    ?? (profile?.avatar ? AVATAR_BASE + profile.avatar : undefined)

  // ── Upload ──────────────────────────────────────────────
  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setPreviewSrc(URL.createObjectURL(file))
  }

  async function handleUpload() {
    if (!avatarFile) return
    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
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

      await supabase
        .from('profiles')
        .update({ avatar: fileName })
        .eq('id', user.id)

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
    setColorScheme('light')
    await signOut()
    navigate('/', { replace: true })
  }

  // ── Menu items ──────────────────────────────────────────
  const menuItems = [
    { icon: IconHome, label: 'Home', to: '/home' },
    { icon: IconUser,                   label: 'Ir para meu perfil',            to: `/${profile?.username}` },
    { icon: IconCalendarEvent,          label: 'Gigs',                          to: '/gigs' },
    { icon: IconCalendarMonth,          label: 'Disponibilidade para gigs',     to: '/settings/availability' },
    { icon: IconMusic,                  label: 'Projetos musicais',             to: '/projects' },
    { icon: IconPackages,               label: 'Equipamentos',                  to: '/gearr' },
    { icon: IconHeartHandshake,         label: 'Parceiros e Endorsements',      to: '/settings/endorsements' },
    { icon: IconEdit,                   label: 'Editar meus dados',             to: '/settings' },
    { icon: IconAdjustmentsHorizontal,  label: 'Preferências musicais',         to: '/settings/preferences' },
    // { icon: IconStar,                   label: 'Minha assinatura',              to: '/settings/plan' },
    { icon: IconLock,                   label: 'Senha',                         to: '/settings/password' },
    { icon: IconEye,                    label: 'Privacidade da conta',          to: '/settings/privacy' },
  ]

  return (
    <>
      <Flex
        gap={8}
        align='flex-end'
        justify='center'
        component={Link}
        to="/home"
        style={{ cursor: 'pointer', textDecoration: 'none' }}
        mb={10}
      >
        <IconCircuitResistor size={22} stroke={2} color={colorScheme === 'light' ? 'black' : 'white'} />
        <Image src={colorScheme === 'light' ? MublinLogoBlack : MublinLogoWhite} w={96} />
      </Flex>
      <Container size="xs" mb={26} mt={20}>

        {/* ── Avatar + câmera ── */}
        <Center>
          <Avatar radius="lg" size={82} src={avatarSrc} alt="Foto de perfil" />
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

        {/* ── Saudação ── */}
        <Text ta="center" size="lg" mt={9}>
          Olá, <Text component="span" fw={500}>{profile?.full_name?.split(' ')[0]}</Text>!
        </Text>

        {/* ── Badge de plano ── */}
        {/* <Center>
          {profile?.plan === 'Pro' ? (
            <Badge
              color="violet"
              size="sm"
              variant="gradient"
              gradient={{ from: 'violet', to: 'blue' }}
            >
              conta pro
            </Badge>
          ) : (
            <Flex direction="column" align="center" mt={8} gap={8}>
              <Badge color="gray" size="sm">conta grátis</Badge>
              <Anchor component={Link} to="/settings/plan" underline="never">
                <Text size="sm" c="violet">Quero me tornar Mublin PRO</Text>
              </Anchor>
            </Flex>
          )}
        </Center> */}

        {/* ── Tema ── */}
        <Center mt={22} mb={16}>
          <Button
            size="sm"
            fw={500}
            variant="outline"
            radius="xl"
            color={colorScheme === 'dark' ? 'white' : 'dark'}
            leftSection={
              colorScheme === 'dark'
                ? <IconBrightnessUp size="1.5rem" stroke={1.5} />
                : <IconMoon size="1.5rem" stroke={1.5} />
            }
            onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
          >
            {colorScheme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
          </Button>
        </Center>

        {/* ── Menu items ── */}
        <Stack gap="0.2rem">
          {menuItems.map(({ icon: Icon, label, to }) => ( // eslint-disable-line
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
            variant="transparent"
            color="red"
            size="md"
            justify="space-between"
            leftSection={<IconLogout style={iconStyle} />}
            rightSection={<IconChevronRight />}
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
        onClose={() => { setModalOpen(false); setPreviewSrc(null); setAvatarFile(null) }}
        title="Alterar foto de perfil"
        size="xs"
        radius="md"
      >
        <Stack align="center" gap="md">
          <LoadingOverlay
            visible={uploading}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />
          <Image
            radius="md"
            src={
              previewSrc
              ?? (profile?.avatar
                ? AVATAR_BASE + profile.avatar
                : 'https://ik.imagekit.io/mublin/tr:h-140,w-140,r-max/sample-folder/avatar-undefined_Kblh5CBKPp.jpg')
            }
            w={140}
            h={140}
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
