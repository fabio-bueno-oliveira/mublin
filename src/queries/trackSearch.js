import { supabase } from '../lib/supabaseClient'

// Busca faixas em catálogos externos (Spotify/iTunes/Deezer) via nossa
// function serverless — o front nunca fala direto com essas APIs (evita CORS
// e nunca expõe nenhuma credencial no navegador).
export async function searchExternalTracks(query) {
  const q = (query || '').trim()
  if (q.length < 2) {
    return []
  }

  const res = await fetch(
    `https://mublin.com/api/search-tracks?q=${encodeURIComponent(q)}`,
  )
  if (!res.ok) {
    throw new Error('Falha ao buscar faixas externas')
  }

  const { results } = await res.json()
  return results || []
}

// Cria uma faixa no catálogo do Mublin a partir de um resultado externo
// (Spotify/iTunes/Deezer) escolhido pelo usuário no autocomplete.
export async function createTrackFromExternalResult({ userId, result }) {
  const project = await resolveProjectFromExternalTrack(result)

  const { data, error } = await supabase
    .from('tracks')
    .insert({
      profile_id: userId,
      project_id: project?.id ?? null,
      title: result.title,
      duration_seconds: result.duration_seconds,
      cover_image: result.cover_image,
      release_year: result.release_year,
      spotify_id: result.spotify_id,
      is_public: true,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function findProjectBySpotifyId(spotifyArtistId) {
  if (!spotifyArtistId) {
    return null
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, spotify_id, created_source_id')
    .eq('spotify_id', spotifyArtistId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function createCatalogProject({ name, spotifyArtistId }) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name,
      spotify_id: spotifyArtistId,
      created_source_id: 2,
    })
    .select('id, name, spotify_id, created_source_id')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function resolveProjectFromExternalTrack(result) {
  if (!result.spotify_artist_id) {
    return null
  }

  const existingProject = await findProjectBySpotifyId(result.spotify_artist_id)

  if (existingProject) {
    return existingProject
  }

  return createCatalogProject({
    name: result.artist,
    spotifyArtistId: result.spotify_artist_id,
  })
}
