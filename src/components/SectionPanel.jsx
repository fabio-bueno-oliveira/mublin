import { Paper } from '@mantine/core'

export default function SectionPanel({ children, ...props }) {
  return (
    <Paper
      shadow={{ base: 'none', sm: 'sm' }}
      pl={{ base: "sm", sm: 'md' }}
      pr={{ base: 0, sm: 'md' }}
      py={{ base: 'xs', sm: 'md' }}
      radius={{ base: 0, sm: 'md' }}
      {...props}
    >
      {children}
    </Paper>
  )
}