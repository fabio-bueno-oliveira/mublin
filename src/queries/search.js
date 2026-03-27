import { supabase } from '../lib/supabaseClient'

export async function searchProfiles(keyword, userCityId = null) {
  const { data, error } = await supabase.rpc('search_profiles', {
    keyword,
    user_city_id: userCityId
  })
  if (error) throw new Error(error.message)
  return data
}