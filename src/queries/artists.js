import { supabase } from '../lib/supabaseClient'

export async function fetchArtistDetails(slug) {
  const { data, error } = await supabase
    .from('artists')
    .select(
      `
      id,
      name,
      slug,
      picture,
      is_band,
      is_verified,
      is_active_in_business,
      spotify_id,
      instagram,
      apple_music_id,
      youtube_handle,
      genres ( name, name_ptbr ),
      countries ( name )
    `,
    )
    .eq('slug', slug)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchArtistsInspirated(artistId) {
  const { data, error } = await supabase
    .from('profile_inspirations')
    .select(
      `
      id,
      profiles ( id, full_name, username, avatar, title, bio )
    `,
    )
    .eq('artist_id', artistId)
    .order('created_at', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchArtistGear(artistId) {
  const { data, error } = await supabase
    .from('artist_gear')
    .select(
      `
      id,
      is_live_gear,
      is_studio_gear,
      order_show,
      notes,
      products ( id, slug, name, picture, brands ( id, name, slug, logo) ),
      gear_frequencies_of_use ( name_ptbr, name_en )
    `,
    )
    .eq('artist_id', artistId)
    .order('order_show', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}
