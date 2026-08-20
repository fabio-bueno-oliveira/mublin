// components/backstage/BackstageLogo.jsx
import { Box } from '@mantine/core'
import classes from './BackstageLogo.module.css'

export default function BackstageLogo() {
  return (
    <Box component="span" className={classes.logo}>
      BACKSTAGE
    </Box>
  )
}
