import { Paper, em } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

export default function SectionPanel({ children, ...props }) {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  return (
    <Paper
      shadow={{ base: 'none', sm: 'sm' }}
      pl={{ base: 0, sm: 'md' }}
      pr={{ base: 0, sm: 'md' }}
      py={{ base: 'xs', sm: 'md' }}
      radius={{ base: 0, sm: 'md' }}
      bg={{ base: 'transparent', sm: 'var(--mantine-color-body)' }}
      withBorder={isMobile ? false : true }
      {...props}
    >
      {children}
    </Paper>
  )
}