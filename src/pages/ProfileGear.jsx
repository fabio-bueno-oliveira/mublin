import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchProfileBasicDetails,
  fetchProfileGearExpanded,
  fetchProfileGearSetupNames,
  fetchProfileGearCategories,
} from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import {
  Container,
  Affix,
  Grid,
  Box,
  EmptyState,
  Button,
  Avatar,
  Text,
  Group,
  Flex,
  Alert,
  Badge,
  Image,
  Card,
  Center,
  Paper,
  Select,
  Loader,
  em,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import {
  IconMoodSad,
  IconArrowLeft,
  IconZoom,
  IconRosetteDiscountCheck,
} from '@tabler/icons-react'
import AppNavbarMobile from '../components/AppNavbarMobile'
import { getAvatarUrl } from '../utils/profile'
import { truncateString } from '../utils/formatter'

const PRODUCT_IMG =
  'https://ik.imagekit.io/mublin/products/tr:h-240,cm-pad_resize,bg-FFFFFF,fo-x/'

export default function ProfileGear() {
  const { username } = useParams()
  const { loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  // ── Filtro por categoria ──────────────────────────────
  const [gearCategorySelected, setGearCategorySelected] = useState('')

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

  const { data: gearAll = [], isLoading: loadingGear } = useQuery({
    queryKey: ['profile-gear-expanded', profile?.id],
    queryFn: () => fetchProfileGearExpanded(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const gear = gearAll.filter((x) =>
    gearCategorySelected
      ? x.products?.id_category === Number(gearCategorySelected)
      : true,
  )

  const { data: gearCategories = [] } = useQuery({
    queryKey: ['profile-gear-categories', profile?.id],
    queryFn: () => fetchProfileGearCategories(profile.id),
    enabled: !!profile?.id && gearAll.length > 0,
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
      <Center mih="70vh">
        <Loader />
      </Center>
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
      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%">
          <AppNavbarMobile
            pageName={profile.username}
            // profile={profile}
            // featured={profile.is_open_to_work}
          />
        </Affix>
      )}
      <Grid gap="xl" mt={{ base: 51, sm: 0 }}>
        <Grid.Col span={{ base: 12, md: 2 }} mt="md" visibleFrom="sm">
          <Box mb="sm" mt="xs">
            <Link to={`/${profile.username}`}>
              <Avatar
                size={120}
                src={getAvatarUrl(profile.avatar, profile.is_open_to_work, 120)}
              />
            </Link>
          </Box>
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
            {loadingGear ? '...' : gearAll.length}{' '}
            {gearAll.length === 1 ? 'item' : 'itens'} no equipamento
          </Text>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 10 }} mt="lg" px={{ base: 'md', md: 0 }}>
          {loadingGear ? (
            <Center mih={200}>
              <Loader size="sm" />
            </Center>
          ) : (
            <>
              {gearCategories.length > 1 && (
                <Group gap={10} mb={12} mx={{ base: 'sm', md: 0 }}>
                  <Select
                    size="sm"
                    w={220}
                    value={gearCategorySelected || ''}
                    onChange={(value) => setGearCategorySelected(value || '')}
                    data={[
                      { value: '', label: 'Todas as categorias' },
                      ...gearCategories.map((cat) => ({
                        value: String(cat.category_id),
                        label: truncateString(`${cat.category} (${cat.total})`, 28),
                      })),
                    ]}
                  />
                </Group>
              )}
              {gear.length === 0 ? (
                <EmptyState>
                  <EmptyState.Indicator>
                    <IconZoom />
                  </EmptyState.Indicator>
                  <EmptyState.Title>Nada por aqui :(</EmptyState.Title>
                  <EmptyState.Description>
                    {gearCategorySelected
                      ? 'Nenhum item encontrado nesta categoria.'
                      : `${profile.full_name} ainda não adicionou nenhum equipamento até o momento.`}
                  </EmptyState.Description>
                  <EmptyState.Actions>
                    {gearCategorySelected ? (
                      <Button
                        variant="default"
                        onClick={() => setGearCategorySelected('')}
                      >
                        Ver todas as categorias
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        leftSection={<IconArrowLeft />}
                        onClick={() => navigate(`/${username}`)}
                      >
                        Voltar ao perfil
                      </Button>
                    )}
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
                        style={{ cursor: 'pointer', textDecoration: 'none' }}
                        // onClick={() => handleOpenModal(item)}
                        component={Link}
                        to={`/${username}/gear/${item.id}`}
                      >
                        <Center>
                          <Image
                            src={
                              item.products?.picture
                                ? PRODUCT_IMG + item.products.picture
                                : undefined
                            }
                            h="auto"
                            // mah={220}
                            w="auto"
                            maw="80%"
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
            </>
          )}
        </Grid.Col>
      </Grid>
    </>
  )
}
