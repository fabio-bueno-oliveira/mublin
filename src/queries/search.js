import { supabase } from '../lib/supabaseClient'

export async function searchProfiles(keyword, userCityId = null) {
  const { data, error } = await supabase.rpc('search_profiles', {
    keyword,
    user_city_id: userCityId,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
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

  const mainFilters = words
    .flatMap((word) => [
      `name.ilike.%${word}%`,
      // `real_name.ilike.%${word}%`,
      `slug.ilike.%${word}%`,
    ])
    .join(',')

  const { data, error } = await supabase
    .from('artists')
    .select(
      `
      id, 
      name, 
      real_name, 
      slug, 
      picture, 
      is_band, 
      is_verified,
      artist_roles:artist_roles (
        roles ( id, name_ptbr, name_en )
      )
    `,
    )
    .or(mainFilters)
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(40)

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
