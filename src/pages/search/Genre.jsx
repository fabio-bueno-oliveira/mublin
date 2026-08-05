import AppNavbarMobile from '../../components/AppNavbarMobile'
import {
  Container,
  Loader,
  Title,
  Stack,
  Center,
  Flex,
  Affix,
  Box,
  ThemeIcon,
  Text,
  UnstyledButton,
  Divider,
} from '@mantine/core'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchGenreCategoryDetails } from '../../queries/genres'
import { IconMusic } from '@tabler/icons-react'

export default function SearchGenre() {
  const { genreId } = useParams()

  const { data: genreCategory, isLoading: loadingGenreCategory } = useQuery({
    queryKey: ['genre-category-details', genreId],
    queryFn: () => fetchGenreCategoryDetails(genreId),
    enabled: !!genreId,
    staleTime: 1000 * 60 * 10,
  })

  return (
    <>
      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName={genreCategory?.name_ptbr} />
      </Affix>

      <Container size="xl" py="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 62, sm: 0 }}>
        {loadingGenreCategory && <Loader size="sm" variant="dots" color="gray" mt={20} />}

        <Stack gap="xs" mb="xl">
          <Center pos="relative">
            <Box
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 16,
                height: 92,
                border: '1px solid var(--mantine-color-default-border)',
                background: 'var(--mantine-color-body)',
                padding: 0,
                transition:
                  'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease',
              }}
            >
              {/* barra lateral com a cor do gênero */}
              <Box
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: `var(--mantine-color-${genreCategory?.color}-6)`,
                }}
              />
              {/* bolha grande suave */}
              <Box
                aria-hidden
                style={{
                  position: 'absolute',
                  right: -18,
                  bottom: -18,
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: `var(--mantine-color-${genreCategory?.color}-light)`,
                  opacity: 0.4,
                }}
              />
              {/* letra inicial gigante fantasma */}
              <Text
                aria-hidden
                fw={700}
                fz={46}
                lh={1}
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: -4,
                  color: `var(--mantine-color-${genreCategory?.color}-6)`,
                  opacity: 0.09,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {genreCategory?.name_ptbr?.charAt(0)?.toUpperCase()}
              </Text>

              <Flex
                h="100%"
                align="flex-start"
                direction="column"
                justify="center"
                pl={18}
                pr={44}
                gap={2}
                style={{ position: 'relative', zIndex: 1 }}
              >
                <Text
                  fw={700}
                  size="xl"
                  lh={1.15}
                  lineClamp={2}
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {genreCategory?.name_ptbr}
                </Text>
              </Flex>
            </Box>
          </Center>
          <Divider label="Pessoas" my="lg" labelPosition="left" />
          <Divider label="Projetos" my="lg" labelPosition="left" />
          <Divider label="Gigs" my="lg" labelPosition="left" />
        </Stack>
      </Container>
    </>
  )
}
