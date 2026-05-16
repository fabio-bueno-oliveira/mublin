import MublinLogoBlack from '../assets/svg/mublin-logo-black.svg'
import MublinLogoWhite from '../assets/svg/mublin-logo-white.svg'
import { useComputedColorScheme, Flex, Box, Image } from '@mantine/core'
import { IconMenu2Filled } from '@tabler/icons-react'

export default function AppNavbarMobile() {
  const computedColorScheme = useComputedColorScheme('light')
  const isDark = computedColorScheme === 'dark'

  return (
    <Flex
      gap="xs"
      align="center"
      justify="space-between"
      my="sm"
      mb="sm"
      hiddenFrom="sm"
      px={{ base: '0.8rem', sm: 0 }}
    >
      <Image
        src={isDark ? MublinLogoWhite : MublinLogoBlack}
        h={24}
        w="auto"
        fit="contain"
      />
      <Box p={4}>
        <IconMenu2Filled />
      </Box>
    </Flex>
  )
}
