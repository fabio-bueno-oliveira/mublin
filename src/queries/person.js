import { supabase } from '../lib/supabaseClient'

export async function fetchPersonBasicDetails(slug) {
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
      type:project_types ( name_ptbr, slug ),
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

export async function fetchPersonDetails(slug) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      created_at,
      id,
      name,
      slug,
      picture,
      cover_picture,
      logo,
      description,
      purpose,
      on_tour,
      instagram,
      website,
      is_verified,
      verified_at,
      verified_method:project_verification_methods ( method_name, method_name_pt ),
      is_active_in_business,
      genres ( id, name_ptbr ),
      type:project_types ( id, name_ptbr ),
      activity_status,
      status:project_statuses ( description_ptbr, color ),
      project_members (
        id,
        is_founder,
        is_admin,
        status,
        profiles (
          id,
          full_name,
          username,
          avatar
        )
      )
    `,
    )
    .eq('slug', slug)
    // .eq('project_members.status', 2)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Normaliza para facilitar o consumo no componente
  return {
    ...data,
    genre: data.genres?.name_ptbr ?? null,
    project_type: data.project_types?.name_ptbr ?? null,
    members: (data.project_members ?? []).map((m) => ({
      id: m.id,
      is_founder: m.is_founder,
      is_admin: m.is_admin,
      joined_at: m.joined_at,
      status: m.status,
      role: m.roles?.name_ptbr ?? null,
      role_2: m.role_2?.name_ptbr ?? null,
      role_3: m.role_3?.name_ptbr ?? null,
      // dados do perfil "achatados"
      profile_id: m.profiles?.id ?? null,
      name: m.profiles?.full_name ?? null,
      username: m.profiles?.username ?? null,
      avatar: m.profiles?.avatar ?? null,
    })),
  }
}

export async function fetchPersonInspirated(personId) {
  const { data, error } = await supabase
    .from('profile_inspirations')
    .select(
      `
      id,
      profiles ( id, full_name, username, avatar, title )
    `,
    )
    .eq('project_id', personId)
    .order('created_at', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}
