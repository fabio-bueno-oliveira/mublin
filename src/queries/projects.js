import { supabase } from '../lib/supabaseClient'

export async function fetchProjectProfile(slug) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      id,
      name,
      slug,
      picture,
      cover_picture,
      logo,
      description,
      purpose,
      on_tour,
      instagram,
      spotify_id,
      soundcloud,
      genres ( id, name_ptbr ),
      project_types ( id, name_ptbr ),
      status:project_statuses ( description_ptbr, color ),
      project_members (
        id,
        is_founder,
        is_admin,
        status,
        profiles (
          id,
          full_name,
          username,
          avatar
        )
      )
    `,
    )
    .eq('slug', slug)
    // .eq('project_members.status', 2)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Normaliza para facilitar o consumo no componente
  return {
    ...data,
    genre: data.genres?.name_ptbr ?? null,
    project_type: data.project_types?.name_ptbr ?? null,
    members: (data.project_members ?? []).map((m) => ({
      id: m.id,
      is_founder: m.is_founder,
      is_admin: m.is_admin,
      joined_at: m.joined_at,
      status: m.status,
      role: m.roles?.name_ptbr ?? null,
      role_2: m.role_2?.name_ptbr ?? null,
      role_3: m.role_3?.name_ptbr ?? null,
      // dados do perfil "achatados"
      profile_id: m.profiles?.id ?? null,
      name: m.profiles?.full_name ?? null,
      username: m.profiles?.username ?? null,
      avatar: m.profiles?.avatar ?? null,
    })),
  }
}

export async function fetchProjectAdmins(projectId) {
  const { data, error } = await supabase
    .from('project_members')
    .select(
      `
      id,
      is_founder,
      status,
      profile:profiles ( id, full_name, username, avatar )
    `,
    )
    .eq('project_id', projectId)
    .eq('status', 2)
    .eq('is_admin', true)

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProjectPeople(projectId) {
  const { data, error } = await supabase
    .from('portfolio')
    .select(
      `
      year_start, year_end, is_sporadic, is_mublin_facilitated,
      profile:profiles ( id, full_name, username, avatar ),
      roles:portfolio_roles (
        role:roles ( id, name_ptbr )
      ),
      engagement_types:portfolio_engagement_types (
        engagement_type:project_engagement_types ( id, name_ptbr )
      )
    `,
    )
    .eq('project_id', projectId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function searchProjectsByName(name) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      id, name,
      slug, picture, description,
      foundation_year, end_year, 
      project_types ( name_ptbr ),
      genres ( id, name_ptbr ),
      cities ( name, regions ( name, uf ), countries ( name, name_ptbr ) ),
      project_members (
        profile_id,
        is_founder,
        status,
        profiles ( id, full_name, username, avatar )
      )
    `,
    )
    .ilike('name', `%${name}%`)
    .eq('project_members.status', 2)
    .limit(10)

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function cancelParticipationRequest(projectId, profileId) {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('profile_id', profileId)
    .eq('status', 1) // garante que só cancela se ainda estiver pendente

  if (error) {
    throw new Error(error.message)
  }
  return true
}

export async function fetchAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, picture, description')
    .order('name')
    .limit(30)

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchRandomOtherProjects(userId) {
  // Primeiro busca os IDs dos projetos que o usuário já participa
  const { data: memberOf, error: memberError } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('profile_id', userId)

  if (memberError) {
    throw new Error(memberError.message)
  }

  const excludedIds = memberOf.map((r) => r.project_id)

  // Depois busca projetos excluindo esses IDs
  const query = supabase
    .from('projects')
    .select('id, name, slug, picture, description')
    .limit(20)

  if (excludedIds.length > 0) {
    query.not('id', 'in', `(${excludedIds.join(',')})`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProjectBackstageInfo(projectSlug) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      id,
      slug,
      name,
      description,
      purpose,
      picture,
      cover_picture,
      on_tour,
      genres ( id, name_ptbr ),
      cities (
        id,
        name,
        regions (
          name, uf
        )
      )
    `,
    )
    .eq('slug', projectSlug)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProjectDashboardInfo(projectSlug) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      id,
      slug,
      name,
      description,
      purpose,
      picture,
      cover_picture,
      on_tour,
      genres ( id, name_ptbr ),
      project_types ( name_ptbr ),
      cities (
        id,
        name,
        regions (
          name, uf
        )
      )
    `,
    )
    .eq('slug', projectSlug)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProjectStatuses() {
  const { data, error } = await supabase
    .from('project_statuses')
    .select('id, description_ptbr, color')
    .order('description_ptbr')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProjectTypes() {
  const { data, error } = await supabase
    .from('project_types')
    .select('id, name_ptbr')
    .order('id, name_ptbr')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProjectForDashbar(slug) {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      id,
      name,
      slug,
      picture,
      logo,
      on_tour,
      genres ( id, name_ptbr ),
      project_types ( id, name_ptbr ),
      project_members (
        id,
        is_founder,
        is_admin,
        joined_at,
        status,
        roles!project_members_role_id_fkey ( id, name_ptbr ),
        role_2:roles!project_members_role_2_id_fkey ( id, name_ptbr ),
        role_3:roles!project_members_role_3_id_fkey ( id, name_ptbr ),
        profiles (
          id,
          full_name,
          username,
          avatar
        )
      )
    `,
    )
    .eq('slug', slug)
    .eq('project_members.status', 2)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Normaliza para facilitar o consumo no componente
  return {
    ...data,
    genre: data.genres?.name_ptbr ?? null,
    project_type: data.project_types?.name_ptbr ?? null,
    members: (data.project_members ?? []).map((m) => ({
      id: m.id,
      is_founder: m.is_founder,
      is_admin: m.is_admin,
      joined_at: m.joined_at,
      status: m.status,
      role: m.roles?.name_ptbr ?? null,
      role_2: m.role_2?.name_ptbr ?? null,
      role_3: m.role_3?.name_ptbr ?? null,
      // dados do perfil "achatados"
      profile_id: m.profiles?.id ?? null,
      name: m.profiles?.full_name ?? null,
      username: m.profiles?.username ?? null,
      avatar: m.profiles?.avatar ?? null,
    })),
  }
}

// ── Solicitação de acesso admin ──────────────────────────

export async function fetchProjectAdminRequests(projectId) {
  const { data, error } = await supabase
    .from('project_admin_requests')
    .select(
      `
      id,
      status,
      created_at,
      profile:profiles!project_admin_requests_profile_id_fkey ( id, full_name, username, avatar ),
      responder:profiles!project_admin_requests_responded_by_fkey ( id, full_name, username )
    `,
    )
    .eq('project_id', projectId)
    .eq('status', 1)
    .order('created_at')

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchMyProjectAdminRequest(projectId, profileId) {
  const { data, error } = await supabase
    .from('project_admin_requests')
    .select('id, status, created_at')
    .eq('project_id', projectId)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function requestProjectAdminAccess(projectId) {
  const { data, error } = await supabase.rpc('request_project_admin_access', {
    p_project_id: projectId,
  })

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function respondProjectAdminRequest(requestId, accept) {
  const { data, error } = await supabase.rpc('respond_project_admin_request', {
    p_request_id: requestId,
    p_accept: accept,
  })

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function updateProjectProfile(projectId, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}
