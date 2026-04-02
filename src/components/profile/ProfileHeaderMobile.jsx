import {
  Flex, Box, Title, Text, Button,
  Indicator, Avatar, Badge, Pill, Scroller, Group, Anchor
} from '@mantine/core'
import { Link } from 'react-router-dom'
import { 
  IconRosetteDiscountCheckFilled,
  IconLink,
  IconShieldCheckFilled
} from '@tabler/icons-react'
import { truncateString } from '../../utils/formatter'
import { SOCIAL_CONFIG } from '../../constants/socialConfig'

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

export default function ProfileHeaderMobile({ profile, roles, city, regionUf, user }) {
  return (
    <Box px='0' py='0'>
      <Flex
        justify='flex-start'
        align="flex-start"
        direction='row'
        wrap='nowrap'
        columnGap='xs'
      >
        <Indicator 
          position='bottom-center' 
          inline 
          label={<Text size='0.7rem' >Disponível</Text>} 
          color='lime' 
          size={18} 
          withBorder 
          disabled={!profile.is_open_to_work}
        >
          <Avatar
            size='xl'
            src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
          />
        </Indicator>
        <Box style={{overflow:'hidden'}}>
          <Flex align="center" gap={2} mb={2}>
            <Title order={1} size="22px" lts='-0.02em' lh='1'>
              {profile.full_name}
            </Title>
            {!!profile.is_verified && 
              <IconRosetteDiscountCheckFilled 
                className='iconVerified'
                title='Perfil verificado'
              />
            }
            {!!profile.is_legend && 
              <IconShieldCheckFilled
                className='iconLegend'
                title='Lenda da Música'
              />
            }
            {profile.plan === 'Pro' && 
              <Badge
                title='Usuário PRO'
                radius='sm'
                size='xs'
                variant="light"
                color="gray"
              >
                PRO
              </Badge>
            }
          </Flex>
          <Text 
            fz="sm" 
            lh={1.3}
            mb={2}
            lineClamp={2}
          >
            {profile.title}
          </Text>
          <Flex align="center" gap={4} opacity={0.6}>
            <Text size="sm">
              @{profile.username}
            </Text>
            {(city || regionUf) && (
              <Text size="sm">
                · {[city, regionUf]
                  .filter(Boolean)
                  .join('/')}
              </Text>
            )}
          </Flex>
          {roles && roles.length > 0 && (
            <Scroller>
              <Group gap={4} wrap="nowrap" style={{ width: "max-content" }}>
                {roles.map(({ id, main_activity, roles: role }) => (
                  <Pill 
                    key={id} 
                    fw='500' 
                    size="sm"
                    radius="sm"
                  >
                    {role?.name_ptbr}
                    {main_activity ? ' ★' : ''}
                  </Pill>
                ))}
              </Group>
            </Scroller>
          )}
        </Box>
      </Flex>
      {profile.website && 
        <Anchor 
          href={profile.website} 
          target='_blank'
          underline='hover'
          mt={4}
          mb={8}
          rel='noopener noreferrer'
        >
          <Flex gap={2} align='center'>
            <IconLink size={13} />
            <Text size='0.91em' className='lhNormal'>
              {truncateString(profile.website, 37)}
            </Text>
          </Flex>
        </Anchor>
      }
      {user?.id === profile.id && (
        <Button
          component={Link}
          to="/settings/profile"
          size="compact-sm"
          variant="default"
          mt={10}
          fullWidth
        >
          Editar meu perfil
        </Button>
      )}
    </Box>
  )
}