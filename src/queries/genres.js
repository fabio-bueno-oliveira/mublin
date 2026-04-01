import { supabase } from '../lib/supabaseClient'

export async function fetchGenreCategories() {
  const { data, error } = await supabase
    .from('genre_categories')
    .select('id, name_ptbr')
    .order('name_ptbr')
  if (error) throw new Error(error.message)
  return data
}
