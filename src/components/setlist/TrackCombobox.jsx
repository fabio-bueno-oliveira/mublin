import { useState } from 'react'
import {
  Combobox,
  InputBase,
  useCombobox,
  Loader,
  Group,
  Text,
  Badge,
  Stack,
  Modal,
  Checkbox,
  Button,
  Avatar,
  Divider,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconBrandSpotify, IconBrandApple } from '@tabler/icons-react'
import { searchAvailableTracks, fetchProjectTracks } from '../../queries/setlists'
import {
  searchExternalTracks,
  createTrackFromExternalResult,
} from '../../queries/trackSearch'

function formatDuration(seconds) {
  if (!seconds) {
    return null
  }
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Badge de origem de cada resultado — só estética, ajuda o usuário a entender
// de onde veio cada sugestão antes de escolher.
function SourceBadge({ source }) {
  if (source === 'spotify') {
    return (
      <Badge
        size="xs"
        variant="light"
        color="green"
        leftSection={<IconBrandSpotify size={11} />}
      >
        Spotify
      </Badge>
    )
  }
  if (source === 'itunes') {
    return (
      <Badge
        size="xs"
        variant="light"
        color="pink"
        leftSection={<IconBrandApple size={11} />}
      >
        iTunes
      </Badge>
    )
  }
  if (source === 'deezer') {
    return (
      <Badge size="xs" variant="light" color="grape">
        Deezer
      </Badge>
    )
  }
  return null
}

export default function TrackCombobox({ projectId, userId, onSelect, excludeIds = [] }) {
  const combobox = useCombobox()
  const queryClient = useQueryClient()

  const [value, setValue] = useState('')
  const [localResults, setLocalResults] = useState([])
  const [externalResults, setExternalResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Resultado externo escolhido, aguardando confirmação (é cover? é pública?)
  // antes de virar uma linha de verdade na tabela tracks.
  const [pendingExternal, setPendingExternal] = useState(null)
  const [pendingIsCover, setPendingIsCover] = useState(true)
  const [pendingIsPublic, setPendingIsPublic] = useState(true)
  const [creatingFromExternal, setCreatingFromExternal] = useState(false)

  // Faixas já cadastradas no projeto — exibidas como "pills" de acesso rápido,
  // pra não obrigar o usuário a digitar uma busca só pra achar o próprio catálogo.
  const { data: projectTracks = [], isLoading: loadingProjectTracks } = useQuery({
    queryKey: ['project-tracks-quick-add', projectId],
    queryFn: () => fetchProjectTracks(projectId),
    enabled: !!projectId,
  })

  const projectTrackPills = projectTracks.filter((t) => !excludeIds.includes(t.id))

  const fetchTracks = useDebouncedCallback(async (val) => {
    try {
      // Busca local (catálogo do próprio Mublin) e externa (Spotify/iTunes/
      // Deezer via nossa function) rodam em paralelo — a local geralmente
      // responde mais rápido e cobre o caso mais comum: alguém já cadastrou
      // essa música antes.
      const [local, external] = await Promise.all([
        searchAvailableTracks(projectId, val),
        searchExternalTracks(val).catch((err) => {
          console.error(err)
          return []
        }),
      ])
      setLocalResults(local.filter((t) => !excludeIds.includes(t.id)))
      setExternalResults(external)
      combobox.openDropdown()
    } finally {
      setSearching(false)
    }
  }, 400)

  function handleOptionSubmit(optionValue) {
    if (optionValue.startsWith('local-')) {
      const id = optionValue.replace('local-', '')
      const item = localResults.find((r) => String(r.id) === id)
      if (item) {
        onSelect(item)
        setValue('')
        setLocalResults([])
        setExternalResults([])
      }
      combobox.closeDropdown()
      return
    }

    // resultado externo: não adiciona direto, abre confirmação primeiro
    const item = externalResults.find(
      (r) => `${r.source}-${r.external_id}` === optionValue,
    )
    if (item) {
      setPendingExternal(item)
      setPendingIsCover(true)
      setPendingIsPublic(true)
    }
    combobox.closeDropdown()
  }

  async function handleConfirmExternal() {
    if (!pendingExternal) {
      return
    }
    setCreatingFromExternal(true)
    try {
      const track = await createTrackFromExternalResult({
        projectId,
        userId,
        result: pendingExternal,
        isCover: pendingIsCover,
        isPublic: pendingIsPublic,
      })
      onSelect(track)
      queryClient.invalidateQueries({ queryKey: ['project-tracks-quick-add', projectId] })
      setPendingExternal(null)
      setValue('')
      setLocalResults([])
      setExternalResults([])
    } catch (err) {
      console.error(err)
      notifications.show({
        title: 'Erro',
        message: err.message || 'Não foi possível cadastrar essa faixa',
        color: 'red',
      })
    } finally {
      setCreatingFromExternal(false)
    }
  }

  return (
    <Stack gap="xs">
      {(loadingProjectTracks || projectTrackPills.length > 0) && (
        <Stack gap={4} mb="xs">
          <Text size="xs" fw={500} c="dimmed">
            Adicionar faixas do projeto à playlist
          </Text>
          <Group gap={6}>
            {loadingProjectTracks && <Loader size="xs" />}
            {!loadingProjectTracks &&
              projectTrackPills.map((t) => (
                <Badge
                  key={t.id}
                  component="button"
                  type="button"
                  onClick={() => onSelect(t)}
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="xl"
                  fw={500}
                  tt="none"
                  leftSection={<IconPlus size={12} />}
                  style={{ cursor: 'pointer' }}
                >
                  {t.title}
                </Badge>
              ))}
          </Group>
        </Stack>
      )}

      <Combobox store={combobox} onOptionSubmit={handleOptionSubmit}>
        <Combobox.Target>
          <InputBase
            label="Adicionar faixa"
            description="Busca no catálogo do Mublin e, se não achar, em Spotify/iTunes/Deezer"
            placeholder="Buscar por título... ex: Smells Like Teen Spirit"
            value={value}
            onChange={(e) => {
              setValue(e.currentTarget.value)
              setSearching(true)
              fetchTracks(e.currentTarget.value)
            }}
            onFocus={() => {
              if (!localResults.length && !externalResults.length) {
                setSearching(true)
                fetchTracks(value)
              }
            }}
            rightSection={searching ? <Loader size="xs" /> : <Combobox.Chevron />}
            disabled={!projectId}
          />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            {localResults.length === 0 && externalResults.length === 0 && (
              <Combobox.Empty>Nenhuma faixa encontrada</Combobox.Empty>
            )}

            {localResults.map((t) => (
              <Combobox.Option key={`local-${t.id}`} value={`local-${t.id}`}>
                <Group justify="space-between" wrap="nowrap" gap="xs">
                  <Text size="sm" lineClamp={1}>
                    {t.title}
                  </Text>
                  <Group gap={6} wrap="nowrap">
                    {formatDuration(t.duration_seconds) && (
                      <Text size="xs" c="dimmed">
                        {formatDuration(t.duration_seconds)}
                      </Text>
                    )}
                    <Badge
                      size="xs"
                      variant="light"
                      color={t.project_id === projectId ? 'indigo' : 'teal'}
                    >
                      {t.project_id === projectId ? 'Do projeto' : 'Pública'}
                    </Badge>
                  </Group>
                </Group>
              </Combobox.Option>
            ))}

            {externalResults.length > 0 && (
              <>
                {localResults.length > 0 && <Divider my={4} label="Catálogos externos" />}
                {externalResults.map((r) => (
                  <Combobox.Option
                    key={`${r.source}-${r.external_id}`}
                    value={`${r.source}-${r.external_id}`}
                  >
                    <Group justify="space-between" wrap="nowrap" gap="xs">
                      <Group gap={8} wrap="nowrap">
                        <Avatar src={r.cover_image} size={24} radius="sm" />
                        <Stack gap={0}>
                          <Text size="sm" lineClamp={1}>
                            {r.title}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {r.artist}
                          </Text>
                        </Stack>
                      </Group>
                      <SourceBadge source={r.source} />
                    </Group>
                  </Combobox.Option>
                ))}
              </>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>

      <Modal
        opened={!!pendingExternal}
        onClose={() => setPendingExternal(null)}
        title="Adicionar faixa ao repertório"
        centered
      >
        {pendingExternal && (
          <Stack gap="sm">
            <Group gap="sm">
              <Avatar src={pendingExternal.cover_image} size={48} radius="sm" />
              <Stack gap={0}>
                <Text fw={600}>{pendingExternal.title}</Text>
                <Text size="sm" c="dimmed">
                  {pendingExternal.artist}
                </Text>
              </Stack>
              <SourceBadge source={pendingExternal.source} />
            </Group>

            <Checkbox
              label="Esta faixa é um cover (não é original do projeto)"
              checked={pendingIsCover}
              onChange={(e) => setPendingIsCover(e.currentTarget.checked)}
            />
            <Checkbox
              label="Tornar esta faixa pública (outros projetos poderão usá-la também)"
              checked={pendingIsPublic}
              onChange={(e) => setPendingIsPublic(e.currentTarget.checked)}
            />

            <Group justify="flex-end" mt="xs">
              <Button variant="default" onClick={() => setPendingExternal(null)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmExternal} loading={creatingFromExternal}>
                Adicionar à setlist
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
