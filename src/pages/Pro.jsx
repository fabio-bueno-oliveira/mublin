import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import {
  useMantineColorScheme,
  Center,
  Stack,
  Group,
  Box,
  Title,
  Text,
  Button,
  Image,
  SimpleGrid,
  Card,
  ThemeIcon,
  Badge,
  Tooltip,
  Divider,
  Skeleton,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconCrown,
  IconCheck,
  IconStar,
  IconSearch,
  IconChartBar,
  IconVideo,
  IconPhoto,
  IconDeviceSpeaker,
  IconHeadset,
  IconBellRinging,
  IconSparkles,
} from '@tabler/icons-react'
import MublinLogoBlack from '../assets/svg/mublin-m-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-m-logo-white-squared.svg'

const BENEFITS = [
  {
    icon: IconStar,
    title: 'Selo Pro no perfil',
    description: 'Mostre pra todo mundo que seu trabalho é levado a sério.',
  },
  {
    icon: IconSearch,
    title: 'Prioridade nas buscas',
    description: 'Apareça na frente quando bandas e contratantes procurarem por músicos.',
  },
  {
    icon: IconVideo,
    title: 'Upload de vídeos no Scenes',
    description: 'Suba vídeos verticais e apareça na vitrine de Cenas do Mublin.',
  },
  {
    icon: IconChartBar,
    title: 'Estatísticas avançadas',
    description: 'Veja quantas vezes seu perfil foi visitado e por quem.',
  },
  {
    icon: IconPhoto,
    title: 'Mais espaço no portfólio',
    description: 'Publique mais fotos e vídeos pra mostrar seu trabalho.',
  },
  {
    icon: IconDeviceSpeaker,
    title: 'Cadastro de equipamentos',
    description: 'Monte seu rig e mostre o setup que você usa.',
  },
  {
    icon: IconHeadset,
    title: 'Suporte personalizado',
    description: 'Atendimento direto com a equipe do Mublin.',
  },
]

async function fetchWaitlistStatus(profileId) {
  const { data, error } = await supabase
    .from('pro_waitlist')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  return !!data
}

async function fetchWaitlistCount() {
  const { data, error } = await supabase.rpc('pro_waitlist_count')

  if (error) {
    return null
  }
  // Postgres retorna bigint como string via PostgREST; convertemos com segurança.
  const parsed = Number(data)
  return Number.isFinite(parsed) ? parsed : null
}

