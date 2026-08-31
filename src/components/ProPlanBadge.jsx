import { Link } from 'react-router-dom'
import { Image } from '@mantine/core'
import MublinMLogo from '../assets/svg/m-pro-gold.svg'

export default function ProPlanBadge({
  small = false,
  marginLeft = 0,
  mr = 0,
  mt = 0,
  mb = 0,
}) {
  return (
    <Link to="/pro" style={{ display: 'inline-flex' }}>
      <Image
        src={MublinMLogo}
        h={small ? 14 : 20}
        mt={mt}
        mb={mb}
        ml={marginLeft}
        mr={mr}
        w="auto"
        fit="contain"
        title="Usuário Mublin Pro"
        style={{
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.08))',
        }}
      />
    </Link>
  )
}
