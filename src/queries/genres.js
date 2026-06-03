import { supabase } from '../lib/supabaseClient'

export async function fetchAllGenres() {
  const { data, error } = await supabase
    .from('genres')
    .select('id, name_ptbr, id_category')
    .eq('active', true)
    .order('name_ptbr')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchGenreCategories() {
  const { data, error } = await supabase
    .from('genre_categories')
    .select('id, name_ptbr')
    .order('name_ptbr')
  if (error) {
    throw new Error(error.message)
  }
  return data
}
