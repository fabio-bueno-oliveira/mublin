import { supabase } from '../lib/supabaseClient'

export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      full_name, bio, username, title, 
      gender, region_id, city_id, 
      website, is_live, live_platform, 
      phone_number, phone_number_is_public, phone_number_is_whatsapp,
      live_expires_at
      `,
    )
    .eq('id', userId)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchUserRoles(userId) {
  const { data, error } = await supabase
    .from('profile_roles')
    .select('id, id_role, main_activity, roles(id, name_ptbr, description_ptbr)')
    .eq('id_profile', userId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchUserPortfolio(userId) {
  const { data, error } = await supabase
    .from('portfolio')
    .select(
      `
      id,
      order_number,
      notes,
      project_id,
      artist_id,
      year_start,
      year_end,
      is_sporadic,
      is_mublin_facilitated,
      projects ( id, name, picture ),
      artists ( id, name, picture ),
      portfolio_roles ( role_id, roles ( id, name_ptbr ) ),
      portfolio_engagement_types (
        engagement_type_id,
        project_engagement_types ( id, name_ptbr )
      )
    `,
    )
    .eq('profile_id', userId)
    .order('order_number', { ascending: true, nullsFirst: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchUserProjects(userId) {
  const { data, error } = await supabase
    .from('project_members')
    .select(
      `
      project_id,
      status,
      is_founder,
      is_admin,
      projects (
        id, name, slug, picture, description,
        spotify_id, instagram,
        foundation_year, end_year,
        activity_status,
        genres (
          name,
          primary_category:genre_categories!genres_id_category_fkey (
            id, name_ptbr, color
          ),
          secondary_category:genre_categories!genres_id_category_secondary_fkey (
            id, name_ptbr, color
          )
        ),
        project_types ( name_ptbr ),
        project_members ( status, profiles ( full_name, username, avatar ) ),
        project_statuses ( description_ptbr, color ),
        cities ( name, regions ( name, uf ), countries ( name, name_ptbr ) )
      )
    `,
    )
    .eq('profile_id', userId)
    .eq('projects.project_members.status', 2)
  if (error) {
    throw new Error(error.message)
  }

  // Projetos sem end_year (ativos) primeiro, com end_year (encerrados) por último
  return data.sort((a, b) => {
    const aEnd = a.projects?.end_year ?? null
    const bEnd = b.projects?.end_year ?? null
    if (aEnd === null && bEnd === null) {
      return 0
    }
    if (aEnd === null) {
      return -1
    } // a vem primeiro
    if (bEnd === null) {
      return 1
    } // b vem primeiro
    return aEnd - bEnd // ambos têm end_year: ordena crescente
  })
}

export async function fetchUserGearCount(userId) {
  const { count, error } = await supabase
    .from('profile_gear')
    .select('*', { count: 'exact', head: true })
    .eq('id_user', userId)
  if (error) {
    throw new Error(error.message)
  }
  return count
}

export async function fetchUserGigsCount(userId) {
  const { count, error } = await supabase
    .from('gig_applications')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)
  if (error) {
    throw new Error(error.message)
  }
  return count
}

export async function fetchUserFavoriteProfiles(userId) {
  const { data, error } = await supabase
    .from('profile_favorites')
    .select(
      `
      id,
      created_at,
      note,
      profile:profiles!profile_favorites_profile_id_fkey (
        id,
        username,
        full_name,
        title,
        avatar,
        is_verified,
        is_legend
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function removeFavoriteProfile(profileId, userId) {
  if (profileId === userId) {
    throw new Error('Você não pode desfavoritar seu próprio perfil.')
  }

  const { error, count } = await supabase
    .from('profile_favorites')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('profile_id', profileId)

  if (error) {
    throw new Error(error.message)
  }

  return {
    success: true,
    action: 'unfavorited',
    removed: count > 0,
  }
}

export async function fetchUserFavoriteProducts(userId) {
  const { data, error } = await supabase
    .from('product_favorites')
    .select(
      `
      id,
      created_at,
      note,
      product:products (
        id,
        name,
        slug,
        description,
        picture
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function removeFavoriteProduct(productId, userId) {
  const { error, count } = await supabase
    .from('product_favorites')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) {
    throw new Error(error.message)
  }

  return {
    success: true,
    action: 'unfavorited',
    removed: count > 0,
  }
}

export async function fetchUserProfileOnboarding(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar, bio, city_id, ')
    .eq('id', userId)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}
