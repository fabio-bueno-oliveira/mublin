import { useState } from 'react'
import {
  Combobox,
  Group,
  Avatar,
  Text,
  InputBase,
  Input,
  useCombobox,
  Box,
  Loader,
  TextInput,
  ScrollArea,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { IconSearch } from '@tabler/icons-react'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/users/avatars/'

export default function GigRoleCombobox({
  projectId,
  roleId,
  onSelect,
  label = 'Convidar pessoa',
}) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 350)

  const { data = [], isFetching } = useQuery({
    queryKey: ['gig-role-search', projectId, roleId, debouncedSearch],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_profiles_for_gig_role', {
        p_project_id: projectId,
        p_role_id: roleId,
        p_search: debouncedSearch || '',
      })
      if (error) throw error
      return data
    },
    enabled: !!projectId && !!roleId,
  })

  const groups = data.reduce((acc, item) => {
    if (!acc[item.reason]) acc[item.reason] = []
    acc[item.reason].push(item)
    return acc
  }, {})

  const sortedGroups = Object.entries(groups).sort(([, a], [, b]) => {
    return (b[0]?.priority || 0) - (a[0]?.priority || 0)
  })

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      position="bottom"
      offset={8}
      middlewares={{ flip: false, shift: false }}
      onOptionSubmit={(val) => {
        const profile = data.find((d) => d.profile_id === val)
        if (profile) {
          onSelect(profile)
          setSearch('')
        }
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          label={label}
          onClick={() => combobox.toggleDropdown()}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
        >
          <Input.Placeholder>Buscar músico por nome ou @</Input.Placeholder>
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        {/* ÁREA DE BUSCA - SEM preventDefault aqui */}
        <Box p={8}>
          <TextInput
            placeholder="Digite nome ou @username"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            rightSection={isFetching ? <Loader size={12} /> : null}
            autoFocus
          />
        </Box>

        {/* AQUI SIM, o preventDefault, pra lista não roubar o foco da busca */}
        <Combobox.Options>
          <ScrollArea.Autosize mah={280} type="scroll">
            <div onMouseDown={(e) => e.preventDefault()}>
              {data.length === 0 && !isFetching && (
                <Combobox.Empty>Nenhum músico encontrado</Combobox.Empty>
              )}
              {sortedGroups.map(([reason, profiles]) => (
                <Box key={reason}>
                  <Text
                    size="10px"
                    c="dimmed"
                    fw={700}
                    tt="uppercase"
                    px="sm"
                    py={4}
                    style={{
                      background:
                        'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))',
                    }}
                  >
                    {reason}
                  </Text>
                  {profiles.map((p) => (
                    <Combobox.Option key={p.profile_id} value={p.profile_id}>
                      <Group gap="xs" wrap="nowrap">
                        <Avatar
                          src={p.avatar ? `${AVATAR_PATH}tr:h-60,w-60/${p.avatar}` : null}
                          size={34}
                          radius="xl"
                        >
                          {p.full_name?.[0]}
                        </Avatar>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {p.full_name}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            @{p.username}
                          </Text>
                        </Box>
                      </Group>
                    </Combobox.Option>
                  ))}
                </Box>
              ))}
            </div>
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
