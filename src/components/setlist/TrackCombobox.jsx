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
import { IconPlus } from '@tabler/icons-react'
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

function normalizeText(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * No modelo atual, o artista/projeto responsável pela track
 * é sempre definido por tracks.project_id -> projects.name.
 */
function getMublinTrackArtist(track) {
  return track.projects?.name || ''
}

function hasSimilarDuration(a, b, tolerance = 3) {
  if (!a || !b) {
    return true
  }

  return Math.abs(Number(a) - Number(b)) <= tolerance
}

/**
 * Tenta identificar se um resultado vindo de um catálogo externo
 * já corresponde a uma track existente no Mublin.
 *
 * Prioridade:
 *
 * 1. spotify_id + título
 * 2. título + projeto/artista + duração aproximada
 */
function findMatchingMublinTrack(externalTrack, mublinTracks) {
  const externalTitle = normalizeText(externalTrack.title)
  const externalArtist = normalizeText(externalTrack.artist)

  if (!externalTitle) {
    return null
  }

  // Spotify ID é nosso sinal mais forte.
  if (externalTrack.spotify_id) {
    const spotifyMatch = mublinTracks.find(
      (track) =>
        track.spotify_id &&
        String(track.spotify_id) === String(externalTrack.spotify_id) &&
        normalizeText(track.title) === externalTitle,
    )

    if (spotifyMatch) {
      return spotifyMatch
    }
  }

  // Fallback para iTunes/Deezer ou tracks sem spotify_id.
  const metadataMatch = mublinTracks.find((track) => {
    const localTitle = normalizeText(track.title)
    const localArtist = normalizeText(getMublinTrackArtist(track))

    return (
      localTitle === externalTitle &&
      localArtist &&
      externalArtist &&
      localArtist === externalArtist &&
      hasSimilarDuration(track.duration_seconds, externalTrack.duration_seconds)
    )
  })

  return metadataMatch || null
}

export default function TrackCombobox({ projectId, userId, onSelect, excludeIds = [] }) {
  const combobox = useCombobox()
  const queryClient = useQueryClient()

  const [value, setValue] = useState('')
  const [localResults, setLocalResults] = useState([])
  const [externalResults, setExternalResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Resultado externo escolhido aguardando confirmação
  // antes de virar uma track no catálogo do Mublin.
  const [pendingExternal, setPendingExternal] = useState(null)
  const [pendingIsPublic, setPendingIsPublic] = useState(true)
  const [creatingFromExternal, setCreatingFromExternal] = useState(false)

  // Faixas já cadastradas no projeto.
  // São exibidas como quick-add antes mesmo de uma busca.
  const { data: projectTracks = [], isLoading: loadingProjectTracks } = useQuery({
    queryKey: ['project-tracks-quick-add', projectId],
    queryFn: () => fetchProjectTracks(projectId),
    enabled: !!projectId,
  })

  const projectTrackPills = projectTracks.filter(
    (track) => !excludeIds.includes(track.id),
  )

  const fetchTracks = useDebouncedCallback(async (val) => {
    try {
      // Busca local e externa rodam em paralelo.
      //
      // A busca externa é apenas uma fonte de descoberta.
      // Quando encontramos correspondência no catálogo do Mublin,
      // sempre priorizamos a track já existente.
      const [local, external] = await Promise.all([
        searchAvailableTracks(projectId, val),

        searchExternalTracks(val).catch((err) => {
          console.error(err)
          return []
        }),
      ])

      const availableLocal = local.filter((track) => !excludeIds.includes(track.id))

      const reconciledExternal = external
        .map((externalTrack) => {
          const mublinTrack = findMatchingMublinTrack(externalTrack, local)

          return {
            ...externalTrack,
            mublinTrack,
            alreadyInSetlist: mublinTrack ? excludeIds.includes(mublinTrack.id) : false,
          }
        })
        .filter((externalTrack) => {
          // Se a faixa existe no Mublin e ainda pode ser adicionada,
          // ela já estará sendo exibida em localResults.
          //
          // Portanto, removemos sua duplicata externa da interface.
          if (externalTrack.mublinTrack && !externalTrack.alreadyInSetlist) {
            return false
          }

          return true
        })

      setLocalResults(availableLocal)
      setExternalResults(reconciledExternal)

      combobox.openDropdown()
    } finally {
      setSearching(false)
    }
  }, 400)

  function handleOptionSubmit(optionValue) {
    // ---------------------------------------------
    // TRACK JÁ EXISTENTE NO MUBLIN
    // ---------------------------------------------
    if (optionValue.startsWith('local-')) {
      const id = optionValue.replace('local-', '')

      const item = localResults.find((track) => String(track.id) === id)

      if (item) {
        onSelect(item)

        setValue('')
        setLocalResults([])
        setExternalResults([])
      }

      combobox.closeDropdown()
      return
    }

    // ---------------------------------------------
    // RESULTADO EXTERNO
    // ---------------------------------------------
    const item = externalResults.find(
      (result) => `${result.source}-${result.external_id}` === optionValue,
    )

    if (!item) {
      combobox.closeDropdown()
      return
    }

    // A track já existe no Mublin e também já está
    // presente nesta setlist.
    if (item.mublinTrack && item.alreadyInSetlist) {
      notifications.show({
        title: 'Faixa já adicionada',
        message: 'Essa música já faz parte desta setlist.',
        color: 'blue',
      })

      combobox.closeDropdown()
      return
    }

    // Segurança adicional.
    //
    // Caso algum resultado reconciliado permaneça visível,
    // sempre utilizamos a track existente em vez de criar
    // outra row em tracks.
    if (item.mublinTrack) {
      onSelect(item.mublinTrack)

      setValue('')
      setLocalResults([])
      setExternalResults([])

      combobox.closeDropdown()
      return
    }

    // Não existe no catálogo do Mublin.
    // Abre confirmação antes da importação.
    setPendingExternal(item)
    setPendingIsPublic(true)

    combobox.closeDropdown()
  }

  async function handleConfirmExternal() {
    if (!pendingExternal) {
      return
    }

    setCreatingFromExternal(true)

    try {
      const track = await createTrackFromExternalResult({
        userId,
        result: pendingExternal,
        isPublic: pendingIsPublic,
      })

      onSelect(track)

      queryClient.invalidateQueries({
        queryKey: ['project-tracks-quick-add', projectId],
      })

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
      {/* ---------------------------------------------
          QUICK ADD — FAIXAS DO PRÓPRIO PROJETO
      --------------------------------------------- */}

      {(loadingProjectTracks || projectTrackPills.length > 0) && (
        <Stack gap={4} mb="xs">
          <Text size="xs" fw={500} c="dimmed">
            Adicionar faixas do projeto à playlist
          </Text>

          <Group gap={6}>
            {loadingProjectTracks && <Loader size="xs" />}

            {!loadingProjectTracks &&
              projectTrackPills.map((track) => (
                <Badge
                  key={track.id}
                  component="button"
                  type="button"
                  onClick={() => onSelect(track)}
                  variant="light"
                  color="indigo"
                  size="lg"
                  radius="xl"
                  fw={500}
                  tt="none"
                  leftSection={<IconPlus size={12} />}
                  style={{ cursor: 'pointer' }}
                >
                  {track.title}
                </Badge>
              ))}
          </Group>
        </Stack>
      )}

      {/* ---------------------------------------------
          BUSCA
      --------------------------------------------- */}

      <Combobox store={combobox} onOptionSubmit={handleOptionSubmit}>
        <Combobox.Target>
          <InputBase
            label="Adicionar faixa"
            description="Encontre uma música e adicione à setlist"
            placeholder="Buscar música..."
            value={value}
            onChange={(e) => {
              const nextValue = e.currentTarget.value

              setValue(nextValue)
              setSearching(true)
              fetchTracks(nextValue)
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

            {/* ---------------------------------------
                RESULTADOS DO CATÁLOGO MUBLIN
            --------------------------------------- */}

            {localResults.map((track) => {
              const artist = getMublinTrackArtist(track)

              return (
                <Combobox.Option key={`local-${track.id}`} value={`local-${track.id}`}>
                  <Group justify="space-between" wrap="nowrap" gap="xs">
                    <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                      <Avatar src={track.cover_image} size={32} radius="sm" />

                      <Stack gap={0} style={{ minWidth: 0 }}>
                        <Text size="sm" lineClamp={1}>
                          {track.title}
                        </Text>

                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {artist || 'Faixa do Mublin'}

                          {formatDuration(track.duration_seconds)
                            ? ` · ${formatDuration(track.duration_seconds)}`
                            : ''}
                        </Text>
                      </Stack>
                    </Group>

                    {Number(track.project_id) === Number(projectId) && (
                      <Badge size="xs" variant="light" color="indigo">
                        Do projeto
                      </Badge>
                    )}
                  </Group>
                </Combobox.Option>
              )
            })}

            {/* ---------------------------------------
                OUTROS RESULTADOS
            --------------------------------------- */}

            {externalResults.length > 0 && (
              <>
                {localResults.length > 0 && <Divider my={6} label="Outros resultados" />}

                {externalResults.map((result) => (
                  <Combobox.Option
                    key={`${result.source}-${result.external_id}`}
                    value={`${result.source}-${result.external_id}`}
                  >
                    <Group justify="space-between" wrap="nowrap" gap="xs">
                      <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
                        <Avatar
                          src={result.cover_image || result.mublinTrack?.cover_image}
                          size={32}
                          radius="sm"
                        />

                        <Stack gap={0} style={{ minWidth: 0 }}>
                          <Text size="sm" lineClamp={1}>
                            {result.title}
                          </Text>

                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {result.artist}

                            {formatDuration(result.duration_seconds)
                              ? ` · ${formatDuration(result.duration_seconds)}`
                              : ''}
                          </Text>
                        </Stack>
                      </Group>

                      {result.alreadyInSetlist && (
                        <Badge size="xs" variant="light" color="gray">
                          Na setlist
                        </Badge>
                      )}
                    </Group>
                  </Combobox.Option>
                ))}
              </>
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>

      {/* ---------------------------------------------
          CONFIRMAÇÃO DE IMPORTAÇÃO
      --------------------------------------------- */}

      <Modal
        opened={!!pendingExternal}
        onClose={() => setPendingExternal(null)}
        title="Adicionar música à setlist"
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
            </Group>

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
                Adicionar música
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  )
}
