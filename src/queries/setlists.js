import { supabase } from '../lib/supabaseClient'
import { extractSpotifyTrackId } from '../utils/musicLinks'

// Lista as setlists (cabeçalhos) de um projeto, com a contagem de faixas de cada uma
export async function fetchProjectSetlists(projectId) {
  if (!projectId) {
    return []
  }
  const { data, error } = await supabase
    .from('setlists')
    .select('id, name, created_at, setlist_tracks(count)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) {
    throw error
  }
  return (data || []).map((s) => ({
    id: s.id,
    name: s.name,
    created_at: s.created_at,
    track_count: s.setlist_tracks?.[0]?.count ?? 0,
  }))
}

// Cria uma nova setlist (cabeçalho) vinculada ao projeto
export async function createSetlist(projectId, name, userId) {
  const { data, error } = await supabase
    .from('setlists')
    .insert({ project_id: projectId, name, created_by: userId })
    .select('id, name, created_at')
    .single()
  if (error) {
    throw error
  }
  return data
}

// Faixas já vinculadas a uma setlist, ordenadas
export async function fetchSetlistTracks(setlistId) {
  if (!setlistId) {
    return []
  }
  const { data, error } = await supabase
    .from('setlist_tracks')
    .select(
      'id, order_index, notes, tracks(id, title, duration_seconds, is_public, project_id, cover_image, spotify_id, youtube_path)',
    )
    .eq('setlist_id', setlistId)
    .order('order_index', { ascending: true })
  if (error) {
    throw error
  }
  return (data || [])
    .filter((row) => row.tracks)
    .map((row) => ({
      setlist_track_id: row.id,
      order_index: row.order_index,
      notes: row.notes,
      ...row.tracks,
    }))
}

// Tracks disponíveis para adicionar: do próprio projeto OU marcadas como públicas
export async function searchAvailableTracks(projectId, query) {
  if (!projectId) {
    return []
  }
  let request = supabase
    .from('tracks')
    .select('id, title, duration_seconds, is_public, project_id, projects(name)')
    .or(`project_id.eq.${projectId},is_public.eq.true`)
    .order('title', { ascending: true })
    .limit(20)

  if (query?.trim()) {
    request = request.ilike('title', `%${query.trim()}%`)
  }

  const { data, error } = await request
  if (error) {
    throw error
  }
  return data || []
}

// Vincula uma track existente a uma setlist
export async function addTrackToSetlist(setlistId, trackId, orderIndex) {
  const { data, error } = await supabase
    .from('setlist_tracks')
    .insert({ setlist_id: setlistId, track_id: trackId, order_index: orderIndex })
    .select('id, order_index, tracks(id, title, duration_seconds, is_public, project_id)')
    .single()
  if (error) {
    throw error
  }
  return data
}

// Remove uma faixa da setlist (não apaga a track em si, só o vínculo)
export async function removeSetlistTrack(setlistTrackId) {
  const { error } = await supabase
    .from('setlist_tracks')
    .delete()
    .eq('id', setlistTrackId)
  if (error) {
    throw error
  }
}

// Troca a ordem de uma faixa dentro da setlist
export async function updateSetlistTrackOrder(setlistTrackId, newOrderIndex) {
  const { error } = await supabase
    .from('setlist_tracks')
    .update({ order_index: newOrderIndex })
    .eq('id', setlistTrackId)
  if (error) {
    throw error
  }
}

// Cadastro rápido de uma track nova (quando o usuário não encontra a faixa na busca).
// O upload do áudio ainda não foi implementado — file_url fica como placeholder (null).
// spotifyLink aceita link completo, URI (spotify:track:...) ou ID puro — o ID é extraído
// antes de gravar. youtubeLink é salvo como veio (URL completa), sem tentar extrair ID.
export async function createQuickTrack({
  projectId,
  userId,
  title,
  isPublic,
  spotifyLink,
  youtubeLink,
}) {
  const { data, error } = await supabase
    .from('tracks')
    .insert({
      profile_id: userId,
      project_id: projectId,
      title,
      is_public: !!isPublic,
      spotify_id: extractSpotifyTrackId(spotifyLink),
      youtube_path: youtubeLink?.trim() || null,
      file_url: null, // TODO: preencher quando o upload pro Storage for implementado
    })
    .select(
      'id, title, duration_seconds, is_public, project_id, spotify_id, youtube_path',
    )
    .single()
  if (error) {
    throw error
  }
  return data
}
