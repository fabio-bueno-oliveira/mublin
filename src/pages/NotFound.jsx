import {
  useMantineColorScheme,
  Title,
  Text,
  Image,
  Center,
  Stack,
  Button,
  Group,
} from '@mantine/core'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { IconHome, IconSearch } from '@tabler/icons-react'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'

export default function NotFound() {
  const { colorScheme } = useMantineColorScheme()

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Não encontrado · Mublin</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Página não encontrada no Mublin" />
      </Helmet>
      <Center mih="100vh" px="md" style={{ flexDirection: 'column' }}>
        <Group pos="absolute" top={20} left={20}>
          <Link to="/">
            <Image
              src={colorScheme === 'light' ? MublinLogoBlack : MublinLogoWhite}
              h={28}
              w="auto"
              fit="contain"
            />
          </Link>
        </Group>

        <Stack align="center" gap="lg" maw={460} w="100%" mt={60}>
          <Image
            src="https://ik.imagekit.io/mublin/misc/sad_musician_stage.webp"
            maw={320}
            mah={320}
            radius="md"
            fallbackSrc="https://placehold.co/320x320?text=404"
          />

          <Stack gap={4} align="center">
            <Title order={1} size="h2">
              Ops, essa página não existe
            </Title>

            <Text size="sm" c="dimmed" ta="center" maw={360}>
              Parece que esse link quebrou uma corda. A página que você procura não foi
              encontrada, foi movida ou nunca existiu no palco do Mublin.
            </Text>
          </Stack>

          <Group mt="sm">
            <Button component={Link} to="/home" leftSection={<IconHome size={16} />}>
              Voltar pro início
            </Button>
            <Button
              variant="light"
              component={Link}
              to="/search"
              leftSection={<IconSearch size={16} />}
            >
              Buscar artistas
            </Button>
          </Group>

          <Text size="xs" c="dimmed" mt="xl" opacity={0.6}>
            Erro 404 • Mublin
          </Text>
        </Stack>
      </Center>
    </>
  )
}
