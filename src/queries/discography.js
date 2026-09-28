import { supabase } from '../lib/supabaseClient'

// Busca todas as faixas cadastradas para o projeto
export async function fetchProjectTracks(projectId) {
  const { data, error } = await supabase
    .from('tracks')
    .select(
      `
      id,
      title,
      duration_seconds,
      cover_image,
      release_year,
      spotify_id,
      youtube_path,
      soundcloud_id,
      bpm,
      track_number,
      is_instrumental,
      is_public,
      created_at,
      album:albums (
        id,
        title,
        album_type,
        release_year,
        cover_image
      )
    `,
    )
    .eq('project_id', projectId)
    .order('title', { ascending: true })

  if (error) {
    throw error
  }

  return data ?? []
}

// Busca os lançamentos do projeto
export async function fetchProjectAlbums(projectId) {
  const { data, error } = await supabase
    .from('albums')
    .select(
      `
      id,
      title,
      description,
      cover_image,
      release_year,
      album_type,
      is_public,
      created_at,
      updated_at
    `,
    )
    .eq('project_id', projectId)
    .order('release_year', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function createProjectTrack({
  projectId,
  userId,
  title,
  albumId = null,
  trackNumber = null,
  releaseYear = null,
  bpm = null,
  isInstrumental = false,
  isPublic = true,
  spotifyId = null,
  youtubePath = null,
}) {
  const { data, error } = await supabase
    .from('tracks')
    .insert({
      profile_id: userId,
      project_id: projectId,
      title: title.trim(),
      album_id: albumId,
      track_number: trackNumber,
      release_year: releaseYear,
      bpm,
      is_instrumental: isInstrumental,
      is_public: isPublic,
      spotify_id: spotifyId || null,
      youtube_path: youtubePath || null,
    })
    .select(
      `
      id,
      title,
      duration_seconds,
      cover_image,
      release_year,
      spotify_id,
      youtube_path,
      soundcloud_id,
      bpm,
      track_number,
      is_instrumental,
      is_public,
      created_at,
      album:albums (
        id,
        title,
        album_type,
        release_year,
        cover_image
      )
    `,
    )
    .single()

  if (error) {
    throw error
  }

  return data
}
