import { useState } from 'react'
import { Title, Text, Box, Indicator } from '@mantine/core'
import { Calendar as MantineCalendar } from '@mantine/dates'
import dayjs from 'dayjs'

export default function Calendar() {
  const today = dayjs().startOf('day')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  const handleDayClick = (date) => {
    setSelectedDate(date)
    // fetchEventsByDate(date)
    // navigate(`/agenda?date=${date}`);
  }

  const gigDates = [
    { id: 123, date: '2026-06-29', title: 'Teste' },
    { id: 125, date: '2026-06-30', title: 'Teste 2' },
  ]

  return (
    <Box component="section" id="calendar">
      <Title order={3} fw={600} size="18px" mb="xs">
        Calendário
      </Title>
      <MantineCalendar
        fullWidth
        getDayProps={(date) => {
          const isToday = dayjs(date).isSame(today, 'date')
          const isSelected = selectedDate
            ? dayjs(date).isSame(selectedDate, 'date')
            : false

          return {
            selected: isSelected,
            onClick: () => handleDayClick(date),
            style:
              isToday && !isSelected
                ? {
                    border: '2px solid rgba(126, 126, 126, 0.5)',
                    borderRadius: 'var(--mantine-radius-sm)',
                    fontWeight: 700,
                    color: 'var(--mantine-color-text)',
                  }
                : undefined,
          }
        }}
        renderDay={(date) => {
          const hasGig = gigDates.some((gig) => dayjs(date).isSame(gig.date, 'date'))

          return (
            <Indicator size={6} color="red" offset={-2} disabled={!hasGig}>
              <span>{dayjs(date).date()}</span>
            </Indicator>
          )
        }}
      />
      <Text fw={600} size="md" mt="md" mb={4}>
        {selectedDate
          ? `Gigs em ${dayjs(selectedDate).format('DD/MM/YYYY')}`
          : 'Selecione uma data'}
        :
      </Text>
      <Text size="sm" c="dimmed">
        Nenhuma gig nesta data
      </Text>
    </Box>
  )
}
