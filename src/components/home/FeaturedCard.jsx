import { Card, Group, Stack, Text, Title } from '@mantine/core'
import { IconSparkles } from '@tabler/icons-react'

export default function FeaturedCard() {
  return (
    <Card
      radius="lg"
      p={{ base: 'md', sm: 'xl' }}
      mb="md"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, var(--mantine-color-mublinColor-7) 0%, var(--mantine-color-blue-8) 100%)',
      }}
    >
      <IconMusic
        size={180}
        stroke={1}
        style={{
          position: 'absolute',
          right: -30,
          bottom: -40,
          opacity: 0.12,
          color: 'white',
          pointerEvents: 'none',
        }}
      />

      <Stack gap={6} maw={520} style={{ position: 'relative', zIndex: 1 }}>
        <Group gap={6}>
          <IconSparkles size={16} color="white" style={{ opacity: 0.85 }} />
          <Text size="xs" fw={200} tt="uppercase" c="white" style={{ opacity: 0.85 }}>
            Bem-vindo ao Mublin
          </Text>
        </Group>

        <Title order={2} c="white" fw={700} fz={{ base: '20px', sm: '26px' }} lh={1.25}>
          Sua música, suas conexões, novas oportunidades
        </Title>

        <Text c="white" size="sm" style={{ opacity: 0.9 }}>
          Conecte-se com músicos e profissionais da música, mostre seu trabalho e fique
          por dentro de projetos, eventos e vagas.
        </Text>

        {/* <Group mt="sm">
          <Button
            component={Link}
            to="/search"
            size="xs"
            radius="md"
            variant="white"
            color="dark"
            leftSection={<IconZoom size={14} />}
          >
            Explorar oportunidades
          </Button>
        </Group> */}
      </Stack>
    </Card>
  )
}
