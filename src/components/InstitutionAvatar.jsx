import { Avatar } from '@mantine/core'
import {
  IconBuildingBank,
  IconMusic,
  IconSchool,
  IconDeviceLaptop,
  IconBuilding,
} from '@tabler/icons-react'

const INSTITUTIONS_PATH =
  'https://ik.imagekit.io/mublin/institutions/tr:h-200,w-200,c-maintain_ratio/'

const FALLBACK_BY_TYPE = {
  university: { icon: IconBuildingBank, color: 'violet' },
  conservatory: { icon: IconMusic, color: 'red' },
  music_school: { icon: IconSchool, color: 'blue' },
  online_platform: { icon: IconDeviceLaptop, color: 'teal' },
  other: { icon: IconBuilding, color: 'gray' },
}

export default function InstitutionAvatar({ institution, size = 100, radius = 'xl' }) {
  const fallback = FALLBACK_BY_TYPE[institution?.type] || FALLBACK_BY_TYPE.other
  const FallbackIcon = fallback.icon

  return (
    <Avatar
      size={size}
      radius={radius}
      src={institution?.logo ? INSTITUTIONS_PATH + institution.logo : undefined}
      title={institution?.name}
      alt={institution?.name}
      color={fallback.color}
      variant="light"
    >
      <FallbackIcon size={size * 0.45} stroke={1.6} />
    </Avatar>
  )
}
