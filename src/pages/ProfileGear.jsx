import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchBasicProfile, fetchProfileGearExpanded } from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import {
  Container, Avatar, Title, Text, Group, Flex, Stack, Box,
  Skeleton, Alert, Badge, Image, Card, Anchor, Modal,
  Center, Spoiler, ActionIcon,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import {
  IconMoodSad, IconRosetteDiscountCheckFilled,
  IconShieldCheckFilled, IconArrowLeft,
} from '@tabler/icons-react'

const AVATAR_PATH    = 'https://ik.imagekit.io/mublin/tr:h-100,c-maintain_ratio/users/avatars/'
const PRODUCT_IMG    = 'https://ik.imagekit.io/mublin/products/tr:h-240,cm-pad_resize,bg-FFFFFF,fo-x/'
const PRODUCT_IMG_LG = 'https://ik.imagekit.io/mublin/products/tr:w-400,cm-pad_resize,bg-FFFFFF/'

export default function ProfileGear() {
  const { username } = useParams()
  const { loading: authLoading } = useAuth()

  // ── Modal de detalhe ──────────────────────────────────
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [selectedItem, setSelectedItem] = useState(null)

  function handleOpenModal(item) {
    setSelectedItem(item)
    openModal()
  }

  // ── Queries ───────────────────────────────────────────
  const { data: profile, isLoading: loadingProfile, isError } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchBasicProfile(username),
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

  // ── Loading ───────────────────────────────────────────
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
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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
      {/* ── Cabeçalho ────────────────────────────────── */}
      <Container size="lg" pt="md" pb="xs">
        <Flex gap={12} align="center">
          <Avatar
            size={56}
            src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
            component={Link}
            to={`/${username}`}
            style={{ cursor: 'pointer' }}
          />
          <Box>
            <Flex align="center" gap={4}>
              <Title order={1} size="h3" lts="-0.02em" lh={1}>
                {profile.full_name}
              </Title>
              {!!profile.is_verified && (
                <IconRosetteDiscountCheckFilled
                  className="iconVerified"
                  title="Perfil verificado"
                />
              )}
              {!!profile.is_legend && (
                <IconShieldCheckFilled
                  className="iconLegend"
                  title="Lenda da música"
                />
              )}
            </Flex>
            <Text size="sm">
              {loadingGear ? '...' : gear.length} {gear.length === 1 ? 'item' : 'itens'} no equipamento
            </Text>
            <Anchor
              component={Link}
              to={`/${username}`}
              underline="hover"
              size="xs"
            >
              <Group gap={3} mt={2}>
                <IconArrowLeft size={13} />
                <Text size="xs">Voltar ao perfil</Text>
              </Group>
            </Anchor>
          </Box>
        </Flex>
      </Container>

      {/* ── Grid Masonry ─────────────────────────────── */}
      <Container size="lg" pb={100}>
        {loadingGear ? null : gear.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" mt="xl">
            Nenhum equipamento adicionado ainda.
          </Text>
        ) : (
          <ResponsiveMasonry
            columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 4 }}
            gutterBreakpoints={{ 350: '8px', 750: '8px', 900: '8px' }}
          >
            <Masonry>
              {gear.map(item => (
                <Card
                  key={item.id}
                  withBorder
                  px={10}
                  pb={10}
                  pt={6}
                  w='100%'
                  radius="md"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleOpenModal(item)}
                >
                  <Center>
                    <Image
                      src={item.products?.picture
                        ? PRODUCT_IMG + item.products.picture
                        : undefined}
                      h={120}
                      mah={120}
                      w="auto"
                      fit="contain"
                      mb={8}
                      radius="md"
                    />
                  </Center>

                  <Text ta="center" size="xs" c="dimmed" fw={400}>
                    {item.products?.product_categories?.name_ptbr} · {item.products?.brands?.name}
                  </Text>
                  <Text ta="center" size="sm" fw={550} lh={1.3} mt={2}>
                    {item.products?.name}
                  </Text>

                  {item.tunings?.name_ptbr && (
                    <Text size="xs" c="dimmed" ta="center" mt={4}>
                      Afinação: {item.tunings.name_ptbr}
                    </Text>
                  )}

                  {item.is_for_sale && (
                    <Flex direction="column" align="center" gap={2} mt={6}>
                      <Badge size="xs" color="dark" variant="filled">À venda</Badge>
                      {item.price && (
                        <Text size="xs" fw={500}>
                          {Number(item.price).toLocaleString('pt-br', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </Text>
                      )}
                    </Flex>
                  )}

                  {item.owner_comments && (
                    <Spoiler
                      maxHeight={60}
                      showLabel={<Text size="xs" fw={600}>...mais</Text>}
                      hideLabel={<Text size="xs" fw={600}>mostrar menos</Text>}
                      mt={8}
                    >
                      <Text size="xs">{item.owner_comments}</Text>
                    </Spoiler>
                  )}
                </Card>
              ))}
            </Masonry>
          </ResponsiveMasonry>
        )}
      </Container>

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
              <Text size="sm" c="dimmed">
                {selectedItem.products?.product_categories?.name_ptbr}
              </Text>
              <Text size="lg" fw={700} lh={1.2}>
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
                      Item do equipamento de {profile.full_name}
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            </Stack>
          )
        }
      >
        {selectedItem && (
          <>
            <Center>
              <Image
                src={selectedItem.products?.picture
                  ? PRODUCT_IMG_LG + selectedItem.products.picture
                  : undefined}
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
                  <Text size="xs" c="dimmed">
                    {selectedItem.tunings.description}
                  </Text>
                )}
              </Box>
            )}

            {selectedItem.is_for_sale && (
              <Flex align="center" justify="center" gap={6} mb={8}>
                <Badge size="md" color="dark" variant="filled">À venda</Badge>
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
              <Text size="sm" mt={8} lh={1.5}>
                <Text span fw={600}>Comentários: </Text>
                {selectedItem.owner_comments}
              </Text>
            )}
          </>
        )}
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
      </Modal>
    </>
  )
}