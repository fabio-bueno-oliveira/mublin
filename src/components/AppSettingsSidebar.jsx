import { useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Container, Tabs } from '@mantine/core'
import {
  IconUser,
  IconMusic,
  IconLock,
  IconHeartHandshake,
  IconRadar,
  IconBox,
  IconSchool,
  IconCamera,
  IconListCheckFilled,
} from '@tabler/icons-react'
import classes from '../pages/settings/settings.module.css'

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
    label: 'Preferências musicais',
    icon: IconMusic,
    path: '/settings/musical-preferences',
  },
  {
    value: 'education',
    label: 'Formação',
    icon: IconSchool,
    path: '/settings/education',
  },
  {
    value: 'portfolio',
    label: 'Portfolio',
    icon: IconListCheckFilled,
    path: '/settings/portfolio',
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

export default function SettingsSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const scrollerRef = useRef(null)
  const activeTab = getActiveTab(location.pathname)

  function handleTabChange(value) {
    const tab = SETTINGS_TABS.find((t) => t.value === value)
    if (tab) {
      navigate(tab.path)
    }
  }

  return (
    <Container size="lg" mt="xl">
      <Tabs
        value={activeTab}
        orientation="vertical"
        onChange={handleTabChange}
        variant="default"
        classNames={classes}
      >
        <Tabs.List
          grow
          ref={scrollerRef}
          style={{
            overflowX: 'auto',
            flexWrap: 'nowrap',
            display: 'flex',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
          }}
        >
          {SETTINGS_TABS.map(({ value, label, icon: Icon }) => (
            <Tabs.Tab
              key={value}
              value={value}
              data-value={value}
              leftSection={<Icon size={15} stroke={1.7} />}
            >
              {label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
    </Container>
  )
}
