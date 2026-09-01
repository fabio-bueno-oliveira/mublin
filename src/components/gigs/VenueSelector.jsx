import { useEffect, useState } from 'react'
import { searchVenues, getSuggestedVenuesByProject } from '../../queries/events'
import {
  useCombobox,
  Group,
  Avatar,
  Box,
  Text,
  InputBase,
  Combobox,
  CloseButton,
  Loader,
  UnstyledButton,
  Stack,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { IconMapPin } from '@tabler/icons-react'

const VENUES_PATH = 'https://ik.imagekit.io/mublin/venues/tr:h-96,w-96,c-maintain_ratio/'

export default function VenueSelector({
  selected,
  onSelect,
  onClear,
  relatedProjectId,
  onSelectManual,
  disabled,
  label = 'Local',
}) {
  const combobox = useCombobox()
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchSuggestions() {
      if (!relatedProjectId) {
        setSuggestions([])
        setLoadingSuggestions(false)
        return
      }

      setLoadingSuggestions(true)

      try {
        const data = await getSuggestedVenuesByProject(relatedProjectId)

        if (!cancelled) {
          setSuggestions(data)
        }
      } catch (error) {
        console.error('Erro ao buscar sugestões de venues:', error)

        if (!cancelled) {
          setSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setLoadingSuggestions(false)
        }
      }
    }

    fetchSuggestions()

    return () => {
      cancelled = true
    }
  }, [relatedProjectId])

  const fetchVenues = useDebouncedCallback(async (val) => {
    if (val.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    const data = await searchVenues(val)
    setResults(data)
    combobox.openDropdown()
    setSearching(false)
  }, 500)

  if (selected) {
    return (
      <Box>
        <Text size="sm" fw={500} mb={6}>
          {label}
        </Text>

        <Group
          justify="space-between"
          p="sm"
          style={{
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          <Group gap="sm">
            <Avatar src={`${VENUES_PATH}${selected.picture_url}`} size={48} radius="md">
              <IconMapPin size={20} />
            </Avatar>

            <Box>
              <Text size="sm" fw={600}>
                {selected.name}
              </Text>

              <Text size="xs" c="dimmed">
                {selected.cities?.name}
              </Text>
            </Box>
          </Group>

          <CloseButton
            onClick={() => {
              onClear()
              setValue('')
            }}
            disabled={disabled}
          />
        </Group>
      </Box>
    )
  }

  return (
    <>
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
            label={label}
            placeholder="Buscar local..."
            leftSection={<IconMapPin size={14} />}
            value={value}
            onChange={(e) => {
              setValue(e.currentTarget.value)
              setSearching(true)
              fetchVenues(e.currentTarget.value)
            }}
            rightSection={searching ? <Loader size="xs" /> : <Combobox.Chevron />}
            disabled={disabled}
          />
        </Combobox.Target>
        <Combobox.Dropdown>
          <Combobox.Options>
            {results.map((i) => (
              <Combobox.Option key={i.id} value={String(i.id)}>
                <Group gap="sm" wrap="nowrap">
                  <Avatar src={`${VENUES_PATH}${i.picture_url}`} radius="sm" size={42}>
                    <IconMapPin size={18} />
                  </Avatar>

                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {i.name}
                    </Text>
                    <Text fz="10px" lh={1}>
                      {i.cities?.name}/{i.cities?.regions?.uf}
                    </Text>
                    <Text fz="10px" c="dimmed">
                      {i.type.name}
                    </Text>
                  </Stack>
                </Group>
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
      {!loadingSuggestions && !selected && suggestions.length > 0 && (
        <Box mt="md">
          <Text size="xs" fw={600} c="dimmed" mb="xs">
            LOCAIS USADOS RECENTEMENTE NESTE PROJETO
          </Text>

          <Group gap="xs" wrap="wrap">
            {suggestions.map((suggestion, index) => {
              const isVenue = suggestion.type === 'venue'
              const venue = suggestion.data

              return (
                <UnstyledButton
                  key={isVenue ? `venue-${venue.id}` : `manual-${index}`}
                  onClick={() => {
                    if (isVenue) {
                      onSelect(venue)
                    } else {
                      onSelectManual?.(venue)
                    }
                  }}
                  style={{
                    border: '1px solid var(--mantine-color-default-border)',
                    borderRadius: 'var(--mantine-radius-md)',
                    padding: 8,
                  }}
                >
                  <Group gap="sm" wrap="nowrap">
                    <Avatar
                      src={
                        isVenue && venue.picture_url
                          ? `${VENUES_PATH}${venue.picture_url}`
                          : null
                      }
                      size={38}
                      radius="sm"
                    >
                      <IconMapPin size={16} />
                    </Avatar>

                    <Box>
                      <Text size="xs" fw={600}>
                        {venue.name}
                      </Text>

                      {isVenue && venue.cities?.name && (
                        <Text size="10px" c="dimmed">
                          {venue.cities.name}
                        </Text>
                      )}

                      {!isVenue && (
                        <Text size="10px" c="dimmed">
                          Local informado manualmente
                        </Text>
                      )}
                    </Box>
                  </Group>
                </UnstyledButton>
              )
            })}
          </Group>
        </Box>
      )}
    </>
  )
}
