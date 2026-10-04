import { useMemo, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import AppNavbarMobile from '../../components/AppNavbarMobile'
import ArtistCard from '../../components/ArtistCard'
import {
  ActionIcon,
  Affix,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Flex,
  Group,
  Image,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import EmptyStageSvg from '../../assets/svg/empty-stage.svg'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchGenreCategoryDetails } from '../../queries/genres'
import { fetchArtistsByGenreCategory } from '../../queries/artists'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

const PROJECTS_PATH =
  'https://ik.imagekit.io/mublin/projects/tr:h-100,w-100,c-maintain_ratio/'

// tiers de popularidade que entram em "Em destaque" (3 = Nacional, 4 = Consagrado, 5 = Global)
const FEATURED_MIN_TIER = 3
// subgênero vira chip de filtro a partir de N projetos
const MIN_ARTISTS_FOR_CHIP = 2
// subgênero ganha uma prateleira própria a partir de N projetos
const MIN_ARTISTS_FOR_SHELF = 3
// quantos avatares aparecem empilhados no hero
const HERO_AVATARS = 5

// sangra o conteúdo até a borda da tela no mobile (compensa o px do Container)
const BLEED_PROPS = {
  mx: { base: 'calc(var(--mantine-spacing-md) * -1)', sm: 0 },
  px: { base: 'md', sm: 0 },
}

const HIDDEN_SCROLLBAR = { overflowX: 'auto', scrollbarWidth: 'none' }

// ---------- helpers ----------

const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR')

// tier mais alto primeiro; empate ou sem tier, ordem alfabética
const byTierThenName = (a, b) =>
  (b.popularity_tier_id ?? 0) - (a.popularity_tier_id ?? 0) || byName(a, b)

function normalizeHex(hex) {
  if (!hex) {
    return null
  }
  const clean = hex.trim().replace(/^#/, '')
  return /^[0-9a-f]{6}$/i.test(clean) ? `#${clean}` : null
}

// escolhe texto claro ou escuro conforme a luminosidade do fundo
function getReadableTextColor(hex) {
  if (!hex) {
    return '#fff'
  }
  const n = parseInt(hex.slice(1), 16)
  const r = n >> 16
  const g = (n >> 8) & 255
  const b = n & 255
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#111' : '#fff'
}

function pluralize(count, one, many) {
  return `${count} ${count === 1 ? one : many}`
}

// ---------- hero ----------

function GenreHero({
  title,
  loading,
  color,
  artistsCount,
  subgenresCount,
  avatarArtists,
}) {
  const bg = normalizeHex(color)
  const fg = getReadableTextColor(bg)
  const extra = Math.max(artistsCount - avatarArtists.length, 0)

  return (
    <Box
      mt={{ base: 0, sm: 'xs' }}
      p={{ base: 'lg', sm: 'xl' }}
      style={{
        // background: bg ?? 'var(--mantine-primary-color-filled)',
        background: 'linear-gradient(96deg, #182cb0, #14248d)',
        color: fg,
        borderRadius: 'var(--mantine-radius-lg)',
      }}
    >
      <Flex justify="space-between" align="flex-end" gap="lg" wrap="wrap">
        <Stack gap={6}>
          {loading && !title ? (
            <Loader size="sm" variant="dots" color={fg} />
          ) : (
            <Title
              order={1}
              fz={{ base: 40, sm: 64 }}
              lh={1}
              lts={-2}
              fw={800}
              c="inherit"
            >
              {title}
            </Title>
          )}
          {artistsCount > 0 && (
            <Text size="sm" c="inherit" style={{ opacity: 0.85 }}>
              {pluralize(artistsCount, 'artista ou projeto', 'artistas e projetos')}
              {subgenresCount > 0 &&
                `, ${pluralize(subgenresCount, 'subgênero', 'subgêneros')}`}
            </Text>
          )}
        </Stack>

        {avatarArtists.length > 0 && (
          <Avatar.Group spacing="sm">
            {avatarArtists.map((artist) => (
              <Avatar
                key={artist.id}
                src={
                  artist.picture
                    ? `${PROJECTS_PATH}${artist.id}/${artist.picture}`
                    : undefined
                }
                alt={artist.name}
                size={44}
                radius="xl"
                // style={{ borderColor: bg ?? 'var(--mantine-primary-color-filled)' }}
              />
            ))}
            {extra > 0 && (
              <Avatar
                size={44}
                radius="xl"
                // style={{ borderColor: bg ?? 'var(--mantine-primary-color-filled)' }}
              >
                +{extra}
              </Avatar>
            )}
          </Avatar.Group>
        )}
      </Flex>
    </Box>
  )
}

// ---------- prateleira com scroll horizontal ----------

function Shelf({ title, onSeeAll, children }) {
  const scrollerRef = useRef(null)

  const scrollByPage = (direction) => {
    const el = scrollerRef.current
    if (!el) {
      return
    }
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <Stack gap="xs" mt="xl">
      <Group justify="space-between" align="center" wrap="nowrap">
        <Title fw={600} size="20px">
          {title}
        </Title>
        <Group gap={4} wrap="nowrap">
          {onSeeAll && (
            <Button variant="subtle" color="gray" size="compact-sm" onClick={onSeeAll}>
              Ver todos
            </Button>
          )}
          <ActionIcon
            variant="light"
            color="gray"
            radius="xl"
            visibleFrom="sm"
            aria-label="Anterior"
            onClick={() => scrollByPage(-1)}
          >
            <IconChevronLeft size={16} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color="gray"
            radius="xl"
            visibleFrom="sm"
            aria-label="Próximo"
            onClick={() => scrollByPage(1)}
          >
            <IconChevronRight size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <Box
        ref={scrollerRef}
        {...BLEED_PROPS}
        style={{
          ...HIDDEN_SCROLLBAR,
          display: 'flex',
          gap: 'var(--mantine-spacing-md)',
          scrollSnapType: 'x proximity',
          paddingBottom: 4,
        }}
      >
        {children}
      </Box>
    </Stack>
  )
}

// ---------- página ----------

export default function SearchGenre() {
  const { genreId } = useParams()
  const categoryId = Number(genreId)
  const [searchParams, setSearchParams] = useSearchParams()
  const subParam = searchParams.get('sub')

  const { data: genreCategory, isLoading: loadingGenreCategory } = useQuery({
    queryKey: ['genre-category-details', genreId],
    queryFn: () => fetchGenreCategoryDetails(genreId),
    enabled: !!genreId,
    staleTime: 1000 * 60 * 10,
  })

  const { data: artists = [], isLoading: loadingArtists } = useQuery({
    queryKey: ['artists-by-genre-category', genreId],
    queryFn: () => fetchArtistsByGenreCategory(genreId),
    enabled: !!genreId,
    staleTime: 1000 * 60 * 10,
  })

  // Destaques: tiers 4 e 5, mais populares primeiro.
  const featured = useMemo(
    () =>
      artists
        .filter((a) => (a.popularity_tier_id ?? 0) >= FEATURED_MIN_TIER)
        .sort(byTierThenName),
    [artists],
  )

  // Subgêneros derivados dos próprios dados. Só entram gêneros que pertencem à
  // categoria atual (evita "Pop" aparecer dentro de Rock só porque um projeto
  // tem os dois) e fica de fora o gênero raiz (ex.: "Rock" dentro de Rock).
  const subgenres = useMemo(() => {
    const rootName = genreCategory?.name_ptbr
    const map = new Map()

    for (const artist of artists) {
      for (const { genre } of artist.project_genres ?? []) {
        if (!genre) {
          continue
        }
        const inCategory =
          genre.id_category === categoryId || genre.id_category_secondary === categoryId
        if (!inCategory || genre.name_ptbr === rootName) {
          continue
        }
        const entry = map.get(genre.id) ?? { ...genre, artists: [] }
        entry.artists.push(artist)
        map.set(genre.id, entry)
      }
    }

    return [...map.values()]
      .map((g) => ({ ...g, artists: [...g.artists].sort(byTierThenName) }))
      .sort(
        (a, b) =>
          b.artists.length - a.artists.length ||
          a.name_ptbr.localeCompare(b.name_ptbr, 'pt-BR'),
      )
  }, [artists, genreCategory, categoryId])

  const chipGenres = useMemo(
    () => subgenres.filter((g) => g.artists.length >= MIN_ARTISTS_FOR_CHIP),
    [subgenres],
  )
  const shelves = useMemo(
    () => subgenres.filter((g) => g.artists.length >= MIN_ARTISTS_FOR_SHELF),
    [subgenres],
  )

  // Filtro ativo vem da URL (?sub=ID). Se o id não existir mais, ignora.
  const activeSub = useMemo(
    () => subgenres.find((g) => String(g.id) === subParam) ?? null,
    [subgenres, subParam],
  )

  const gridArtists = useMemo(
    () => (activeSub ? activeSub.artists : [...artists].sort(byName)),
    [activeSub, artists],
  )

  const heroAvatarArtists = useMemo(() => {
    const source = featured.length ? featured : [...artists].sort(byTierThenName)
    return source.filter((a) => a.picture).slice(0, HERO_AVATARS)
  }, [featured, artists])

  const handleSelectSub = (value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!value || value === 'all') {
          next.delete('sub')
        } else {
          next.set('sub', value)
        }
        return next
      },
      { replace: true },
    )
  }

  const handleSeeAll = (subgenreId) => {
    handleSelectSub(String(subgenreId))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pageTitle = genreCategory?.name_ptbr
  const isEmpty = !loadingArtists && artists.length === 0
  const showShelves = !activeSub && !loadingArtists && artists.length > 0

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{pageTitle ? `${pageTitle} | Mublin` : 'Mublin'}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Página de categoria de música no Mublin" />
      </Helmet>

      <Affix position={{ top: 0, left: 0 }} hiddenFrom="sm">
        <AppNavbarMobile pageName={pageTitle} />
      </Affix>

      <Container size="xl" pt="xs" px={{ base: 'md', sm: 0 }} mt={{ base: 50, sm: 0 }}>
        <GenreHero
          title={pageTitle}
          loading={loadingGenreCategory}
          color={genreCategory?.color_hex}
          artistsCount={artists.length}
          subgenresCount={subgenres.length}
          avatarArtists={heroAvatarArtists}
        />

        {/* chips de subgênero */}
        {chipGenres.length > 0 && (
          <Box mt="md" {...BLEED_PROPS} style={HIDDEN_SCROLLBAR}>
            <Chip.Group
              multiple={false}
              value={activeSub ? String(activeSub.id) : 'all'}
              onChange={handleSelectSub}
            >
              <Group gap="xs" wrap="nowrap">
                <Chip
                  value="all"
                  variant="filled"
                  size="sm"
                  wrapperProps={{ style: { flexShrink: 0 } }}
                >
                  Todos
                </Chip>
                {chipGenres.map((g) => (
                  <Chip
                    key={g.id}
                    value={String(g.id)}
                    variant="filled"
                    size="sm"
                    wrapperProps={{ style: { flexShrink: 0 } }}
                  >
                    {g.name_ptbr}{' '}
                    <Text span fz="xs" inherit style={{ opacity: 0.6 }}>
                      {g.artists.length}
                    </Text>
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </Box>
        )}

        {loadingArtists && <Loader size="sm" variant="dots" color="gray" mt="xl" />}

        {/* prateleiras (só sem filtro ativo) */}
        {showShelves && featured.length > 0 && (
          <Shelf title="Em destaque">
            {featured.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} size="lg" fixedWidth />
            ))}
          </Shelf>
        )}

        {showShelves &&
          shelves.map((g) => (
            <Shelf key={g.id} title={g.name_ptbr} onSeeAll={() => handleSeeAll(g.id)}>
              {g.artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} fixedWidth />
              ))}
            </Shelf>
          ))}

        {/* grid: todos os projetos, ou os do subgênero filtrado */}
        {!loadingArtists && gridArtists.length > 0 && (
          <Stack gap="xs" mt="xl" mb="xl">
            <Group gap="xs" align="baseline">
              <Title fw={600} size="20px">
                {activeSub ? activeSub.name_ptbr : 'Todos os projetos e artistas'}
              </Title>
              <Text size="20px" c="dimmed">
                {gridArtists.length}
              </Text>
            </Group>
            <SimpleGrid
              cols={{ base: 4, sm: 5, md: 7 }}
              spacing="xs"
              verticalSpacing="md"
            >
              {gridArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </SimpleGrid>
          </Stack>
        )}

        {isEmpty && (
          <Stack mt="xl" mb="xl">
            <Text size="sm" c="dimmed">
              Nenhum projeto por aqui no momento
            </Text>
            <Flex justify="center">
              <Image src={EmptyStageSvg} maw={450} w="100%" mt="lg" alt="Palco vazio" />
            </Flex>
          </Stack>
        )}
      </Container>
    </>
  )
}
