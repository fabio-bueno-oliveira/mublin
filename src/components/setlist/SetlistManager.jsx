import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Stack,
  Group,
  Box,
  Paper,
  Avatar,
  Select,
  TextInput,
  Button,
  Title,
  Text,
  Badge,
  ActionIcon,
  Loader,
  Divider,
  Checkbox,
  Collapse,
  Popover,
  Fieldset,
  Image,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import {
  IconPlus,
  IconTrash,
  IconPencil,
  IconChevronUp,
  IconChevronDown,
  IconHelpCircle,
  IconBrandSpotify,
  IconBrandYoutube,
  IconX,
} from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import {
  fetchProjectSetlists,
  createSetlist,
  renameSetlist,
  deleteSetlist,
  fetchSetlistTracks,
  addTrackToSetlist,
  removeSetlistTrack,
  updateSetlistTrackOrder,
  createQuickTrack,
} from '../../queries/setlists'
import { fetchProjectDetailsById } from '../../queries/projects'
import { extractSpotifyTrackId, buildSpotifyTrackUrl } from '../../utils/musicLinks'
import TrackCombobox from './TrackCombobox'

function formatDuration(seconds) {
  if (!seconds) {
    return '--:--'
  }
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// value/onChange: id da setlist selecionada para esta gig (elevado ao componente pai)
export default function SetlistManager({ projectId, value, onChange }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [newSetlistName, setNewSetlistName] = useState('')
  const [creatingSetlist, setCreatingSetlist] = useState(false)
  const [showNewSetlistForm, setShowNewSetlistForm] = useState(false)

  const [editingSetlistName, setEditingSetlistName] = useState('')
  const [renamingSetlist, setRenamingSetlist] = useState(false)
  const [showRenameSetlistForm, setShowRenameSetlistForm] = useState(false)

  const [showQuickTrack, setShowQuickTrack] = useState(false)
  const [quickTrackTitle, setQuickTrackTitle] = useState('')
  const [quickTrackIsPublic, setQuickTrackIsPublic] = useState(false)
  const [quickTrackSpotifyLink, setQuickTrackSpotifyLink] = useState('')
  const [quickTrackYoutubeLink, setQuickTrackYoutubeLink] = useState('')
  const [creatingTrack, setCreatingTrack] = useState(false)

  const { data: setlists = [], isLoading: loadingSetlists } = useQuery({
    queryKey: ['project-setlists', projectId],
    queryFn: () => fetchProjectSetlists(projectId),
    enabled: !!projectId,
  })

  // seleciona automaticamente a primeira setlist do projeto, se nada foi escolhido ainda
  useEffect(() => {
    if (!value && setlists.length > 0) {
      onChange(setlists[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setlists])

  const { data: projectBasicDetails, isLoading: loadingProjectDetails } = useQuery({
    queryKey: ['project-basic-details', projectId],
    queryFn: () => fetchProjectDetailsById(projectId),
    enabled: !!projectId,
    retry: 1,
  })

  const { data: tracks = [], isLoading: loadingTracks } = useQuery({
    queryKey: ['setlist-tracks', value],
    queryFn: () => fetchSetlistTracks(value),
    enabled: !!value,
  })

  const selectedSetlist = setlists.find((setlist) => String(setlist.id) === String(value))

  function handleOpenRenameSetlist() {
    if (!selectedSetlist) {
      return
    }

    setEditingSetlistName(selectedSetlist.name)
    setShowRenameSetlistForm(true)
  }

  async function handleRenameSetlist() {
    const name = editingSetlistName.trim()

    if (!value || !name) {
      return
    }

    setRenamingSetlist(true)

    try {
      await renameSetlist(value, name)

      await queryClient.invalidateQueries({
        queryKey: ['project-setlists', projectId],
      })

      setShowRenameSetlistForm(false)
      setEditingSetlistName('')
    } finally {
      setRenamingSetlist(false)
    }
  }

  function handleDeleteSetlist() {
    if (!selectedSetlist) {
      return
    }

    modals.openConfirmModal({
      title: 'Excluir setlist',
      children: (
        <Text size="sm">
          Tem certeza que deseja excluir a setlist <strong>{selectedSetlist.name}</strong>
          ? As faixas não serão excluídas do catálogo do Mublin.
        </Text>
      ),
      labels: {
        confirm: 'Excluir setlist',
        cancel: 'Cancelar',
      },
      confirmProps: {
        color: 'red',
      },
      onConfirm: async () => {
        await deleteSetlist(selectedSetlist.id)

        const remainingSetlists = setlists.filter(
          (setlist) => setlist.id !== selectedSetlist.id,
        )

        onChange(remainingSetlists[0]?.id ?? null)

        await queryClient.invalidateQueries({
          queryKey: ['project-setlists', projectId],
        })
      },
    })
  }

  async function handleCreateSetlist() {
    if (!newSetlistName.trim() || !projectId) {
      return
    }
    setCreatingSetlist(true)
    try {
      const setlist = await createSetlist(projectId, newSetlistName.trim(), user.id)
      await queryClient.invalidateQueries({
        queryKey: ['project-setlists', projectId],
      })
      setNewSetlistName('')
      setShowNewSetlistForm(false)
      onChange(setlist.id)
    } finally {
      setCreatingSetlist(false)
    }
  }

  async function handleAddTrack(track) {
    const nextOrder = tracks.length + 1

    const isCover =
      track.project_id != null && Number(track.project_id) !== Number(projectId)

    await addTrackToSetlist(value, track.id, nextOrder, isCover)

    queryClient.invalidateQueries({
      queryKey: ['setlist-tracks', value],
    })
  }

  async function handleCreateQuickTrack() {
    if (!quickTrackTitle.trim() || !projectId) {
      return
    }
    setCreatingTrack(true)
    try {
      const track = await createQuickTrack({
        projectId,
        userId: user.id,
        title: quickTrackTitle.trim(),
        isPublic: quickTrackIsPublic,
        spotifyLink: quickTrackSpotifyLink,
        youtubeLink: quickTrackYoutubeLink,
      })
      await handleAddTrack(track)
      setQuickTrackTitle('')
      setQuickTrackIsPublic(false)
      setQuickTrackSpotifyLink('')
      setQuickTrackYoutubeLink('')
      setShowQuickTrack(false)
    } finally {
      setCreatingTrack(false)
    }
  }

  async function handleRemoveTrack(setlistTrackId) {
    await removeSetlistTrack(setlistTrackId)
    queryClient.invalidateQueries({ queryKey: ['setlist-tracks', value] })
  }

  async function handleMove(index, direction) {
    const current = tracks[index]
    const target = tracks[index + direction]
    if (!current || !target) {
      return
    }
    await Promise.all([
      updateSetlistTrackOrder(current.setlist_track_id, target.order_index),
      updateSetlistTrackOrder(target.setlist_track_id, current.order_index),
    ])
    queryClient.invalidateQueries({ queryKey: ['setlist-tracks', value] })
  }

  if (!projectId) {
    return (
      <Text size="sm" c="dimmed">
        Selecione um projeto para gerenciar o repertório.
      </Text>
    )
  }

  if (loadingSetlists) {
    return (
      <Group justify="center" py="md">
        <Loader size="sm" />
      </Group>
    )
  }

  const PROJECT_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${projectId}/tr:h-100,w-100,c-maintain_ratio/`

  return (
    <Stack gap="md">
      <Group gap="xs">
        <Avatar
          radius="md"
          src={PROJECT_AVATAR_PATH + projectBasicDetails?.picture}
          size={50}
        />
        <Stack gap={1}>
          <Title size="lg">{projectBasicDetails?.name}</Title>
          <Text size="xs" c="dimmed" lh={1}>
            {projectBasicDetails?.type?.name_ptbr}{' '}
          </Text>
        </Stack>
      </Group>
      {setlists.length > 0 && (
        <Stack gap={6}>
          <Select
            label={`Setlists do projeto (${setlists.length})`}
            data={setlists.map((s) => ({
              value: String(s.id),
              label: `${s.name} (${s.track_count} faixa${
                s.track_count === 1 ? '' : 's'
              })`,
            }))}
            value={value ? String(value) : null}
            onChange={(v) => {
              onChange(v ? Number(v) : null)
              setShowRenameSetlistForm(false)
            }}
          />

          {value && (
            <Group gap={4}>
              <Button
                type="button"
                variant="subtle"
                size="compact-xs"
                leftSection={<IconPencil size={13} />}
                onClick={handleOpenRenameSetlist}
              >
                Renomear
              </Button>

              <Button
                type="button"
                variant="subtle"
                color="red"
                size="compact-xs"
                leftSection={<IconTrash size={13} />}
                onClick={handleDeleteSetlist}
              >
                Excluir
              </Button>
              <Button
                type="button"
                variant="subtle"
                color="green"
                size="compact-xs"
                fw={400}
                onClick={() => setShowNewSetlistForm((v) => !v)}
                leftSection={
                  showNewSetlistForm ? <IconX size={12} /> : <IconPlus size={12} />
                }
              >
                {showNewSetlistForm ? 'Cancelar' : 'Criar novo setlist para este projeto'}
              </Button>
            </Group>
          )}

          <Collapse expanded={showRenameSetlistForm}>
            <Paper withBorder p="sm" radius="md">
              <Group align="flex-end" gap="xs">
                <TextInput
                  label="Nome da setlist"
                  value={editingSetlistName}
                  onChange={(e) => setEditingSetlistName(e.currentTarget.value)}
                  style={{ flex: 1 }}
                />

                <Button
                  type="button"
                  size="sm"
                  onClick={handleRenameSetlist}
                  loading={renamingSetlist}
                  disabled={!editingSetlistName.trim()}
                >
                  Salvar
                </Button>

                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setShowRenameSetlistForm(false)
                    setEditingSetlistName('')
                  }}
                >
                  Cancelar
                </Button>
              </Group>
            </Paper>
          </Collapse>
        </Stack>
      )}

      {setlists.length === 0 ? (
        <Paper withBorder p="sm" radius="md">
          <Text size="sm" fw={500} mb="xs">
            Este projeto ainda não tem nenhuma setlist. Crie a primeira:
          </Text>
          <Group align="flex-end" gap="xs">
            <TextInput
              placeholder="Ex: Repertório acústico"
              value={newSetlistName}
              onChange={(e) => setNewSetlistName(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Button
              type="button"
              leftSection={<IconPlus size={16} />}
              onClick={handleCreateSetlist}
              loading={creatingSetlist}
              disabled={!newSetlistName.trim()}
              size="sm"
            >
              Criar setlist
            </Button>
          </Group>
        </Paper>
      ) : (
        <Collapse expanded={showNewSetlistForm}>
          <Box>
            <Group align="flex-end" gap="xs">
              <TextInput
                placeholder="Ex: Repertório acústico"
                value={newSetlistName}
                onChange={(e) => setNewSetlistName(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                leftSection={<IconPlus size={16} />}
                onClick={handleCreateSetlist}
                loading={creatingSetlist}
                disabled={!newSetlistName.trim()}
                size="sm"
              >
                Criar setlist
              </Button>
            </Group>
          </Box>
        </Collapse>
      )}

      {value && (
        <>
          <Divider label={`Faixas (${tracks.length})`} />

          <TrackCombobox
            projectId={projectId}
            userId={user.id}
            excludeIds={tracks.map((t) => t.id)}
            onSelect={handleAddTrack}
          />

          <Group justify="flex-end">
            <Button
              type="button"
              variant="subtle"
              color="mublinSecondary"
              size="compact-xs"
              fw={400}
              w="fit-content"
              onClick={() => setShowQuickTrack((v) => !v)}
              leftSection={showQuickTrack ? <IconX size={12} /> : <IconPlus size={12} />}
            >
              {showQuickTrack
                ? 'cancelar'
                : 'não encontrei, cadastrar nova faixa manualmente'}
            </Button>
          </Group>

          <Collapse expanded={showQuickTrack}>
            <Paper withBorder p="sm" radius="md">
              <Stack gap="xs">
                <TextInput
                  label="Título da faixa"
                  placeholder="Nome da música"
                  value={quickTrackTitle}
                  onChange={(e) => setQuickTrackTitle(e.currentTarget.value)}
                />

                <TextInput
                  label="Link do Spotify (opcional)"
                  placeholder="Cole aqui o link ou o URI da faixa"
                  value={quickTrackSpotifyLink}
                  onChange={(e) => setQuickTrackSpotifyLink(e.currentTarget.value)}
                  error={
                    quickTrackSpotifyLink.trim() &&
                    !extractSpotifyTrackId(quickTrackSpotifyLink)
                      ? 'Não reconheci esse link/ID do Spotify — confira se é o link da faixa'
                      : null
                  }
                  leftSection={<IconBrandSpotify size={16} color="#1DB954" />}
                  rightSection={
                    <Popover width={260} withArrow shadow="md" position="top-end">
                      <Popover.Target>
                        <ActionIcon type="button" variant="subtle" color="gray" size="sm">
                          <IconHelpCircle size={16} />
                        </ActionIcon>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <Text size="xs">
                          No app do Spotify: abra a música, toque nos <b>···</b> (ou no
                          ícone de compartilhar) e escolha{' '}
                          <b>Compartilhar → Copiar link da música</b>. Depois é só colar
                          aqui.
                        </Text>
                      </Popover.Dropdown>
                    </Popover>
                  }
                />

                <TextInput
                  label="Link do YouTube (opcional)"
                  placeholder="Cole aqui o link do vídeo"
                  value={quickTrackYoutubeLink}
                  onChange={(e) => setQuickTrackYoutubeLink(e.currentTarget.value)}
                  leftSection={<IconBrandYoutube size={16} color="#FF0000" />}
                />

                <Checkbox
                  label="Tornar esta faixa pública (outros projetos poderão usá-la também)"
                  checked={quickTrackIsPublic}
                  onChange={(e) => setQuickTrackIsPublic(e.currentTarget.checked)}
                />
                <Text size="xs" c="dimmed">
                  Upload de arquivo de áudio ainda não disponível — a faixa será criada
                  sem arquivo por enquanto, e o arquivo de áudio poderá ser adicionado
                  posteriormente na seção Backstage → Discografia do projeto.
                </Text>
                <Group justify="flex-end">
                  <Button
                    type="button"
                    size="xs"
                    onClick={handleCreateQuickTrack}
                    loading={creatingTrack}
                    disabled={!quickTrackTitle.trim()}
                  >
                    Criar e adicionar à setlist
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Collapse>

          <Fieldset
            legend={`Setlist "${selectedSetlist?.name || 'Repertório'}" (${tracks.length === 0 ? 'nenhuma música' : `${tracks.length} ${tracks.length === 1 ? 'música' : 'músicas'}`})`}
            variant="default"
          >
            <Stack gap="xs">
              {loadingTracks && (
                <Group justify="center" py="sm">
                  <Loader size="xs" />
                </Group>
              )}
              {!loadingTracks && tracks.length === 0 && (
                <Text size="sm" c="dimmed" ta="center" py="sm">
                  Nenhuma faixa adicionada ainda
                </Text>
              )}
              {tracks.map((t, index) => (
                <Paper key={t.setlist_track_id} p="xs" withBorder radius="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap">
                      <Stack gap={2}>
                        <ActionIcon
                          type="button"
                          size="xs"
                          variant="subtle"
                          disabled={index === 0}
                          onClick={() => handleMove(index, -1)}
                        >
                          <IconChevronUp size={12} />
                        </ActionIcon>
                        <ActionIcon
                          type="button"
                          size="xs"
                          variant="subtle"
                          disabled={index === tracks.length - 1}
                          onClick={() => handleMove(index, 1)}
                        >
                          <IconChevronDown size={12} />
                        </ActionIcon>
                      </Stack>
                      <Image src={t?.cover_image} w={30} h={30} />
                      <Text size="sm" fw={500}>
                        {index + 1}. {t.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatDuration(t.duration_seconds)}
                      </Text>
                      {/* {t.spotify_id && (
                        <Anchor
                          href={buildSpotifyTrackUrl(t.spotify_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          c="dimmed"
                        >
                          <IconBrandSpotify size={16} color="#1DB954" />
                        </Anchor>
                      )} */}
                      {/* {t.youtube_path && (
                        <Anchor
                          href={t.youtube_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          c="dimmed"
                        >
                          <IconBrandYoutube size={16} color="#FF0000" />
                        </Anchor>
                      )} */}
                      {t.is_cover && (
                        <Badge size="xs" variant="light" color="teal">
                          Cover
                        </Badge>
                      )}
                    </Group>
                    <ActionIcon
                      type="button"
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() => handleRemoveTrack(t.setlist_track_id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Fieldset>
        </>
      )}
    </Stack>
  )
}
