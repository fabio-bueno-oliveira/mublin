import { Container, Affix, em } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import Calendar from '../components/calendar/Calendar'

export default function CalendarPage() {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  return (
    <>
      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%">
          <AppNavbarMobile pageName="Calendário" />
        </Affix>
      )}
      <Container size="lg" mt={{ base: 60, sm: 16 }} pb={20}>
        <Calendar />
      </Container>
    </>
  )
}