export default function Pro() {
  const navigate = useNavigate()
  const { colorScheme } = useMantineColorScheme()
  const { profile, user, loading } = useAuth()
  const [joining, setJoining] = useState(false)
  const [justJoined, setJustJoined] = useState(false)

  const isPro = profile?.plan === 'Pro'

  const { data: alreadyOnWaitlist, isLoading: loadingWaitlist } = useQuery({
    queryKey: ['pro-waitlist-status', user?.id],
    queryFn: () => fetchWaitlistStatus(user.id),
    enabled: !!user?.id && !isPro,
    staleTime: 1000 * 60,
  })

  const { data: waitlistCount } = useQuery({
    queryKey: ['pro-waitlist-count'],
    queryFn: fetchWaitlistCount,
    enabled: !isPro,
    staleTime: 1000 * 60,
  })

  const onWaitlist = justJoined || alreadyOnWaitlist

  async function handleJoinWaitlist() {
    if (!user?.id || onWaitlist) {
      return
    }

    setJoining(true)
    try {
      const { error } = await supabase
        .from('pro_waitlist')
        .insert({ profile_id: user.id })

      if (error && error.code !== '23505') {
        // 23505 = já estava inscrito (unique violation); tratamos como sucesso
        throw error
      }

      setJustJoined(true)
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: 'Prontinho! Você entrou na lista de espera do Pro.',
      })
    } catch (err) {
      console.error('Erro ao entrar na lista de espera:', err)
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Não foi possível concluir agora. Tente novamente.',
      })
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <Center mih="100vh" px="md">
        <Stack align="center" gap="md" w="100%" maw={520}>
          <Skeleton height={28} width={160} />
          <Skeleton height={200} radius="md" w="100%" />
          <Skeleton height={200} radius="md" w="100%" />
        </Stack>
      </Center>
    )
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Mublin Pro · Mublin</title>
        <meta
          name="description"
          content="Conheça o Mublin Pro: selo verificado, prioridade nas buscas, Scenes e mais recursos para músicos e staff."
        />
      </Helmet>

      <Center mt="md">
        <Link to="/home">
          <Image
            src={colorScheme === 'light' ? MublinLogoBlack : MublinLogoWhite}
            h={54}
            w="auto"
            fit="contain"
          />
        </Link>
      </Center>

      <Center px="md" mt="sm" style={{ flexDirection: 'column', minHeight: '100vh' }}>
        <Stack align="center" gap="xl" maw={640} w="100%">
          {/* Hero */}
          <Stack align="center" gap="md">
            <Badge
              size="lg"
              radius="xl"
              variant="gradient"
              gradient={{
                from: 'mublinColor.9',
                to: 'teal.8',
                deg: 62,
              }}
            >
              MUBLIN PRO
            </Badge>

            <Title order={1} size="h2" ta="center">
              {isPro
                ? 'Você já faz parte do Pro 🎉'
                : 'Dê um upgrade na sua carreira musical'}
            </Title>

            <Text size="sm" c="dimmed" ta="center" maw={440}>
              {isPro
                ? 'Aproveite todos os recursos exclusivos e continue se destacando na comunidade Mublin.'
                : 'Mais visibilidade, mais recursos e mais oportunidades para músicos e staff que levam a carreira ou o hobby na música a sério.'}
            </Text>

            {isPro ? (
              <Button
                mt="xs"
                radius="xl"
                component={Link}
                to="/settings/plan"
                leftSection={<IconCrown size={16} />}
              >
                Ver detalhes do meu plano
              </Button>
            ) : null}
          </Stack>

          {!isPro && (
            <>
              {/* Benefícios */}
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%">
                {BENEFITS.map((item) => (
                  <Card key={item.title} withBorder radius="md" padding="md">
                    <Group gap="sm" wrap="nowrap" align="flex-start">
                      <ThemeIcon
                        size={36}
                        radius="md"
                        variant="gradient"
                        gradient={{
                          from: 'mublinColor.9',
                          to: 'teal.8',
                          deg: 62,
                        }}
                      >
                        <item.icon size={18} />
                      </ThemeIcon>
                      <Box>
                        <Text size="sm" fw={600}>
                          {item.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {item.description}
                        </Text>
                      </Box>
                    </Group>
                  </Card>
                ))}
              </SimpleGrid>

              {/* CTA / Waitlist */}
              <Card withBorder radius="md" padding="lg" w="100%">
                <Stack align="center" gap="sm">
                  <Group gap={6}>
                    <IconSparkles size={16} color="var(--mantine-color-text)" />
                    <Text size="sm" fw={600}>
                      Falta pouco pra você ter o Mublin Pro!
                    </Text>
                  </Group>

                  <Text size="xs" c="dimmed" ta="center" maw={360}>
                    Estamos finalizando o acesso às assinaturas pagas. Entre na lista de
                    espera e seja um dos primeiros a saber assim que a assinatura do Pro
                    abrir.
                  </Text>

                  <Tooltip label="Pagamentos chegando em breve" withArrow>
                    <Box>
                      <Button
                        disabled
                        radius="xl"
                        color="yellow"
                        leftSection={<IconCrown size={16} />}
                      >
                        Assinar Mublin Pro
                      </Button>
                    </Box>
                  </Tooltip>

                  <Divider label="ou" labelPosition="center" w="100%" my={2} />

                  {loadingWaitlist ? (
                    <Skeleton height={36} width={220} radius="xl" />
                  ) : onWaitlist ? (
                    <Group gap={6}>
                      <ThemeIcon
                        size={20}
                        radius="xl"
                        color="green.6"
                        variant="filled"
                        autoContrast
                      >
                        <IconCheck size={12} />
                      </ThemeIcon>
                      <Text size="sm" fw={500}>
                        Você está na lista! Vamos te avisar em breve.
                      </Text>
                    </Group>
                  ) : (
                    <Button
                      variant="light"
                      radius="xl"
                      loading={joining}
                      onClick={handleJoinWaitlist}
                      leftSection={<IconBellRinging size={16} />}
                    >
                      Quero ser avisado quando abrir
                    </Button>
                  )}

                  {typeof waitlistCount === 'number' && waitlistCount > 0 && (
                    <Text size="xs" c="dimmed">
                      {waitlistCount + 77}{' '}
                      {waitlistCount === 1
                        ? 'pessoas já entraram na lista'
                        : 'pessoas já entraram na lista'}
                    </Text>
                  )}
                </Stack>
              </Card>
            </>
          )}

          <Button variant="subtle" color="gray" size="xs" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </Stack>
      </Center>
    </>
  )
}
