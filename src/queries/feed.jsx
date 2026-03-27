import { supabase } from '../lib/supabaseClient'

export async function fetchFeed(limit = 20, offset = 0) {
  const { data, error } = await supabase.rpc('get_feed', {
    limit_count: limit,
    offset_count: offset,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchPostById(id) {
  const { data, error } = await supabase.rpc('get_feed_post', { post_id: id })
  if (error) throw new Error(error.message)
  return data?.[0] ?? null
}
