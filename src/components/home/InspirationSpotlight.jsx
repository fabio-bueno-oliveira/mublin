import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Group, Text, Avatar, Skeleton, Box } from '@mantine/core'
import { fetchTopInspiredArtist } from '../../queries/inspirations'

const CDN_ARTISTS = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/artists/'

function formatInspirationText(profiles, totalCount) {
  if (!profiles?.length) {
    return null
  }
  const firstNames = profiles.map((p) => p.full_name?.split(' ')[0] || p.username)

  if (totalCount === 1) {
    return `${firstNames[0]} se inspira em`
  }
  if (totalCount === 2) {
    return `${firstNames[0]} e ${firstNames[1]} se inspiram em`
  }
  if (totalCount <= 4) {
    const last = firstNames.pop()
    return `${firstNames.join(', ')} e ${last} se inspiram em`
  }
  // 5+
  const shown = firstNames.slice(0, 2)
  const remaining = totalCount - shown.length
  return `${shown.join(', ')} e +${remaining} se inspiram em`
}

export default function InspirationSpotlight() {
  const { data, isLoading } = useQuery({
    queryKey: ['top-inspired-artist'],
    queryFn: () => fetchTopInspiredArtist(3),
    staleTime: 1000 * 60 * 15, // 15 min - dado muda pouco
  })

  if (isLoading) {
    return (
      <Card withBorder radius="md" p="md" mb="md">
        <Group>
          <Skeleton height={44} circle />
          <Box style={{ flex: 1 }}>
            <Skeleton height={12} width="70%" mb={6} />
            <Skeleton height={16} width="50%" />
          </Box>
        </Group>
      </Card>
    )
  }

  if (!data?.artist) {
    return null
  }

  const { artist, profiles, totalCount } = data

  const getInitials = (name) => {
    if (!name) {
      return ''
    }
    const parts = name.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? ''
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (first + last).toUpperCase()
  }

  return (
    <Box>
      {/* <Title order={3} fw={600} fz="lg" mb="sm">
        Em alta
      </Title> */}
      <Card
        withBorder
        radius="md"
        p="sm"
        mb="md"
        // style={{
        //   background: 'light-dark(#ffffff, #1c1c1c)',
        //   borderColor: 'light-dark(#dde1e7, #2a2a2a)',
        // }}
      >
        <Group align="center" wrap="nowrap">
          <Box pos="relative">
            <Link to={`/artist/${artist.slug}`}>
              <Avatar
                src={artist.picture ? CDN_ARTISTS + artist.picture : undefined}
                size={80}
                radius="md"
                alt={artist.name}
              />
            </Link>
          </Box>

          <Box style={{ flex: 1, minWidth: 0 }}>
            <Avatar.Group spacing="xs" mb={2}>
              {profiles.map((p) => (
                <Avatar
                  key={p.id}
                  src={
                    p.avatar
                      ? `https://ik.imagekit.io/mublin/tr:h-80,c-maintain_ratio/users/avatars/${p.avatar}`
                      : `https://api.dicebear.com/10.x/initials/svg?seed=${p.full_name}`
                  }
                  size="sm"
                  radius="xl"
                  title={p.full_name}
                />
              ))}
              {totalCount > profiles.length && (
                <Avatar radius="xl">+{totalCount - profiles.length}</Avatar>
              )}
            </Avatar.Group>

            <Text size="sm" lh={1.3} lineClamp={2}>
              <Text span fw={500}>
                {formatInspirationText(profiles, totalCount)}{' '}
              </Text>
              <Text
                span
                fw={700}
                component={Link}
                to={`/artist/${artist.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
                className="link"
              >
                {artist.name}
              </Text>
            </Text>

            <Text size="xs" c="dimmed" mt={2}>
              {/* {totalCount}{' '}
              {totalCount === 1 ? 'pessoa se inspira' : 'pessoas se inspiram'}•{' '} */}
              <Text
                span
                // c="var(--mantine-color-text)"
                c="dimmed"
                component={Link}
                to={`/artist/${artist.slug}`}
                style={{ textDecoration: 'none' }}
              >
                ver mais
              </Text>
            </Text>
          </Box>
        </Group>
      </Card>
    </Box>
  )
}
