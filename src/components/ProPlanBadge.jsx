import { Image } from '@mantine/core'
import MublinMLogoSilver from '../assets/svg/mublin-m-logo-silver.svg'

const silverFilter = 'sepia(1) saturate(0) hue-rotate(5deg) brightness(0.9)'

export default function ProPlanBadge({ small = false, marginLeft = 0 }) {
  return (
    <>
      <Image
        src={MublinMLogoSilver}
        h={small ? 14 : 20}
        ml={marginLeft}
        w="auto"
        fit="contain"
        title="Usuário Mublin Premium"
        style={{ filter: silverFilter }}
      />
    </>
  )
}
