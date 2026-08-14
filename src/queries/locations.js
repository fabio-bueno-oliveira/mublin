import { supabase } from '../lib/supabaseClient'

export async function fetchRegions() {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name')
    .eq('country_id', 27)
    .order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchCityById(cityId) {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name')
    .eq('id', cityId)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function searchCitiesByName(query, regionId) {
  if (!query || !regionId) {
    return []
  }

  const { data, error } = await supabase.rpc('search_cities_by_name', {
    p_query: query.trim(),
    p_region_id: Number(regionId),
  })

  if (error) {
    console.error('search_cities_by_name error:', error)
    throw new Error(error.message)
  }
  return data
}

export async function searchVenues(keyword) {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, neighborhood, address, cities ( name, regions (name) )')
    .ilike('name', `%${keyword}%`)
    .limit(8)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchVenueDetails(slug) {
  const { data, error } = await supabase
    .from('venues')
    .select(
      `
      id, name, description, 
      picture_url, 
      address, address_number, neighborhood, 
      website_url, instagram_handle,
      capacity, 
      venue_types ( name ),
      cities ( id, name ),
      regions:cities ( regions ( id, name, uf ) )
      `,
    )
    .eq('slug', slug)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}
