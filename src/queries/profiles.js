import { supabase } from '../lib/supabaseClient'

export async function fetchProfileDetails(profileUsername) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      is_fake_profile,
      created_at,
      full_name,
      username,
      avatar,
      cover_image,
      title,
      bio,
      city_id,
      region_id,
      is_verified,
      is_legend,
      website,
      is_open_to_work,
      plan,
      is_live,
      live_platform,
      live_expires_at,
      phone_number,
      phone_number_is_public,
      phone_number_is_whatsapp,
      show_availability_info,
      available_from,
      cities (
        name, countries ( name, name_ptbr )
      ),
      regions (
        name, uf
      ),
      profile_social_links (
        id,
        platform,
        handle
      ),
      profile_roles (
        id,
        main_activity,
        roles (
          id,
          name_ptbr,
          name_en,
          description_ptbr,
          instrumentalist
        )
      ),
      profile_genres (
        id,
        main_genre,
        genres (
          id, name
        )
      )
    `,
    )
    .eq('username', profileUsername)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function fetchProfileBasicDetails(profileUsername) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
  id,
  full_name,
  username,
  avatar,
  title,
  is_verified,
  is_legend,
  is_open_to_work,
  plan,
  is_live,
  cities (
    name, countries ( name, name_ptbr )
  ),
  regions (
    name, uf
  )
  `,
    )
    .eq('username', profileUsername)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function fetchCheckFollowing(profileUsername, userUsername) {
  const { data, error } = await supabase
    .rpc('check_following', {
      p_following_id: profileUsername,
      p_follower_id: userUsername,
    })
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchSimilarProfiles(profileId, regionId, limit = 5) {
  const { data, error } = await supabase.rpc('get_similar_profiles_v2', {
    p_profile_id: profileId,
    p_region_id: regionId,
    p_limit: limit,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProfileFeed(profileId, limit = 10) {
  const { data, error } = await supabase
    .from('feed')
    .select(
      `
      id,
      created_at,
      body,
      image,
      video_url,
      comments_disabled,
      linked_gig_id,
      linked_product_id,
      author_profile_id,
      profiles!feed_author_profile_id_fkey (
        username,
        full_name,
        avatar,
        is_verified,
        is_legend
      ),
      gigs (
        id,
        title,
        slug,
        has_remuneration
      ),
      products (
        id,
        name,
        slug,
        picture,
        brands ( name )
      )
    `,
    )
    .eq('author_profile_id', profileId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProfileProjects(profileId) {
  const { data, error } = await supabase
    .from('project_members')
    .select(
      `
      project_id,
      status,
      is_admin,
      is_founder,
      projects ( id, name, slug, picture, description, project_types ( name_ptbr ) )
    `,
    )
    .eq('status', 2)
    .eq('profile_id', profileId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProfileGear(profileId) {
  const { data, error } = await supabase
    .from('profile_gear')
    .select(
      `
      id,
      id_product,
      is_featured,
      is_for_sale,
      products ( id, id_category, name, slug, picture, brands(name) )
    `,
    )
    .eq('id_user', profileId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProfileGearCategories(profileId) {
  const { data, error } = await supabase.rpc('get_profile_gear_categories', {
    p_profile_id: profileId,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProfileGearSetups(profileId) {
  const { data, error } = await supabase.rpc('get_profile_gear_setups', {
    p_profile_id: profileId,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProfileGearExpanded(profileId) {
  const { data, error } = await supabase
    .from('profile_gear')
    .select(
      `
      id,
      id_product,
      is_featured,
      is_for_sale,
      is_currently_using,
      price,
      owner_comments,
      id_tuning,
      tunings ( name_ptbr, description ),
      products (
        id, id_category, name, slug, picture,
        brands ( name, slug, logo ),
        product_categories ( name_ptbr )
      )
    `,
    )
    .eq('id_user', profileId)
    .order('is_featured', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProfileGearSetupNames(profileId) {
  const { data, error } = await supabase
    .from('gear_setup_items')
    .select(
      `
      id_product,
      gear_setups ( id, name )
    `,
    )
    .eq('id_user', profileId)
  if (error) {
    throw new Error(error.message)
  }
  // Agrupa por id_product: { [id_product]: ['Setup A', 'Setup B'] }
  return data.reduce((acc, item) => {
    if (!item.gear_setups?.name) {
      return acc
    }
    if (!acc[item.id_product]) {
      acc[item.id_product] = []
    }
    acc[item.id_product].push(item.gear_setups.name)
    return acc
  }, {})
}

export async function fetchProfileWorkAvailability(profileId) {
  const { data, error } = await supabase
    .from('profile_work_availability')
    .select(
      `
      id,
      avg_rate,
      rate_currency,
      rate_types (
        name_ptbr
      ),
      work_types (
        id, name_ptbr
      )
    `,
    )
    .eq('id_profile', profileId)
  if (error) {
    throw new Error(error.message)
  }
  return data?.sort(
    (a, b) => a.work_types?.name_ptbr?.localeCompare(b.work_types?.name_ptbr ?? '') ?? 0,
  )
}

export async function fetchProfileWorkFocuses(profileId) {
  const { data, error } = await supabase
    .from('profile_work_focus')
    .select(
      `
      id,
      work_focuses (
        id, title_ptbr
      )
    `,
    )
    .eq('id_profile', profileId)
    .order('id', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProfileTravelPreference(profileId) {
  const { data, error } = await supabase
    .from('profile_travel_preference')
    .select(
      `
      id,
      travel_preferences (
        id, label
      )
    `,
    )
    .eq('id_profile', profileId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function fetchProfileInspirations(profileId) {
  const { data, error } = await supabase
    .from('profile_inspirations')
    .select(
      `
      id,
      order_show,
      artists (
        id,
        name,
        slug,
        picture,
        is_band,
        is_verified,
        genre:genres!artists_genre_id_fkey ( name, name_ptbr ),
        countries ( name )
      )
    `,
    )
    .eq('profile_id', profileId)
    .order('order_show', { ascending: true, nullsFirst: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProfilePartners(profileId) {
  const { data, error } = await supabase
    .from('profile_partners')
    .select(
      'id, type, since_year, featured, active, company:brands(id, name, slug, logo)',
    )
    .eq('id_user', profileId)
    .order('since_year', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProfilePortfolio(profileId) {
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
      project:projects (
        id, name, slug, picture, description,
        type:project_types ( name_ptbr ),
        genre:genres ( name_ptbr )
      ),
      artist:artists (
        id,
        name,
        slug,
        picture,
        is_band,
        is_verified,
        genre:genres!artists_genre_id_fkey ( name, name_ptbr ),
        countries ( name )
      ),
      roles:portfolio_roles (
        role:roles ( id, name_ptbr )
      ),
      engagement_types:portfolio_engagement_types (
        engagement_type:project_engagement_types ( id, name_ptbr )
      )
    `,
    )
    .eq('profile_id', profileId)
    .order('order_number', { ascending: true, nullsFirst: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProfileFollowers(profileId) {
  const { data, error } = await supabase
    .from('profile_followers')
    .select(
      `
      id,
      profiles:follower_id ( id, full_name, username, avatar )
    `,
    )
    .eq('following_id', profileId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }
  return data.map((item) => item.profiles).filter(Boolean)
}

export async function fetchProfileFollowingList(profileId) {
  const { data, error } = await supabase
    .from('profile_followers')
    .select(
      `
      id,
      profiles:following_id ( id, full_name, username, avatar )
    `,
    )
    .eq('follower_id', profileId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }
  // Mapeia para simplificar a estrutura no front-end
  return data.map((item) => item.profiles).filter(Boolean)
}

export async function toggleFavorite(profileId, userId, isFavorited) {
  if (profileId === userId) {
    throw new Error('Você não pode favoritar seu próprio perfil.')
  }

  if (isFavorited) {
    const { error } = await supabase
      .from('profile_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('profile_id', profileId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, action: 'unfavorited' }
  }

  const { data, error } = await supabase
    .from('profile_favorites')
    .insert({ user_id: userId, profile_id: profileId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // Corrida entre cliques ou cache desatualizado: o registro já existe.
      // Do ponto de vista do usuário, o objetivo ("estar favoritado") já foi
      // alcançado, então tratamos como sucesso em vez de erro.
      return { success: true, action: 'favorited', alreadyExisted: true }
    }
    throw new Error(error.message)
  }

  return { success: true, action: 'favorited', data }
}

export async function fetchCheckFavorite(profileId, userId) {
  const { data, error } = await supabase
    .from('profile_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchPortfolioUpvotes(profileId, viewerId = null) {
  const { data, error } = await supabase.rpc('get_portfolio_upvotes', {
    p_profile_id: profileId,
    p_viewer_id: viewerId,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function togglePortfolioUpvote(portfolioId, voterId, currentlyUpvoted) {
  if (currentlyUpvoted) {
    const { error } = await supabase
      .from('portfolio_upvotes')
      .delete()
      .eq('portfolio_id', portfolioId)
      .eq('voter_profile_id', voterId)

    if (error) {
      throw new Error(error.message)
    }
    return { success: true, action: 'removed' }
  }

  const { data, error } = await supabase
    .from('portfolio_upvotes')
    .insert({ portfolio_id: portfolioId, voter_profile_id: voterId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: true, action: 'added', alreadyExisted: true }
    }
    throw new Error(error.message)
  }

  return { success: true, action: 'added', data }
}

export async function fetchProfileGearItemById(gearId) {
  const { data, error } = await supabase
    .from('profile_gear')
    .select(
      `
      id,
      id_product,
      is_featured,
      is_for_sale,
      is_currently_using,
      price,
      owner_comments,
      id_tuning,
      tunings ( name_ptbr, description ),
      products (
        id, id_category, name, slug, picture,
        brands ( name, slug, logo ),
        product_categories ( name_ptbr )
      )
    `,
    )
    .eq('id', gearId)
    .single()

  if (error) throw new Error(error.message)
  return data
}
