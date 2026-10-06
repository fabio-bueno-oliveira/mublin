import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Badge, Tooltip } from '@mantine/core'
// import { IconRosetteDiscountCheckFilled } from '@tabler/icons-react'
import { fetchProjectProfile } from '../queries/projects'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-48,c-maintain_ratio/users/avatars/'

/**
 * Badge com o avatar do perfil pessoal ligado ao projeto (projects.profile_id).
 * Estilizado para o Hero da página de projeto (fundo escuro com overlay).
 * Não renderiza nada enquanto carrega, quando não há vínculo ou se a busca falhar,
 * para não deixar buraco nem skeleton no meio do Hero.
 *
 * @param {number} props.projectId  id do projeto atual
 */
export default function ProjectProfileBadge({ projectId }) {
  const { data: profile } = useQuery({
    queryKey: ['project-profile', projectId],
    queryFn: () => fetchProjectProfile(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 10,
  })

  if (!profile?.username) {
    return null
  }

  return (
    <Tooltip label={`Ver perfil de ${profile.full_name} no Mublin`} withArrow>
      <Badge
        component={Link}
        radius="xl"
        to={`/${profile.username}`}
        size="md"
        variant="light"
        color="rgba(255,255,255,.76)"
        tt="none"
        fw={500}
        leftSection={
          <Avatar
            src={profile.avatar ? `${AVATAR_PATH}${profile.avatar}` : undefined}
            name={profile.full_name}
            color="initials"
            alt={profile.full_name}
            size={20}
            radius="xl"
          />
        }
        // rightSection={
        //   profile.is_verified ? (
        //     <IconRosetteDiscountCheckFilled size={14} color="white" />
        //   ) : undefined
        // }
        styles={{
          root: { paddingLeft: 3, paddingRight: 8, cursor: 'pointer' },
        }}
      >
        @{profile.username}
      </Badge>
    </Tooltip>
  )
}
