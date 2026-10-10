import { useState } from 'react'
import { useCombobox, Combobox, InputBase, Group, Text, CloseButton } from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { searchEvents } from '../queries/search'

export default function EventCombobox({ selected, onSelect, onClear, isPastGig }) {
  const combobox = useCombobox()
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const fetch = useDebouncedCallback(async (val) => {
    if (val.length < 2) {
      return
    }
    const data = await searchEvents(val)
    setResults(data)
    combobox.openDropdown()
  }, 400)
  if (selected) {
    return (
      <Group gap="xs">
        <Text size="md" fw={600}>
          Evento: {selected.name}
        </Text>
        <CloseButton size="sm" onClick={onClear} />
      </Group>
    )
  }
  return (
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
          label={isPastGig ? 'Foi em um evento' : 'Será em um evento'}
          placeholder="Digite o nome do evento..."
          value={value}
          onChange={(e) => {
            setValue(e.currentTarget.value)
            fetch(e.currentTarget.value)
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {value.length >= 2 && results.length === 0 ? (
            <Combobox.Empty>Nenhum evento encontrado</Combobox.Empty>
          ) : (
            results.map((i) => (
              <Combobox.Option key={i.id} value={String(i.id)}>
                {i.name}
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
