import { Paper } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

export default function SectionPanel({ children, ...props }) {
  const isMobile = useMediaQuery('(max-width: 48em)')

  return (
    <Paper
      shadow={{ base: 'none', sm: 'sm' }}
      pl={{ base: 'sm', sm: 'md' }}
      pr={{ base: 0, sm: 'md' }}
      py={{ base: 'xs', sm: 'md' }}
      radius={isMobile ? 0 : 'md'}
      {...props}
    >
      {children}
    </Paper>
  )
}
