import { Outlet } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import PublicNavbar from '../PublicNavbar'
import PublicFooter from '../PublicFooter'

export default function PublicLayout({ children }) {
  return (
    <AppShell header={{ height: 60 }} footer={{ height: 60 }}>
      <AppShell.Header
        style={{
          background: 'rgba(var(--header-bg-rgb), 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <PublicNavbar />
      </AppShell.Header>

      <AppShell.Main>{children ?? <Outlet />}</AppShell.Main>

      <AppShell.Footer
        style={{
          border: 'none',
          backgroundColor: '#000000',
        }}
      >
        <PublicFooter />
      </AppShell.Footer>
    </AppShell>
  )
}
