import { supabase } from '../lib/supabaseClient'

export async function fetchSongDetails(slug) {
  const { data, error } = await supabase
    .from('tracks')
    .select(
      `
      id, 
      title,
      duration_seconds,
      cover_image,
      release_year,
      bpm,
      project:projects ( name, slug ),
      musical_key:musical_keys ( name_pt )
      `,
    )
    .eq('slug', slug)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function fetchPublicSong(projectSlug, songSlug) {
  const { data, error } = await supabase
    .from('tracks')
    .select(
      `
      id, slug, title, duration_seconds, cover_image, release_year,
      projects!inner ( id, name, slug, picture ),
      musical_key:musical_keys ( name_pt, short_name ),
      album:albums ( id, title ),
      venue:venues ( id, name, cities ( name, regions ( name, uf ), countries ( name, name_ptbr ) ) )
      `,
    )
    .eq('slug', songSlug)
    .eq('is_public', true)
    .eq('projects.slug', projectSlug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const { projects, ...track } = data
  return { ...track, project: projects }
}

const EXCERPTS_BUCKET = 'mublin-audio-excerpts'

export async function fetchPublicSongAudioPreview(trackId) {
  const { data, error } = await supabase
    .from('audios')
    .select('id, storage_path')
    .eq('track_id', trackId)
    .eq('audio_type', 'excerpt')
    .eq('status', 'approved')
    .eq('is_active', true)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const { data: file } = supabase.storage
    .from(EXCERPTS_BUCKET)
    .getPublicUrl(data.storage_path)

  return { id: data.id, src: file.publicUrl }
}
