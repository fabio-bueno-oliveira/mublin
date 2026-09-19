import { Card, Group, Text } from '@mantine/core'

export default function BannerMublinProMini2() {
  return (
    <Card radius="md" style={{ background: 'linear-gradient(96deg, #182cb0, #228be6)' }}>
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon
            radius="xl"
            size={36}
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <IconBolt size={16} color="white" />
          </ThemeIcon>
          <Text c="white" fw={550} size="sm" truncate>
            Desbloqueie recursos exclusivos
          </Text>
          <Badge radius="xl" color="white" c="mublinColor" size="sm">
            PRO
          </Badge>
        </Group>
        <ActionIcon radius="xl" size={32} color="white" c="mublinColor">
          <IconArrowRight size={16} />
        </ActionIcon>
      </Group>
    </Card>
  )
}
