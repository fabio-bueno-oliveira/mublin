import { supabase } from '../lib/supabaseClient'

// ── Leitura pública ───────────────────────────────────────

// Usado na página de Search, para destacar uma vaga aleatória entre
// as que estão ativas e não preenchidas. O sorteio roda no Postgres.
export async function fetchRandomProjectOpening() {
  const { data, error } = await supabase.rpc('get_random_project_opening')

  if (error) {
    throw error
  }

  return data?.[0] ?? null
}

// Vagas abertas de um projeto específico (aba "Vagas" pública)
export async function fetchOpenProjectOpenings(projectId) {
  const { data, error } = await supabase
    .from('project_openings')
    .select(
      `
      id,
      description,
      is_paid,
      is_remote,
      role:roles ( id, name_ptbr ),
      engagement_type:project_engagement_types ( id, name_ptbr ),
      rate_type:rate_types ( id, name_ptbr )
    `,
    )
    .eq('project_id', projectId)
    .eq('is_active', true)
    .eq('is_filled', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }
  return data
}

// ── Gerenciamento (aba Admin do projeto) ─────────────────

// Todas as vagas do projeto, inclusive preenchidas/pausadas.
// Depende da policy de RLS que dá acesso total a admins do projeto.
export async function fetchProjectOpenings(projectId) {
  const { data, error } = await supabase
    .from('project_openings')
    .select(
      `
      id,
      title,
      description,
      is_paid,
      fee,
      is_remote,
      is_filled,
      is_active,
      created_at,
      role:roles ( id, name_ptbr ),
      experience_level:experience_levels ( id, name_pt ),
      engagement_type:project_engagement_types ( id, name_ptbr ),
      rate_type:rate_types ( id, name_ptbr )
    `,
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }
  return data
}

export async function createProjectOpening(payload) {
  const { data, error } = await supabase
    .from('project_openings')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw error
  }
  return data
}

export async function updateProjectOpening(id, updates) {
  const { data, error } = await supabase
    .from('project_openings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }
  return data
}

export async function deleteProjectOpening(id) {
  const { error } = await supabase.from('project_openings').delete().eq('id', id)

  if (error) {
    throw error
  }
  return true
}

// ── Lookups do formulário de vaga ─────────────────────────

// Apenas cargos que fazem sentido para uma vaga de projeto (não de gig avulsa)
export async function fetchApplicableRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('id, name_ptbr, instrumentalist')
    .eq('applies_to_a_project', true)
    .order('name_ptbr')

  if (error) {
    throw error
  }
  return data
}

export async function fetchExperienceLevelOptions() {
  const { data, error } = await supabase
    .from('experience_levels')
    .select('id, name_pt')
    .order('id')

  if (error) {
    throw error
  }
  return data
}

export async function fetchProjectEngagementTypeOptions() {
  const { data, error } = await supabase
    .from('project_engagement_types')
    .select('id, name_ptbr')
    .order('id')

  if (error) {
    throw error
  }
  return data
}

export async function fetchRateTypeOptions() {
  const { data, error } = await supabase
    .from('rate_types')
    .select('id, name_ptbr')
    .order('id')

  if (error) {
    throw error
  }
  return data
}
