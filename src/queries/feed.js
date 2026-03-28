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

export async function fetchPostLikes(postId) {
  const { count, error } = await supabase
    .from('feed_likes')
    .select('*', { count: 'exact', head: true })
    .eq('id_post', postId)
  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function fetchLikesCountByPosts(postIds) {
  if (!postIds.length) return {}
  const { data, error } = await supabase
    .from('feed_likes')
    .select('id_post')
    .in('id_post', postIds)
  if (error) throw new Error(error.message)
  // Agrupa e conta no cliente
  return data.reduce((acc, row) => {
    acc[row.id_post] = (acc[row.id_post] ?? 0) + 1
    return acc
  }, {})
}

export async function fetchUserLikedPosts(userId, postIds) {
  if (!postIds.length) return []
  const { data, error } = await supabase
    .from('feed_likes')
    .select('id_post')
    .eq('id_user', userId)
    .in('id_post', postIds)
  if (error) throw new Error(error.message)
  return data.map(r => r.id_post)
}

export async function toggleLike({ postId, userId, liked }) {
  if (liked) {
    const { error } = await supabase
      .from('feed_likes')
      .delete()
      .eq('id_post', postId)
      .eq('id_user', userId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('feed_likes')
      .insert({ id_post: postId, id_user: userId })
    if (error) throw new Error(error.message)
  }
}
