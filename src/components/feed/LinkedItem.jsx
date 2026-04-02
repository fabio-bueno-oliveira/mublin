import { Link } from 'react-router-dom'
import {
  Stack, Card, Avatar,
  Text, Group, Image, Badge
} from '@mantine/core'

const PATH_PRODUCT_IMAGE = 'https://ik.imagekit.io/mublin/products/tr:w-64,h-64,cm-pad_resize,bg-FFFFFF/'

export default function LinkedItem({ post }) {
  if (post.linked_gig_id) return (
    <Card
      component={Link}
      to={`/gig/${post.slug}`}
      withBorder
      radius="md"
      p="xs"
      mt="xs"
      style={{ textDecoration: 'none' }}
    >
      <Group gap="xs">
        <Avatar size={32} radius="md" color="violet" variant="light">
          <IconMicrophone2 size={16} />
        </Avatar>
        <Stack gap={0}>
          <Text size="xs" c="dimmed" fw={500}>Gig vinculada</Text>
          <Text size="sm" fw={600} truncate="end">{post.title}</Text>
        </Stack>
        {post.has_remuneration && (
          <Badge size="xs" color="green" variant="light" ml="auto">
            Remunerada
          </Badge>
        )}
      </Group>
    </Card>
  )

  if (post.linked_product_id > 0) return (
    <Card
      component={Link}
      to={`/gear/${post.linked_product_slug}`}
      withBorder
      radius="md"
      p="xs"
      mt="xs"
      style={{ textDecoration: 'none' }}
    >
      <Group gap="xs">
        <Image
          src={post.linked_product_picture
            ? PATH_PRODUCT_IMAGE + post.linked_product_picture
            : undefined}
          w={32}
          h={32}
          radius="md"
          fit="contain"
        />
        <Stack gap={0}>
          <Text size="xs" c="dimmed" fw={500}>{post.linked_product_brand_name}</Text>
          <Text size="sm" fw={600}>{post.linked_product_name}</Text>
        </Stack>
      </Group>
    </Card>
  )

  return null
}
