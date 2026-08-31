import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Drawer, Button, Avatar, Stack, UnstyledButton, Text, Box } from '@mantine/core'
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
import { motion } from 'motion/react'
import './AppFooterMobile.css'

function ScenesAnimatedIcon({ isActive }) {
  if (isActive) {
    return <IconMovie stroke={1} />
  }

  return (
    <Box className="scenes-swipe-container">
      {/* Ícone 1: sai rápido por cima */}
      <motion.div
        className="scenes-swipe-icon"
        initial={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        animate={{
          y: [0, -28, -28],
          opacity: [1, 0, 0],
          filter: ['blur(0px)', 'blur(16px)', 'blur(16px)'],
        }}
        transition={{
          duration: 0.65,
          times: [0, 0.55, 1],
          ease: [0.7, 0, 0.84, 0],
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        <IconMovie stroke={1} />
      </motion.div>

      {/* Ícone 2: entra QUASE logo em seguida */}
      <motion.div
        className="scenes-swipe-icon"
        initial={{ y: 22, opacity: 0, filter: 'blur(5px)' }}
        animate={{
          y: [22, 22, 0],
          opacity: [0, 0, 1],
          filter: ['blur(5px)', 'blur(5px)', 'blur(0px)'],
        }}
        transition={{
          duration: 0.65,
          times: [0, 0.5, 0.75],
          ease: [0.16, 1, 1.3, 1],
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        <IconMovie stroke={1} />
      </motion.div>
    </Box>
  )
}

export default function AppFooterMobile() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (path) => pathname === path || pathname.startsWith(`${path}/`)
  const isScenesActive = isActive('/scenes')

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

          <UnstyledButton
            className={`${navItemClass(isScenesActive)} scenes-nav-item`}
            onClick={() => navigate('/scenes')}
            opacity={isScenesActive && !drawerOpen ? 1 : 0.65}
          >
            <ScenesAnimatedIcon isActive={isScenesActive} />
            <Text size="10px" lh={1.2}>
              Scenes
            </Text>
          </UnstyledButton>

          <UnstyledButton
            className={navItemClass(isActive('/feed') || isActive('/post'))}
            onClick={() => navigate('/feed')}
            opacity={(isActive('/feed') || isActive('/post')) && !drawerOpen ? 1 : 0.65}
          >
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
          <Button
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
          </Button>
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
