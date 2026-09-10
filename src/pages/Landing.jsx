import { useEffect, useRef, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useInViewport, useMediaQuery } from '@mantine/hooks'
import {
  Skeleton,
  Box,
  Button,
  Text,
  Title,
  Group,
  Flex,
  Stack,
  Container,
  SimpleGrid,
  Image,
  ThemeIcon,
  RollingNumber,
  Center,
  Grid,
} from '@mantine/core'
import {
  IconMusic,
  IconUsers,
  IconCalendarEvent,
  IconPlugConnected,
  IconMicrophone2,
  IconBrandSpotify,
  IconArrowRight,
  IconBolt,
} from '@tabler/icons-react'
import { IconGuitarPedal } from '../components/icons/GuitarPedal'

const FEATURES = [
  { icon: IconUsers, label: 'Conecte-se com músicos, produtores e roadies' },
  { icon: IconCalendarEvent, label: 'Encontre e candidate-se a gigs reais' },
  { icon: IconMusic, label: 'Gerencie projetos e bandas em um só lugar' },
  { icon: IconMicrophone2, label: 'Monte setlists e organize seu repertório' },
  { icon: IconBrandSpotify, label: 'Conecte seu Spotify ao seu perfil' },
  {
    icon: IconPlugConnected,
    label: 'Cadastre seu setup de equipamentos e informe o que você precisa para tocar',
  },
]

const EQUIPMENT_COUNT = 3247

function useCountUp(target, { duration = 1600, active = true } = {}) {
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!active || startedRef.current) {
      return
    }
    startedRef.current = true

    let raf
    const start = performance.now()

    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) ** 3 // ease-out cubic
      setValue(Math.round(eased * target))
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, duration, target])

  return value
}

export default function Landing() {
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 48em)')

  const { ref: equipmentSectionRef, inViewport: equipmentInView } = useInViewport()
  const animatedEquipmentCount = useCountUp(EQUIPMENT_COUNT, {
    active: equipmentInView,
    duration: 1800,
  })

  if (authLoading) {
    return (
      <Container size="sm" py={50}>
        <Stack gap="lg" align="center">
          <Skeleton height={28} width={220} radius="xl" />
          <Skeleton height={56} width="80%" radius="md" />
          <Skeleton height={24} width="60%" radius="md" />
        </Stack>
      </Container>
    )
  }
  if (session) {
    return <Navigate to="/home" replace />
  }

  return (
    <Box style={{ overflowX: 'hidden', width: '100%' }}>
      {/* ── Hero ───────────────────────────────────── */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: '54vh',
          width: '100%',
        }}
      >
        <Container size="lg" py={50} w="100%">
          <Grid p={0}>
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <Stack gap="lg" align={isMobile ? 'center' : 'flex-start'}>
                <Group
                  gap={4}
                  px={14}
                  h={24}
                  style={{
                    borderRadius: 999,
                    border:
                      '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                    background:
                      'light-dark(rgba(255,255,255,0.8), rgba(255,255,255,0.06))',
                    backdropFilter: 'blur(8px)',
                    width: 'fit-content',
                  }}
                >
                  <IconBolt size={16} stroke={1.5} color="gray" />
                  <Text
                    size="xs"
                    c="dimmed"
                    style={{ letterSpacing: '-0.01em' }}
                    tt="uppercase"
                    ff="heading"
                  >
                    A rede profissional para músicos
                  </Text>
                </Group>
                <Title
                  order={1}
                  ta={isMobile ? 'center' : 'left'}
                  lts="-0.03em"
                  lh={1.1}
                  fz="clamp(40px, 6vw, 72px)"
                  fw={700}
                >
                  Sua próxima gig
                  <br />
                  <Text
                    component="span"
                    inherit
                    variant="gradient"
                    gradient={{ from: 'mublinColor', to: 'blue', deg: 96 }}
                  >
                    começa aqui.
                  </Text>
                </Title>
                <Text
                  ta={isMobile ? 'center' : 'left'}
                  size="xl"
                  c="dimmed"
                  maw={500}
                  lh={1.5}
                >
                  Encontre gigs, monte bandas, mostre seu setup. Tudo em um só lugar,
                  feito pra quem vive de música.
                </Text>
                <Group gap="sm" my="xs" justify="center">
                  <Button
                    size="md"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: 'mublinColor.9', to: 'blue.8', deg: 96 }}
                    onClick={() => navigate('/signup')}
                    rightSection={<IconArrowRight size={16} />}
                  >
                    Criar conta grátis
                  </Button>
                  <Button
                    size="md"
                    radius="xl"
                    variant="subtle"
                    color="gray"
                    onClick={() => navigate('/login')}
                  >
                    Já tenho conta
                  </Button>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }} pt={{ base: 30, sm: 40 }}>
              <Center>
                <Image
                  src="https://ik.imagekit.io/mublin/misc/backstage_laughter.jpg?tr=w-340,q-80"
                  w={340}
                  h="auto"
                  fit="cover"
                  radius="lg"
                />
              </Center>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* ── Features ───────────────────────────────── */}
      <Box py={54} style={{ width: '100%' }}>
        <Container size="md" w="100%">
          <Stack gap={48} align="center">
            <Stack gap={8} align="center" ta="center">
              <Title order={2} fz={36} fw={800}>
                Tudo que você precisa
              </Title>
              <Text c="dimmed" size="md" maw={400}>
                Uma plataforma construída especialmente para o ecossistema musical.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" w="100%">
              {FEATURES.map(({ icon: Icon, label }) => (
                <Flex
                  key={label}
                  gap="md"
                  p="lg"
                  direction="column"
                  mih={140}
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

      {/* ── Equipamentos ───────────────────────────── */}
      <Box py={80}>
        <Container size="sm" w="100%">
          <Stack gap="sm" align="center" ta="center" ref={equipmentSectionRef}>
            <Center>
              <IconGuitarPedal size={60} color="currentColor" stroke={1} />
            </Center>
            <Title order={2} fz={36} fw={800}>
              Seu equipamento, no seu perfil
            </Title>
            <Text c="dimmed" size="md" maw={480} lh={1.6}>
              Cadastre instrumentos, pedais, amplificadores e tudo que você usa pra tocar.
              Já são mais de{' '}
              <Text component="span" inherit fw={700} c="mublinColor">
                3 mil itens
              </Text>{' '}
              catalogados.
            </Text>
            <RollingNumber
              value={animatedEquipmentCount}
              fz="clamp(48px, 8vw, 80px)"
              fw={800}
              suffix="+"
              c="mublinColor"
            />
          </Stack>
        </Container>
      </Box>

      {/* ── CTA final ──────────────────────────────── */}
      <Box py={40} style={{ width: '100%' }}>
        <Container size="sm" w="100%">
          <Stack gap="xl" align="center" ta="center">
            <Title order={2} fz={36} fw={800}>
              Pronto para começar?
            </Title>
            <Text c="dimmed" maw={380} lh={1.7}>
              Crie seu perfil, entre em projetos e encontre sua próxima gig.
            </Text>
            <Button
              size="lg"
              radius="xl"
              fw={700}
              color="mublinColor"
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
