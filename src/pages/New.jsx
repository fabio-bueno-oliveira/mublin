import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { Affix, Container, Text, Stack, Button } from '@mantine/core'
import { IconMicrophone2, IconMusic, IconPlaylist } from '@tabler/icons-react'

export default function CreateNew() {
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Criar novo item | Mublin</title>
        <link rel="canonical" href="https://mublin.com/new" />
        <meta name="description" content="Criar novo projeto, gig, setlist..." />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Criar" />
      </Affix>

      <Container size="xs" pt="xl" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <Text size="md" c="dimmed" mb="md">
          O que deseja criar hoje?
        </Text>
        <Stack gap="md">
          <Button leftSection={<IconMicrophone2 />} component={Link} to="/new/gig">
            Nova gig
          </Button>
          <Button leftSection={<IconMusic />} component={Link} to="/new/project">
            Novo projeto
          </Button>
          <Button leftSection={<IconPlaylist />} component={Link} to="/setlists">
            Novo setlist
          </Button>
        </Stack>
      </Container>
    </>
  )
}
