import { useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Container, Tabs, Title, Text, Group,
} from '@mantine/core'
import {
  IconUser,
  IconMusic,
  IconLock,
  IconHeartHandshake,
  IconRadar,
  IconBox,
  IconCamera,
} from '@tabler/icons-react'
import classes from './settings.module.css'

const SETTINGS_TABS = [
  {
    value: 'profile',
    label: 'Meus dados',
    icon: IconUser,
    path: '/settings/profile',
  },
  {
    value: 'picture',
    label: 'Foto',
    icon: IconCamera,
    path: '/settings/picture',
  },
  {
    value: 'password',
    label: 'Senha',
    icon: IconLock,
    path: '/settings/password',
  },
  {
    value: 'musical-preferences',
    label: 'Preferências',
    icon: IconMusic,
    path: '/settings/musical-preferences',
  },
  {
    value: 'partners',
    label: 'Parceiros',
    icon: IconHeartHandshake,
    path: '/settings/endorsements',
  },
  {
    value: 'gear',
    label: 'Equipamentos',
    icon: IconBox,
    path: '/settings/gear',
  },
  {
    value: 'availability',
    label: 'Disponibilidade',
    icon: IconRadar,
    path: '/settings/availability',
  },
]

// Deriva o tab ativo a partir do pathname atual
function getActiveTab(pathname) {
  const match = SETTINGS_TABS.find((tab) => pathname.startsWith(tab.path))
  return match ? match.value : 'profile'
}

export default function SettingsLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const scrollerRef = useRef(null)

  const activeTab = getActiveTab(location.pathname)

  useEffect(() => {
    if (location.pathname === '/settings' || location.pathname === '/settings/') {
      navigate('/settings/profile', { replace: true })
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    const activeTabEl = scrollerRef.current?.querySelector(`button[data-value="${activeTab}"]`);

    if (activeTabEl) {
      activeTabEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',   // Não move a página verticalmente
        inline: 'center'    // Centraliza a aba horizontalmente no scroll
      });
    }
  }, [activeTab]);

  function handleTabChange(value) {
    const tab = SETTINGS_TABS.find((t) => t.value === value)
    if (tab) navigate(tab.path)
  }

  return (
    <Box>
      {/* Cabeçalho da seção */}
      <Box py="md">
        <Container size="lg">
          <Group gap="xs" align="baseline">
            <Title order={2} fw={700} size="h3">
              Configurações
            </Title>
            <Text size="sm" c="dimmed">
              Gerencie sua conta e preferências
            </Text>
          </Group>
        </Container>
      </Box>

      {/* Tabs de navegação */}
      <Box
        pos="sticky"
        top={{ base: 0, sm: 60 }}
        style={{
          // top: { base: 0, sm: 30 },
          zIndex: 100,
          backgroundColor: 'var(--mantine-color-body)',
        }}
      >
        <Container size="lg">
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="default"
            classNames={classes}
          >
            <Tabs.List 
              ref={scrollerRef} 
              style={{ 
                overflowX: 'auto', 
                flexWrap: 'nowrap', 
                display: 'flex',
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none', // IE/Edge
              }}
            >
              {SETTINGS_TABS.map(({ value, label, icon: Icon }) => ( // eslint-disable-line
                <Tabs.Tab
                  key={value}
                  value={value}
                  data-value={value} // Garantimos que o atributo exista para o querySelector
                  leftSection={<Icon size={15} stroke={1.7} />}
                >
                  {label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </Container>
      </Box>

      {/* Conteúdo da página filha */}
      <Container size="lg" py="xl">
        <Outlet />
      </Container>
    </Box>
  )
}
