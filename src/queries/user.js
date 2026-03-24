import { supabase } from '../lib/supabaseClient'

export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('bio, username, region_id, city_id')
    .eq('id', userId)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function fetchUserRoles(userId) {
  const { data, error } = await supabase
    .from('profile_roles')
    .select('id_role, main_activity, roles(id, name_ptbr)')
    .eq('id_profile', userId)
  if (error) throw new Error(error.message)
  return data
}

export async function fetchUserProjects(userId) {
  const { data, error } = await supabase
    .from('project_members')
    .select('project_id, status, projects(id, name, slug, picture, description)')
    .eq('profile_id', userId)
  if (error) throw new Error(error.message)
  return data
}
