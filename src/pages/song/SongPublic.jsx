import { Helmet } from 'react-helmet-async'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchPublicSongDetails, fetchPublicSongAudioPreview } from '../../queries/songs'
import {
  Container,
  Flex,
  Card,
  Title,
  Text,
  Skeleton,
  Group,
  Stack,
  Button,
  Paper,
  Avatar,
  SimpleGrid,
} from '@mantine/core'
import {
  IconArrowRight,
  IconAdjustmentsFilled,
  IconDisc,
  IconMetronome,
  IconClef,
} from '@tabler/icons-react'
import SongPreviewButton from '../../components/songs/public/SongPreviewButton'
import { truncateDescription } from '../../utils/formatter'
import { buildSongJsonLd, getSongUrl, getSongCoverUrl } from '../../utils/songSeo'

export default function SongPagePublic() {
  const { projectSlug, songSlug } = useParams()
  const navigate = useNavigate()

  const {
    data: song,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['public-song', projectSlug, songSlug],
    queryFn: () => fetchPublicSongDetails(projectSlug, songSlug),
    enabled: !!songSlug && !!projectSlug,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const { data: audioPreview } = useQuery({
    queryKey: ['public-song-audio-preview', song?.id],
    queryFn: () => fetchPublicSongAudioPreview(song.id),
    enabled: !!song?.id,
    staleTime: 1000 * 60 * 10,
  })

  if (!isLoading && (isError || !song)) {
    return (
      <>
        <Helmet>
          <meta name="robots" content="noindex" />
        </Helmet>
        <Container size="md" py="xl">
          <Text c="dimmed" ta="center">
            Música não encontrada.
          </Text>
        </Container>
      </>
    )
  }

  const CDN_PATH = 'https://ik.imagekit.io/mublin'

  const metaDescription = song
    ? truncateDescription(
        `Confira ${song.title} no Mublin. BPM, equipamentos da gravação, músicos, produtores e mais!`,
      )
    : ''

  const songUrl = song ? getSongUrl(song) : ''
  const jsonLd = song ? buildSongJsonLd(song) : null
  const hasAlbum = song?.album?.id
  const projectImage = `${CDN_PATH}/projects/${song?.project?.id}/tr:h-100,w-100,c-maintain_ratio/${song?.project?.picture}`
  const coverImage = hasAlbum
    ? `${CDN_PATH}/albums/tr:h-200,w-200,c-maintain_ratio/${song?.album?.cover_image}`
    : `${CDN_PATH}/tracks/tr:h-200,w-200,c-maintain_ratio/${song?.cover_image}`

  return (
    <>
      {song && (
        <Helmet>
          <title>{`${song?.title} - música de ${song?.project?.name}`}</title>
          <meta name="description" content={metaDescription} />
          <link rel="canonical" href={songUrl} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Mublin" />
          <meta property="og:title" content={`${song?.title} | Mublin`} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:url" content={songUrl} />
          <meta property="og:locale" content="pt_BR" />
          {getSongCoverUrl(song) && (
            <meta property="og:image" content={getSongCoverUrl(song, 600, hasAlbum)} />
          )}
          {jsonLd && (
            <script type="application/ld+json">
              {JSON.stringify(jsonLd).replace(/</g, '\\u003c')}
            </script>
          )}
        </Helmet>
      )}

      <Container px="lg" size="md" mt={{ base: 20, sm: 26 }}>
        <Group wrap="nowrap" px="xs">
          {isLoading ? (
            <Skeleton radius={false} height={100} width={100} />
          ) : (
            <Avatar
              src={coverImage ? coverImage : null}
              size={100}
              radius={false}
              alt={song?.title || 'Capa da música'}
            />
          )}

          <Stack gap={0}>
            {isLoading ? (
              <>
                <Skeleton height={28} width={200} />
                <Skeleton height={16} width={120} mt={4} />
              </>
            ) : (
              <>
                <Group gap={7} wrap="nowrap">
                  <Title
                    order={1}
                    fz={{
                      base: 24,
                      sm: 32,
                    }}
                    fw={650}
                    lh={1.2}
                  >
                    {song?.title}
                  </Title>
                </Group>
                <Group gap={6} mb={4} align="center">
                  <Text size="sm" c="dimmed">
                    por
                  </Text>
                  <Avatar
                    size={20}
                    radius="xl"
                    src={song?.project?.picture ? projectImage : undefined}
                    name={song?.project?.name}
                  />
                  <Text size="sm" fw={500}>
                    {song?.project?.name}
                  </Text>
                </Group>
                {audioPreview?.src && (
                  <SongPreviewButton
                    key={audioPreview.id}
                    src={audioPreview.src}
                    songName={song.title}
                    onPlay={() => {
                      // aqui entra seu evento de analytics: 'song_preview_play'
                    }}
                  />
                )}
              </>
            )}
          </Stack>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4 }} my="lg">
          <Paper p="xs">
            <Group gap={3} mb={4}>
              <IconClef size={18} />
              <Title order={6} lh={1}>
                Tom original:
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              {isLoading
                ? 'Carregando...'
                : song?.musical_key?.name_pt
                  ? `${song.musical_key.name_pt} (${song.musical_key.short_name})`
                  : 'Não disponível'}
            </Text>
          </Paper>
          <Paper p="xs">
            <Group gap={3} mb={4}>
              <IconMetronome size={18} />
              <Title order={6} lh={1}>
                BPM:
              </Title>
            </Group>
            <Text size="sm" c="dimmed">
              {isLoading ? 'Carregando...' : song?.bpm ? song?.bpm : 'Não disponível'}
            </Text>
            {/* <Anchor component={Link} to={`/login`} size="sm" c="mublinSecondary.5">
              Fazer login para visualizar
            </Anchor> */}
          </Paper>
          <Paper p="xs">
            <Group gap={3} mb={4}>
              <IconAdjustmentsFilled size={18} />
              <Title order={6} lh={1}>
                Local de gravação:
              </Title>
            </Group>
            <Text size="sm" c="dimmed" truncate="end">
              {isLoading
                ? 'Carregando...'
                : song?.venue?.name
                  ? `${song?.venue?.name} (${song?.venue?.cities?.regions?.name})`
                  : 'Não disponível'}
            </Text>
          </Paper>
          <Paper p="xs">
            <Group gap={3} mb={4}>
              <IconDisc size={18} />
              <Title order={6} lh={1}>
                Álbum:
              </Title>
            </Group>
            <Text size="sm" c="dimmed" truncate="end">
              {isLoading
                ? 'Carregando...'
                : song?.album?.title
                  ? `${song.album.title}${song.album.album_type === 'single' ? ' (single)' : ''} • ${song.album.release_year}`
                  : 'Não disponível'}
            </Text>
          </Paper>
        </SimpleGrid>

        {/* <Title order={6} lh={1}>Equipamentos utilizados:</Title>
        {song?.equipment?.length > 0 && (
          <Text size="sm" c="dimmed">
            {song.equipment.join(', ')}
          </Text>
        )} */}

        {/* CTA */}
        <Card mt="md" px="lg" py="md">
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', sm: 'center' }}
            gap="md"
          >
            <Stack gap={2}>
              <Text size="lg">
                Entre para ver mais sobre <b>{song?.title}</b> no Mublin
              </Text>
              <Text size="sm" c="dimmed" visibleFrom="sm">
                Equipamentos relacionados, staff e mais
              </Text>
            </Stack>

            <Button
              variant="filled"
              color="mublinColor"
              size="sm"
              radius="xl"
              style={{ flexShrink: 0 }}
              onClick={() =>
                navigate(
                  `/signup?from=song&block=cta&project=${projectSlug}&song=${songSlug}`,
                )
              }
              rightSection={<IconArrowRight size={14} />}
            >
              Veja músicos, staff e mais
            </Button>
          </Flex>
        </Card>
      </Container>
    </>
  )
}
