import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchUserProjects } from '../queries/user'
import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import {
  useComputedColorScheme,
  Flex,
  Group,
  Indicator,
  Image,
  Combobox,
  useCombobox,
  Avatar,
  Text,
  InputBase,
  ScrollArea,
} from '@mantine/core'
import { IconCheck } from '@tabler/icons-react'

const PROJECT_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects/'

const ProjectOption = ({ project, active = false }) => (
  <Combobox.Option value={project.slug} key={project.id} active={active}>
    <Group gap={10}>
      {active && <IconCheck size={12} />}
      <Indicator
        size={10}
        color={project.activity_status_color}
        disabled={!project.activity_status_color}
        inline
        withBorder
        offset={2}
      >
        <Avatar
          src={
            project.picture
              ? `${PROJECT_AVATAR_PATH}${project.id}/tr:h-52,w-52,c-maintain_ratio/${project.picture}`
              : undefined
          }
          size="sm"
          radius="xl"
        />
      </Indicator>
      <div>
        <Text size="sm" fw={500} truncate="end" w={96}>
          {project.name}
        </Text>
        <Text size="xs" opacity={0.5} truncate="end" w={96}>
          {project.type}
        </Text>
      </div>
    </Group>
  </Combobox.Option>
)

export default function AppNavbarMobile() {
  const navigate = useNavigate()
  const combobox = useCombobox()
  const { user } = useAuth()
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

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
    request_status: p.status,
    activity_status: p.projects.activity_status,
    activity_status_name: p.projects.project_statuses?.description_ptbr,
    activity_status_color: p.projects.project_statuses?.color,
    main_role: p.roles.name_ptbr,
    genre: p.projects.genres?.name,
    type: p.projects.project_types?.name_ptbr,
    totalMembers: p.projects.project_members?.length || 0,
  }))

  const [selectedProjectSlug, setSelectedProjectSlug] = useState('')
  const selectedProject = userProjects.find(
    (p) => p.slug === selectedProjectSlug,
  )

  const projectsByStatus = {
    accepted: userProjects?.filter((p) => p.request_status === 2) || [],
    pending: userProjects?.filter((p) => p.request_status === 1) || [],
    declined: userProjects?.filter((p) => p.request_status === 3) || [],
  }

  return (
    <Flex
      gap="xs"
      align="center"
      justify="space-between"
      my="sm"
      mb="sm"
      hiddenFrom="sm"
      px={{ base: '0.8rem', sm: 0 }}
    >
      <Image
        src={isDark ? MublinLogoWhite : MublinLogoBlack}
        h={24}
        w="auto"
        fit="contain"
      />

      <Combobox
        w={230}
        store={combobox}
        onOptionSubmit={(val) => {
          setSelectedProjectSlug(val)
          combobox.closeDropdown()
          navigate(`/project/${val}`)
        }}
      >
        <Combobox.Target>
          <InputBase
            mt={6}
            component="button"
            variant="unstyled"
            type="button"
            pointer
            size="md"
            disabled={loadingProjects}
            rightSection={<Combobox.Chevron />}
            rightSectionPointerEvents="none"
            onClick={() => combobox.toggleDropdown()}
          >
            {loadingProjects ? (
              'Carregando projetos...'
            ) : selectedProject ? (
              <Group gap="xs">
                <Avatar
                  src={
                    selectedProject.picture
                      ? `${PROJECT_AVATAR_PATH}${selectedProject.id}/tr:h-40,w-40,c-maintain_ratio/${selectedProject.picture}`
                      : undefined
                  }
                  size={20}
                  radius="xl"
                />
                <Text size="md" fw={500} truncate>
                  {selectedProject.name}
                </Text>
              </Group>
            ) : (
              'Selecionar projeto'
            )}
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options>
            <ScrollArea.Autosize mah={300} type="scroll" scrollHideDelay={0}>
              {projectsByStatus.accepted.length === 0 && (
                <Combobox.Option value="" disabled>
                  <Text size="sm" fw={500}>
                    Nenhum projeto associado
                  </Text>
                </Combobox.Option>
              )}

              {projectsByStatus.accepted.length > 0 && (
                <>
                  {projectsByStatus.accepted.map((project) => (
                    <ProjectOption
                      key={project.id}
                      project={project}
                      active={
                        String(project.slug) === String(selectedProjectSlug)
                      }
                    />
                  ))}
                </>
              )}

              {projectsByStatus.pending.length > 0 && (
                <Combobox.Group label="Pendentes de aprovação">
                  {projectsByStatus.pending.map((project) => (
                    <ProjectOption
                      key={project.id}
                      project={project}
                      active={
                        String(project.slug) === String(selectedProjectSlug)
                      }
                    />
                  ))}
                </Combobox.Group>
              )}
            </ScrollArea.Autosize>
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </Flex>
  )
}
