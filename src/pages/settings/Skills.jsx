import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUserRoles } from '../../queries/user'
import {
  fetchUserSkills,
  fetchAvailableSkills,
  addProfileSkill,
  deleteProfileSkill,
} from '../../queries/skills'
import {
  Pill,
  Stack,
  Group,
  Text,
  Button,
  Modal,
  Skeleton,
  Flex,
  TextInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconSearch, IconCheck } from '@tabler/icons-react'

// Ordem e rótulos de exibição dos tipos (skills.skill_type)
const SKILL_TYPES = [
  { value: 'technique', label: 'Técnicas' },
  { value: 'gear', label: 'Equipamentos' },
  { value: 'software', label: 'Software e DAWs' },
  { value: 'knowledge', label: 'Conhecimentos' },
]

// Remove acentos e caixa para a busca ("percepcao" encontra "Percepção")
function normalize(text = '') {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// Agrupa uma lista de itens pelo skill_type, respeitando SKILL_TYPES
function groupByType(items, getType) {
  return SKILL_TYPES.map((type) => ({
    ...type,
    items: items.filter((item) => getType(item) === type.value),
  })).filter((group) => group.items.length > 0)
}

// ── Componente principal ──────────────────────────────────

export default function Skills() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [addingSkillId, setAddingSkillId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch] = useState('')
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)

  // ── Queries ───────────────────────────────────────────

  // Mesma queryKey da página de Preferências musicais: quando o usuário
  // adicionar/remover atividade lá, esta lista já nasce atualizada.
  const { data: userRoles = [], isLoading: loadingUserRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: () => fetchUserRoles(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const categoryIds = useMemo(
    () => [...new Set(userRoles.map((r) => r.roles?.category_id).filter(Boolean))].sort(),
    [userRoles],
  )

  const { data: userSkills = [], isLoading: loadingUserSkills } = useQuery({
    queryKey: ['user-skills', user?.id],
    queryFn: () => fetchUserSkills(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: availableSkills = [], isLoading: loadingAvailableSkills } = useQuery({
    queryKey: ['available-skills', categoryIds],
    queryFn: () => fetchAvailableSkills(categoryIds),
    enabled: categoryIds.length > 0,
    staleTime: 1000 * 60 * 30,
  })

  // ── Derivados ─────────────────────────────────────────

  const selectedSkillIds = useMemo(
    () => new Set(userSkills.map((s) => s.skill_id)),
    [userSkills],
  )

  const userSkillGroups = useMemo(
    () => groupByType(userSkills, (s) => s.skills?.skill_type),
    [userSkills],
  )

  const modalSkillGroups = useMemo(() => {
    const term = normalize(search.trim())
    const filtered = term
      ? availableSkills.filter((s) => normalize(s.name_ptbr).includes(term))
      : availableSkills
    return groupByType(filtered, (s) => s.skill_type)
  }, [availableSkills, search])

  const hasRoles = userRoles.length > 0
  const canAddSkills = categoryIds.length > 0

  // ── Handlers ──────────────────────────────────────────

  async function handleAddSkill(skillId) {
    setAddingSkillId(skillId)
    try {
      await addProfileSkill(user.id, skillId)
      await queryClient.refetchQueries({ queryKey: ['user-skills', user.id] })
    } catch (error) {
      console.error(error)
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar habilidade. Tente novamente.',
      })
    } finally {
      setAddingSkillId(null)
    }
  }

  async function handleDeleteSkill(profileSkillId) {
    setDeletingId(profileSkillId)
    try {
      await deleteProfileSkill(profileSkillId)
      await queryClient.refetchQueries({ queryKey: ['user-skills', user.id] })
    } catch (error) {
      console.error(error)
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover habilidade. Tente novamente.',
      })
    } finally {
      setDeletingId(null)
    }
  }

  function handleCloseModal() {
    closeModal()
    setSearch('')
  }

  // ── Render ────────────────────────────────────────────

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Configurações · Habilidades · Mublin</title>
        <link rel="canonical" href="https://mublin.com/settings/skills" />
      </Helmet>

      <Stack gap="lg">
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Habilidades
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Técnicas, equipamentos, softwares e estilos que você domina. As opções
              disponíveis dependem das suas atividades na música.
            </Text>
          </div>

          {loadingUserSkills ? (
            <Flex gap={7}>
              <Skeleton width={90} height={24} radius="xl" />
              <Skeleton width={70} height={24} radius="xl" />
              <Skeleton width={110} height={24} radius="xl" />
            </Flex>
          ) : userSkillGroups.length > 0 ? (
            <Stack gap="md">
              {userSkillGroups.map((group) => (
                <Stack key={group.value} gap={6}>
                  <Text size="xs" c="dimmed" fw={500}>
                    {group.label}
                  </Text>
                  <Group gap={6}>
                    {group.items.map((item) => (
                      <Pill
                        key={item.id}
                        withRemoveButton
                        onRemove={() => handleDeleteSkill(item.id)}
                        removeButtonProps={{
                          'aria-label': `Remover ${item.skills?.name_ptbr}`,
                          title: 'Remover',
                        }}
                        style={
                          deletingId === item.id
                            ? { opacity: 0.5, pointerEvents: 'none' }
                            : undefined
                        }
                      >
                        {item.skills?.name_ptbr}
                      </Pill>
                    ))}
                  </Group>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhuma habilidade cadastrada
            </Text>
          )}

          {!loadingUserRoles && !hasRoles ? (
            <Stack gap="xs" align="flex-start">
              <Text size="sm" c="dimmed">
                Para adicionar habilidades, cadastre primeiro ao menos uma atividade na
                música.
              </Text>
              <Button
                size="sm"
                variant="light"
                component={Link}
                to="/settings/musical-preferences"
              >
                Ir para Preferências musicais
              </Button>
            </Stack>
          ) : (
            <div>
              <Button
                size="sm"
                variant="filled"
                leftSection={<IconPlus size={14} />}
                onClick={openModal}
                disabled={loadingUserRoles || !canAddSkills}
              >
                Adicionar habilidade
              </Button>
            </div>
          )}
        </Stack>
      </Stack>

      {/* ── Modal: adicionar habilidade ───────────────── */}
      <Modal
        title="Adicionar habilidades"
        opened={modalOpened}
        onClose={handleCloseModal}
        size="md"
        radius="md"
        centered
      >
        <Stack gap="md">
          <TextInput
            placeholder="Buscar habilidade..."
            leftSection={<IconSearch size={15} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            autoFocus
          />

          {loadingAvailableSkills ? (
            <Flex gap={7} wrap="wrap">
              {[90, 70, 110, 80, 100].map((w) => (
                <Skeleton key={w} width={w} height={28} radius="xl" />
              ))}
            </Flex>
          ) : modalSkillGroups.length > 0 ? (
            <Stack gap="md" mah={360} style={{ overflowY: 'auto' }}>
              {modalSkillGroups.map((group) => (
                <Stack key={group.value} gap={6}>
                  <Text size="xs" c="dimmed" fw={500}>
                    {group.label}
                  </Text>
                  <Group gap={6}>
                    {group.items.map((skill) => {
                      const alreadyAdded = selectedSkillIds.has(skill.id)
                      return (
                        <Button
                          key={skill.id}
                          size="compact-sm"
                          radius="xl"
                          variant={alreadyAdded ? 'filled' : 'light'}
                          leftSection={
                            alreadyAdded ? (
                              <IconCheck size={12} />
                            ) : (
                              <IconPlus size={12} />
                            )
                          }
                          loading={addingSkillId === skill.id}
                          disabled={alreadyAdded}
                          onClick={() => handleAddSkill(skill.id)}
                        >
                          {skill.name_ptbr}
                        </Button>
                      )
                    })}
                  </Group>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" ta="center">
              {search.trim()
                ? 'Nenhuma habilidade encontrada.'
                : 'Ainda não há habilidades cadastradas para as suas atividades.'}
            </Text>
          )}
        </Stack>
      </Modal>
    </>
  )
}
