import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { fetchUserGigs } from '../queries/gigs'
// prettier-ignore
import {
  Grid, Group, Menu,
  Container, Stack,
  Select, Badge,
  Text, Title,
  Paper, Affix,
  Avatar, ActionIcon,
  TextInput,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'
import { IconDotsVertical, IconMusic, IconSearch } from '@tabler/icons-react'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const CDN_PREFIX = 'https://ik.imagekit.io/mublin'
const AVATAR_PATH = `${CDN_PREFIX}/tr:h-68,c-maintain_ratio/users/avatars/`
const PROJECT_AVATAR_PATH = `${CDN_PREFIX}/projects`

const QUICK_ACTIONS = [
  {
    value: 'schedule-rehearsal',
    label: 'Marcar um ensaio',
    emoji: '📅',
    route: '/rehearsals/new',
  },
  {
    value: 'new-project',
    label: 'Criar um novo projeto',
    emoji: '🎛️',
    route: '/projects/new',
  },
  {
    value: 'find-gig',
    label: 'Buscar gigs pra eu tocar',
    emoji: '🎤',
    route: '/gigs/search',
  },
  {
    value: 'find-musicians',
    label: 'Encontrar músicos pra um projeto',
    emoji: '🎸',
    route: '/musicians/search',
  },
  {
    value: 'find-staff',
    label: 'Contratar um técnico de som ou roadie',
    emoji: '🎚️',
    route: '/staff/search',
  },
  {
    value: 'update-repertoire',
    label: 'Atualizar meu repertório',
    emoji: '🎵',
    route: '/repertoire',
  },
  {
    value: 'send-message',
    label: 'Mandar mensagem pra alguém',
    emoji: '💬',
    route: '/messages/new',
  },
  {
    value: 'find-band',
    label: 'Entrar em uma banda',
    emoji: '🥁',
    route: '/bands/search',
  },
  {
    value: 'update-profile',
    label: 'Atualizar meu perfil e experiência',
    emoji: '✨',
    route: '/profile/edit',
  },
  {
    value: 'new-setlist',
    label: 'Montar um setlist',
    emoji: '📝',
    route: '/setlists/new',
  },
  {
    value: 'find-studio',
    label: 'Alugar um estúdio de gravação',
    emoji: '🎙️',
    route: '/studios/search',
  },
  {
    value: 'find-venue',
    label: 'Procurar um local pra tocar',
    emoji: '📍',
    route: '/venues/search',
  },
]

const renderOption = ({ option }) => (
  <Group gap="xs" wrap="nowrap">
    <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
      {QUICK_ACTIONS.find((a) => a.value === option.value)?.emoji}
    </span>
    <span>{option.label}</span>
  </Group>
)

export default function Home() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 48em)')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isDesktop && profile?.feed_as_home) {
      const redirected = sessionStorage.getItem('feed_redirected')
      if (!redirected) {
        sessionStorage.setItem('feed_redirected', 'true')
        navigate('/feed', { replace: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  if (loading) {
    return null
  }

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const userProjects = projects.map((p) => ({
    id: p.projects.id,
    name: p.projects.name,
    slug: p.projects.slug,
    description: p.projects.description,
    end_year: p.projects.end_year,
    is_founder: p.is_founder,
    is_ex_member: p.is_ex_member,
    picture: p.projects.picture,
    request_status: p.status,
    activity_status: p.projects.activity_status,
    activity_status_name: p.projects.project_statuses?.description_ptbr,
    activity_status_color: p.projects.project_statuses?.color,
    main_role: p.roles.name_ptbr,
    genre: p.projects.genres?.name,
    genreCategoryColor: p.projects.genres?.primary_category?.color,
    type: p.projects.project_types?.name_ptbr,
    joined_at: p.joined_at ? new Date(p.joined_at).getFullYear() : null,
    left_at: p.left_at ? new Date(p.left_at).getFullYear() : null,
    role_2_id: p.role_2_id,
    role_3_id: p.role_3_id,
    totalMembers: p.projects.project_members?.length || 0,
  }))

  // Filtros aplicados
  const filteredProjects = useMemo(() => {
    return userProjects.filter((project) => {
      if (search && !project.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      return true
    })
  }, [userProjects])

  const handleAction = (value) => {
    if (!value) {
      return
    }
    const action = QUICK_ACTIONS.find((a) => a.value === value)
    if (action?.route) {
      navigate(action.route)
    }
  }

  // Saudação dinâmica
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <>
      {!isDesktop && (
        <Affix position={{ top: 0, left: 0 }}>
          <AppNavbarMobile />
        </Affix>
      )}

      <Container size="xl" pt="xs" px={{ base: 0, sm: 0 }} mt={{ base: 51, sm: 0 }}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }} className="paddingX prX">
            {/* <Stack align="center" gap="xs" maw={520} mx="auto" w="100%">
              <Text ta="center" size="sm" fw={200}>
                {greeting}, {profile.username}!
              </Text>

              <Title ta="center" size="h2" fw={300} lh={1}>
                O que quer fazer hoje?
              </Title>

              <Select
                w="100%"
                my="sm"
                size="md"
                radius="xl"
                placeholder="Selecione ou busque uma ação..."
                searchable
                clearable
                nothingFoundMessage="Nenhuma ação encontrada"
                data={QUICK_ACTIONS.map(({ value, label }) => ({ value, label }))}
                renderOption={renderOption}
                onChange={handleAction}
                comboboxProps={{
                  shadow: 'md',
                  transitionProps: { transition: 'pop', duration: 150 },
                }}
                styles={{
                  input: {
                    fontWeight: 500,
                  },
                }}
              />
            </Stack> */}
            <TextInput
              placeholder="Buscar por nome do projeto..."
              leftSection={<IconSearch size={14} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="sm"
              mb="md"
            />
            <Title order={4}>Integrante</Title>
            <Text size="xs" c="dimmed">
              Projetos que sou integrante
            </Text>
            <ResponsiveMasonry
              columnsCountBreakPoints={{ 350: 2, 750: 2, 900: 2 }}
              gutterBreakpoints={{ 350: '8px', 750: '8px', 900: '8px' }}
              style={{ marginTop: '6px' }}
            >
              <Masonry>
                {filteredProjects.map((project) => (
                  <Paper key={project.id} p="sm" pos="relative" w="100%">
                    <Menu shadow="md" width={200} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon
                          color="gray"
                          variant="subtle"
                          size="sm"
                          pos="absolute"
                          top={10}
                          right={10}
                        >
                          <IconDotsVertical color="gray" size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconMusic size={14} />}>
                          Ir para o projeto
                        </Menu.Item>
                        <Menu.Item leftSection={<IconMusic size={14} />}>
                          Gerenciar participação
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                    <Group align="flex-start" mb="xs">
                      <Avatar
                        size={50}
                        radius="md"
                        src={
                          project?.picture
                            ? `${PROJECT_AVATAR_PATH}/${project?.id}/tr:h-100,w-100,c-maintain_ratio/${project?.picture}`
                            : undefined
                        }
                        alt={project.name}
                      />
                      <Stack gap={4}>
                        <Title order={5} fw={500}>
                          {project.name}
                        </Title>
                        <Group gap={6} wrap="nowrap">
                          <Badge size="xs" variant="outline" color="dark">
                            {project.type}
                          </Badge>
                          {project.genre && (
                            <Badge
                              size="xs"
                              variant="light"
                              color={project.genreCategoryColor}
                            >
                              {project.genre}
                            </Badge>
                          )}
                        </Group>
                      </Stack>
                    </Group>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {project.description}
                    </Text>
                  </Paper>
                ))}
              </Masonry>
            </ResponsiveMasonry>
          </Grid.Col>
          {isDesktop && (
            <Grid.Col span={{ base: 12, md: 4 }} px={0}>
              {/* <Feed from="home" /> */}
              <Paper p="md" className="alphaBg" mb="lg" radius="lg">
                <Title>Projeto</Title>
              </Paper>
            </Grid.Col>
          )}
        </Grid>
      </Container>
    </>
  )
}
