import { useEffect } from 'react'
import {
  Drawer,
  Stack,
  Center,
  Avatar,
  Text,
  NativeSelect,
  NumberInput,
  Alert,
  Group,
  Button,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

export default function JoinProjectModal({
  opened,
  onClose,
  project,
  rolesProjectManagement,
  rolesProjectMusicians,
  joinRole,
  setJoinRole,
  joinYear,
  setJoinYear,
  onConfirm,
  loading,
  currentYear,
  projectEndYear,
  projectFoundationYear,
}) {
  useEffect(() => {
    if (opened && projectEndYear && joinYear > projectEndYear) {
      setJoinYear(projectEndYear)
    }
    if (opened && projectFoundationYear && joinYear < projectFoundationYear) {
      setJoinYear(projectFoundationYear)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, projectEndYear, projectFoundationYear])

  if (!project) {
    return null
  }

  return (
    <Drawer
      position="right"
      title={`Me associar a ${project.name}`}
      opened={opened}
      onClose={onClose}
    >
      <Stack gap="sm" mt="sm">
        <Center>
          <Avatar
            size={70}
            radius="md"
            src={
              project.picture
                ? `https://ik.imagekit.io/mublin/projects/${project.id}/tr:h-140,w-140,c-maintain_ratio/${project.picture}`
                : undefined
            }
          />
        </Center>
        {project.description && (
          <Text size="xs" c="dimmed" ta="center">
            {project.description}
          </Text>
        )}
        <NativeSelect
          withAsterisk
          label="Sua principal função neste projeto"
          value={joinRole}
          onChange={(e) => setJoinRole(e.target.value)}
        >
          <option value="">Selecione</option>
          <optgroup label="Gestão, produção e outros">
            {rolesProjectManagement.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Instrumentos">
            {rolesProjectMusicians.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </optgroup>
        </NativeSelect>
        <NumberInput
          label="Ano que ingressou"
          min={projectFoundationYear ?? 1900}
          max={projectEndYear ?? currentYear}
          value={joinYear}
          onChange={setJoinYear}
        />
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light" p="xs">
          <Text size="xs">
            Sua participação ficará pendente até que um administrador do projeto aprove.
          </Text>
        </Alert>
        <Group justify="flex-end">
          <Button variant="default" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            color="mublinColor"
            size="sm"
            loading={loading}
            disabled={!joinRole || !joinYear}
            onClick={onConfirm}
          >
            Solicitar aprovação
          </Button>
        </Group>
      </Stack>
    </Drawer>
  )
}
