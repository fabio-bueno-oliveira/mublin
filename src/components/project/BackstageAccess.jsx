import { Group, Stack, Card, Text, Avatar, Button } from '@mantine/core'
import { IconArrowUpRight } from '@tabler/icons-react'
import { IconBackstageMirrorFilled } from '../icons/IconBackstageMirror'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-50,c-maintain_ratio/users/avatars/'

export default function BackstageAccess({
  profile,
  projectId,
  userIsAdmin,
  userIsStaff,
}) {
  return (
    <Card withBorder radius="lg" px="lg">
      <Stack gap={8}>
        <Group align="flex-start" gap="lg" wrap="nowrap">
          <Text flex={1} fw={500} size="md" lh={1.3}>
            Você tem acesso ao Backstage deste projeto
          </Text>
          <Group gap={6}>
            <Avatar size={25} src={`${AVATAR_PATH}${profile?.avatar}`} />
            <IconBackstageMirrorFilled size={30} />
          </Group>
        </Group>
        <Text size="xs" c="dimmed">
          O Backstage é onde você gerencia todos os dados e atualizações
        </Text>
        {/* <Group gap={6} mt={4} mb={8}>
          <Avatar size={25} src={`${AVATAR_PATH}${profile?.avatar}`} />
          <Stack gap={2}>
            <Text size="sm" lh={1}>
              {profile?.full_name}
            </Text>
            <Text size="xs" c="dimmed" lh={1}>
              {userIsAdmin ? 'Administrador' : userIsStaff && 'Staff'}
            </Text>
          </Stack>
        </Group> */}
        <Button
          component="a"
          href={`/backstage/${projectId}`}
          size="sm"
          color="mublinColor"
          rightSection={<IconArrowUpRight size={14} />}
        >
          Acessar Backstage
        </Button>
      </Stack>
    </Card>
  )
}
