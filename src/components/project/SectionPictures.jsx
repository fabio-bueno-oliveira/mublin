import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchProjectPictures } from '../../queries/projects'
import { Container, Image, SimpleGrid, Text, Center, Loader, Stack } from '@mantine/core'
import { Lightbox } from '@mantine/lightbox'
import '@mantine/lightbox/styles.css'

const IK_BASE = 'https://ik.imagekit.io/mublin/projects'

// Monta a URL do ImageKit com transformação opcional de largura
const pictureUrl = (projectId, fileName, width) =>
  `${IK_BASE}/${projectId}/${fileName}${width ? `?tr=w-${width}` : ''}`

export default function SectionImages({ projectId }) {
  const [opened, setOpened] = useState(false)
  const [index, setIndex] = useState(0)

  const { data: pictures = [], isLoading } = useQuery({
    queryKey: ['project-pictures', projectId],
    queryFn: () => fetchProjectPictures(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  })

  const slides = useMemo(
    () =>
      pictures.map((p) => ({
        src: pictureUrl(projectId, p.file_name, 1600),
        thumbSrc: pictureUrl(projectId, p.file_name, 200),
        alt: p.caption || 'Foto do projeto',
        caption: p.caption || undefined,
      })),
    [pictures, projectId],
  )

  if (isLoading) {
    return (
      <Center mt={80}>
        <Loader />
      </Center>
    )
  }

  return (
    <Container size="lg" px={{ base: 'sm', sm: 'md' }}>
      <Lightbox
        opened={opened}
        onClose={() => setOpened(false)}
        slides={slides}
        currentIndex={index}
        onIndexChange={setIndex}
        withThumbnails
        withZoom
        closeOnClickOutside
      />

      {pictures.length > 0 ? (
        <SimpleGrid pl="md" mt="lg" cols={{ base: 3, sm: 4 }}>
          {pictures.map((picture, i) => (
            <Stack justify="center" gap={4}>
              <Image
                key={picture.id}
                src={pictureUrl(projectId, picture.file_name, 600)}
                alt={picture.caption || 'Foto do projeto'}
                radius="md"
                loading="lazy"
                style={{ cursor: 'pointer', aspectRatio: '1 / 1', objectFit: 'cover' }}
                onClick={() => {
                  setIndex(i)
                  setOpened(true)
                }}
              />
              <Text ta="center" size="xs" c="dimmed" lineClamp={1}>
                {picture.caption ? picture.caption : 'Sem legenda'}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      ) : (
        <Text size="sm" c="dimmed" pl="md" mt="lg">
          Nenhuma imagem até o momento
        </Text>
      )}
    </Container>
  )
}
