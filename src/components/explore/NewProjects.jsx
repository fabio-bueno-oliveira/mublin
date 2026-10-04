import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Avatar,
  Box,
  Group,
  Image,
  Scroller,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconSquareRoundedArrowLeftFilled,
  IconSquareRoundedArrowRightFilled,
} from '@tabler/icons-react'
import { fetchRecentProjects } from '../../queries/search'

const PATH_PROJECT_AVATAR = 'https://ik.imagekit.io/mublin/projects/'
const CARD_SIZE = 156
const SKELETON_COUNT = 6

export default function NewProjects({
  limit = 10,
  withPictureOnly = false,
  createdSourceId = null,
}) {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['recent-projects', limit, withPictureOnly, createdSourceId],
    queryFn: () => fetchRecentProjects(limit, { withPictureOnly, createdSourceId }),
    staleTime: 1000 * 60 * 5,
  })

  if (!isLoading && projects.length === 0) return null

  return (
    <Box mb="lg">
      <Title order={3} fw={600} fz="lg" mb="md">
        Novos projetos e artistas
      </Title>

      <Scroller
        controlSize="xl"
        startControlIcon={
          <IconSquareRoundedArrowLeftFilled size={34} style={{ marginLeft: '14px' }} />
        }
        endControlIcon={
          <IconSquareRoundedArrowRightFilled size={34} style={{ marginRight: '14px' }} />
        }
      >
        <Group wrap="nowrap" gap="xl" align="flex-start">
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <Stack key={i} gap={8} align="center" style={{ flexShrink: 0 }}>
                  <Skeleton width={CARD_SIZE} height={CARD_SIZE} radius="50%" />
                  <Skeleton width={100} height={12} radius="xl" />
                  <Skeleton width={70} height={8} radius="xl" />
                </Stack>
              ))
            : projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/project/${project.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
                >
                  <Stack
                    gap={8}
                    align="center"
                    w={CARD_SIZE}
                    style={{
                      transition: 'transform 0.2s ease',
                    }}
                    className="spotify-card"
                  >
                    {/* FOTO OCUPANDO 100% DO BOX - SEM BORDAS */}
                    <Box
                      w={CARD_SIZE}
                      h={CARD_SIZE}
                      style={{
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: 'var(--mantine-color-dark-6)',
                        boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                        position: 'relative',
                      }}
                    >
                      {project.picture ? (
                        <Image
                          src={`${PATH_PROJECT_AVATAR}${project.id}/tr:h-400,w-400,c-maintain_ratio/${project.picture}`}
                          alt={project.name}
                          w="100%"
                          h="100%"
                          fit="cover"
                          fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(project.name)}&background=random`}
                        />
                      ) : (
                        <Avatar
                          name={project.name}
                          color="initials"
                          radius="50%"
                          w="100%"
                          h="100%"
                          size={CARD_SIZE}
                          style={{ fontSize: 32 }}
                        />
                      )}
                    </Box>

                    {/* NOME FORA, ABAIXO - ESTILO SPOTIFY */}
                    <Stack gap={2} align="center" w="100%">
                      <Text
                        size="sm"
                        fw={600}
                        ta="center"
                        lh={1.15}
                        lineClamp={2}
                        style={{ maxWidth: CARD_SIZE }}
                      >
                        {project.name}
                      </Text>
                      <Text size="xs" c="dimmed" ta="center" lineClamp={1}>
                        {project?.type?.name_ptbr || 'Projeto'}
                      </Text>
                    </Stack>
                  </Stack>
                </Link>
              ))}
          <Box w={32} h={CARD_SIZE} style={{ flexShrink: 0 }} />
        </Group>
      </Scroller>

      {/* hover igual do Spotify */}
      <style>{`
        .spotify-card:hover {
          transform: translateY(-2px);
        }
        .spotify-card:hover > div:first-child {
          box-shadow: 0 12px 32px rgba(0,0,0,.6) !important;
        }
      `}</style>
    </Box>
  )
}
