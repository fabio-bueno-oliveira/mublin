import { Outlet } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import PublicNavbar from '../PublicNavbar';
import PublicFooter from '../PublicFooter';

export default function PublicLayout() {
  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 80 }}
    >
      <AppShell.Header>
        <PublicNavbar />
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer>
        <PublicFooter />
      </AppShell.Footer>
    </AppShell>
  )
}
