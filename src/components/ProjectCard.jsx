import { Link } from 'react-router-dom'
import {
  Flex, Stack, Card, Box, Image, Text, Avatar, Badge
} from '@mantine/core'
import {
  IconUser, IconClock
} from '@tabler/icons-react'

const IMG_PATH = 'https://ik.imagekit.io/mublin/'
const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-28,c-maintain_ratio/users/avatars/'

export default function ProjectCard({ item, profile }) {
  return (
    <Link to={`/project/${item.slug}`} className="noDecoration">
      <Card
        w={140}
        padding="xs"
        withBorder
      >
        <Card.Section>
          <Box
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden'
            }}
          >
            <Image
              src={
                item.picture
                  ? `${IMG_PATH}projects/${item.id}/tr:h-120,w-140,c-maintain_ratio/${item.picture}`
                  : undefined
              }
              fallbackSrc="https://placehold.co/140x120?text=?"
              height={120}
              alt={item.name}
            />
            {item.status === 1 && (
              <Flex
                align="center"
                justify="center"
                pos="absolute"
                direction="column"
                gap="xs"
                inset={0}
                bg="rgba(0,0,0,0.55)"
              >
                <IconClock size={24} color="white" stroke={1.5} />
                <Badge size="xs" variant="outline" fw="400" color="white">
                  Pendente
                </Badge>
              </Flex>
            )}
          </Box>
        </Card.Section>
        <Stack mt={8} gap={1} pos="relative" style={{ minWidth: 0 }}>
          <Flex gap={3} align="center" style={{ minWidth: 0 }}>
            <Avatar
              size={14}
              src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
              radius="xl"
              style={{ flexShrink: 0 }}
            />
            <Text size="11px" opacity={0.6} truncate="end">
              {item.main_role} em
            </Text>
          </Flex>
          <Text size="md" fw={550} truncate="end" title={item.name}>
            {item.name}
          </Text>
          <Text
            size="12px"
            truncate="end"
            opacity={0.8}
            style={{ minWidth: 0, flexShrink: 1 }}
          >
            {item.type}{item.genre && ' · ' + item.genre}
          </Text>
          <Text mt={3} size="11px" c="dimmed">
            {item.totalMembers} {item.totalMembers === 1 ? 'pessoa' : 'pessoas'}
          </Text>
        </Stack>
      </Card>
    </Link>
  )
}
