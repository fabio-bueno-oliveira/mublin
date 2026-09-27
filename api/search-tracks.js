// api/search-tracks.js
//
// Endpoint de busca de faixas para o autocomplete de setlists (V1).
// Ordem de tentativa: Spotify (opcional, só roda se houver credenciais nas
// env vars) + iTunes (sempre, grátis e sem chave) em paralelo; Deezer entra
// só como fallback se as duas anteriores voltarem com poucos resultados.
//
// Nenhuma dessas chamadas acontece no navegador: tudo roda aqui no servidor,
// então client_secret nunca é exposto e não existe problema de CORS.
//
// Env vars esperadas (Vercel > Settings > Environment Variables):
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET
// Se não forem configuradas, a busca simplesmente ignora o Spotify e segue
// com iTunes/Deezer — nada quebra.

// Cache do token em memória do processo da function. Isso funciona enquanto
// a instância da function estiver "quente" (warm) entre invocações; some em
// cold starts, e aí um novo token é pedido (só 1 chamada extra, sem problema
// pro volume de uma V1). Se o tráfego crescer bastante, mover isso pra uma
// tabela no Supabase ou pro Vercel KV resolve, sem mudar o resto do código.
let spotifyTokenCache = { token: null, expiresAt: 0 }

async function getSpotifyToken() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return null
  }

  const now = Date.now()
  // margem de 60s de segurança antes do token expirar de verdade
  if (spotifyTokenCache.token && spotifyTokenCache.expiresAt > now + 60_000) {
    return spotifyTokenCache.token
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    console.error('[search-tracks] Spotify auth failed', res.status, await res.text())
    return null
  }

  const data = await res.json()
  spotifyTokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  }
  return spotifyTokenCache.token
}

async function searchSpotify(query) {
  const token = await getSpotifyToken()
  if (!token) {
    return []
  }

  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
    query,
  )}&type=track&limit=5`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    console.error('[search-tracks] Spotify search failed', res.status)
    return []
  }

  const data = await res.json()
  const items = data?.tracks?.items || []
  return items.map((t) => ({
    source: 'spotify',
    external_id: t.id,
    spotify_id: t.id,
    title: t.name,
    artist: (t.artists || []).map((a) => a.name).join(', '),
    spotify_artist_id: track.artists[0].id,
    duration_seconds: t.duration_ms ? Math.round(t.duration_ms / 1000) : null,
    cover_image: t.album?.images?.[0]?.url || null,
    release_year: t.album?.release_date
      ? Number(String(t.album.release_date).slice(0, 4)) || null
      : null,
  }))
}

async function searchItunes(query) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    query,
  )}&media=music&entity=song&limit=8`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('[search-tracks] iTunes search failed', res.status)
    return []
  }

  const data = await res.json()
  return (data.results || []).map((t) => ({
    source: 'itunes',
    external_id: String(t.trackId),
    spotify_id: null,
    title: t.trackName,
    artist: t.artistName,
    duration_seconds: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : null,
    // artworkUrl100 vem em 100x100; trocando o pedaço da URL a Apple devolve
    // a mesma capa em resolução maior, sem chamada extra
    cover_image: t.artworkUrl100 ? t.artworkUrl100.replace('100x100', '600x600') : null,
    release_year: t.releaseDate
      ? Number(String(t.releaseDate).slice(0, 4)) || null
      : null,
  }))
}

async function searchDeezer(query) {
  const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=8`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('[search-tracks] Deezer search failed', res.status)
    return []
  }

  const data = await res.json()
  return (data.data || []).map((t) => ({
    source: 'deezer',
    external_id: String(t.id),
    spotify_id: null,
    title: t.title,
    artist: t.artist?.name || '',
    duration_seconds: t.duration || null,
    cover_image: t.album?.cover_big || t.album?.cover_medium || null,
    release_year: null, // Deezer só devolve ano de lançamento no endpoint de álbum
  }))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const q = String(req.query.q || '').trim()
  if (q.length < 2) {
    res.status(200).json({ results: [] })
    return
  }

  const [spotifyResults, itunesResults] = await Promise.all([
    searchSpotify(q).catch((err) => {
      console.error('[search-tracks] spotify error', err)
      return []
    }),
    searchItunes(q).catch((err) => {
      console.error('[search-tracks] itunes error', err)
      return []
    }),
  ])

  let deezerResults = []
  // Deezer só é chamado se as fontes anteriores voltaram pobres em resultado
  // — evita gastar uma chamada externa à toa na maioria das buscas.
  if (spotifyResults.length + itunesResults.length < 4) {
    deezerResults = await searchDeezer(q).catch((err) => {
      console.error('[search-tracks] deezer error', err)
      return []
    })
  }

  const results = [...spotifyResults, ...itunesResults, ...deezerResults].slice(0, 12)

  // Resultado de busca de catálogo público — seguro cachear na edge por um
  // tempo, o que também reduz chamadas repetidas às APIs externas.
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  res.status(200).json({ results })
}
