import { Link } from 'react-router-dom'
import { Skeleton, Flex, Group, Stack, Box, Avatar, Text } from '@mantine/core'
// import ProPlanBadge from './ProPlanBadge'
import { IconRosetteDiscountCheck } from '@tabler/icons-react'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function SimilarProfiles({ profiles = [], loading }) {
  return (
    <>
      {loading ? (
        <Stack gap="sm">
          {[1, 2, 3].map((i) => (
            <Flex key={i} gap="xs" w="100%" wrap="nowrap" align="center">
              <Box>
                <Skeleton circle height={40} />
              </Box>
              <Stack gap={4} style={{ flexGrow: 1 }} maw="80%">
                <Skeleton height={14} width="40%" radius="xl" />
                <Skeleton height={10} width="60%" radius="xl" />
                <Skeleton height={8} width="74%" radius="xl" />
              </Stack>
            </Flex>
          ))}
        </Stack>
      ) : profiles.length === 0 ? (
        <Text size="sm" c="dimmed">
          Nenhum perfil similar encontrado.
        </Text>
      ) : (
        <Stack gap="sm">
          {profiles.map((p) => (
            <Flex
              key={p.id}
              gap="xs"
              component={Link}
              to={`/${p.username}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
              w="100%"
              wrap="nowrap"
              align="center"
            >
              <Box>
                <Avatar
                  size={40}
                  radius="xl"
                  src={p.avatar ? AVATAR_PATH + p.avatar : undefined}
                />
              </Box>
              <Stack gap={0} style={{ flexGrow: 1 }} maw="80%">
                <Group gap={3} align="center" wrap="nowrap">
                  <Text size="15px" fw={500} lineClamp={1} truncate="end">
                    {p.full_name}
                  </Text>
                  {!!p.is_verified && (
                    <IconRosetteDiscountCheck
                      className="iconVerified"
                      size={14}
                      title="Perfil verificado"
                    />
                  )}
                  {/* {p.plan === 'Pro' && <ProPlanBadge small />} */}
                </Group>
                {p.title && (
                  <Text size="14px" lineClamp={1} title={p.title}>
                    {p.title}
                  </Text>
                )}
                {p.roles.length > 0 && (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {p.roles?.map((role, index) => (
                      <Text span key={role.id}>
                        {role.name_ptbr}
                        {index < p.roles.length - 1 ? ', ' : ''}
                      </Text>
                    ))}
                  </Text>
                )}
              </Stack>
            </Flex>
          ))}
        </Stack>
      )}
    </>
  )
}
