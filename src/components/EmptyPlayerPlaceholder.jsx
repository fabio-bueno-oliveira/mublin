import React from 'react'
import classes from './Guitarist.module.css'
import guitarGif from '../assets/gif/electric-guitar-pixel-art.gif'
import { Box } from '@mantine/core'

export function EmptyPlayerPlaceholder() {
  return (
    <Box className={classes.animationContainer}>
      <img src={guitarGif} alt="Guitarrista Pixel Art" className={classes.guitarist} />
    </Box>
  )
}
