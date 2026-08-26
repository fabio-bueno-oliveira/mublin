import { Outlet, Navigate } from 'react-router-dom'
import { AppShell, Center, Loader } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../contexts/UIContext'
import AppNavbar from '../AppNavbar'
import AppFooterMobile from '../AppFooterMobile'

export default function FullScreenLayout() {
  const { session, loading } = useAuth()
  const { hideFooter } = useUI()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const isDesktop = !isMobile

  if (loading) {
    return (
      <Center h="100dvh" bg="black">
        <Loader color="white" />
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
      footer={isMobile && !hideFooter ? { height: 70 } : undefined}
      padding={0}
      styles={{
        main: {
          background: '#000',
          // remove o padding padrão do AppLayout
          padding: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
        },
        header: {
          background: '#000',
          border: 'none',
        },
        footer: {
          background: 'transparent',
          border: 'none',
        },
      }}
    >
      {isDesktop && (
        <AppShell.Header>
          <AppNavbar />
        </AppShell.Header>
      )}

      <AppShell.Main>
        {/* Sem Container, sem Center, sem max-width - deixa o Scenes ocupar 100% */}
        <Outlet />
      </AppShell.Main>

      {!hideFooter && <AppFooterMobile />}
    </AppShell>
  )
}
