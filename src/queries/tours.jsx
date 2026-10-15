import { supabase } from '../lib/supabaseClient'

// ── Tours ──

export async function fetchTourBySlug(slug) {
  const { data, error } = await supabase
    .from('tours')
    .select(
      `
      id, title, slug, description, picture,
      date_start, date_end, is_active, is_public,
      genre_id, created_by, created_at,
      genres ( id, name_ptbr )
    `,
    )
    .eq('slug', slug)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function fetchTourById(id) {
  const { data, error } = await supabase
    .from('tours')
    .select(
      `
      id, title, slug, description, picture,
      date_start, date_end, is_active, is_public,
      genre_id, created_by
    `,
    )
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ── Tour Dates ──

export async function fetchTourDates(tourId) {
  const { data, error } = await supabase
    .from('tour_dates')
    .select(
      `
      id, date, time_start, time_end, 
      tour_leg_id, venue_id, venue_name, 
      city_id, country_id,
      is_confirmed, is_canceled, notes, order_index,
      venues ( id, name ),
      cities ( id, name, regions ( name, uf ) ),
      countries:countries!tour_dates_country_id_fkey ( id, name_ptbr )
    `,
    )
    .eq('tour_id', tourId)
    .order('date', { ascending: true })
    .order('order_index', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createTourDate(payload) {
  const { data, error } = await supabase
    .from('tour_dates')
    .insert(payload)
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateTourDate(id, payload) {
  const { data, error } = await supabase
    .from('tour_dates')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteTourDate(id) {
  const { error } = await supabase.from('tour_dates').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Tour Projects (N:N) ──

export async function fetchTourProjects(tourId) {
  const { data, error } = await supabase
    .from('tour_projects')
    .select(
      `
      id, project_id, is_headliner, order_show,
      projects ( id, name, picture, slug, project_type_id )
    `,
    )
    .eq('tour_id', tourId)
    .order('order_show', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function addProjectToTour({
  tour_id,
  project_id,
  is_headliner = false,
  order_show = null,
}) {
  const { data, error } = await supabase
    .from('tour_projects')
    .insert({ tour_id, project_id, is_headliner, order_show })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateTourProject(id, payload) {
  const { data, error } = await supabase
    .from('tour_projects')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function removeProjectFromTour(id) {
  const { error } = await supabase.from('tour_projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Search Projects (para vincular) ──

export async function searchProjectsByName(query) {
  if (!query || query.length < 2) return []
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, picture, slug')
    .ilike('name', `%${query}%`)
    .eq('is_public', true)
    .limit(10)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchTourLegs(tourId) {
  const { data, error } = await supabase
    .from('tour_legs')
    .select('id, name, order_index')
    .eq('tour_id', tourId)
    .order('order_index')
  if (error) throw new Error(error.message)
  return data ?? []
}
