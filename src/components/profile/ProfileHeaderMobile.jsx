import { Link } from 'react-router-dom'
import {
  useMantineColorScheme,
  Flex,
  Box,
  Title,
  Text,
  Button,
  Indicator,
  Avatar,
  Group,
  Anchor,
} from '@mantine/core'
import {
  IconRosetteDiscountCheckFilled,
  IconLink,
  IconShieldCheckFilled,
} from '@tabler/icons-react'
import { isProfileLive } from '../../utils/live'
import { truncateString } from '../../utils/formatter'
// import ProPlanBadge from '../ProPlanBadge'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function ProfileHeaderMobile({ profile, city, regionUf, user }) {
  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <Box px="sm" py={0}>
      <Flex
        justify="flex-start"
        align="center"
        direction="row"
        wrap="nowrap"
        columnGap="xs"
      >
        <Indicator
          position="bottom-center"
          inline
          label={<Text size="0.7rem">Disponível</Text>}
          color="green"
          size={18}
          withBorder
          disabled
        >
          <Avatar
            size="xl"
            src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
          />
        </Indicator>
        <Box style={{ overflow: 'hidden' }}>
          <Flex align="center" gap={3} mb={2} wrap="wrap">
            <Title order={1} fw={600} size="21px" lh="1" component={Text} lineClamp={2}>
              {profile.full_name}
            </Title>
            {!!profile.is_verified && (
              <IconRosetteDiscountCheckFilled
                className="iconVerified"
                title="Perfil verificado"
                color="var(--mantine-color-mublinColor-3)"
              />
            )}
            {!!profile.is_legend && (
              <IconShieldCheckFilled
                className="iconLegend"
                title="Lenda da Música"
                // color="var(--mantine-color-violet-4)"
              />
            )}
            {/* {profile?.plan === 'Pro' && <ProPlanBadge />} */}
          </Flex>
          <Flex align="center" gap={4} opacity={0.6}>
            <Text size="md">@{profile.username}</Text>
            {(city || regionUf) && (
              <Text size="sm">· {[city, regionUf].filter(Boolean).join('/')}</Text>
            )}
          </Flex>
          <Text fz="sm" lh={1.3} mt={2} lineClamp={2}>
            {profile.title}
          </Text>
          {isProfileLive(profile) && (
            <Group gap={6} mt={3} align="center" wrap="nowrap">
              <Box component="span" className="live-dot" style={{ flexShrink: 0 }} />
              <Text size="11px" fw={600} c="red.7" tt="uppercase" lts="0.02em">
                Ao vivo em {profile.live_platform}
              </Text>
            </Group>
          )}
        </Box>
      </Flex>
      {profile.website && (
        <Anchor
          href={profile.website}
          target="_blank"
          underline="hover"
          mt={4}
          mb={8}
          rel="noopener noreferrer"
        >
          <Flex gap={2} align="center">
            <IconLink size={13} />
            <Text size="0.91em" className="lhNormal">
              {truncateString(profile.website, 37)}
            </Text>
          </Flex>
        </Anchor>
      )}

      {user?.id === profile.id && (
        <Button
          mt="md"
          component={Link}
          to="/settings/profile"
          size="sm"
          radius="md"
          variant="filled"
          className="defaultMublinButton"
          fullWidth
        >
          Editar meu perfil
        </Button>
      )}
    </Box>
  )
}
