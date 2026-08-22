import { supabase } from '../lib/supabaseClient'

export async function fetchFeed(limit = 20, offset = 0, viewerId = null) {
  const rpcName = viewerId ? 'get_following_feed' : 'get_feed'

  const { data, error } = await supabase.rpc(rpcName, {
    limit_count: limit,
    offset_count: offset,
    viewer_id: viewerId,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchPostDetailsById(id, viewerId = null) {
  const { data, error } = await supabase.rpc('get_feed_post', {
    post_id: Number(id),
    viewer_id: viewerId,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data?.[0] ?? null
}

export async function toggleLike({ postId, userId, liked }) {
  if (liked) {
    const { error } = await supabase
      .from('feed_likes')
      .delete()
      .eq('id_post', postId)
      .eq('id_user', userId)
    if (error) {
      throw new Error(error.message)
    }
  } else {
    const { error } = await supabase
      .from('feed_likes')
      .insert({ id_post: postId, id_user: userId })
    if (error) {
      throw new Error(error.message)
    }
  }
}

export async function fetchPostComments(postId) {
  const { data, error } = await supabase
    .from('feed_comments')
    .select(
      `
      id,
      body,
      created_at,
      updated_at,
      profiles (
        id,
        username,
        full_name,
        avatar,
        is_verified
      )
    `,
    )
    .eq('feed_id', postId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function postComment({ postId, authorId, body }) {
  const { data, error } = await supabase
    .from('feed_comments')
    .insert({ feed_id: postId, author_profile_id: authorId, body })
    .select()
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchRandomFeedPhrase() {
  const { data, error } = await supabase.rpc('get_random_feed_phrase')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function deletePost(postId) {
  const { error } = await supabase.from('feed').delete().eq('id', postId)
  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchNewsFeed(limit) {
  const { data, error } = await supabase
    .from('news_cache')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)
  if (error) {
    throw new Error(error.message)
  }
  return data
}
