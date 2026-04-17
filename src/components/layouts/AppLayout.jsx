import { Outlet, Navigate } from 'react-router-dom'
import { AppShell, Center, Loader } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../contexts/UIContext'
import AppNavbar from '../AppNavbar'
import AppSidebar from '../AppSidebar'
import AppFooterMobile from '../AppFooterMobile'

export default function AppLayout({ children }) {
  const { session, loading } = useAuth()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const { hideFooter } = useUI()

  if (loading) return (
    <Center h="100vh">
      <Loader color="indigo" />
    </Center>
  )

  if (!session) return <Navigate to="/" replace />

  return (
    <AppShell
      withBorder={false}
      header={isMobile ? undefined : { height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: true },
      }}
      padding={0}
      style={{ '--app-shell-footer-height': '70px' }}
    >
      {!isMobile && (
        <AppShell.Header>
          <AppNavbar />
        </AppShell.Header>
      )}

      <AppShell.Navbar>
        <AppSidebar />
      </AppShell.Navbar>

      <AppShell.Main
        pb={{ base: 'calc(70px + var(--mantine-spacing-md))', sm: 'md' }}
      >
        {children ?? <Outlet />}
      </AppShell.Main>

      {!hideFooter && <AppFooterMobile />}
    </AppShell>
  )
}
