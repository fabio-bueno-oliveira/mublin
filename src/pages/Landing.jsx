import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchRandomRoles } from '../queries/roles'
import {
  Skeleton, Box, Button, Text, Title, Group, Flex, Stack, Container,
  SimpleGrid, Marquee, Badge, ThemeIcon
} from '@mantine/core'
import {
  IconMusic, IconUsers, IconCalendarEvent, IconPlugConnected,
  IconMicrophone2, IconBrandSpotify, IconArrowRight
} from '@tabler/icons-react'

const FEATURES = [
  { icon: IconUsers,          label: 'Conecte-se com músicos, produtores e roadies' },
  { icon: IconCalendarEvent,  label: 'Encontre e candidate-se a gigs reais' },
  { icon: IconMusic,          label: 'Gerencie projetos e bandas em um só lugar' },
  { icon: IconMicrophone2,    label: 'Monte setlists e organize seu repertório' },
  { icon: IconBrandSpotify,   label: 'Conecte seu Spotify ao seu perfil' },
  { icon: IconPlugConnected,  label: 'Cadastre seu setup de equipamentos e informe o que você precisa para tocar' },
]

export default function Landing() {
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['landing-roles'],
    queryFn: fetchRandomRoles,
    staleTime: 1000 * 60 * 10,
    enabled: !authLoading && !session, // não executa se já tiver sessão
  })

  if (authLoading) return null
  if (session) return <Navigate to="/home" replace />

  return (
    <Box style={{ overflowX: 'hidden', width: '100%' }}>
      {/* ── Hero ───────────────────────────────────── */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: '60vh',
          width: '100%',
        }}
      >
        <Container size="sm" py={50} w="100%">
          <Stack gap="lg" align="center">
            <Badge fw='500' color="yellow" variant="light" size="md">
              The professional network for musicians
            </Badge>
            <Title
              order={1}
              ta='center'
              lts='-0.03em'
              lh={1.1}
              fz='clamp(40px, 6vw, 72px)'
              fw='800'
            >
              Sua carreira musical,{' '}
              <Text component="span" inherit c='indigo'>
                conectada.
              </Text>
            </Title>
            <Text ta='center' size="lg" c="dimmed" maw={480} lh={1.5}>
              Mublin é a rede profissional para músicos, produtores, roadies
              e todos que fazem a música acontecer.
            </Text>
            <Group gap="sm" justify="center">
              <Button size="md" radius="xl" fw='700' color="indigo" onClick={() => navigate('/signup')}>
                Criar conta grátis
              </Button>
              <Button
                size="md" radius="xl" variant="subtle" color="gray"
                rightSection={<IconArrowRight size={16} />}
                onClick={() => navigate('/login')}
              >
                Já tenho conta
              </Button>
            </Group>
            {loadingRoles ? (
              <Group gap="xs" justify="center">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} height={32} width={80 + i * 10} radius="xl" />
                ))}
              </Group>
            ) : (
              <Marquee gap="md" mt="md" duration={26000}>
                {roles.map(role => (
                  <Badge
                    key={role.id}
                    variant="light"
                    size="md"
                    fw='500'
                    color="gray"
                    c="dimmed"
                  >
                    {role.description_ptbr}
                  </Badge>
                ))}
              </Marquee>
            )}
          </Stack>
        </Container>
      </Box>

      {/* ── Features ───────────────────────────────── */}
      <Box py={96} style={{ width: '100%' }}>
        <Container size="md" w="100%">
          <Stack gap={48} align="center">
            <Stack gap={8} align="center" ta="center">
              <Title order={2} fz={36} fw={800} lts='-0.02em'>
                Tudo que você precisa
              </Title>
              <Text c="dimmed" size="md" maw={400}>
                Uma plataforma construída especialmente para o ecossistema musical.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" w="100%">
              {FEATURES.map(({ icon: Icon, label }) => ( // eslint-disable-line
                <Flex
                  key={label}
                  gap="md"
                  p="lg"
                  direction="column"
                  style={{
                    borderRadius: 16,
                    border: '1px solid var(--mantine-color-default-border)',
                    background: 'var(--mantine-color-default)',
                  }}
                >
                  <ThemeIcon size={40} radius="xl" color="gray" variant="light">
                    <Icon size={20} />
                  </ThemeIcon>
                  <Text size="md" fw={500} lh={1.5}>
                    {label}
                  </Text>
                </Flex>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      {/* ── CTA final ──────────────────────────────── */}
      <Box py={40} style={{ width: '100%' }}>
        <Container size="sm" w="100%">
          <Stack gap="xl" align="center" ta="center">
            <Title order={2} fz={36} fw={800} lts='-0.02em'>
              Pronto para começar?
            </Title>
            <Text c="dimmed" maw={380} lh={1.7}>
              Crie seu perfil, entre em projetos e encontre sua próxima gig.
            </Text>
            <Button
              size="lg"
              radius="xl"
              fw={700}
              color="indigo"
              px={40}
              onClick={() => navigate('/signup')}
            >
              Criar minha conta
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}