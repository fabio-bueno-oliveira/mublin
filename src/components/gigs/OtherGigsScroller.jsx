import { ScrollArea, Stack, Group, Box, Avatar, Text, Badge, Title } from '@mantine/core'

/**
 * Dados fictícios — ainda não temos registros reais suficientes de gigs de
 * outros projetos pra alimentar isso com uma query de verdade. Os tipos de
 * gig usados aqui batem com os já cadastrados em event_types (Ensaio,
 * Apresentação, Workshop, Audição, Reunião, Gravação, Expo, Festival).
 *
 * Quando houver uma query real (ex: fetchNearbyGigs(cityId, fromIsoDate)),
 * é só substituir MOCK_GIGS pelo retorno dela — o shape de cada item já é o
 * que o componente espera (troque projectPicture pela foto real do projeto).
 */
const MOCK_GIGS = [
  {
    id: 'mock-1',
    projectName: 'Nina Costa Trio',
    projectPicture:
      'https://ik.imagekit.io/mublin/projects/fake/tr:h-128,w-128,c-maintain_ratio/nina-costa-trio.jpg',
    eventType: 'Ensaio',
    dateLabel: 'Hoje',
    isLive: true,
  },
  {
    id: 'mock-2',
    projectName: 'Banda Vértice',
    projectPicture:
      'https://ik.imagekit.io/mublin/projects/fake/tr:h-128,w-128,c-maintain_ratio/vertice.jpg',
    eventType: 'Apresentação',
    dateLabel: 'Hoje',
  },
  {
    id: 'mock-4',
    projectName: 'Coletivo Synapse',
    projectPicture:
      'https://ik.imagekit.io/mublin/projects/fake/tr:h-128,w-128,c-maintain_ratio/coletivo-synapse.jpg',
    eventType: 'Workshop',
    dateLabel: 'Amanhã',
  },
  {
    id: 'mock-5',
    projectName: 'Os Cabeças',
    projectPicture:
      'https://ik.imagekit.io/mublin/projects/fake/tr:h-128,w-128,c-maintain_ratio/os-cabecas.jpg',
    eventType: 'Apresentação',
    dateLabel: 'Sábado',
  },
  {
    id: 'mock-6',
    projectName: 'Camerata Horizonte',
    projectPicture:
      'https://ik.imagekit.io/mublin/projects/fake/tr:h-128,w-128,c-maintain_ratio/camerata-horizonte.jpg',
    eventType: 'Audição',
    dateLabel: 'Sábado',
  },
  {
    id: 'mock-7',
    projectName: 'Rituaali',
    projectPicture:
      'https://ik.imagekit.io/mublin/projects/fake/tr:h-128,w-128,c-maintain_ratio/rituaali.jpg',
    eventType: 'Festival',
    dateLabel: 'Domingo',
  },
]

export default function OtherGigsScroller({
  title = 'Rolando essa semana',
  gigs = MOCK_GIGS,
}) {
  if (!gigs?.length) {
    return null
  }

  return (
    <Box mt="md" mb="xs">
      <Title order={3} fw={500} fz="md" mb={10}>
        {title}
      </Title>

      <ScrollArea type="scroll" scrollbarSize={6} offsetScrollbars>
        <Group gap="xs" wrap="nowrap" pb={6}>
          {gigs.map((g) => (
            <Stack key={g.id} align="center" gap={4} w={84} style={{ flexShrink: 0 }}>
              <Box pos="relative">
                <Avatar
                  src={g.projectPicture}
                  name={g.projectName}
                  color="initials"
                  size={64}
                  radius="md"
                />
                {g.isLive && (
                  <Group
                    gap={4}
                    wrap="nowrap"
                    pos="absolute"
                    top={3}
                    right={3}
                    px={5}
                    py={3}
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 6 }}
                  >
                    <Box
                      component="span"
                      className="live-dot green small"
                      style={{ flexShrink: 0 }}
                    />
                    <Text
                      size="7px"
                      c="var(--mantine-color-text)"
                      ta="center"
                      tt="uppercase"
                      lh={1}
                    >
                      agora
                    </Text>
                  </Group>
                )}
              </Box>
              {g.dateLabel && (
                <Text
                  size="9px"
                  c="dimmed"
                  fw={300}
                  ta="center"
                  lineClamp={1}
                  lh={1}
                  mt={2}
                >
                  {g.dateLabel}
                </Text>
              )}
              <Text size="10px" fw={600} ta="center" lineClamp={1} lh={1.1}>
                {g.projectName}
              </Text>
              <Text size="10px" c="dimmed" ta="center" lineClamp={1}>
                {g.eventType}
              </Text>
            </Stack>
          ))}
        </Group>
      </ScrollArea>
    </Box>
  )
}
