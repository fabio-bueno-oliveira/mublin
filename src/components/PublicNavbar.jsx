import { Link } from 'react-router-dom'
import { 
  Group, Button, Container, 
  Box, Burger, Image,
  useMantineColorScheme 
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconCircuitResistor } from '@tabler/icons-react'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'

export default function PublicNavbar() {
  const [opened, { toggle, close }] = useDisclosure(false)
  const { colorScheme } = useMantineColorScheme()

  return (
    <Box h='100%'>
      <Container size="lg" h="100%">
        <Group justify="space-between" align="center" h="100%">
          {/* Logo */}
          <Link
            to="/"
            style={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            <Image src={colorScheme === 'light' ? MublinLogoBlack : MublinLogoWhite} h={22} />
          </Link>

          {/* CTAs — desktop */}
          <Group gap="sm" visibleFrom="sm">
            <Button
              component={Link}
              to="/login"
              variant="subtle"
              color="gray"
              radius="xl"
              size="sm"
            >
              Entrar
            </Button>
            <Button
              component={Link}
              to="/signup"
              radius="xl"
              size="sm"
              color="indigo"
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
          p={12}
        >
          {/* <Group justify="space-between" align="center" mb="md">
            <Text
              size="sm" fw={500} c="dimmed"
              component={Link}
              to="/#features"
              style={{ textDecoration: 'none' }}
              onClick={close}
            >
              Funcionalidades
            </Text>
            <Text
              size="sm" fw={500} c="dimmed"
              component={Link}
              to="/#about"
              style={{ textDecoration: 'none' }}
              onClick={close}
            >
              Sobre
            </Text>
          </Group> */}
          <Group grow>
            <Button
              component={Link}
              to="/login"
              variant="default"
              radius="xl"
              size="compact-sm"
              onClick={close}
            >
              Entrar
            </Button>
            <Button
              component={Link}
              to="/signup"
              color="indigo"
              radius="xl"
              size="compact-sm"
              onClick={close}
            >
              Criar conta
            </Button>
          </Group>
        </Box>
      )}
    </Box>
  )
}