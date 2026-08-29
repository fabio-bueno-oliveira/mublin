import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Drawer, Button, Avatar, Stack, UnstyledButton, Text } from '@mantine/core'
import {
  IconBulb,
  IconCubePlus,
  IconHome,
  IconSearch,
  IconPlus,
  IconRss,
  IconPencilPlus,
  IconCalendar,
  IconMicrophone2,
  IconMusic,
  IconMovie,
} from '@tabler/icons-react'
import './AppFooterMobile.css'

export default function AppFooterMobile() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`)
  // const isActivePrefix = (prefix) => pathname.startsWith(prefix)

  const navItemClass = (active) =>
    ['nav-item', active ? 'active' : ''].filter(Boolean).join(' ')

  return (
    <>
      <footer className="footer-mobile mantine-hidden-from-sm">
        <div className="footer-inner">
          <UnstyledButton
            className={navItemClass(isActive('/home'))}
            onClick={() => navigate('/home')}
            opacity={isActive('/home') && !drawerOpen ? 1 : 0.65}
          >
            <IconHome />
            <Text size="10px" lh={1.2}>
              Home
            </Text>
          </UnstyledButton>

          {/* <UnstyledButton
            className={navItemClass(isActive('/scenes'))}
            onClick={() => navigate('/scenes')}
            opacity={isActive('/scenes') && !drawerOpen ? 1 : 0.65}
          >
            <IconMovie />
            <Text size="10px" lh={1.2}>
              Scenes
            </Text>
          </UnstyledButton> */}

          <UnstyledButton
            className={navItemClass(isActive('/feed') || isActive('/post'))}
            onClick={() => navigate('/feed')}
            opacity={(isActive('/feed') || isActive('/post')) && !drawerOpen ? 1 : 0.65}
          >
            {/* <Indicator color="red" size={8} top="3px" left={14} /> */}
            <IconRss />
            <Text size="10px" lh={1.2}>
              Feed
            </Text>
          </UnstyledButton>

          <UnstyledButton
            className={navItemClass(isActive('/search'))}
            onClick={() => navigate('/search')}
            opacity={isActive('/search') && !drawerOpen ? 1 : 0.65}
          >
            <IconSearch />
            <Text size="10px" lh={1.2}>
              Buscar
            </Text>
          </UnstyledButton>

          <UnstyledButton
            className={['nav-item plus', drawerOpen ? 'active' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => setDrawerOpen((v) => !v)}
            opacity={drawerOpen ? 1 : 0.65}
          >
            <IconPlus />
            <Text size="10px" lh={1.2}>
              Criar
            </Text>
          </UnstyledButton>

          <UnstyledButton
            className={navItemClass(isActive('/gigs'))}
            onClick={() => navigate('/gigs')}
            opacity={isActive('/gigs') && !drawerOpen ? 1 : 0.65}
          >
            <IconMusic />
            <Text size="10px" lh={1.2}>
              Gigs
            </Text>
          </UnstyledButton>

          {/* <UnstyledButton
            className={navItemClass(
              isActive('/projects') || isActivePrefix('/project'),
            )}
            onClick={() => navigate('/projects')}
          >
            <IconMusic />
          </UnstyledButton> */}

          <UnstyledButton
            className={navItemClass(isActive('/menu'))}
            onClick={() => navigate(`/${profile?.username}`)}
          >
            <Avatar
              w={35}
              h={35}
              src={
                profile?.avatar
                  ? `https://ik.imagekit.io/mublin/tr:h-76,w-76,r-max,c-maintain_ratio/users/avatars/${profile.avatar}`
                  : undefined
              }
              alt={profile?.username}
            />
          </UnstyledButton>
        </div>
      </footer>

      <Drawer
        offset={8}
        radius="md"
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="O que deseja criar?"
        position="bottom"
      >
        <Stack mb={20} mt={18} direction="column" gap={18}>
          <Button
            component={Link}
            to="/new/post"
            variant="transparent"
            size="md"
            radius="md"
            leftSection={<IconPencilPlus size={19} />}
            fullWidth
            onClick={() => setDrawerOpen(false)}
          >
            Novo post
          </Button>

          {/* <Button
            component={Link}
            to="/new/scene"
            variant="transparent"
            size="md"
            radius="md"
            leftSection={<IconMovie size={19} />}
            fullWidth
            onClick={() => setDrawerOpen(false)}
          >
            Nova Scene
          </Button> */}

          <Button
            component={Link}
            to="/new/gig"
            variant="transparent"
            size="md"
            radius="md"
            leftSection={<IconMicrophone2 size={19} />}
            fullWidth
            onClick={() => setDrawerOpen(false)}
          >
            Nova gig
          </Button>

          <Button
            component={Link}
            to="/new/project"
            variant="transparent"
            size="md"
            radius="md"
            leftSection={<IconBulb size={19} />}
            fullWidth
            onClick={() => setDrawerOpen(false)}
          >
            Novo projeto
          </Button>

          <Button
            component={Link}
            to="/new/event"
            variant="transparent"
            size="md"
            radius="md"
            leftSection={<IconCalendar size={19} />}
            fullWidth
            onClick={() => setDrawerOpen(false)}
          >
            Novo evento
          </Button>

          <Button
            component={Link}
            to="/new/gear"
            variant="transparent"
            size="md"
            radius="md"
            leftSection={<IconCubePlus size={22} />}
            fullWidth
            onClick={() => setDrawerOpen(false)}
          >
            Novo equipamento
          </Button>
        </Stack>
      </Drawer>
    </>
  )
}
