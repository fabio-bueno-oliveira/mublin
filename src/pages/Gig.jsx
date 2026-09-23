import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchGigDetails, fetchGigApplicationDetails } from '../queries/gigs'
import AppNavbarMobile from '../components/AppNavbarMobile'
import {
  Container,
  Affix,
  Table,
  DataList,
  Anchor,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  Paper,
  Avatar,
  Modal,
  Divider,
  ActionIcon,
  Alert,
  Spoiler,
  EmptyState,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconCheck,
  IconExclamationCircleFilled,
  IconClock,
  IconEye,
  IconX,
  IconMoodSad,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'

// ── Helpers ───────────────────────────────────────────────

function gigDate(gig) {
  return gig?.date ?? null
}

function gigVenue(gig) {
  if (!gig?.venue_name) {
    return null
  }
  const city = gig?.venue_city?.name
  const uf = gig?.venue_city?.regions?.uf
  return `${gig.venue_name}${city ? ` · ${city}` : ''}${uf ? `/${uf}` : ''}`
}

function daysUntil(dateStr) {
  if (!dateStr) {
    return null
  }
  return dayjs(dateStr).diff(dayjs(), 'day')
}

function UrgencyBadge({ dateStr }) {
  const days = daysUntil(dateStr)
  if (days === null) {
    return null
  }

  if (days < 0) {
    return (
      <Badge size="md" color="gray" variant="light" mb="xs">
        Passou
      </Badge>
    )
  }
  if (days === 0) {
    return (
      <Badge size="md" color="red" variant="filled" mb="xs">
        Hoje!
      </Badge>
    )
  }
  if (days <= 2) {
    return (
      <Badge size="md" color="red" variant="light" mb="xs">
        em {days} dias
      </Badge>
    )
  }
  if (days <= 7) {
    return (
      <Badge size="md" color="orange" variant="light" mb="xs">
        em {days} dias
      </Badge>
    )
  }
  if (days <= 30) {
    return (
      <Badge size="md" color="yellow" variant="light" mb="xs">
        em {days} dias
      </Badge>
    )
  }
  return (
    <Badge size="sm" color="gray" variant="light" mb="xs">
      {dayjs(dateStr).fromNow()}
    </Badge>
  )
}

export default function GigApplicationDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  const [roleDetailOpened, { open: openRoleDetail, close: closeRoleDetail }] =
    useDisclosure(false)
  const [selectedRole, setSelectedRole] = useState()

  const handleOpenModalRoleDetail = (role) => {
    setSelectedRole(role)
    openRoleDetail()
  }

  const {
    data: gig = [],
    isLoading: loadingGig,
    isSuccess,
  } = useQuery({
    queryKey: ['gig-details', id],
    queryFn: () => fetchGigDetails(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: gigApplication = [], isLoading: loadingGigApplicationDetails } = useQuery(
    {
      queryKey: ['user-gig-application', user?.id],
      queryFn: () => fetchGigApplicationDetails(user.id, id),
      enabled: !!user?.id,
      staleTime: 1000 * 60 * 4,
    },
  )

  const nextDays = daysUntil(gigDate(gig))

  // mesmo padrão de items usado no DataList do GigInvitation.jsx
  const dataListDetails = [
    {
      label: 'Data',
      value: gigDate(gig)
        ? `${dayjs(gigDate(gig)).format('dddd, D [de] MMMM [de] YYYY')}${
            nextDays > 0 ? ` (em ${nextDays} dias)` : ''
          }`
        : 'Não informada',
      disabled: !gigDate(gig),
    },
    {
      label: 'Horário',
      value:
        gig?.time_stage_start || gig?.time_stage_end
          ? `das ${gig?.time_stage_start?.slice(0, 5) || '--:--'} às ${
              gig?.time_stage_end?.slice(0, 5) || '--:--'
            }`
          : 'Não informado',
      disabled: !gig?.time_stage_start && !gig?.time_stage_end,
    },
    {
      label: 'Local',
      value: gigVenue(gig) || 'Não informado',
      disabled: !gigVenue(gig),
    },
    {
      label: 'Tipo',
      value: gig?.event_types?.name || 'Não informado',
      disabled: !gig?.event_types?.name,
    },
    {
      label: 'Remunerado',
      value: gig?.has_remuneration ? 'Sim' : 'Não',
    },
    {
      label: 'Dress code',
      value: gig?.dress_code_types?.name || 'Não informado',
      disabled: !gig?.dress_code_types?.name,
    },
  ]

  const renderLeftSection = (status) => {
    const props = { color: status?.color, stroke: 3, size: 12 }

    switch (status?.id) {
      case 1:
        return <IconClock {...props} />
      case 2:
        return <IconCheck {...props} />
      default:
        return null
    }
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{isSuccess ? `${gig?.title} · Mublin` : 'Mublin'}</title>
        <link rel="canonical" href={`https://mublin.com/gig/${gig?.slug}`} />
        <meta name="description" content={`Gig '${gig?.title}' no Mublin`} />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName={`Detalhes da gig`} />
      </Affix>

      <Container size="xl" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <Stack>
          {loadingGig ? (
            <Text mt="lg" ta="center" c="dimmed">
              Carregando...
            </Text>
          ) : isSuccess ? (
            <Paper p="sm" radius="lg" withBorder>
              <Stack gap={2}>
                <Stack gap={0} mb={8}>
                  <UrgencyBadge dateStr={gigDate(gig)} />
                  <Title order={1} fz="h3" w="100%">
                    {gig?.title}
                  </Title>
                  {gig?.events?.id && (
                    <Text size="xs" c="dimmed">
                      parte do evento{' '}
                      <Anchor component={Link} to={`/event/${gig.events.slug}`} size="xs">
                        {gig.events.name}
                      </Anchor>
                    </Text>
                  )}
                  <Text size="xs" mb="xs" c="dimmed">
                    postado por{' '}
                    <Anchor component={Link} to={`/${gig?.profiles?.username}`}>
                      {gig?.profiles?.full_name}
                    </Anchor>{' '}
                    {dayjs(gig?.created_at).fromNow()}
                  </Text>
                  {nextDays !== null && nextDays <= 2 && (
                    <IconExclamationCircleFilled size={15} color="orange" />
                  )}
                  <Group my={4} gap="xs">
                    <Avatar
                      size={40}
                      radius="md"
                      src={
                        gig?.projects?.picture
                          ? `${PROJECT_AVATAR_PATH}/${gig?.projects?.id}/tr:h-80,w-80,c-maintain_ratio/${gig?.projects?.picture}`
                          : undefined
                      }
                      alt={gig?.projects?.name}
                    />
                    <Stack gap={0}>
                      <Text
                        c="var(--mantine-color-text)"
                        size="md"
                        fw={500}
                        component={Link}
                        to={`/project/${gig?.projects?.slug}`}
                      >
                        {gig?.projects?.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {gig?.projects?.project_types?.name_ptbr}
                      </Text>
                    </Stack>
                  </Group>
                </Stack>
                <DataList p={0} gap={4} size="sm" orientation="horizontal">
                  {dataListDetails.map((item) => (
                    <DataList.Item key={item.label}>
                      <DataList.ItemLabel>{item.label}</DataList.ItemLabel>
                      <DataList.ItemValue c={item.disabled ? 'dimmed' : undefined}>
                        {item.value}
                      </DataList.ItemValue>
                    </DataList.Item>
                  ))}
                </DataList>
              </Stack>
            </Paper>
          ) : (
            <EmptyState
              icon={<IconMoodSad />}
              title="Gig não encontrada"
              description="Talvez ela tenha sido removida ou você tenha digitado um endereço incorreto."
            >
              <EmptyState.Actions>
                <Button variant="default" component={Link} to="/search">
                  Encontrar gigs
                </Button>
              </EmptyState.Actions>
            </EmptyState>
          )}

          {isSuccess && (
            <Paper p="sm" radius="lg" withBorder>
              <Title order={5}>Sobre a gig</Title>
              {gig?.description ? (
                <Spoiler
                  mt="xs"
                  maxHeight={60}
                  showLabel="...ver mais"
                  hideLabel="...ver menos"
                >
                  <Text size="sm">{gig?.description}</Text>
                </Spoiler>
              ) : (
                <Text size="sm" c="dimmed" mt={4}>
                  Descrição não fornecida
                </Text>
              )}
            </Paper>
          )}

          {gig?.id && (
            <Paper p="sm" radius="lg" withBorder>
              <Title order={5} mb="xs">
                Vagas para esta gig:
              </Title>
              {!loadingGig && !loadingGigApplicationDetails && (
                <Stack>
                  {gig?.gig_roles?.map((role) => (
                    <Paper
                      withBorder
                      bg="mublinColor.8"
                      c="white"
                      key={role.id}
                      value={role.id}
                      p="xs"
                    >
                      <Group justify="space-between">
                        <Stack gap={4}>
                          <Group gap={6} align="center">
                            <Text size="md" lh={1}>
                              {role.roles?.description_ptbr}
                            </Text>
                            {gig?.has_remuneration && !role.is_filled && (
                              <Badge
                                variant="filled"
                                size="md"
                                color="lime.2"
                                autoContrast
                              >
                                {role.fee
                                  ? role.fee.toLocaleString('pt-br', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    })
                                  : 'Não disponível'}
                              </Badge>
                            )}
                            {role.is_filled && (
                              <Badge variant="outline" size="md" color="white">
                                Vaga preenchida
                              </Badge>
                            )}
                          </Group>
                          {role.id === gigApplication?.gig_roles.id && (
                            <Text size="xs" lh={1}>
                              ✓ Você aplicou para esta vaga{' '}
                              {dayjs(gigApplication.created_at).fromNow()}
                            </Text>
                          )}
                        </Stack>
                        <ActionIcon
                          size="md"
                          variant="subtle"
                          onClick={() => handleOpenModalRoleDetail(role)}
                        >
                          <IconEye size={18} color="white" />
                        </ActionIcon>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          )}
        </Stack>
      </Container>
      <Modal
        opened={roleDetailOpened}
        onClose={closeRoleDetail}
        title={`${selectedRole?.roles?.description_ptbr} para atuar em ${gig?.projects?.name} em ${dayjs(gigDate(gig)).format('dddd, D [de] MMMM [de] YYYY')}`}
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Stack gap="xs" mt="sm">
          {selectedRole?.is_filled && (
            <Alert variant="light" color="lime" p="xs">
              Esta vaga já foi preenchida!
            </Alert>
          )}
          {!selectedRole?.is_filled && (
            <Alert variant="light" color="gray" p={4}>
              <Group gap={6}>
                <IconClock size={16} />
                <Text size="xs">O criador da vaga ainda está avaliando candidaturas</Text>
              </Group>
            </Alert>
          )}
          <Table
            verticalSpacing={2}
            horizontalSpacing={0}
            fz="sm"
            variant="vertical"
            layout="fixed"
            withRowBorders={false}
          >
            <Table.Tbody>
              <Table.Tr>
                <Table.Th bg="transparent" w={120} c="dimmed" fw={400}>
                  Nível desejado
                </Table.Th>
                <Table.Td>{selectedRole?.experience_levels?.name_pt}</Table.Td>
              </Table.Tr>

              {!selectedRole?.is_filled && (
                <Table.Tr>
                  <Table.Th bg="transparent" c="dimmed" fw={400}>
                    Cachê
                  </Table.Th>
                  <Table.Td>
                    {selectedRole?.fee
                      ? selectedRole?.fee.toLocaleString('pt-br', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : 'Não disponível'}
                  </Table.Td>
                </Table.Tr>
              )}

              {selectedRole?.is_sub && (
                <Table.Tr>
                  <Table.Th bg="transparent" c="dimmed" fw={400}>
                    Substituindo
                  </Table.Th>
                  <Table.Td>
                    <Group gap={6}>
                      <Avatar
                        size="xs"
                        radius="xl"
                        src={
                          selectedRole?.profiles?.avatar
                            ? `https://ik.imagekit.io/mublin/users/avatars/tr:h-60,w-60,c-maintain_ratio/${selectedRole?.profiles.avatar}`
                            : undefined
                        }
                      />
                      <Text size="sm">
                        {selectedRole?.sub_for
                          ? selectedRole?.profiles?.username
                          : 'Nome não disponível'}
                      </Text>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <Text size="sm" fw={400} c="dimmed">
            Sobre a vaga:
          </Text>
          <Spoiler
            fz="sm"
            maxHeight={60}
            showLabel="...ver mais"
            hideLabel="...ver menos"
          >
            {selectedRole?.description}
          </Spoiler>
        </Stack>

        {selectedRole?.id === gigApplication?.gig_roles?.id && (
          <>
            <Divider my="sm" />
            <Text size="xs" mb={6}>
              ✓ Você aplicou para esta vaga em{' '}
              {dayjs(gigApplication.created_at).format('D [de] MMMM [de] YYYY')}
            </Text>
            <Button
              fullWidth
              size="xs"
              color="red"
              variant="outline"
              leftSection={<IconX size={14} stroke={3} />}
            >
              Retirar meu interesse
            </Button>
          </>
        )}
      </Modal>
    </>
  )
}
