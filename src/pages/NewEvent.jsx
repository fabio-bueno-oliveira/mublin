import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { upload } from '@imagekit/react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { fetchEventTypes, searchVenues } from '../queries/events'
import {
  Container, Flex, Title, Stack, TextInput, Textarea, Select, Button, Group,
  Switch, NumberInput, Image, ActionIcon, Loader, Text, Box,
  Divider, Combobox, useCombobox, InputBase, CloseButton, SimpleGrid,
  Card, Anchor,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { DatePickerInput, TimeInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import {
  IconCalendar, IconClock, IconPhoto, IconX,
  IconWorld, IconTicket, IconMapPin, IconUsers, IconLock, IconLockOpen
} from '@tabler/icons-react'

// ── Lookup tables ─────────────────────────────────────────

const PRIVACY_TYPES = [
  { value: '1', label: 'Público', description: 'Qualquer pessoa interessada', icon: IconLockOpen },
  { value: '2', label: 'Privado', description: 'Apenas uma comunidade específica', icon: IconLock },
  { value: '3', label: 'Apenas convidados', description: 'Somente quem for convidado', icon: IconUsers },
]

const MIN_AGES = [
  { value: '0',  label: 'Livre' },
  { value: '12', label: '12 anos' },
  { value: '14', label: '14 anos' },
  { value: '16', label: '16 anos' },
  { value: '18', label: '18 anos' },
  { value: '21', label: '21 anos' },
]

const EVENT_PICTURE_PATH = 'https://ik.imagekit.io/mublin/events/tr:w-800/'

// ── Combobox de busca de venue ────────────────────────────

function VenueCombobox({ selected, onSelect, onClear }) {
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() })
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const fetchVenues = useDebouncedCallback(async (val) => {
    if (val.trim().length < 2) { setResults([]); setSearching(false); return }
    try {
      const data = await searchVenues(val)
      setResults(data)
      combobox.openDropdown()
    } finally {
      setSearching(false)
    }
  }, 500)

  function handleChange(val) {
    setValue(val)
    if (val.trim().length < 2) { setResults([]); return }
    setSearching(true)
    fetchVenues(val)
  }

  if (selected) return (
    <Group gap="xs">
      <IconMapPin size={14} color="var(--mantine-color-dimmed)" />
      <Text size="sm" fw={500}>{selected.name}</Text>
      {selected.neighborhood && (
        <Text size="xs" c="dimmed">{selected.neighborhood}</Text>
      )}
      <CloseButton size="sm" onClick={() => { onClear(); setValue('') }} />
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
          placeholder="Buscar local ou casa de shows por nome..."
          leftSection={<IconMapPin size={14} />}
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
              <Text size="sm">{item.name} ({item.cities?.name}, {item.cities?.regions?.name})</Text>
              {(item.neighborhood || item.address) && (
                <Text size="xs" c="dimmed">
                  {[item.neighborhood, item.address].filter(Boolean).join(' · ')}
                </Text>
              )}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

// ── Página principal ──────────────────────────────────────

export default function NewEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const imageInputRef = useRef(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [eventTypeId, setEventTypeId] = useState(null)
  const [privacyType, setPrivacyType] = useState('1')
  const [isOnline, setIsOnline] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [dateStart, setDateStart] = useState(null)
  const [dateEnd, setDateEnd] = useState(null)
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [isFree, setIsFree] = useState(true)
  const [ticketPrice, setTicketPrice] = useState('')
  const [ticketsUrl, setTicketsUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [minAge, setMinAge] = useState('16')

  // Image state
  const [pictureFileName, setPictureFileName] = useState('')
  const [pictureFileId, setPictureFileId] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  const { data: eventTypes = [], isLoading: loadingEventTypes } = useQuery({
    queryKey: ['event-types'],
    queryFn: fetchEventTypes,
    staleTime: Infinity,
  })

  // ── Upload de imagem ────────────────────────────────────

  async function handleImageUpload(file) {
    if (!file) return
    setIsUploadingImage(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const authRes = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      const { token: ikToken, expire, signature } = await authRes.json()
      const response = await upload({
        file,
        fileName: `${user.id}_event`,
        folder: '/events/',
        tags: ['event'],
        useUniqueFileName: true,
        publicKey:   import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
        token: ikToken, expire, signature,
      })
      const n = response.filePath.lastIndexOf('/')
      const fileName = response.filePath.substring(n + 1)
      setPictureFileId(response.fileId)
      setPictureFileName(fileName)
    } catch {
      notifications.show({ color: 'red', position: 'top-center', message: 'Erro ao enviar imagem. Tente novamente.' })
    } finally {
      setIsUploadingImage(false)
    }
  }

  async function handleRemoveImage() {
    if (!pictureFileId) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/imagekit-manage`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ fileId: pictureFileId }),
        }
      )
      if (!response.ok) throw new Error('Erro ao deletar no servidor')
      setPictureFileName('')
      setPictureFileId('')
      if (imageInputRef.current) imageInputRef.current.value = ''
    } catch {
      notifications.show({ color: 'red', position: 'top-center', message: 'Erro ao remover imagem. Tente novamente.' })
    }
  }

  // ── Submit ──────────────────────────────────────────────

  async function handleSubmit() {
    if (!name.trim()) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Informe o nome do evento.' })
      return
    }
    if (!eventTypeId) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Selecione o tipo de evento.' })
      return
    }
    if (!dateStart) {
      notifications.show({ color: 'red', position: 'top-center', message: 'Informe a data de início.' })
      return
    }

    setSubmitting(true)

    const formatDate = (d) => d ? d.toISOString().split('T')[0] : null

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      event_type_id: Number(eventTypeId),
      privacy_type: Number(privacyType),
      is_online: isOnline,
      venue_id: selectedVenue?.id ?? null,
      date_start: formatDate(dateStart),
      date_end: formatDate(dateEnd),
      time_event_start: timeStart || null,
      time_event_end: timeEnd || null,
      is_free: isFree,
      ticket_price: isFree ? 0 : (Number(ticketPrice) || 0),
      tickets_url: ticketsUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      min_age: Number(minAge),
      picture_url: pictureFileName || null,
      author_id: user.id,
      updated_by: user.id,
    }

    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      notifications.show({ color: 'red', title: 'Ops...', message: 'Não foi possível criar o evento. Tente novamente.', position: 'top-center' })
      setSubmitting(false)
      return
    }

    notifications.show({ color: 'green', message: 'Evento criado com sucesso!', position: 'top-center' })
    navigate(`/events/${data.id}`)
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <Container size="sm" py="md" px={{ base: 'md', sm: 'lg' }}>
      <Title order={1} fz="h3" fw={600} lts="-0.02em" mb="lg">
        Cadastrar novo evento
      </Title>

      <Stack gap="sm">

        {/* Imagem de capa */}
        <Box>
          <Text size="xs" c="dimmed" fw={500} mb={6}>
            <IconPhoto size={16} stroke={1.4} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Imagem de capa
          </Text>
          {pictureFileName ? (
            <Box style={{ position: 'relative', display: 'inline-block' }}>
              <Image
                src={`${EVENT_PICTURE_PATH}${pictureFileName}`}
                radius="md"
                maw={500}
                mah={280}
                fit="cover"
              />
              <ActionIcon
                color="red"
                variant="filled"
                size="sm"
                radius="xl"
                style={{ position: 'absolute', top: 6, right: 6 }}
                onClick={handleRemoveImage}
              >
                <IconX size={12} />
              </ActionIcon>
            </Box>
          ) : (
            <Button
              variant="default"
              size="sm"
              leftSection={isUploadingImage ? <Loader size={13} /> : <IconPhoto size={14} />}
              component="label"
              htmlFor="event-image-input"
              disabled={isUploadingImage}
            >
              {isUploadingImage ? 'Enviando...' : 'Adicionar imagem de capa'}
            </Button>
          )}
          <input
            ref={imageInputRef}
            id="event-image-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]) }}
          />
        </Box>

        <Divider />

        {/* Nome e tipo */}
        <TextInput
          label="Nome do evento"
          placeholder="Ex: Show de lançamento do álbum"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Select
          label="Tipo de evento"
          placeholder="Selecione..."
          required
          data={eventTypes}
          value={eventTypeId}
          onChange={setEventTypeId}
          disabled={loadingEventTypes}
          rightSection={loadingEventTypes ? <Loader size="xs" /> : undefined}
        />

        <Textarea
          label="Descrição"
          placeholder="Fale sobre o evento, atrações, programação..."
          minRows={3}
          autosize
          maxRows={8}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Divider label="Data e hora" labelPosition="left" />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <DatePickerInput
            label="Data de início"
            placeholder="Selecione..."
            required
            leftSection={<IconCalendar size={14} />}
            value={dateStart}
            onChange={setDateStart}
            minDate={new Date()}
          />
          <DatePickerInput
            label="Data de fim"
            placeholder="Selecione..."
            leftSection={<IconCalendar size={14} />}
            value={dateEnd}
            onChange={setDateEnd}
            minDate={dateStart ?? new Date()}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <TimeInput
            label="Horário de início"
            leftSection={<IconClock size={14} />}
            value={timeStart}
            onChange={(e) => setTimeStart(e.target.value)}
          />
          <TimeInput
            label="Horário de fim"
            leftSection={<IconClock size={14} />}
            value={timeEnd}
            onChange={(e) => setTimeEnd(e.target.value)}
          />
        </SimpleGrid>

        <Divider label="Local" labelPosition="left" />

        <Switch
          label="Evento online"
          description="O evento acontece remotamente ou por streaming"
          checked={isOnline}
          onChange={(e) => {
            setIsOnline(e.currentTarget.checked)
            if (e.currentTarget.checked) setSelectedVenue(null)
          }}
        />

        {!isOnline && (
          <Box>
            <Group mb={4} gap={10}>
              <Text size="sm" fw={500}>Local ou Estabelecimento</Text>
              <Link to="/new/venue" className="noDecoration">
                <Text size="sm" fw={500}>
                  Não encontrou? Cadastrar novo
                </Text>
              </Link>
            </Group>
            <VenueCombobox
              selected={selectedVenue}
              onSelect={setSelectedVenue}
              onClear={() => setSelectedVenue(null)}
            />
          </Box>
        )}

        <Divider label="Ingressos" labelPosition="left" />

        <Switch
          label="Evento gratuito"
          checked={isFree}
          onChange={(e) => {
            setIsFree(e.currentTarget.checked)
            if (e.currentTarget.checked) setTicketPrice('')
          }}
        />

        {!isFree && (
          <NumberInput
            label="Valor do ingresso (R$)"
            placeholder="0,00"
            min={0}
            decimalScale={2}
            fixedDecimalScale
            leftSection={<IconTicket size={14} />}
            value={ticketPrice}
            onChange={setTicketPrice}
          />
        )}

        <TextInput
          label="Link para ingressos"
          placeholder="https://..."
          leftSection={<IconTicket size={14} />}
          value={ticketsUrl}
          onChange={(e) => setTicketsUrl(e.target.value)}
        />

        <Divider label="Configurações" labelPosition="left" />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Select
            label="Idade mínima"
            data={MIN_AGES}
            value={minAge}
            onChange={(v) => setMinAge(v ?? '16')}
          />
          <TextInput
            label="Website do evento"
            placeholder="https://..."
            leftSection={<IconWorld size={14} />}
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
        </SimpleGrid>

        {/* Privacidade */}
        <Box>
          <Text size="sm" fw={500} mb={8}>Privacidade</Text>
          <Stack gap="xs">
            {PRIVACY_TYPES.map(({ value, label, description, icon: Icon }) => ( // eslint-disable-line
              <Card
                key={value}
                padding="sm"
                withBorder
                orientation="horizontal"
                style={(theme) => ({
                  border: `1px solid ${privacyType === value ? theme.colors.violet[5] : theme.colors.gray[3]}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                })}
                onClick={() => setPrivacyType(value)}
              >
                <Card.Section inheritPadding px="xs" withBorder>
                  <Flex h="100%" align="center">
                    <Icon
                      size={18}
                      stroke={1.5}
                      color={
                        privacyType === value 
                          ? 'var(--mantine-color-violet-6)' 
                          : 'var(--mantine-color-dimmed)'
                      } 
                    />
                  </Flex>
                </Card.Section>
                <Card.Section inheritPadding px="xs" withBorder>
                  <Box>
                    <Text size="sm" fw={500}>{label}</Text>
                    <Text size="xs" c="dimmed">{description}</Text>
                  </Box>
                </Card.Section>
              </Card>
            ))}
          </Stack>
        </Box>

        <Divider />

        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            loading={submitting}
            onClick={handleSubmit}
          >
            Criar evento
          </Button>
        </Group>

      </Stack>
    </Container>
  )
}
