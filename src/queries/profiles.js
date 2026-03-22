import { supabase } from '../lib/supabaseClient'

export async function fetchBasicProfile(profileUsername) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      username,
      avatar,
      bio,
      profile_roles (
        id,
        main_activity,
        roles (
          id,
          name_ptbr,
          name_en,
          description_ptbr,
          instrumentalist
        )
      )
    `)
    .eq('username', profileUsername)
    .single()

  if (error) throw new Error(error.message)

  return data
}
