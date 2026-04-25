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
  fetchProfileWorkFocuses
} from '../queries/profiles'
import { useAuth } from '../hooks/useAuth'
import { Helmet } from 'react-helmet-async'
import {
  Container, Modal, Grid, Scroller, Avatar, Paper, Box, Indicator, Spoiler,
  Card, Button, Title, Text, Group, Flex, Stack, ActionIcon, NativeSelect,
  Skeleton, ScrollArea, Alert, Anchor, Image, Tooltip, Badge, Pill, Divider, em,
} from '@mantine/core'
import { useMediaQuery, useDisclosure } from '@mantine/hooks'
import LoadingSkeleton from '../components/profile/LoadingSkeleton'
import LinkedItem from '../components/feed/LinkedItem'
import VideoPlayer from '../components/feed/VideoPlayer'
import SectionPanel from '../components/SectionPanel'
import ProfileHeaderMobile from '../components/profile/ProfileHeaderMobile'
import { 
  IconMoodSad, IconRosetteDiscountCheckFilled,
  IconWorld, IconShieldCheckFilled, IconArrowsMaximize, IconPlus, IconSettings,
  IconCircleArrowLeftFilled, IconCircleArrowRightFilled, IconCheck,
  IconBrandWhatsapp
} from '@tabler/icons-react'
import { truncateString } from '../utils/formatter'
import { isProfileLive } from '../utils/live'
import { SOCIAL_CONFIG } from '../constants/socialConfig'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/pt-br'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

const AVATAR_PATH = 'https://ik.imagekit.io/mublin/tr:h-200,c-maintain_ratio/users/avatars/'

function SectionTitle({ text, mb, mt = 0 }) {
  return <Text fw={600} size="17px" mb={mb} mt={mt}>{text}</Text>
}

