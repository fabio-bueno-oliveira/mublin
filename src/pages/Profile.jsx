import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  fetchBasicProfile, 
  fetchSimilarProfiles, 
  fetchProfileProjects, 
  fetchProfileFeed,
  fetchProfileGear,
  fetchProfileGearCategories,
  fetchProfileGearSetups,
  fetchProfileWorkAvailability,
} from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import {
  Container, Grid, Scroller, Avatar, Paper, Box, Spoiler, Anchor, Center,
  Card, Button, Title, Text, Group, Flex, Stack, ActionIcon, NativeSelect,
  Skeleton, ScrollArea, Alert, Badge, Image, Tooltip, Indicator, em
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import LoadingSkeleton from '../components/profile/LoadingSkeleton'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayer from '../components/feed/VideoPlayer'
import { 
  IconMoodSad, IconRosetteDiscountCheckFilled,
  IconBrandInstagram, IconBrandTiktok, IconBrandYoutube,
  IconBrandSpotify, IconBrandSoundcloud, 
  IconBrandLinkedin, IconWorld,
  IconShieldCheckFilled, IconArrowsMaximize, IconPlus, IconSettings,
  IconCircleArrowLeftFilled, IconCircleArrowRightFilled
} from '@tabler/icons-react'
import { truncateString } from '../utils/formatter'
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
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  const { data: profile, isLoading : isLoadingProfileInfo, isError } = useQuery({
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

  const { data: gearList = [], isLoading: loadingGear } = useQuery({
    queryKey: ['user-gear', profile?.id],
    queryFn: () => fetchProfileGear(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const [gearCategorySelected, setGearCategorySelected] = useState('')

  const gear = gearList.filter((x) =>
    gearCategorySelected
      ? x.products?.id_category === Number(gearCategorySelected)
      : true
  )

  const { data: gearCategories = [] } = useQuery({
    queryKey: ['user-gear-categories', profile?.id],
    queryFn: () => fetchProfileGearCategories(profile.id),
    enabled: !!profile?.id && gear.length > 0,
    staleTime: 1000 * 60 * 5,
  })

  const { data: gearSetups = [] } = useQuery({
    queryKey: ['user-gear-setups', profile?.id],
    queryFn: () => fetchProfileGearSetups(profile.id),
    enabled: !!profile?.id && gear.length > 0,
    staleTime: 1000 * 60 * 5,
  })

  const { data: workAvailability = [], isLoading: loadingWorkAvailability } = useQuery({
    queryKey: ['user-work-availability', profile?.id],
    queryFn: () => fetchProfileWorkAvailability(profile.id),
    enabled: !!profile?.id && gear.length > 0,
    staleTime: 1000 * 60 * 5,
  })

  const profileProjects = projects?.map((r) => ({
    id:      r.projects?.id,
    name:    r.projects?.name,
    slug:    r.projects?.slug,
    picture: r.projects?.picture,
    status:  r.status,
    type:    r.projects?.project_types?.name_ptbr ?? 'Outro', 
    roles: [
      r.roles?.name_ptbr,
      r.role2?.name_ptbr,
      r.role3?.name_ptbr,
    ].filter(Boolean),
  })) || [];

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

  if (isLoadingProfileInfo) {
    return (
      <LoadingSkeleton />
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
      <Helmet>
        <meta charSet='utf-8' />
        <title>{`${profile?.full_name} · Mublin`}</title>
        <link rel='canonical' href={`https://mublin.com/${profile?.username}`} />
        <meta name='description' content={`${profile?.full_name} no Mublin`} />
        <meta property="og:image" content={profile.avatar ? AVATAR_PATH + profile.avatar : undefined} />
      </Helmet>
      {profile.cover_image && 
        <Card hiddenFrom='sm' shadow={false} padding={0} radius={0} mb={14}>
          <Card.Section>
            <Image
              src={profile.cover_image 
                ? `https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/${profile.cover_image}` 
                : 'https://ik.imagekit.io/mublin/bg/tr:w-1920,h-200,bg-F3F3F3,fo-bottom/open-air-concert.jpg'}
              height={100}
              alt={`Imagem de capa de ${profile.name}`}
            />
          </Card.Section>
        </Card>
      }
      <Container size="xl" py="sm">
        <Paper 
          withBorder={false}
          px='0'
          py='0'
          style={{ backgroundColor: 'transparent' }}
          hiddenFrom='sm'
        >
          <Flex
            justify='flex-start'
            align="flex-start"
            direction='row'
            wrap='nowrap'
            columnGap='xs'
          >
            <Indicator 
              position='bottom-center' 
              inline 
              label={<Text size='0.7rem' >Disponível</Text>} 
              color='lime' 
              size={18} 
              withBorder 
              disabled={!profile.is_open_to_work}
            >
              <Avatar
                size='xl'
                src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
              />
            </Indicator>
            <Box style={{overflow:'hidden'}}>
              <Flex align="center" gap={2} mb={2}>
                <Title order={1} size="22px" lts='-0.02em' lh='1'>
                  {profile.full_name}
                </Title>
                {!!profile.is_verified && 
                  <IconRosetteDiscountCheckFilled 
                    className='iconVerified'
                    title='Perfil verificado'
                  />
                }
                {!!profile.is_legend && 
                  <IconShieldCheckFilled
                    className='iconLegend'
                    title='Lenda da Música'
                  />
                }
                {profile.plan === 'Pro' && 
                  <Badge
                    title='Usuário PRO'
                    radius='sm'
                    size='xs'
                    variant="light"
                    color="gray"
                  >
                    PRO
                  </Badge>
                }
              </Flex>
              <Text 
                order={2} 
                fz="sm" 
                lh={1.3}
                mb={2}
                lineClamp={2}
              >
                {profile.title}
              </Text>
              <Flex align="center" gap={4} opacity={0.6}>
                <Text size="sm">
                  @{profile.username}
                </Text>
                {(profile?.cities?.name || profile?.regions?.uf) && (
                  <Text size="sm">
                    · {[profile?.cities?.name, profile?.regions?.uf]
                      .filter(Boolean)
                      .join('/')}
                  </Text>
                )}
              </Flex>
              {roles && roles.length > 0 && (
                <Scroller>
                  <Group gap={4} wrap="nowrap" style={{ width: "max-content" }}>
                    {roles && roles.map(({ id, main_activity, roles: role }) => (
                      <Badge 
                        key={id} 
                        variant="light" 
                        color="var(--mantine-color-text)"
                        fw='500' 
                        size="sm"
                        radius="sm"
                      >
                        {role?.name_ptbr}
                        {main_activity ? ' ★' : ''}
                      </Badge>
                    ))}
                  </Group>
                </Scroller>
              )}
            </Box>
          </Flex>
          {/* <Group 
            gap={12} 
            mt={10} 
            mb={9}
          >
            <Text 
              className='point'
              size={isMobile ? '1.04rem' : '0.87rem'}
              fw='600'
              onClick={() => setModalFollowersOpen(true)}
              style={{lineHeight: 'normal'}}
            >
              {profile.followers.total} seguidores
            </Text>
            <Text 
              className='point'
              size={isMobile ? '1.04rem' : '0.87rem'}
              fw='600'
              onClick={() => setModalFollowingOpen(true)}
              style={{lineHeight: 'normal'}}
            >
              {profile.following.total} seguindo
            </Text>
          </Group> */}
          {(profile.website && profile.website !== 'null') && 
            <Anchor 
              href={profile.website} 
              target='_blank'
              underline='hover'
              className='websiteLink'
              mt={isMobile ? 4 : 4}
              mb={isMobile ? 8 : 6}
            >
              <Flex gap={2} align='center'>
                <IconLink size={13} />
                <Text size='0.91em' className='lhNormal'>
                  {truncateString(profile.website, 37)}
                </Text>
              </Flex>
            </Anchor>
          }
          {(profile.instagram || profile.tiktok) &&
            <Group gap={10} mt={6}>
              {profile.instagram &&
                <Anchor 
                  href={`https://instagram.com/${profile.instagram}`}
                  target='_blank'
                  underline='hover'
                  className='websiteLink'
                >
                  <Flex gap={2} align='center'>
                    <IconBrandInstagram size={13} />
                    <Text size='0.91em' className='lhNormal'>
                      Instagram
                    </Text>
                  </Flex>
                </Anchor>
              }
              {profile.tiktok &&
                <Anchor 
                  href={`https://tiktok.com/@${profile.tiktok}`}
                  target='_blank'
                  underline='hover'
                  className='websiteLink'
                >
                  <Flex gap={2} align='center'>
                    <IconBrandTiktok size={13} />
                    <Text size='0.91em' className='lhNormal'>
                      TikTok
                    </Text>
                  </Flex>
                </Anchor>
              }
            </Group>
          }
        </Paper>
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Group align="flex-start" gap="md" mb="lg" visibleFrom="sm">
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
                      title='Perfil verificado'
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
                      · {[profile?.cities?.name, profile?.regions?.uf]
                        .filter(Boolean)
                        .join('/')}
                    </Text>
                  )}
                </Flex>
                {profile.title && (
                  <Text size="sm" maw={420} lh={1.3} mt={2}>
                    {profile.title}
                  </Text>
                )}
                {roles && roles.length > 0 && (
                  <Scroller>
                    <Group gap={4} wrap="nowrap">
                      {roles.map(({ id, main_activity, roles: role }) => (
                        <Badge 
                          key={id} 
                          variant="light" 
                          color="gray"
                          fw='500' 
                          size="sm"
                          radius="sm"
                        >
                          {role?.name_ptbr}
                          {main_activity ? ' ★' : ''}
                        </Badge>
                      ))}
                    </Group>
                  </Scroller>
                )}
              </Stack>
            </Group>
            <Stack gap={12}>
              {(profile.bio && profile.bio !== 'null') && 
                <Spoiler
                  mt={isMobile ? 14 : 0}
                  maxHeight={66}
                  showLabel={<Text fz="xs" fw={500} c="var(--mantine-color-text)">Ver mais</Text>}
                  hideLabel={<Text fz="xs" fw={500} c="var(--mantine-color-text)">Ver menos</Text>}
                  fz="sm"
                  pb="xs"
                  lh={1.3}
                  style={{whiteSpace:'pre-wrap'}}
                >
                  {profile.bio}
                </Spoiler>
              }
              {loadingProjects && (
                <>
                  <Text fw={550} size="17px">Projetos de {profile.full_name}</Text>
                  <Flex gap={15}>    
                    <Skeleton width={180} height={180} radius="md" />
                    <Skeleton width={180} height={180} radius="md" />
                    <Skeleton width={180} height={180} radius="md" />
                  </Flex>
                </>
              )}
              {profileProjects.length > 0 && (
                <>
                  <Text fw={550} size="17px">Projetos de {profile.full_name}</Text>
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
                                  <Text 
                                    size="12px" w={126} c="white"
                                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                                  >
                                    {item.roles.join(', ')} em
                                  </Text>
                                )}
                                <Text
                                  size="lg"
                                  w={140}
                                  fw={700}
                                  c="white"
                                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                                  truncate="end"
                                >
                                  {item.name}
                                </Text>
                                <Text c="white" size="10px" fw={300} opacity={0.7}>
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
              <Text fw={550} size="17px">Postagens</Text>
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
                        w="260px"
                      >
                        <Text size="xs" c="dimmed" mt={4}>
                          {dayjs(post.created_at).fromNow()}
                        </Text>
                        <Text
                          size="sm"
                          w="100%"
                          my={6}
                          lh={1.3}
                          opacity={0.85}
                          component={Link}
                          to={`/post/${post.id}`}
                          style={{whiteSpace:'pre-wrap', display: "block"}}
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
              <Group justify='space-between' align='center' gap={8} mt={10}>
                <Text fw={550} size="17px">
                  Equipamento {!!gear.length && `(${gear.length})`}
                </Text>
                <Group gap={8}>
                  {!!gear.length && 
                    <ActionIcon
                      variant="subtle"
                      size='md'
                      color="gray"
                      aria-label='Gerenciar'
                      component='a'
                      href={`/${username}/gear`}
                      title='Ver ampliado'
                    >
                      <IconArrowsMaximize 
                        color="var(--mantine-color-text)"
                        style={{ width: '80%', height: '80%' }} stroke={1.5}
                      />
                    </ActionIcon>
                  }
                  {user?.id === profile.id && (
                    <>
                      <ActionIcon
                        variant="subtle"
                        size='md'
                        color="gray"
                        aria-label='Gerenciar'
                        component='a'
                        href='/settings/gear'
                        title='Adicionar item'
                      >
                        <IconPlus 
                          color="var(--mantine-color-text)"
                          style={{ width: '92%', height: '92%' }} stroke={1.5}
                        />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        size='md'
                        color="gray"
                        aria-label='Gerenciar'
                        component='a'
                        href='/settings/gear'
                        title='Gerenciar'
                      >
                        <IconSettings 
                          color="var(--mantine-color-text)"
                          style={{ width: '92%', height: '92%' }} stroke={1.5}
                        />
                      </ActionIcon>
                    </>
                  )}
                </Group>
              </Group>
              {(gear.length > 0 && gearCategories.length > 1) && (
                <NativeSelect
                  size="sm"
                  w={145}
                  mb={4}
                  onChange={(e) => setGearCategorySelected(e.target.value)}
                >
                  <option value="">Exibir tudo</option>
                  {gearCategories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {truncateString(`${cat.category} (${cat.total})`, 28)}
                    </option>
                  ))}
                </NativeSelect>
              )}
              <Paper
                p="xs"
                withBorder
                h="100%"
              >
                {gear.length === 0 && !loadingGear && (
                  <Text size="sm" c="dimmed">Nenhum equipamento adicionado</Text>
                )}
                {loadingGear && (
                  <Skeleton width="100%" height={120} radius="md" />
                )}
                <Scroller 
                  key={gear.length}
                  draggable
                  controlSize="xl"
                  showEndControl={gear.length > 4 ? true : false}
                  startControlIcon={<IconCircleArrowLeftFilled size={36} />}
                  endControlIcon={<IconCircleArrowRightFilled size={36} />}
                >
                  {gear.map(item => (
                    <Flex
                      key={item.id_product}
                      direction='column'
                      justify='flex-start'
                      align='center'
                      w={140}
                    >
                      <Image
                        src={'https://ik.imagekit.io/mublin/products/tr:w-240,h-240,cm-pad_resize,bg-FFFFFF,fo-x/'+item.products?.picture}
                        h={120}
                        mah={120}
                        w='auto'
                        fit='contain'
                        mb={10}
                        radius='md'
                      />
                      <Text size="xs" c="dimmed" fw={500} lineClamp={2}>
                        {item.products?.brands?.name}
                      </Text>
                      <Text size="xs" fw={500} lineClamp={2} style={{ whiteSpace: "pre-wrap" }}>
                        {item.products?.name}
                      </Text>
                    </Flex>
                  ))}
                </Scroller>
              </Paper>
              {gearSetups.length > 0 && 
                <Box mt={8}>
                  <Title fz='0.9rem' fw='640' mb={12}>
                    Setups de {profile.full_name} {!!gearSetups.length && `(${gearSetups.length})`}
                  </Title>
                  <Flex gap={15}>
                    {gearSetups.map(setup =>
                      <Box key={setup.id}>
                        <Flex direction='column' gap={2}>
                          <Center
                            component='a'
                            href={`/${username}/setup/${setup.id}`}
                          >
                            <Image
                              src={'https://ik.imagekit.io/mublin/users/gear-setups/tr:w-120,h-120/'+setup.image}
                              h={60}
                              mah={60}
                              w='auto'
                              fit='contain'
                              radius='md'
                              className='point'
                            />
                          </Center>
                          <Text ta='center' fw={550} size='xs' className='lhNormal'>
                            {setup.name}
                          </Text>
                          <Text ta='center' size='xs' className='lhNormal'>
                            {setup.totalItems ? setup.totalItems : 0} itens
                          </Text>
                        </Flex>
                      </Box>
                    )}
                  </Flex>
                </Box>
              }
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap={12}>
              <Paper p="md" radius="md" withBorder>
                <Text fw={550} size="17px" mb="sm">
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
                <Text fw={550} size="17px" mb="sm">
                  Disponibilidade para trabalhos
                </Text>
                {loadingWorkAvailability ? (
                  <Skeleton height={20} width="100%" radius="xl" />
                ) : (
                  <Group gap={6} wrap="wrap">
                    {workAvailability.map(item => (
                      <Badge key={item.id} variant="default">
                        {item.work_types?.name_ptbr}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Paper>
              <Paper p="md" radius="md" withBorder>
                <Text fw={550} size="17px" mb="sm">
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
                                title="Perfil verificado"
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
