import { useState } from 'react'
import {
  Combobox,
  Group,
  Avatar,
  Text,
  InputBase,
  useCombobox,
  Box,
  Loader,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/users/avatars/'

export default function GigRoleCombobox({
  projectId,
  roleId,
  onSelect,
  label = 'Convidar pessoa',
}) {
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() })
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
      if (error) {
        throw error
      }
      return data
    },
    enabled: !!projectId && !!roleId,
  })

  // agrupa por reason e ordena pelo maior priority do grupo
  const groups = data.reduce((acc, item) => {
    if (!acc[item.reason]) {
      acc[item.reason] = []
    }
    acc[item.reason].push(item)
    return acc
  }, {})

  const sortedGroups = Object.entries(groups).sort(([, a], [, b]) => {
    return (b[0]?.priority || 0) - (a[0]?.priority || 0)
  })

  return (
    <Combobox
      store={combobox}
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
          label={label}
          placeholder="Digite nome ou @username..."
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value)
            combobox.openDropdown()
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          rightSection={isFetching ? <Loader size="xs" /> : <Combobox.Chevron />}
          comboboxProps={{ withinPortal: true }}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
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
                {/* {reason} • {profiles.length} */}
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
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
