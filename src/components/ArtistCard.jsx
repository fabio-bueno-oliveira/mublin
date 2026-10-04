import { Avatar, Flex, Text } from '@mantine/core'
import { Link } from 'react-router-dom'

const PROJECTS_PATH =
  'https://ik.imagekit.io/mublin/projects/tr:h-160,w-160,c-maintain_ratio/'

// md: usado no grid e nas prateleiras de subgênero
// lg: usado na prateleira "Em destaque"
const SIZES = {
  md: { avatar: 56, width: 96, name: 'xs', role: '11px', genre: '10px' },
  lg: { avatar: 76, width: 112, name: 'sm', role: 'xs', genre: '11px' },
}

function getArtistMainRole(artist) {
  const roles = artist.artist_roles ?? []
  if (!roles.length) {
    return null
  }
  const main = roles.find((role) => role.is_main_role) ?? roles[0]
  return main?.roles?.name_ptbr ?? null
}

function getArtistGenreNames(artist) {
  return (artist.project_genres ?? [])
    .map((pg) => pg.genre?.name_ptbr)
    .filter(Boolean)
    .join(', ')
}

/**
 * @param {object}  props.artist       registro de projects (com artist_roles e project_genres)
 * @param {'md'|'lg'} props.size       tamanho do avatar e dos textos
 * @param {boolean} props.fixedWidth   true dentro de prateleiras com scroll horizontal;
 *                                     false (padrão) ocupa a coluna do grid
 */
export default function ArtistCard({ artist, size = 'md', fixedWidth = false }) {
  const s = SIZES[size] ?? SIZES.md
  const role = getArtistMainRole(artist)
  const genres = getArtistGenreNames(artist)

  return (
    <Flex
      gap={4}
      align="center"
      direction="column"
      component={Link}
      to={`/artist/${artist.slug}`}
      w={fixedWidth ? s.width : '100%'}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        flexShrink: 0,
        scrollSnapAlign: 'start',
      }}
    >
      <Avatar
        src={
          artist.picture ? `${PROJECTS_PATH}${artist.id}/${artist.picture}` : undefined
        }
        alt={artist.name}
        size={s.avatar}
        radius="xl"
      />
      <Flex justify="flex-start" align="center" direction="column" w="100%">
        <Text
          size={s.name}
          truncate="end"
          w="100%"
          ta="center"
          fw={500}
          title={artist.name}
        >
          {artist.name}
        </Text>
        {role && (
          <Text size={s.role} c="dimmed" ta="center" truncate="end" w="100%">
            {role}
          </Text>
        )}
        {genres && (
          <Text size={s.genre} c="dimmed" ta="center" truncate="end" w="100%">
            {genres}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
