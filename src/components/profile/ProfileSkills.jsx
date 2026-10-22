import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Paper,
  Group,
  Stack,
  Text,
  Pill,
  Modal,
  Button,
  Skeleton,
  ScrollArea,
  UnstyledButton,
  ActionIcon,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconSparkles, IconArrowRight, IconPencil, IconPlus } from '@tabler/icons-react'

// Ordem e rótulos de exibição dos tipos (skills.skill_type)
const SKILL_TYPES = [
  { value: 'technique', label: 'Técnicas' },
  { value: 'gear', label: 'Equipamentos' },
  { value: 'software', label: 'Software e DAWs' },
  { value: 'knowledge', label: 'Conhecimentos' },
]

const TYPE_ORDER = Object.fromEntries(SKILL_TYPES.map((t, i) => [t.value, i]))

// Quantas habilidades aparecem no card resumo (o restante fica no modal)
const SUMMARY_LIMIT = 5

/**
 * Habilidades do perfil, no estilo "Principais competências" do LinkedIn:
 * um card resumo clicável que abre um modal com a lista completa.
 *
 * Props:
 * - skills: retorno de fetchUserSkills (linhas de profile_skills com `skills(...)`)
 * - loading: boolean
 * - isOwnProfile: boolean
 */
export default function ProfileSkills({ skills = [], loading, isOwnProfile }) {
  const [opened, { open, close }] = useDisclosure(false)

  // Só tipos conhecidos, ordenados por tipo. O sort é estável, então dentro
  // de cada tipo mantém a ordem em que o usuário adicionou.
  const sortedSkills = useMemo(
    () =>
      skills
        .filter((item) => TYPE_ORDER[item.skills?.skill_type] !== undefined)
        .sort(
          (a, b) => TYPE_ORDER[a.skills.skill_type] - TYPE_ORDER[b.skills.skill_type],
        ),
    [skills],
  )

  const groups = useMemo(
    () =>
      SKILL_TYPES.map((type) => ({
        ...type,
        items: sortedSkills.filter((item) => item.skills.skill_type === type.value),
      })).filter((group) => group.items.length > 0),
    [sortedSkills],
  )

  const total = sortedSkills.length
  const summaryNames = sortedSkills
    .slice(0, SUMMARY_LIMIT)
    .map((item) => item.skills.name_ptbr)
  const remaining = total - summaryNames.length

  if (loading) {
    return <Skeleton height={62} radius="md" mt="md" />
  }

  // Perfil de outra pessoa sem habilidades: não ocupa espaço
  if (total === 0 && !isOwnProfile) {
    return null
  }

  // Meu perfil sem habilidades: convite para cadastrar
  if (total === 0) {
    return (
      <Paper withBorder radius="md" px="sm" py="sm" mt="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <IconSparkles size={20} stroke={1.6} style={{ flexShrink: 0 }} />
            <Stack gap={0}>
              <Text size="sm" fw={600} lh={1.3}>
                Habilidades
              </Text>
              <Text size="xs" c="dimmed">
                Mostre técnicas, equipamentos e softwares que você domina
              </Text>
            </Stack>
          </Group>
          <Button
            component={Link}
            to="/settings/skills"
            size="xs"
            variant="light"
            leftSection={<IconPlus size={14} />}
            style={{ flexShrink: 0 }}
          >
            Adicionar
          </Button>
        </Group>
      </Paper>
    )
  }

  return (
    <>
      <UnstyledButton
        onClick={open}
        w="100%"
        mt="md"
        aria-haspopup="dialog"
        aria-label={`Ver todas as ${total} habilidades`}
      >
        <Paper withBorder radius="md" px="md" py="sm">
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
              <IconSparkles size={20} stroke={1.6} style={{ flexShrink: 0 }} />
              <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                <Text size="sm" fw={600} lh={1.3}>
                  Habilidades
                </Text>
                <Group gap={6} wrap="nowrap">
                  <Text size="xs" lineClamp={1} style={{ minWidth: 0 }}>
                    {summaryNames.join(' • ')}
                  </Text>
                  {remaining > 0 && (
                    <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                      +{remaining}
                    </Text>
                  )}
                </Group>
              </Stack>
            </Group>
            <IconArrowRight size={18} style={{ flexShrink: 0 }} />
          </Group>
        </Paper>
      </UnstyledButton>

      <Modal
        opened={opened}
        onClose={close}
        centered
        radius="md"
        size="sm"
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        title={
          <Group gap="xs" wrap="nowrap">
            <Text fw={700} size="md">
              Habilidades ({total})
            </Text>
            {isOwnProfile && (
              <ActionIcon
                variant="subtle"
                color="gray"
                radius="xl"
                size="sm"
                aria-label="Editar minhas habilidades"
                title="Editar minhas habilidades"
                component={Link}
                to="/settings/skills"
              >
                <IconPencil size={16} />
              </ActionIcon>
            )}
          </Group>
        }
      >
        <ScrollArea.Autosize mah={420}>
          <Stack gap="md" py="xs">
            {groups.map((group) => (
              <Stack key={group.value} gap={6}>
                <Text size="xs" c="dimmed" fw={500}>
                  {group.label}
                </Text>
                <Group gap={6}>
                  {group.items.map((item) => (
                    <Pill key={item.id} size="sm">
                      {item.skills.name_ptbr}
                    </Pill>
                  ))}
                </Group>
              </Stack>
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </Modal>
    </>
  )
}
