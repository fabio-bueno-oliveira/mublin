import { Link } from 'react-router-dom'
import { Image } from '@mantine/core'
import MublinMLogo from '../assets/svg/m-pro-silver-black.svg'

const silverFilter = 'sepia(1) saturate(0) hue-rotate(5deg) brightness(0.9)'

export default function ProPlanBadge({ small = false, marginLeft = 0 }) {
  return (
    <Link to="/pro">
      <Image
        src={MublinMLogo}
        h={small ? 14 : 20}
        ml={marginLeft}
        w="auto"
        fit="contain"
        title="Usuário Mublin Pro"
        style={{ filter: silverFilter }}
      />
    </Link>
  )
}
