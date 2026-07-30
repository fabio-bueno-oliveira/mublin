import { Stack, Group, Text } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'

export function WorkAvailabilityItem({ item }) {
  const { avg_rate, rate_currency, rate_types, work_types } = item

  const hasRate = avg_rate != null

  const formattedRate = hasRate
    ? new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: rate_currency ?? 'BRL',
        minimumFractionDigits: 0,
      }).format(avg_rate)
    : null

  return (
    <Stack gap={1}>
      <Text span size="15px" lh={1.2} fw={500}>
        <IconCheck size={9} stroke={4} /> {work_types?.name_ptbr ?? '—'}
      </Text>
      <Group justify="space-between" wrap="nowrap">
        {hasRate ? (
          <Group gap={6} wrap="nowrap">
            <Text size="xs" opacity={0.8}>
              Média de preço: {formattedRate}
              {rate_types?.name_ptbr && ` ${rate_types.name_ptbr.toLowerCase()}`}
            </Text>
          </Group>
        ) : (
          <Text size="xs" opacity={0.8}>
            Média de preço: a combinar
          </Text>
        )}
      </Group>
    </Stack>
  )
}
