import { useState } from 'react'
import {
  Combobox,
  InputBase,
  Input,
  ScrollArea,
  useCombobox,
  Box,
  TextInput,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

export default function InternalSearchSelect({
  label,
  placeholder,
  data,
  value,
  onChange,
}) {
  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption()
      setSearch('')
    },
  })

  const [search, setSearch] = useState('')

  const getFilteredData = () => {
    if (!search) return data

    return data
      .map((group) => {
        if (group.group) {
          const filteredItems = group.items.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase()),
          )
          return filteredItems.length > 0 ? { ...group, items: filteredItems } : null
        }
        return group.label.toLowerCase().includes(search.toLowerCase()) ? group : null
      })
      .filter(Boolean)
  }

  const filteredData = getFilteredData()
  const allItems = data.flatMap((g) => g.items || [g])
  const selectedOption = allItems.find((item) => item.value === value)

  const options = filteredData.map((group) => {
    if (group.group) {
      return (
        <Combobox.Group key={group.group} label={group.group}>
          {group.items.map((item) => (
            <Combobox.Option value={item.value} key={item.value}>
              {item.label}
            </Combobox.Option>
          ))}
        </Combobox.Group>
      )
    }
    return (
      <Combobox.Option value={group.value} key={group.value}>
        {group.label}
      </Combobox.Option>
    )
  })

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      position="bottom"
      offset={8}
      middlewares={{ flip: false, shift: false }}
      onOptionSubmit={(val) => {
        onChange(val)
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          rightSection={<Combobox.Chevron />}
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents="none"
          label={label}
        >
          {selectedOption ? (
            selectedOption.label
          ) : (
            <Input.Placeholder>{placeholder}</Input.Placeholder>
          )}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Box p={8}>
          <TextInput
            placeholder="Buscar atividade..."
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            autoFocus
          />
        </Box>
        <Combobox.Options>
          <ScrollArea.Autosize mah={200} type="scroll">
            <div onMouseDown={(e) => e.preventDefault()}>
              {options.length > 0 ? (
                options
              ) : (
                <Combobox.Empty>Nada encontrado</Combobox.Empty>
              )}
            </div>
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
