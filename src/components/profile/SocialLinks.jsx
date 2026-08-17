import { Stack, Group, Text } from '@mantine/core'
import { SOCIAL_CONFIG } from '../../constants/socialConfig'

export default function SocialLinks({ profile, loading }) {
  return (
    <>
      {loading ? (
        <Text size="sm" color="dimmed">
          Carregando...
        </Text>
      ) : (
        <>
          {profile?.profile_social_links?.length > 0 ? (
            <Group gap={10} wrap="wrap">
              {profile?.profile_social_links?.map((link) => {
                const config = SOCIAL_CONFIG[link.platform]
                if (!config) {
                  return null
                }
                const Icon = config.icon
                const href = `${config.base}${link.handle}`
                return (
                  <Group
                    key={link?.platform}
                    gap="xs"
                    component="a"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    pl={6}
                  >
                    <Icon color="var(--mantine-color-text)" stroke={1.5} size={25} />
                    <Stack pl={6} gap={2} w={180}>
                      <Text size="sm" fw={600} tt="capitalize">
                        {link?.platform}
                      </Text>
                      <Text size="xs" truncate="end" c="dimmed">
                        {href.replace(/^https?:\/\//, '')}
                      </Text>
                    </Stack>
                  </Group>
                )
              })}
            </Group>
          ) : (
            <Text size="sm" c="dimmed">
              Nenhuma rede informada
            </Text>
          )}
        </>
      )}
    </>
  )
}
