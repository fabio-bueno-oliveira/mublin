import { useState } from 'react'
import {
  Loader,
  Container,
  Title,
  TextInput,
  Button,
  Group,
  Stack,
  Table,
  Modal,
  Switch,
  Select,
  Textarea,
  NumberInput,
  Avatar,
  Badge,
  ActionIcon,
  Pagination,
  Text,
  Paper,
  MultiSelect,
  Tooltip,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure, useDebouncedValue } from '@mantine/hooks'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { supabase } from '../../lib/supabaseClient'
import {
  IconSearch,
  IconPlus,
  IconPencil,
  IconTrash,
  IconCheck,
  IconX,
  IconMicrophone,
  IconUsers,
  IconWorldWww,
  IconBrandInstagram,
  IconBrandSpotify,
  IconBrandYoutube,
} from '@tabler/icons-react'
import slugify from 'slugify'

const ARTISTS_PATH =
  'https://ik.imagekit.io/mublin/artists/tr:h-200,w-200,c-maintain_ratio/'

// ── Queries ─────────────────────────────────────────────────

async function fetchArtists({ queryKey }) {
  const [, search, page] = queryKey
  const from = (page - 1) * 10
  const to = from + 9

  let query = supabase
    .from('artists')
    .select(
      `
      id, name, slug, real_name, picture, is_band, is_active, is_verified,
      founded_year, disbanded_year,
      country:countries ( name ),
      genre:genres!artists_genre_id_fkey ( name ),
      roles:artist_roles (
        id, is_main_role,
        role:roles ( id, name_ptbr, icon )
      )
    `,
      { count: 'exact' },
    )
    .order('name')
    .range(from, to)

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error, count } = await query
  if (error) {
    throw new Error(error.message)
  }

  return { data, count }
}

async function fetchGenres() {
  const { data, error } = await supabase.from('genres').select('id, name').order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data.map((g) => ({ value: String(g.id), label: g.name }))
}

async function fetchCountries() {
  const { data, error } = await supabase
    .from('countries')
    .select('id, name')
    .order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data.map((c) => ({ value: String(c.id), label: c.name }))
}

async function fetchRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name_ptbr, icon')
    .order('name_ptbr')
  if (error) {
    throw new Error(error.message)
  }
  return data.map((r) => ({
    value: String(r.id),
    label: r.name_ptbr,
    icon: r.icon,
  }))
}

async function upsertArtist({ values, roleIds, artistId }) {
  const payload = {
    name: values.name,
    slug: values.slug,
    real_name: values.real_name || null,
    bio: values.bio || null,
    picture: values.picture || null,
    country_id: values.country_id ? parseInt(values.country_id, 10) : null,
    founded_year: values.founded_year || null,
    disbanded_year: values.disbanded_year || null,
    is_band: values.is_band,
    genre_id: values.genre_id ? parseInt(values.genre_id, 10) : null,
    genre_2_id: values.genre_2_id ? parseInt(values.genre_2_id, 10) : null,
    spotify_id: values.spotify_id || null,
    youtube_handle: values.youtube_handle || null,
    instagram: values.instagram || null,
    website: values.website || null,
    apple_music_id: values.apple_music_id || null,
    is_active: values.is_active,
    is_verified: values.is_verified,
    is_active_in_business: values.is_active_in_business,
  }

  let artist
  if (artistId) {
    const { data, error } = await supabase
      .from('artists')
      .update(payload)
      .eq('id', artistId)
      .select('id')
      .single()
    if (error) {
      throw new Error(error.message)
    }
    artist = data
  } else {
    const { data, error } = await supabase
      .from('artists')
      .insert(payload)
      .select('id')
      .single()
    if (error) {
      throw new Error(error.message)
    }
    artist = data
  }

  // Sincroniza roles
  await supabase.from('artist_roles').delete().eq('artist_id', artist.id)

  if (roleIds.length > 0) {
    const { error: rolesError } = await supabase.from('artist_roles').insert(
      roleIds.map((roleId) => ({
        artist_id: artist.id,
        role_id: parseInt(roleId, 10),
        is_main_role: false,
      })),
    )
    if (rolesError) {
      throw new Error(rolesError.message)
    }
  }

  return artist
}

async function deleteArtist(id) {
  const { error } = await supabase.from('artists').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }
}

// ── Component ───────────────────────────────────────────────

