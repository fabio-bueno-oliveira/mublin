import { Link } from 'react-router-dom'
import { Card, Group, Box, Text, Button } from '@mantine/core'
import { IconRosetteDiscountCheck, IconArrowRight } from '@tabler/icons-react'

export default function MublinProBanner() {
  return (
    <Card
      component={Link}
      to="/pro"
      radius="md"
      p="md"
      style={{
        background: 'linear-gradient(96deg, #182cb0 0%, #228be6 100%)',
        position: 'relative',
        overflow: 'hidden',
        border: 'none',
      }}
    >
      {/* Detalhe decorativo estilo Nubank */}
      <Box
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'white',
          opacity: 0.08,
          top: -60,
          right: -30,
        }}
      />

      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="sm" style={{ zIndex: 1 }} wrap="nowrap">
          <Box
            bg="white"
            miw={36}
            h={36}
            style={{
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconRosetteDiscountCheck size={24} stroke={2} color="#182cb0" />
          </Box>
          <Box>
            <Group gap={6}>
              <Text c="white" fw={700} size="sm">
                <Text fw={200} span>
                  Seja
                </Text>{' '}
                Mublin PRO
              </Text>
            </Group>
            <Text c="white" size="xs" opacity={0.9} lineClamp={2}>
              Mais portfolio, mais oportunidades
            </Text>
          </Box>
        </Group>

        <Button
          size="xs"
          radius="md"
          color="white"
          c="#182cb0"
          rightSection={<IconArrowRight size={14} />}
          style={{ flexShrink: 0, zIndex: 1 }}
        >
          Conhecer
        </Button>
      </Group>
    </Card>
  )
}
