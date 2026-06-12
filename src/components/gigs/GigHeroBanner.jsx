import {
  Box,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  Button,
  Divider,
  ActionIcon,
  Tooltip,
  useMantineTheme,
} from '@mantine/core'
import {
  IconBolt,
  IconMapPin,
  IconClock,
  IconCurrencyReal,
  IconUsers,
  IconGuitarPick,
  IconBookmark,
  IconArrowRight,
  IconCheck,
} from '@tabler/icons-react'

/**
 * GigHeroBanner
 *
 * Banner de destaque para a Home do Mublin.
 * Exibe a gig com maior compatibilidade com o perfil do músico logado.
 *
 * Props:
 * @param {object}   gig              - Dados da gig
 * @param {string}   gig.title        - Título da vaga
 * @param {string}   gig.venue        - Nome do local/contratante
 * @param {string}   gig.city         - Cidade · Estado
 * @param {string}   gig.date         - Data do show (ex: "28 jun · 21h")
 * @param {number}   gig.fee          - Cachê em R$
 * @param {string}   gig.feeLabel     - Label do cachê (ex: "por show", "cachê fixo")
 * @param {string[]} gig.tags         - Tags: estilo, instrumento, duração etc.
 * @param {number}   gig.matchScore   - Score de compatibilidade 0–100
 * @param {string}   gig.closesLabel  - Texto do prazo (ex: "encerra hoje", "encerra em 2 dias")
 * @param {boolean}  gig.urgent       - Se true, exibe prazo em laranja
 * @param {string}   gig.description  - Descrição curta da vaga
 * @param {function} onApply          - Callback do botão "Quero esta gig"
 * @param {function} onSave           - Callback do botão salvar
 * @param {function} onSeeAll         - Callback do link "ver marketplace completo"
 */
export function GigHeroBanner({
  gig = {
    title: 'Guitarrista para show cover anos 80',
    venue: 'Bar Manifesto',
    city: 'Sorocaba, SP',
    date: '28 jun · 21h',
    fee: 400,
    feeLabel: 'cachê',
    tags: ['Rock', 'Guitar solo', '4h de show'],
    matchScore: 95,
    closesLabel: 'encerra hoje',
    urgent: true,
    description:
      'Precisamos de um guitarrista com experiência em repertório dos anos 80 — rock e pop. Leitura de cifra necessária. Ensaio único no dia 26.',
  },
  onApply,
  onSave,
  onSeeAll,
}) {
  const theme = useMantineTheme()

  const isHighMatch = gig.matchScore >= 85

  return (
    <Stack gap={0}>
      {/* Cabeçalho da zona */}
      <Group justify="space-between" mb="sm">
        <Group gap={6}>
          <IconBolt size={15} color={theme.colors.blue[4]} />
          <Text
            size="xs"
            fw={500}
            c="blue.4"
            tt="uppercase"
            style={{ letterSpacing: '0.05em' }}
          >
            Gig em destaque para você
          </Text>
        </Group>
        <Text size="xs" c="blue.5" style={{ cursor: 'pointer' }} onClick={onSeeAll}>
          ver marketplace completo{' '}
          <IconArrowRight size={11} style={{ verticalAlign: 'middle' }} />
        </Text>
      </Group>

      {/* Banner principal */}
      <Box
        style={(theme) => ({
          background:
            theme.colorScheme === 'dark'
              ? 'linear-gradient(135deg, #050505 0%, #0f1a2a 60%, #111827 100%)'
              : 'linear-gradient(135deg, #0e1a2e 0%, #0c2048 100%)',
          border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.blue[9] : theme.colors.blue[2]}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
          position: 'relative',
          overflow: 'hidden',
        })}
      >
        {/* Detalhe decorativo de fundo */}
        <Box
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(59,130,246,0.06)',
            pointerEvents: 'none',
          }}
        />

        <Group align="flex-start" gap="lg" wrap="nowrap">
          {/* Ícone do instrumento */}
          <Box
            style={(theme) => ({
              width: 52,
              height: 52,
              borderRadius: theme.radius.sm,
              background:
                theme.colorScheme === 'dark'
                  ? 'rgba(59,130,246,0.12)'
                  : theme.colors.blue[0],
              border: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.blue[8] : theme.colors.blue[2]}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            })}
          >
            <IconGuitarPick size={26} color={theme.colors.blue[4]} />
          </Box>

          {/* Conteúdo central */}
          <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
            <Group gap={8} wrap="wrap">
              <Title
                order={4}
                style={(theme) => ({
                  color:
                    theme.colorScheme === 'dark'
                      ? theme.colors.blue[1]
                      : theme.colors.blue[9],
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: 1.3,
                })}
              >
                {gig.title}
              </Title>

              {isHighMatch && (
                <Badge
                  size="sm"
                  variant="light"
                  color="teal"
                  leftSection={<IconCheck size={10} />}
                  style={{ flexShrink: 0 }}
                >
                  {gig.matchScore}% match
                </Badge>
              )}
            </Group>

            {/* Localização e data */}
            <Group gap="md" wrap="wrap">
              <Group gap={4}>
                <IconMapPin size={12} color={theme.colors.blue[4]} />
                <Text size="xs" c="blue.4">
                  {gig.venue} · {gig.city}
                </Text>
              </Group>
              <Group gap={4}>
                <IconClock size={12} color={theme.colors.blue[4]} />
                <Text size="xs" c="blue.4">
                  {gig.date}
                </Text>
              </Group>
              <Group gap={4}>
                <IconUsers size={12} color={theme.colors.blue[4]} />
                <Text size="xs" c="blue.4">
                  {gig.tags.join(' · ')}
                </Text>
              </Group>
            </Group>

            {/* Descrição */}
            <Text size="xs" c="dimmed" lineClamp={2} mt={2}>
              {gig.description}
            </Text>
          </Stack>

          {/* Coluna direita — cachê + prazo + ações */}
          <Stack gap={8} align="flex-end" style={{ flexShrink: 0 }}>
            {/* Cachê */}
            <Stack gap={0} align="flex-end">
              <Group gap={4} align="baseline">
                <IconCurrencyReal
                  size={14}
                  color={theme.colors.blue[4]}
                  style={{ marginBottom: -2 }}
                />
                <Text
                  fw={700}
                  style={(theme) => ({
                    fontSize: 22,
                    color:
                      theme.colorScheme === 'dark'
                        ? theme.colors.blue[3]
                        : theme.colors.blue[7],
                    lineHeight: 1,
                  })}
                >
                  {gig.fee.toLocaleString('pt-BR')}
                </Text>
              </Group>
              <Text size="xs" c="blue.6">
                {gig.feeLabel}
              </Text>
            </Stack>

            {/* Badge de prazo */}
            <Badge
              size="sm"
              variant="light"
              color={gig.urgent ? 'orange' : 'gray'}
              leftSection={<IconClock size={10} />}
            >
              {gig.closesLabel}
            </Badge>

            <Divider orientation="horizontal" style={{ width: '100%', opacity: 0.3 }} />

            {/* Botões */}
            <Group gap={6}>
              <Tooltip label="Salvar gig" position="top">
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  size="md"
                  onClick={onSave}
                  aria-label="Salvar gig"
                >
                  <IconBookmark size={16} />
                </ActionIcon>
              </Tooltip>

              <Button
                size="sm"
                color="blue"
                rightSection={<IconArrowRight size={14} />}
                onClick={onApply}
              >
                Quero esta gig
              </Button>
            </Group>
          </Stack>
        </Group>
      </Box>
    </Stack>
  )
}

export default GigHeroBanner