export default function AdminArtists() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch] = useDebouncedValue(searchInput, 500)
  const [page, setPage] = useState(1)
  const [opened, { open, close }] = useDisclosure(false)
  const [editingArtist, setEditingArtist] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-artists', debouncedSearch, page],
    queryFn: fetchArtists,
  })

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
  })

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  })

  const form = useForm({
    initialValues: {
      name: '',
      slug: '',
      real_name: '',
      bio: '',
      picture: '',
      country_id: null,
      founded_year: null,
      disbanded_year: null,
      is_band: false,
      genre_id: null,
      genre_2_id: null,
      spotify_id: '',
      youtube_handle: '',
      instagram: '',
      website: '',
      apple_music_id: '',
      is_active: true,
      is_verified: false,
      is_active_in_business: true,
      role_ids: [],
    },
    validate: {
      name: (v) => (!v ? 'Nome obrigatório' : null),
      slug: (v) => (!v ? 'Slug obrigatório' : null),
    },
  })

  const saveMutation = useMutation({
    mutationFn: upsertArtist,
    onSuccess: () => {
      notifications.show({
        color: 'green',
        message: editingArtist ? 'Artista atualizado!' : 'Artista criado!',
        icon: <IconCheck size={18} />,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-artists'] })
      close()
      form.reset()
      setEditingArtist(null)
    },
    onError: (err) => {
      notifications.show({
        color: 'red',
        title: 'Erro',
        message: err.message,
        icon: <IconX size={18} />,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteArtist,
    onSuccess: () => {
      notifications.show({
        color: 'blue',
        message: 'Artista deletado',
      })
      queryClient.invalidateQueries({ queryKey: ['admin-artists'] })
    },
  })

  function handleEdit(artist) {
    setEditingArtist(artist)
    form.setValues({
      name: artist.name,
      slug: artist.slug,
      real_name: artist.real_name || '',
      bio: artist.bio || '',
      picture: artist.picture || '',
      country_id: artist.country_id ? String(artist.country_id) : null,
      founded_year: artist.founded_year,
      disbanded_year: artist.disbanded_year,
      is_band: artist.is_band,
      genre_id: artist.genre_id ? String(artist.genre_id) : null,
      genre_2_id: artist.genre_2_id ? String(artist.genre_2_id) : null,
      spotify_id: artist.spotify_id || '',
      youtube_handle: artist.youtube_handle || '',
      instagram: artist.instagram || '',
      website: artist.website || '',
      apple_music_id: artist.apple_music_id || '',
      is_active: artist.is_active,
      is_verified: artist.is_verified,
      is_active_in_business: artist.is_active_in_business,
      role_ids: artist.roles?.map((r) => String(r.role.id)) || [],
    })
    open()
  }

  function handleNew() {
    setEditingArtist(null)
    form.reset()
    open()
  }

  function handleNameBlur() {
    if (!form.values.slug && form.values.name) {
      const generated = slugify(form.values.name, { lower: true, strict: true })
      form.setFieldValue('slug', generated)
    }
  }

  function handleSubmit(values) {
    saveMutation.mutate({
      values,
      roleIds: values.role_ids,
      artistId: editingArtist?.id,
    })
  }

  const rows = data?.data?.map((artist) => (
    <Table.Tr key={artist.id}>
      <Table.Td>
        <Group gap="sm">
          <Avatar src={ARTISTS_PATH + artist.picture} size="md" radius="xl">
            {artist.name.charAt(0)}
          </Avatar>
          <div>
            <Text fw={500} size="sm">
              {artist.name}
            </Text>
            <Text size="xs" c="dimmed">
              /{artist.slug}
            </Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td>
        {artist.is_band ? (
          <Badge color="grape" variant="light" leftSection={<IconUsers size={12} />}>
            Banda
          </Badge>
        ) : (
          <Badge color="blue" variant="light" leftSection={<IconMicrophone size={12} />}>
            Solo
          </Badge>
        )}
      </Table.Td>
      <Table.Td>
        <Text size="sm">{artist.genre?.name || '—'}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          {artist.roles?.slice(0, 3).map((r) => (
            <Badge key={r.id} size="xs" variant="dot">
              {r.role.name_ptbr}
            </Badge>
          ))}
          {artist.roles?.length > 3 && (
            <Badge size="xs" variant="light">
              +{artist.roles.length - 3}
            </Badge>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          {artist.is_active ? (
            <Badge color="green" size="xs">
              Ativo
            </Badge>
          ) : (
            <Badge color="gray" size="xs">
              Inativo
            </Badge>
          )}
          {artist.is_verified && (
            <Badge color="blue" size="xs">
              Verificado
            </Badge>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap={4}>
          <Tooltip label="Editar">
            <ActionIcon variant="subtle" onClick={() => handleEdit(artist)}>
              <IconPencil size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Deletar">
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={() => deleteMutation.mutate(artist.id)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Artistas</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={handleNew}>
          Novo artista
        </Button>
      </Group>

      <TextInput
        placeholder="Buscar por nome..."
        leftSection={<IconSearch size={16} />}
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.currentTarget.value)
          setPage(1)
        }}
        rightSection={isLoading && <Loader size="xs" />}
        mb="md"
      />

      <Paper withBorder>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Artista</Table.Th>
              <Table.Th>Tipo</Table.Th>
              <Table.Th>Gênero</Table.Th>
              <Table.Th>Roles</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Paper>

      {data?.count > 10 && (
        <Group justify="center" mt="md">
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.ceil(data.count / 10)}
          />
        </Group>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title={editingArtist ? 'Editar artista' : 'Novo artista'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Nome artístico"
              required
              {...form.getInputProps('name')}
              onBlur={handleNameBlur}
            />

            <TextInput
              label="Slug"
              description="URL: /artist/{slug}"
              required
              {...form.getInputProps('slug')}
            />

            <TextInput label="Nome real" {...form.getInputProps('real_name')} />

            <Group grow>
              <Switch
                label="É banda/grupo"
                {...form.getInputProps('is_band', { type: 'checkbox' })}
              />
              <Switch
                label="Ativo"
                {...form.getInputProps('is_active', { type: 'checkbox' })}
              />
              <Switch
                label="Verificado"
                {...form.getInputProps('is_verified', { type: 'checkbox' })}
              />
            </Group>

            <TextInput label="URL da foto" {...form.getInputProps('picture')} />

            <Textarea label="Bio" rows={3} {...form.getInputProps('bio')} />

            <Group grow>
              <Select
                label="País"
                data={countries || []}
                searchable
                clearable
                defaultSearchValue="27"
                {...form.getInputProps('country_id')}
              />
              <NumberInput
                label="Ano de fundação"
                min={1900}
                max={new Date().getFullYear()}
                {...form.getInputProps('founded_year')}
              />
              <NumberInput
                label="Ano de término"
                min={1900}
                max={new Date().getFullYear()}
                {...form.getInputProps('disbanded_year')}
              />
            </Group>

            <Group grow>
              <Select
                label="Gênero principal"
                data={genres || []}
                searchable
                clearable
                {...form.getInputProps('genre_id')}
              />
              <Select
                label="Gênero secundário"
                data={genres || []}
                searchable
                clearable
                {...form.getInputProps('genre_2_id')}
              />
            </Group>

            <MultiSelect
              label="Roles / Funções"
              description="Vocalista, Guitarrista, Baterista, etc"
              data={roles || []}
              searchable
              {...form.getInputProps('role_ids')}
            />

            <Title order={6} mt="md">
              Links externos
            </Title>

            <Group grow>
              <TextInput
                label="Spotify ID"
                leftSection={<IconBrandSpotify size={16} />}
                {...form.getInputProps('spotify_id')}
              />
              <TextInput
                label="Apple Music ID"
                {...form.getInputProps('apple_music_id')}
              />
            </Group>

            <Group grow>
              <TextInput
                label="Instagram"
                leftSection={<IconBrandInstagram size={16} />}
                {...form.getInputProps('instagram')}
              />
              <TextInput
                label="YouTube"
                leftSection={<IconBrandYoutube size={16} />}
                {...form.getInputProps('youtube_handle')}
              />
            </Group>

            <TextInput
              label="Website"
              leftSection={<IconWorldWww size={16} />}
              {...form.getInputProps('website')}
            />

            <Switch
              label="Segue ativo no mercado"
              description="Segue disponível para contratação/shows"
              {...form.getInputProps('is_active_in_business', { type: 'checkbox' })}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={close}>
                Cancelar
              </Button>
              <Button type="submit" loading={saveMutation.isPending}>
                Salvar
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  )
}
