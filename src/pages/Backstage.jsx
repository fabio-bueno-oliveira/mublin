import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { fetchProjectBackstageInfo } from '../queries/projects'
import {
  Title, Text, Card, Badge,
  Select, Group, Stack,
  Grid, SimpleGrid, Box,
  Avatar, Progress, ThemeIcon,
  Divider, Paper, ScrollArea,
} from '@mantine/core'
import {
  IconUsers, IconCalendarEvent,
  IconMicrophone2, IconPlaylist,
  IconCurrencyDollar,IconTrendingUp,
  IconTrendingDown, IconClock, IconCheck,
  IconAlertCircle, IconMusic,
  IconStar, IconMapPin,
} from '@tabler/icons-react'

const PICTURE_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects/tr:h-200,w-200,c-maintain_ratio/'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DASHBOARD = {
  '1': {
    project: { name: 'The Midnight Echo', genre: 'Indie Rock', city: 'São Paulo, SP', picture: null },
    members: {
      confirmed: [
        { name: 'Lucas Ferreira', role: 'Vocalista', avatar: null },
        { name: 'Ana Lima', role: 'Guitarrista', avatar: null },
        { name: 'Marcos Souza', role: 'Baterista', avatar: null },
        { name: 'Juliana Costa', role: 'Baixista', avatar: null },
      ],
      pending: [
        { name: 'Rafael Mendes', role: 'Tecladista', avatar: null },
        { name: 'Carla Nunes', role: 'Backing Vocal', avatar: null },
      ],
    },
    shows: {
      upcoming: [
        { name: 'Show de Lançamento', date: '12 Abr 2026', venue: 'Carioca Club', city: 'São Paulo', status: 'confirmed' },
        { name: 'Festival Indie SP', date: '28 Abr 2026', venue: 'Audio Club', city: 'São Paulo', status: 'pending' },
        { name: 'Tour Rio', date: '10 Mai 2026', venue: 'Circo Voador', city: 'Rio de Janeiro', status: 'confirmed' },
      ],
      past: [
        { name: 'Noite Indie', date: '05 Mar 2026', venue: 'Canto do Frango', city: 'São Paulo' },
        { name: 'Open Bar Sessions', date: '18 Fev 2026', venue: 'Bar Opinião', city: 'Porto Alegre' },
      ],
    },
    rehearsals: [
      { date: '29 Mar 2026', time: '19h00', location: 'Estúdio Zona Sul', type: 'Ensaio geral' },
      { date: '05 Abr 2026', time: '14h00', location: 'Estúdio Zona Sul', type: 'Passagem de som' },
      { date: '11 Abr 2026', time: '20h00', location: 'Estúdio Zona Sul', type: 'Ensaio pré-show' },
    ],
    setlists: [
      { name: 'Set Lançamento', songs: 12, show: 'Show de Lançamento', status: 'final' },
      { name: 'Set Festival', songs: 8, show: 'Festival Indie SP', status: 'draft' },
      { name: 'Set Acústico', songs: 6, show: null, status: 'draft' },
    ],
    finance: {
      balance: 4250.0,
      income: 8500.0,
      expenses: 4250.0,
      pending_income: 3200.0,
      recent: [
        { description: 'Cachê – Noite Indie', type: 'income', value: 1500.0, date: '05 Mar' },
        { description: 'Aluguel estúdio – Mar', type: 'expense', value: -800.0, date: '01 Mar' },
        { description: 'Cachê – Open Bar Sessions', type: 'income', value: 2000.0, date: '18 Fev' },
        { description: 'Equipamento de PA', type: 'expense', value: -450.0, date: '14 Fev' },
        { description: 'Artes gráficas', type: 'expense', value: -200.0, date: '10 Fev' },
      ],
    },
  },
  '2': {
    project: { name: 'Banda Sertanejo Sul', genre: 'Sertanejo', city: 'Curitiba, PR', picture: null },
    members: {
      confirmed: [
        { name: 'Diego Alves', role: 'Vocalista', avatar: null },
        { name: 'Fernanda Porto', role: 'Vocalista', avatar: null },
        { name: 'Bruno Castro', role: 'Violonista', avatar: null },
      ],
      pending: [{ name: 'Igor Neto', role: 'Percussionista', avatar: null }],
    },
    shows: {
      upcoming: [
        { name: 'Rodeio de Londrina', date: '20 Abr 2026', venue: 'Parque de Exposições', city: 'Londrina', status: 'confirmed' },
      ],
      past: [
        { name: 'Festa do Peão', date: '15 Jan 2026', venue: 'Recinto', city: 'Curitiba' },
      ],
    },
    rehearsals: [
      { date: '01 Abr 2026', time: '18h00', location: 'Casa do Diego', type: 'Ensaio' },
    ],
    setlists: [
      { name: 'Set Rodeio', songs: 20, show: 'Rodeio de Londrina', status: 'final' },
    ],
    finance: {
      balance: 12000.0,
      income: 18000.0,
      expenses: 6000.0,
      pending_income: 8000.0,
      recent: [
        { description: 'Cachê – Festa do Peão', type: 'income', value: 5000.0, date: '15 Jan' },
        { description: 'Figurino', type: 'expense', value: -1200.0, date: '10 Jan' },
      ],
    },
  },
  '3': {
    project: { name: 'Jazz Collective SP', genre: 'Jazz', city: 'São Paulo, SP', picture: null },
    members: {
      confirmed: [
        { name: 'Henrique Leite', role: 'Saxofonista', avatar: null },
        { name: 'Patrícia Moura', role: 'Pianista', avatar: null },
        { name: 'Seu nome', role: 'Contrabaixista', avatar: null },
      ],
      pending: [],
    },
    shows: {
      upcoming: [
        { name: 'Jazz no Parque', date: '03 Mai 2026', venue: 'Parque Trianon', city: 'São Paulo', status: 'confirmed' },
      ],
      past: [],
    },
    rehearsals: [{ date: '02 Abr 2026', time: '20h00', location: 'Casa da Patrícia', type: 'Ensaio' }],
    setlists: [{ name: 'Set Parque', songs: 10, show: 'Jazz no Parque', status: 'draft' }],
    finance: {
      balance: 0,
      income: 0,
      expenses: 300.0,
      pending_income: 1500.0,
      recent: [{ description: 'Material impresso', type: 'expense', value: -300.0, date: '20 Mar' }],
    },
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color = 'blue', trend }) {
  return (
    <Card withBorder radius="md" p="lg" style={{ position: 'relative', overflow: 'hidden' }}>
      <Box
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          borderRadius: '0 0 0 100%',
          background: `var(--mantine-color-${color}-0)`,
        }}
      />
      <Group justify="space-between" mb="xs">
        <ThemeIcon variant="light" color={color} size="lg" radius="md">
          {icon}
        </ThemeIcon>
        {trend !== undefined && (
          <Badge
            leftSection={trend >= 0 ? <IconTrendingUp size={12} /> : <IconTrendingDown size={12} />}
            color={trend >= 0 ? 'teal' : 'red'}
            variant="light"
            size="sm"
          >
            {Math.abs(trend)}%
          </Badge>
        )}
      </Group>
      <Text size="xl" fw={700} mt="sm">
        {value}
      </Text>
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      {sub && (
        <Text size="xs" c="dimmed" mt={4}>
          {sub}
        </Text>
      )}
    </Card>
  )
}

