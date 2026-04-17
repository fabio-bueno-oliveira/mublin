import {
  IconHome2, IconPlus, IconCubePlus,
  IconBulb, IconPencilPlus, IconCalendarPlus,
} from '@tabler/icons-react'

export const NAV_ITEMS = [
  { label: 'Home', icon: IconHome2, path: '/home' },
]

export const NAV_ITEMS_CREATE = [
  { label: 'Novo Post',        icon: IconPencilPlus,  path: '/new/post' },
  { label: 'Novo Evento',      icon: IconCalendarPlus, path: '/new/event' },
  { label: 'Novo Projeto',     icon: IconBulb,         path: '/new/project' },
  { label: 'Novo Equipamento', icon: IconCubePlus,     path: '/new/gear' },
]

export const QUICK_ACTIONS = [
  { label: 'Novo Post', icon: IconPencilPlus, path: '/new/post' },
  { label: 'Novo Evento', icon: IconCalendarPlus, path: '/new/event' },
  { label: 'Novo Projeto', icon: IconBulb, path: '/new/project' },
  { label: 'Novo Equipamento', icon: IconCubePlus, path: '/new/gear' },
]
