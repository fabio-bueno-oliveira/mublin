import { useState } from 'react'
import { Container, Affix, Modal, Text, em, Title } from '@mantine/core'
import { WeekView } from '@mantine/schedule'
import { useMediaQuery, useDisclosure } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import dayjs from 'dayjs'

const today = dayjs().format('YYYY-MM-DD')
const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')

const initialEvents = [
  {
    id: 1,
    title: 'Ensaio',
    description: 'Ensaio de música',
    start: `${today} 09:00:00`,
    end: `${today} 09:30:00`,
    color: 'blue',
  },
  {
    id: 2,
    title: 'Show particular',
    description: 'Show particular fechado',
    start: `${tomorrow} 11:15:00`,
    end: `${tomorrow} 12:00:00`,
    color: 'green',
  },
  {
    id: 3,
    title: 'Ensaio',
    start: `${today} 14:00:00`,
    end: `${today} 14:45:00`,
    color: 'violet',
  },
]

export default function CalendarPage() {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  const [events, setEvents] = useState(initialEvents)
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))

  const [eventDetails, setEventDetails] = useState(null)
  const [opened, { open, close }] = useDisclosure(false)

  const handleEventClick = (event) => {
    console.log('Evento clicado:', event)
    setEventDetails(event)
    open()
  }

  const handleEventClose = () => {
    setEventDetails(null)
    close()
  }

  return (
    <>
      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%">
          <AppNavbarMobile pageName="Calendário" />
        </Affix>
      )}
      <Container size="lg" mt={{ base: 60, sm: 16 }} pb={20}>
        <WeekView
          mb="xl"
          date={date}
          onDateChange={setDate}
          onEventClick={(event) => handleEventClick(event)}
          events={events}
          viewSelectProps={{ views: [] }}
          highlightToday
          startTime="07:00:00"
          endTime="23:50:00"
          intervalMinutes={15}
          withSubHourGridLines
          withCurrentTimeIndicator
          withHeader
          withWeekNumber={false}
          withAllDaySlots={false}
          withEventResize={false}
          // onEventResize={handleEventResize}
          labels={{
            time: 'Hora',
            event: 'Evento',
            allDay: 'Dia inteiro',
            more: 'Mais',
            today: 'Hoje',
          }}
        />
      </Container>
      <Modal
        opened={opened}
        onClose={handleEventClose}
        size="sm"
        title="Detalhes do evento"
        centered
      >
        <Title order={2} fz="lg" mt="xs">
          {eventDetails?.title}
        </Title>
        <Text>{eventDetails?.description}</Text>
      </Modal>
    </>
  )
}
