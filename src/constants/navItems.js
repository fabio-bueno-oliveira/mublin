import {
  IconHome2Filled,
  IconCubePlus,
  IconBulb,
  IconPencilPlus,
  IconCalendarPlus,
  IconMusicPlus,
  IconMicrophone2,
} from '@tabler/icons-react'

export const NAV_ITEMS = [
  { label: 'Home', icon: IconHome2Filled, path: '/home' },
]

export const QUICK_ACTIONS = [
  { label: 'Novo Post', icon: IconPencilPlus, path: '/new/post' },
  { label: 'Novo Evento', icon: IconCalendarPlus, path: '/new/event' },
  { label: 'Nova Gig', icon: IconMicrophone2, path: '/new/event' },
  { label: 'Novo Projeto', icon: IconBulb, path: '/new/project' },
  { label: 'Novo Equipamento', icon: IconCubePlus, path: '/new/gear' },
  { label: 'Novo Música', icon: IconMusicPlus, path: '/new/song' },
]
