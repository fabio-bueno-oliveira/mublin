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
export async function createTrackFromExternalResult({
  projectId,
  userId,
  result,
  isCover,
  isPublic,
}) {
  const { data, error } = await supabase
    .from('tracks')
    .insert({
      profile_id: userId,
      project_id: projectId,
      title: result.title,
      duration_seconds: result.duration_seconds,
      cover_image: result.cover_image,
      release_year: result.release_year,
      spotify_id: result.spotify_id,
      is_cover: isCover,
      is_public: isPublic,
      // V1: só preenchemos o nome em texto livre. original_artist_id (FK pra
      // artists) fica pra uma V2, quando dermos match/upsert na tabela artists.
      original_artist_name: isCover ? result.artist : null,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
