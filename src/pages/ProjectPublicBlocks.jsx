import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  ScrollArea,
  SegmentedControl,
  Skeleton,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import {
  IconArrowRight,
  IconCalendarEvent,
  IconMapPin,
  IconSpeakerphone,
  IconUsers,
} from '@tabler/icons-react'

/* ─────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────── */

// Avatares abstratos (formas geométricas, sem rostos) só para dar noção visual.
// Em produção, a ideia é manter genérico: ninguém é exposto sem consentimento.
const dicebear = (seed) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}`

// Todo CTA leva a origem na URL, para você medir qual bloco converte.
const signupUrl = (slug, block) => `/signup?from=project&block=${block}&project=${slug}`

const parseDate = (iso) => new Date(`${iso}T12:00:00`)

// Projeto encerrado = tem end_year. Nesse caso a página deixa de falar
// em vagas e gigs e passa a falar em memória e portfólio.
const isEnded = (project) => Boolean(project?.end_year)

// Selo discreto para o cabeçalho. Ocupa o lugar dos badges de turnê,
// já que os dois estados não coexistem.
export function ProjectEndedBadge({ project }) {
  if (!isEnded(project)) return null
  return (
    <Badge variant="default" tt="none" fw={500} mb={4} w="fit-content">
      Encerrada em {project.end_year}
    </Badge>
  )
}

/* ─────────────────────────────────────────────────────────────
 * 1) Vagas abertas — o bloco mais forte para quem quer trabalhar
 *    openings: [{ id, role_name, context, city }]
 * ───────────────────────────────────────────────────────────── */

export function ProjectOpeningsBlock({ project, openings = [] }) {
  const navigate = useNavigate()
  if (isEnded(project) || !openings.length) return null

  const visible = openings.slice(0, 3)
  const hidden = openings.length - visible.length

  return (
    <Card
      mt="lg"
      p="md"
      radius="md"
      withBorder
      style={{ borderLeft: '3px solid var(--mantine-primary-color-filled)' }}
    >
      <Group gap={8} mb={4} wrap="nowrap">
        <IconSpeakerphone size={18} color="var(--mantine-primary-color-filled)" />
        <Title order={3} fz={17} fw={600}>
          {project.name} está procurando
        </Title>
      </Group>
      <Text size="xs" c="dimmed" mb="sm">
        {openings.length === 1
          ? '1 vaga aberta agora'
          : `${openings.length} vagas abertas agora`}
      </Text>

      <Stack gap={0}>
        {visible.map((opening, index) => (
          <div key={opening.id}>
            {index > 0 && <Divider my="xs" />}
            <Group justify="space-between" wrap="nowrap" gap="sm">
              <Stack gap={0} style={{ minWidth: 0 }}>
                <Text fw={600} size="sm" lineClamp={1}>
                  {opening.role_name}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {[opening.context, opening.city].filter(Boolean).join(' · ')}
                </Text>
              </Stack>
              <Button
                size="compact-sm"
                radius="xl"
                variant="light"
                style={{ flexShrink: 0 }}
                onClick={() => navigate(signupUrl(project.slug, 'openings'))}
              >
                Candidatar-se
              </Button>
            </Group>
          </div>
        ))}
      </Stack>

      {hidden > 0 && (
        <Text size="xs" c="dimmed" mt="sm">
          + {hidden} {hidden === 1 ? 'outra vaga' : 'outras vagas'} para quem tem conta
        </Text>
      )}
    </Card>
  )
}

/* ─────────────────────────────────────────────────────────────
 * 2) Pessoas associadas ao projeto
 *    people: retorno de fetchPublicProjectPeople (tabela portfolio)
 *    [{ id, is_currently_working,
 *       profile: { id, full_name, username, avatar },
 *       roles: [{ role: { id, name_ptbr } }] }]
 * ───────────────────────────────────────────────────────────── */

const PERSON_AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-96,w-96,c-maintain_ratio/users/avatars/'

// Aceita URL completa (usado nos mocks com DiceBear) ou o nome do arquivo no ImageKit.
const getPersonAvatarUrl = (avatar) => {
  if (!avatar) return null
  return avatar.startsWith('http') ? avatar : `${PERSON_AVATAR_PATH}${avatar}`
}

// A mesma pessoa pode ter mais de um registro no portfolio do projeto
// (períodos ou funções diferentes). Aqui agrupamos por perfil e juntamos as funções.
export function groupPeople(people = []) {
  const byProfile = new Map()

  for (const item of people ?? []) {
    const profile = item?.profile
    if (!profile?.id) continue // perfil oculto ou removido

    const entry = byProfile.get(profile.id) ?? { profile, roles: [], isCurrent: false }
    entry.isCurrent = entry.isCurrent || Boolean(item.is_currently_working)

    for (const r of item.roles ?? []) {
      const name = r?.role?.name_ptbr
      if (name && !entry.roles.includes(name)) entry.roles.push(name)
    }
    byProfile.set(profile.id, entry)
  }

  return [...byProfile.values()]
}

export function ProjectPeopleTeaserBlock({ project, people = [], isLoading = false }) {
  const navigate = useNavigate()
  const ended = isEnded(project)

  if (isLoading) {
    return (
      <Stack gap="xs" mt="lg" px="xs">
        <Skeleton height={12} width={140} />
        <Group gap="sm" wrap="nowrap">
          <Skeleton circle height={40} width={40} />
          <Skeleton height={14} width={180} />
        </Group>
      </Stack>
    )
  }

  const members = groupPeople(people)
  if (!members.length) return null

  const total = members.length
  const isSmall = total <= 3

  // Funções mais comuns (só usado quando há muita gente)
  const roleCounts = new Map()
  members.forEach((m) =>
    m.roles.forEach((role) => roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1)),
  )
  const topRoles = [...roleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

  const shown = members.slice(0, 5)
  const extra = total - shown.length

  return (
    <Stack gap="xs" mt="lg" px="xs">
      <Text size="xs" fw={500} c="dimmed">
        {ended ? `Quem fez parte de ${project.name}` : `Quem toca com ${project.name}`}
      </Text>

      {isSmall ? (
        // Poucas pessoas: mostrar nome e função passa mais credibilidade que "+N"
        <Stack gap="xs">
          {members.map(({ profile, roles }) => (
            <Group key={profile.id} gap="sm" wrap="nowrap">
              <Avatar
                src={getPersonAvatarUrl(profile.avatar)}
                size={38}
                alt={`Foto de ${profile.full_name}`}
              />
              <Stack gap={0} style={{ minWidth: 0 }}>
                <Text size="sm" fw={500} lineClamp={1}>
                  {profile.full_name}
                </Text>
                {roles.length > 0 && (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {roles.join(', ')}
                  </Text>
                )}
              </Stack>
            </Group>
          ))}
        </Stack>
      ) : (
        <>
          <Group gap="sm" wrap="nowrap">
            <Avatar.Group spacing="sm">
              {shown.map(({ profile }) => (
                <Tooltip key={profile.id} label={profile.full_name} withArrow>
                  <Avatar
                    src={getPersonAvatarUrl(profile.avatar)}
                    size={40}
                    alt={`Foto de ${profile.full_name}`}
                  />
                </Tooltip>
              ))}
              {extra > 0 && (
                <Avatar size={40} variant="light">
                  +{extra}
                </Avatar>
              )}
            </Avatar.Group>
            <Text size="sm" lh={1.3}>
              {total} músicos e staff {ended ? 'fizeram parte' : 'já passaram por aqui'}
            </Text>
          </Group>

          {topRoles.length > 0 && (
            <Group gap={6}>
              {topRoles.map(([role, count]) => (
                <Badge key={role} variant="default" fw={500} tt="none">
                  {role}
                  {count > 1 && (
                    <Text span c="dimmed" inherit>
                      {' '}
                      × {count}
                    </Text>
                  )}
                </Badge>
              ))}
            </Group>
          )}
        </>
      )}

      <Group mt={4}>
        <Button
          variant="subtle"
          color="var(--mantine-color-text)"
          size="compact-sm"
          radius="xl"
          leftSection={<IconUsers size={15} />}
          rightSection={<IconArrowRight size={14} />}
          onClick={() => navigate(signupUrl(project.slug, 'people'))}
        >
          {ended ? 'Veja quem fez parte' : 'Veja roadies, produtores e músicos'}
        </Button>
      </Group>
    </Stack>
  )
}

/* ─────────────────────────────────────────────────────────────
 * 3) Próximos eventos
 *    events: [{ id, title, date (YYYY-MM-DD), city, open_roles }]
 * ───────────────────────────────────────────────────────────── */

export function ProjectUpcomingEventsBlock({ project, events = [] }) {
  const navigate = useNavigate()
  if (isEnded(project) || !events.length) return null

  return (
    <Stack gap="sm" mt="lg" px="xs">
      <Group gap={6}>
        <IconCalendarEvent size={14} color="gray" />
        <Text size="xs" fw={500} c="dimmed">
          Próximos eventos
        </Text>
      </Group>

      <Stack gap="xs">
        {events.slice(0, 3).map((event) => {
          const date = parseDate(event.date)
          return (
            <Paper key={event.id} withBorder radius="md" p="xs">
              <Group wrap="nowrap" gap="sm">
                <Stack gap={0} align="center" w={44} style={{ flexShrink: 0 }}>
                  <Text fw={700} fz={20} lh={1}>
                    {date.getDate()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {date
                      .toLocaleDateString('pt-BR', { month: 'short' })
                      .replace('.', '')}
                  </Text>
                </Stack>

                <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={600} lineClamp={1}>
                    {event.title}
                  </Text>
                  {event.city && (
                    <Group gap={2} wrap="nowrap">
                      <IconMapPin size={12} color="gray" />
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {event.city}
                      </Text>
                    </Group>
                  )}
                </Stack>

                {event.open_roles > 0 && (
                  <Badge
                    variant="light"
                    color="green"
                    tt="none"
                    style={{ flexShrink: 0 }}
                  >
                    {event.open_roles} {event.open_roles === 1 ? 'vaga' : 'vagas'}
                  </Badge>
                )}
              </Group>
            </Paper>
          )
        })}
      </Stack>

      {events.some((e) => e.open_roles > 0) && (
        <Group>
          <Button
            variant="subtle"
            size="compact-sm"
            radius="xl"
            rightSection={<IconArrowRight size={14} />}
            onClick={() => navigate(signupUrl(project.slug, 'events'))}
          >
            Confira vagas para gigs com {project.name}
          </Button>
        </Group>
      )}
    </Stack>
  )
}

/* ─────────────────────────────────────────────────────────────
 * 4) CTA final — o texto muda conforme o que a página tem de real
 * ───────────────────────────────────────────────────────────── */

function getCtaCopy({ project, openings, events, people }) {
  if (isEnded(project)) {
    return {
      block: 'cta-ended',
      title: (
        <>
          Já tocou ou trabalhou com <b>{project.name}</b>?
        </>
      ),
      subtitle: 'Adicione essa passagem ao seu portfólio no Mublin',
      primary: 'Criar meu portfólio',
    }
  }

  const hasOpenings = openings?.length > 0
  const hasEventRoles = events?.some((e) => e.open_roles > 0)

  if (hasOpenings) {
    return {
      block: 'cta-openings',
      title: (
        <>
          Toque com <b>{project.name}</b>
        </>
      ),
      subtitle: `Crie seu perfil e candidate-se à vaga de ${openings[0].role_name}`,
      primary: 'Criar conta grátis',
    }
  }
  if (hasEventRoles) {
    return {
      block: 'cta-events',
      title: (
        <>
          Tem gig com vaga aberta para <b>{project.name}</b>
        </>
      ),
      subtitle: 'Entre para ver as funções e se candidatar',
      primary: 'Ver vagas',
    }
  }
  if (people?.length > 0) {
    return {
      block: 'cta-people',
      title: (
        <>
          Veja quem toca com <b>{project.name}</b>
        </>
      ),
      subtitle: 'Pessoas, gigs e muito mais no Mublin',
      primary: 'Criar conta grátis',
    }
  }
  return {
    block: 'cta-default',
    title: (
      <>
        Entre pra ver mais sobre <b>{project.name}</b> no Mublin
      </>
    ),
    subtitle: 'Pessoas relacionadas, gigs e muito mais',
    primary: 'Criar conta grátis',
  }
}

export function ProjectContextualCta({ project, openings, events, people, mt = 28 }) {
  const navigate = useNavigate()
  const copy = getCtaCopy({ project, openings, events, people })

  return (
    <Card mt={mt} px="lg" py="md">
      <SimpleGrid spacing="md" cols={{ base: 1, sm: 2 }}>
        <Stack gap={2}>
          <Text size="lg">{copy.title}</Text>
          <Text size="sm" c="dimmed">
            {copy.subtitle}
          </Text>
        </Stack>
        <Group gap="sm" mb="xs" justify={{ sm: 'flex-end' }}>
          <Button
            variant="outline"
            color="var(--mantine-color-text)"
            size="sm"
            radius="xl"
            onClick={() => navigate('/login')}
          >
            Entrar
          </Button>
          <Button
            size="sm"
            radius="xl"
            rightSection={<IconArrowRight size={14} />}
            onClick={() => navigate(signupUrl(project.slug, copy.block))}
          >
            {copy.primary}
          </Button>
        </Group>
      </SimpleGrid>
    </Card>
  )
}

/* ─────────────────────────────────────────────────────────────
 * PREVIEW — mock de dados + alternância de cenários
 * Aponte uma rota temporária (ex.: /preview/project-public) para
 * este componente e apague quando as queries reais estiverem prontas.
 * ───────────────────────────────────────────────────────────── */

const MOCK_PROJECT = {
  id: 1,
  slug: 'banda-exemplo',
  name: 'Banda Exemplo',
  type: 'Banda',
  genres: 'Rock, Indie',
  location: 'São Paulo, SP',
}

const MOCK_OPENINGS = [
  { id: 1, role_name: 'Baterista', context: 'Turnê 2027', city: 'São Paulo, SP' },
  {
    id: 2,
    role_name: 'Técnico de monitor',
    context: 'Gigs avulsas',
    city: 'Campinas, SP',
  },
  { id: 3, role_name: 'Roadie', context: 'Gigs avulsas', city: 'São Paulo, SP' },
  { id: 4, role_name: 'Guitarrista sub', context: 'Sub para gigs', city: 'Sorocaba, SP' },
]

// Retorno real de fetchPublicProjectPeople para um projeto com 1 pessoa vinculada
const MOCK_PEOPLE_ONE = [
  {
    id: 16,
    is_currently_working: false,
    profile: {
      id: 'f68e4f07-0084-4439-b8cf-dd9e19d04f39',
      avatar: 'f68e4f07-0084-4439-b8cf-dd9e19d04f39_avatar_VhTZN0yvz',
      username: 'fabio',
      full_name: 'Fabio Bueno',
    },
    roles: [{ role: { id: 5, name_ptbr: 'Baixo' } }],
  },
]

// Mock fictício no mesmo formato, para ver o layout com muita gente
const mockPerson = (n, full_name, roleId, role, current = true) => ({
  id: n,
  is_currently_working: current,
  profile: {
    id: `mock-${n}`,
    avatar: dicebear(`pessoa-${n}`),
    username: `pessoa${n}`,
    full_name,
  },
  roles: [{ role: { id: roleId, name_ptbr: role } }],
})

const MOCK_PEOPLE_MANY = [
  mockPerson(1, 'Ana Souza', 1, 'Guitarra'),
  mockPerson(2, 'Bruno Lima', 2, 'Bateria'),
  mockPerson(3, 'Carla Dias', 5, 'Baixo'),
  mockPerson(4, 'Diego Rocha', 1, 'Guitarra', false),
  mockPerson(5, 'Elisa Prado', 7, 'Técnico de som'),
  mockPerson(6, 'Fábio Nunes', 8, 'Roadie'),
  mockPerson(7, 'Gabi Alves', 2, 'Bateria', false),
  mockPerson(8, 'Hugo Matos', 9, 'Produtor'),
  mockPerson(9, 'Íris Castro', 8, 'Roadie'),
]

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Festival Nova Onda',
    date: '2026-11-21',
    city: 'Sorocaba, SP',
    open_roles: 2,
  },
  {
    id: 2,
    title: 'Show no Cine Joia',
    date: '2026-12-05',
    city: 'São Paulo, SP',
    open_roles: 0,
  },
  {
    id: 3,
    title: 'Abertura de turnê',
    date: '2027-01-16',
    city: 'Campinas, SP',
    open_roles: 1,
  },
]

// No cenário "Encerrada" os dados de vagas e eventos continuam preenchidos
// de propósito: assim dá para conferir que os blocos se escondem sozinhos.
const SCENARIOS = {
  full: { openings: MOCK_OPENINGS, people: MOCK_PEOPLE_MANY, events: MOCK_EVENTS },
  events: { openings: [], people: MOCK_PEOPLE_MANY, events: MOCK_EVENTS },
  people: { openings: [], people: MOCK_PEOPLE_MANY, events: [] },
  one: { openings: [], people: MOCK_PEOPLE_ONE, events: [] },
  empty: { openings: [], people: [], events: [] },
  ended: {
    projectOverride: { end_year: 2008, start_year: 1998 },
    openings: MOCK_OPENINGS,
    people: MOCK_PEOPLE_MANY,
    events: MOCK_EVENTS,
  },
}

export default function ProjectPublicBlocksPreview() {
  const [scenario, setScenario] = useState('full')
  const { openings, people, events, projectOverride } = SCENARIOS[scenario]
  const project = { ...MOCK_PROJECT, ...projectOverride }

  return (
    <Container px="lg" size="md" mt={{ base: 22, sm: 30 }} pb="xl">
      <Paper withBorder p="xs" mb="lg" style={{ borderStyle: 'dashed' }}>
        <Stack gap={6}>
          <Text size="xs" c="dimmed">
            Preview (dados fictícios) · cenário:
          </Text>
          <ScrollArea type="never">
            <SegmentedControl
              size="xs"
              value={scenario}
              onChange={setScenario}
              data={[
                { value: 'full', label: 'Tudo' },
                { value: 'events', label: 'Sem vagas' },
                { value: 'people', label: 'Só pessoas' },
                { value: 'one', label: '1 pessoa' },
                { value: 'empty', label: 'Vazio' },
                { value: 'ended', label: 'Encerrada' },
              ]}
            />
          </ScrollArea>
        </Stack>
      </Paper>

      {/* Cabeçalho simplificado só para dar contexto visual */}
      <Group wrap="nowrap" px="xs">
        <Avatar src={dicebear('banda-exemplo-capa')} size={90} />
        <Stack gap={0}>
          <ProjectEndedBadge project={project} />
          <Title order={1} fz={{ base: 24, sm: 32 }} fw={650} lts="-0.025em">
            {project.name}
          </Title>
          <Text size="sm" c="dimmed">
            {project.type} · {project.genres}
            {isEnded(project) && ` · ${project.start_year}–${project.end_year}`}
          </Text>
          <Group gap={2}>
            <IconMapPin color="gray" size={12} />
            <Text size="xs" c="dimmed">
              {project.location} 🇧🇷
            </Text>
          </Group>
        </Stack>
      </Group>

      <Text size="sm" mt="md" px="xs" lineClamp={3}>
        Quarteto de rock alternativo com mais de dez anos de estrada, três discos lançados
        e uma base de fãs que lota casas pequenas e médias pelo interior de São Paulo.
      </Text>

      {/* Ordem proposta */}
      <ProjectOpeningsBlock project={project} openings={openings} />
      <ProjectPeopleTeaserBlock project={project} people={people} />
      <ProjectUpcomingEventsBlock project={project} events={events} />

      {/* ... aqui entram os "Projetos relacionados" que você já tem ... */}

      <ProjectContextualCta
        project={project}
        openings={openings}
        events={events}
        people={people}
      />
    </Container>
  )
}
