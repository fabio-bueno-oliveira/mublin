import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import {
  useComputedColorScheme,
  Flex,
  Box,
  Image,
  ActionIcon,
  Text,
  Badge,
  Indicator,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconBell,
  IconMenu2Filled,
  IconXFilled,
} from '@tabler/icons-react'

export default function AppNavbarMobile({
  pageName = undefined,
  profile = undefined,
  featured = false,
  fixed = true,
}) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, profile: userProfile } = useAuth()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('read', false)
      return count ?? 0
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // polling a cada 1 min
    refetchOnWindowFocus: true,
  })

  const showNotificationsIcon =
    userProfile?.username === profile?.username || pathname === '/home'
  const showMenuIcon = userProfile?.username === profile?.username || pathname === '/home'

  return (
    <>
      <Flex
        gap="xs"
        align="center"
        justify="space-between"
        hiddenFrom="sm"
        pt={4}
        px={{ base: '0.8rem', sm: 0 }}
        pos={fixed ? 'fixed' : 'relative'}
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
            <Flex gap="xs">
              {showNotificationsIcon && (
                <ActionIcon
                  variant="transparent"
                  aria-label="Notificações"
                  size="xl"
                  radius={false}
                  pt={5}
                  onClick={() => navigate('/notifications')}
                  c="var(--mantine-color-text)"
                >
                  <Indicator
                    inline
                    label={
                      <Text fw={500} fz="9px">
                        {unreadCount}
                      </Text>
                    }
                    maxValue={99}
                    size={16}
                    disabled={unreadCount === 0}
                    color="red.8"
                    offset={4}
                  >
                    <IconBell size={24} />
                  </Indicator>
                </ActionIcon>
              )}
              {showMenuIcon && (
                <ActionIcon
                  variant="transparent"
                  aria-label="Menu"
                  size="lg"
                  pt={12}
                  onClick={() => navigate('/menu')}
                  c="var(--mantine-color-text)"
                >
                  <IconMenu2Filled size={28} />
                </ActionIcon>
              )}
            </Flex>
          )}
        </Box>
      </Flex>
    </>
  )
}
