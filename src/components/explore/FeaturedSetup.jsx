import { Link } from 'react-router-dom'
import { Group, Card, Box, Avatar, Image, Title, Text, Badge } from '@mantine/core'
import { IconChevronRight, IconRoute, IconSparklesFilled } from '@tabler/icons-react'

function getAvatarUrl(avatar, size = 80) {
  return avatar ? `${AVATAR_PATH}tr:h-${size},w-${size}/${avatar}` : null
}

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/users/avatars/'

export default function FeaturedSetup() {
  return (
    <Card
      radius="lg"
      p={0}
      withBorder={false}
      component={Link}
      to="/setup/4"
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        textDecoration: 'none',
        minHeight: 260,
        backgroundColor: 'black',
      }}
    >
      {/* Background photo */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(https://ik.imagekit.io/mublin/users/gear-setups/tr:w-1200,h-600,c-maintain_ratio/0d333085-c093-4dd3-99f7-a35e0096f8ef_setup_photo_5uAffGrln)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7)',
        }}
      />
      {/* Gradient overlay */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.15) 100%)',
        }}
      />

      <Box
        p={{ base: 'lg', sm: 'xl' }}
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          minHeight: 260,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Group gap={8} mb={10}>
          <Badge
            size="sm"
            radius="sm"
            color="mublinColor"
            variant="filled"
            leftSection={<IconSparklesFilled size={12} />}
          >
            Setup em destaque
          </Badge>
        </Group>

        <Title order={2} c="white" fw={800} fz={{ base: 22, sm: 28 }} lh={1.1} maw={420}>
          Mateus Asato Tokyo Aug 2026
        </Title>

        <Text
          c="white"
          size="sm"
          mt={6}
          maw={380}
          style={{ opacity: 0.85 }}
          lineClamp={2}
        >
          Mateus Asato pedalboard in Tokyo Aug 2026 — confira a cadeia completa de pedais
          e equipamentos
        </Text>

        <Group gap={8} mt={14}>
          <Avatar
            src="https://ik.imagekit.io/mublin/tr:h-80,c-maintain_ratio/users/avatars/0d333085-c093-4dd3-99f7-a35e0096f8ef_avatar_7Kj3VXzdX"
            size={26}
            radius="xl"
          />
          <Text size="sm" c="white" fw={500}>
            por Mublin
          </Text>
          <Text size="xs" c="white" style={{ opacity: 0.6 }}>
            @mublin
          </Text>
        </Group>

        <Group mt={18} gap={8}>
          <Box
            style={{
              backgroundColor: 'white',
              color: 'black',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Ver setup <IconChevronRight size={14} />
          </Box>
          <Group gap={4} c="white" style={{ opacity: 0.7 }}>
            <IconRoute size={14} />
            <Text size="xs" c="white">
              Setup público · colaboração aberta
            </Text>
          </Group>
        </Group>
      </Box>

      {/* Thumbnail thumb no canto (desktop) */}
      <Box
        visibleFrom="sm"
        style={{
          position: 'absolute',
          right: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1,
          borderRadius: 12,
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <Image
          src="https://ik.imagekit.io/mublin/users/gear-setups/tr:w-200,h-200/0d333085-c093-4dd3-99f7-a35e0096f8ef_setup_1dRtHFr41"
          w={110}
          h={110}
          fit="cover"
        />
      </Box>
    </Card>
  )
}
