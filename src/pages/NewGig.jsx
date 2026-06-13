import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { searchProjectsByName } from '../queries/projects'
import { fetchAllRoles } from '../queries/roles'
import { useMediaQuery, useDebouncedCallback } from '@mantine/hooks'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  Container,
  Flex,
  Group,
  Loader,
  Divider,
  Avatar,
  Box,
  Card,
  Stack,
  TextInput,
  Textarea,
  Title,
  Text,
  Button,
  Image,
  Scroller,
  ThemeIcon,
} from '@mantine/core'
import {
  IconSearch,
  IconSend,
  IconCheck,
  IconCircleArrowLeftFilled,
  IconCircleArrowRightFilled,
} from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,w-200,c-maintain_ratio/users/avatars/'

export default function NewGig() {
  const isDesktop = useMediaQuery('(min-width: 48em)')

  // ── Local States ──────────────────────────────────────
  const [projectSearch, setProjectSearch] = useState('')
  const [projectResults, setProjectResults] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)

  // ── Loading States ────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projectSearchIsLoading, setProjectSearchIsLoading] = useState(false)

  // ── Queries ───────────────────────────────────────────

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchAllRoles,
    staleTime: 1000 * 60 * 30,
  })

  const formNewGig = useForm({
    initialValues: {
      project_id: '',
      title: '',
      description: '',
    },
    validate: {
      title: (v) => (v.length < 2 ? 'Mínimo de 2 caracteres' : null),
    },
  })

  // ── Handlers ───────────────────────────────────────────

  const handleProjectSearch = useDebouncedCallback(async (query) => {
    setProjectSearchIsLoading(true)
    const results = await searchProjectsByName(query)
    setProjectResults(results)
    setProjectSearchIsLoading(false)
  }, 600)

  function handleSelectProject(project) {
    setSelectedProject(project)
  }

  async function handleSubmit(values) {
    notifications.show({
      title: 'Erro ao criar gig',
      message: 'Tente novamente em instantes',
      color: 'red',
    })
  }

  return (
    <>
      <Helmet>
        <title>Cadastrar gig · Mublin</title>
        <link rel="canonical" href="https://mublin.com/new/gig" />
      </Helmet>
      <Container size="sm" py="md" px={{ base: 'md', sm: 'lg' }}>
        <Title order={1} fz="h3" fw={600} mb="lg">
          Cadastrar nova gig
        </Title>
        <form onSubmit={formNewGig.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              placeholder="Projeto ou banda para esta gig"
              size="md"
              leftSection={<IconSearch size={15} />}
              rightSection={projectSearchIsLoading && <Loader size={15} />}
              value={projectSearch}
              onChange={(e) => {
                setProjectSearch(e.target.value)
                handleProjectSearch(e.target.value)
              }}
            />
            {projectResults.length > 0 && (
              <Scroller
                mt="md"
                key={projectResults.length}
                draggable={!isDesktop}
                controlSize="xl"
                classNames={{
                  root: 'scrollerRoot',
                  control: 'scrollerControl',
                }}
                startControlIcon={
                  isDesktop ? <IconCircleArrowLeftFilled size={36} /> : undefined
                }
                endControlIcon={
                  isDesktop ? <IconCircleArrowRightFilled size={36} /> : undefined
                }
              >
                <Group align="flex-start" gap="md" wrap="nowrap" pr="md">
                  {projectResults.map((project) => {
                    const alreadyAdded = project.id === selectedProject?.id
                    return (
                      <Card
                        key={project.id}
                        shadow="sm"
                        px="xs"
                        pb={6}
                        w={150}
                        h={218}
                        withBorder
                        pos="relative"
                        onClick={() => !alreadyAdded && handleSelectProject(project)}
                        style={{
                          cursor: alreadyAdded ? 'default' : 'pointer',
                          border: alreadyAdded
                            ? '1px solid var(--mantine-color-mublinColor-7)'
                            : undefined,
                        }}
                      >
                        <Card.Section>
                          <Image
                            src={
                              project.picture
                                ? `https://ik.imagekit.io/mublin/projects/${project.id}/tr:h-240/${project.picture}`
                                : undefined
                            }
                            height={120}
                            alt="Norway"
                          />
                          {alreadyAdded && (
                            <ThemeIcon
                              pos="absolute"
                              top={10}
                              right={10}
                              size={18}
                              radius="xl"
                              color="mublinColor"
                            >
                              <IconCheck style={{ width: 12, height: 12 }} stroke={3} />
                            </ThemeIcon>
                          )}
                        </Card.Section>
                        <Flex direction="column" mt="xs">
                          <Box
                            style={{
                              opacity: alreadyAdded ? 0.5 : 1,
                            }}
                          >
                            <Text size="sm" fw={600} lineClamp={1}>
                              {project.name}
                            </Text>
                            <Text size="xs" fw={300} opacity={0.8}>
                              {project.project_types?.name_ptbr &&
                                project.project_types?.name_ptbr}
                              {project.genres?.name_ptbr &&
                                ` · ${project.genres?.name_ptbr}`}
                            </Text>
                            <Text size="10px" c="dimmed" fw={300}>
                              {[
                                project.cities?.name,
                                project.cities?.regions?.name,
                                project.cities?.countries?.name_ptbr ??
                                  project.cities?.countries?.name,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </Text>

                            {/* ── Membros ───────────────────────────────── */}
                            {(() => {
                              const members = [...(project.project_members ?? [])].sort(
                                (a, b) => (b.is_founder ? 1 : 0) - (a.is_founder ? 1 : 0),
                              )
                              const visible = members.slice(0, 3)
                              const extra = members.length - 3

                              if (!visible.length) {
                                return null
                              }

                              return (
                                <Avatar.Group mt={6}>
                                  {visible.map((m, i) => (
                                    <Avatar
                                      key={m.profiles?.username ?? i}
                                      size="sm"
                                      radius="xl"
                                      src={
                                        m.profiles?.avatar
                                          ? AVATAR_PATH + m.profiles.avatar
                                          : undefined
                                      }
                                      alt={m.profiles?.full_name}
                                    />
                                  ))}
                                  {extra > 0 && (
                                    <Avatar size="sm" radius="xl">
                                      +{extra}
                                    </Avatar>
                                  )}
                                </Avatar.Group>
                              )
                            })()}
                          </Box>
                        </Flex>
                      </Card>
                    )
                  })}
                </Group>
              </Scroller>
            )}

            <Divider label="Informações básicas sobre a gig" labelPosition="left" />

            <TextInput
              label="Título"
              placeholder="Ex: Ensaio preparatório para show"
              {...formNewGig.getInputProps('title')}
            />
            <Textarea
              label="Descrição"
              placeholder="Informações sobre a gig..."
              minRows={2}
              autosize
              maxRows={5}
              {...formNewGig.getInputProps('description')}
            />
            <Group justify="flex-end" mt="xs">
              <Button
                type="submit"
                size="sm"
                leftSection={<IconSend size={15} />}
                loading={isSubmitting}
              >
                Criar gig
              </Button>
            </Group>
          </Stack>
        </form>
      </Container>
    </>
  )
}
