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
  Affix,
  Grid,
  DataList,
  Button,
  Avatar,
  Text,
  Group,
  Flex,
  Stack,
  Box,
  Alert,
  Badge,
  Image,
  Center,
  Paper,
  Anchor,
  Tooltip,
  Loader,
  em,
  Title,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { motion } from 'motion/react'
import {
  IconMoodSad,
  IconArrowLeft,
  IconMusic,
  IconArrowRight,
} from '@tabler/icons-react'
import AppNavbarMobile from '../components/AppNavbarMobile'
import parse from 'html-react-parser'
import linkifyStr from 'linkify-string'
import { getAvatarUrl } from '../utils/profile'

const PRODUCT_IMG_LG =
  'https://ik.imagekit.io/mublin/products/tr:w-600,cm-pad_resize,bg-FFFFFF/'

export default function ProfileGearItem() {
  const { username, profileGearItemId } = useParams()
  const navigate = useNavigate()
  const { loading: authLoading } = useAuth()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

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

  const { data: setupNames = {} } = useQuery({
    queryKey: ['profile-gear-setup-names', profile?.id],
    queryFn: () => fetchProfileGearSetupNames(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  // Item atual baseado no ID da rota
  const selectedItem = gearAll.find((g) => String(g.id) === String(profileGearItemId))

  if (authLoading || loadingProfile || loadingGear) {
    return (
      <Center mih="70vh">
        <Loader />
      </Center>
    )
  }

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

  if (!loadingGear && gearAll.length > 0 && !selectedItem) {
    return (
      <Container size="sm" py={48}>
        <Alert
          icon={<IconMoodSad size={18} />}
          title="Item não encontrado"
          color="gray"
          radius="md"
        >
          Este item não existe no equipamento de <strong>@{username}</strong>.
        </Alert>
        <Button
          mt="md"
          leftSection={<IconArrowLeft size={16} />}
          variant="light"
          onClick={() => navigate(`/${username}/gear`)}
        >
          Voltar para o equipamento
        </Button>
      </Container>
    )
  }

  const data = [
    { label: 'Marca', value: selectedItem.products?.brands?.name, active: true },
    {
      label: 'Categoria',
      value: selectedItem.products?.product_categories?.name_ptbr,
      active: true,
    },
    { label: 'Ano', value: selectedItem.year ?? 'Não informado', active: true },
    {
      label: 'À venda',
      value: (
        <Flex align="center" justify="center" gap={6}>
          <Badge color={selectedItem?.is_for_sale ? 'green' : 'dark'}>
            {selectedItem?.is_for_sale ? 'Sim' : 'Não'}
          </Badge>
          {selectedItem?.is_for_sale && selectedItem?.price && (
            <Text size="sm" fw={500}>
              {Number(selectedItem?.price).toLocaleString('pt-br', {
                style: 'currency',
                currency: 'BRL',
              })}
            </Text>
          )}
        </Flex>
      ),
      active: true,
    },
    {
      label: 'Setups',
      value: (
        <Group gap={3} wrap="wrap" mt={6}>
          {setupNames[selectedItem.id_product]?.map((name) => (
            <Badge key={name} size="sm" variant="filled" color="mublinColor">
              {name}
            </Badge>
          ))}
        </Group>
      ),
      active: setupNames[selectedItem?.id_product]?.length > 0,
    },
    {
      label: 'Afinação',
      value: (
        <Stack gap={0}>
          <Text size="sm">Afinação: {selectedItem?.tunings?.name_ptbr}</Text>
          {selectedItem.tunings?.description && (
            <Group gap={2} mt={2} align="center">
              <IconMusic size={17} color="gray" />
              <Text size="xs" c="dimmed">
                {selectedItem?.tunings?.description}
              </Text>
            </Group>
          )}
        </Stack>
      ),
      active: selectedItem.tunings?.name_ptbr,
    },
  ]

  return (
    <>
      {isMobile && (
        <Affix position={{ top: 0, left: 0 }} w="100%">
          <AppNavbarMobile pageName={`Item de ${profile.username}`} />
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
          <Text size="lg" fw={500} lineClamp={1} truncate="end">
            {profile.full_name}
          </Text>
          <Text size="sm" c="dimmed">
            {gearAll.length} {gearAll.length === 1 ? 'item' : 'itens'} no equipamento
          </Text>
        </Grid.Col>

        {/* Conteúdo principal */}
        <Grid.Col
          span={{ base: 12, md: 10 }}
          mt={{ base: 'sm', md: 'lg' }}
          px={{ base: 'md', md: 0 }}
        >
          <Group gap="xs" visibleFrom="sm">
            <Button
              variant="filled"
              size="sm"
              leftSection={<IconArrowLeft size={16} />}
              // onClick={() => navigate(-1) || navigate(`/${username}/gear`)}
              onClick={() => navigate(`/${username}/gear`)}
              mb="md"
            >
              Voltar
            </Button>
            <Button
              variant="filled"
              size="sm"
              rightSection={<IconArrowRight size={16} />}
              component={Link}
              to={`/gear/${selectedItem.products?.slug}`}
              mb="md"
            >
              Ver perfil completo deste item
            </Button>
          </Group>

          {selectedItem ? (
            <>
              <Paper withBorder radius="md" p="md">
                <Stack gap={4} mb="lg" justify="flex-start" align="flex-start">
                  <Group gap={4}>
                    <Text size="sm" fw={200} c="dimmed">
                      Item do equipamento de
                    </Text>
                    <Anchor component={Link} to={`/${username}`} size="xs" fw={500}>
                      @{profile.username}
                    </Anchor>
                  </Group>
                  <Title order={1} fz="h3" fw={600}>
                    {selectedItem.products?.brands?.name} {selectedItem.products?.name}
                  </Title>
                </Stack>

                <Grid mt={10}>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Center>
                      <Box pos="relative" w="fit-content">
                        <Link to={`/gear/${selectedItem.products?.slug}`}>
                          <Image
                            src={
                              selectedItem.products?.picture
                                ? PRODUCT_IMG_LG + selectedItem.products.picture
                                : undefined
                            }
                            w={180}
                            fit="contain"
                            mb={12}
                            radius="md"
                            fallbackSrc="https://ik.imagekit.io/mublin/products/tr:w-400,cm-pad_resize,bg-FFFFFF/no-picture.png"
                          />
                        </Link>

                        {/* Avatar flutuante: reforça que o item pertence a este perfil */}
                        <motion.div
                          style={{
                            position: 'absolute',
                            top: -10,
                            right: -10,
                            zIndex: 2,
                          }}
                          animate={{ y: [0, -8, 0] }}
                          transition={{
                            duration: 3.2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <Tooltip
                            label={`Equipamento de @${profile.username}`}
                            position="left"
                            withArrow
                          >
                            <Anchor component={Link} to={`/${username}`}>
                              <Avatar
                                size={60}
                                src={getAvatarUrl(
                                  profile.avatar,
                                  profile.is_open_to_work,
                                  120,
                                )}
                                style={{
                                  border: '3px solid var(--mantine-color-body)',
                                  boxShadow: '0 6px 14px rgba(0, 0, 0, 0.2)',
                                }}
                              />
                            </Anchor>
                          </Tooltip>
                        </motion.div>
                      </Box>
                    </Center>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <DataList orientation="horizontal">
                      {data.map((item) =>
                        item.active ? (
                          <DataList.Item key={item.label}>
                            <DataList.ItemLabel>{item.label}</DataList.ItemLabel>
                            <DataList.ItemValue>{item.value}</DataList.ItemValue>
                          </DataList.Item>
                        ) : null,
                      )}
                    </DataList>
                    {selectedItem.owner_comments && (
                      <Box mt="md">
                        <Text size="sm" c="dimmed">
                          Comentários de {profile.full_name}:
                        </Text>
                        <Text size="sm">
                          {parse(
                            linkifyStr(selectedItem.owner_comments, {
                              target: '_blank',
                            }),
                          )}
                        </Text>
                      </Box>
                    )}
                  </Grid.Col>
                </Grid>
              </Paper>
              <Button
                hiddenFrom="sm"
                variant="filled"
                size="md"
                mt="lg"
                fullWidth
                rightSection={<IconArrowRight size={16} />}
                component={Link}
                to={`/gear/${selectedItem.products?.slug}`}
              >
                Ver perfil completo deste item
              </Button>
            </>
          ) : (
            <Center mih={200}>
              <Loader size="sm" />
            </Center>
          )}
        </Grid.Col>
      </Grid>
    </>
  )
}
