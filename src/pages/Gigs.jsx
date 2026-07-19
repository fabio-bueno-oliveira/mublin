import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { Container, Alert, Affix } from '@mantine/core'
import { IconExclamationCircle } from '@tabler/icons-react'

export default function Gigs() {
  useEffect(() => {
    scrollTo({ y: 0 })
  }, [])

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Gigs · Mublin</title>
        <link rel="canonical" href="https://mublin.com/gigs" />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Gigs" />
      </Affix>

      <Container size="sm" py="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 62, sm: 0 }}>
        <Alert
          mt="xl"
          variant="light"
          color="gray"
          title="Página em manutenção"
          icon={<IconExclamationCircle />}
        >
          Esta página está em manutenção, pedimos desculpas pelo inconveniente. Voltamos
          em breve!
        </Alert>
      </Container>
    </>
  )
}
