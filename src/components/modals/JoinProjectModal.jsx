import {
  Drawer, Stack, Center, Avatar, Text, NativeSelect,
  NumberInput, Alert, Group, Button
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
}) {
  if (!project) return null

  return (
    <Drawer
      position='right'
      title={`Ingressar em ${project.name}`}
      opened={opened}
      onClose={onClose}
    >
      <Stack gap="md">
        <Center>
          <Avatar
            size={72}
            radius="md"
            src={project.picture
              ? `https://ik.imagekit.io/mublin/projects/tr:h-150/${project.picture}`
              : undefined
            }
          />
        </Center>
        {project.description && (
          <Text size="xs" c="dimmed" ta="center">{project.description}</Text>
        )}
        <NativeSelect
          withAsterisk
          label="Sua principal função neste projeto"
          value={joinRole}
          onChange={(e) => setJoinRole(e.target.value)}
        >
          <option value="">Selecione</option>
          <optgroup label="Gestão, produção e outros">
            {rolesProjectManagement.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </optgroup>
          <optgroup label="Instrumentos">
            {rolesProjectMusicians.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </optgroup>
        </NativeSelect>
        <NumberInput
          label="Ano que ingressou"
          min={1900}
          max={currentYear}
          value={joinYear}
          onChange={setJoinYear}
        />
        <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light" p="xs">
          <Text size="xs">
            Sua participação ficará pendente até que um administrador do projeto aprove.
          </Text>
        </Alert>
        <Group justify="flex-end">
          <Button variant="default" radius="xl" onClick={onClose}>Cancelar</Button>
          <Button
            color="indigo"
            radius="xl"
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
