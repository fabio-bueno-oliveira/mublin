import { Outlet, Navigate } from 'react-router-dom'
import { AppShell, Burger, Center, Loader } from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { useAuth } from '../../hooks/useAuth'
import AppNavbar from '../AppNavbar'
import AppSidebar from '../AppSidebar'
import AppFooterMobile from '../AppFooterMobile'

export default function AppLayout({ children }) {
  const [opened, { toggle }] = useDisclosure()
  const { session, loading } = useAuth()
  const isMobile = useMediaQuery('(max-width: 48em)')

  if (loading) return (
    <Center h="100vh">
      <Loader color="indigo" />
    </Center>
  )

  if (!session) return <Navigate to="/" replace />

  return (
    <AppShell
      header={isMobile ? undefined : { height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding={isMobile ? 0 : "md"}
      style={{ '--app-shell-footer-height': '70px' }}
    >
      {!isMobile && (
        <AppShell.Header>
          <AppNavbar>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
          </AppNavbar>
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

      <AppFooterMobile />
    </AppShell>
  )
}
