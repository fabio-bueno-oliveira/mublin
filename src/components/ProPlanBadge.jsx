import { Image } from '@mantine/core'
import MublinMLogoGold from '../assets/svg/mublin-m-logo-gold.svg'

const goldenFilter = 'sepia(1) saturate(2) hue-rotate(5deg) brightness(1)'

export default function ProPlanBadge({ small = false, marginLeft = 0 }) {
  return (
    <>
      <Image
        src={MublinMLogoGold}
        h={small ? 16 : 20}
        w="auto"
        fit="contain"
        title="Usuário Mublin Premium"
        style={{ filter: goldenFilter }}
        ml={marginLeft}
      />
    </>
  )
}
