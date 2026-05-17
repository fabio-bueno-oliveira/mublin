import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import {
  useComputedColorScheme,
  Flex,
  Group,
  Box,
  Button,
  Image,
  ActionIcon,
  Title,
  Text,
  Drawer,
  Stack,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconArrowLeft,
  IconDotsVerticalFilled,
  IconMenu2Filled,
  IconXFilled,
} from '@tabler/icons-react'

export default function AppNavbarMobile({ profile = undefined }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { profile: userProfile } = useAuth()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

  const [opened, { open, close }] = useDisclosure(false)

  return (
    <>
      <Flex
        gap="xs"
        align="center"
        justify="space-between"
        mt={6}
        mb={2}
        hiddenFrom="sm"
        px={{ base: '0.8rem', sm: 0 }}
      >
        {profile ? (
          <Group gap="md">
            <IconArrowLeft size={22} />
            <Title order={1} fz="h4" fw={600}>
              {profile.username}
            </Title>
          </Group>
        ) : (
          <Box
            component={Link}
            to="/home"
            style={{
              cursor: 'pointer',
              textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Image
              src={isDark ? MublinLogoWhite : MublinLogoBlack}
              h={24}
              w="auto"
              fit="contain"
            />
          </Box>
        )}
        <Box p={4}>
          {pathname === '/menu' ? (
            <ActionIcon
              variant="transparent"
              aria-label="Menu"
              size="lg"
              p={0}
              onClick={() => navigate(-1) || navigate('/home')}
            >
              <IconXFilled size={32} />
            </ActionIcon>
          ) : (
            <>
              {userProfile?.username === profile?.username ? (
                <ActionIcon
                  variant="transparent"
                  aria-label="Menu"
                  size="lg"
                  p={0}
                  onClick={() => navigate('/menu')}
                >
                  <IconMenu2Filled size={22} />
                </ActionIcon>
              ) : (
                <ActionIcon
                  variant="transparent"
                  aria-label="Menu"
                  size="lg"
                  p={0}
                  onClick={open}
                >
                  <IconDotsVerticalFilled size={22} />
                </ActionIcon>
              )}
            </>
          )}
        </Box>
      </Flex>
      {profile && (
        <Drawer
          opened={opened}
          onClose={close}
          title={profile?.username}
          position="bottom"
        >
          <Stack gap={4} mt="sm">
            <Button size="sm" radius="xs" variant="transparent" p={0}>
              Seguir
            </Button>
            <Button size="sm" radius="xs" variant="transparent" p={0}>
              Bloquear
            </Button>
            <Button
              size="sm"
              radius="xs"
              variant="transparent"
              p={0}
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/${profile?.username}`,
                )
                notifications.show({
                  title: 'Pronto!',
                  message: 'URL copiada!',
                  color: 'green',
                  position: 'top-center',
                })
              }}
            >
              Copiar URL deste perfil
            </Button>
          </Stack>
        </Drawer>
      )}
    </>
  )
}
