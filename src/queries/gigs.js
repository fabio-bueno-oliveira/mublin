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
      gigs (
        id, title, slug, description,
        projects ( id, name, slug, picture ),
        events ( id, name, date_start )
      )
    `,
    )
    .eq('profile_id', userId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}
