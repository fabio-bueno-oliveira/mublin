import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import AppNavbarMobile from '../components/AppNavbarMobile'
import ProjectSelector from '../components/gigs/ProjectSelector'
import SetlistManager from '../components/setlist/SetlistManager'
import { Affix, Container, Title, Text, Group, Stack, Paper, Loader } from '@mantine/core'
import { IconPlaylist } from '@tabler/icons-react'

// Página standalone de gestão de setlists — antes essa funcionalidade só
// existia embutida no fluxo de criação de gig (NewGig.jsx). Aqui ela vira uma
// página própria: /setlists (escolhe o projeto) ou /setlists/:projectId
// (gerencia direto). O SetlistManager é o mesmo componente usado na gig,
// então qualquer melhoria nele (como a busca externa de tracks) vale pros
// dois lugares automaticamente.
export default function SetlistEditor() {
  const { projectId, setlistId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [selectedSetlistId, setSelectedSetlistId] = useState(
    setlistId ? Number(setlistId) : null,
  )

  const { data: userProjectsRaw = [], isLoading: loadingUserProjects } = useQuery({
    queryKey: ['user-projects', user?.id],
    queryFn: () => fetchUserProjects(user.id),
    enabled: !!user?.id && !projectId,
  })

  const projects = userProjectsRaw.map((fp) => fp.projects)

  function handleSelectProject(project) {
    navigate(`/setlists/${project.id}`)
  }

  function handleSetlistChange(id) {
    setSelectedSetlistId(id)
    // mantém a URL em sincronia (útil pra compartilhar o link de uma setlist
    // específica) sem empilhar entradas no histórico do navegador
    navigate(`/setlists/${projectId}${id ? `/${id}` : ''}`, { replace: true })
  }

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Setlists · Mublin</title>
        <link rel="canonical" href="https://mublin.com/setlists" />
        <meta
          name="description"
          content="Crie e organize os repertórios (setlists) dos seus projetos no Mublin"
        />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName="Setlists" />
      </Affix>

      <Container size="sm" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <Group gap="xs" mb={4} visibleFrom="sm">
          <IconPlaylist size={32} />
          <Title order={1} fz="h3" ta="left" fw={600}>
            Setlists
          </Title>
        </Group>
        <Text size="sm" c="dimmed" mb="lg">
          Crie e organize o repertório de músicas dos seus projetos
        </Text>

        {!projectId ? (
          <Paper withBorder p="md" radius="md">
            <Text size="sm" fw={500} mb="sm">
              De qual projeto você quer gerenciar o repertório?
            </Text>
            {loadingUserProjects ? (
              <Group justify="center" py="md">
                <Loader size="sm" />
              </Group>
            ) : (
              <ProjectSelector
                loadingProjects={loadingUserProjects}
                projects={projects}
                selectedProject={null}
                onSelectProject={handleSelectProject}
              />
            )}
          </Paper>
        ) : (
          <Stack gap="md">
            <SetlistManager
              projectId={Number(projectId)}
              value={selectedSetlistId}
              onChange={handleSetlistChange}
            />
          </Stack>
        )}
      </Container>
    </>
  )
}
