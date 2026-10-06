import {
  IconHome,
  IconRss,
  IconMusicPlus,
  IconMicrophone2,
  IconMusic,
  IconPlaylist,
} from '@tabler/icons-react'

export const NAV_ITEMS = [
  { label: 'Home', icon: IconHome, path: '/home' },
  // { label: 'Scenes', icon: IconMovie, path: '/scenes' },
  { label: 'Projetos', icon: IconMusic, path: '/projects' },
  { label: 'Feed', icon: IconRss, path: '/feed' },
  // { label: 'Descobrir', icon: IconGps, path: '/search' },
]

export const QUICK_ACTIONS = [
  { label: 'Nova Gig', icon: IconMicrophone2, path: '/new/gig' },
  { label: 'Novo Projeto', icon: IconMusic, path: '/new/project' },
  { label: 'Nova Setlist', icon: IconPlaylist, path: '/setlists' },
  // { label: 'Nova Música', icon: IconMusicPlus, path: '/new/song' },
  // { label: 'Novo Evento', icon: IconCalendarPlus, path: '/new/event' },
  // { label: 'Novo Equipamento', icon: IconCubePlus, path: '/new/gear' },
  // { label: 'Novo Post', icon: IconPencilPlus, path: '/new/post' },
  // { label: 'Nova Scene', icon: IconMovie, path: '/new/scene' },
]
