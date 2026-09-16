import { Stack, Avatar, Text, Badge } from '@mantine/core'

function getAvatarUrl(avatar, size = 80) {
  return avatar ? `${AVATAR_PATH}tr:h-${size},w-${size}/${avatar}` : null
}

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/users/avatars/'

const APPLICATION_STATUS = {
  1: { label: 'Pendente', color: 'orange' },
  2: { label: 'Aceito', color: 'lime' },
  3: { label: 'Declinado', color: 'red' },
}

export default function InvitationStatusColumn({
  roleLabel,
  fullName,
  avatar,
  statusId,
}) {
  const status = APPLICATION_STATUS[statusId] ?? { label: '—', color: 'gray' }

  return (
    <Stack align="center" gap={4}>
      <Avatar src={getAvatarUrl(avatar)} size={48} radius="xl">
        {fullName?.[0]}
      </Avatar>
      <Text size="xs" c="dimmed" ta="center" lh={1.1}>
        {roleLabel}
      </Text>
      <Badge size="sm" variant="light" color={status.color}>
        {status.label}
      </Badge>
    </Stack>
  )
}
