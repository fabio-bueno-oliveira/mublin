import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ScrollArea,
  Stack,
  Group,
  Box,
  Avatar,
  Text,
  TextInput,
  Button,
  UnstyledButton,
  CloseButton,
} from '@mantine/core'
import {
  IconCheckFilled,
  IconChevronRightFilled,
  IconMicrophone2,
  IconLock,
} from '@tabler/icons-react'

const PROJECT_IMAGE_PATH = 'https://ik.imagekit.io/mublin/projects/'

export default function ProjectSelector({
  loadingProjects,
  projects = [],
  selectedProject,
  onSelectProject,
}) {
  const [projectSearch, setProjectSearch] = useState('')

  const filteredProjects = projects.filter(
    (project) =>
      project.name?.toLowerCase().includes(projectSearch.trim().toLowerCase()) ||
      project.slug?.toLowerCase().includes(projectSearch.trim().toLowerCase()),
  )

  if (loadingProjects) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="md">
        Buscando seus projetos...
      </Text>
    )
  }

  if (!projects.length) {
    return (
      <Stack gap={6} align="center" justify="center">
        <Text size="sm" c="dimmed" ta="center" py="md">
          Nenhum projeto encontrado
        </Text>

        <Button
          size="xs"
          variant="outline"
          color="var(--mantine-color-text)"
          w="fit-content"
          rightSection={<IconChevronRightFilled size={14} />}
          component={Link}
          to="/new/project"
        >
          Cadastrar novo
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap="xs">
      <TextInput
        placeholder="Filtrar por nome..."
        value={projectSearch}
        onChange={(e) => setProjectSearch(e.currentTarget.value)}
        leftSection={<IconMicrophone2 size={14} />}
        rightSection={
          projectSearch ? <CloseButton onClick={() => setProjectSearch('')} /> : null
        }
      />

      <Group gap={4} wrap="nowrap" mt="xs">
        <IconLock color="gray" size={15} />
        <Text size="xs" c="dimmed">
          Exibindo projetos que sou administrador ou staff
        </Text>
      </Group>

      <ScrollArea type="hover" offsetScrollbars>
        <Group gap="sm" wrap="nowrap" px={2}>
          {filteredProjects.map((project) => {
            const isSelected = selectedProject?.id === project.id

            return (
              <UnstyledButton
                key={project.id}
                onClick={() => onSelectProject(project)}
                style={{
                  border: isSelected
                    ? '2px solid var(--mantine-color-mublinColor-5)'
                    : '1px solid var(--mantine-color-default-border)',

                  borderRadius: 'var(--mantine-radius-md)',
                  padding: 8,
                  minWidth: 120,

                  background: isSelected
                    ? 'var(--mantine-color-mublinColor-0)'
                    : 'var(--mantine-color-body)',

                  transition: 'all 150ms ease',
                }}
              >
                <Stack gap={6} align="center">
                  <Box pos="relative">
                    <Avatar
                      src={
                        project.picture
                          ? `${PROJECT_IMAGE_PATH}${project.id}/${project.picture}`
                          : null
                      }
                      size={64}
                      radius="xl"
                      style={{
                        border: isSelected
                          ? '2px solid var(--mantine-color-mublinColor-5)'
                          : undefined,
                      }}
                    />

                    {isSelected && (
                      <Box
                        pos="absolute"
                        bottom={-4}
                        right={-4}
                        bg="mublinColor"
                        style={{
                          borderRadius: '50%',
                          padding: 2,
                          lineHeight: 0,
                        }}
                      >
                        <IconCheckFilled size={16} color="white" />
                      </Box>
                    )}
                  </Box>

                  <Text
                    size="xs"
                    fw={isSelected ? 700 : 500}
                    ta="center"
                    lineClamp={2}
                    w={100}
                  >
                    {project.name}
                  </Text>

                  <Text size="10px" c="dimmed" ta="center" lineClamp={1}>
                    @{project.slug}
                  </Text>
                </Stack>
              </UnstyledButton>
            )
          })}
        </Group>
      </ScrollArea>

      {filteredProjects.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="sm">
          Nenhum projeto encontrado com esse nome.
        </Text>
      )}
    </Stack>
  )
}
