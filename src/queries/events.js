import { supabase } from '../lib/supabaseClient'

export async function fetchEventTypes() {
  const { data, error } = await supabase
    .from('event_types')
    .select('id, name')
    .order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data.map((t) => ({ value: String(t.id), label: t.name }))
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
