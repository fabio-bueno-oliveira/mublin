import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchProjectPublicDetails,
  fetchProjectGenres,
  fetchRelatedProjects,
  fetchProjectTourStatus,
} from '../queries/projects'
import {
  Container,
  Card,
  Avatar,
  Title,
  Text,
  Badge,
  Skeleton,
  Group,
  Stack,
  SimpleGrid,
  Button,
  UnstyledButton,
  Scroller,
} from '@mantine/core'
// import { useDisclosure } from '@mantine/hooks'
import {
  IconRoad,
  IconRosetteDiscountCheckFilled,
  IconArrowRight,
  IconMapPin,
  IconMusic,
  IconCalendar,
} from '@tabler/icons-react'
import { truncateDescription } from '../utils/formatter'

export default function Project() {
  const { slug } = useParams()
  const navigate = useNavigate()

  // const [ctaOpened, { close: closeCta }] = useDisclosure(true)

  const {
    data: project,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => fetchProjectPublicDetails(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const { data: projectGenres = [], isLoading: loadingProjectGenres } = useQuery({
    queryKey: ['project-genres', project?.id],
    queryFn: () => fetchProjectGenres(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: relatedProjects = [], isLoading: loadingRelatedProjects } = useQuery({
    queryKey: ['project-related', project?.id],
    queryFn: () => fetchRelatedProjects(project?.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: tourStatus } = useQuery({
    queryKey: ['project-tour-status', project?.id],
    queryFn: () => fetchProjectTourStatus(project.id),
    enabled: !!project?.id,
    staleTime: 1000 * 60 * 2,
  })

  const validGenreNames =
    projectGenres?.map((g) => g?.genre?.name_ptbr || g?.name_ptbr).filter(Boolean) ?? []

  if (!isLoading && (isError || !project)) {
    return (
      <Container size="md" py="xl">
        <Text c="dimmed" ta="center">
          Projeto não encontrado.
        </Text>
      </Container>
    )
  }

  const PROJECT_AVATAR_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-180,w-180,c-maintain_ratio/`
  // const PROJECT_AVATAR_TEASER_PATH = `https://ik.imagekit.io/mublin/projects/${project?.id}/tr:h-176,w-176,c-maintain_ratio/`

  const getRelatedAvatarUrl = (related) =>
    related?.picture
      ? `https://ik.imagekit.io/mublin/projects/${related.id}/tr:h-200,w-200,c-maintain_ratio/${related.picture}`
      : null

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

  return (
    <>
      {project && (
        <Helmet>
          <title>{`${project.name} | Mublin`}</title>

          <meta name="description" content={metaDescription} />

          <link
            rel="canonical"
            href={`https://mublin.com/project/${encodeURIComponent(project.slug)}`}
          />

          <meta property="og:type" content="profile" />
          <meta property="og:site_name" content="Mublin" />
          <meta property="og:title" content={`${project.name} | Mublin`} />

          <meta property="og:description" content={metaDescription} />

          <meta
            property="og:url"
            content={`https://mublin.com/project/${encodeURIComponent(project.slug)}`}
          />

          {project.picture && (
            <meta property="og:image" content={PROJECT_AVATAR_PATH + project.picture} />
          )}
        </Helmet>
      )}

      {/* Modal CTA - abre automaticamente igual Instagram */}
      {/* <Modal
        opened={ctaOpened}
        onClose={closeCta}
        centered
        radius="lg"
        size="sm"
        withCloseButton
        overlayProps={{
          backgroundOpacity: 0.8,
          blur: 3,
        }}
      >
        <Stack align="center" gap="sm" pt="md">
          <Center>
            {isLoading || loadingProjectGenres ? (
              <Skeleton circle height={88} width={88} />
            ) : (
              <Avatar
                size={88}
                src={
                  project?.picture ? PROJECT_AVATAR_TEASER_PATH + project.picture : null
                }
              />
            )}
          </Center>
          <Stack gap={4} align="center">
            <Text ta="center" size="lg" fw={300} lh={1.2}>
              Veja a página completa de{' '}
              <Text span fw={600}>
                {slug}
              </Text>
            </Text>
            {project?.type?.name_ptbr && (
              <Text ta="center" size="xs" c="dimmed" lineClamp={1}>
                {project.type.name_ptbr}
                {validGenreNames.length > 0 && (
                  <Text span> · {validGenreNames.join(', ')}</Text>
                )}
              </Text>
            )}
            <Text ta="center" size="sm" c="dimmed" mt={6} maw={300}>
              Entre para ver pessoas relacionadas, gigs e muito mais no Mublin
            </Text>
          </Stack>

          <Stack w="100%" gap="xs" mt={4}>
            <Button
              size="sm"
              radius="xl"
              fullWidth
              rightSection={<IconArrowRight size={16} />}
              onClick={() => navigate('/signup')}
            >
              Criar conta grátis
            </Button>
            <Button
              variant="subtle"
              color="var(--mantine-color-text)"
              size="sm"
              radius="xl"
              fullWidth
              onClick={() => navigate('/login')}
            >
              Entrar
            </Button>
          </Stack>
        </Stack>
      </Modal> */}

      <Container px="lg" size="md" mt={{ base: 22, sm: 30 }}>
        <Group wrap="nowrap" px="xs">
          {isLoading ? (
            <Skeleton circle height={90} width={90} />
          ) : (
            <Avatar
              src={project?.picture ? PROJECT_AVATAR_PATH + project.picture : null}
              size={90}
              alt={`Foto ${project?.type?.name_ptbr} ${project?.name}`}
            />
          )}

          <Stack gap={0}>
            {isLoading || loadingProjectGenres ? (
              <>
                <Skeleton height={28} width={200} />
                <Skeleton height={16} width={120} mt={4} />
              </>
            ) : (
              <>
                {/* TOUR BADGES - nova lógica */}
                {tourStatus?.isOnTour && (
                  <Badge mb={4} color="green" leftSection={<IconRoad size={14} />}>
                    Em turnê • {tourStatus.activeTours[0].title}
                  </Badge>
                )}
                {!tourStatus?.isOnTour && tourStatus?.isUpcomingSoon && (
                  <Badge
                    color="yellow"
                    variant="light"
                    leftSection={<IconCalendar size={14} />}
                    px={5}
                    mb={4}
                  >
                    Turnê em breve •{' '}
                    {/* {tourStatus.nextDate &&
                      new Date(tourStatus.nextDate).toLocaleDateString(
                        'pt-BR',
                      )}{' '} */}
                    {tourStatus.upcomingTours[0].days_until} dias
                  </Badge>
                )}
                <Group gap={7} wrap="nowrap">
                  <Title
                    order={1}
                    fz={{
                      base: 24,
                      sm: 32,
                    }}
                    fw={650}
                    lts="-0.025em"
                    lineClamp={1}
                  >
                    {project?.name}
                  </Title>
                  {project?.is_verified && (
                    <IconRosetteDiscountCheckFilled
                      size={22}
                      color="var(--mantine-color-mublinSecondary-2)"
                      title="Projeto verificado"
                      style={{
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Group>
                <Group gap={6} wrap="nowrap">
                  {project?.type?.name_ptbr && (
                    <Text size="sm" c="dimmed">
                      {project.type.name_ptbr}
                    </Text>
                  )}

                  {validGenreNames.length > 0 && (
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
                <Text size="xs" c="dimmed">
                  {projectLocation}
                </Text>
              </Group>
            )}
          </Stack>
        </Group>

        <Stack gap={6} mt="md">
          {isLoading ? (
            <Stack gap="xs" px="xs">
              <Skeleton height={10} width="40%" hiddenFrom="sm" />
              <Skeleton height={14} width="85%" />
              <Skeleton height={14} width="75%" />
            </Stack>
          ) : (
            <Stack gap={6} px="xs">
              {validGenreNames && (
                <Group gap={4} hiddenFrom="sm">
                  <IconMusic color="gray" size={12} />
                  <Text size="xs" c="dimmed">
                    {validGenreNames.join(', ')}
                  </Text>
                </Group>
              )}
              {project?.description && (
                <Text size="sm" lineClamp={3}>
                  {project.description}
                </Text>
              )}
              {/* {project?.end_year && (
                <Text c="dimmed" size="11px" mt={4} mb={2}>
                  {project?.name} encerrou as atividades no ano de {project?.end_year}
                </Text>
              )} */}
            </Stack>
          )}
        </Stack>

        {/* Projetos relacionados */}
        {(loadingRelatedProjects || relatedProjects.length > 0) && (
          <Stack gap="sm" mt="md" px="xs">
            <Text size="xs" fw={500} c="dimmed">
              Projetos relacionados
            </Text>
            <Scroller>
              <Group wrap="nowrap" gap="xs" align="flex-start">
                {loadingRelatedProjects
                  ? [1, 2, 3].map((i) => (
                      <Stack key={i} gap={6} align="center" w={84}>
                        <Skeleton circle height={64} width={64} />
                        <Skeleton height={10} width={56} />
                      </Stack>
                    ))
                  : relatedProjects.map((related) => (
                      <UnstyledButton
                        key={related.id}
                        onClick={() => navigate(`/project/${related.slug}`)}
                        aria-label={`Ver projeto ${related.name}`}
                        w={80}
                      >
                        <Stack gap={3} align="center">
                          <Avatar
                            src={getRelatedAvatarUrl(related)}
                            size={50}
                            alt={`Foto de perfil do projeto/artista ${related.name}`}
                          />
                          <Text
                            w={79}
                            size="xs"
                            ta="center"
                            lineClamp={1}
                            title={related.name}
                          >
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

        {/* CTA */}
        <Card mt={relatedProjects.length > 0 ? 20 : 36} px="lg" py="md">
          <SimpleGrid spacing="md" cols={{ base: 1, sm: 2, lg: 2 }}>
            <Stack gap={2}>
              <Text size="lg">
                Entre pra ver mais sobre <b>{project?.name}</b> no Mublin
              </Text>
              <Text size="sm" c="dimmed">
                Pessoas relacionadas, gigs e muito mais
              </Text>
            </Stack>
            <Group gap="sm" mb="xs">
              <Button
                variant="outline"
                color="var(--mantine-color-text)"
                size="sm"
                radius="xl"
                onClick={() => navigate('/login')}
              >
                Entrar
              </Button>
              <Button
                size="sm"
                radius="xl"
                rightSection={<IconArrowRight size={14} />}
                onClick={() => navigate('/signup')}
              >
                Criar conta grátis
              </Button>
            </Group>
          </SimpleGrid>
        </Card>
      </Container>
    </>
  )
}
