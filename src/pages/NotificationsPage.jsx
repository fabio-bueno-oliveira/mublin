import { useEffect } from 'react'
import { Container, Affix, em } from '@mantine/core'
import { useMediaQuery, useWindowScroll } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import Notifications from '../components/Notifications'

export default function GearItem() {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)
  const [, scrollTo] = useWindowScroll()

  useEffect(() => {
    scrollTo({ y: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%">
          <AppNavbarMobile pageName="Notificações" />
        </Affix>
      )}

      <Container size="lg" mt={{ base: 60, sm: 16 }} pb={20}>
        <Notifications />
      </Container>
    </>
  )
}
