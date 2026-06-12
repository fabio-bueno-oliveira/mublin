import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects, fetchUserRoles } from '../queries/user'
import { MEMBER_ENGAGEMENT_TYPE } from '../constants/projects'
// prettier-ignore
import {
  useMantineColorScheme,
  Skeleton, Tabs,
  Group, Flex, Card,
  Container, Stack, Box,
  Button, Badge, Pill, 
  Loader, Divider,
  Center, Indicator, Paper, 
  Text, Title, Anchor, TextInput,
  Avatar, ActionIcon, ThemeIcon,
  Select,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import AppNavbarMobile from '../components/AppNavbarMobile'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { IconMicrophone2, IconUserSearch } from '@tabler/icons-react'

const CDN_PREFIX = 'https://ik.imagekit.io/mublin'
const USER_AVATAR_PATH = `${CDN_PREFIX}/tr:h-68,c-maintain_ratio/users/avatars/`
const PROJECT_AVATAR_PATH = `${CDN_PREFIX}/projects`

export default function Home() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 48em)')
  const isDesktop = useMediaQuery('(min-width: 48em)')
  const [defaultRole, setDefaultRole] = useState('')
  const [search, setSearch] = useState('')
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

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

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: userRoles = [], isLoading: loadingUserRoles } = useQuery({
    queryKey: ['profile-roles', user?.id],
    queryFn: () => fetchUserRoles(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const userRolesOptions = userRoles.map((r) => ({
    value: String(r.id_role),
    label: r.roles?.description_ptbr ?? r.roles?.name_ptbr,
  }))

  useEffect(() => {
    if (userRoles.length > 0) {
      setDefaultRole(String(userRoles[0]?.id_role))
    }
  }, [userRoles])

  console.log(defaultRole)

  if (loading) {
    return null
  }

  const userProjects = projects.map((p) => ({
    id: p.projects.id,
    name: p.projects.name,
    slug: p.projects.slug,
    description: p.projects.description,
    end_year: p.projects.end_year,
    is_founder: p.is_founder,
    is_admin: p.is_admin,
    is_ex_member: p.is_ex_member,
    engagementType: p.engagement_type_id,
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

  // Saudação dinâmica
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <>
      {isMobile && <AppNavbarMobile fixed={false} />}

      <Container size="xl" pt="xs" px={{ base: 'sm', sm: 0 }} mt={{ base: 16, sm: 0 }}>
        {loading || loadingProjects ? (
          <>
            <Title size="h2" fw={600} lh={1.2} mt={4} mb={4}>
              Carregando...
            </Title>
            <Skeleton width={300} height={18} radius="md" />
          </>
        ) : (
          <>
            <Group justify="space-between" align="flex-start">
              <Title size="24px" fw={600} lh={1.2} mt={4}>
                {greeting}, {profile?.username}
              </Title>
              <Text size="sm" c="dimmed">
                {dayjs().format('dddd, D [de] MMMM [de] YYYY')}
              </Text>
            </Group>

            <Tabs variant="outline" defaultValue="search-gigs" my="lg">
              <Tabs.List>
                <Tabs.Tab value="search-gigs" leftSection={<IconMicrophone2 size={16} />}>
                  Quero trabalhar
                </Tabs.Tab>
                <Tabs.Tab
                  value="search-people"
                  leftSection={<IconUserSearch size={16} />}
                >
                  Encontrar pessoas
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="search-gigs" pt="md">
                <Flex
                  gap="sm"
                  justify="space-between"
                  align="flex-start"
                  direction={isMobile ? 'column' : 'row'}
                  mb="md"
                >
                  <Select
                    w={isMobile ? '100%' : '33%'}
                    label="Sou"
                    placeholder="Selecione"
                    withAsterisk
                    disabled={loadingUserRoles}
                    defaultValue={defaultRole}
                    data={userRolesOptions}
                  />
                  <Select
                    w={isMobile ? '100%' : '33%'}
                    label="Vínculo desejadp"
                    placeholder="Selecione"
                    withAsterisk
                    defaultValue="1"
                    data={[
                      { value: '1', label: 'Contratado' },
                      { value: '2', label: 'Integrante' },
                    ]}
                  />
                  <Select
                    w={isMobile ? '100%' : '33%'}
                    label="Conteúdo principal"
                    placeholder="Selecione"
                    withAsterisk
                    data={[
                      { value: '1', label: 'Autoral' },
                      { value: '2', label: 'Cover' },
                      { value: '3', label: 'Autoral + Cover' },
                    ]}
                  />
                </Flex>
              </Tabs.Panel>
              <Tabs.Panel value="search-people" pt="md">
                <Group justify="space-between" align="flex-start" mb="md">
                  <Select
                    label="Busco"
                    placeholder="Selecione"
                    withAsterisk
                    data={[
                      { value: '1', label: 'Autoral' },
                      { value: '2', label: 'Cover' },
                      { value: '3', label: 'Autoral + Cover' },
                    ]}
                  />
                  <Select
                    label="Conteúdo principal"
                    placeholder="Selecione"
                    withAsterisk
                    data={[
                      { value: '1', label: 'Autoral' },
                      { value: '2', label: 'Cover' },
                      { value: '3', label: 'Autoral + Cover' },
                    ]}
                  />
                  <Select
                    label="Conteúdo principal"
                    placeholder="Selecione"
                    withAsterisk
                    data={[
                      { value: '1', label: 'Autoral' },
                      { value: '2', label: 'Cover' },
                      { value: '3', label: 'Autoral + Cover' },
                    ]}
                  />
                </Group>
              </Tabs.Panel>
            </Tabs>

            <Text>Gig em destaque</Text>

            {/* <Card bg="mublinColor.9">
              <Title order={2}>Guitarrista</Title>
              <Title order={4}>Guitarrista para show cover anos 80</Title>
              <Text />
              <Text>
                95% match Sorocaba, SP · Bar Manifesto · 28 jun · 21h Rock · Guitar solo
                exigido · 4h de show R$ 400 cachê encerra hoje
              </Text>
            </Card> */}
          </>
        )}
      </Container>
    </>
  )
}
