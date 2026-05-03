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
      project_members (
        id,
        is_founder,
        is_admin,
        is_ex_member,
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
    // .eq('project_members.status', 2)
    // .eq('project_members.is_ex_member', false)
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
