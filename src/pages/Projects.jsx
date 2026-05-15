import { useAuth } from '../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Container,
  Grid,
  Flex,
  Group,
  Center,
  Avatar,
  Badge,
  Title,
  Text,
  Loader,
  Stack,
  Paper,
  Indicator,
} from '@mantine/core'
import { IconClock } from '@tabler/icons-react'
import ProjectCard from '../components/ProjectCard'
import { showYears } from '../utils/formatter'

const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'
const currentYear = new Date().getFullYear()

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
    type: p.projects.project_types?.name_ptbr,
    joined_at: p.joined_at ? new Date(p.joined_at).getFullYear() : null,
    left_at: p.left_at ? new Date(p.left_at).getFullYear() : null,
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

      {userProjects.length > 0 ? (
        <Stack gap="xs">
          {userProjects.map((project) => (
            <Paper key={project.id} p="sm">
              <Grid>
                <Grid.Col span={{ base: 12, md: 6, lg: 6 }} opacity={project.request_status === 1 ? 0.4 : 1}>
                  <Link
                    to={`/project/${project.slug}`}
                    className="noDecoration"
                    mb="md"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: 'var(--mantine-color-text)',
                    }}
                  >
                    <Avatar
                      size={50}
                      src={
                        project?.picture
                          ? `${PROJECT_AVATAR_PATH}/${project?.id}/tr:h-100,w-100,c-maintain_ratio/${project?.picture}`
                          : undefined
                      }
                      alt={project.name}
                    />
                    <Flex direction="column" gap={3}>
                      <Title order={3} size="md" fw={600} lh={1} w={120} truncate="end">
                        {project.name}{' '}
                      </Title>
                      <Text size="sm" c="dimmed" w={120} truncate="end">
                        {project.type} {project.genre ? `· ${project.genre}` : ''}
                      </Text>
                      {project.activity_status && (
                        <Group gap={8} wrap="nowrap">
                          <Indicator
                            color={project.activity_status_color ?? 'gray'}
                            processing={project.activity_status === 1}
                            size={5}
                          />
                          <Text size="11px" lh={1} c={!project.activity_status_color ? 'dimmed' : undefined}>
                            {project.activity_status_name ? project.activity_status_name : 'Não informado'}
                            {project.end_year && ` em ${project.end_year}`}
                          </Text>
                        </Group>
                      )}
                    </Flex>
                  </Link>
                  <Text size="sm" fw={300} opacity={project.request_status === 1 ? 0.4 : 1} w={150} truncate="end">
                    {project.main_role}{' '}
                    {project.is_founder && (
                      <Text span c="dimmed" size="xs">
                        (Fundador)
                      </Text>
                    )}
                  </Text>
                  {project.request_status !== 1 && (
                    <>
                      {!project.end_year ? (
                        <Flex gap={8} align="center">
                          <Indicator color={project.left_at ? 'red' : 'green'} size={5} />
                          <Text size="11px" className="lhNormal">
                            {`${project.joined_at} ➜ ${project.left_at ? project.left_at : currentYear}`}{' '}
                            {project.left_at
                              ? showYears(project.left_at - project.joined_at)
                              : showYears(currentYear - project.joined_at)}
                          </Text>
                        </Flex>
                      ) : (
                        <Flex gap={8} align="center">
                          <Indicator color="red" size={5} />
                          <Text size="11px" className="lhNormal">
                            {`${project.joined_at} ➜ ${project.end_year}`}{' '}
                            {showYears(project.end_year - project.joined_at)}
                          </Text>
                        </Flex>
                      )}
                    </>
                  )}
                  <Group>
                    {project.request_status === 1 && (
                      <Badge color="orange" size="xs" autoContrast leftSection={<IconClock size={12} />}>
                        Pendente
                      </Badge>
                    )}
                    {project.is_ex_member && (
                      <Text c="dimmed" size="xs">
                        Ex integrante
                      </Text>
                    )}
                  </Group>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6, lg: 6 }} opacity={project.request_status === 1 ? 0.4 : 1}>
                  <Flex direction="column" gap={2}>
                    <Text size="sm" fw={300} opacity={project.request_status === 1 ? 0.4 : 1} w={150} truncate="end">
                      {project.main_role}{' '}
                      {project.is_founder && (
                        <Text span c="dimmed" size="xs">
                          (Fundador)
                        </Text>
                      )}
                    </Text>
                    {project.request_status !== 1 && (
                      <>
                        {!project.end_year ? (
                          <Flex gap={8} align="center">
                            <Indicator color={project.left_at ? 'red' : 'green'} size={5} />
                            <Text size="11px" className="lhNormal">
                              {`${project.joined_at} ➜ ${project.left_at ? project.left_at : currentYear}`}{' '}
                              {project.left_at
                                ? showYears(project.left_at - project.joined_at)
                                : showYears(currentYear - project.joined_at)}
                            </Text>
                          </Flex>
                        ) : (
                          <Flex gap={8} align="center">
                            <Indicator color="red" size={5} />
                            <Text size="11px" className="lhNormal">
                              {`${project.joined_at} ➜ ${project.end_year}`}{' '}
                              {showYears(project.end_year - project.joined_at)}
                            </Text>
                          </Flex>
                        )}
                      </>
                    )}
                    <Group>
                      {project.request_status === 1 && (
                        <Badge color="orange" size="xs" autoContrast leftSection={<IconClock size={12} />}>
                          Pendente
                        </Badge>
                      )}
                      {project.is_ex_member && (
                        <Text c="dimmed" size="xs">
                          Ex integrante
                        </Text>
                      )}
                    </Group>
                  </Flex>
                </Grid.Col>
              </Grid>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Paper>
          <Text c="dimmed" ta="center">
            Nenhum projeto associado ao seu perfil
          </Text>
        </Paper>
      )}
    </Container>
  )
}
