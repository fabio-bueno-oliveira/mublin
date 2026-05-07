import { supabase } from '../lib/supabaseClient'

export async function fetchUserGigs(userId) {
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      `
      id,
      created_at,
      status_request_appliant,
      status_request_gig_owner,
      gig_roles:gig_applications_gig_role_id_fkey (
        id,
        roles ( description_ptbr ),
        experience_levels ( id, name_en )
      ),
      gigs (
        id, title, slug, description,
        projects ( id, name, slug, picture ),
        events ( id, name, date_start, venues ( name, cities ( name, regions ( name, uf ) ) ) )
      )
    `,
    )
    .eq('profile_id', userId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}
