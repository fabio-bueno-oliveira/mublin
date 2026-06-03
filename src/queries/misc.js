import { supabase } from '../lib/supabaseClient'

export async function fetchAllTravelPreferences() {
  const { data, error } = await supabase
    .from('travel_preferences')
    .select('id, label')
    .order('order_index', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}
