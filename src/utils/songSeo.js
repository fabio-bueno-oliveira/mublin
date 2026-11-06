// src/utils/songSeo.js
// Tudo que o SEO da página pública de música precisa, em um só lugar.
// Espera o objeto retornado por fetchPublicSong (com `project` já renomeado).

const SITE_URL = 'https://mublin.com'
const IMAGEKIT_TRACKS = 'https://ik.imagekit.io/mublin/tracks'
const IMAGEKIT_ALBUMS = 'https://ik.imagekit.io/mublin/albums'
const IMAGEKIT_PROJECTS = 'https://ik.imagekit.io/mublin/projects'

// URLs sempre montadas com os slugs que vêm do BANCO, não com os da URL acessada.
export const getProjectUrl = (song) =>
  `${SITE_URL}/project/${encodeURIComponent(song.project.slug)}`

export const getSongUrl = (song) =>
  `${SITE_URL}/song/${encodeURIComponent(song.project.slug)}/${encodeURIComponent(song.slug)}`

// Capa da música (ou null). Tamanho em px, quadrada.
export const getSongCoverUrl = (song, size = 600, hasAlbum = false) =>
  song?.cover_image
    ? `${hasAlbum ? IMAGEKIT_ALBUMS : IMAGEKIT_TRACKS}/tr:w-${size},h-${size},c-maintain_ratio/${song.cover_image}`
    : null

// 371 segundos -> "PT6M11S" (formato ISO 8601 que o schema.org exige)
export function toIsoDuration(totalSeconds) {
  const total = Number(totalSeconds)
  if (!Number.isFinite(total) || total <= 0) return undefined

  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)

  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`
}

export function buildSongJsonLd(song) {
  if (!song?.slug || !song?.project?.slug) return null

  const songUrl = getSongUrl(song)
  const projectUrl = getProjectUrl(song)
  const { project, album, venue, musical_key: key } = song

  const artist = {
    '@type': 'MusicGroup',
    name: project.name,
    url: projectUrl,
    image: project.picture
      ? `${IMAGEKIT_PROJECTS}/${project.id}/tr:h-180,w-180,c-maintain_ratio/${project.picture}`
      : undefined,
  }

  const recording = {
    '@type': 'MusicRecording',
    '@id': songUrl,
    url: songUrl,
    name: song.title,
    inLanguage: 'pt-BR',
    byArtist: artist,
    duration: toIsoDuration(song.duration_seconds),
    datePublished: song.release_year ? String(song.release_year) : undefined,
    image: getSongCoverUrl(song) ?? undefined,
    inAlbum: album?.title ? { '@type': 'MusicAlbum', name: album.title } : undefined,

    // O tom pertence à composição, não à gravação, por isso o aninhamento.
    recordingOf: key?.name_pt
      ? { '@type': 'MusicComposition', name: song.title, musicalKey: key.name_pt }
      : undefined,

    // Só nome e cidade, o mesmo que a página já mostra. Nunca endereço.
    locationCreated: venue?.name
      ? {
          '@type': 'Place',
          name: venue.name,
          address: venue.cities?.name
            ? {
                '@type': 'PostalAddress',
                addressLocality: venue.cities.name,
                addressRegion: venue.cities.regions?.uf,
              }
            : undefined,
        }
      : undefined,
  }

  const breadcrumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Mublin', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: project.name, item: projectUrl },
      { '@type': 'ListItem', position: 3, name: song.title, item: songUrl },
    ],
  }

  // Chaves com valor undefined somem no JSON.stringify, então campos
  // ausentes simplesmente não aparecem no resultado.
  return { '@context': 'https://schema.org', '@graph': [recording, breadcrumbs] }
}
