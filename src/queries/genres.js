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
    .select('id, name, name_ptbr, color, color_hex')
    .order('name_ptbr', { ascending: true })

  if (error) {
    throw error
  }
  return data
}

export async function fetchGenreCategoryDetails(genreId) {
  const { data, error } = await supabase
    .from('genre_categories')
    .select('id, name, name_ptbr, color, color_hex')
    .eq('id', genreId)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}
