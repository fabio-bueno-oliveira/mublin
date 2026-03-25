import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { fetchRandomOtherProjects } from '../queries/projects'
import {
  Box, Container, Grid, Stack, Group, Text, Title,
  Avatar, Badge, Button, Paper, Divider, Flex, Tabs, 
  ScrollArea, ActionIcon, ThemeIcon, Skeleton, Image
} from '@mantine/core'
import {
  IconCalendarEvent, IconTarget, IconBell,
  IconUsers, IconChevronRight,
  IconHexagonPlus, IconStar, IconClock, 
  IconMusic, IconDots,
  IconWorldBolt
} from '@tabler/icons-react'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

// ── Mock data ────────────────────────────────────────────

const GOALS = [
  { id: 1, label: 'Gravar EP de estreia', progress: 65, color: 'amber' },
  { id: 2, label: 'Fechar 10 gigs em 2025', progress: 40, color: 'blue' },
  { id: 3, label: 'Completar perfil', progress: 80, color: 'green' },
]

const NOTIFICATIONS = [
  { id: 1, text: 'Carlos Mota se candidatou à sua gig de baterista', time: 'há 10 min', unread: true, icon: IconCalendarEvent, color: 'amber' },
  { id: 2, text: 'Banda Paralela adicionou você como membro', time: 'há 1h', unread: true, icon: IconMusic, color: 'blue' },
  { id: 3, text: 'Julia Ramos começou a te seguir', time: 'há 3h', unread: false, icon: IconUsers, color: 'grape' },
  { id: 4, text: 'Sua gig de guitarrista foi visualizada 12x', time: 'há 5h', unread: false, icon: IconStar, color: 'yellow' },
]

const SUGGESTED_USERS = [
  { id: 1, name: 'Ana Souza', role: 'Produtora Musical', city: 'São Paulo, SP', initials: 'AS', color: '#C8853A', mutual: 3 },
  { id: 2, name: 'Pedro Lima', role: 'Baterista de Sessão', city: 'Rio de Janeiro, RJ', initials: 'PL', color: '#3A7AC8', mutual: 1 },
  { id: 3, name: 'Julia Ramos', role: 'Vocalista', city: 'Belo Horizonte, MG', initials: 'JR', color: '#7A3AC8', mutual: 5 },
]

const FEED_POSTS = [
  { id: 1, author: 'Banda Paralela', type: 'project', text: 'Acabamos de publicar nossa nova gig: precisamos de um tecladista para show em maio.', time: 'há 2h', initials: 'BP', color: '#3AC87A' },
  { id: 2, author: 'Carlos Mota', type: 'user', text: 'Acabei de atualizar meu setup de som. Novo console Allen & Heath SQ5 disponível para gigs!', time: 'há 4h', initials: 'CM', color: '#C83A3A' },
  { id: 3, author: 'Trio Acústico SP', type: 'project', text: 'Show confirmado no Bar Sagarana no dia 28/03. Ingressos disponíveis no link do perfil.', time: 'há 6h', initials: 'TA', color: '#C8853A' },
]

// ── Sub-componentes ──────────────────────────────────────

// eslint-disable-next-line no-unused-vars
function SectionCard({ title, icon: Icon, action, children }) {
  return (
    <Paper p="lg" radius="md" withBorder style={{ height: '100%' }}>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Icon size={15} />
          <Text fw={700} size="sm">{title}</Text>
        </Group>
        {action && (
          <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
            <IconDots size={15} />
          </ActionIcon>
        )}
      </Group>
      {children}
    </Paper>
  )
}

function ProjectSkeletons({ count = 10 }) {
  return Array.from({ length: count }).map((_, i) => (
    <Flex key={i} direction="column" align="center" gap={10}>
      <Skeleton radius="md" width={90} height={130} />
      <Skeleton radius="xl" width={50} height={10} />
    </Flex>
  ))
}

// ── Página principal ─────────────────────────────────────

