import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import {
  Container, Stack, Title, Textarea, Button, Group,
  Avatar, Select, Text, Card, Combobox, useCombobox,
  InputBase, Loader, CloseButton, Anchor,
  Divider, TextInput, Box, Badge, ActionIcon
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconMicrophone2, IconBox,
  IconLink, IconPhoto, IconX
} from '@tabler/icons-react'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'
const PROJECT_PATH = 'https://ik.imagekit.io/mublin/projects/tr:h-100,w-100,c-maintain_ratio/'

// ── Busca de gigs ─────────────────────────────────────────
async function searchGigs(keyword) {
  const { data, error } = await supabase
    .from('gigs')
    .select('id, title, slug, has_remuneration')
    .ilike('title', `%${keyword}%`)
    .eq('active', true)
    .limit(8)
  if (error) throw new Error(error.message)
  return data
}

// ── Busca de produtos ─────────────────────────────────────
async function searchProducts(keyword) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, picture, brands(name)')
    .ilike('name', `%${keyword}%`)
    .limit(8)
  if (error) throw new Error(error.message)
  return data
}

// ── Combobox de busca genérico ────────────────────────────
function SearchCombobox({ onSelect, searchFn, placeholder, renderOption, renderSelected, selected, onClear }) {
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() })
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  async function handleChange(val) {
    setValue(val)
    if (val.trim().length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const data = await searchFn(val)
      setResults(data)
      combobox.openDropdown()
    } finally {
      setSearching(false)
    }
  }

  if (selected) return (
    <Group gap="xs">
      {renderSelected(selected)}
      <CloseButton size="sm" onClick={onClear} />
    </Group>
  )

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={(val) => {
        const item = results.find(r => String(r.id) === val)
        if (item) { onSelect(item); setValue(''); setResults([]) }
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target>
        <InputBase
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && combobox.openDropdown()}
          rightSection={searching ? <Loader size="xs" /> : <Combobox.Chevron />}
          rightSectionPointerEvents="none"
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {results.length === 0 && !searching && (
            <Combobox.Empty>Nenhum resultado</Combobox.Empty>
          )}
          {results.map(item => (
            <Combobox.Option key={item.id} value={String(item.id)}>
              {renderOption(item)}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

// ── Página principal ──────────────────────────────────────
export default function NewPost() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()

  const [body, setBody] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [authorType, setAuthorType] = useState('profile') // 'profile' | 'project'
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [linkedGig, setLinkedGig] = useState(null)
  const [linkedProduct, setLinkedProduct] = useState(null)
  const [showVideoField, setShowVideoField] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { data: savedProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-home-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const userProjects = savedProjects
    .filter(r => r.status === 2) // apenas membros ativos
    .map(r => ({
      value: String(r.projects.id),
      label: r.projects.name + " (projeto)",
      slug: r.projects.slug,
      picture: r.projects.picture,
    }))

  const selectedProject = userProjects.find(p => p.value === selectedProjectId)

  async function handleSubmit() {
    if (!body.trim()) {
      notifications.show({ color: 'red', message: 'Escreva algo antes de publicar.', position: 'top-center' })
      return
    }

    setSubmitting(true)

    const payload = {
      body: body.trim(),
      video_url: videoUrl.trim() || null,
      author_profile_id: authorType === 'profile' ? user.id : null,
      author_project_id: authorType === 'project' && selectedProjectId ? Number(selectedProjectId) : null,
      linked_gig_id: linkedGig?.id ?? null,
      linked_product_id: linkedProduct?.id ?? null,
    }

    const { error } = await supabase.from('feed').insert(payload)

    if (error) {
      notifications.show({ color: 'red', title: 'Ops...', message: 'Não foi possível publicar. Tente novamente.', position: 'top-center' })
      setSubmitting(false)
      return
    }

    notifications.show({ color: 'green', message: 'Post publicado!', position: 'top-center' })
    navigate('/home')
  }

  return (
    <Container size="sm" py="md">
      <Group mb="md" justify="space-between">
        <Title order={2} fz="h3" fw={700} lts="-0.02em">
          Nova postagem
        </Title>
        <Anchor component={Link} to="/home" c="dimmed" size="sm">
          Cancelar
        </Anchor>
      </Group>

      <Card shadow="sm" padding="lg" radius="md" withBorder bg="transparent">
        <Stack gap="md">

          {/* Autor */}
          <Group gap="sm">
            {authorType === 'profile' || !selectedProject ? (
              <Avatar
                size={40}
                radius="xl"
                src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
              />
            ) : (
              <Avatar
                size={40}
                radius="md"
                src={selectedProject.picture ? PROJECT_PATH + selectedProject.picture : undefined}
              />
            )}
            <Stack gap={4}>
              <Text size="xs" c="dimmed">Postando como</Text>
              <Select
                size="xs"
                radius="xl"
                variant="filled"
                value={authorType === 'profile' ? 'profile' : selectedProjectId}
                onChange={(val) => {
                  if (val === 'profile') {
                    setAuthorType('profile')
                    setSelectedProjectId(null)
                  } else {
                    setAuthorType('project')
                    setSelectedProjectId(val)
                  }
                }}
                data={[
                  { value: 'profile', label: profile?.full_name ? profile?.full_name + ' (perfil)' : 'Meu perfil' },
                  ...userProjects,
                ]}
                disabled={loadingProjects}
                w={220}
              />
            </Stack>
          </Group>

          <Divider />

          {/* Corpo do post */}
          <Textarea
            placeholder="O que você quer compartilhar?"
            minRows={4}
            autosize
            maxRows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            variant="transparent"
            styles={{ input: { border: 'none', padding: 0, fontSize: '0.95rem' } }}
          />

          {/* Gig vinculada */}
          <Box>
            <Text size="xs" c="dimmed" fw={500} mb={6}>
              <IconMicrophone2 size={16} stroke={1.4} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Vincular gig
            </Text>
            <SearchCombobox
              searchFn={searchGigs}
              placeholder="Buscar gig por título..."
              onSelect={setLinkedGig}
              onClear={() => setLinkedGig(null)}
              selected={linkedGig}
              renderOption={(item) => (
                <Group gap="xs">
                  <Text size="sm">{item.title}</Text>
                  {item.has_remuneration && <Badge size="xs" color="green" variant="light">Remunerada</Badge>}
                </Group>
              )}
              renderSelected={(item) => (
                <Group gap="xs">
                  <Avatar size={24} radius="md" color="violet" variant="light">
                    <IconMicrophone2 size={12} />
                  </Avatar>
                  <Text size="sm" fw={500}>{item.title}</Text>
                  {item.has_remuneration && <Badge size="xs" color="green" variant="light">Remunerada</Badge>}
                </Group>
              )}
            />
          </Box>

          {/* Produto vinculado */}
          <Box>
            <Text size="xs" c="dimmed" fw={500} mb={6}>
              <IconBox size={16} stroke={1.4} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Vincular equipamento
            </Text>
            <SearchCombobox
              searchFn={searchProducts}
              placeholder="Buscar equipamento por nome..."
              onSelect={setLinkedProduct}
              onClear={() => setLinkedProduct(null)}
              selected={linkedProduct}
              renderOption={(item) => (
                <Text size="sm">{item.brands?.name} {item.name}</Text>
              )}
              renderSelected={(item) => (
                <Text size="sm" fw={500}>{item.brands?.name} {item.name}</Text>
              )}
            />
          </Box>

          {/* Vídeo */}
          <Box>
            {!showVideoField ? (
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={<IconLink size={13} />}
                onClick={() => setShowVideoField(true)}
              >
                Adicionar link de vídeo
              </Button>
            ) : (
              <Group gap="xs" align="flex-end">
                <TextInput
                  flex={1}
                  size="xs"
                  placeholder="https://youtube.com/..."
                  leftSection={<IconLink size={13} />}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => { setShowVideoField(false); setVideoUrl('') }}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            )}
          </Box>

          {/* Imagem — placeholder */}
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            leftSection={<IconPhoto size={13} />}
            disabled
          >
            Adicionar imagem (em breve)
          </Button>

          <Divider />

          {/* Publicar */}
          <Group justify="flex-end">
            <Text size="xs" c="dimmed">{body.length} caracteres</Text>
            <Button
              color="indigo"
              radius="xl"
              size="sm"
              fw={700}
              loading={submitting}
              onClick={handleSubmit}
              disabled={!body.trim()}
            >
              Publicar
            </Button>
          </Group>

        </Stack>
      </Card>
    </Container>
  )
}
