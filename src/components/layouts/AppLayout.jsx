import { Outlet, Navigate } from 'react-router-dom'
import { AppShell, Burger, Center, Loader } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useAuth } from '../../contexts/AuthContext'
import AppNavbar from '../AppNavbar'
import AppSidebar from '../AppSidebar'

export default function AppLayout({ children }) {
  const [opened, { toggle }] = useDisclosure()
  const { session, loading } = useAuth()

  if (loading) return (
    <Center h="100vh">
      <Loader color="amber" />
    </Center>
  )

  if (!session) return <Navigate to="/" replace />

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
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
      <AppShell.Navbar>
        <AppSidebar />
      </AppShell.Navbar>
      <AppShell.Main>
        {children ?? <Outlet />}
      </AppShell.Main>
    </AppShell>
  )
}
