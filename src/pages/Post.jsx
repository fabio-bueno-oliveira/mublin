import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPostById } from '../queries/feed'
import {
  Container, Group, Stack, Text, Avatar,
  Card, Badge, Image, Loader, Center,
  ActionIcon, Menu, Anchor
} from '@mantine/core'
import { IconDots, IconLink, IconMicrophone2, IconArrowLeft } from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-68,c-maintain_ratio/users/avatars/'

function LinkedItem({ gig, gigSlug, gigHasRemuneration, product, productSlug, productBrand }) {
  if (gig) return (
    <Card component={Link} to={`/gig/${gigSlug}`} withBorder radius="md" p="xs" mt="xs" style={{ textDecoration: 'none' }}>
      <Group gap="xs">
        <Avatar size={32} radius="md" color="violet" variant="light">
          <IconMicrophone2 size={16} />
        </Avatar>
        <Stack gap={0}>
          <Text size="xs" c="dimmed" fw={500}>Gig vinculada</Text>
          <Text size="sm" fw={600}>{gig}</Text>
        </Stack>
        {gigHasRemuneration && (
          <Badge size="xs" color="green" variant="light" ml="auto">Remunerada</Badge>
        )}
      </Group>
    </Card>
  )

  if (product) return (
    <Card component={Link} to={`/gear/${productSlug}`} withBorder radius="md" p="xs" mt="xs" style={{ textDecoration: 'none' }}>
      <Group gap="xs">
        <Image
          src={product ? `https://ik.imagekit.io/mublin/products/tr:w-64,h-64,cm-pad_resize,bg-FFFFFF/${product}` : undefined}
          w={32} h={32} radius="md" fit="contain"
        />
        <Stack gap={0}>
          <Text size="xs" c="dimmed" fw={500}>Equipamento vinculado</Text>
          <Text size="sm" fw={600}>{productBrand} {product}</Text>
        </Stack>
      </Group>
    </Card>
  )

  return null
}

export default function Post() {
  const { id } = useParams()

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPostById(id),
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) return (
    <Center h="50vh"><Loader color="amber" /></Center>
  )

  if (!post) return (
    <Center h="50vh">
      <Text c="dimmed">Post não encontrado.</Text>
    </Center>
  )

  return (
    <Container size="sm" py="md">
      <Anchor component={Link} to="/home" c="dimmed" size="sm" mb="md" display="inline-flex" style={{ alignItems: 'center', gap: 4 }}>
        <IconArrowLeft size={14} /> Voltar
      </Anchor>

      <Card shadow="sm" padding="lg" radius="md" withBorder mt="xs">
        <Group gap="sm" align="flex-start">
          <Avatar
            size={40}
            radius="xl"
            src={post.author_avatar ? AVATAR_PATH + post.author_avatar : undefined}
            component={Link}
            to={`/${post.author_username}`}
          />
          <Stack gap={3} style={{ flex: 1 }}>
            <Group gap="xs" justify="space-between">
              <Group gap="xs">
                {/* <Text size="sm" fw={700} component={Link} to={`/${post.author_username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {post.author_username} <Text span c="dimmed" ml="3">{dayjs(post.created_at).fromNow()}</Text>
                </Text>
                {post.author_project_id && (
                  <Badge size="sm" variant="light" color="gray">Projeto</Badge>
                )} */}
                <Anchor>
                  {post.author_username}
                </Anchor>
              </Group>
              <Menu shadow="md" radius="md" position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray" size="sm" radius="xl">
                    <IconDots size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconLink size={14} />}
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)}
                  >
                    Copiar link
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
            {post.author_title && (
              <Text size="xs" c="dimmed" lh="1">
                {post.author_title}
              </Text>
            )}

            <Text size="sm" lh={1.6} mt={10}>
              {post.body}
            </Text>
            <Text c="dimmed" fz="xs" mt="xs">
              {dayjs(post.created_at).format('dddd, D [de] MMMM [de] YYYY [às] HH:mm')}
            </Text>

            {post.image && (
              <Image
                src={`https://ik.imagekit.io/mublin/feed/${post.image}`}
                radius="md"
                mt="sm"
              />
            )}

            <LinkedItem
              gig={post.linked_gig_title}
              gigSlug={post.linked_gig_slug}
              gigHasRemuneration={post.linked_gig_has_remuneration}
              product={post.linked_product_name}
              productSlug={post.linked_product_slug}
              productBrand={post.linked_product_brand_name}
            />
          </Stack>
        </Group>
      </Card>
    </Container>
  )
}