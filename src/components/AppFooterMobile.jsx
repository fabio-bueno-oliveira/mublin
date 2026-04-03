import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  Drawer, Box, Flex, Button, Text, Avatar
} from '@mantine/core'
import {
  IconBulb, IconCubePlus, IconHome, IconSearch,
  IconHexagonPlusFilled, IconMusic, IconPencilPlus
} from '@tabler/icons-react'
import './AppFooterMobile.css'

export default function AppFooterMobile() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (path) => pathname === path
  const isActivePrefix = (prefix) => pathname.startsWith(prefix)

  const navItemClass = (active) =>
    ['nav-item', active ? 'active' : ''].filter(Boolean).join(' ')

  return (
    <>
      <footer className="footer-mobile mantine-hidden-from-sm">
        <div className="footer-inner">

          <div
            className={navItemClass(isActive('/home'))}
            onClick={() => navigate('/home')}
          >
            <IconHome />
          </div>

          <div
            className={navItemClass(isActive('/search'))}
            onClick={() => navigate('/search')}
          >
            <IconSearch />
          </div>

          <div
            className={['nav-item plus', drawerOpen ? 'active' : ''].filter(Boolean).join(' ')}
            onClick={() => setDrawerOpen(v => !v)}
          >
            <IconHexagonPlusFilled />
          </div>

          <div
            className={navItemClass(isActive('/projects') || isActivePrefix('/project'))}
            onClick={() => navigate('/projects')}
          >
            <IconMusic />
          </div>

          <div
            className={navItemClass(isActive('/menu'))}
            onClick={() => navigate('/menu')}
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
          </div>

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
        <Flex mb={40} mt={4} direction="column" gap={18}>
          <Box>
            <Button
              component={Link}
              to="/new/project"
              variant="filled"
              color="indigo"
              size="md"
              radius="md"
              leftSection={<IconBulb size={19} />}
              fullWidth
              onClick={() => setDrawerOpen(false)}
            >
              Novo projeto
            </Button>
            <Text ta="center" size="xs" c="dimmed" mt={5} px={10}>
              Ingresse em projetos de música novos ou em atividade
            </Text>
          </Box>

          <Box>
            <Button
              component={Link}
              to="/new/post"
              variant="filled"
              color="indigo"
              size="md"
              radius="md"
              leftSection={<IconPencilPlus size={19} />}
              fullWidth
              onClick={() => setDrawerOpen(false)}
            >
              Novo post
            </Button>
            <Text ta="center" size="xs" c="dimmed" mt={5} px={10}>
              Escreva uma nova postagem
            </Text>
          </Box>

          <Box>
            <Button
              component={Link}
              to="/new/gear"
              variant="filled"
              color="indigo"
              size="md"
              radius="md"
              leftSection={<IconCubePlus size={22} />}
              fullWidth
              onClick={() => setDrawerOpen(false)}
            >
              Novo equipamento
            </Button>
            <Text ta="center" size="xs" c="dimmed" mt={5} px={10}>
              Cadastre um novo item do seu equipamento
            </Text>
          </Box>
        </Flex>
      </Drawer>
    </>
  )
}
