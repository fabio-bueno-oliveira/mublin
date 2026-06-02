import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useMediaQuery } from '@mantine/hooks'
import { Box, Avatar, Tooltip, Text, Flex } from '@mantine/core'
import './Dashbar.css'

const AVATAR_PATH =
  'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

export default function DashbarTextLoop({ project }) {
  const isMobile = useMediaQuery('(max-width: 48em)')

  const [index, setIndex] = useState(0)

  const MAX_VISIBLE_AVATARS = 6
  const visibleAvatars = project?.members?.slice(0, MAX_VISIBLE_AVATARS)
  const remainingAvatars = project?.members?.length - MAX_VISIBLE_AVATARS

  const notificationsRaw = [
    {
      label: 'Em turnê!',
      showLabel: true,
      content: (
        <Text size="14px" truncate="end">
          {project?.name} está em turnê!
        </Text>
      ),
      active: project?.on_tour,
    },
    {
      label: 'Evento 1',
      showLabel: true,
      content: (
        <Text size="14px" truncate="end">
          Próxima Gig: 22/Mai no Bar do Rock
        </Text>
      ),
      active: true,
    },
    {
      label: 'Notificação',
      showLabel: true,
      content: (
        <Text size="14px" truncate="end">
          3 novas candidaturas recebidas
        </Text>
      ),
      active: true,
    },
    {
      label: 'Evento 3',
      showLabel: true,
      content: (
        <Text size="14px" truncate="end">
          Ensaio Geral: Quinta às 20h
        </Text>
      ),
      active: true,
    },
    {
      label: 'People',
      showLabel: false,
      content: (
        <Flex justify="center">
          <Tooltip.Group openDelay={300} closeDelay={100}>
            <Avatar.Group>
              {visibleAvatars?.map((user) => (
                <Tooltip key={user.id} label={user.name} withArrow position="top">
                  <Avatar
                    src={user.avatar ? `${AVATAR_PATH}${user.avatar}` : undefined}
                    radius="xl"
                    size={28}
                  >
                    {user.name}
                  </Avatar>
                </Tooltip>
              ))}
              {remainingAvatars > 0 && <Avatar radius="xl">+{remainingAvatars}</Avatar>}
            </Avatar.Group>
          </Tooltip.Group>
        </Flex>
      ),
      active: !!isMobile,
    },
  ]

  const notifications = notificationsRaw.filter((x) => x.active)

  useEffect(() => {
    const timer = setInterval(() => {
      if (project) {
        setIndex((prevIndex) => (prevIndex + 1) % notifications.length)
      }
    }, 3500) // Alterna a cada 3,5 segundos

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, project])

  return (
    <Box style={{ height: 28, overflow: 'hidden', position: 'relative' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{ position: 'absolute', width: '100%' }}
        >
          {notifications[index]?.showLabel && (
            <Text size="10px">{notifications[index]?.label}</Text>
          )}
          {notifications[index]?.content}
        </motion.div>
      </AnimatePresence>
    </Box>
  )
}
