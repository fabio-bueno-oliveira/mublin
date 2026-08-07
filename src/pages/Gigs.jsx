import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { Container, Affix } from '@mantine/core'
import Maintenance from '../components/Maintenance'

export default function Gigs() {
  const navigate = useNavigate()
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
        <Maintenance onBack={() => navigate(-1) || navigate('/home')} />
      </Container>
    </>
  )
}
