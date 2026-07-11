import { Outlet, Navigate } from 'react-router-dom'
import { AppShell, Flex, Center, Box, Container, Loader, Text } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../contexts/UIContext'
import AppNavbar from '../AppNavbar'
import SettingsSidebar from '../AppSettingsSidebar'
import AppFooterMobile from '../AppFooterMobile'

export default function AppLayout({ children }) {
  const { session, loading } = useAuth()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const isDesktop = !isMobile
  const { hideFooter } = useUI()

  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  return (
    <AppShell
      withBorder={false}
      header={isDesktop ? { height: 60 } : undefined}
      padding={0}
      style={{ '--app-shell-footer-height': '70px' }}
    >
      {isDesktop && (
        <AppShell.Header>
          <AppNavbar />
        </AppShell.Header>
      )}

      <AppShell.Main pb={{ base: 'calc(70px + var(--mantine-spacing-md))', sm: 'md' }}>
        <Container size="lg" px={0}>
          <Flex gap="md" align="flex-start">
            {isDesktop && (
              <Box
                w={260}
                style={{ flexShrink: 0, position: 'sticky', top: 'calc(60px)' }}
              >
                <SettingsSidebar />
              </Box>
            )}

            <Box mt={{ base: 0, md: 10 }} style={{ flex: 1, minWidth: 0 }}>
              {children ?? <Outlet />}
            </Box>
          </Flex>
        </Container>
      </AppShell.Main>

      {!hideFooter && <AppFooterMobile />}
    </AppShell>
  )
}
