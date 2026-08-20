import { useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import {
  fetchProjectBackstageInfo,
  fetchProjectAdminRequests,
} from '../../queries/projects'
import {
  Box,
  Group,
  Avatar,
  Text,
  Stack,
  NavLink,
  Divider,
  Badge,
  Skeleton,
} from '@mantine/core'
import {
  IconLayoutDashboard,
  IconInfoCircle,
  IconUserCheck,
  IconBriefcase,
  IconCamera,
  IconMicrophone2,
} from '@tabler/icons-react'
import { MEMBER_REQUEST_STATUS } from '../../constants/projects'
import BackstageLogo from './BackstageLogo'

const PICTURE_AVATAR_PATH = 'https://ik.imagekit.io/mublin/projects'

const SECTIONS = [
  { value: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { value: 'info', label: 'Informações', icon: IconInfoCircle },
  { value: 'picture', label: 'Foto', icon: IconCamera },
  { value: 'gigs', label: 'Gigs', icon: IconMicrophone2 },
  { value: 'requests', label: 'Solicitações de acesso', icon: IconUserCheck },
  { value: 'openings', label: 'Vagas', icon: IconBriefcase },
]

export default function BackstageSidebar() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSection = searchParams.get('section') || 'info'

  // Mesma query key usada em Backstage.jsx — o React Query compartilha o
  // cache entre os dois componentes, então isso não gera uma chamada extra
  // quando o Backstage.jsx também estiver montado.
  const { data: project, isLoading } = useQuery({
    queryKey: ['project-backstage-info', projectId],
    queryFn: () => fetchProjectBackstageInfo(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  })

  const userIsAdmin = project?.members?.some(
    (m) =>
      m.profile_id === user?.id &&
      m.is_admin &&
      m.status === MEMBER_REQUEST_STATUS.ACCEPTED,
  )

  const { data: pendingAdminRequests = [] } = useQuery({
    queryKey: ['project-admin-requests', projectId],
    queryFn: () => fetchProjectAdminRequests(projectId),
    enabled: !!projectId && !!userIsAdmin,
    staleTime: 1000 * 30,
  })

  const handleSectionChange = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('section', value)
      return next
    })
  }

  return (
    <Box p="md" h="100%" pt="xl">
      <Box mb="lg">
        <BackstageLogo />
      </Box>
      {isLoading ? (
        <Group gap="sm" mb="lg" wrap="nowrap">
          <Skeleton height={40} circle />
          <Box style={{ flex: 1 }}>
            <Skeleton height={14} width="70%" mb={6} />
            <Skeleton height={10} width="40%" />
          </Box>
        </Group>
      ) : (
        <Group gap="sm" mb="lg" wrap="nowrap">
          <Avatar
            size={40}
            radius="md"
            src={
              project?.picture
                ? `${PICTURE_AVATAR_PATH}/${project.id}/tr:h-80,w-80,c-maintain_ratio/${project.picture}`
                : undefined
            }
          />
          <Box style={{ minWidth: 0 }}>
            <Text size="sm" fw={600} lineClamp={1}>
              {project?.name}
            </Text>
            <Text size="xs" c="dimmed">
              Backstage
            </Text>
          </Box>
        </Group>
      )}

      <Stack gap={2}>
        {SECTIONS.map((section) => (
          <NavLink
            key={section.value}
            label={section.label}
            leftSection={<section.icon size={18} />}
            rightSection={
              section.value === 'requests' && pendingAdminRequests.length > 0 ? (
                <Badge size="sm" variant="filled" color="mublinColor" circle>
                  {pendingAdminRequests.length}
                </Badge>
              ) : undefined
            }
            active={activeSection === section.value}
            onClick={() => handleSectionChange(section.value)}
            variant="filled"
            color="mublinColor"
            style={{ borderRadius: 8 }}
          />
        ))}
      </Stack>

      <Divider my="md" />

      <Text size="xs" c="dimmed" px="xs">
        Mais seções em breve: métricas, mídia, gigs.
      </Text>
    </Box>
  )
}
