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
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { useQuery } from '@tanstack/react-query'
import { IconPlus } from '@tabler/icons-react'
import { searchAvailableTracks, fetchProjectTracks } from '../../queries/setlists'

function formatDuration(seconds) {
  if (!seconds) {
    return null
  }
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function TrackCombobox({ projectId, onSelect, excludeIds = [] }) {
  const combobox = useCombobox()
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Faixas já cadastradas no projeto — exibidas como "pills" de acesso rápido,
  // pra não obrigar o usuário a digitar uma busca só pra achar o próprio catálogo.
  // Usa fetchProjectTracks (não searchAvailableTracks) para não competir com
  // faixas públicas de terceiros pelo limite de resultados.
  const { data: projectTracks = [], isLoading: loadingProjectTracks } = useQuery({
    queryKey: ['project-tracks-quick-add', projectId],
    queryFn: () => fetchProjectTracks(projectId),
    enabled: !!projectId,
  })

  const projectTrackPills = projectTracks.filter((t) => !excludeIds.includes(t.id))

  const fetchTracks = useDebouncedCallback(async (val) => {
    try {
      const data = await searchAvailableTracks(projectId, val)
      setResults(data.filter((t) => !excludeIds.includes(t.id)))
      combobox.openDropdown()
    } finally {
      setSearching(false)
    }
  }, 400)

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

      <Combobox
        store={combobox}
        onOptionSubmit={(val) => {
          const item = results.find((r) => String(r.id) === val)
          if (item) {
            onSelect(item)
            setValue('')
            setResults([])
          }
          combobox.closeDropdown()
        }}
      >
        <Combobox.Target>
          <InputBase
            label="Adicionar faixa"
            placeholder="Buscar por título..."
            value={value}
            onChange={(e) => {
              setValue(e.currentTarget.value)
              setSearching(true)
              fetchTracks(e.currentTarget.value)
            }}
            onFocus={() => {
              if (!results.length) {
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
            {results.length === 0 && (
              <Combobox.Empty>Nenhuma faixa encontrada</Combobox.Empty>
            )}
            {results.map((t) => (
              <Combobox.Option key={t.id} value={String(t.id)}>
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
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </Stack>
  )
}
