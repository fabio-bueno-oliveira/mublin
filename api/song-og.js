// api/song-og.js — HTML público de músicas para crawlers.
// Chamado pelo middleware.js apenas para User-Agents de bot, em /song/:projectSlug/:songSlug.
// Espera: /api/song-og?project=<slug-do-projeto>&song=<slug-da-musica>
//
// Mantenha a montagem do JSON-LD alinhada com src/utils/songSeo.js (página no navegador).
import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://mublin.com'
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`
const IMAGEKIT_TRACKS = 'https://ik.imagekit.io/mublin/tracks'
const IMAGEKIT_PROJECTS = 'https://ik.imagekit.io/mublin/projects'

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function shortDescription(value, maxLength = 160) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text

  const slice = text.slice(0, maxLength - 3)
  const lastSpace = slice.lastIndexOf(' ')

  return `${slice.slice(0, lastSpace > 0 ? lastSpace : slice.length).replace(/[.,;:!?-]+$/, '')}...`
}

function isValidSlug(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 200 &&
    !value.includes('/')
  )
}

// 371 segundos -> "PT6M11S" (ISO 8601, exigido pelo schema.org)
function toIsoDuration(totalSeconds) {
  const total = Number(totalSeconds)
  if (!Number.isFinite(total) || total <= 0) return undefined

  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)

  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`
}

// Capa da música: só aceita nome de arquivo no ImageKit. Valores com URL completa
// (capas de terceiros, como Apple/Spotify) são ignorados de propósito.
function getCoverImage(track) {
  const cover = track.cover_image
  if (!cover || /^https?:\/\//i.test(cover)) return null
  return `${IMAGEKIT_TRACKS}/tr:w-600,h-600,c-maintain_ratio/${encodeURIComponent(cover)}`
}

function getProjectImage(project) {
  if (!project.picture) return null
  return `${IMAGEKIT_PROJECTS}/${project.id}/tr:w-600,h-600,c-maintain_ratio/${encodeURIComponent(project.picture)}`
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Método não permitido')
  }

  const projectSlug = req.query.project
  const songSlug = req.query.song

  if (!isValidSlug(projectSlug) || !isValidSlug(songSlug)) {
    return res.status(400).send('Slug inválido')
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).send('Configuração indisponível')
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    // A service role ignora o RLS, então as regras de "público" precisam estar aqui.
    // Devem ser as mesmas da policy de leitura anônima e do sitemap.
    const { data: track, error } = await supabase
      .from('tracks')
      .select(
        `
        id, slug, title, duration_seconds, cover_image, release_year,
        projects!inner ( id, name, slug, picture ),
        musical_key:musical_keys ( name_pt ),
        album:albums ( title ),
        venue:venues ( name, cities ( name, regions ( uf ) ) )
        `,
      )
      .eq('slug', songSlug)
      .eq('is_public', true)
      .eq('projects.slug', projectSlug)
      .eq('projects.is_public', true)
      .eq('projects.is_active', true)
      .maybeSingle()

    if (error) throw error
    if (!track) return res.status(404).send('Música não encontrada')

    const project = track.projects
    const keyName = track.musical_key?.name_pt || null
    const albumTitle = track.album?.title || null
    const venueName = track.venue?.name || null

    // URLs sempre montadas com os slugs do banco
    const projectUrl = `${SITE_URL}/project/${encodeURIComponent(project.slug)}`
    const url = `${SITE_URL}/song/${encodeURIComponent(project.slug)}/${encodeURIComponent(track.slug)}`

    const title = keyName
      ? `${track.title}, ${project.name}: tom original ${keyName} | Mublin`
      : `${track.title}, ${project.name} | Mublin`

    // O BPM fica de fora de propósito: na página ele só aparece para quem está logado.
    const facts = [
      keyName && `Tom original: ${keyName}`,
      albumTitle && `Álbum: ${albumTitle}`,
      venueName && `Gravada em ${venueName}`,
      track.release_year && `Lançada em ${track.release_year}`,
    ].filter(Boolean)

    const description = shortDescription(
      `${track.title}, música de ${project.name} no Mublin.${facts.length ? ` ${facts.join(' · ')}.` : ''}`,
    )

    const coverImage = getCoverImage(track)
    const image = coverImage || getProjectImage(project) || DEFAULT_IMAGE
    // Imagem quadrada (capa ou avatar) fica melhor no card pequeno; só o og-default é largo.
    const twitterCard = image === DEFAULT_IMAGE ? 'summary_large_image' : 'summary'

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'MusicRecording',
          '@id': url,
          url,
          name: track.title,
          inLanguage: 'pt-BR',
          byArtist: {
            '@type': 'MusicGroup',
            name: project.name,
            url: projectUrl,
            image: getProjectImage(project) || undefined,
          },
          duration: toIsoDuration(track.duration_seconds),
          datePublished: track.release_year ? String(track.release_year) : undefined,
          image: coverImage || undefined,
          inAlbum: albumTitle ? { '@type': 'MusicAlbum', name: albumTitle } : undefined,
          recordingOf: keyName
            ? { '@type': 'MusicComposition', name: track.title, musicalKey: keyName }
            : undefined,
          locationCreated: venueName
            ? {
                '@type': 'Place',
                name: venueName,
                address: track.venue?.cities?.name
                  ? {
                      '@type': 'PostalAddress',
                      addressLocality: track.venue.cities.name,
                      addressRegion: track.venue.cities.regions?.uf || undefined,
                    }
                  : undefined,
              }
            : undefined,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Mublin', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: project.name, item: projectUrl },
            { '@type': 'ListItem', position: 3, name: track.title, item: url },
          ],
        },
      ],
    }

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(url)}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Mublin" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:locale" content="pt_BR" />

  <meta name="twitter:card" content="${twitterCard}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />

  <script type="application/ld+json">${safeJsonLd(structuredData)}</script>
</head>
<body>
  <main>
    <h1>${escapeHtml(track.title)}</h1>
    <p>por <a href="${escapeHtml(projectUrl)}">${escapeHtml(project.name)}</a></p>
    ${facts.length ? `<ul>${facts.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>` : ''}
    <p><a href="${escapeHtml(url)}">Ver ${escapeHtml(track.title)} no Mublin</a></p>
  </main>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
    )

    return res.status(200).send(html)
  } catch (error) {
    console.error('song-og:', error)
    return res.status(500).send('Erro ao carregar música')
  }
}
