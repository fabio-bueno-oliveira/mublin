import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { fetchProjectGigs } from '../../queries/projects'
import {
  Container,
  Group,
  Stack,
  Card,
  Title,
  Text,
  Anchor,
  Avatar,
  Divider,
  Center,
  Loader,
  Badge,
} from '@mantine/core'
import dayjs from 'dayjs'
import {
  IconArrowUpRight,
  IconCheck,
  IconClock,
  IconLock,
  IconWorld,
} from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function SectionGigs({ projectId }) {
  const { profile } = useAuth()

  const { data: gigs = [], isLoading } = useQuery({
    queryKey: ['project-gigs', projectId],
    queryFn: () => fetchProjectGigs(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  })

  const privacyIcon = (id) => {
    if (id === 1) {
      return <IconWorld size={12} color="gray" />
    } else {
      return <IconLock size={12} color="gray" />
    }
  }

  return isLoading ? (
    <Center mt={80}>
      <Loader />
    </Center>
  ) : (
    <Container size="lg" px={{ base: 'sm', sm: 'md' }}>
      {gigs?.length > 0 ? (
        <>
          <Text py="sm" size="xs" c="dimmed">
            {gigs?.length} eventos cadastrados
          </Text>
          <Stack>
            {gigs.map((gig) => {
              const loggedUserIsTheGigCreator = gig?.author?.username === profile.username
              const gigRoles = gig?.gig_roles
              const isPastGig = gig?.date
                ? dayjs(gig.date).isBefore(dayjs(), 'day')
                : false

              return (
                <Card key={gig.id} withBorder radius="lg" px="lg" py="md">
                  {gig?.event?.id && (
                    <>
                      <Text size="xs" c="dimmed">
                        Esta gig {isPastGig ? 'aconteceu' : 'acontecerá'} no evento{' '}
                        <Anchor
                          component={Link}
                          to={`/event/${gig.event.slug}`}
                          size="xs"
                        >
                          {gig.event.name}
                        </Anchor>
                      </Text>
                      <Divider variant="dashed" my="xs" />
                    </>
                  )}

                  <Group gap={6}>
                    <Text size="xs">
                      {gig?.date
                        ? dayjs(gig?.date).format('dddd, D [de] MMMM [de] YYYY')
                        : 'Não informada'}
                    </Text>
                    {isPastGig && (
                      <Badge size="xs" variant="light" color="red">
                        Passou
                      </Badge>
                    )}
                  </Group>

                  <Title order={1} fw={600} fz="xl" mt={4} mb={4}>
                    {gig?.title}
                  </Title>

                  <Group gap={6} align="center" wrap="nowrap">
                    <Text size="xs" c="dimmed" lh={1}>
                      evento criado por
                    </Text>
                    <Group gap={5} align="center" wrap="nowrap">
                      <Avatar
                        component={Link}
                        to={`/${gig?.author?.username}`}
                        src={
                          loggedUserIsTheGigCreator
                            ? AVATAR_PATH + profile.avatar
                            : AVATAR_PATH + gig?.author?.avatar
                        }
                        radius="xl"
                        size={18}
                        title={gig?.author?.username}
                      />
                      <Anchor
                        component={Link}
                        to={`/${gig?.author?.username}`}
                        fz="xs"
                        fw={500}
                        lh={1}
                        c="dimmed"
                        underline="hover"
                      >
                        {loggedUserIsTheGigCreator ? 'mim' : gig?.author?.full_name}
                      </Anchor>
                    </Group>
                    <Text size="xs" c="dimmed" lh={1}>
                      {dayjs(gig?.created_at).fromNow()}
                    </Text>
                  </Group>

                  <Group gap={5} mt="xs">
                    <Text size="xs">
                      <Text span c="dimmed">
                        Tipo do evento:
                      </Text>{' '}
                      <Text span>{gig?.type.name}</Text>
                    </Text>
                    <Divider orientation="vertical" />
                    <Group gap={5}>
                      {privacyIcon(gig?.privacy?.id)}
                      <Text size="xs" c="dimmed">
                        {gig?.privacy?.name}
                      </Text>
                    </Group>
                  </Group>

                  {!isPastGig ? (
                    <>
                      <Divider
                        label="Vagas:"
                        labelPosition="left"
                        mt="xs"
                        mb={4}
                        opacity={0.5}
                      />
                      {gigRoles.length > 0 ? (
                        <Group gap={6} wrap="wrap">
                          <Stack gap={8}>
                            {gigRoles.filter((g) => !g.is_filled).length > 0 && (
                              <Group gap={6} wrap="wrap">
                                <Text size="xs" w={80}>
                                  Em aberto:
                                </Text>
                                {gigRoles
                                  .filter((g) => !g.is_filled)
                                  .map((role) => {
                                    return (
                                      <Badge
                                        key={role.id}
                                        fw={300}
                                        h={26}
                                        size="md"
                                        radius="xl"
                                        variant="light"
                                        color="green"
                                        rightSection={
                                          <IconArrowUpRight size={14} stroke={2} />
                                        }
                                        component={Link}
                                        to={`/gig/${gig?.id}`}
                                      >
                                        {role?.role?.description_ptbr}{' '}
                                        {role?.is_sub && '(Sub)'}
                                      </Badge>
                                    )
                                  })}
                              </Group>
                            )}
                            {gigRoles.filter((g) => g.is_filled).length > 0 && (
                              <Group gap={6} wrap="wrap">
                                <Text size="xs" w={80}>
                                  Preenchidas:
                                </Text>
                                {gigRoles
                                  .filter((g) => g.is_filled)
                                  .map((role) => {
                                    const approved = role.gig_applications?.[0]?.profile

                                    return (
                                      <Badge
                                        key={role.id}
                                        fw={300}
                                        h={26}
                                        size="md"
                                        radius="xl"
                                        variant={role.is_filled ? 'filled' : 'light'}
                                        color={
                                          role.is_filled
                                            ? role?.is_sub
                                              ? 'grape.9'
                                              : 'mublinColor.9'
                                            : 'green'
                                        }
                                        leftSection={
                                          role.is_filled ? (
                                            <IconCheck size={14} stroke={2} />
                                          ) : undefined
                                        }
                                        rightSection={
                                          role.is_filled && approved ? (
                                            <Avatar
                                              component={Link}
                                              to={`/${approved.username}`}
                                              src={AVATAR_PATH + approved.avatar}
                                              radius="xl"
                                              size={18}
                                              title={approved.username}
                                            />
                                          ) : null
                                        }
                                      >
                                        {role?.role?.description_ptbr}{' '}
                                        {role?.is_sub && '(Sub)'}
                                      </Badge>
                                    )
                                  })}
                              </Group>
                            )}
                          </Stack>
                        </Group>
                      ) : (
                        <Text size="xs">Não há vagas criadas até o momento</Text>
                      )}
                    </>
                  ) : (
                    // É gig passada, oculta muitos detalhes sobre vagas
                    <Group gap={6} mt="xs" wrap="wrap">
                      {gigRoles.map((role) => {
                        const approved = role.gig_applications?.[0]?.profile

                        return (
                          <Badge
                            key={role.id}
                            fw={300}
                            h={26}
                            size="md"
                            radius="xl"
                            variant={role.is_filled ? 'filled' : 'light'}
                            color={role?.is_sub ? 'grape.9' : 'mublinColor.9'}
                            rightSection={
                              role.is_filled && approved ? (
                                <Avatar
                                  component={Link}
                                  to={`/${approved.username}`}
                                  src={AVATAR_PATH + approved.avatar}
                                  radius="xl"
                                  size={18}
                                  title={approved.username}
                                />
                              ) : null
                            }
                          >
                            {role?.role?.description_ptbr} {role?.is_sub && '(Sub)'}
                          </Badge>
                        )
                      })}
                    </Group>
                  )}

                  <Divider variant="dashed" my="xs" opacity={0.5} />

                  <Anchor size="xs" component={Link} to={`/gig/${gig?.id}`}>
                    Ver mais detalhes
                  </Anchor>
                </Card>
              )
            })}
          </Stack>
        </>
      ) : (
        <Card withBorder radius="lg" p="lg">
          <Title order={3} fz="lg" fw={600} mb="sm">
            Gigs
          </Title>
          <Text c="dimmed" size="sm">
            Nenhuma gig deste projeto cadastrada no momento
          </Text>
        </Card>
      )}
    </Container>
  )
}