export default function Profile() {
  const { username } = useParams()
  const { loading: authLoading, user } = useAuth()
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)
  const [modalBioOpened, { open: openModalBio, close: closeModalBio }] = useDisclosure(false)

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
    queryKey: ['profile-projects', profile?.id],
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
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: workAvailability = [], isLoading: loadingWorkAvailability } = useQuery({
    queryKey: ['user-work-availability', profile?.id],
    queryFn: () => fetchProfileWorkAvailability(profile.id),
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5,
  })

  const { data: workFocus = [], isLoading: loadingWorkFocus } = useQuery({
    queryKey: ['user-work-focus', profile?.id],
    queryFn: () => fetchProfileWorkFocuses(profile.id),
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
      r.roles?.description_ptbr,
      r.role2?.description_ptbr,
      r.role3?.description_ptbr,
    ].filter(Boolean),
  })) || [];

  const roles = profile?.profile_roles.sort((a, b) => b.main_activity - a.main_activity)
  const city = profile?.cities?.name
  const regionUf = profile?.regions?.uf

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
        {isMobile &&
          <ProfileHeaderMobile 
            profile={profile} 
            roles={roles} 
            city={city} 
            regionUf={regionUf} 
            user={user}
          />
        }
        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Group align="center" gap="md" mb="lg" visibleFrom="sm">
              <Indicator 
                position='bottom-center' 
                inline 
                label={<Text size='0.7rem' >Disponível</Text>} 
                color='green' 
                size={18} 
                withBorder 
                disabled={!profile.is_open_to_work}
              >
                <Avatar
                  size={96}
                  src={profile.avatar ? AVATAR_PATH + profile.avatar : undefined}
                />
              </Indicator>
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
                      component={Link}
                      to="/settings/profile"
                      radius="sm"
                      size="compact-xs"
                      variant="default"
                      ml={4}
                    >
                      Editar meu perfil
                    </Button>
                  )}
                </Flex>
                <Flex align="center" gap={4}>
                  <Text size="sm" opacity={0.6}>
                    @{profile.username}
                  </Text>
                  {(city || regionUf) && (
                    <Text size="sm" opacity={0.6}>
                      · {[city, regionUf]
                        .filter(Boolean)
                        .join('/')}
                    </Text>
                  )}
                  {isProfileLive(profile) && (
                    <Group gap={6} ml={10} align="center" wrap="nowrap">
                      <Box component="span" className="live-dot" style={{ flexShrink: 0 }} />
                      <Text 
                        size="11px" 
                        fw={600}
                        c="red.7"
                        tt="uppercase" 
                        lts="0.02em"
                      >
                        Ao vivo em {profile.live_platform}
                      </Text>
                    </Group>
                  )}
                </Flex>
                {profile.title && (
                  <Text size="sm" fw={450} maw={420} lh={1.3} my={3}>
                    {profile.title}
                  </Text>
                )}
                {roles && roles.length > 0 && (
                  <Text size="13px" mt={2} c="dimmed">
                    {roles.map(({ id, roles: role }, index) => (
                      <Text span key={id} c='dimmed'>
                        {role?.name_ptbr}
                        {index < roles.length - 1 ? ', ' : ''}
                      </Text>
                    ))}
                  </Text>
                )}
              </Stack>
            </Group>
            <Stack gap={12}>
              {profile.bio && (
                <Paper px={14} pt={6} pb={10}>
                <Spoiler 
                  maxHeight={66} 
                  showLabel={<Text size='xs' fw={550}>...ver mais</Text>} 
                  hideLabel={<Text size='xs' fw={550}>mostrar menos</Text>}
                  mb={8}
                >
                  <Text size='sm' mt={10} lh={1.3}>
                    {profile.bio}
                  </Text>
                </Spoiler>
                </Paper>
              )}
              {loadingProjects && (
                <>
                  <SectionTitle text="Projetos" mb="0" />
                  <Flex gap={15}>    
                    <Skeleton width={180} height={180} radius="md" />
                    <Skeleton width={180} height={180} radius="md" />
                    <Skeleton width={180} height={180} radius="md" />
                  </Flex>
                </>
              )}
              {profileProjects.length > 0 && (
                <>
                  <SectionTitle text="Projetos" mb="0" />
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
                                  ? `https://ik.imagekit.io/mublin/projects/${item.id}/tr:h-320,w-320,c-maintain_ratio/${item.picture}`
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
              <SectionTitle text="Postagens" mb="0" />
              <Scroller 
                key={profilePosts.length}
                draggable
                controlSize="xl"
                showEndControl={profilePosts.length > 2}
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
                        {post.image && (
                          <Link to={`/post/${post.id}`}>
                            <Image
                              src={`https://ik.imagekit.io/mublin/posts/tr:w-700/${post.image}`}
                              radius="md"
                            />
                          </Link>
                        )}
                        {post.video_url && (
                          <Link to={`/post/${post.id}`}>
                            <VideoPlayer url={post.video_url} thumbnailOnly />
                          </Link>
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
              <SectionTitle 
                text={`Equipamento ${!!gear.length && `(${gear.length})`}`} 
                mt={10}
                mb="0" 
              />
              <Group gap={10} mb={4}>
                {(gear.length > 0 && gearCategories.length > 1) && (
                  <NativeSelect
                    size="sm"
                    w={145}
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
                {!!gear.length && 
                  <Button
                    variant="default"
                    size="sm"
                    aria-label="Gerenciar"
                    component={Link}
                    to={`/${username}/gear`}
                    leftSection={<IconArrowsMaximize size={16} stroke={1.5} />}
                  >
                    Ver tudo
                  </Button>
                }
                {user?.id === profile.id && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      aria-label='Adicionar item'
                      component={Link}
                      to='/new/gear'
                      leftSection={<IconPlus size={16} stroke={1.5} />}
                    >
                      Adicionar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      aria-label='Gerenciar'
                      component={Link} 
                      to='/settings/gear'
                      leftSection={<IconSettings size={16} stroke={1.5} />}
                    >
                      Gerenciar
                    </Button>
                  </>
                )}
              </Group>
              <Paper
                p="sm"
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
                  showEndControl={gear.length > 4}
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
                      <Link to={`/gear/${item.products?.slug}`}>
                        <Image
                          src={'https://ik.imagekit.io/mublin/products/tr:w-240,h-240,cm-pad_resize,bg-FFFFFF,fo-x/'+item.products?.picture}
                          h={120}
                          mah={120}
                          w='auto'
                          fit='contain'
                          mb={10}
                          radius='md'
                        />
                      </Link>
                      <Text size="xs" c="dimmed" fw={500} lineClamp={2}>
                        {item.products?.brands?.name}
                      </Text>
                      <Text size="xs" fw={500} lineClamp={2} style={{ whiteSpace: "pre-wrap" }}>
                        {item.products?.name}
                      </Text>
                    </Flex>
                  ))}
                </Scroller>
                <Divider my="md" />
                <Text fw={600} size="15px">
                  Setups de {profile.full_name} {!!gearSetups.length && `(${gearSetups.length})`}
                </Text>
                {gearSetups.length > 0 && 
                  <Flex gap={16} mt={18}>
                    {gearSetups.map(setup => (
                      <Box key={setup.id}>
                        <Flex  w={60} direction='column' justify="center">
                          <Link to={`/${username}/setup/${setup.id}`}>
                            <Image
                              src={'https://ik.imagekit.io/mublin/users/gear-setups/tr:w-120,h-120/' + setup.image}
                              h={60}
                              mah={60}
                              w='auto'
                              fit='contain'
                              radius='md'
                              mb={4}
                            />
                          </Link>
                          <Text ta='center' fw={550} size='xs' truncate="end">
                            {setup.name}
                          </Text>
                          <Text ta='center' size='xs'>
                            {setup.totalItems ?? 0} itens
                          </Text>
                        </Flex>
                      </Box>
                    ))}
                  </Flex>
                }
              </Paper>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap={10}>
              <SectionPanel>
                <SectionTitle text="Disponibilidade" mb="sm" />
                {isLoadingProfileInfo || loadingWorkAvailability || loadingWorkFocus ? (
                  <Group gap={6} wrap="wrap">
                    {[1, 2, 3, 4, 5].map(i => (
                      // eslint-disable-next-line react-hooks/purity
                      <Skeleton key={i} h={20} w={70 + Math.random() * 20} radius="xl" />
                    ))}
                  </Group>
                ) : (
                  <>
                    <Title order={3} fz="sm" opacity={0.8} fw={300} mt="sm" mb="xs">
                      Tipos de trabalho:
                    </Title>
                    {workAvailability.length > 0 ? (
                      <Group gap={6} wrap="wrap">
                        {workAvailability.map(item => (
                          <Text span size="sm" key={item.id}>
                            <IconCheck color="green" size={10} stroke={4} /> {item.work_types?.name_ptbr}
                          </Text>
                        ))}
                      </Group>
                    ) : (
                      <Text size="sm" c="dimmed">Não informado</Text>
                    )}
                    <Title order={3} fz="sm" opacity={0.8} fw={300} mt="sm" mb="xs">
                      Vínculos de preferência:
                    </Title>
                    {workFocus.length > 0 ? (
                      <Group gap={6} wrap="wrap">
                        {workFocus.map(item => (
                          <Text span size="sm" key={item.id}>
                            <IconCheck color="green" size={10} stroke={4} /> {item.work_focuses?.title_ptbr}
                          </Text>
                        ))}
                      </Group>
                    ) : (
                      <Text size="sm" c="dimmed">Não informado</Text>
                    )}
                  </>
                )}
              </SectionPanel>
              <SectionPanel>
                <SectionTitle text="Contato" mb="sm" />
                {/* Telefone — só exibe se phone_number_is_public */}
                {profile.phone_number && profile.phone_number_is_public && (
                  <Group gap="xs">
                    {profile.phone_number_is_whatsapp ? (
                      <Anchor
                        href={`https://wa.me/${profile.phone_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="never"
                      >
                        <Group gap="xs">
                          <IconBrandWhatsapp size={16} color="var(--mantine-color-green-6)" />
                          <Text size="sm">{profile.phone_number}</Text>
                        </Group>
                      </Anchor>
                    ) : (
                      <>
                        <IconPhone size={16} opacity={0.6} />
                        <Text size="sm">{profile.phone_number}</Text>
                      </>
                    )}
                  </Group>
                )}
              </SectionPanel>
              <SectionPanel>
                <SectionTitle text="Redes" mb="sm" />
                {(profile.profile_social_links.length > 0 || profile.website) && (
                  <Group gap={10} wrap="wrap">
                    {profile.website && (
                      <ActionIcon
                        component="a"
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="light"
                        size="lg"
                        radius="xl"
                        title={profile.website}
                      >
                        <IconWorld size={18} />
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
              </SectionPanel>
              <SectionPanel>
                <SectionTitle text="Mais perfis parecidos" mb="sm" />
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
                            <Text size="xs" lineClamp={1} maw={250}>
                              {p.title}
                            </Text>
                          )}
                          <Text size="xs" c="dimmed" truncate="end" maw={236}>
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
              </SectionPanel>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
      <Modal 
        opened={modalBioOpened} 
        onClose={closeModalBio} 
        title={`Sobre ${profile.full_name}`} 
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {profile.cover_image && 
          <Card shadow={false} padding={0} radius={0} mb={14}>
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
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {profile.bio || 'Nenhuma informação fornecida.'}
        </Text>
      </Modal>
    </>
  )
}
