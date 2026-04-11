import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import {
  Stack, Group, Text, Button, Divider, Modal,
  TextInput, Loader, ScrollArea, Box, Anchor, Avatar,
  Badge, ActionIcon, Select, NumberInput, Flex, Skeleton,
} from '@mantine/core'
import { useDisclosure, useDebouncedCallback } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconSearch, IconTrash, IconX } from '@tabler/icons-react'

const LOGO_PATH = 'https://ik.imagekit.io/mublin/products/brands/tr:w-120,h-120,cm-pad_resize,bg-FFFFFF,fo-x/'
const currentYear = new Date().getFullYear()

// ── Queries locais ────────────────────────────────────────

async function fetchUserPartners(userId) {
  const { data, error } = await supabase
    .from('profile_partners')
    .select('id, type, since_year, featured, active, brands(id, name, slug, logo)')
    .eq('id_user', userId)
    .order('since_year', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

async function searchBrands(query) {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, slug, logo')
    .eq('active', true)
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(10)
  if (error) throw new Error(error.message)
  return data
}

// ── Componente principal ──────────────────────────────────

export default function Endorsements() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // ── Modal ─────────────────────────────────────────────
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)

  // ── Busca de brand ────────────────────────────────────
  const [brandQuery, setBrandQuery] = useState('')
  const [brandResults, setBrandResults] = useState([])
  const [brandSearchLoading, setBrandSearchLoading] = useState(false)
  const [noBrandResults, setNoBrandResults] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState(null)

  // ── Campos do novo vínculo ────────────────────────────
  const [partnerType, setPartnerType] = useState('Endorser')
  const [sinceYear, setSinceYear] = useState(currentYear)
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(null) // id do item sendo removido

  // ── Query: parceiros do usuário ───────────────────────
  const { data: userPartners = [], isLoading } = useQuery({
    queryKey: ['user-partners', user?.id],
    queryFn: () => fetchUserPartners(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  // ── Busca debounced de brands ─────────────────────────
  const handleBrandSearch = useDebouncedCallback(async (query) => {
    if (!query || query.length < 2) {
      setBrandResults([])
      setNoBrandResults(false)
      return
    }
    setBrandSearchLoading(true)
    setNoBrandResults(false)
    const results = await searchBrands(query)
    if (results.length) {
      setBrandResults(results)
    } else {
      setNoBrandResults(true)
      setBrandResults([])
    }
    setBrandSearchLoading(false)
  }, 500)

  function handleSelectBrand(brand) {
    setSelectedBrand(brand)
    setBrandResults([])
    setBrandQuery('')
    setNoBrandResults(false)
  }

  function handleCloseModal() {
    closeModal()
    setSelectedBrand(null)
    setBrandQuery('')
    setBrandResults([])
    setNoBrandResults(false)
    setPartnerType('Endorser')
    setSinceYear(currentYear)
  }

  // ── Adicionar parceiro ────────────────────────────────
  async function handleAdd() {
    if (!selectedBrand) return

    // Verifica duplicata no frontend antes de bater no banco
    const alreadyAdded = userPartners.find(p => p.brands?.id === selectedBrand.id)
    if (alreadyAdded) {
      notifications.show({
        color: 'orange',
        position: 'top-center',
        message: `${selectedBrand.name} já está na sua lista.`,
      })
      return
    }

    setIsAdding(true)
    const { error } = await supabase
      .from('profile_partners')
      .insert({
        id_user:    user.id,
        id_brand:   selectedBrand.id,
        type:       partnerType,
        since_year: sinceYear ?? null,
        featured:   false,
        active:     true,
      })

    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao adicionar parceiro. Tente novamente.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-partners', user.id] })
      notifications.show({
        color: 'green',
        position: 'top-center',
        message: `${selectedBrand.name} adicionado!`,
      })
      handleCloseModal()
    }
    setIsAdding(false)
  }

  // ── Remover parceiro ──────────────────────────────────
  async function handleRemove(partnerId) {
    setIsRemoving(partnerId)
    const { error } = await supabase
      .from('profile_partners')
      .delete()
      .eq('id', partnerId)

    if (error) {
      notifications.show({
        color: 'red',
        position: 'top-center',
        message: 'Erro ao remover parceiro. Tente novamente.',
      })
    } else {
      await queryClient.refetchQueries({ queryKey: ['user-partners', user.id] })
    }
    setIsRemoving(null)
  }

  // ── IDs já adicionados (para feedback visual no search) 
  const addedBrandIds = userPartners.map(p => p.brands?.id)

  // ── Render ────────────────────────────────────────────
  return (
    <>
      <Stack gap="xl">
        <Stack gap="md">
          <div>
            <Text fw={600} size="sm" tt="uppercase" lts="0.05em">
              Parceiros e Endorsements ({userPartners.length})
            </Text>
            <Text size="xs" c="dimmed" mt={2}>
              Marcas que você representa, endossa ou tem parceria
            </Text>
          </div>

          <Button
            size="sm"
            leftSection={<IconPlus size={14} />}
            onClick={openModal}
            style={{ width: 'fit-content' }}
          >
            Adicionar parceiro
          </Button>

          {isLoading ? (
            <Stack gap="sm">
              {[1, 2, 3].map(i => (
                <Flex key={i} align="center" gap="sm">
                  <Skeleton width={36} height={36} radius="sm" />
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Skeleton width={120} height={14} radius="sm" />
                    <Skeleton width={80} height={12} radius="sm" />
                  </Stack>
                </Flex>
              ))}
            </Stack>
          ) : userPartners.length > 0 ? (
            <Stack gap={0}>
              {userPartners.map((partner, index) => (
                <Box key={partner.id}>
                  {index > 0 && <Divider />}
                  <Group justify="space-between" py="sm">
                    <Group gap="sm">
                      <Avatar
                        src={partner.brands?.logo ? LOGO_PATH + partner.brands.logo : undefined}
                        size={60}
                        radius="sm"
                      >
                        {partner.brands?.name?.[0]}
                      </Avatar>
                      <Stack gap={2}>
                        <Group gap="xs">
                          <Text size="sm" fw={600}>{partner.brands?.name}</Text>
                          <Badge
                            size="xs"
                            variant="light"
                            color={partner.type === 'Endorser' ? 'indigo' : 'teal'}
                          >
                            {partner.type}
                          </Badge>
                        </Group>
                        {partner.since_year && (
                          <Text size="xs" c="dimmed">desde {partner.since_year}</Text>
                        )}
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          loading={isRemoving === partner.id}
                          onClick={() => handleRemove(partner.id)}
                          title="Remover"
                        >
                          <IconTrash size={15} />
                        </ActionIcon>
                      </Stack>
                    </Group>
                  </Group>
                </Box>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">Nenhum parceiro ou endorsement cadastrado.</Text>
          )}
        </Stack>
      </Stack>

      {/* ── Modal: adicionar parceiro ─────────────────── */}
      <Modal
        title="Adicionar parceiro ou endorsement"
        opened={modalOpened}
        onClose={handleCloseModal}
        size="sm"
        radius="md"
        centered
      >
        <Stack gap="md">

          {/* Busca de brand */}
          {!selectedBrand ? (
            <Stack gap="xs">
              <TextInput
                label="Buscar marca"
                placeholder="Nome da marca..."
                leftSection={brandSearchLoading ? <Loader size={15} /> : <IconSearch size={15} />}
                value={brandQuery}
                onChange={(e) => {
                  setBrandQuery(e.target.value)
                  handleBrandSearch(e.target.value)
                }}
                data-autofocus
              />
              {noBrandResults && (
                <Text size="xs" c="dimmed">Nenhuma marca encontrada.</Text>
              )}
              {brandResults.length > 0 && (
                <ScrollArea h={180} type="auto">
                  <Stack gap={0}>
                    {brandResults.map(brand => {
                      const alreadyAdded = addedBrandIds.includes(brand.id)
                      return (
                        <Box key={brand.id}>
                          <Anchor
                            py="xs"
                            display="block"
                            underline="never"
                            c={alreadyAdded ? 'dimmed' : 'inherit'}
                            style={{
                              cursor: alreadyAdded ? 'default' : 'pointer',
                              opacity: alreadyAdded ? 0.5 : 1,
                            }}
                            onClick={() => !alreadyAdded && handleSelectBrand(brand)}
                          >
                            <Group gap="sm">
                              <Avatar
                                src={brand.logo ? LOGO_PATH + brand.logo : undefined}
                                size={28}
                                radius="sm"
                              >
                                {brand.name[0]}
                              </Avatar>
                              <Text size="sm">{brand.name}</Text>
                              {alreadyAdded && (
                                <Text size="xs" c="dimmed">(já adicionado)</Text>
                              )}
                            </Group>
                          </Anchor>
                          <Divider />
                        </Box>
                      )
                    })}
                  </Stack>
                </ScrollArea>
              )}
            </Stack>
          ) : (
            // Brand selecionada — mostra resumo e campos do vínculo
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="sm">
                  <Avatar
                    src={selectedBrand.logo ? LOGO_PATH + selectedBrand.logo : undefined}
                    size={36}
                    radius="sm"
                  >
                    {selectedBrand.name[0]}
                  </Avatar>
                  <Text size="sm" fw={600}>{selectedBrand.name}</Text>
                </Group>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => setSelectedBrand(null)}
                  title="Trocar marca"
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>

              <Divider />

              <Select
                label="Tipo de relação"
                data={[
                  { value: 'Endorser', label: 'Esta marca é minha Endorser' },
                  { value: 'Partner',  label: 'Esta marca é minha Parceira'  },
                ]}
                value={partnerType}
                onChange={(v) => setPartnerType(v)}
                allowDeselect={false}
              />

              <NumberInput
                label="Desde o ano (opcional)"
                placeholder={String(currentYear)}
                min={1900}
                max={currentYear}
                value={sinceYear}
                onChange={(v) => setSinceYear(v)}
              />

              <Button
                color="indigo"
                radius="xl"
                loading={isAdding}
                leftSection={<IconPlus size={15} />}
                onClick={handleAdd}
              >
                Confirmar
              </Button>
            </Stack>
          )}
        </Stack>
      </Modal>
    </>
  )
}