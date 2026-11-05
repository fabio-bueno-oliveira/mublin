import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchPublicProjectDetails,
  fetchPublicProjectPeople,
  fetchProjectGenres,
  fetchRelatedProjects,
  fetchProjectTourStatus,
  fetchProjectAudioPreview,
} from '../queries/projects'
import {
  Container,
  Flex,
  Card,
  Box,
  Avatar,
  Title,
  Text,
  Badge,
  Skeleton,
  Group,
  Stack,
  Button,
  Tooltip,
  Pill,
} from '@mantine/core'
import { IconRoad, IconArrowRight, IconMapPin, IconCalendar } from '@tabler/icons-react'
import { IconShieldCheckMublin } from '../components/icons/IconShieldCheckMublin'
import {
  FadedBio,
  ProjectPeopleTeaserBlock,
  RelatedProjectsBlock,
  ProjectAvatarPlayer,
} from '../components/project/public/'
import { truncateDescription } from '../utils/formatter'

export default function ProjectPublic() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['public-project', slug],
    queryFn: () => fetchPublicProjectDetails(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const { data: people = [], isLoading: isLoadingPeople } = useQuery({
    queryKey: ['public-project-people', project?.id],
    queryFn: () => fetchPublicProjectPeople(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: genres = [], isLoading: isLoadingGenres } = useQuery({
    queryKey: ['public-project-genres', project?.id],
    queryFn: () => fetchProjectGenres(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: relatedProjects = [], isLoading: isLoadingRelatedProjects } = useQuery({
    queryKey: ['public-project-related', project?.id],
    queryFn: () => fetchRelatedProjects(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: audioPreview } = useQuery({
    queryKey: ['public-project-audio-preview', project?.id],
    queryFn: () => fetchProjectAudioPreview(project.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 10,
  })

  const { data: tourStatus } = useQuery({
    queryKey: ['public-project-tour-status', project?.id],
    queryFn: () => fetchProjectTourStatus(project.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 2,
  })

  const validGenreNames =
    genres?.map((g) => g?.genre?.name_ptbr || g?.name_ptbr).filter(Boolean) ?? []

  if (!isLoading && (isError || !project)) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex" />
        </Helmet>
        <Container size="md" py="xl">
          <Text c="dimmed" ta="center">
            Projeto não encontrado.
          </Text>
        </Container>
      </>
    )
  }

  const PROJECT_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-180,w-180,c-maintain_ratio/`

  const city = project?.cities

  const projectLocation = [
    city?.name,
    city?.regions?.name !== city?.name ? city?.regions?.name : null,
    city?.regions?.uf,
  ]
    .filter(Boolean)
    .join(', ')

  const metaDescription = project
    ? truncateDescription(
        project.description ||
          `Confira ${project.name}, ${project.type?.name_ptbr || 'este projeto musical'} no Mublin. Pessoas relacionadas, gigs e muito mais!`,
      )
    : ''

  const isEnded = project?.end_year > 0

  const projectUrl = `https://mublin.com/project/${encodeURIComponent(slug)}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: project?.name,
    url: projectUrl,
    description: metaDescription,
    ...(project?.picture && { image: PROJECT_AVATAR_PATH + project?.picture }),
    ...(validGenreNames.length > 0 && { genre: validGenreNames }),
    ...(project?.start_year && { foundingDate: String(project?.start_year) }),
    ...(project?.end_year && { dissolutionDate: String(project?.end_year) }),
  }

  return (
    <>
      {project && (
        <Helmet>
          <title>{`${project?.name} | Mublin`}</title>
          <meta name="description" content={metaDescription} />
          <link rel="canonical" href={projectUrl} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Mublin" />
          <meta property="og:title" content={`${project?.name} | Mublin`} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:url" content={projectUrl} />
          <meta property="og:locale" content="pt_BR" />
          {project?.picture && (
            <meta property="og:image" content={PROJECT_AVATAR_PATH + project.picture} />
          )}
          <script type="application/ld+json">
            {JSON.stringify(jsonLd).replace(/</g, '\\u003c')}
          </script>
        </Helmet>
      )}

      <Container px="lg" size="md" mt={{ base: 20, sm: 26 }}>
        <Group wrap="nowrap" px="xs">
          {isLoading ? (
            <Skeleton circle height={90} width={90} />
          ) : (
            <ProjectAvatarPlayer
              imageSrc={project?.picture ? PROJECT_AVATAR_PATH + project.picture : null}
              alt={['Foto', project?.type?.name_ptbr, project?.name]
                .filter(Boolean)
                .join(' ')}
              size={90}
              src={audioPreview?.src}
              songName={audioPreview?.songName}
              onPlay={() => {
                // aqui entra seu evento de analytics: 'project_preview_play'
              }}
            />
          )}

          <Stack gap={0}>
            {isLoading || isLoadingGenres ? (
              <>
                <Skeleton height={28} width={200} />
                <Skeleton height={16} width={120} mt={4} />
              </>
            ) : (
              <>
                <Group gap={7} wrap="nowrap">
                  <Title
                    order={1}
                    fz={{
                      base: 24,
                      sm: 32,
                    }}
                    fw={650}
                    lh={1.2}
                  >
                    {project?.name}
                  </Title>
                  {project?.is_verified && (
                    <Tooltip
                      label="Verificado por pessoas relacionadas"
                      withArrow
                      color="dark"
                    >
                      <Box component="span" style={{ display: 'inline-flex' }}>
                        <IconShieldCheckMublin
                          size={22}
                          color="var(--mantine-color-mublinColor-3)"
                          title="Projeto verificado"
                          style={{
                            flexShrink: 0,
                          }}
                        />
                      </Box>
                    </Tooltip>
                  )}
                </Group>
                <Group gap={6} wrap="nowrap">
                  {project?.type?.name_ptbr && (
                    <Text size="sm" c="dimmed">
                      {project.type.name_ptbr}
                    </Text>
                  )}

                  {!isLoadingGenres && validGenreNames.length > 0 && (
                    <Group gap={6} visibleFrom="sm" wrap="nowrap">
                      <Text size="sm" c="dimmed">
                        ·
                      </Text>
                      <Text size="sm" c="dimmed">
                        {validGenreNames.join(', ')}
                      </Text>
                    </Group>
                  )}
                </Group>
              </>
            )}
            {projectLocation && (
              <Group gap={2} wrap="nowrap">
                <IconMapPin color="gray" size={12} stroke={2} />
                <Text
                  size="xs"
                  c="dimmed"
                  truncate="end"
                  lh={1.5}
                  style={{ maxWidth: 200 }}
                >
                  {projectLocation}
                  {'  '}
                  {project?.cities?.countries?.name === 'Brazil' && '🇧🇷'}
                </Text>
              </Group>
            )}

            {isEnded ? (
              <Pill size="xs" mt={3} w="fit-content">
                Encerrou atividades em {project?.end_year}
              </Pill>
            ) : (
              <Box>
                {tourStatus?.isOnTour && (
                  <Badge mb={4} color="green" leftSection={<IconRoad size={14} />}>
                    Em turnê • {tourStatus.activeTours[0].title}
                  </Badge>
                )}
                {!tourStatus?.isOnTour && tourStatus?.isUpcomingSoon && (
                  <Badge
                    variant="gradient"
                    gradient={{ from: 'grape.9', to: 'mublinColor.9', deg: 190 }}
                    leftSection={<IconCalendar size={12} />}
                    px={6}
                    mb={4}
                    size="md"
                  >
                    Turnê em breve •{' '}
                    {/* {tourStatus.nextDate &&
                      new Date(tourStatus.nextDate).toLocaleDateString(
                        'pt-BR',
                      )}{' '} */}
                    {tourStatus?.upcomingTours[0]?.days_until} dias
                  </Badge>
                )}
              </Box>
            )}
          </Stack>
        </Group>

        <Box mt="md">
          {isLoading ? (
            <Stack gap="xs" px="xs">
              <Skeleton height={10} width="40%" hiddenFrom="sm" />
              <Skeleton height={14} width="85%" />
              <Skeleton height={14} width="75%" />
            </Stack>
          ) : (
            project?.description && <FadedBio text={project.description} />
          )}
        </Box>

        {/* CTA */}
        <Card mt="md" px="lg" py="md">
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', sm: 'center' }}
            gap="md"
          >
            <Stack gap={2}>
              <Text size="lg">
                Entre para ver mais sobre <b>{project?.name}</b> no Mublin
              </Text>
              <Text size="sm" c="dimmed" visibleFrom="sm">
                Pessoas relacionadas, gigs e muito mais
              </Text>
            </Stack>

            <Button
              variant="filled"
              color="mublinColor"
              size="sm"
              radius="xl"
              style={{ flexShrink: 0 }}
              onClick={() => navigate(`/signup?from=project&block=cta&project=${slug}`)}
              rightSection={<IconArrowRight size={14} />}
            >
              Veja gigs, staff, músicos e mais
            </Button>
          </Flex>
        </Card>

        <ProjectPeopleTeaserBlock
          project={project}
          people={people}
          isLoading={isLoadingPeople}
        />

        <RelatedProjectsBlock
          relatedProjects={relatedProjects}
          isLoading={isLoadingRelatedProjects}
        />
      </Container>
    </>
  )
}
