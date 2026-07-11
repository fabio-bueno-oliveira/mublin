import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { upload } from '@imagekit/react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { useQuery } from '@tanstack/react-query'
import {
  Container,
  Title,
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Switch,
  NumberInput,
  Image,
  ActionIcon,
  Loader,
  Text,
  Box,
  Divider,
  SimpleGrid,
  NativeSelect,
  Input,
  Modal,
  ScrollArea,
  Anchor,
} from '@mantine/core'
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconPhoto,
  IconX,
  IconWorld,
  IconMapPin,
  IconPhone,
  IconBrandInstagram,
  IconSearch,
  IconUsers,
} from '@tabler/icons-react'

// ── Helpers ───────────────────────────────────────────────

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '')
}

const VENUE_PICTURE_PATH = 'https://ik.imagekit.io/mublin/venues/temp/tr:w-800/'

// ── Queries ───────────────────────────────────────────────

async function fetchVenueTypes() {
  const { data, error } = await supabase
    .from('venue_types')
    .select('id, name')
    .order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchCountries() {
  const { data, error } = await supabase
    .from('countries')
    .select('id, name_ptbr, name')
    .order('name_ptbr')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function fetchRegionsByCountry(countryId) {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name, uf')
    .eq('country_id', countryId)
    .order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

async function searchCitiesByName(query, regionId) {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name')
    .eq('region_id', regionId)
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// ── Componente principal ──────────────────────────────────

export default function NewVenue() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const imageInputRef = useRef(null)

  // Localização
  const [selectedCountryId, setSelectedCountryId] = useState('')
  const [selectedRegionId, setSelectedRegionId] = useState('')
  const [selectedCity, setSelectedCity] = useState(null)
  const [citySearchQuery, setCitySearchQuery] = useState('')
  const [cityResults, setCityResults] = useState([])
  const [citySearchLoading, setCitySearchLoading] = useState(false)
  const [noCityResults, setNoCityResults] = useState(false)
  const [modalCityOpened, { open: openCityModal, close: closeCityModal }] =
    useDisclosure(false)

  // Formulário
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [venueTypeId, setVenueTypeId] = useState('')
  const [address, setAddress] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [phone, setPhone] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [capacity, setCapacity] = useState('')
  const [hasSoundSystem, setHasSoundSystem] = useState(false)
  const [hasBackline, setHasBackline] = useState(false)

  // Imagem
  const [pictureFileName, setPictureFileName] = useState('')
  const [pictureFileId, setPictureFileId] = useState('')
  const [pictureFile, setPictureFile] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  // ── Queries ──────────────────────────────────────────────

  const { data: venueTypes = [], isLoading: loadingVenueTypes } = useQuery({
    queryKey: ['venue-types'],
    queryFn: fetchVenueTypes,
    staleTime: Infinity,
  })

  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: Infinity,
  })

  const { data: regions = [], isLoading: loadingRegions } = useQuery({
    queryKey: ['regions', selectedCountryId],
    queryFn: () => fetchRegionsByCountry(selectedCountryId),
    enabled: !!selectedCountryId,
    staleTime: 1000 * 60 * 60,
  })

  // ── Busca de cidades (debounced) ─────────────────────────

  const handleCitySearch = useDebouncedCallback(async (query) => {
    if (!query || query.length < 2 || !selectedRegionId) {
      return
    }
    setCitySearchLoading(true)
    setNoCityResults(false)
    const results = await searchCitiesByName(query, selectedRegionId)
    if (results.length) {
      setCityResults(results)
    } else {
      setNoCityResults(true)
      setCityResults([])
    }
    setCitySearchLoading(false)
  }, 500)

  // ── ImageKit helpers ─────────────────────────────────────

  async function getIkAuthTokens() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const authRes = await fetch(import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    })
    if (!authRes.ok) {
      throw new Error('Falha na autenticação do ImageKit')
    }
    return { session, ...(await authRes.json()) }
  }

  async function uploadToImageKit({ file, fileName, folder, tags }) {
    const { token: ikToken, expire, signature } = await getIkAuthTokens()
    return upload({
      file,
      fileName,
      folder,
      tags,
      useUniqueFileName: true,
      publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT,
      token: ikToken,
      expire,
      signature,
    })
  }

  async function deleteFromImageKit(fileId) {
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
        body: JSON.stringify({ fileId }),
      },
    )
    if (!response.ok) {
      throw new Error('Erro ao deletar no servidor')
    }
  }

  // ── Handlers de imagem ───────────────────────────────────

  async function handleImageUpload(file) {
    if (!file) {
      return
    }
    setPictureFile(file)
    setIsUploadingImage(true)
    try {
      const response = await uploadToImageKit({
        file,
        fileName: `venue_.jpg`,
        folder: '/venues/temp/',
        tags: ['venue', 'picture'],
      })
      const n = response.filePath.lastIndexOf('/')
      setPictureFileName(response.filePath.substring(n + 1))
      setPictureFileId(response.fileId)
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
      await deleteFromImageKit(pictureFileId)
      setPictureFileName('')
      setPictureFileId('')
      setPictureFile(null)
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

  // ── Submit ───────────────────────────────────────────────

  async function handleSubmit() {
    if (!name.trim()) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Informe o nome do estabelecimento.',
      })
      return
    }

    setSubmitting(true)

    const slug = generateSlug(name)

    // 1. Cria a venue
    const { data: newVenue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: name.trim(),
        created_by_profile_id: user.id,
        slug,
        description: description.trim() || null,
        venue_type_id: venueTypeId ? Number(venueTypeId) : null,
        city_id: selectedCity?.id ?? null,
        address: address.trim() || null,
        address_number: addressNumber.trim() || null,
        neighborhood: neighborhood.trim() || null,
        zip_code: zipCode.trim() || null,
        phone: phone.trim() || null,
        instagram_handle: instagramHandle.trim() || null,
        website_url: websiteUrl.trim() || null,
        capacity: capacity ? Number(capacity) : null,
        has_sound_system: hasSoundSystem,
        has_backline: hasBackline,
        picture_url: null, // atualizado após mover a imagem
      })
      .select('id')
      .single()

    if (venueError) {
      notifications.show({
        color: 'red',
        title: 'Ops...',
        message: 'Não foi possível cadastrar o estabelecimento. Tente novamente.',
        position: 'top-center',
      })
      setSubmitting(false)
      return
    }

    const venueId = newVenue.id
    const venueSlug = slug

    // 2. Move a imagem do folder temp para o folder definitivo
    let finalPictureUrl = null
    if (pictureFile && pictureFileId) {
      try {
        const response = await uploadToImageKit({
          file: pictureFile,
          fileName: `${venueId}_.jpg`,
          folder: `/venues/`,
          tags: ['venue', 'picture'],
        })
        const n = response.filePath.lastIndexOf('/')
        finalPictureUrl = response.filePath.substring(n + 1)
        await deleteFromImageKit(pictureFileId) // remove o temp
        await supabase
          .from('venues')
          .update({ picture_url: finalPictureUrl })
          .eq('id', venueId)
      } catch {
        // imagem falhou mas a venue já foi criada, segue
      }
    }

    notifications.show({
      color: 'green',
      message: 'Estabelecimento cadastrado com sucesso!',
      position: 'top-center',
    })
    navigate(`/venue/${venueSlug}`)
  }

  return (
    <Container size="sm" py="md" px={{ base: 'md', sm: 'lg' }}>
      <Title order={1} fz="h3" ta="left" fw={600} mb={24}>
        Cadastrar novo estabelecimento ou local
      </Title>

      <Stack gap="md">
        {/* Imagem */}
        <Box>
          <Text size="xs" c="dimmed" fw={500} mb={6}>
            <IconPhoto
              size={16}
              stroke={1.4}
              style={{ marginRight: 4, verticalAlign: 'middle' }}
            />
            Foto do estabelecimento
          </Text>
          {pictureFileName ? (
            <Box style={{ position: 'relative', display: 'inline-block' }}>
              <Image
                src={`${VENUE_PICTURE_PATH}${pictureFileName}`}
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
                title="Remover imagem"
              >
                <IconX size={12} />
              </ActionIcon>
            </Box>
          ) : (
            <Button
              variant="default"
              size="sm"
              leftSection={
                isUploadingImage ? <Loader size={13} /> : <IconPhoto size={14} />
              }
              component="label"
              htmlFor="venue-image-input"
              disabled={isUploadingImage}
            >
              {isUploadingImage ? 'Enviando...' : 'Adicionar foto'}
            </Button>
          )}
          <input
            ref={imageInputRef}
            id="venue-image-input"
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

        <Divider />

        {/* Informações básicas */}
        <TextInput
          label="Nome"
          placeholder="Ex: Teatro Municipal, Clube do Choro..."
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <NativeSelect
          label="Tipo de estabelecimento"
          value={venueTypeId}
          onChange={(e) => setVenueTypeId(e.target.value)}
          disabled={loadingVenueTypes}
        >
          <option value="">Selecione (opcional)</option>
          {venueTypes.map((t) => (
            <option key={t.id} value={String(t.id)}>
              {t.name}
            </option>
          ))}
        </NativeSelect>

        <Textarea
          label="Descrição"
          placeholder="Fale sobre o espaço, história, diferenciais..."
          minRows={3}
          autosize
          maxRows={8}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Divider label="Localização" labelPosition="left" />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <NativeSelect
            label="País"
            value={selectedCountryId}
            disabled={loadingCountries}
            onChange={(e) => {
              setSelectedCountryId(e.target.value)
              setSelectedRegionId('')
              setSelectedCity(null)
            }}
          >
            <option value="">Selecione</option>
            {countries.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name_ptbr !== 'NULL' ? c.name_ptbr : c.name}
              </option>
            ))}
          </NativeSelect>

          <NativeSelect
            label="Estado / Região"
            value={selectedRegionId}
            disabled={!selectedCountryId || loadingRegions}
            onChange={(e) => {
              setSelectedRegionId(e.target.value)
              setSelectedCity(null)
            }}
          >
            <option value="">Selecione</option>
            {regions.map((r) => (
              <option key={r.id} value={String(r.id)}>
                {r.uf ? `${r.name} (${r.uf})` : r.name}
              </option>
            ))}
          </NativeSelect>
        </SimpleGrid>

        <Input.Wrapper label="Cidade">
          <Input
            pointer
            readOnly
            placeholder={
              selectedRegionId ? 'Selecionar...' : 'Selecione o Estado primeiro'
            }
            disabled={!selectedRegionId}
            value={selectedCity?.name ?? ''}
            leftSection={<IconMapPin size={14} />}
            rightSection={selectedRegionId ? <IconSearch size={15} /> : undefined}
            onClick={() => {
              if (selectedRegionId) {
                openCityModal()
              }
            }}
          />
        </Input.Wrapper>

        <Divider label="Endereço" labelPosition="left" />

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
          <TextInput
            label="Logradouro"
            placeholder="Rua, Av., Travessa..."
            style={{ gridColumn: 'span 2' }}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <TextInput
            label="Número"
            placeholder="123"
            value={addressNumber}
            onChange={(e) => setAddressNumber(e.target.value)}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <TextInput
            label="Bairro"
            placeholder="Centro, Vila Madalena..."
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
          />
          <TextInput
            label="CEP"
            placeholder="00000-000"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
          />
        </SimpleGrid>

        <Divider label="Contato" labelPosition="left" />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <TextInput
            label="Telefone"
            placeholder="(11) 99999-9999"
            leftSection={<IconPhone size={14} />}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextInput
            label="Instagram"
            placeholder="@nome_do_local"
            leftSection={<IconBrandInstagram size={14} />}
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
          />
        </SimpleGrid>

        <TextInput
          label="Website"
          placeholder="https://..."
          leftSection={<IconWorld size={14} />}
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
        />

        <Divider label="Estrutura" labelPosition="left" />

        <NumberInput
          label="Capacidade (pessoas)"
          placeholder="Ex: 500"
          min={1}
          leftSection={<IconUsers size={14} />}
          value={capacity}
          onChange={setCapacity}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Switch
            label="Possui sistema de som"
            checked={hasSoundSystem}
            onChange={(e) => setHasSoundSystem(e.currentTarget.checked)}
          />
          <Switch
            label="Possui backline"
            checked={hasBackline}
            onChange={(e) => setHasBackline(e.currentTarget.checked)}
          />
        </SimpleGrid>

        <Divider />

        <Group justify="flex-end">
          <Button variant="default" onClick={() => navigate(-1)} disabled={submitting}>
            Cancelar
          </Button>
          <Button loading={submitting} onClick={handleSubmit}>
            Cadastrar estabelecimento
          </Button>
        </Group>
      </Stack>

      {/* Modal de seleção de cidade */}
      <Modal
        title="Selecionar cidade"
        opened={modalCityOpened}
        onClose={closeCityModal}
        size="sm"
        radius="md"
      >
        <Stack gap="sm">
          <TextInput
            placeholder="Digite o nome da cidade..."
            data-autofocus
            value={citySearchQuery}
            rightSection={
              citySearchLoading ? <Loader size={16} /> : <IconSearch size={16} />
            }
            onChange={(e) => {
              setCitySearchQuery(e.target.value)
              handleCitySearch(e.target.value)
            }}
          />
          {noCityResults && (
            <Text size="xs" c="dimmed">
              Nenhuma cidade encontrada nesta região.
            </Text>
          )}
          {cityResults.length > 0 && (
            <ScrollArea h={200} type="auto">
              <Stack gap={0}>
                {cityResults.map((city) => (
                  <Box key={city.id}>
                    <Anchor
                      size="sm"
                      py={8}
                      display="block"
                      underline="never"
                      c="inherit"
                      onClick={() => {
                        setSelectedCity({ id: city.id, name: city.name })
                        closeCityModal()
                        setCitySearchQuery('')
                        setCityResults([])
                      }}
                    >
                      {city.name}
                    </Anchor>
                    <Divider />
                  </Box>
                ))}
              </Stack>
            </ScrollArea>
          )}
        </Stack>
      </Modal>
    </Container>
  )
}
