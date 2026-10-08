import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Card, Group, Skeleton, Stack, Text, Title } from '@mantine/core'
import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react'
import { fetchSimilarProjects } from '../../queries/projects'

const PATH_PROJECT_AVATAR = 'https://ik.imagekit.io/mublin/projects/'
const SKELETON_COUNT = 3

/**
 * Projetos similares, empilhados (coluna lateral da página de projeto).
 * Some por completo quando não há similares ou a busca falha.
 *
 * @param {number} props.projectId  id do projeto atual
 * @param {number} props.limit      quantos similares buscar
 */
export default function SimilarProjects({
  projectId,
  limit = 5,
  title = 'Projetos similares',
}) {
  const {
    data: projects = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['similar-projects', projectId, limit],
    queryFn: () => fetchSimilarProjects(projectId, limit),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 10,
  })

  if (isError || (!isLoading && projects.length === 0)) {
    return null
  }

  return (
    <Stack gap="xs">
      <Title order={3} fw={600} size="17px" mb={0}>
        {title}
      </Title>

      {isLoading
        ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <Skeleton key={i} h={68} radius="lg" />
          ))
        : projects.map((project) => {
            const subtitle = project.project_type_name

            // [project.project_type_name, project.genre_name]
            //   .filter(Boolean)
            //   .join(' • ')

            return (
              <Card
                key={project.id}
                component={Link}
                to={
                  project.project_type_id === 19
                    ? `/person/${project.slug}`
                    : `/project/${project.slug}`
                }
                withBorder
                radius="lg"
                p="sm"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Group gap="sm" wrap="nowrap">
                  <Avatar
                    src={
                      project.picture
                        ? `${PATH_PROJECT_AVATAR}${project.id}/tr:h-96,w-96,c-maintain_ratio/${project.picture}`
                        : undefined
                    }
                    name={project.name}
                    color="initials"
                    alt={project.name}
                    size={44}
                    radius="md"
                  />
                  <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                    <Group gap={4} wrap="nowrap">
                      <Text size="sm" fw={600} truncate="end" title={project.name}>
                        {project.name}
                      </Text>
                      {project.is_verified && (
                        <IconRosetteDiscountCheckFilled
                          size={16}
                          color="var(--mantine-color-mublinSecondary-2)"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </Group>
                    {subtitle && (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {subtitle}
                      </Text>
                    )}
                  </Stack>
                </Group>
              </Card>
            )
          })}
    </Stack>
  )
}
