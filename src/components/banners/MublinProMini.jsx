import { Card, Group, Text } from '@mantine/core'

export default function MublinProBannerMini() {
  return (
    <Card
      radius="md"
      p="sm"
      style={{ background: 'linear-gradient(96deg, #182cb0, #4c6ef5)' }}
    >
      <Group justify="space-between">
        <Text c="white" size="sm" fw={500}>
          Sua carreira no próximo nível →
        </Text>
        <Text c="white" size="xs" opacity={0.7}>
          PRO
        </Text>
      </Group>
    </Card>
  )
}
