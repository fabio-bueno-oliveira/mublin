import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import {
  Drawer,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconDisc, IconMusic, IconPlus } from '@tabler/icons-react'
import { fetchProjectTracks, fetchProjectAlbums } from '../../queries/discography'
import TrackForm from '../../components/backstage/discography/TrackForm'

const ALBUM_TYPE_LABELS = {
  album: 'Álbum',
  ep: 'EP',
  single: 'Single',
  compilation: 'Compilação',
}

export default function BackstageDiscography() {
  const { user } = useAuth()
  const { projectId } = useParams()
  const [trackDrawerOpened, { open: openTrackForm, close: closeTrackDrawer }] =
    useDisclosure(false)

  const { data: tracks = [], isLoading: isLoadingTracks } = useQuery({
    queryKey: ['project-discography-tracks', projectId],
    queryFn: () => fetchProjectTracks(projectId),
    enabled: !!projectId,
  })

  const { data: albums = [], isLoading: isLoadingAlbums } = useQuery({
    queryKey: ['project-discography-albums', projectId],
    queryFn: () => fetchProjectAlbums(projectId),
    enabled: !!projectId,
  })

  const isLoading = isLoadingTracks || isLoadingAlbums

  return (
    <>
      <Stack gap="lg">
        <Box>
          <Title order={3} fw={600}>
            Discografia
          </Title>

          <Text size="sm" c="dimmed" mt={4}>
            Gerencie as músicas, lançamentos e arquivos de áudio deste projeto
          </Text>
        </Box>

        <Card withBorder radius="lg" p="lg">
          {isLoading ? (
            <Group justify="center" py="xl">
              <Loader size="sm" />
            </Group>
          ) : (
            <Tabs defaultValue="tracks">
              <Tabs.List>
                <Tabs.Tab value="tracks" leftSection={<IconMusic size={16} />}>
                  Faixas ({tracks.length})
                </Tabs.Tab>

                <Tabs.Tab value="releases" leftSection={<IconDisc size={16} />}>
                  Lançamentos ({albums.length})
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="tracks" pt="lg">
                <Group justify="space-between" mb="lg">
                  <Box>
                    <Text fw={600}>Faixas</Text>
                    <Text size="sm" c="dimmed">
                      Músicas cadastradas no catálogo deste projeto.
                    </Text>
                  </Box>

                  <Button
                    onClick={openTrackForm}
                    leftSection={<IconPlus size={16} />}
                    color="mublinColor"
                  >
                    Nova faixa
                  </Button>
                </Group>

                {tracks.length === 0 ? (
                  <EmptyState
                    icon={IconMusic}
                    title="Nenhuma faixa cadastrada"
                    description="Adicione a primeira música à discografia deste projeto."
                  />
                ) : (
                  <Stack gap="xs">
                    {tracks.map((track) => (
                      <Card key={track.id} withBorder radius="md" padding="sm">
                        <Group justify="space-between">
                          <Box>
                            <Text fw={500}>{track.title}</Text>

                            <Group gap="xs" mt={3}>
                              {track.release_year && (
                                <Text size="xs" c="dimmed">
                                  {track.release_year}
                                </Text>
                              )}

                              <Badge
                                size="xs"
                                variant="light"
                                color={track.is_public ? 'green' : 'gray'}
                              >
                                {track.is_public ? 'Pública' : 'Privada'}
                              </Badge>
                            </Group>
                          </Box>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="releases" pt="lg">
                <Group justify="space-between" mb="lg">
                  <Box>
                    <Text fw={600}>Lançamentos</Text>
                    <Text size="sm" c="dimmed">
                      Álbuns, EPs, singles e compilações do projeto.
                    </Text>
                  </Box>

                  <Button leftSection={<IconPlus size={16} />} color="mublinColor">
                    Novo lançamento
                  </Button>
                </Group>

                {albums.length === 0 ? (
                  <EmptyState
                    icon={IconDisc}
                    title="Nenhum lançamento cadastrado"
                    description="Cadastre álbuns, EPs, singles ou compilações."
                  />
                ) : (
                  <Stack gap="xs">
                    {albums.map((album) => (
                      <Card key={album.id} withBorder radius="md" padding="sm">
                        <Group justify="space-between">
                          <Box>
                            <Text fw={500}>{album.title}</Text>

                            <Group gap="xs" mt={3}>
                              <Badge size="xs" variant="light">
                                {ALBUM_TYPE_LABELS[album.album_type] ?? album.album_type}
                              </Badge>

                              {album.release_year && (
                                <Text size="xs" c="dimmed">
                                  {album.release_year}
                                </Text>
                              )}
                            </Group>
                          </Box>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Tabs.Panel>
            </Tabs>
          )}
        </Card>
      </Stack>
      <Drawer
        opened={trackDrawerOpened}
        onClose={closeTrackDrawer}
        title="Nova faixa"
        position="right"
        size="md"
      >
        <TrackForm
          projectId={projectId}
          userId={user?.id}
          albums={albums}
          onSuccess={closeTrackDrawer}
          onCancel={closeTrackDrawer}
        />
      </Drawer>
    </>
  )
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <Stack align="center" gap="xs" py="xl">
      <Icon size={36} stroke={1.5} />

      <Text fw={600}>{title}</Text>

      <Text size="sm" c="dimmed" ta="center">
        {description}
      </Text>
    </Stack>
  )
}
