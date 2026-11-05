import {
  Avatar,
  Badge,
  Group,
  Skeleton,
  Stack,
  Title,
  Text,
  Tooltip,
} from '@mantine/core'

const isEnded = (project) => Boolean(project?.end_year)

/* ─────────────────────────────────────────────────────────────
 * Pessoas associadas ao projeto
 *    people: retorno de fetchPublicProjectPeople (tabela portfolio)
 *    [{ id, is_currently_working,
 *       profile: { id, full_name, username, avatar },
 *       roles: [{ role: { id, name_ptbr } }] }]
 * ───────────────────────────────────────────────────────────── */

const PERSON_AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-70,w-70,c-maintain_ratio/users/avatars/'

const getPersonAvatarUrl = (avatar) => {
  if (!avatar) return null
  return avatar.startsWith('http') ? avatar : `${PERSON_AVATAR_PATH}${avatar}`
}

// A mesma pessoa pode ter mais de um registro no portfolio do projeto
// (períodos ou funções diferentes). Aqui agrupamos por perfil e juntamos as funções.
export function groupPeople(people = []) {
  const byProfile = new Map()

  for (const item of people ?? []) {
    const profile = item?.profile
    if (!profile?.id) continue // perfil oculto ou removido

    const entry = byProfile.get(profile.id) ?? { profile, roles: [], isCurrent: false }
    entry.isCurrent = entry.isCurrent || Boolean(item.is_currently_working)

    for (const r of item.roles ?? []) {
      const name = r?.role?.name_ptbr
      if (name && !entry.roles.includes(name)) entry.roles.push(name)
    }
    byProfile.set(profile.id, entry)
  }

  return [...byProfile.values()]
}

export default function ProjectPeopleTeaserBlock({
  project,
  people = [],
  isLoading = false,
}) {
  const ended = isEnded(project)

  if (isLoading) {
    return (
      <Stack gap="xs" mt="sm" px="xs">
        <Skeleton height={12} width={140} />
        <Group gap="sm" wrap="nowrap">
          <Skeleton circle height={40} width={40} />
          <Skeleton height={14} width={180} />
        </Group>
      </Stack>
    )
  }

  const members = groupPeople(people)
  if (!members.length) return null

  const total = members.length
  const isSmall = total <= 3

  // Funções mais comuns (só usado quando há muita gente)
  const roleCounts = new Map()
  members.forEach((m) =>
    m.roles.forEach((role) => roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1)),
  )
  const topRoles = [...roleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

  const shown = members.slice(0, 5)
  const extra = total - shown.length

  return (
    <Stack gap="xs" mt="sm" px="xs">
      <Title fw={400} size="sm" c="dimmed">
        Pessoas associadas
      </Title>

      {isSmall ? (
        <Stack gap="xs">
          {members.map(({ profile, roles }) => (
            <Group key={profile.id} gap="xs" wrap="nowrap">
              <Avatar
                src={getPersonAvatarUrl(profile.avatar)}
                size={35}
                alt={`Foto de ${profile.full_name}`}
              />
              <Stack gap={0} style={{ minWidth: 0 }}>
                <Text size="sm" fw={500} lineClamp={1}>
                  {profile.full_name}
                </Text>
                {roles.length > 0 && (
                  <Text size="11px" c="dimmed" lineClamp={1}>
                    {roles.join(', ')}
                  </Text>
                )}
              </Stack>
            </Group>
          ))}
        </Stack>
      ) : (
        <>
          <Group gap="sm" wrap="nowrap">
            <Avatar.Group spacing="sm">
              {shown.map(({ profile }) => (
                <Tooltip key={profile.id} label={profile.full_name} withArrow>
                  <Avatar
                    src={getPersonAvatarUrl(profile.avatar)}
                    size={35}
                    alt={`Foto de ${profile.full_name}`}
                  />
                </Tooltip>
              ))}
              {extra > 0 && (
                <Avatar size={40} variant="light">
                  +{extra}
                </Avatar>
              )}
            </Avatar.Group>
            <Text size="sm" lh={1.3}>
              {total} músicos e staff {ended ? 'fizeram parte' : 'já passaram por aqui'}
            </Text>
          </Group>

          {topRoles.length > 0 && (
            <Group gap={6}>
              {topRoles.map(([role, count]) => (
                <Badge key={role} variant="default" fw={500} tt="none">
                  {role}
                  {count > 1 && (
                    <Text span c="dimmed" inherit>
                      {' '}
                      × {count}
                    </Text>
                  )}
                </Badge>
              ))}
            </Group>
          )}
        </>
      )}
    </Stack>
  )
}
