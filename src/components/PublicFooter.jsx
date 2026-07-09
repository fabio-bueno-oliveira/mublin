import { useNavigate } from 'react-router-dom'
import { Group, Container, Text, Box, Anchor } from '@mantine/core'

const LINKS = ['Sobre', 'Privacidade', 'Contato']

export default function PublicFooter() {
  const navigate = useNavigate()

  return (
    <Box py="lg">
      <Container size="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Text
            size="sm"
            fw={700}
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            Mublin
          </Text>
          <Group gap="lg">
            {LINKS.map((l) => (
              <Anchor key={l} size="sm" c="dimmed" underline="never">
                {l}
              </Anchor>
            ))}
          </Group>
          <Text size="xs" c="dimmed" visibleFrom="sm">
            © {new Date().getFullYear()} Mublin
          </Text>
        </Group>
      </Container>
    </Box>
  )
}
