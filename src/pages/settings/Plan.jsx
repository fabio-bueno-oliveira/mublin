import {
  Title,
  Stack,
  Card,
  Group,
  Text,
  Badge,
  Button,
  Box,
  Divider,
  Skeleton,
} from '@mantine/core'
import { useAuth } from '../../hooks/useAuth'
import {
  IconCrown,
  IconGift,
  IconBrandStripe,
  IconHeartHandshake,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconInfinity,
} from '@tabler/icons-react'
import { Link } from 'react-router-dom'

const ORIGIN_META = {
  purchase: { label: 'Compra • Stripe', color: 'blue', icon: IconBrandStripe },
  courtesy: { label: 'Cortesia', color: 'orange', icon: IconGift },
  partner: { label: 'Parceiro', color: 'teal', icon: IconHeartHandshake },
  none: { label: 'Gratuito', color: 'gray', icon: null, extra: 'Staff' },
}

function formatDate(iso) {
  if (!iso) {
    return '—'
  }
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function expiryInfo(expiresAt) {
  if (!expiresAt) {
    return { label: 'Vitalício', color: 'blue', icon: IconInfinity, expired: false }
  }
  const diff = Math.ceil((new Date(expiresAt) - new Date()) / 86400000)
  if (diff < 0) {
    return {
      label: `Expirou em ${formatDate(expiresAt)}`,
      color: 'red',
      icon: IconAlertTriangle,
      expired: true,
    }
  }
  if (diff === 0) {
    return { label: 'Expira hoje', color: 'red', icon: IconAlertTriangle, expired: false }
  }
  if (diff <= 7) {
    return {
      label: `Expira em ${diff} dia${diff > 1 ? 's' : ''}`,
      color: 'orange',
      icon: IconClock,
      expired: false,
    }
  }
  if (diff <= 30) {
    return {
      label: `Expira em ${diff} dias`,
      color: 'yellow',
      icon: IconClock,
      expired: false,
    }
  }
  return {
    label: `Válido até ${formatDate(expiresAt)}`,
    color: 'teal',
    icon: IconCheck,
    expired: false,
  }
}

export default function Plan() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <Stack gap="md" maw={520}>
        <Skeleton height={20} width={120} />
        <Skeleton height={160} radius="md" />
      </Stack>
    )
  }

  const isPro = profile?.plan === 'Pro'
  const origin = profile?.plan_origin ?? 'none'
  const originMeta = ORIGIN_META[origin] ?? ORIGIN_META.none
  const exp = expiryInfo(profile?.plan_expires_at)
  const OriginIcon = originMeta.icon

  return (
    <>
      <Title order={2} fz="h4" fw={600} mb="lg">
        Meu plano
      </Title>

      <Stack gap="lg" maw={520}>
        <Card
          withBorder
          radius="md"
          padding="lg"
          style={{ borderColor: isPro ? 'var(--mantine-color-gray-9)' : undefined }}
        >
          <Group justify="space-between" align="flex-start" mb="md">
            <Group gap="sm">
              <Box>
                <Group gap={8}>
                  <Text fw={700} size="lg">
                    {isPro ? 'Mublin Pro' : 'Mublin Free'}
                  </Text>
                  <Badge
                    variant="gradient"
                    gradient={
                      isPro
                        ? { from: 'brown', to: 'yellow.9', deg: 96 }
                        : { from: 'mublinColor.8', to: 'blue.9', deg: 96 }
                    }
                  >
                    {isPro ? 'PRO' : 'FREE'}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  {isPro ? 'Acesso completo a recursos exclusivos' : 'Plano gratuito'}
                </Text>
              </Box>
            </Group>
            {isPro && (
              <Badge
                color={originMeta.color}
                variant="light"
                leftSection={OriginIcon ? <OriginIcon size={12} /> : null}
              >
                {originMeta.label}
              </Badge>
            )}
          </Group>

          <Divider my="sm" />

          {isPro ? (
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Origem
                </Text>
                <Text size="sm" fw={500}>
                  {originMeta.label} {originMeta.extra && `(${originMeta.extra})`}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  Validade
                </Text>
                <Group gap={4}>
                  <exp.icon size={18} color={`var(--mantine-color-${exp.color}-6)`} />
                  <Text size="sm" fw={500} c={exp.expired ? 'red' : undefined}>
                    {exp.label}
                  </Text>
                </Group>
              </Group>
              {profile?.plan_expires_at && (
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Data de expiração
                  </Text>
                  <Text size="sm">{formatDate(profile.plan_expires_at)}</Text>
                </Group>
              )}
              {profile?.plan_note && (
                <>
                  <Divider my={4} />
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={500} mb={4}>
                      Observação
                    </Text>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {profile.plan_note}
                    </Text>
                  </Box>
                </>
              )}
            </Stack>
          ) : (
            <Stack gap="sm">
              <Text size="sm">
                Você está no plano Free. Com o Pro você desbloqueia selo verificado,
                destaque nas buscas, estatísticas avançadas e mais.
              </Text>
              <Button
                component={Link}
                to="/pro"
                color="mublinColor"
                leftSection={<IconCrown size={16} />}
              >
                Adquirir Plano Pro
              </Button>
            </Stack>
          )}
        </Card>

        {isPro && (
          <Card withBorder radius="md" padding="md">
            <Text size="sm" fw={600} mb="xs">
              O que seu Pro inclui
            </Text>
            <Stack gap={6}>
              {[
                'Selo Pro no perfil',
                'Prioridade nas buscas',
                'Contador de visualizações no perfil',
                'Mais espaço para portfolio',
                'Cadastro de equipamentos no perfil',
                'Suporte personalizado',
              ].map((item) => (
                <Group key={item} gap={6}>
                  <IconCheck size={14} color="var(--mantine-color-green-7)" />
                  <Text size="sm">{item}</Text>
                </Group>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </>
  )
}
