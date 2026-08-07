import { supabase } from '../lib/supabaseClient'

export async function fetchScenes(limit = 8) {
  const { data, error } = await supabase
    .from('scenes')
    .select(
      `
      id,
      video_url,
      thumbnail_filename,
      caption,
      views_count,
      created_at,
      profile:profiles ( id, full_name, username, avatar )
    `,
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchScenesByProfile(profileId, limit = 20) {
  const { data, error } = await supabase
    .from('scenes')
    .select(
      `
      id,
      video_url,
      thumbnail_filename,
      caption,
      views_count,
      is_active,
      created_at,
      profile:profiles ( id, full_name, username, avatar )
    `,
    )
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }
  return data
}