function MembersCard({ members }) {
  const total = members.confirmed.length + members.pending.length
  const pct = Math.round((members.confirmed.length / total) * 100)

  return (
    <Card withBorder radius="md" p="lg" h="100%">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <ThemeIcon variant="light" color="violet" size="md" radius="md">
            <IconUsers size={16} />
          </ThemeIcon>
          <Text fw={600}>Integrantes</Text>
        </Group>
        <Badge variant="dot" color="violet">
          {total} total
        </Badge>
      </Group>

      <Progress value={pct} color="violet" size="sm" radius="xl" mb="xs" />
      <Group justify="space-between" mb="lg">
        <Text size="xs" c="dimmed">
          {members.confirmed.length} confirmados
        </Text>
        <Text size="xs" c="dimmed">
          {members.pending.length} pendentes
        </Text>
      </Group>

      <Stack gap="xs">
        {members.confirmed.map((m) => (
          <Group key={m.name} gap="sm">
            <Avatar size="sm" radius="xl" color="violet">
              {m.name[0]}
            </Avatar>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500} lh={1.2}>
                {m.name}
              </Text>
              <Text size="xs" c="dimmed">
                {m.role}
              </Text>
            </Box>
            <ThemeIcon size="xs" color="teal" variant="light" radius="xl">
              <IconCheck size={10} />
            </ThemeIcon>
          </Group>
        ))}
        {members.pending.map((m) => (
          <Group key={m.name} gap="sm">
            <Avatar size="sm" radius="xl" color="orange">
              {m.name[0]}
            </Avatar>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500} lh={1.2} c="dimmed">
                {m.name}
              </Text>
              <Text size="xs" c="dimmed">
                {m.role}
              </Text>
            </Box>
            <ThemeIcon size="xs" color="orange" variant="light" radius="xl">
              <IconClock size={10} />
            </ThemeIcon>
          </Group>
        ))}
      </Stack>
    </Card>
  )
}

