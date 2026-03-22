import { supabase } from '../lib/supabaseClient'

export async function fetchCityById(cityId) {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name')
    .eq('id', cityId)
    .single()
  if (error) throw new Error(error.message)
  return data
}
