import { supabase } from '../lib/supabaseClient'

export async function fetchBasicProfile(profileUsername) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      username,
      avatar,
      title,
      bio,
      city_id,
      region_id,
      is_verified,
      is_legend,
      cities (
        name
      ),
      regions (
        name, uf
      ),
      profile_social_links (
        id,
        platform,
        handle
      ),
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

export async function fetchSimilarProfiles(profileId, regionId, limit = 5) {
  const { data, error } = await supabase
    .rpc('get_similar_profiles', {
      p_profile_id: profileId,
      p_region_id:  regionId,
      p_limit:      limit,
    })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchProfileFeed(profileId, limit = 10) {
  const { data, error } = await supabase
    .from('feed')
    .select(`
      id,
      created_at,
      body,
      image,
      video_url,
      comments_disabled,
      linked_gig_id,
      linked_product_id,
      author_profile_id,
      profiles!feed_author_profile_id_fkey (
        username,
        full_name,
        avatar,
        is_verified,
        is_legend
      ),
      gigs (
        id,
        title,
        slug,
        has_remuneration
      ),
      products (
        id,
        name,
        slug,
        picture,
        brands ( name )
      )
    `)
    .eq('author_profile_id', profileId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data
}

export async function fetchProfileProjects(userId) {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      project_id,
      status,
      roles!project_members_role_id_fkey ( name_ptbr ),
      role2:roles!project_members_role_2_id_fkey ( name_ptbr ),
      role3:roles!project_members_role_3_id_fkey ( name_ptbr ),
      projects ( id, name, slug, picture, description, project_types ( name_ptbr ) )
    `)
    .eq('status', 2)
    .eq('profile_id', userId)
  if (error) throw new Error(error.message)
  return data
}
