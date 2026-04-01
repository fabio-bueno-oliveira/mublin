import { supabase } from '../lib/supabaseClient'

export async function searchProfiles(keyword, userCityId = null) {
  const { data, error } = await supabase.rpc('search_profiles', {
    keyword,
    user_city_id: userCityId,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function searchProjects(keyword, userCityId = null) {
  const { data, error } = await supabase.rpc('search_projects', {
    keyword,
    user_city_id: userCityId,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function searchGear(keyword) {
  const { data, error } = await supabase.rpc('search_gear', { keyword })
  if (error) throw new Error(error.message)
  return data
}