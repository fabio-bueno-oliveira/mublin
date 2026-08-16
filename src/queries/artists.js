import { supabase } from '../lib/supabaseClient'

export async function checkArtistIsInspiration(userId, artistId) {
  const { data, error } = await supabase
    .from('profile_inspirations')
    .select('id')
    .eq('profile_id', userId)
    .eq('project_id', artistId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return data !== null
}

export async function fetchArtistDetails(slug) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      id,
      name,
      slug,
      picture,
      is_verified,
      is_active_in_business,
      spotify_id,
      instagram,
      apple_music_id,
      youtube_handle,
      project_type:project_types ( name_ptbr, slug ),
      genre:genres!projects_genre_id_fkey ( name, name_ptbr ),
      project_genres ( genre:genres ( name, name_ptbr ) ),
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
    .eq('project_id', artistId)
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
    .eq('project_id', artistId)
    .order('order_show', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchArtistRoles(artistId) {
  const { data, error } = await supabase
    .from('artist_roles')
    .select(
      `
      id,
      is_main_role,
      order_show,
      roles ( name_ptbr, description_ptbr )
    `,
    )
    .eq('project_id', artistId)
    .order('is_main_role', { ascending: false })
    .order('order_show', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }
  return data
}

// Retorna os projects (catálogo mainstream ou não) cujo gênero, principal ou
// adicional, pertence a uma categoria de gênero (genres.id_category), via
// junção many-to-many em project_genres.
export async function fetchArtistsByGenreCategory(categoryId) {
  // 1. quais genres pertencem a essa categoria
  const { data: genres, error: genresError } = await supabase
    .from('genres')
    .select('id')
    .eq('id_category', categoryId)

  if (genresError) {
    throw new Error(genresError.message)
  }

  const genreIds = genres?.map((genre) => genre.id) ?? []
  if (genreIds.length === 0) {
    return []
  }

  // 2. projects vinculados a esses genres via project_genres (!inner filtra
  // só quem tem pelo menos um vínculo dentro da lista), já trazendo as roles
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      id,
      name,
      slug,
      picture,
      is_verified,
      project_type:project_types ( name_ptbr, slug ),
      project_genres!inner ( genre:genres ( name_ptbr ) ),
      artist_roles (
        id,
        is_main_role,
        order_show,
        roles ( name_ptbr, description_ptbr )
      )
    `,
    )
    .in('project_genres.genre_id', genreIds)
    .order('name', { ascending: true })
    .order('is_main_role', { foreignTable: 'artist_roles', ascending: false })
    .order('order_show', { foreignTable: 'artist_roles', ascending: true })

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function searchArtist(keyword) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, name, slug, picture, project_type:project_types ( slug ), genres!projects_genre_id_fkey ( name_ptbr )',
    )
    .ilike('name', `%${keyword}%`)
    .order('name')
    .limit(20)
  if (error) {
    throw new Error(error.message)
  }
  return data
}
