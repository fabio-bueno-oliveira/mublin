export const getDateSuggestions = () => {
  const today = new Date()

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const addDays = (days) => {
    const date = new Date(today)
    date.setDate(date.getDate() + days)
    return date
  }

  const getNextWeekday = (weekday) => {
    const date = new Date(today)
    const currentDay = date.getDay()
    let diff = (weekday - currentDay + 7) % 7

    // Se hoje for o próprio dia, queremos o próximo.
    if (diff === 0) {
      diff = 7
    }

    date.setDate(date.getDate() + diff)
    return date
  }

  return [
    {
      label: 'Hoje',
      value: formatDate(today),
      time_start: null,
      time_end: null,
    },
    {
      label: 'Amanhã',
      value: formatDate(addDays(1)),
      time_start: '15:00',
      time_end: '17:00',
    },
    {
      label: 'Neste sábado',
      value: formatDate(getNextWeekday(6)),
      time_start: '15:00',
      time_end: '17:00',
    },
    {
      label: 'Neste domingo',
      value: formatDate(getNextWeekday(0)),
      time_start: '15:00',
      time_end: '17:00',
    },
  ]
}
