import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { upload } from '@imagekit/react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import { fetchEventTypes, searchVenues } from '../queries/events'
import {
  Container,
  Flex,
  Title,
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Switch,
  Radio,
  NumberInput,
  Image,
  ActionIcon,
  Loader,
  Text,
  Box,
  Divider,
  Combobox,
  useCombobox,
  InputBase,
  CloseButton,
  SimpleGrid,
  Card,
} from '@mantine/core'
import { useDebouncedCallback } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { DatePickerInput, TimeInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import {
  IconCalendar,
  IconClock,
  IconPhoto,
  IconX,
  IconWorld,
  IconTicket,
  IconMapPin,
  IconUsers,
  IconLock,
  IconLockOpen,
} from '@tabler/icons-react'

const PRIVACY_TYPES = [
  {
    value: '1',
    label: 'Público',
    description: 'Qualquer pessoa interessada',
    icon: IconLockOpen,
  },
  {
    value: '2',
    label: 'Privado',
    description: 'Apenas uma comunidade específica',
    icon: IconLock,
  },
  {
    value: '3',
    label: 'Apenas convidados',
    description: 'Somente quem for convidado',
    icon: IconUsers,
  },
]

const MIN_AGES = [
  { value: '0', label: 'Livre' },
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
    if (val.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
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
    if (val.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    fetchVenues(val)
  }

  if (selected) {
    return (
      <Group gap="xs" mt="sm">
        <IconMapPin size={14} color="var(--mantine-color-dimmed)" />
        <Text size="sm" fw={500}>
          {selected.name}
        </Text>
        {selected.neighborhood && (
          <Text size="xs" c="dimmed">
            {selected.neighborhood} - {selected.cities?.name},{' '}
            {selected.cities?.regions?.uf ?? selected.cities?.regions?.name}
          </Text>
        )}
        <CloseButton
          size="sm"
          onClick={() => {
            onClear()
            setValue('')
          }}
        />
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
          {results.map((item) => (
            <Combobox.Option key={item.id} value={String(item.id)}>
              <Text size="sm">
                {item.name} ({item.cities?.name}, {item.cities?.regions?.name})
              </Text>
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

  // Form state (useForm do @mantine/form)
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      name: '',
      description: '',
      eventTypeId: null,
      privacyType: '1',
      isOnline: false,
      venue: null,
      dateStart: null,
      dateEnd: null,
      timeStart: '',
      timeEnd: '',
      isFree: true,
      ticketPrice: '',
      ticketsUrl: '',
      websiteUrl: '',
      minAge: '16',
      has_food_options: false,
      has_meet_and_greet: false,
    },
    validate: {
      name: (value) => (value.trim().length === 0 ? 'Informe o nome do evento.' : null),
      eventTypeId: (value) => (!value ? 'Selecione o tipo de evento.' : null),
      dateStart: (value) => (!value ? 'Informe a data de início.' : null),
    },
  })

  // Image state (gerenciado separadamente do form, fora do fluxo de validação)
  const [pictureFileName, setPictureFileName] = useState('')
  const [pictureFileId, setPictureFileId] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const { data: eventTypes = [], isLoading: loadingEventTypes } = useQuery({
    queryKey: ['event-types'],
    queryFn: fetchEventTypes,
    staleTime: Infinity,
  })

  // ── Upload de imagem ────────────────────────────────────

  async function handleImageUpload(file) {
    if (!file) {
      return
    }
    setIsUploadingImage(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
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
        publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
        token: ikToken,
        expire,
        signature,
      })
      const n = response.filePath.lastIndexOf('/')
      const fileName = response.filePath.substring(n + 1)
      setPictureFileId(response.fileId)
      setPictureFileName(fileName)
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao enviar imagem. Tente novamente.',
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  async function handleRemoveImage() {
    if (!pictureFileId) {
      return
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/imagekit-manage`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ fileId: pictureFileId }),
        },
      )
      if (!response.ok) {
        throw new Error('Erro ao deletar no servidor')
      }
      setPictureFileName('')
      setPictureFileId('')
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    } catch {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover imagem. Tente novamente.',
      })
    }
  }

  // ── Submit ──────────────────────────────────────────────

  function handleValidationFailure() {
    notifications.show({
      color: 'red',
      position: 'top-center',
      message: 'Verifique os campos destacados antes de continuar.',
    })
  }

  async function handleSubmit(values) {
    const formatDate = (d) => (d ? new Date(d).toISOString().split('T')[0] : null)

    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      event_type_id: Number(values.eventTypeId),
      privacy_type: Number(values.privacyType),
      is_online: values.isOnline,
      venue_id: values.venue?.id ?? null,
      date_start: formatDate(values.dateStart),
      date_end: formatDate(values.dateEnd),
      time_event_start: values.timeStart || null,
      time_event_end: values.timeEnd || null,
      is_free: values.isFree,
      ticket_price: values.isFree ? 0 : Number(values.ticketPrice) || 0,
      tickets_url: values.ticketsUrl.trim() || null,
      website_url: values.websiteUrl.trim() || null,
      min_age: Number(values.minAge),
      picture_url: pictureFileName || null,
      author_id: user.id,
      updated_by: user.id,
      has_food_options: values.has_food_options,
      has_meet_and_greet: values.has_meet_and_greet,
    }

    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select('id, slug')
      .single()

    if (error) {
      notifications.show({
        color: 'red',
        title: 'Ops...',
        message: 'Não foi possível criar o evento. Tente novamente.',
        position: 'top-center',
      })
      return
    }

    const { data: event } = await supabase
      .from('events')
      .select('id, slug')
      .eq('id', inserted.id)
      .single()

    notifications.show({
      color: 'green',
      message: 'Evento criado com sucesso!',
      position: 'top-center',
    })

    navigate(`/event/${event.slug}`)
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <Container size="sm" py="md" px={{ base: 'md', sm: 'lg' }}>
      <Title order={1} fz="h3" fw={600} mb="lg">
        Cadastrar novo evento
      </Title>

      <Stack gap="sm">
        {/* Imagem representativa do evento a ser criado */}
        <Box>
          {pictureFileName ? (
            <Box style={{ position: 'relative', display: 'inline-block' }}>
              <Image
                src={`${EVENT_PICTURE_PATH}${pictureFileName}`}
                radius="md"
                maw={200}
                mah={180}
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
              variant="outline"
              size="sm"
              leftSection={
                isUploadingImage ? <Loader size={13} /> : <IconPhoto size={14} />
              }
              component="label"
              htmlFor="event-image-input"
              disabled={isUploadingImage}
            >
              {isUploadingImage ? 'Enviando...' : 'Adicionar imagem do evento'}
            </Button>
          )}
          <input
            ref={imageInputRef}
            id="event-image-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleImageUpload(e.target.files[0])
              }
            }}
          />
        </Box>

        {/* Nome e tipo */}
        <TextInput
          label="Nome do evento"
          placeholder="Ex: Show de lançamento do álbum"
          required
          {...form.getInputProps('name')}
        />

        <Select
          label="Tipo de evento"
          placeholder="Selecione..."
          required
          data={eventTypes}
          disabled={loadingEventTypes}
          rightSection={loadingEventTypes ? <Loader size="xs" /> : undefined}
          {...form.getInputProps('eventTypeId')}
        />

        <Textarea
          label="Descrição"
          placeholder="Fale sobre o evento, atrações, programação..."
          minRows={3}
          autosize
          maxRows={8}
          {...form.getInputProps('description')}
        />

        <Divider label="Data e hora" labelPosition="left" />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <DatePickerInput
            label="Data de início"
            placeholder="Selecione..."
            required
            leftSection={<IconCalendar size={14} />}
            minDate={new Date()}
            {...form.getInputProps('dateStart')}
          />
          <DatePickerInput
            label="Data de fim"
            placeholder="Selecione..."
            leftSection={<IconCalendar size={14} />}
            minDate={form.values.dateStart ?? new Date()}
            {...form.getInputProps('dateEnd')}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <TimeInput
            label="Horário de início"
            leftSection={<IconClock size={14} />}
            {...form.getInputProps('timeStart')}
          />
          <TimeInput
            label="Horário de fim"
            leftSection={<IconClock size={14} />}
            {...form.getInputProps('timeEnd')}
          />
        </SimpleGrid>

        <Divider label="Local" labelPosition="left" />

        <Radio.Group
          value={form.values.isOnline ? 'online' : 'presencial'}
          onChange={(value) => {
            const checked = value === 'online'
            form.setFieldValue('isOnline', checked)
            if (checked) {
              form.setFieldValue('venue', null)
            }
          }}
        >
          <Group gap="lg">
            <Radio value="presencial" label="Evento presencial" />
            <Radio value="online" label="Evento online" />
          </Group>
        </Radio.Group>

        {!form.values.isOnline && (
          <Box>
            <Group mb={4} gap={10}>
              <Text size="sm" fw={500}>
                Local ou Estabelecimento
              </Text>
              <Link to="/new/venue" className="noDecoration">
                <Text size="sm" fw={500}>
                  Não encontrou? Cadastrar novo
                </Text>
              </Link>
            </Group>
            <VenueCombobox
              selected={form.values.venue}
              onSelect={(item) => form.setFieldValue('venue', item)}
              onClear={() => form.setFieldValue('venue', null)}
            />
          </Box>
        )}

        <Divider label="Recursos do evento" labelPosition="left" />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Switch
            label="Oferece opções de alimentação"
            description="Food truck, restaurante, praça de alimentação"
            {...form.getInputProps('has_food_options', { type: 'checkbox' })}
          />
          <Switch
            label="Terá Meet & Greet"
            description="Encontro com artistas/convidados"
            {...form.getInputProps('has_meet_and_greet', { type: 'checkbox' })}
          />
        </SimpleGrid>

        <Divider label="Ingressos" labelPosition="left" />

        <Switch
          label="Evento gratuito"
          checked={form.values.isFree}
          onChange={(e) => {
            const checked = e.currentTarget.checked
            form.setFieldValue('isFree', checked)
            if (checked) {
              form.setFieldValue('ticketPrice', '')
            }
          }}
        />

        {!form.values.isFree && (
          <NumberInput
            label="Valor do ingresso (R$)"
            placeholder="0,00"
            min={0}
            decimalScale={2}
            fixedDecimalScale
            leftSection={<IconTicket size={14} />}
            {...form.getInputProps('ticketPrice')}
          />
        )}

        <TextInput
          label="Link para ingressos"
          placeholder="https://..."
          leftSection={<IconTicket size={14} />}
          {...form.getInputProps('ticketsUrl')}
        />

        <Divider label="Configurações" labelPosition="left" />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Select
            label="Idade mínima"
            data={MIN_AGES}
            value={form.values.minAge}
            onChange={(v) => form.setFieldValue('minAge', v ?? '16')}
          />
          <TextInput
            label="Website do evento"
            placeholder="https://..."
            leftSection={<IconWorld size={14} />}
            {...form.getInputProps('websiteUrl')}
          />
        </SimpleGrid>

        {/* Privacidade */}
        <Box>
          <Text size="sm" fw={500} mb={8}>
            Privacidade
          </Text>
          <Stack gap="xs">
            {PRIVACY_TYPES.map(({ value, label, description, icon: Icon }) => (
              <Card
                key={value}
                padding="sm"
                withBorder
                orientation="horizontal"
                style={(theme) => ({
                  border: `1px solid ${form.values.privacyType === value ? theme.colors.violet[5] : theme.colors.gray[3]}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                })}
                onClick={() => form.setFieldValue('privacyType', value)}
              >
                <Card.Section inheritPadding px="xs" withBorder>
                  <Flex h="100%" align="center">
                    <Icon
                      size={18}
                      stroke={1.5}
                      color={
                        form.values.privacyType === value
                          ? 'var(--mantine-color-violet-6)'
                          : 'var(--mantine-color-dimmed)'
                      }
                    />
                  </Flex>
                </Card.Section>
                <Card.Section inheritPadding px="xs" withBorder>
                  <Box>
                    <Text size="sm" fw={500}>
                      {label}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {description}
                    </Text>
                  </Box>
                </Card.Section>
              </Card>
            ))}
          </Stack>
        </Box>

        <Divider />

        <Group justify="flex-end">
          {/* <Button
            variant="default"
            onClick={() => navigate(-1)}
            disabled={form.submitting}
          >
            Cancelar
          </Button> */}
          <Button
            loading={form.submitting}
            onClick={() => form.onSubmit(handleSubmit, handleValidationFailure)()}
          >
            Criar evento
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
