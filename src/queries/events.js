import { supabase } from '../lib/supabaseClient'

export async function fetchEvents(limit) {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id, name, description, slug,
      picture_url,
      is_online, is_free, ticket_price,
      date_start, date_end,
      time_event_start, time_event_end,
      min_age,
      website_url, tickets_url,
      event_type:event_types ( name ),
      privacy:event_privacy_types ( name ),
      author:profiles!events_author_id_fkey ( full_name, username, title, avatar, is_verified ),
      venue:venues (
        name, slug,
        address, address_number, neighborhood,
        latitude, longitude, 
        website_url, capacity,
        venue_type:venue_types ( name ),
        city:cities ( id, name, region:regions ( id, name, uf ) )
      )
    `,
    )
    .order('date_start', { ascending: true })
    .limit(limit)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchEventDetails(slug) {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id, name, description, slug,
      picture_url,
      is_online, is_free, ticket_price,
      date_start, date_end,
      time_event_start, time_event_end,
      min_age,
      instagram_handle, website_url, tickets_url,
      event_type:event_types ( name ),
      privacy:event_privacy_types ( name ),
      author:profiles!events_author_id_fkey ( full_name, username, title, avatar, is_verified ),
      venue:venues (
        name, slug,
        address, address_number, neighborhood,
        latitude, longitude, 
        website_url, capacity,
        venue_type:venue_types ( name ),
        city:cities ( id, name, region:regions ( id, name, uf ) )
      )
      `,
    )
    .eq('slug', slug)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function fetchEventGigs(eventId) {
  const { data, error } = await supabase
    .from('gigs')
    .select(
      `
      id, created_at, active, 
      title, slug, description,
      has_remuneration,
      time_stage_start, time_stage_end, 
      profiles!gigs_created_by_fkey ( id, full_name, username, avatar ),
      project:projects ( id, name, slug, picture, type:project_types ( name_ptbr ) ),
      events ( id, name, date_start, venues ( name, cities ( name, regions ( name, uf ) ) ) ),
      event_types ( name ),
      dress_code:dress_code_types ( name ),
      roles:gig_roles (
        id, description, fee, is_filled, is_sub, sub_for,
        role:roles ( description_ptbr ),
        experience:experience_levels ( id, name_pt ),
        profile:profiles ( avatar, username )
      )
    `,
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchEventTypes() {
  const { data, error } = await supabase
    .from('event_types')
    .select('id, name')
    .order('name')
  if (error) {
    throw new Error(error.message)
  }
  return data.map((t) => ({ value: String(t.id), label: t.name }))
}

export async function searchVenues(keyword) {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, neighborhood, address, cities ( name, regions (name, uf) )')
    .ilike('name', `%${keyword}%`)
    .limit(8)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// Busca pessoas com interesse no evento
export async function fetchEventAttendees(eventId) {
  const { data, error } = await supabase
    .from('event_interest')
    .select(
      `
      id,
      is_interested,
      is_confirmed,
      user:profiles!event_interest_user_id_fkey (
        id,
        full_name,
        username,
        avatar,
        is_verified,
        title
      ),
      types:event_interest_to_types (
        type:event_interest_types ( id, name )
      )
    `,
    )
    .eq('event_id', eventId)
    .eq('is_interested', true)
    .order('is_confirmed', { ascending: false }) // confirmados primeiro
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  // Flatten pra facilitar
  return data.map((item) => ({
    id: item.user.id,
    full_name: item.user.full_name,
    username: item.user.username,
    avatar: item.user.avatar,
    title: item.user.title,
    is_confirmed: item.is_confirmed,
    interests: item.types.map((t) => t.type.name),
  }))
}

// Busca tipos de interesse disponíveis
export async function fetchInterestTypes() {
  const { data, error } = await supabase
    .from('event_interest_types')
    .select('id, name, description')
    .order('sort_order')

  if (error) {
    throw new Error(error.message)
  }
  return data
}

// Busca o interesse do usuário logado nesse evento
export async function fetchMyEventInterest(eventId, userId) {
  const { data, error } = await supabase
    .from('event_interest')
    .select(
      `
      id,
      is_interested,
      is_confirmed,
      types:event_interest_to_types ( interest_type_id )
    `,
    )
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
    ? {
        ...data,
        type_ids: data.types.map((t) => String(t.interest_type_id)),
      }
    : null
}

// Salva/atualiza interesse
export async function upsertEventInterest({
  eventId,
  userId,
  isInterested,
  isConfirmed,
  typeIds,
}) {
  // Upsert no registro principal
  const { data: interest, error: upsertError } = await supabase
    .from('event_interest')
    .upsert(
      {
        user_id: userId,
        event_id: eventId,
        is_interested: isInterested,
        is_confirmed: isConfirmed,
      },
      { onConflict: 'user_id,event_id' },
    )
    .select('id')
    .single()

  if (upsertError) {
    throw new Error(upsertError.message)
  }

  // Limpa tipos antigos e insere novos
  await supabase
    .from('event_interest_to_types')
    .delete()
    .eq('event_interest_id', interest.id)

  if (typeIds.length > 0) {
    const { error: typesError } = await supabase.from('event_interest_to_types').insert(
      typeIds.map((typeId) => ({
        event_interest_id: interest.id,
        interest_type_id: parseInt(typeId, 10),
      })),
    )

    if (typesError) {
      throw new Error(typesError.message)
    }
  }

  return interest
}

// Deleta o interesse do usuário no evento
export async function deleteEventInterest(eventId, userId) {
  const { error } = await supabase
    .from('event_interest')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}
