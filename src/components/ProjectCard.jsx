import { Link } from 'react-router-dom'
import {
  Flex, Stack, Card, Box, Image, Text, Avatar, Badge
} from '@mantine/core'
import {
  IconUser, IconClock
} from '@tabler/icons-react'

const IMG_PATH = 'https://ik.imagekit.io/mublin/'
const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

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
          <Text size="sm" fw={550} truncate="end">
            {item.name}
          </Text>
          <Flex gap={4} align="center" style={{ minWidth: 0 }}>
            {item.genre && (
              <>
                <Text
                  size="11px"
                  c="dimmed"
                  truncate="end"
                  style={{ minWidth: 0, flexShrink: 1 }}
                  title={item.genre}
                >
                  {item.genre}
                </Text>
                <Text size="11px" c="dimmed" style={{ flexShrink: 0 }}>·</Text>
              </>
            )}
            <Flex gap={0} align="center" style={{ flexShrink: 0 }}>
              <IconUser size={12} color="gray" />
              <Text size="11px" c="dimmed" ml={2}>{item.totalMembers} pessoas</Text>
            </Flex>
          </Flex>
          <Flex gap={3} align="center" style={{ minWidth: 0 }}>
            <Avatar
              size={14}
              src={profile?.avatar ? AVATAR_PATH + profile.avatar : undefined}
              radius="xl"
              style={{ flexShrink: 0 }}
            />
            <Text size="xs" c="dimmed" truncate="end" style={{ minWidth: 0 }}>
              {item.main_role}
            </Text>
          </Flex>
        </Stack>
      </Card>
    </Link>
  )
}
