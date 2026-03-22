import { supabase } from '../lib/supabaseClient'

export async function fetchRandomRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, description_ptbr')
    .not('description_ptbr', 'is', null)
    .order('id')
    .limit(30)

  if (error) throw new Error(error.message)

  return data.sort(() => Math.random() - 0.5).slice(0, 15)
}