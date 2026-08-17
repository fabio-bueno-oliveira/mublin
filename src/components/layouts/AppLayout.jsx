import { Outlet, Navigate } from 'react-router-dom'
import { AppShell, Flex, Center, Box, Container, Loader } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../contexts/UIContext'
import AppNavbar from '../AppNavbar'
import AppSidebar from '../AppSidebar'
import AppFooterMobile from '../AppFooterMobile'
// import Dashbar from '../Dashbar'

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

      <AppShell.Main pb={{ base: 'calc(80px + var(--mantine-spacing-md))', sm: '60px' }}>
        <Container size="lg" px={0}>
          <Flex gap="xs" align="flex-start">
            {isDesktop && (
              <Box
                w={240}
                style={{ flexShrink: 0, position: 'sticky', top: 'calc(60px)' }}
              >
                <AppSidebar />
              </Box>
            )}

            <Box mt={{ base: 0, md: 10 }} style={{ flex: 1, minWidth: 0 }}>
              {children ?? <Outlet />}
            </Box>
          </Flex>
        </Container>
      </AppShell.Main>

      {/* <Dashbar /> */}
      {!hideFooter && <AppFooterMobile />}
    </AppShell>
  )
}
