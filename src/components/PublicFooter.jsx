import { useNavigate } from 'react-router-dom'
import { Group, Container, Text, Box, Anchor, Stack } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconBrandInstagram } from '@tabler/icons-react'

function SobreContent() {
  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed" lh={1.6}>
        Mublin é a rede profissional para músicos, produtores, roadies e todos que fazem a
        música acontecer. Nossa missão é conectar profissionais da música e abrir mais
        oportunidades de trabalho — de gigs pontuais a projetos de longo prazo.
      </Text>
      <Text size="sm" c="dimmed" lh={1.6}>
        Estamos em desenvolvimento constante, construindo funcionalidades junto com a
        própria comunidade musical.
      </Text>
    </Stack>
  )
}

function PrivacidadeContent() {
  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed" lh={1.6}>
        Levamos a privacidade dos seus dados a sério. Em resumo: usamos suas informações
        apenas para viabilizar as funcionalidades da plataforma (perfil, conexões,
        oportunidades) e não vendemos seus dados a terceiros.
      </Text>
      <Text size="sm" c="dimmed" lh={1.6}>
        Esta é uma versão preliminar. Uma política de privacidade completa, em
        conformidade com a LGPD, será publicada em breve.
      </Text>
    </Stack>
  )
}

function ContatoContent() {
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed" lh={1.6}>
        Fale com a gente pelo Instagram:
      </Text>
      <Stack gap="xs">
        <Anchor
          href="https://instagram.com/mublin"
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          underline="never"
        >
          <Group gap={6} wrap="nowrap">
            <IconBrandInstagram size={16} />
            <Text span size="sm" fw={600}>
              @mublin
            </Text>
          </Group>
        </Anchor>
        <Anchor
          href="https://instagram.com/fabiobuenok"
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          underline="never"
        >
          <Group gap={6} wrap="nowrap">
            <IconBrandInstagram size={16} />
            <Text span size="sm" fw={600}>
              @fabiobuenok
            </Text>
            <Text span size="xs" c="dimmed">
              (Fundador)
            </Text>
          </Group>
        </Anchor>
      </Stack>
    </Stack>
  )
}

const LINKS = [
  { key: 'sobre', label: 'Sobre', title: 'Sobre o Mublin', content: <SobreContent /> },
  {
    key: 'privacidade',
    label: 'Privacidade',
    title: 'Privacidade',
    content: <PrivacidadeContent />,
  },
  { key: 'contato', label: 'Contato', title: 'Contato', content: <ContatoContent /> },
]

export default function PublicFooter() {
  const navigate = useNavigate()

  const openModal = ({ title, content }) => {
    modals.open({
      title,
      centered: true,
      radius: 'md',
      children: content,
    })
  }

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
              <Anchor
                key={l.key}
                component="button"
                type="button"
                size="sm"
                c="dimmed"
                underline="never"
                onClick={() => openModal(l)}
              >
                {l.label}
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
