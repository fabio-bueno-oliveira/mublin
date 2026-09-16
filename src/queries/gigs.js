import { supabase } from '../lib/supabaseClient'

export async function fetchGigDetails(gigId) {
  const { data, error } = await supabase
    .from('gigs')
    .select(
      `
      id, created_at, active, 
      title, slug, description,
      has_remuneration,
      time_stage_start, time_stage_end, 
      profiles!gigs_posted_by_fkey ( id, full_name, username, avatar ),
      projects ( id, name, slug, picture, project_types ( name_ptbr ) ),
      events ( id, name, date_start, venues ( name, cities ( name, regions ( name, uf ) ) ) ),
      event_types ( name ),
      dress_code_types ( name ),
      gig_roles (
        id, description, fee, is_filled, is_sub, sub_for,
        roles ( description_ptbr ),
        experience_levels ( id, name_pt ),
        profiles ( avatar, username )
      )
    `,
    )
    .eq('id', gigId)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchGigRoles(gigId) {
  const { data, error } = await supabase
    .from('gigs')
    .select(
      `
      gig_roles (
        id, description, fee, is_filled, is_sub, sub_for,
        roles ( description_ptbr ),
        experience_levels ( id, name_pt ),
        profiles ( avatar, username )
      )
    `,
    )
    .eq('id', gigId)
    .single()

  if (error) {
    throw error
  }
  return data ?? []
}

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
        has_remuneration,
        projects ( id, name, slug, picture, project_types ( name_ptbr ) ),
        events ( id, name, date_start, venues ( name, cities ( name, regions ( name, uf ) ) ) ),
        event_types ( name ),
        dress_code_types ( name )
      )
    `,
    )
    .eq('profile_id', userId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchGigApplicationDetails(userId, gigId) {
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      `
      id,
      created_at,
      status_request_appliant,
      status_request_gig_owner,
      appliant_status:applications_statuses!gig_applications_status_request_appliant_fkey (
        id, status_name_pt, color
      ),
      owner_status:applications_statuses!gig_applications_status_request_gig_owner_fkey (
        id, status_name_pt, color
      ),
      gig_roles:gig_applications_gig_role_id_fkey (
        id,
        roles ( description_ptbr ),
        experience_levels ( id, name_en )
      ),
      gigs (
        id, title, slug, description,
        has_remuneration,
        projects ( id, name, slug, picture, project_types ( name_ptbr ) ),
        events ( id, name, date_start, venues ( name, cities ( name, regions ( name, uf ) ) ) ),
        event_types ( name ),
        dress_code_types ( name )
      )
    `,
    )
    .eq('profile_id', userId)
    .eq('gig_id', gigId)
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchGigsCreatedByMe(userId) {
  const { data, error } = await supabase
    .from('gigs')
    .select('id, title, date')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }
  return data ?? []
}

/**
 * Convites ENVIADOS pelo usuário logado (ele é o dono da gig).
 * Filtramos pelo created_by da tabela gigs.
 */
export async function fetchSentInvitations(userId) {
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      `
      id,
      created_at,
      invitation_description,
      status_request_gig_owner,
      status_request_appliant,
      gigs (
        id,
        date,
        title,
        created_by,
        type:event_types ( name ),
        city:cities ( name ),
        projects ( id, name, slug, picture, project_types ( name_ptbr ) )
      ),
      gig_roles (
        id, description, fee, is_filled, is_sub, sub_for,
        roles ( description_ptbr ),
        experience_levels ( id, name_pt ),
        profiles ( avatar, username )
      ),
      profiles:profile_id (
        id,
        full_name,
        username,
        avatar,
        title
      )
    `,
    )
    .eq('gigs.created_by', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }
  // Filtrar linhas onde gigs não veio (join falhou — owner diferente)
  return (data ?? []).filter((r) => r.gigs !== null)
}

/**
 * Convites RECEBIDOS pelo usuário logado (ele é o profile_id convidado).
 */
export async function fetchReceivedInvitations(userId) {
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      `
      id,
      created_at,
      invitation_description,
      status_request_gig_owner,
      status_request_appliant,
      gigs (
        id,
        date,
        title,
        created_by,
        type:event_types ( name ),
        city:cities ( name ),
        projects ( id, name, slug, picture, project_types ( name_ptbr ) )
      ),
      gig_roles (
        id, description, fee, is_filled, is_sub, sub_for,
        roles ( description_ptbr ),
        experience_levels ( id, name_pt ),
        profiles ( avatar, username )
      ),
      profiles:invited_by (
        id,
        full_name,
        username,
        avatar,
        title
      )
    `,
    )
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }
  return data ?? []
}
