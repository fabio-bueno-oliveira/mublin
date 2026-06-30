import { useState, useEffect } from 'react'
import { useUI } from '../contexts/UIContext'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchProfileBasicDetails,
  fetchProfileGearExpanded,
  fetchProfileGearSetupNames,
} from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import {
  Container,
  Grid,
  EmptyState,
  Button,
  Avatar,
  Title,
  Text,
  Group,
  Flex,
  Stack,
  Box,
  Skeleton,
  Alert,
  Badge,
  Image,
  Card,
  Anchor,
  Modal,
  Center,
  Paper,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import {
  IconMoodSad,
  IconRosetteDiscountCheckFilled,
  IconShieldCheckFilled,
  IconArrowLeft,
  IconMusic,
  IconZoom,
  IconRosetteDiscountCheck,
} from '@tabler/icons-react'
import parse from 'html-react-parser'
import linkifyStr from 'linkify-string'
import { getAvatarUrl } from '../utils/profile'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-100,c-maintain_ratio/users/avatars/'
const PRODUCT_IMG =
  'https://ik.imagekit.io/mublin/products/tr:h-240,cm-pad_resize,bg-FFFFFF,fo-x/'
const PRODUCT_IMG_LG =
  'https://ik.imagekit.io/mublin/products/tr:w-400,cm-pad_resize,bg-FFFFFF/'

export default function ProfileGear() {
  const { username } = useParams()
  const { loading: authLoading } = useAuth()
  const { setHideFooter } = useUI()
  const navigate = useNavigate()

  // ── Modal de detalhe ──────────────────────────────────
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    setHideFooter(modalOpened)
    return () => setHideFooter(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpened])

  function handleOpenModal(item) {
    setSelectedItem(item)
    openModal()
  }

  // ── Queries ───────────────────────────────────────────
  const {
    data: profile,
    isLoading: loadingProfile,
    isError,
  } = useQuery({
    queryKey: ['basicProfile', username],
    queryFn: () => fetchProfileBasicDetails(username),
    enabled: !!username && !authLoading,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const { data: gear = [], isLoading: loadingGear } = useQuery({
    queryKey: ['profile-gear-expanded', profile?.id],
    queryFn: () => fetchProfileGearExpanded(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: setupNames = {} } = useQuery({
    queryKey: ['profile-gear-setup-names', profile?.id],
    queryFn: () => fetchProfileGearSetupNames(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  if (authLoading || loadingProfile) {
    return (
      <Container size="lg" py={24}>
        <Flex gap={10} align="center">
          <Skeleton circle height={60} />
          <Stack gap={6}>
            <Skeleton width={160} height={18} radius="xl" />
            <Skeleton width={120} height={12} radius="xl" />
          </Stack>
        </Flex>
        <ResponsiveMasonry
          columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 4 }}
          gutterBreakpoints={{ 350: '8px', 750: '8px', 900: '8px' }}
        >
          <Masonry>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} height={180 + (i % 3) * 40} radius="md" mb={8} />
            ))}
          </Masonry>
        </ResponsiveMasonry>
      </Container>
    )
  }

  // ── Erro / não encontrado ─────────────────────────────
  if (isError || !profile) {
    return (
      <Container size="sm" py={48}>
        <Alert
          icon={<IconMoodSad size={18} />}
          title="Perfil não encontrado"
          color="gray"
          radius="md"
        >
          O usuário <strong>@{username}</strong> não existe ou foi removido.
        </Alert>
      </Container>
    )
  }

  return (
    <>
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 2 }} mt="md" visibleFrom="sm">
          <Center mb="sm">
            <Link to={`/${profile.username}`}>
              <Avatar
                size={140}
                src={getAvatarUrl(profile.avatar, profile.is_open_to_work, 140)}
              />
            </Link>
          </Center>
          <Flex align="center" gap={4}>
            <Text size="lg" fw={500} lineClamp={1} truncate="end">
              {profile.full_name}
            </Text>
            {!!profile.is_verified && (
              <IconRosetteDiscountCheck
                className="iconVerified"
                title="Perfil verificado"
              />
            )}
          </Flex>
          <Text size="sm" c="dimmed">
            {loadingGear ? '...' : gear.length} {gear.length === 1 ? 'item' : 'itens'} no
            equipamento
          </Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 10 }} mt="lg">
          {loadingGear ? null : gear.length === 0 ? (
            <EmptyState>
              <EmptyState.Indicator>
                <IconZoom />
              </EmptyState.Indicator>
              <EmptyState.Title>Nada por aqui :(</EmptyState.Title>
              <EmptyState.Description>
                {profile.full_name} ainda não adicionou nenhum equipamento até o momento.
              </EmptyState.Description>
              <EmptyState.Actions>
                <Button
                  variant="default"
                  leftSection={<IconArrowLeft />}
                  onClick={() => navigate(`/${username}`)}
                >
                  Voltar ao perfil
                </Button>
                {/* <Button variant="default">Create new</Button> */}
              </EmptyState.Actions>
            </EmptyState>
          ) : (
            <ResponsiveMasonry
              columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 4 }}
              // gutterBreakpoints={{ 350: '12px', 750: '12px', 900: '12px' }}
            >
              <Masonry>
                {gear.map((item) => (
                  <Card
                    key={item.id}
                    withBorder
                    px={10}
                    pb={10}
                    pt={6}
                    w="100%"
                    bg="white"
                    radius="md"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOpenModal(item)}
                  >
                    <Center>
                      <Image
                        src={
                          item.products?.picture
                            ? PRODUCT_IMG + item.products.picture
                            : undefined
                        }
                        h={120}
                        mah={120}
                        w="auto"
                        fit="contain"
                        mb={8}
                        radius="md"
                      />
                    </Center>

                    <Text ta="center" size="xs" c="black" fw={400}>
                      {item.products?.product_categories?.name_ptbr} ·{' '}
                      {item.products?.brands?.name}
                    </Text>
                    <Text ta="center" size="md" c="black" fw={550} lh={1.3} mt={2}>
                      {item.products?.name}
                    </Text>

                    {item.tunings?.name_ptbr && (
                      <Text size="xs" c="dimmed" ta="center" mt={4}>
                        Afinação: {item.tunings.name_ptbr}
                      </Text>
                    )}

                    {item.is_for_sale && (
                      <Flex direction="column" align="center" gap={2} mt={6}>
                        <Badge size="xs" color="dark" variant="filled">
                          À venda
                        </Badge>
                        {item.price && (
                          <Text size="xs" c="black" fw={500}>
                            {Number(item.price).toLocaleString('pt-br', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </Text>
                        )}
                      </Flex>
                    )}
                    {setupNames[item.id_product]?.length > 0 && (
                      <Text size="xs" c="dimmed" ta="center" mt={6}>
                        Incluído no{setupNames[item.id_product]?.length !== 1 && 's'}{' '}
                        setup
                        {setupNames[item.id_product]?.length !== 1 && 's'} :{' '}
                        <strong>{setupNames[item.id_product].join(', ')}</strong>
                      </Text>
                    )}
                    {item.owner_comments && (
                      <Paper p="xs" bg="#d3d3d3" mt={8} w="100%">
                        <Text size="xs" c="black" lineClamp={2}>
                          {item.owner_comments}
                        </Text>
                      </Paper>
                    )}
                  </Card>
                ))}
              </Masonry>
            </ResponsiveMasonry>
          )}
        </Grid.Col>
      </Grid>

      {/* ── Modal de detalhe ─────────────────────────── */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        centered
        size="md"
        radius="md"
        title={
          selectedItem && (
            <Stack gap={2}>
              <Text size="xs" c="dimmed">
                {selectedItem.products?.product_categories?.name_ptbr}
              </Text>
              <Text size="xl" mb={4} fw={700} lh={1.2}>
                {selectedItem.products?.brands?.name} {selectedItem.products?.name}
              </Text>
              <Flex gap={5} align="center">
                <Avatar
                  size={20}
                  src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
                  component={Link}
                  to={`/${username}`}
                  style={{ cursor: 'pointer' }}
                />
                <Box>
                  <Flex align="center" gap={4}>
                    <Text size="xs" lts="-0.02em" lh={1}>
                      Item do equipamento de <strong>{profile.username}</strong>
                    </Text>
                  </Flex>
                </Box>
              </Flex>
              {setupNames[selectedItem?.id_product]?.length > 0 && (
                <Group gap={3} wrap="wrap">
                  <Text size="xs" c="dimmed">
                    Incluído no{setupNames[selectedItem?.id_product]?.length !== 1 && 's'}{' '}
                    setup{setupNames[selectedItem?.id_product]?.length !== 1 && 's'}
                  </Text>
                  {setupNames[selectedItem.id_product].map((name) => (
                    <Badge key={name} size="sm" variant="light">
                      {name}
                    </Badge>
                  ))}
                </Group>
              )}
            </Stack>
          )
        }
      >
        {selectedItem && (
          <>
            <Center mt={10}>
              <Image
                src={
                  selectedItem.products?.picture
                    ? PRODUCT_IMG_LG + selectedItem.products.picture
                    : undefined
                }
                w={200}
                fit="contain"
                mb={12}
                radius="md"
              />
            </Center>
            {selectedItem.tunings?.name_ptbr && (
              <Box ta="center" mb={8}>
                <Text size="sm" fw={500}>
                  Afinação: {selectedItem.tunings.name_ptbr}
                </Text>
                {selectedItem.tunings?.description && (
                  <Group gap={2} mt={2} align="center" justify="center">
                    <IconMusic size={17} color="gray" />
                    <Text size="xs" c="dimmed">
                      {selectedItem.tunings.description}
                    </Text>
                  </Group>
                )}
              </Box>
            )}
            {selectedItem.is_for_sale && (
              <Flex align="center" justify="center" gap={6} mb={8}>
                <Badge size="md" color="blue" variant="light">
                  À venda
                </Badge>
                {selectedItem.price && (
                  <Text size="sm" fw={500}>
                    {Number(selectedItem.price).toLocaleString('pt-br', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </Text>
                )}
              </Flex>
            )}
            {selectedItem.owner_comments && (
              <Paper p="xs" withBorder mt={8}>
                <Text size="xs" c="dimmed" lh={1.5}>
                  Comentários de {profile.full_name}:
                </Text>
                <Text size="sm" lh={1.5}>
                  {parse(linkifyStr(selectedItem.owner_comments, { target: '_blank' }))}
                </Text>
              </Paper>
            )}
            <Group justify="right">
              <Anchor
                component={Link}
                to={`/gear/${selectedItem.products?.slug}`}
                size="xs"
                fw={500}
                mt={2}
                onClick={closeModal}
              >
                Ir para a página deste produto →
              </Anchor>
            </Group>
          </>
        )}
      </Modal>
    </>
  )
}
