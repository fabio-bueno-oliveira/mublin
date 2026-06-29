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
    .order('created_at', { ascending: false })
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
