import { Link } from 'react-router-dom'
import {
  Container,
  Center,
  Group,
  Stack,
  Title,
  Text,
  Card,
  Spoiler,
  Box,
  Avatar,
  Loader,
  ActionIcon,
  Divider,
  em,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconMapPin,
  IconWorld,
  IconBrandInstagram,
  IconBrandSpotify,
  IconBrandApple,
  IconBrandSoundcloud,
} from '@tabler/icons-react'
import { IconBrandMuso } from '../icons/IconBrandMuso'

const AVATAR_MINI2_PATH =
  'https://ik.imagekit.io/mublin/tr:h-22,c-maintain_ratio/users/avatars/'

export default function SectionAbout({ project, isLoading }) {
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`)

  const projectLocation = [
    project?.city?.name,
    project?.city?.regions?.name !== project?.city?.name
      ? project?.city?.regions?.name
      : null,
    project?.city?.regions?.uf,
  ]
    .filter(Boolean)
    .join(', ')

  const hasSocialLinks =
    project?.instagram ||
    project?.spotify_id ||
    project?.soundcloud ||
    project?.website ||
    project?.youtube_handle ||
    project?.apple_music_id ||
    project?.muso_ai_app_url

  return isLoading ? (
    <Center mt={80}>
      <Loader />
    </Center>
  ) : (
    <>
      <Container size="lg" px={{ base: 'sm', sm: 'md' }}>
        <Card withBorder radius="lg" p="lg">
          <Title order={3} fz="lg" fw={600} mb="xs">
            Sobre
          </Title>

          <Stack gap={2} mb="xs">
            <Group gap={2}>
              {/* {project?.foundation_year && (
                    <Text size="xs" c="dimmed">
                      Início das atividades: {project.foundation_year}
                    </Text>
                  )} */}
              {projectLocation && (
                <Group gap={2} wrap="nowrap">
                  <IconMapPin color="gray" size={12} stroke={2} />
                  <Text size="sm" c="dimmed">
                    {projectLocation}
                  </Text>
                  {project?.city?.countries?.name && (
                    <Text size="sm" c="dimmed">
                      ·{' '}
                      {project?.city?.countries?.name_ptbr ??
                        project?.city?.countries?.name}
                    </Text>
                  )}
                </Group>
              )}
            </Group>
          </Stack>

          <Stack gap="xs">
            {project?.description ? (
              <Spoiler
                mb={30}
                maxHeight={85}
                showLabel={
                  <Text size="sm" fw={600} c="var(--mantine-color-text)">
                    Ver mais
                  </Text>
                }
                hideLabel={
                  <Text size="sm" fw={600} c="var(--mantine-color-text)">
                    Ver menos
                  </Text>
                }
              >
                <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                  {project.description}
                </Text>
              </Spoiler>
            ) : (
              <Text size="sm" c="dimmed">
                Descrição não disponível.
              </Text>
            )}

            {project?.purpose && (
              <>
                <Divider my="lg" />

                <Text size="xs" c="dimmed" fw={600} tt="uppercase" lts=".04em" mb={5}>
                  Objetivo do projeto
                </Text>

                <Text size="sm" lh={1.6}>
                  {project.purpose}
                </Text>
              </>
            )}

            {project?.is_verified && (
              <Group gap="sm" mb={4} align="flex-start" wrap="nowrap">
                <IconRosetteDiscountCheck
                  size={22}
                  color="var(--mantine-color-text)"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />

                <Box>
                  <Text size="sm" fw={600} mb={4}>
                    Projeto verificado
                  </Text>
                  <Text size="xs" c="dimmed" lh={1}>
                    A equipe do Mublin confirmou que este projeto é representado por
                    pessoas reais ligadas a ele.
                  </Text>

                  {/* {(project?.verified_at ||
                        project?.verified_method?.method_name_pt) && (
                        <Text size="xs" c="dimmed" mt={4}>
                          {[
                            project?.verified_at &&
                              `Verificado em ${dayjs(project.verified_at).format('DD/MM/YYYY')}`,
                            project?.verified_method?.method_name_pt,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      )} */}
                </Box>
              </Group>
            )}

            {/*
             * SOCIAL
             */}

            {hasSocialLinks && isMobile && <Divider />}

            {project?.website && (
              <Anchor
                href={project?.website}
                target="_blank"
                rel="noopener noreferrer"
                underline="never"
                c="dimmed"
                aria-label={`Abrir website de ${project?.name}`}
                style={{ width: 'fit-content' }}
              >
                <Group gap={6} wrap="nowrap" className="social-link">
                  <IconWorld size={20} style={{ flexShrink: 0 }} />
                  <Text size="sm" lh={1}>
                    {project?.website
                      .replace(/^https?:\/\/(www\.)?/, '')
                      .replace(/\/$/, '')}
                  </Text>
                </Group>
              </Anchor>
            )}

            <Group gap={6} mr="lg" hiddenFrom="sm">
              {project?.muso_ai_app_url && (
                <ActionIcon
                  component="a"
                  href={project.muso_ai_app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  variant="subtle"
                  color="gray"
                  aria-label={`${project.name} no Muso.ai (abre em nova aba)`}
                >
                  <IconBrandMuso
                    stroke={1.6}
                    color="#6BE7C8"
                    style={{ width: '70%', height: '70%' }}
                  />
                </ActionIcon>
              )}
              {project?.apple_music_id && (
                <ActionIcon
                  component="a"
                  href={`https://music.apple.com/br/artist/${project?.apple_music_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  variant="subtle"
                  color="gray"
                  aria-label={`${project.name} no Apple Music (abre em nova aba)`}
                >
                  <IconBrandApple
                    stroke={1.6}
                    color="#a8a8a8"
                    style={{ width: '70%', height: '70%' }}
                  />
                </ActionIcon>
              )}
              {project?.spotify_id && (
                <ActionIcon
                  component="a"
                  href={`https://open.spotify.com/intl-pt/artist/${project?.spotify_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  variant="subtle"
                  color="gray"
                  aria-label={`${project.name} no Spotify (abre em nova aba)`}
                >
                  <IconBrandSpotify
                    stroke={1.6}
                    color="#1ED760"
                    style={{ width: '70%', height: '70%' }}
                  />
                </ActionIcon>
              )}
              {project?.instagram && (
                <ActionIcon
                  component="a"
                  href={`https://instagram.com/${project?.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  variant="subtle"
                  color="gray"
                  aria-label={`${project.name} no Instagram (abre em nova aba)`}
                >
                  <IconBrandInstagram
                    stroke={1.6}
                    color="#C13584"
                    style={{ width: '70%', height: '70%' }}
                  />
                </ActionIcon>
              )}
              {project?.soundcloud && (
                <ActionIcon
                  component="a"
                  href={`https://soundcloud.com/${project.soundcloud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="lg"
                  variant="subtle"
                  color="gray"
                  aria-label={`${project.name} no Soundcloud (abre em nova aba)`}
                >
                  <IconBrandSoundcloud
                    stroke={1.6}
                    color="orange"
                    style={{ width: '70%', height: '70%' }}
                  />
                </ActionIcon>
              )}
            </Group>

            <Divider />

            <Group gap={4} mt={2}>
              <Text size="xs" c="dimmed">
                {/* Cadastrado em {dayjs(project?.created_at).format('DD/MM/YYYY')} */}
                Cadastrado
              </Text>
              {project?.creator?.username && (
                <>
                  <Avatar
                    src={AVATAR_MINI2_PATH + project?.creator?.avatar}
                    size={22}
                    component={Link}
                    to={`/${project?.creator?.username}`}
                    title={project?.creator?.full_name}
                  />
                  <Text size="xs" c="dimmed">
                    por{' '}
                    <Text span fw={600}>
                      {project?.creator?.username}
                    </Text>
                  </Text>
                </>
              )}
            </Group>
          </Stack>
        </Card>
      </Container>
    </>
  )
}
