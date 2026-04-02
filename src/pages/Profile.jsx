import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  fetchBasicProfile, 
  fetchSimilarProfiles, 
  fetchProfileProjects, 
  fetchProfileFeed,
} from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import {
  Container, Grid, Scroller, Avatar, Paper, Box, Spoiler,
  Button, Title, Text, Group, Flex, Stack, ActionIcon,
  Skeleton, ScrollArea, Alert, Badge, Image, Tooltip
} from '@mantine/core'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayer from '../components/feed/VideoPlayer'
import { 
  IconMoodSad, IconRosetteDiscountCheckFilled,
  IconBrandInstagram, IconBrandTiktok, IconBrandYoutube,
  IconBrandSpotify, IconBrandSoundcloud, 
  IconBrandLinkedin, IconWorld,
  IconShieldCheckFilled,
  IconCircleArrowLeftFilled, IconCircleArrowRightFilled
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

// Mapa de plataforma → URL base e ícone
const SOCIAL_CONFIG = {
  instagram:  { icon: IconBrandInstagram, base: 'https://instagram.com/',  color: '#E1306C' },
  tiktok:     { icon: IconBrandTiktok,    base: 'https://tiktok.com/@',    color: '#010101' },
  youtube:    { icon: IconBrandYoutube,   base: 'https://youtube.com/@',   color: '#FF0000' },
  spotify:    { icon: IconBrandSpotify,   base: 'https://open.spotify.com/artist/', color: '#1DB954' },
  soundcloud: { icon: IconBrandSoundcloud,base: 'https://soundcloud.com/', color: '#FF5500' },
  linkedin:   { icon: IconBrandLinkedin,  base: 'https://linkedin.com/in/', color: '#0A66C2' },
}

export default function Profile() {
  const { username } = useParams()
  const { loading: authLoading, user } = useAuth()

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchBasicProfile(username),
    enabled: !!username && !authLoading,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const { data: similarProfiles = [], isLoading: loadingSimilar } = useQuery({
    queryKey: ['similar-profiles', profile?.id],
    queryFn: () => fetchSimilarProfiles(profile.id, profile.region_id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 10,
  })

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['user-projects', profile?.id],
    queryFn: () => fetchProfileProjects(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 4,
  })

  const { data: profilePosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['profile-feed', profile?.id],
    queryFn: () => fetchProfileFeed(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 3,
  })

  const profileProjects = projects.map((r) => ({
    id:      r.projects.id,
    name:    r.projects.name,
    slug:    r.projects.slug,
    picture: r.projects.picture,
    status:  r.status,
    type:    r.projects.project_types.name_ptbr,
    roles: [
      r.roles?.name_ptbr,
      r.role2?.name_ptbr,
      r.role3?.name_ptbr,
    ].filter(Boolean), // remove os nulos
  }))

  const roles = profile?.profile_roles.sort((a, b) => b.main_activity - a.main_activity)

  if (authLoading) {
    return (
      <Container size="sm" py={48}>
        <Stack align="center" gap="md">
          <Skeleton circle height={96} />
          <Skeleton height={24} width={200} radius="xl" />
          <Skeleton height={16} width={120} radius="xl" />
        </Stack>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container size="sm" py={48}>
        <Stack align="center" gap="md">
          <Skeleton circle height={96} />
          <Skeleton height={24} width={200} radius="xl" />
          <Skeleton height={16} width={120} radius="xl" />
        </Stack>
      </Container>
    )
  }

  if (isError || !profile) {
    return (
      <Container size="sm" py={48}>
        <Alert
          icon={<IconMoodSad size={18} />}
          title="Perfil não encontrado"
          color="gray"
          radius="md"
        >
          O usuário <strong>@{username}</strong> não existe ou foi removido.
        </Alert>
      </Container>
    )
  }

  return (
    <>
      <Container size="xl" py="sm">
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Group align="center" gap="md" mb="xl">
              <Avatar
                size={96}
                src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
              />
              <Stack gap={2} flex={1}>
                <Flex align="center" gap={2} wrap="wrap">
                  <Title order={1} size="25px" lts='-0.02em' lh='1'>
                    {profile.full_name}
                  </Title>
                  {!!profile.is_verified && 
                    <IconRosetteDiscountCheckFilled 
                      className='iconVerified'
                      title='Usuário verificado'
                    />
                  }
                  {!!profile.is_legend && 
                    <IconShieldCheckFilled
                      className='iconLegend'
                      title='Lenda da música'
                    />
                  }
                  {user?.id === profile.id && (
                    <Button 
                      radius="sm" 
                      size="compact-sm" 
                      variant="light"
                      ml={4}
                      color="indigo"
                    >
                      Editar Perfil
                    </Button>
                  )}
                </Flex>
                <Flex align="center" gap={4} opacity={0.6}>
                  <Text size="sm">
                    @{profile.username}
                  </Text>
                  {(profile?.cities?.name || profile?.regions?.uf) && (
                    <Text size="sm">
                      · {[profile.cities.name, profile.regions.uf]
                        .filter(Boolean)
                        .join('/')}
                    </Text>
                  )}
                </Flex>
                {profile.title && (
                  <Text size="sm" maw={420} lh={1.4} mt={2}>
                    {profile.title}
                  </Text>
                )}
                {roles && roles.length > 0 && (
                  <Scroller>
                    <Group gap={4} wrap="nowrap">
                      {roles && roles.map(({ id, main_activity, roles: role }) => (
                        <Badge 
                          key={id} 
                          variant="light" 
                          fw='500' 
                          size="sm" 
                          color='gray'
                        >
                          {role.name_ptbr}
                          {main_activity ? ' ★' : ''}
                        </Badge>
                      ))}
                    </Group>
                  </Scroller>
                )}
              </Stack>
            </Group>
            <Stack gap={12}>
              <Box p={0}>
                <Text fw={500} size="lg" mb="xs">
                  Sobre
                </Text>
                <Spoiler
                  maxHeight={66}
                  showLabel={<Text fz="sm">Ver mais</Text>}
                  hideLabel={<Text fz="sm">Ver menos</Text>}
                  fz="sm"
                  pb="xs"
                >
                  {profile.bio}
                </Spoiler>
              </Box>
              {loadingProjects && (
                <>
                  <Text fw={500} size="lg">Projetos de {profile.full_name}</Text>
                  <Flex gap={15}>    
                    <Skeleton width={180} height={180} radius="md" />
                    <Skeleton width={180} height={180} radius="md" />
                    <Skeleton width={180} height={180} radius="md" />
                  </Flex>
                </>
              )}
              {profileProjects.length > 0 && (
                <>
                  <Text fw={500} size="lg">Projetos de {profile.full_name}</Text>
                  <ScrollArea w="100%" type="never" mb="sm">
                    <Flex gap={15}>
                      {!loadingProjects && profileProjects?.map(item => (
                        <Flex
                          key={item.id}
                          direction="column"
                          align="flex-start"
                          gap={2}
                          component={Link}
                          to={`/project/${item.slug ?? item.id}`}
                          style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                        >
                          <Box
                            pos="relative"
                            width={180}
                            height={180}
                            style={{ borderRadius: 12, overflow: 'hidden' }}
                          >
                            <Image
                              w={180}
                              h={180}
                              fit="cover"
                              src={
                                item.picture
                                  ? `https://ik.imagekit.io/mublin/projects/tr:h-320,w-320,c-maintain_ratio/${item.picture}`
                                  : undefined
                              }
                              fallbackSrc="https://placehold.co/180x180?text=Sem+foto"
                              opacity={item.status === 1 ? 0.4 : 1}
                              style={{ transition: 'opacity 0.2s' }}
                            />

                            <Box
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '65%',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.82) 10%, transparent 100%)',
                              }}
                            />
                              <Flex
                                align="flex-start"
                                justify="flex-end"
                                pos="absolute"
                                direction="column"
                                gap={0}
                                inset={10}
                              >
                                {item.roles.length > 0 && (
                                  <Text size="12px" w={126}>
                                    {item.roles.join(', ')} em
                                  </Text>
                                )}
                                <Text
                                  size="lg"
                                  my="2px"
                                  w={140}
                                  fw={700}
                                  c="white"
                                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                                  truncate="end"
                                >
                                  {item.name}
                                </Text>
                                <Text size="10px" fw={300} opacity={0.7}>
                                  {item.type}
                                </Text>
                              </Flex>
                            </Box>
                        </Flex>
                      ))}
                    </Flex>
                  </ScrollArea>
                </>
              )}
              <Text fw={500} size="lg">Postagens</Text>
              <Scroller 
                key={profilePosts.length}
                draggable
                controlSize="xl"
                showEndControl={profilePosts.length > 2 ? true : false}
                startControlIcon={<IconCircleArrowLeftFilled size={36} />}
                endControlIcon={<IconCircleArrowRightFilled size={36} />}
              >
                <Group gap="xs" wrap="nowrap">
                  {loadingPosts ? (
                    [1, 2, 3].map(i => (
                      <Group key={i} gap="sm">
                        <Skeleton circle height={36} />
                        <Stack gap={4} style={{ flex: 1 }}>
                          <Skeleton height={12} width="60%" radius="xl" />
                          <Skeleton height={10} width="80%" radius="xl" />
                        </Stack>
                      </Group>
                    ))
                  ) : profilePosts.length === 0 ? (
                    <Paper
                      p="xs"
                      withBorder
                      h="100%"
                    >
                      <Text size="sm" c="dimmed">Nenhuma postagem ainda.</Text>
                    </Paper>
                  ) : (
                    profilePosts.map(post => (
                      <Paper
                        key={post.id}
                        p="xs"
                        withBorder
                        h="100%"
                        w="300px"
                      >
                        <Text size="xs" c="dimmed" mt={4}>
                          {dayjs(post.created_at).fromNow()}
                        </Text>
                        <Text
                          size="sm"
                          w="100%"
                          lh={1.5}
                          opacity={0.85}
                          component={Link}
                          to={`/post/${post.id}`}
                          style={{ whiteSpace: 'normal' }}
                          c="var(--mantine-color-text)"
                        >
                          {post.body}
                        </Text>
                        {post.video_url && (
                          <VideoPlayer url={post.video_url} title={post.body?.slice(0, 60)} />
                        )}
                        {(post.linked_gig_id || post.linked_product_id) && (
                          <LinkedItem post={{
                            ...post,
                            linked_product_slug: post.products?.slug,
                            linked_product_name: post.products?.name,
                            linked_product_picture: post.products?.picture,
                            linked_product_brand_name: post.products?.brands?.name,
                            linked_gig_slug: post.gigs?.slug,
                            linked_gig_title: post.gigs?.title,
                            linked_gig_has_remuneration: post.gigs?.has_remuneration,
                          }} />
                        )}
                      </Paper>
                    ))
                  )}
                </Group>
              </Scroller>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap={12}>
              <Paper p="md" radius="md" withBorder>
                <Text fw={400} size="lg" mb="sm">
                  Redes de {profile.username}
                </Text>
                {/* Social links + website */}
                {(profile.profile_social_links.length > 0 || profile.website) && (
                  <Group gap={6} wrap="wrap">
                    {profile.website && (
                      <ActionIcon
                        component="a"
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="light"
                        size="md"
                        radius="xl"
                        title={profile.website}
                      >
                        <IconWorld size={17} />
                      </ActionIcon>
                    )}
                    {profile.profile_social_links.map(link => {
                      const config = SOCIAL_CONFIG[link.platform]
                      if (!config) return null
                      const Icon = config.icon
                      const href = `${config.base}${link.handle}`
                      return (
                        <Tooltip 
                          key={link.platform}
                          label={`${link.platform}: ${link.handle}`}
                          position="bottom"
                          withArrow
                        >
                          <ActionIcon
                            component="a"
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="filled"
                            color={config.color}
                            size="md"
                            radius="xl"
                            title={`${link.platform}: ${link.handle}`}
                          >
                            <Icon size={17} />
                          </ActionIcon>
                        </Tooltip>
                      )
                    })}
                  </Group>
                )}
              </Paper>
              <Paper p="md" radius="md" withBorder>
                <Text fw={400} size="lg" mb="md">
                  Mais perfis parecidos
                </Text>
                {loadingSimilar ? (
                  <Stack gap="md">
                    {[1, 2, 3, 4].map(i => (
                      <Group key={i} gap="sm">
                        <Skeleton circle height={40} />
                        <Stack gap={4} style={{ flex: 1 }}>
                          <Skeleton height={12} width="70%" radius="xl" />
                          <Skeleton height={10} width="50%" radius="xl" />
                        </Stack>
                      </Group>
                    ))}
                  </Stack>
                ) : similarProfiles.length === 0 ? (
                  <Text size="sm" c="dimmed">Nenhum perfil similar encontrado.</Text>
                ) : (
                  <Stack gap="md">
                    {similarProfiles.map(p => (
                      <Group
                        key={p.id}
                        gap="sm"
                        component={Link}
                        to={`/${p.username}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Avatar
                          size={40}
                          radius="xl"
                          src={p.avatar ? AVATAR_PATH + p.avatar : undefined}
                        />
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Group gap={4} align="center">
                            <Text size="sm" fw={600} lineClamp={1}>
                              {p.full_name}
                            </Text>
                            {!!p.is_verified && (
                              <IconRosetteDiscountCheckFilled
                                className="iconVerified"
                                size={14}
                                title="Usuário verificado"
                              />
                            )}
                          </Group>
                          {p.title && (
                            <Text size="xs" lineClamp={2} maw={220}>
                              {p.title}
                            </Text>
                          )}
                          <Text size="xs" c="dimmed" truncate="end" maw={220}>
                            {p.roles?.map((role, index) => (
                              <Text span key={role.id}>
                                {role.name_ptbr}
                                {index < p.roles.length - 1 ? ', ' : ''}
                              </Text>
                            ))}
                          </Text>
                        </Stack>
                      </Group>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </>
  )
}
