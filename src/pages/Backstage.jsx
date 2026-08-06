import { useAuth } from '../hooks/useAuth'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import { fetchProjectBackstageInfo } from '../queries/projects'
import { Container, Title, Text } from '@mantine/core'

const PICTURE_AVATAR_PATH =
  'https://ik.imagekit.io/mublin/projects/tr:h-200,w-200,c-maintain_ratio/'

export default function Backstage() {
  const { projectId } = useParams()

  const { data: project, isLoading } = useQuery({
    queryKey: ['project-backstage-info', projectId],
    queryFn: () => fetchProjectBackstageInfo(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  console.log('project', project)

  return (
    <Container>
      <Title order={2} fw={700}>
        Backstage
      </Title>
      {isLoading ? <Text>Loading...</Text> : <Text>{project.name}</Text>}
    </Container>
  )
}
