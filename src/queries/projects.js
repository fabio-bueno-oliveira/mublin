import { supabase } from '../lib/supabaseClient'

export async function fetchAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, picture, description')
    .order('name')
    .limit(30)

  if (error) throw new Error(error.message)

  return data
}