import { supabase } from '../lib/supabaseClient'

/**
 * Uma "vaga combinada" (guitarrista + backing vocal pra mesma pessoa, por
 * exemplo) gera uma gig_application por função — cada uma com seu próprio id
 * e seu próprio gig_role_id. Pra exibir isso como um convite só, agrupamos
 * aqui as linhas que pertencem ao mesmo combo: mesma gig + mesma "raiz"
 * (gig_roles.primary_role_id, ou o próprio id quando a vaga é a principal).
 *
 * O objeto resultante mantém todos os campos da vaga principal (id,
 * created_at, status, gigs, profiles etc.) — inclusive pra não quebrar nada
 * que já lê essas chaves — e acrescenta:
 *   - applicationIds: os ids de gig_applications de todas as funções do combo
 *   - comboRoles: os gig_roles de todas as funções do combo, principal primeiro
 */
function groupCombinedApplications(rows) {
  // Inclui o profile_id na chave: em fetchSentInvitations, uma vaga aberta pode
  // ter candidaturas de pessoas diferentes pro mesmo gig_role_id — sem isso,
  // duas pessoas distintas concorrendo à mesma vaga seriam agrupadas como se
  // fossem "a mesma pessoa em combo". Em fetchReceivedInvitations é redundante
  // (já filtrado por profile_id), mas não atrapalha.
  const comboKey = (row) => {
    const gr = row.gig_roles
    const rootId = gr?.primary_role_id || gr?.id
    return `${row.gigs?.id ?? row.gig_id}:${rootId}:${row.profiles?.id}`
  }

  const groups = new Map()
  for (const row of rows) {
    const key = comboKey(row)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(row)
  }

  return Array.from(groups.values()).map((group) => {
    const sorted = [...group].sort((a, b) => {
      const aIsPrimary = !a.gig_roles?.primary_role_id
      const bIsPrimary = !b.gig_roles?.primary_role_id
      if (aIsPrimary === bIsPrimary) return 0
      return aIsPrimary ? -1 : 1
    })
    const [primary] = sorted
    return {
      ...primary,
      applicationIds: sorted.map((r) => r.id),
      comboRoles: sorted.map((r) => r.gig_roles),
    }
  })
}

export async function fetchGigDetails(gigId) {
  const { data, error } = await supabase
    .from('gigs')
    .select(
      `
      id, created_at, active, date, 
      title, slug, description,
      has_remuneration,
      is_canceled, canceled_at, canceled_by, cancellation_reason,
      time_stage_start, time_stage_end, 
      profiles!gigs_created_by_fkey ( id, full_name, username, avatar ),
      projects ( id, name, slug, picture, project_types ( name_ptbr ) ),
      venue_name, venue_address,
      venue_city:venue_city_id ( name, regions ( name, uf ) ),
      events ( id, name, slug, date_start ),
      venues ( id, name, slug ),
      event_types ( name ),
      dress_code_types ( name ),
      gig_roles (
        id, description, fee, is_filled, is_sub, sub_for, primary_role_id,
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
      is_canceled, canceled_at, canceled_by, cancellation_reason,
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

/**
 * Todas as candidaturas/vagas do usuário logado nessa gig especificamente.
 * Antes usava .single() — que lança erro sempre que o usuário não tem
 * NENHUMA candidatura pra essa gig (o caso mais comum, já que a maioria de
 * quem visita a página de uma gig não é participante dela) e também
 * quebraria com 2+ linhas, que agora é um cenário válido (vagas combinadas).
 * Por isso agora retorna um array: 0, 1 ou N candidaturas do usuário nessa gig.
 */
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
        id, primary_role_id,
        roles ( description_ptbr ),
        experience_levels ( id, name_en )
      ),
      gigs (
        id, title, slug, description,
        has_remuneration,
      is_canceled, canceled_at, canceled_by, cancellation_reason,
        projects ( id, name, slug, picture, project_types ( name_ptbr ) ),
        events ( id, name, date_start, venues ( name, cities ( name, regions ( name, uf ) ) ) ),
        event_types ( name ),
        dress_code_types ( name )
      )
    `,
    )
    .eq('profile_id', userId)
    .eq('gig_id', gigId)

  if (error) {
    throw new Error(error.message)
  }
  return data ?? []
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
        id, description, fee, is_filled, is_sub, sub_for, primary_role_id,
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
  return groupCombinedApplications((data ?? []).filter((r) => r.gigs !== null))
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
        time_stage_start,
        title,
        created_by,
        type:event_types ( name ),
        city:cities ( name ),
        projects ( id, name, slug, picture, project_types ( name_ptbr ) )
      ),
      gig_roles (
        id, description, fee, is_filled, is_sub, sub_for, primary_role_id,
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
  return groupCombinedApplications(data ?? [])
}

export async function fetchGigInvitationsByGigId(gigId, excludeApplicationId) {
  let query = supabase
    .from('gig_applications')
    .select(
      `
      id,
      status_request_appliant,
      gig_roles!inner ( id, primary_role_id, is_filled, roles ( description_ptbr ) ),
      profiles:profile_id ( id, full_name, username, avatar )
    `,
    )
    .eq('gig_id', gigId)
    .eq('status_request_appliant', 2) // só aceitos
    .eq('gig_roles.is_filled', true) // apenas vagas fechadas
    .order('created_at', { ascending: true })

  if (excludeApplicationId) {
    query = query.neq('id', excludeApplicationId)
  }

  const { data, error } = await query
  if (error) throw error

  // Uma pessoa com funções combinadas aparece aqui uma vez por função — agrupa
  // por pessoa + raiz do combo pra exibir "Fulano — Guitarrista e Backing
  // Vocal" numa linha só, em vez de duas linhas pra mesma pessoa.
  const groups = new Map()
  for (const row of data ?? []) {
    const rootId = row.gig_roles?.primary_role_id || row.gig_roles?.id
    const key = `${row.profiles?.id}:${rootId}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(row)
  }

  return Array.from(groups.values()).map((group) => {
    const sorted = [...group].sort((a, b) => {
      const aIsPrimary = !a.gig_roles?.primary_role_id
      const bIsPrimary = !b.gig_roles?.primary_role_id
      if (aIsPrimary === bIsPrimary) return 0
      return aIsPrimary ? -1 : 1
    })
    const [primary] = sorted
    return {
      ...primary,
      comboRoles: sorted.map((r) => r.gig_roles),
    }
  })
}
