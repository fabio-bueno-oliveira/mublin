import { supabase } from '../lib/supabaseClient'

export async function fetchUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
      full_name, bio, username, title, 
      gender, region_id, city_id, 
      is_live, live_platform, 
      phone_number, phone_number_is_public, phone_number_is_whatsapp,
      live_expires_at
      `,
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
    .select('id, id_role, main_activity, roles(id, name_ptbr, description_ptbr)')
    .eq('id_profile', userId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchUserRolesCount(userId) {
  const { count, error } = await supabase
    .from('profile_roles')
    .select('id', { count: 'exact', head: true })
    .eq('id_profile', userId)
  if (error) {
    throw new Error(error.message)
  }
  return count ?? 0
}

export async function fetchUserGenres(userId) {
  const { data, error } = await supabase
    .from('profile_genres')
    .select('id, genres(id, name)')
    .eq('id_profile', userId)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchUserGenresCount(userId) {
  const { count, error } = await supabase
    .from('profile_genres')
    .select('id', { count: 'exact', head: true })
    .eq('id_profile', userId)
  if (error) {
    throw new Error(error.message)
  }
  return count ?? 0
}

export async function fetchUserPortfolio(userId) {
  const { data, error } = await supabase
    .from('portfolio')
    .select(
      `
      id,
      order_number,
      notes,
      project_id,
      year_start,
      year_end,
      is_sporadic,
      is_mublin_facilitated,
      projects ( id, name, picture, slug ),
      portfolio_roles ( role_id, roles ( id, name_ptbr ) ),
      portfolio_engagement_types (
        engagement_type_id,
        project_engagement_types ( id, name_ptbr )
      )
    `,
    )
    .eq('profile_id', userId)
    .order('order_number', { ascending: true, nullsFirst: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchUserPortfolioCount(userId) {
  const { count, error } = await supabase
    .from('portfolio')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', userId)
  if (error) {
    throw new Error(error.message)
  }
  return count ?? 0
}

export async function fetchUserProjects(userId) {
  const { data, error } = await supabase
    .from('project_members')
    .select(
      `
      project_id,
      status,
      is_founder,
      is_admin,
      projects (
        id, name, slug, picture, description,
        spotify_id, instagram,
        foundation_year, end_year,
        activity_status,
        genres (
          name,
          primary_category:genre_categories!genres_id_category_fkey (
            id, name_ptbr, color
          ),
          secondary_category:genre_categories!genres_id_category_secondary_fkey (
            id, name_ptbr, color
          )
        ),
        project_types ( name_ptbr ),
        project_members ( status, profiles ( full_name, username, avatar ) ),
        project_statuses ( description_ptbr, color ),
        cities ( name, regions ( name, uf ), countries ( name, name_ptbr ) )
      )
    `,
    )
    .eq('profile_id', userId)
    .eq('projects.project_members.status', 2)
  if (error) {
    throw new Error(error.message)
  }

  return data.sort((a, b) => {
    const aEnd = a.projects?.end_year ?? null
    const bEnd = b.projects?.end_year ?? null
    if (aEnd === null && bEnd === null) {
      return 0
    }
    if (aEnd === null) {
      return -1
    }
    if (bEnd === null) {
      return 1
    }
    return aEnd - bEnd
  })
}

export async function fetchUserAdminProjects(userId) {
  const { data, error } = await supabase
    .from('project_members')
    .select(
      `
      project_id,
      status,
      is_founder,
      is_admin,
      project:projects (
        id, name, slug, picture,
        foundation_year, end_year,
        activity_status,
        genre:genres (
          name,
          primary_category:genre_categories!genres_id_category_fkey (
            id, name_ptbr, color
          ),
          secondary_category:genre_categories!genres_id_category_secondary_fkey (
            id, name_ptbr, color
          )
        ),
        type:project_types ( name_ptbr ),
        members:project_members ( status, profiles ( full_name, username, avatar ) ),
        status:project_statuses ( description_ptbr, color ),
        city:cities ( name, regions ( name, uf ), countries ( name, name_ptbr ) )
      )
    `,
    )
    .eq('profile_id', userId)
    .eq('projects.project_members.status', 2)
    .eq('is_admin', true)
  if (error) {
    throw new Error(error.message)
  }

  return data.sort((a, b) => {
    const aEnd = a.projects?.end_year ?? null
    const bEnd = b.projects?.end_year ?? null
    if (aEnd === null && bEnd === null) {
      return 0
    }
    if (aEnd === null) {
      return -1
    }
    if (bEnd === null) {
      return 1
    }
    return aEnd - bEnd
  })
}

export async function fetchUserGearCount(userId) {
  const { count, error } = await supabase
    .from('profile_gear')
    .select('id', { count: 'exact', head: true })
    .eq('id_user', userId)
  if (error) {
    throw new Error(error.message)
  }
  return count ?? 0
}

export async function fetchUserRecentGear(userId) {
  if (!userId) {
    return null
  }

  const { data, error } = await supabase
    .from('profile_gear')
    .select(
      `
      id,
      created_at,
      id_product,
      photo,
      products (
        id,
        name,
        picture,
        brands (
          name
        )
      )
    `,
    )
    .eq('id_user', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function fetchUserGigsCount(userId) {
  const { count, error } = await supabase
    .from('gig_applications')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', userId)
  if (error) {
    throw new Error(error.message)
  }
  return count ?? 0
}

export async function fetchUserFavoriteProfiles(userId) {
  const { data, error } = await supabase
    .from('profile_favorites')
    .select(
      `
      id,
      created_at,
      note,
      profile:profiles!profile_favorites_profile_id_fkey (
        id,
        username,
        full_name,
        title,
        avatar,
        is_verified
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function removeFavoriteProfile(profileId, userId) {
  if (profileId === userId) {
    throw new Error('Você não pode desfavoritar seu próprio perfil.')
  }

  const { error, count } = await supabase
    .from('profile_favorites')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('profile_id', profileId)

  if (error) {
    throw new Error(error.message)
  }
  return { success: true, action: 'unfavorited', removed: count > 0 }
}

export async function fetchUserFavoriteProducts(userId) {
  const { data, error } = await supabase
    .from('product_favorites')
    .select(
      `
      id,
      created_at,
      note,
      product:products (
        id,
        name,
        slug,
        description,
        picture
      )
    `,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function removeFavoriteProduct(productId, userId) {
  const { error, count } = await supabase
    .from('product_favorites')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) {
    throw new Error(error.message)
  }
  return { success: true, action: 'unfavorited', removed: count > 0 }
}

export async function fetchUserLinks(userId) {
  const { data, error } = await supabase
    .from('profile_links')
    .select('id, label, url, position')
    .eq('profile_id', userId)
    .order('position', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function addProfileLink(profileId, { label, url, position }) {
  const { data, error } = await supabase
    .from('profile_links')
    .insert({ profile_id: profileId, label, url, position })
    .select('id, label, url, position')
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function updateProfileLink(linkId, updates) {
  const { data, error } = await supabase
    .from('profile_links')
    .update(updates)
    .eq('id', linkId)
    .select('id, label, url, position')
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function deleteProfileLink(linkId) {
  const { error } = await supabase.from('profile_links').delete().eq('id', linkId)
  if (error) {
    throw new Error(error.message)
  }
  return { success: true }
}

export async function fetchUserProfileOnboarding(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar, bio, city_id')
    .eq('id', userId)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchUserProfileVisitors(userId) {
  const { data, error } = await supabase.rpc('get_profile_visitors', {
    p_profile_id: userId,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchUserInspirationsCount(profileId) {
  const { count, error } = await supabase
    .from('profile_inspirations')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
  if (error) {
    throw new Error(error.message)
  }
  return count ?? 0
}

export async function fetchUserGigs(userId, limit = 30) {
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      `
      id,
      created_at,
      gig_id,
      gig_role_id,
      status_request_appliant,
      status_request_gig_owner,
      gig:gigs (
        id,
        title,
        date,
        is_canceled,
        canceled_at,
        cancellation_reason
      )
    `,
    )
    .eq('profile_id', userId)
    .eq('status_request_appliant', 2)
    .eq('status_request_gig_owner', 2)
    .order('date', { ascending: false, referencedTable: 'gigs' })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function fetchUserNextGig(userId, fromIsoDate) {
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      `
      id,
      gig:gigs!inner (
        id,
        title,
        date,
        time_stage_start,
        venue_name,
        venue_city:venue_city_id ( name, region:region_id ( name, uf ) ),
        projects ( id, name, slug, picture, project_types ( name_ptbr ) )
      ),
      gig_role:gig_roles (
        id,
        primary_role_id,
        roles ( description_ptbr )
      )
    `,
    )
    .eq('profile_id', userId)
    .eq('status_request_appliant', 2)
    .eq('status_request_gig_owner', 2)
    .gte('gigs.date', fromIsoDate)

  if (error) {
    throw new Error(error.message)
  }

  // Não confiamos em .order()/.limit(1)/.maybeSingle() sobre uma tabela
  // embutida (gigs) — na prática isso não garantia a ordenação real e podia
  // devolver "qualquer" gig que batesse no filtro de data, não a mais
  // próxima (ex: a de amanhã em vez da que já estava rolando hoje).
  // Buscamos todas as gigs de hoje em diante e ordenamos no client por
  // data + horário de início, agrupando por gig (uma vaga combinada gera
  // uma linha por função, todas apontando pra mesma gig).
  const groups = new Map()
  for (const row of data ?? []) {
    const gigId = row.gig?.id
    if (!gigId) {
      continue
    }
    if (!groups.has(gigId)) {
      groups.set(gigId, { id: row.id, gig: row.gig, comboRoles: [] })
    }
    if (row.gig_role) {
      groups.get(gigId).comboRoles.push(row.gig_role)
    }
  }

  const sorted = Array.from(groups.values()).sort((a, b) => {
    const dateDiff = (a.gig?.date || '').localeCompare(b.gig?.date || '')
    if (dateDiff !== 0) {
      return dateDiff
    }
    // mesma data: desempata pelo horário de início (útil se a pessoa tiver
    // mais de uma gig no mesmo dia)
    return (a.gig?.time_stage_start || '').localeCompare(b.gig?.time_stage_start || '')
  })

  if (sorted.length === 0) {
    return null
  }

  const next = sorted[0]
  return {
    ...next,
    // vaga principal primeiro, mesma convenção usada em todo o resto do app
    comboRoles: [...next.comboRoles].sort((a, b) => {
      const aIsPrimary = !a?.primary_role_id
      const bIsPrimary = !b?.primary_role_id
      if (aIsPrimary === bIsPrimary) return 0
      return aIsPrimary ? -1 : 1
    }),
  }
}

export async function fetchUserGigsByDate(userId, isoDate) {
  // isoDate = '2026-10-10'
  const { data, error } = await supabase
    .from('gig_applications')
    .select(
      `
      id,
      gig:gigs!inner (
        id,
        title,
        date,
        time_stage_start,
        time_stage_end,
        is_canceled,
        canceled_at,
        cancellation_reason,
        type:event_types ( name ),
        project:projects ( id, name, slug, picture )
      ),
      gig_role:gig_roles (
        id,
        primary_role_id,
        roles ( description_ptbr )
      )
    `,
    )
    .eq('profile_id', userId)
    .eq('status_request_appliant', 2)
    .eq('status_request_gig_owner', 2)
    .eq('gigs.date', isoDate) // filtra no join

  if (error) throw new Error(error.message)

  // Uma gig com vagas combinadas (mesma pessoa em mais de uma função) gera uma
  // gig_application por função, todas apontando pra mesma gig. Agrupamos por
  // gig.id e juntamos as funções (comboRoles) — vale tanto pra um combo formal
  // (primary_role_id) quanto pra duas vagas independentes da mesma pessoa na
  // mesma gig: nos dois casos, é "essa gig, com essas funções" numa linha só.
  const groups = new Map()
  for (const row of data ?? []) {
    const gigId = row.gig?.id
    if (!gigId) {
      continue
    }
    if (!groups.has(gigId)) {
      groups.set(gigId, { id: row.id, gig: row.gig, comboRoles: [] })
    }
    if (row.gig_role) {
      groups.get(gigId).comboRoles.push(row.gig_role)
    }
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    // vaga principal primeiro (sem primary_role_id), pra exibir "Guitarrista e
    // Backing Vocal" e não o contrário
    comboRoles: [...group.comboRoles].sort((a, b) => {
      const aIsPrimary = !a?.primary_role_id
      const bIsPrimary = !b?.primary_role_id
      if (aIsPrimary === bIsPrimary) return 0
      return aIsPrimary ? -1 : 1
    }),
  }))
}

export async function fetchUserGigGoals(userId) {
  const { data, error } = await supabase
    .from('gig_goals')
    .select(
      `
      id,
      profile_id,
      monthly_total_gigs,
      annual_total_gigs,
      monthly_income,
      annual_income
    `,
    )
    .eq('profile_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function upsertUserGigGoals(userId, goals) {
  const { data, error } = await supabase
    .from('gig_goals')
    .upsert(
      {
        profile_id: userId,
        monthly_total_gigs: goals.monthly_total_gigs,
        annual_total_gigs: goals.annual_total_gigs,
        monthly_income: goals.monthly_income,
        annual_income: goals.annual_income,
      },
      {
        onConflict: 'profile_id',
      },
    )
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
