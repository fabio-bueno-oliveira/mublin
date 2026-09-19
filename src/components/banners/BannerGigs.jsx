import { useNavigate } from 'react-router-dom'
import { Card, Group, Box, Badge, Text, ActionIcon } from '@mantine/core'
import { IconMusic, IconArrowRight } from '@tabler/icons-react'

export default function BannerGigs() {
  const navigate = useNavigate()

  return (
    <Card
      radius="md"
      p={22}
      onClick={() => navigate('/search')}
      style={{
        background: 'linear-gradient(96deg, #ff6a00 0%, #ee0979 100%)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Group gap={18} wrap="nowrap">
        <Box
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'white',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <IconMusic size={26} color="#ff6a00" />
        </Box>
        <Box style={{ flex: 1 }}>
          <Group gap={8}>
            <Text c="white" fw={800} fz={19}>
              Encontre gigs interessantes
            </Text>
            <Badge color="white" c="#ee0979" size="xs" radius="xl">
              Novo
            </Badge>
          </Group>
          <Text c="white" opacity={0.9} fz={13.5} fw={500}>
            Novas oportunidades toda semana • 127 vagas abertas
          </Text>
        </Box>
        <ActionIcon size={44} radius="xl" color="white" variant="filled">
          <IconArrowRight size={18} color="#ee0979" />
        </ActionIcon>
      </Group>

      {/* Decorative blurred circles */}
      <Box
        style={{
          position: 'absolute',
          right: -60,
          top: -80,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          filter: 'blur(1px)',
        }}
      />
    </Card>
  )
}
