import {
  Flex,
  Box,
  Title,
  Text,
  Avatar,
  Group,
  Anchor,
  Stack,
  ThemeIcon,
} from '@mantine/core'
import { IconLink, IconRosetteDiscountCheckFilled } from '@tabler/icons-react'
import { isProfileLive } from '../../utils/live'
import { truncateString } from '../../utils/formatter'
import { getAvatarUrl } from '../../utils/profile'
import { openImagePreviewModal } from '../../utils/openImagePreviewModal'
// import ProPlanBadge from '../ProPlanBadge'

export default function ProfileHeaderMobile({
  profile,
  city,
  region,
  country,
  links = [],
  onOpenLinks,
  mt = 0,
}) {
  return (
    <Box px="sm" py={0} mt={mt}>
      <Avatar
        mt={0}
        mb="md"
        size={84}
        src={getAvatarUrl(profile.avatar, profile.is_open_to_work, 168)}
        style={{ cursor: profile.avatar ? 'pointer' : 'default' }}
        onClick={() =>
          profile.avatar &&
          openImagePreviewModal(
            getAvatarUrl(profile.avatar, profile.is_open_to_work, 600),
            profile.full_name,
            { circular: true },
          )
        }
      />
      <Stack gap={2} style={{ overflow: 'hidden' }}>
        <Flex align="center" gap={3} mb={2} wrap="wrap">
          <Title order={1} fw={600} fz="h2" lh="1" component={Text} lineClamp={2}>
            {profile.full_name}
          </Title>
          {!!profile.is_verified && (
            <IconRosetteDiscountCheckFilled
              className="iconVerified"
              title="Perfil verificado"
            />
          )}
          {profile.is_fake_profile && (
            <ThemeIcon
              variant="gradient"
              gradient={{
                from: 'grape.8',
                to: 'mublinColor.8',
                deg: 55,
              }}
              size="md"
              fz={12}
              ml={4}
            >
              IA
            </ThemeIcon>
          )}
        </Flex>
        <Text fz="15px" lh={1.3} mt={2} lineClamp={2}>
          {profile.title}
        </Text>
        {(city || region) && (
          <Text size="sm" fw={300} opacity={0.8}>
            {[city, region, country].filter(Boolean).join(', ')}
          </Text>
        )}
        {links.length > 0 && (
          <Anchor
            component="button"
            type="button"
            onClick={onOpenLinks}
            underline="never"
            mt={4}
            mb={8}
            c="var(--mantine-color-text)"
          >
            <Flex gap={4} align="center">
              <IconLink size={13} style={{ flexShrink: 0 }} />
              <Text size="0.91em" className="lhNormal">
                {truncateString(links[0].label, 30)}
                {links.length > 1 && ` +${links.length - 1} links`}
              </Text>
            </Flex>
          </Anchor>
        )}
        {isProfileLive(profile) && (
          <Group gap={6} mt={3} align="center" wrap="nowrap">
            <Box component="span" className="live-dot" style={{ flexShrink: 0 }} />
            <Text size="11px" fw={600} c="red.7" tt="uppercase" lts="0.02em">
              Ao vivo em {profile.live_platform}
            </Text>
          </Group>
        )}
      </Stack>
    </Box>
  )
}
