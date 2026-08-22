import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Stack,
  Group,
  Paper,
  Select,
  TextInput,
  Button,
  Text,
  Badge,
  ActionIcon,
  Loader,
  Divider,
  Checkbox,
  Collapse,
  Popover,
  Anchor,
} from '@mantine/core'
import {
  IconPlus,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconHelpCircle,
  IconBrandSpotify,
  IconBrandYoutube,
} from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import {
  fetchProjectSetlists,
  createSetlist,
  fetchSetlistTracks,
  addTrackToSetlist,
  removeSetlistTrack,
  updateSetlistTrackOrder,
  createQuickTrack,
} from '../../queries/setlists'
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

  const { data: tracks = [], isLoading: loadingTracks } = useQuery({
    queryKey: ['setlist-tracks', value],
    queryFn: () => fetchSetlistTracks(value),
    enabled: !!value,
  })

  async function handleCreateSetlist() {
    if (!newSetlistName.trim() || !projectId) {
      return
    }
    setCreatingSetlist(true)
    try {
      const setlist = await createSetlist(projectId, newSetlistName.trim(), user.id)
      await queryClient.invalidateQueries({ queryKey: ['project-setlists', projectId] })
      setNewSetlistName('')
      onChange(setlist.id)
    } finally {
      setCreatingSetlist(false)
    }
  }

  async function handleAddTrack(track) {
    const nextOrder = tracks.length + 1
    await addTrackToSetlist(value, track.id, nextOrder)
    queryClient.invalidateQueries({ queryKey: ['setlist-tracks', value] })
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

  return (
    <Stack gap="md">
      {setlists.length > 0 && (
        <Select
          label="Setlist desta gig"
          data={setlists.map((s) => ({
            value: String(s.id),
            label: `${s.name} (${s.track_count} faixa${s.track_count === 1 ? '' : 's'})`,
          }))}
          value={value ? String(value) : null}
          onChange={(v) => onChange(v ? Number(v) : null)}
        />
      )}

      <Paper withBorder p={0} radius="md">
        <Text size="xs" fw={500} mb={6}>
          {setlists.length > 0
            ? 'Ou crie uma nova setlist para este projeto'
            : 'Este projeto ainda não tem nenhuma setlist. Crie a primeira:'}
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

      {value && (
        <>
          <Divider label={`Faixas (${tracks.length})`} />

          <TrackCombobox
            projectId={projectId}
            excludeIds={tracks.map((t) => t.id)}
            onSelect={handleAddTrack}
          />

          <Button
            type="button"
            variant="subtle"
            size="xs"
            w="fit-content"
            onClick={() => setShowQuickTrack((v) => !v)}
          >
            {showQuickTrack ? 'Cancelar' : 'Não encontrei, cadastrar nova faixa'}
          </Button>

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
                  O upload do áudio ainda não está disponível — a faixa será criada sem
                  arquivo por enquanto, e o upload poderá ser feito depois.
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
                    <Stack gap={0}>
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
                    <Text size="sm" fw={500}>
                      {index + 1}. {t.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDuration(t.duration_seconds)}
                    </Text>
                    {t.spotify_id && (
                      <Anchor
                        href={buildSpotifyTrackUrl(t.spotify_id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        c="dimmed"
                      >
                        <IconBrandSpotify size={16} color="#1DB954" />
                      </Anchor>
                    )}
                    {t.youtube_path && (
                      <Anchor
                        href={t.youtube_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        c="dimmed"
                      >
                        <IconBrandYoutube size={16} color="#FF0000" />
                      </Anchor>
                    )}
                    {t.project_id !== projectId && (
                      <Badge size="xs" variant="light" color="teal">
                        Pública
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
        </>
      )}
    </Stack>
  )
}