export default function Home() {
  const { profile, user } = useAuth()

  const { data: savedProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-home-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: randomProjects = [], isLoading: loadingRandomProjects } = useQuery({
    queryKey: ['random-projects', user?.id],
    queryFn: () => fetchRandomOtherProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const userProjects = savedProjects.map((r) => ({
    id: r.projects.id,
    name: r.projects.name,
    slug: r.projects.slug,
    picture: r.projects.picture,
    status: r.status,
  }))

  const randomProjectsList = randomProjects.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    picture: r.picture,
  }))

  return (
    <>
      {/* {isMobile && // Logo + header para mobile
        <Text>Teste</Text>
      } */}
      <Container size="xl" py="xs" px={0}>
        <Stack gap="xl">
          <Tabs variant="pills" radius="xl" color='indigo.9' defaultValue="projects">
            <Flex gap="xs" align="flex-start" mb="lg">
              <Avatar
                size={34}
                src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
                radius="xl"
                component={Link}
                to={`/${profile?.username}`}
              />
              <Tabs.List>
                <Tabs.Tab value="projects">
                  Projetos
                </Tabs.Tab>
                <Tabs.Tab value="gigs">
                  Gigs
                </Tabs.Tab>
                <Tabs.Tab value="feed">
                  Feed
                </Tabs.Tab>
              </Tabs.List>
            </Flex>
            <Tabs.Panel value="projects" mih='120px'>
              <ScrollArea w="100%" type="never">
                <Flex gap={14}>
                  <Flex direction="column" align="center" gap={10}>
                    <Avatar
                      w={90}
                      h={130}
                      color="gray"
                      radius="md"
                      variant="light"
                      component={Link}
                      to='/new/project'
                    >
                      <IconHexagonPlus size="1.5rem" color="gray" stroke={1.5} />
                    </Avatar>
                    <Text size="0.75rem" fw={480}>Novo projeto</Text>
                  </Flex>

                  {loadingProjects && <ProjectSkeletons />}

                  {!loadingProjects && userProjects?.map(item => (
                    <Flex
                      key={item.id}
                      direction="column"
                      align="center"
                      gap={10}
                      component={Link}
                      to={`/project/${item.slug ?? item.id}`}
                      style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                    >
                      <Box style={{ position: 'relative', width: 90, height: 130, borderRadius: 8, overflow: 'hidden' }}>
                        <Image
                          w={90}
                          h={130}
                          fit="cover"
                          src={
                            item.picture
                              ? `https://ik.imagekit.io/mublin/projects/tr:h-260,w-180,c-maintain_ratio/${item.picture}`
                              : undefined
                          }
                          fallbackSrc="https://placehold.co/90x130?text=Sem+foto"
                          style={{ opacity: item.status === 1 ? 0.4 : 1, transition: 'opacity 0.2s' }}
                        />
                        {item.status === 1 && (
                          <Flex
                            align="center"
                            justify="center"
                            pos='absolute'
                            style={{
                              inset: 0,
                              background: 'rgba(0,0,0,0.18)',
                            }}
                          >
                            <IconClock size={24} color="white" stroke={1.5} />
                          </Flex>
                        )}
                      </Box>
                      <Text
                        ta="center"
                        w={65}
                        size="0.75rem"
                        fw={480}
                        truncate="end"
                        title={item.status === 1 ? `${item.name} (pendente de aprovação)` : item.name}
                        c={item.status === 1 ? 'dimmed' : 'inherit'}
                      >
                        {item.name}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </ScrollArea>
            </Tabs.Panel>
            <Tabs.Panel value="gigs" mih='120px'>
              <Title order={2} fz="h3" fw={700} lts="-0.02em" mb={24}>
                Gigs
              </Title>
            </Tabs.Panel>
            <Tabs.Panel value="feed" mih='120px'>
              <Stack gap={0}>
                {FEED_POSTS.map((post, i) => (
                  <Box key={post.id}>
                    <Group gap="sm" align="flex-start" py="sm">
                      <Avatar
                        size={36}
                        radius="xl"
                        style={{ background: post.color, color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}
                      >
                        {post.initials}
                      </Avatar>
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Group gap="xs">
                          <Text size="sm" fw={700}>{post.author}</Text>
                          <Badge size="xs" variant="light" color={post.type === 'project' ? 'amber' : 'blue'}>
                            {post.type === 'project' ? 'Projeto' : 'Músico'}
                          </Badge>
                          <Text size="xs" c="dimmed" ml="auto">{post.time}</Text>
                        </Group>
                        <Text size="sm" c="dimmed" lh={1.5}>{post.text}</Text>
                      </Stack>
                    </Group>
                    {i < FEED_POSTS.length - 1 && <Divider />}
                  </Box>
                ))}
              </Stack>
              <Button variant="subtle" color="gray" size="xs" fullWidth mt="sm" rightSection={<IconChevronRight size={13} />}>
                Ver feed completo
              </Button>
            </Tabs.Panel>
          </Tabs>

          {/* ── Grid principal ── */}
          <Grid gutter="md">
            {/* Metas + Notificações */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Stack gap="md" h="100%">

                <SectionCard title="Explorar" icon={IconWorldBolt} action>
                  <Flex gap={18}>
                    {loadingRandomProjects && <ProjectSkeletons />}

                    {!loadingRandomProjects && randomProjectsList?.map(item => (
                      <Flex
                        key={item.id}
                        direction="column"
                        align="center"
                        gap={10}
                        component={Link}
                        to={`/project/${item.slug ?? item.id}`}
                        style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                      >
                        <Image
                          radius="md"
                          w={90}
                          h={130}
                          fit="cover"
                          src={
                            item.picture
                              ? `https://ik.imagekit.io/mublin/projects/tr:h-260,w-180,c-maintain_ratio/${item.picture}`
                              : undefined
                          }
                          fallbackSrc="https://placehold.co/90x130?text=Sem+foto"
                        />
                        <Text
                          w={65}
                          ta="center" 
                          size="0.75rem" 
                          fw={480} 
                          truncate="end"
                          title={item.name}
                        >
                          {item.name}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                </SectionCard>

                {/* Metas */}
                <SectionCard title="Metas" icon={IconTarget} action>
                  <Stack gap="sm">
                    {GOALS.map(goal => (
                      <Box key={goal.id}>
                        <Group justify="space-between" mb={4}>
                          <Text size="sm" fw={500}>{goal.label}</Text>
                          <Text size="xs" c="dimmed" fw={600}>{goal.progress}%</Text>
                        </Group>
                        <Box
                          style={{
                            height: 6,
                            background: 'var(--mantine-color-default-border)',
                            borderRadius: 100,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            style={{
                              height: '100%',
                              width: `${goal.progress}%`,
                              background: `var(--mantine-color-${goal.color}-6)`,
                              borderRadius: 100,
                              transition: 'width 0.6s ease',
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </SectionCard>

                {/* Notificações */}
                <SectionCard title="Notificações" icon={IconBell} action>
                  <Stack gap={0}>
                    {NOTIFICATIONS.map((n, i) => {
                      const Icon = n.icon
                      return (
                        <Box key={n.id}>
                          <Group gap="sm" align="flex-start" py="xs"
                            style={{ opacity: n.unread ? 1 : 0.6 }}
                          >
                            <ThemeIcon size={28} radius="xl" color={n.color} variant="light" style={{ flexShrink: 0, marginTop: 2 }}>
                              <Icon size={14} />
                            </ThemeIcon>
                            <Stack gap={2} style={{ flex: 1 }}>
                              <Text size="xs" lh={1.5}>{n.text}</Text>
                              <Group gap={4}>
                                {n.unread && <Box w={6} h={6} style={{ borderRadius: '50%', background: 'var(--mantine-color-amber-6)' }} />}
                                <Text size="xs" c="dimmed">{n.time}</Text>
                              </Group>
                            </Stack>
                          </Group>
                          {i < NOTIFICATIONS.length - 1 && <Divider />}
                        </Box>
                      )
                    })}
                  </Stack>
                </SectionCard>

              </Stack>
            </Grid.Col>

            {/* Pessoas para conhecer */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <SectionCard title="Pessoas para conhecer" icon={IconUsers} action>
                <Stack gap="sm">
                  {SUGGESTED_USERS.map(user => (
                    <Group key={user.id} justify="space-between">
                      <Group gap="sm">
                        <Avatar size={36} radius="xl" style={{ background: user.color, color: '#fff', fontWeight: 700, fontSize: 13 }}>
                          {user.initials}
                        </Avatar>
                        <Stack gap={1}>
                          <Text size="sm" fw={600} lh={1.2}>{user.name}</Text>
                          <Text size="xs" c="dimmed">{user.role}</Text>
                          <Text size="xs" c="dimmed">{user.mutual} conexões em comum</Text>
                        </Stack>
                      </Group>
                      <Button size="xs" variant="light" color="amber" radius="xl">
                        Conectar
                      </Button>
                    </Group>
                  ))}
                </Stack>
                <Button variant="subtle" color="gray" size="xs" fullWidth mt="md" rightSection={<IconChevronRight size={13} />}>
                  Ver mais sugestões
                </Button>
              </SectionCard>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </>
  )
}
