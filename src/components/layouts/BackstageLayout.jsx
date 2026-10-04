import { Outlet, Navigate } from 'react-router-dom'
import {
  AppShell,
  Flex,
  ActionIcon,
  Burger,
  Drawer,
  Group,
  Title,
  Text,
  Center,
  Box,
  Container,
  Loader,
} from '@mantine/core'
import { useMediaQuery, useDisclosure } from '@mantine/hooks'
import { useAuth } from '../../hooks/useAuth'
import { useUI } from '../../contexts/UIContext'
import AppNavbar from '../AppNavbar'
import BackstageSidebar from '../backstage/BackstageSidebar'
import AppFooterMobile from '../AppFooterMobile'

export default function AppLayout({ children }) {
  const { session, loading } = useAuth()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const isDesktop = !isMobile
  const { hideFooter } = useUI()
  const [mobileMenuOpened, { open: openMobileMenu, close: closeMobileMenu }] =
    useDisclosure(false)

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

      {isMobile && (
        <>
          <Group
            hiddenFrom="md"
            h={56}
            px="md"
            justify="space-between"
            style={{
              borderBottom: '1px solid var(--mantine-color-default-border)',
            }}
          >
            <Title mt={4} fz="h5" tt="uppercase">
              <Text fz="h5" fw={300} span>
                Mublin
              </Text>{' '}
              Backstage
            </Title>

            <Burger
              opened={mobileMenuOpened}
              onClick={openMobileMenu}
              size="sm"
              aria-label="Abrir menu"
            />
          </Group>

          <Drawer
            opened={mobileMenuOpened}
            onClose={closeMobileMenu}
            size="85%"
            padding={0}
            hiddenFrom="md"
          >
            <BackstageSidebar onNavigate={closeMobileMenu} />
          </Drawer>
        </>
      )}

      <AppShell.Main pb={{ base: 'calc(130px + var(--mantine-spacing-md))', sm: '60px' }}>
        <Container size="lg" px={0}>
          <Flex gap="xs" align="flex-start">
            {isDesktop && (
              <Box
                w={260}
                style={{ flexShrink: 0, position: 'sticky', top: 'calc(60px)' }}
              >
                <BackstageSidebar />
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
