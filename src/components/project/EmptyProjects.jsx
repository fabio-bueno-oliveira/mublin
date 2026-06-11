import { IconMusicOff } from '@tabler/icons-react'
import { Paper, Stack, ThemeIcon, Text, Button } from '@mantine/core'

export default function EmptyProjects({ text, cta = false, ...props }) {
  return (
    <Paper bg="transparent" radius="md" px="xs" py={6} {...props}>
      <Stack align="center" gap={0}>
        <ThemeIcon size={50} radius="xl" variant="light" color="gray">
          <IconMusicOff color="gray" size={24} />
        </ThemeIcon>

        <Text fw={500} c="dimmed" size="xs" ta="center">
          Nenhum projeto encontrado
        </Text>

        {text && (
          <Text c="dimmed" size="xs" ta="center" maw={260}>
            {text}
          </Text>
        )}

        {cta && (
          <Button variant="transparent" size="xs" mt={4}>
            Criar projeto
          </Button>
        )}
      </Stack>
    </Paper>
  )
}
