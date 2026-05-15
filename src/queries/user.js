import { supabase } from '../lib/supabaseClient'

export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'full_name, bio, username, title, gender, region_id, city_id, website, is_live, live_platform, phone_number, phone_number_is_public, phone_number_is_whatsapp, live_expires_at',
    )
    .eq('id', userId)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchUserRoles(userId) {
  const { data, error } = await supabase
    .from('profile_roles')
    .select('id_role, main_activity, roles(id, name_ptbr)')
    .eq('id_profile', userId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchUserProjects(userId) {
  const { data, error } = await supabase
    .from('project_members')
    .select(
      `
      project_id,
      status,
      is_founder,
      is_ex_member,
      joined_at,
      left_at,
      role_2_id, 
      role_3_id,
      roles!project_members_role_id_fkey ( name_ptbr ),
      projects ( 
        id, name, slug, picture, description,
        foundation_year, end_year,
        activity_status,
        genres ( name ),
        project_types ( name_ptbr ),
        project_members ( status, profiles ( full_name, username, avatar ) ),
        project_statuses ( description_ptbr, color )
      )
    `,
    )
    .eq('profile_id', userId)
    .eq('projects.project_members.status', 2)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchUserGearCount(userId) {
  const { count, error } = await supabase
    .from('profile_gear')
    .select('*', { count: 'exact', head: true })
    .eq('id_user', userId)
  if (error) {
    throw new Error(error.message)
  }
  return count
}

export async function fetchUserGigsCount(userId) {
  const { count, error } = await supabase
    .from('gig_applications')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)
  if (error) {
    throw new Error(error.message)
  }
  return count
}
