import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import {
  useComputedColorScheme,
  Flex,
  Box,
  Button,
  Image,
  ActionIcon,
  Text,
  Drawer,
  Stack,
  Badge,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconArrowLeft,
  IconDotsVerticalFilled,
  IconMenu2Filled,
  IconXFilled,
} from '@tabler/icons-react'

export default function AppNavbarMobile({
  pageName = undefined,
  profile = undefined,
  featured = false,
}) {
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
        hiddenFrom="sm"
        pt={4}
        px={{ base: '0.8rem', sm: 0 }}
        pos="fixed"
        bg="var(--mantine-color-body)"
        w="100%"
        h={50}
      >
        {pageName ? (
          <Flex gap="sm" align="center" flex={1} style={{ minWidth: 0 }}>
            <IconArrowLeft
              size={22}
              style={{ flexShrink: 0, cursor: 'pointer' }}
              onClick={() => navigate(-1) || navigate('/home')}
            />

            <Text size="18px" lh={1} fw={600} truncate="end">
              {pageName}
            </Text>

            {featured && profile && (
              <Badge variant="light" color="teal" px={6} mt={2} style={{ flexShrink: 0 }}>
                Disponível para gigs!
              </Badge>
            )}
          </Flex>
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

        {/* Elemento da Direita (Menu/Ações) - mantém o flexShrink para não ser esmagado pelo texto */}
        <Box p={4} style={{ flexShrink: 0 }}>
          {pathname === '/menu' ? (
            <ActionIcon
              variant="transparent"
              aria-label="Menu"
              size="lg"
              p={0}
              onClick={() => navigate(-1) || navigate('/home')}
              c="var(--mantine-color-text)"
              mt={8}
            >
              <IconXFilled size={32} />
            </ActionIcon>
          ) : (
            <>
              {userProfile?.username === profile?.username || pathname === '/home' ? (
                <ActionIcon
                  variant="transparent"
                  aria-label="Menu"
                  size="lg"
                  p={0}
                  onClick={() => navigate('/menu')}
                  c="var(--mantine-color-text)"
                  pt={8}
                >
                  <IconMenu2Filled size={26} />
                </ActionIcon>
              ) : (
                profile && (
                  <ActionIcon
                    variant="transparent"
                    aria-label="Menu"
                    size="lg"
                    p={0}
                    onClick={open}
                  >
                    <IconDotsVerticalFilled size={22} />
                  </ActionIcon>
                )
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
