import {
  IconHome,
  IconRss,
  IconCubePlus,
  IconBulb,
  IconPencilPlus,
  IconCalendarPlus,
  IconCalendar,
  IconMusicPlus,
  IconMicrophone2,
  IconMusic,
  IconMovie,
} from '@tabler/icons-react'

export const NAV_ITEMS = [
  { label: 'Home', icon: IconHome, path: '/home' },
  { label: 'Feed', icon: IconRss, path: '/feed' },
  { label: 'Cenas', icon: IconMovie, path: '/scenes' },
  { label: 'Projetos', icon: IconMusic, path: '/projects' },
  { label: 'Gigs', icon: IconCalendar, path: '/gigs' },
]

export const QUICK_ACTIONS = [
  { label: 'Novo Post', icon: IconPencilPlus, path: '/new/post' },
  { label: 'Nova Scene', icon: IconMovie, path: '/new/scene' },
  { label: 'Nova Gig', icon: IconMicrophone2, path: '/new/gig' },
  { label: 'Novo Projeto', icon: IconBulb, path: '/new/project' },
  { label: 'Novo Música', icon: IconMusicPlus, path: '/new/song' },
  { label: 'Novo Evento', icon: IconCalendarPlus, path: '/new/event' },
  { label: 'Novo Equipamento', icon: IconCubePlus, path: '/new/gear' },
]
