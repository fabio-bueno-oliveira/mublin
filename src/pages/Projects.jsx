import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { Container, Group, Center, Title, Loader } from '@mantine/core'
import ProjectCard from '../components/ProjectCard'

export default function Projects() {
  const { user } = useAuth()

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
    picture: p.projects.picture,
    status: p.status,
    main_role: p.roles.name_ptbr,
    genre: p.projects.genres?.name,
    type: p.projects.project_types?.name_ptbr,
    totalMembers: p.projects.project_members?.length || 0,
  }))

  return (
    <Container size="xl" py="sm">
      <Title order={1} fz="h3" ta="left" fw={600} lts="-0.02em" mb={20}>
        Meus projetos
      </Title>
      {loadingProjects ? (
        <Center>
          <Loader />
        </Center>
      ) : (
        <Group gap="xs" wrap="wrap" mb={12}>
          {userProjects.map((item) => (
            <ProjectCard key={item.id} item={item} />
          ))}
        </Group>
      )}
    </Container>
  )
}
