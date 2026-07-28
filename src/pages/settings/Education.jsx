import { useState, useCallback } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import {
  Stack,
  Group,
  Text,
  Button,
  Modal,
  Select,
  Autocomplete,
  Skeleton,
  Avatar,
  TextInput,
  ActionIcon,
  Box,
  Loader,
  Textarea,
  Switch,
  NumberInput,
  Divider,
} from '@mantine/core'
import { useDisclosure, useDebouncedCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPlus,
  IconSearch,
  IconTrash,
  IconGripVertical,
  IconSchool,
  IconPencil,
  IconUserCircle,
} from '@tabler/icons-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const AVATARS_PATH =
  'https://ik.imagekit.io/mublin/users/avatars/tr:h-96,w-96,c-maintain_ratio/'

const CURRENT_YEAR = new Date().getFullYear()

// ── Queries locais ────────────────────────────────────────

async function fetchEducationLevels() {
  const { data, error } = await supabase
    .from('education_levels')
    .select('id, name_ptbr')
    .order('order_index')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchUserEducation(profileId) {
  const { data, error } = await supabase
    .from('profile_education')
    .select(
      `
      id,
      institution_name,
      course_name,
      field_of_study,
      start_year,
      end_year,
      is_current,
      description,
      order_index,
      id_institution,
      institutions ( id, name, logo ),
      education_levels ( id, name_ptbr )
    `,
    )
    .eq('id_profile', profileId)
    .order('order_index', { ascending: true, nullsFirst: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function searchInstitutions(keyword) {
  const { data, error } = await supabase
    .from('institutions')
    .select('id, name, logo')
    .ilike('name', `%${keyword}%`)
    .limit(10)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchUserTeachers(profileId) {
  const { data, error } = await supabase
    .from('profile_teachers')
    .select(
      `
      id,
      notes,
      created_at,
      teacher:profiles!profile_teachers_id_teacher_profile_fkey (
        id, full_name, username, avatar
      )
    `,
    )
    .eq('id_profile', profileId)
    .order('created_at', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function searchProfiles(keyword, excludeIds) {
  let query = supabase
    .from('profiles')
    .select('id, full_name, username, avatar')
    .ilike('full_name', `%${keyword}%`)
    .limit(10)
  if (excludeIds?.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }
  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// ── Componente principal ──────────────────────────────────

export default function Education() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // ── Estados: formulário de formação ────────────────────
  const [editingEducationId, setEditingEducationId] = useState(null)
  const [institutionName, setInstitutionName] = useState('')
  const [institutionId, setInstitutionId] = useState(null)
  const [institutionResults, setInstitutionResults] = useState([])
  const [searchingInstitutions, setSearchingInstitutions] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [fieldOfStudy, setFieldOfStudy] = useState('')
  const [educationLevelId, setEducationLevelId] = useState('')
  const [startYear, setStartYear] = useState('')
  const [endYear, setEndYear] = useState('')
  const [isCurrent, setIsCurrent] = useState(false)
  const [description, setDescription] = useState('')
  const [isSavingEducation, setIsSavingEducation] = useState(false)
  const [isDeletingEducation, setIsDeletingEducation] = useState(false)

  const [modalEducationOpened, { open: openEducationModal, close: closeEducationModal }] =
    useDisclosure(false)

  // ── Estados: professores ───────────────────────────────
  const [profileSearch, setProfileSearch] = useState('')
  const [profileResults, setProfileResults] = useState([])
  const [searchingProfiles, setSearchingProfiles] = useState(false)
  const [teacherNotes, setTeacherNotes] = useState('')
  const [selectedTeacherProfile, setSelectedTeacherProfile] = useState(null)
  const [isSavingTeacher, setIsSavingTeacher] = useState(false)
  const [isDeletingTeacher, setIsDeletingTeacher] = useState(false)

  const [modalTeacherOpened, { open: openTeacherModal, close: closeTeacherModal }] =
    useDisclosure(false)

  // ── Queries ─────────────────────────────────────────────

  const { data: educationLevels = [] } = useQuery({
    queryKey: ['education-levels'],
    queryFn: fetchEducationLevels,
    staleTime: Infinity,
  })

  const { data: userEducation = [], isLoading: loadingEducation } = useQuery({
    queryKey: ['user-education', user?.id],
    queryFn: () => fetchUserEducation(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: userTeachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['user-teachers', user?.id],
    queryFn: () => fetchUserTeachers(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const educationLevelSelectData = educationLevels.map((lvl) => ({
    value: String(lvl.id),
    label: lvl.name_ptbr,
  }))

  const alreadyAddedTeacherIds = userTeachers.map((t) => t.teacher?.id).filter(Boolean)

  // ── Handlers: busca de instituição ─────────────────────

  const executeInstitutionSearch = useCallback(async (keyword) => {
    if (keyword.trim().length < 2) {
      setInstitutionResults([])
      return
    }
    setSearchingInstitutions(true)
    try {
      const results = await searchInstitutions(keyword)
      setInstitutionResults(results)
    } catch (err) {
      console.error(err)
    } finally {
      setSearchingInstitutions(false)
    }
  }, [])

  const debouncedInstitutionSearch = useDebouncedCallback(executeInstitutionSearch, 400)

  function handleInstitutionChange(value) {
    setInstitutionName(value)
    // Texto foi alterado manualmente: só reconectamos ao catálogo se
    // o usuário selecionar uma sugestão explicitamente (onOptionSubmit)
    setInstitutionId(null)
    debouncedInstitutionSearch(value)
  }

  function handleInstitutionOptionSubmit(value) {
    const match = institutionResults.find((inst) => inst.name === value)
    if (match) {
      setInstitutionId(match.id)
    }
  }

  // ── Handler: reset / abrir formulário de formação ──────

  function resetEducationForm() {
    setEditingEducationId(null)
    setInstitutionName('')
    setInstitutionId(null)
    setInstitutionResults([])
    setCourseName('')
    setFieldOfStudy('')
    setEducationLevelId('')
    setStartYear('')
    setEndYear('')
    setIsCurrent(false)
    setDescription('')
  }

  function handleCloseEducationModal() {
    closeEducationModal()
    resetEducationForm()
  }

  function handleOpenEditEducationModal(item) {
    setEditingEducationId(item.id)
    setInstitutionName(item.institution_name ?? '')
    setInstitutionId(item.id_institution ?? null)
    setCourseName(item.course_name ?? '')
    setFieldOfStudy(item.field_of_study ?? '')
    setEducationLevelId(item.education_levels?.id ? String(item.education_levels.id) : '')
    setStartYear(item.start_year ?? '')
    setEndYear(item.end_year ?? '')
    setIsCurrent(!!item.is_current)
    setDescription(item.description ?? '')
    openEducationModal()
  }

  // ── Handler: adicionar formação ─────────────────────────

  async function handleAddEducation() {
    if (!institutionName.trim()) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Informe o nome da instituição de ensino.',
      })
      return
    }

    setIsSavingEducation(true)
    const nextOrder = userEducation.length + 1

    const { error } = await supabase.from('profile_education').insert({
      id_profile: user.id,
      id_institution: institutionId,
      institution_name: institutionName.trim(),
      course_name: courseName.trim() ? courseName.trim() : null,
      field_of_study: fieldOfStudy.trim() ? fieldOfStudy.trim() : null,
      id_education_level: educationLevelId ? Number(educationLevelId) : null,
      start_year: startYear ? Number(startYear) : null,
      end_year: !isCurrent && endYear ? Number(endYear) : null,
      is_current: isCurrent,
      description: description.trim() ? description.trim() : null,
      order_index: nextOrder,
    })

    if (error) {
      console.error(error)
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar formação. Tente novamente.',
      })
      setIsSavingEducation(false)
      return
    }

    notifications.show({
      color: 'green',
      position: 'top-center',
      message: 'Formação adicionada!',
    })

    await queryClient.refetchQueries({ queryKey: ['user-education', user.id] })
    handleCloseEducationModal()
    setIsSavingEducation(false)
  }

  // ── Handler: atualizar formação existente ──────────────

  async function handleUpdateEducation() {
    if (!institutionName.trim()) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Informe o nome da instituição de ensino.',
      })
      return
    }

    setIsSavingEducation(true)

    const { error } = await supabase
      .from('profile_education')
      .update({
        id_institution: institutionId,
        institution_name: institutionName.trim(),
        course_name: courseName.trim() ? courseName.trim() : null,
        field_of_study: fieldOfStudy.trim() ? fieldOfStudy.trim() : null,
        id_education_level: educationLevelId ? Number(educationLevelId) : null,
        start_year: startYear ? Number(startYear) : null,
        end_year: !isCurrent && endYear ? Number(endYear) : null,
        is_current: isCurrent,
        description: description.trim() ? description.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingEducationId)

    if (error) {
      console.error(error)
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao salvar alterações. Tente novamente.',
      })
      setIsSavingEducation(false)
      return
    }

    notifications.show({
      color: 'green',
      position: 'top-center',
      message: 'Formação atualizada!',
    })

    await queryClient.refetchQueries({ queryKey: ['user-education', user.id] })
    handleCloseEducationModal()
    setIsSavingEducation(false)
  }

  // ── Handler: remover formação ───────────────────────────

  async function handleDeleteEducation(itemId) {
    setIsDeletingEducation(true)

    const { error } = await supabase.from('profile_education').delete().eq('id', itemId)

    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover formação.',
      })
      setIsDeletingEducation(false)
      return
    }

    const remainingItems = userEducation.filter((item) => item.id !== itemId)
    if (remainingItems.length > 0) {
      try {
        await Promise.all(
          remainingItems.map((item, index) =>
            supabase
              .from('profile_education')
              .update({ order_index: index + 1 })
              .eq('id', item.id),
          ),
        )
      } catch (orderError) {
        console.error('Erro ao reordenar remanescentes:', orderError)
      }
    }

    await queryClient.refetchQueries({ queryKey: ['user-education', user.id] })
    setIsDeletingEducation(false)
  }

  // ── Handler: reordenar via drag and drop ───────────────

  async function handleDragEndEducation(result) {
    if (!result.destination || result.source.index === result.destination.index) {
      return
    }

    const items = Array.from(userEducation)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    queryClient.setQueryData(['user-education', user.id], items)

    try {
      await Promise.all(
        items.map((item, index) => {
          const correctOrder = index + 1
          if (item.order_index !== correctOrder) {
            return supabase
              .from('profile_education')
              .update({ order_index: correctOrder })
              .eq('id', item.id)
          }
          return null
        }),
      )
    } catch (error) {
      console.error('Erro ao salvar nova ordenação:', error)
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Houve um erro ao sincronizar a ordem com o servidor.',
      })
    } finally {
      await queryClient.invalidateQueries({ queryKey: ['user-education', user.id] })
    }
  }

  // ── Handlers: busca de perfil (professor) ──────────────

  const executeProfileSearch = useCallback(
    async (keyword) => {
      if (keyword.trim().length < 2) {
        setProfileResults([])
        return
      }
      setSearchingProfiles(true)
      try {
        const excludeIds = [user.id, ...alreadyAddedTeacherIds]
        const results = await searchProfiles(keyword, excludeIds)
        setProfileResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setSearchingProfiles(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, userTeachers],
  )

  const debouncedProfileSearch = useDebouncedCallback(executeProfileSearch, 400)

  function handleProfileSearch(keyword) {
    setProfileSearch(keyword)
    debouncedProfileSearch(keyword)
  }

  function handleCloseTeacherModal() {
    closeTeacherModal()
    setProfileSearch('')
    setProfileResults([])
    setSelectedTeacherProfile(null)
    setTeacherNotes('')
  }

  // ── Handler: adicionar professor ────────────────────────

  async function handleAddTeacher() {
    if (!selectedTeacherProfile) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Busque e selecione um perfil cadastrado no Mublin.',
      })
      return
    }

    setIsSavingTeacher(true)

    const { error } = await supabase.from('profile_teachers').insert({
      id_profile: user.id,
      id_teacher_profile: selectedTeacherProfile.id,
      notes: teacherNotes.trim() ? teacherNotes.trim() : null,
    })

    if (error) {
      console.error(error)
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar professor. Tente novamente.',
      })
      setIsSavingTeacher(false)
      return
    }

    notifications.show({
      color: 'green',
      position: 'top-center',
      message: 'Professor adicionado!',
    })

    await queryClient.refetchQueries({ queryKey: ['user-teachers', user.id] })
    handleCloseTeacherModal()
    setIsSavingTeacher(false)
  }

  // ── Handler: remover professor ──────────────────────────

  async function handleDeleteTeacher(itemId) {
    setIsDeletingTeacher(true)

    const { error } = await supabase.from('profile_teachers').delete().eq('id', itemId)

    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover professor.',
      })
      setIsDeletingTeacher(false)
      return
    }

    await queryClient.refetchQueries({ queryKey: ['user-teachers', user.id] })
    setIsDeletingTeacher(false)
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <>
      <Stack gap="xl">
        {/* ═══════════════ Formação ═══════════════ */}
        <Stack gap="lg">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Formação
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Onde você estuda ou estudou música (arraste para reordenar)
            </Text>
          </div>

          {loadingEducation || isDeletingEducation ? (
            <Stack gap="xs">
              {[1, 2].map((i) => (
                <Skeleton key={i} height={56} radius="sm" />
              ))}
            </Stack>
          ) : userEducation.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEndEducation}>
              <Droppable droppableId="education-list">
                {(provided) => (
                  <Stack gap="xs" ref={provided.innerRef} {...provided.droppableProps}>
                    {userEducation.map((item, index) => (
                      <Draggable
                        key={String(item.id)}
                        draggableId={String(item.id)}
                        index={index}
                      >
                        {(providedDrag) => (
                          <Group
                            ref={providedDrag.innerRef}
                            {...providedDrag.draggableProps}
                            gap="sm"
                            align="flex-start"
                            justify="space-between"
                            wrap="nowrap"
                            style={{
                              ...providedDrag.draggableProps.style,
                              backgroundColor: 'var(--mantine-color-body)',
                              padding: '6px 8px',
                              borderRadius: 'var(--mantine-radius-sm)',
                            }}
                          >
                            <Group
                              gap="sm"
                              align="flex-start"
                              wrap="nowrap"
                              style={{ flex: 1, minWidth: 0 }}
                            >
                              <Box
                                {...providedDrag.dragHandleProps}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginTop: 10,
                                }}
                              >
                                <IconGripVertical
                                  size={14}
                                  opacity={0.4}
                                  style={{ cursor: 'grab' }}
                                />
                              </Box>
                              <Avatar
                                size={40}
                                radius="sm"
                                src={item.institutions?.logo || undefined}
                              >
                                <IconSchool size={18} />
                              </Avatar>
                              <Stack gap={2} style={{ minWidth: 0 }}>
                                <Text size="sm" fw={600}>
                                  {item.institution_name}
                                </Text>
                                {(item.course_name || item.field_of_study) && (
                                  <Text size="xs">
                                    {[item.course_name, item.field_of_study]
                                      .filter(Boolean)
                                      .join(' — ')}
                                  </Text>
                                )}
                                <Text size="xs" c="dimmed">
                                  {[
                                    item.education_levels?.name_ptbr,
                                    item.start_year || item.end_year || item.is_current
                                      ? `${item.start_year ?? ''}${
                                          item.is_current
                                            ? ' – atual'
                                            : item.end_year
                                              ? ` – ${item.end_year}`
                                              : ''
                                        }`
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </Text>
                                {item.description && (
                                  <Text
                                    w="70%"
                                    size="xs"
                                    c="dimmed"
                                    fs="italic"
                                    mt={2}
                                    truncate
                                  >
                                    "{item.description}"
                                  </Text>
                                )}
                              </Stack>
                            </Group>
                            <Group gap={4} style={{ flexShrink: 0 }} wrap="nowrap">
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                onClick={() => handleOpenEditEducationModal(item)}
                                title="Editar formação"
                              >
                                <IconPencil size={14} />
                              </ActionIcon>
                              <ActionIcon
                                size="md"
                                variant="subtle"
                                color="red"
                                onClick={() => handleDeleteEducation(item.id)}
                                title="Remover formação"
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Stack>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhuma formação cadastrada
            </Text>
          )}

          <div>
            <Button
              size="sm"
              variant="filled"
              leftSection={<IconPlus size={14} />}
              onClick={openEducationModal}
            >
              Adicionar formação
            </Button>
          </div>
        </Stack>

        <Divider />

        {/* ═══════════════ Professores ═══════════════ */}
        <Stack gap="lg">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Professores
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Pessoas que são ou foram seus professores (apenas perfis cadastrados no
              Mublin)
            </Text>
          </div>

          {loadingTeachers || isDeletingTeacher ? (
            <Stack gap="xs">
              {[1].map((i) => (
                <Skeleton key={i} height={48} radius="sm" />
              ))}
            </Stack>
          ) : userTeachers.length > 0 ? (
            <Stack gap="xs">
              {userTeachers.map((item) => (
                <Group key={item.id} gap="sm" justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <Avatar
                      size={40}
                      radius="xl"
                      src={
                        item.teacher?.avatar
                          ? AVATARS_PATH + item.teacher.avatar
                          : undefined
                      }
                    >
                      <IconUserCircle size={18} />
                    </Avatar>
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <Text size="sm" fw={600}>
                        {item.teacher?.full_name}
                      </Text>
                      {item.teacher?.username && (
                        <Text size="xs" c="dimmed">
                          @{item.teacher.username}
                        </Text>
                      )}
                      {item.notes && (
                        <Text size="xs" c="dimmed" fs="italic" mt={2}>
                          "{item.notes}"
                        </Text>
                      )}
                    </Stack>
                  </Group>
                  <ActionIcon
                    size="md"
                    variant="subtle"
                    color="red"
                    onClick={() => handleDeleteTeacher(item.id)}
                    title="Remover professor"
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhum professor cadastrado
            </Text>
          )}

          <div>
            <Button
              size="sm"
              variant="filled"
              leftSection={<IconPlus size={14} />}
              onClick={openTeacherModal}
            >
              Adicionar professor
            </Button>
          </div>
        </Stack>
      </Stack>

      {/* ── Modal: adicionar ou editar formação ─────────── */}
      <Modal
        title={editingEducationId ? 'Editar formação' : 'Adicionar formação'}
        opened={modalEducationOpened}
        onClose={handleCloseEducationModal}
        size="sm"
        radius="md"
        centered
      >
        <Stack gap="sm">
          <Autocomplete
            label="Instituição de ensino"
            placeholder="Ex: Berklee College of Music, ou o nome da sua escola"
            value={institutionName}
            onChange={handleInstitutionChange}
            onOptionSubmit={handleInstitutionOptionSubmit}
            data={institutionResults.map((inst) => inst.name)}
            rightSection={searchingInstitutions ? <Loader size="xs" /> : undefined}
            description="Comece a digitar: se a escola já estiver no Mublin, selecione-a na lista"
          />

          <TextInput
            label="Curso / formação (opcional)"
            placeholder="Ex: Bacharelado em Composição"
            value={courseName}
            onChange={(e) => setCourseName(e.currentTarget.value)}
          />

          <TextInput
            label="Área de estudo (opcional)"
            placeholder="Ex: Guitarra, Produção Musical..."
            value={fieldOfStudy}
            onChange={(e) => setFieldOfStudy(e.currentTarget.value)}
          />

          <Select
            label="Nível (opcional)"
            placeholder="Selecione"
            data={educationLevelSelectData}
            value={educationLevelId}
            onChange={(value) => setEducationLevelId(value ?? '')}
            clearable
          />

          <Switch
            label="Ainda estou cursando"
            checked={isCurrent}
            onChange={(e) => {
              const checked = e.currentTarget.checked
              setIsCurrent(checked)
              if (checked) {
                setEndYear('')
              }
            }}
          />

          <Group grow gap="sm">
            <NumberInput
              label="Ano de início"
              placeholder="Ex: 2019"
              min={1900}
              max={CURRENT_YEAR + 1}
              value={startYear}
              onChange={setStartYear}
              hideControls
            />
            {!isCurrent && (
              <NumberInput
                label="Ano de término"
                description="Deixe em branco se não concluiu"
                min={1900}
                max={CURRENT_YEAR + 1}
                value={endYear}
                onChange={setEndYear}
                hideControls
              />
            )}
          </Group>

          <Textarea
            label="Comentário (opcional)"
            placeholder="Ex: Aulas com Fulano de Tal, premiado no festival X..."
            description={`${description.length}/2000`}
            minRows={2}
            maxRows={6}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />

          <Button
            fullWidth
            mt="xs"
            size="sm"
            loading={isSavingEducation}
            disabled={!institutionName.trim()}
            onClick={editingEducationId ? handleUpdateEducation : handleAddEducation}
          >
            {editingEducationId ? 'Salvar alterações' : 'Adicionar formação'}
          </Button>
        </Stack>
      </Modal>

      {/* ── Modal: adicionar professor ────────────────────── */}
      <Modal
        title="Adicionar professor"
        opened={modalTeacherOpened}
        onClose={handleCloseTeacherModal}
        size="sm"
        radius="md"
        centered
      >
        <Stack gap="sm">
          {selectedTeacherProfile ? (
            <Group
              gap="sm"
              justify="space-between"
              p={6}
              style={{ borderRadius: 'var(--mantine-radius-sm)' }}
            >
              <Group gap="sm">
                <Avatar
                  size={32}
                  radius="xl"
                  src={
                    selectedTeacherProfile.avatar
                      ? AVATARS_PATH + selectedTeacherProfile.avatar
                      : undefined
                  }
                >
                  <IconUserCircle size={16} />
                </Avatar>
                <Text size="sm" fw={600}>
                  {selectedTeacherProfile.full_name}
                </Text>
              </Group>
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={() => setSelectedTeacherProfile(null)}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          ) : (
            <Stack gap="xs">
              <TextInput
                placeholder="Buscar perfil cadastrado no Mublin..."
                leftSection={<IconSearch size={15} />}
                rightSection={searchingProfiles ? <Loader size="xs" /> : undefined}
                value={profileSearch}
                onChange={(e) => handleProfileSearch(e.target.value)}
                autoFocus
              />
              {profileResults.length > 0 && (
                <Stack gap="xs" mah={220} style={{ overflowY: 'auto' }}>
                  {profileResults.map((profile) => (
                    <Group key={profile.id} gap="sm" justify="space-between">
                      <Group gap="sm">
                        <Avatar
                          size={32}
                          radius="xl"
                          src={profile.avatar ? AVATARS_PATH + profile.avatar : undefined}
                        >
                          <IconUserCircle size={16} />
                        </Avatar>
                        <Box>
                          <Text size="sm">{profile.full_name}</Text>
                          {profile.username && (
                            <Text size="xs" c="dimmed">
                              @{profile.username}
                            </Text>
                          )}
                        </Box>
                      </Group>
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => {
                          setSelectedTeacherProfile(profile)
                          setProfileSearch('')
                          setProfileResults([])
                        }}
                      >
                        Selecionar
                      </Button>
                    </Group>
                  ))}
                </Stack>
              )}
              {profileSearch.length >= 2 &&
                !searchingProfiles &&
                profileResults.length === 0 && (
                  <Text size="sm" c="dimmed" ta="center">
                    Nenhum perfil encontrado.
                  </Text>
                )}
            </Stack>
          )}

          <Textarea
            label="Comentário (opcional)"
            placeholder="Ex: Aulas de violão entre 2018 e 2020"
            description={`${teacherNotes.length}/500`}
            minRows={2}
            maxRows={4}
            maxLength={500}
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.currentTarget.value)}
          />

          <Button
            fullWidth
            mt="xs"
            size="sm"
            loading={isSavingTeacher}
            disabled={!selectedTeacherProfile}
            onClick={handleAddTeacher}
          >
            Adicionar professor
          </Button>
        </Stack>
      </Modal>
    </>
  )
}
