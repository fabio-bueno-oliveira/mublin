import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchProjectDetails } from '../queries/projects'
import {
  Container,
  Flex,
  Box,
  Avatar,
  Image,
  Title,
  Text,
  Badge,
  Skeleton,
  Divider,
  Group,
  Stack,
  Tooltip,
  ActionIcon,
} from '@mantine/core'
import {
  IconBrandInstagram,
  IconBrandSpotify,
  IconBrandSoundcloud,
  IconMapPin,
  IconUsers,
} from '@tabler/icons-react'

export default function Project() {
  const { slug } = useParams()

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => fetchProjectDetails(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  // Membros confirmados (status 2)
  const confirmedMembers = project?.members?.filter((m) => m.status === 2) ?? []

  if (isError) {
    return (
      <Container size="md" py="xl">
        <Text c="dimmed" ta="center">
          Projeto não encontrado.
        </Text>
      </Container>
    )
  }

  const PICTURE_AVATAR_PATH =
    'https://ik.imagekit.io/mublin/projects/tr:h-160,w-160,c-maintain_ratio/'
  const PICTURE_COVER_PATH =
    'https://ik.imagekit.io/mublin/projects/tr:h-180,w-800,c-maintain_ratio/'
  const AVATAR_PATH =
    'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'
  const DEFAULT_COVER_PICTURE =
    'https://ik.imagekit.io/mublin/bg/tr:w-1920,h-200,bg-F3F3F3,fo-bottom/open-air-concert.jpg'

  return (
    <Container size="md" py="lg">
      {/* ── Cabeçalho / Cover ── */}
      <Box pos="relative" mb={60}>
        {/* Imagem de capa (usa a picture do projeto em proporção paisagem) */}
        {isLoading ? (
          <Skeleton height={220} radius="md" />
        ) : (
          <Image
            src={
              project?.cover_picture
                ? PICTURE_COVER_PATH + project?.cover_picture
                : DEFAULT_COVER_PICTURE
            }
            fallbackSrc="https://placehold.co/800x180?text=."
            height={180}
            radius="md"
            fit="cover"
            w="100%"
            alt="Imagem de capa"
          />
        )}

        {/* Avatar do projeto sobreposto */}
        <Box pos="absolute" bottom={-40} left={20} style={{ zIndex: 1 }}>
          {isLoading ? (
            <Skeleton circle height={80} width={80} />
          ) : (
            <Avatar
              src={PICTURE_AVATAR_PATH + project?.picture}
              size={80}
              radius="md"
              style={{ border: '3px solid var(--mantine-color-body)' }}
            />
          )}
        </Box>
      </Box>

      {/* ── Identidade ── */}
      <Flex justify="space-between" align="flex-start" mt="md" wrap="wrap" gap="sm">
        <Stack gap={4}>
          {isLoading ? (
            <>
              <Skeleton height={28} width={200} />
              <Skeleton height={16} width={120} mt={4} />
            </>
          ) : (
            <>
              <Group gap={8}>
                <Title order={2}>{project?.name}</Title>
                {project?.on_tour && (
                  <Badge
                    color="green"
                    variant="light"
                    size="sm"
                    leftSection={<IconMapPin size={10} />}
                  >
                    Em turnê
                  </Badge>
                )}
              </Group>
              <Group gap={6}>
                {project?.project_type && (
                  <Text size="sm" c="dimmed">
                    {project.project_type}
                  </Text>
                )}
                {project?.genre && (
                  <>
                    <Text size="sm" c="dimmed">
                      ·
                    </Text>
                    <Text size="sm" c="dimmed">
                      {project.genre}
                    </Text>
                  </>
                )}
              </Group>
            </>
          )}
        </Stack>

        {/* Redes sociais */}
        {!isLoading && (
          <Group gap={6}>
            {project?.instagram && (
              <Tooltip label="Instagram">
                <ActionIcon
                  component="a"
                  href={`https://instagram.com/${project.instagram}`}
                  target="_blank"
                  variant="subtle"
                  color="pink"
                >
                  <IconBrandInstagram size={18} />
                </ActionIcon>
              </Tooltip>
            )}
            {project?.spotify_id && (
              <Tooltip label="Spotify">
                <ActionIcon
                  component="a"
                  href={`https://open.spotify.com/artist/${project.spotify_id}`}
                  target="_blank"
                  variant="subtle"
                  color="green"
                >
                  <IconBrandSpotify size={18} />
                </ActionIcon>
              </Tooltip>
            )}
            {project?.soundcloud && (
              <Tooltip label="SoundCloud">
                <ActionIcon
                  component="a"
                  href={`https://soundcloud.com/${project.soundcloud}`}
                  target="_blank"
                  variant="subtle"
                  color="orange"
                >
                  <IconBrandSoundcloud size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        )}
      </Flex>

      {/* ── Descrição / Purpose ── */}
      {(isLoading || project?.description || project?.purpose) && (
        <>
          <Divider my="lg" />
          <Stack gap={6}>
            {isLoading ? (
              <>
                <Skeleton height={14} width="90%" />
                <Skeleton height={14} width="75%" />
              </>
            ) : (
              <>
                {project?.description && <Text size="sm">{project.description}</Text>}
                {project?.purpose && (
                  <Text size="sm" c="dimmed" fs="italic">
                    {project.purpose}
                  </Text>
                )}
              </>
            )}
          </Stack>
        </>
      )}

      {/* ── Integrantes confirmados ── */}
      <Divider my="lg" />
      <Stack gap="sm">
        <Group gap={6}>
          <IconUsers size={16} />
          <Text fw={600} size="sm">
            Integrantes e Staff ({confirmedMembers.length})
          </Text>
        </Group>

        {isLoading && (
          <Flex gap={12} wrap="wrap">
            {Array.from({ length: 4 }).map((_, i) => (
              <Flex key={i} direction="column" align="center" gap={6}>
                <Skeleton circle height={52} width={52} />
                <Skeleton height={10} width={50} />
              </Flex>
            ))}
          </Flex>
        )}

        {!isLoading && confirmedMembers.length === 0 && (
          <Text size="sm" c="dimmed">
            Nenhum integrante confirmado.
          </Text>
        )}

        {!isLoading && confirmedMembers.length > 0 && (
          <Flex gap={16} wrap="wrap">
            {confirmedMembers.map((member) => (
              <Flex
                key={member.id}
                direction="column"
                align="center"
                gap={6}
                component={Link}
                to={`/u/${member.username}`}
                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <Avatar src={AVATAR_PATH + member.avatar} size={50} radius="xl" />
                <Stack gap={1} align="center">
                  <Text size="0.7rem" fw={500} ta="center" w={60} lineClamp={1}>
                    {member.name}
                  </Text>
                  <Text size="0.65rem" c="dimmed" ta="center" w={60} lineClamp={1}>
                    {member.role}
                    {member.role_2 ? ` · ${member.role_2}` : ''}
                  </Text>
                </Stack>
                {member.is_founder && (
                  <Badge size="xs" variant="dot" color="yellow">
                    Fundador
                  </Badge>
                )}
              </Flex>
            ))}
          </Flex>
        )}
      </Stack>
    </Container>
  )
}
