import { useNavigate } from 'react-router-dom'
import { 
  Group, Flex, Button, Container, 
  Text, Box, Burger, ActionIcon, Image,
  useComputedColorScheme, useMantineColorScheme 
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconMicrofrontends, IconMoon, IconSun } from '@tabler/icons-react'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'

export default function PublicNavbar() {
  const navigate = useNavigate()
  const [opened, { toggle }] = useDisclosure(false)

  const { setColorScheme, colorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

  const toggleColorScheme = () => setColorScheme(isDark ? 'light' : 'dark')

  return (
    <Box h='100%'>
      <Container size="lg" h="100%">
        <Group justify="space-between" align="center" h="100%">

          {/* Logo */}
          <Flex
            gap={8}
            align='center'
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <IconMicrofrontends size={30} stroke={2} />
            <Image src={colorScheme === 'light' ? MublinLogoBlack : MublinLogoWhite} h={22} />
          </Flex>

          {/* Links — desktop */}
          {/* <Group gap="lg" visibleFrom="sm">
            <Text
              size="sm"
              fw={500}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/#features')}
            >
              Funcionalidades
            </Text>
            <Text
              size="sm"
              fw={500}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/#about')}
            >
              Sobre
            </Text>
          </Group> */}

          {/* CTAs — desktop */}
          <Group gap="sm" visibleFrom="sm">
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="xl"
              size="lg"
              onClick={toggleColorScheme}
              aria-label="Alternar tema"
            >
              {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>
            <Button
              variant="subtle"
              color="gray"
              radius="xl"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Entrar
            </Button>
            <Button
              radius="xl"
              size="sm"
              color="amber"
              onClick={() => navigate('/signup')}
            >
              Criar conta
            </Button>
          </Group>

          {/* Burger — mobile */}
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
          />

        </Group>
      </Container>

      {/* Menu mobile */}
      {opened && (
        <Box
          hiddenFrom="sm"
          style={{
            borderTop: '1px solid #f0f0f0',
            background: '#fff',
            padding: '16px 24px',
          }}
        >
          <Group justify="space-between" align="center" mb="md">
            <Text size="sm" fw={500} c="dimmed" style={{ cursor: 'pointer' }}
              onClick={() => { navigate('/#features'); toggle() }}>
              Funcionalidades
            </Text>
            <Text size="sm" fw={500} c="dimmed" style={{ cursor: 'pointer' }}
              onClick={() => { navigate('/#about'); toggle() }}>
              Sobre
            </Text>
          </Group>
          <Group grow>
            <Button variant="default" radius="xl" size="sm"
              onClick={() => { navigate('/login'); toggle() }}>
              Entrar
            </Button>
            <Button color="amber" radius="xl" size="sm"
              onClick={() => { navigate('/signup'); toggle() }}>
              Criar conta
            </Button>
          </Group>
        </Box>
      )}
    </Box>
  )
}