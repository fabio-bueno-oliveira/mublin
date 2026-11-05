import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  UnstyledButton,
  Group,
  Skeleton,
  Stack,
  Title,
  Text,
  Scroller,
} from '@mantine/core'

/* ─────────────────────────────────────────────────────────────
 * Projetos relacionado ao projeto em exibição
 * ───────────────────────────────────────────────────────────── */

export default function RelatedProjectsBlock({ relatedProjects, isLoading = false }) {
  const navigate = useNavigate()

  const getRelatedAvatarUrl = (related) =>
    related?.picture
      ? `https://ik.imagekit.io/mublin/projects/${related.id}/tr:h-84,w-84,c-maintain_ratio/${related.picture}`
      : null

  if (isLoading) {
    return (
      <Group mt="md" wrap="nowrap" gap="xs" align="flex-start">
        {[1, 2, 3].map((i) => (
          <Stack key={i} gap={6} align="center" w={84}>
            <Skeleton circle height={42} width={42} />
            <Skeleton height={10} width={56} />
          </Stack>
        ))}
      </Group>
    )
  }

  return (
    <>
      {relatedProjects.length > 0 && (
        <Stack gap="xs" mt="md" px="xs">
          <Title fw={400} size="sm" c="dimmed">
            Projetos relacionados
          </Title>
          <Scroller>
            <Group wrap="nowrap" gap="xs" align="flex-start">
              {relatedProjects.map((related) => (
                <UnstyledButton
                  key={related.id}
                  onClick={() => navigate(`/project/${related.slug}`)}
                  aria-label={`Ver projeto ${related.name}`}
                  w={76}
                >
                  <Stack gap={3} align="center">
                    <Avatar
                      src={getRelatedAvatarUrl(related)}
                      size={42}
                      alt={`Foto de perfil do projeto/artista ${related.name}`}
                    />
                    <Text w={79} size="xs" ta="center" lineClamp={1} title={related.name}>
                      {related.name}
                    </Text>
                    <Text size="10px" c="dimmed">
                      {related?.type}
                    </Text>
                  </Stack>
                </UnstyledButton>
              ))}
            </Group>
          </Scroller>
        </Stack>
      )}
    </>
  )
}