function ShowsCard({ shows }) {
  return (
    <Card withBorder radius="md" p="lg" h="100%">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <ThemeIcon variant="light" color="pink" size="md" radius="md">
            <IconMicrophone2 size={16} />
          </ThemeIcon>
          <Text fw={600}>Shows</Text>
        </Group>
        <Group gap="xs">
          <Badge variant="light" color="pink" size="sm">
            {shows.upcoming.length} próximos
          </Badge>
          <Badge variant="light" color="gray" size="sm">
            {shows.past.length} passados
          </Badge>
        </Group>
      </Group>

      <Stack gap="xs">
        {shows.upcoming.map((s) => (
          <Paper key={s.name} withBorder p="xs" radius="sm" style={{ borderLeft: '3px solid var(--mantine-color-pink-5)' }}>
            <Group justify="space-between" wrap="nowrap">
              <Box>
                <Text size="sm" fw={600} lh={1.3}>
                  {s.name}
                </Text>
                <Group gap={4} mt={2}>
                  <IconMapPin size={11} color="var(--mantine-color-dimmed)" />
                  <Text size="xs" c="dimmed">
                    {s.venue} · {s.city}
                  </Text>
                </Group>
              </Box>
              <Stack gap={4} align="flex-end">
                <Text size="xs" fw={600} c="pink">
                  {s.date}
                </Text>
                <Badge
                  size="xs"
                  color={s.status === 'confirmed' ? 'teal' : 'orange'}
                  variant="light"
                >
                  {s.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </Badge>
              </Stack>
            </Group>
          </Paper>
        ))}

        {shows.past.length > 0 && (
          <>
            <Divider label="Realizados" labelPosition="left" my={4} />
            {shows.past.map((s) => (
              <Paper key={s.name} withBorder p="xs" radius="sm" bg="gray.0">
                <Group justify="space-between" wrap="nowrap">
                  <Box>
                    <Text size="sm" fw={500} c="dimmed" lh={1.3}>
                      {s.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {s.venue} · {s.city}
                    </Text>
                  </Box>
                  <Text size="xs" c="dimmed">
                    {s.date}
                  </Text>
                </Group>
              </Paper>
            ))}
          </>
        )}
      </Stack>
    </Card>
  )
}

function RehearsalsCard({ rehearsals }) {
  return (
    <Card withBorder radius="md" p="lg" h="100%">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <ThemeIcon variant="light" color="teal" size="md" radius="md">
            <IconCalendarEvent size={16} />
          </ThemeIcon>
          <Text fw={600}>Próximos Ensaios</Text>
        </Group>
        <Badge variant="light" color="teal" size="sm">
          {rehearsals.length} agendados
        </Badge>
      </Group>

      {rehearsals.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="lg">
          Nenhum ensaio agendado
        </Text>
      ) : (
        <Stack gap="sm">
          {rehearsals.map((r) => (
            <Paper key={r.date + r.time} withBorder p="sm" radius="sm">
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  <Box
                    style={{
                      background: 'var(--mantine-color-teal-1)',
                      borderRadius: 6,
                      padding: '4px 8px',
                      textAlign: 'center',
                      minWidth: 48,
                    }}
                  >
                    <Text size="xs" fw={700} c="teal" lh={1.2}>
                      {r.date.split(' ')[0]}
                    </Text>
                    <Text size="xs" c="teal" lh={1.2}>
                      {r.date.split(' ')[1]}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="sm" fw={600}>
                      {r.type}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {r.time} · {r.location}
                    </Text>
                  </Box>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Card>
  )
}

function SetlistsCard({ setlists }) {
  return (
    <Card withBorder radius="md" p="lg" h="100%">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <ThemeIcon variant="light" color="indigo" size="md" radius="md">
            <IconPlaylist size={16} />
          </ThemeIcon>
          <Text fw={600}>Repertórios</Text>
        </Group>
        <Badge variant="light" color="indigo" size="sm">
          {setlists.length} criados
        </Badge>
      </Group>

      <Stack gap="sm">
        {setlists.map((s) => (
          <Paper key={s.name} withBorder p="sm" radius="sm">
            <Group justify="space-between" wrap="nowrap">
              <Box>
                <Group gap="xs">
                  <Text size="sm" fw={600}>
                    {s.name}
                  </Text>
                  <Badge
                    size="xs"
                    color={s.status === 'final' ? 'teal' : 'orange'}
                    variant="dot"
                  >
                    {s.status === 'final' ? 'Finalizado' : 'Rascunho'}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed" mt={2}>
                  {s.show ? `Vinculado: ${s.show}` : 'Sem show vinculado'}
                </Text>
              </Box>
              <Group gap={4}>
                <IconMusic size={14} color="var(--mantine-color-indigo-5)" />
                <Text size="sm" fw={700} c="indigo">
                  {s.songs}
                </Text>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Card>
  )
}

function FinanceCard({ finance }) {
  const balancePct = finance.income > 0 ? Math.round((finance.balance / finance.income) * 100) : 0

  return (
    <Card withBorder radius="md" p="lg" h="100%">
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <ThemeIcon variant="light" color="green" size="md" radius="md">
            <IconCurrencyDollar size={16} />
          </ThemeIcon>
          <Text fw={600}>Financeiro</Text>
        </Group>
      </Group>

      <SimpleGrid cols={3} mb="md">
        <Box>
          <Text size="xs" c="dimmed">
            Saldo
          </Text>
          <Text size="lg" fw={700} c={finance.balance >= 0 ? 'teal' : 'red'}>
            R$ {finance.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">
            Entradas
          </Text>
          <Text size="md" fw={600} c="teal">
            R$ {finance.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </Box>
        <Box>
          <Text size="xs" c="dimmed">
            Saídas
          </Text>
          <Text size="md" fw={600} c="red">
            R$ {finance.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </Box>
      </SimpleGrid>

      {finance.income > 0 && (
        <>
          <Progress.Root size="sm" mb="xs">
            <Progress.Section value={100 - balancePct} color="red.4" />
            <Progress.Section value={balancePct} color="teal.5" />
          </Progress.Root>
          <Group justify="space-between" mb="md">
            <Text size="xs" c="dimmed">
              Despesas {100 - balancePct}%
            </Text>
            <Text size="xs" c="dimmed">
              Saldo {balancePct}%
            </Text>
          </Group>
        </>
      )}

      {finance.pending_income > 0 && (
        <Paper withBorder p="xs" radius="sm" bg="yellow.0" mb="md" style={{ borderColor: 'var(--mantine-color-yellow-3)' }}>
          <Group gap="xs">
            <IconAlertCircle size={14} color="var(--mantine-color-yellow-6)" />
            <Text size="xs" c="yellow.7">
              R$ {finance.pending_income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber
            </Text>
          </Group>
        </Paper>
      )}

      <Divider label="Últimas movimentações" labelPosition="left" mb="sm" />

      <ScrollArea h={140}>
        <Stack gap={6}>
          {finance.recent.map((t) => (
            <Group key={t.description} justify="space-between" wrap="nowrap">
              <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                <ThemeIcon
                  size="xs"
                  radius="xl"
                  color={t.type === 'income' ? 'teal' : 'red'}
                  variant="light"
                >
                  {t.type === 'income' ? <IconTrendingUp size={10} /> : <IconTrendingDown size={10} />}
                </ThemeIcon>
                <Text size="xs" truncate>
                  {t.description}
                </Text>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <Text size="xs" c="dimmed">
                  {t.date}
                </Text>
                <Text size="xs" fw={600} c={t.type === 'income' ? 'teal' : 'red'}>
                  {t.value > 0 ? '+' : ''}
                  R$ {Math.abs(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </Group>
            </Group>
          ))}
        </Stack>
      </ScrollArea>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Backstage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const projectSlug = searchParams.get('project') ?? ''
  const [selectedProject, setSelectedProject] = useState(null)

  const { data: myProjects = [], isLoading: loadingMyProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const slugsMap = useMemo(() => {
    const map = {}
    myProjects.forEach((m) => {
      map[String(m.projects.id)] = m.projects.slug
    })
    return map
  }, [myProjects])

  const selectData = useMemo(
    () =>
      myProjects.map((m) => ({
        value: String(m.projects.id),
        label: m.projects.name,
      })),
    [myProjects]
  )

  const projectsMap = useMemo(() => {
    const map = {}
    myProjects.forEach((m) => {
      map[String(m.projects.id)] = {
        role: m.roles?.name_ptbr ?? null,
      }
    })
    return map
  }, [myProjects])

  const { data: project, isLoading } = useQuery({
    queryKey: ['project-backstage-info', projectSlug],
    queryFn: () => fetchProjectBackstageInfo(projectSlug),
    enabled: !!projectSlug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const dashboard = selectedProject ? MOCK_DASHBOARD[selectedProject] : null

  return (
    <Stack gap="xl" p="md">
      {/* Header */}
      <Box>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Box>
            <Title order={2} fw={700}>
              Backstage
            </Title>
            <Text size="sm" c="dimmed" mt={2}>
              Visão geral do seu projeto musical
            </Text>
          </Box>

          <Select
            placeholder="Selecione um projeto..."
            data={selectData}
            value={selectedProject}
            onChange={(value) => {
              setSelectedProject(value)
              if (value) {
                const slug = slugsMap[value]
                setSearchParams({ project: slug })
              } else {
                setSearchParams({})
              }
            }}
            disabled={loadingMyProjects}
            w={{ base: '100%', sm: 300 }}
            size="md"
            radius="md"
            leftSection={<IconMusic size={16} />}
            styles={{ input: { fontWeight: 600 } }}
          />
        </Group>
      </Box>

      {/* Empty state */}
      {!dashboard && (
        <Paper withBorder radius="lg" p="xl" ta="center">
          <ThemeIcon size={64} radius="xl" variant="light" color="blue" mx="auto" mb="md">
            <IconMusic size={32} />
          </ThemeIcon>
          <Title order={4} fw={600} mb="xs">
            Selecione um projeto
          </Title>
          <Text size="sm" c="dimmed" maw={400} mx="auto">
            Escolha um dos seus projetos ativos no seletor acima para visualizar o dashboard completo do Backstage.
          </Text>
        </Paper>
      )}

      {/* Dashboard */}
      {dashboard && (
        <Stack gap="lg">
          {/* Project Header */}
          <Paper withBorder radius="md" p="md">
            <Group gap="md" wrap="nowrap">
              <Avatar 
                size={56} 
                radius="md" 
                color="blue"
                src={project?.picture ? PICTURE_AVATAR_PATH+project?.picture : undefined}
              >
                {dashboard.project.name[0]}
              </Avatar>
              <Box style={{ flex: 1 }}>
                <Group gap="sm" wrap="wrap">
                  <Title order={3} fw={700}>
                    {project?.name}
                  </Title>
                  <Badge variant="light" color="blue" leftSection={<IconStar size={11} />}>
                    {projectsMap[selectedProject]?.role}
                  </Badge>
                </Group>
                <Group gap="xs" mt={4}>
                  <Text size="sm" c="dimmed">
                    {project?.genres?.name_ptbr}
                  </Text>
                  <Text size="sm" c="dimmed">·</Text>
                  <Group gap={4}>
                    <IconMapPin size={13} color="var(--mantine-color-dimmed)" />
                    <Text size="sm" c="dimmed">
                      {dashboard.project.city}
                    </Text>
                  </Group>
                </Group>
              </Box>
            </Group>
          </Paper>

          {/* Stats row */}
          <SimpleGrid cols={{ base: 2, sm: 2, md: 4 }} spacing="md">
            <StatCard
              icon={<IconUsers size={18} />}
              label="Integrantes"
              value={dashboard.members.confirmed.length + dashboard.members.pending.length}
              sub={`${dashboard.members.pending.length} pendentes`}
              color="violet"
            />
            <StatCard
              icon={<IconMicrophone2 size={18} />}
              label="Shows confirmados"
              value={dashboard.shows.upcoming.filter((s) => s.status === 'confirmed').length}
              sub={`${dashboard.shows.past.length} realizados`}
              color="pink"
            />
            <StatCard
              icon={<IconCalendarEvent size={18} />}
              label="Ensaios agendados"
              value={dashboard.rehearsals.length}
              color="teal"
            />
            <StatCard
              icon={<IconCurrencyDollar size={18} />}
              label="Saldo atual"
              value={`R$ ${dashboard.finance.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              sub={dashboard.finance.pending_income > 0 ? `R$ ${dashboard.finance.pending_income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber` : undefined}
              color="green"
              trend={dashboard.finance.income > 0 ? Math.round((dashboard.finance.balance / dashboard.finance.income) * 100) : undefined}
            />
          </SimpleGrid>

          {/* Main grid */}
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <MembersCard members={dashboard.members} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <ShowsCard shows={dashboard.shows} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <RehearsalsCard rehearsals={dashboard.rehearsals} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <SetlistsCard setlists={dashboard.setlists} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <FinanceCard finance={dashboard.finance} />
            </Grid.Col>
          </Grid>
        </Stack>
      )}
    </Stack>
  )
}
