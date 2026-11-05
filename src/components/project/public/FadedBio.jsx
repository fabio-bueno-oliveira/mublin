import { useLayoutEffect, useRef, useState } from 'react'
import { Box, Stack, Text } from '@mantine/core'

const FADE_MASK = 'linear-gradient(to bottom, #000 45%, transparent 100%)'

export default function FadedBio({ text }) {
  const ref = useRef(null)
  const [isTruncated, setIsTruncated] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const check = () => setIsTruncated(el.scrollHeight > el.clientHeight + 1)
    check()

    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  return (
    <Stack gap={4}>
      <Box
        ref={ref}
        mah={60}
        px="xs"
        style={{
          overflow: 'hidden',
          ...(isTruncated && { WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }),
        }}
      >
        <Text size="sm">{text}</Text>
      </Box>
    </Stack>
  )
}
