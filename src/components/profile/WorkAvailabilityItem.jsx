import { Group, Text, ThemeIcon } from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'

export default function WorkAvailabilityItem({ item }) {
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
    <Group gap="sm" wrap="nowrap" align="flex-start">
      <ThemeIcon
        size={20}
        radius="xl"
        variant="light"
        color="var(--mantine-color-text)"
        mt={1}
      >
        <IconCheck size={12} stroke={4} />
      </ThemeIcon>
      <div style={{ flex: 1 }}>
        <Text size="sm" fw={600} lh={1.2}>
          {work_types?.name_ptbr}
        </Text>
        <Text size="xs" c="dimmed" mt={2}>
          {hasRate
            ? `${formattedRate} ${rate_types?.name_ptbr?.toLowerCase() || '/ evento'}`
            : 'Valor a combinar'}
        </Text>
      </div>
      {/* {hasRate && (
        <Badge variant="light" size="xs" color="gray">
          {rate_currency || 'BRL'}
        </Badge>
      )} */}
    </Group>
  )
}
