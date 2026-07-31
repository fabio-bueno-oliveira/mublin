import { supabase } from '../lib/supabaseClient'

export async function searchProfiles(
  keyword,
  { userCityId = null, page = 1, pageSize = 15 } = {},
) {
  const { data, error } = await supabase.rpc('search_profiles', {
    keyword,
    user_city_id: userCityId,
    result_limit: pageSize,
    result_offset: (page - 1) * pageSize,
  })
  if (error) {
    throw new Error(error.message)
  }
  return {
    results: data,
    total: data?.[0]?.total_count ?? 0,
  }
}

export async function searchProjects(keyword, userCityId = null) {
  const { data, error } = await supabase.rpc('search_projects', {
    keyword,
    user_city_id: userCityId,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function searchGear(keyword) {
  const { data, error } = await supabase.rpc('search_gear', { keyword })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function searchBrands(keyword) {
  const words = keyword
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2)

  if (!words.length) {
    return []
  }

  const filters = words
    .flatMap((word) => [`name.ilike.%${word}%`, `slug.ilike.%${word}%`])
    .join(',')

  const { data, error } = await supabase
    .from('brands')
    .select('id, name, slug, logo, cover, website')
    .or(filters)
    .eq('active', true)
    .order('name', { ascending: true })
    .limit(50)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchRecentSearches(profileId) {
  const { data, error } = await supabase
    .from('search_history')
    .select('id, query, searched_at')
    .eq('profile_id', profileId)
    .order('searched_at', { ascending: false })
    .limit(5)
  if (error) {
    throw new Error(error.message)
  }
  // Remove duplicatas mantendo a mais recente
  const seen = new Set()
  return data.filter((row) => {
    if (seen.has(row.query)) {
      return false
    }
    seen.add(row.query)
    return true
  })
}

export async function saveSearchQuery(profileId, query) {
  if (!query.trim()) {
    return
  }
  const { error } = await supabase
    .from('search_history')
    .insert({ profile_id: profileId, query: query.trim() })
  if (error) {
    throw new Error(error.message)
  }
}

export async function clearSearchHistory(profileId) {
  const { error } = await supabase
    .from('search_history')
    .delete()
    .eq('profile_id', profileId)
  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchRandomSearchPhrase() {
  const { data, error } = await supabase.rpc('get_random_search_phrase')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function searchArtists(keyword) {
  const cleanKeyword = keyword.trim()
  if (!cleanKeyword) {
    return []
  }

  const words = cleanKeyword.split(/\s+/).filter((w) => w.length > 1)
  if (!words.length) {
    return []
  }

  const { data, error } = await supabase.rpc('search_artists', { keywords: words })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchGearOwners(productId, limit = 6) {
  const { data, error } = await supabase
    .from('profile_gear')
    .select(
      `
      profiles (
        id,
        username,
        avatar,
        full_name
      )
    `,
    )
    .eq('id_product', productId)
    .limit(limit)
  if (error) {
    throw new Error(error.message)
  }
  return data.map((r) => r.profiles).filter(Boolean)
}

export async function searchGearCategories(keyword) {
  if (!keyword || keyword.trim().length < 2) {
    return []
  }

  const trimmed = keyword.trim()

  const { data, error } = await supabase
    .from('product_categories')
    .select('id, name_ptbr, name_en, macro_category, macro_category_en, slug')
    .or(`name_ptbr.ilike.%${trimmed}%`)
    .order('macro_category')
    .order('name_ptbr')
    .limit(30)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchRecentProfiles(limit = 10) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      id,
      created_at,
      full_name,
      username,
      avatar,
      title,
      bio,
      city_id,
      region_id,
      is_verified,
      is_open_to_work,
      is_live,
      live_platform,
      live_expires_at,
      cities (
        name, countries ( name, name_ptbr )
      ),
      regions (
        name, uf
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
    .neq('username', 'mublin')
    .eq('is_shadow_hidden', false)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function searchEvents(keyword) {
  if (!keyword || keyword.trim().length < 2) {
    return []
  }

  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id, name, description, slug,
      picture_url,
      is_online, is_free, ticket_price,
      date_start, date_end,
      time_event_start, time_event_end,
      min_age,
      website_url, tickets_url,
      event_type:event_types ( name ),
      privacy:event_privacy_types ( name ),
      author:profiles!events_author_id_fkey ( full_name, username, title, avatar, is_verified ),
      venue:venues (
        name, slug,
        address, address_number, neighborhood,
        latitude, longitude, 
        website_url, capacity,
        venue_type:venue_types ( name ),
        city:cities ( id, name, region:regions ( id, name, uf ) )
      )
    `,
    )
    .ilike('name', `%${keyword.trim()}%`)
    .order('date_start', { ascending: true })
    .limit(30)
  if (error) {
    throw new Error(error.message)
  }
  return data
}
