import { supabase } from '../lib/supabaseClient'

// ── Leitura ──────────────────────────────────────────────

export async function fetchSetupById(setupId) {
  const { data, error } = await supabase
    .from('gear_setups')
    .select(
      `
      id, name, description, image, photo, visibility, collab_mode, created_at, updated_at,
      id_user,
      owner:profiles!gear_setups_id_user_fkey ( id, username, full_name, avatar )
    `,
    )
    .eq('id', setupId)
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchSetupItems(setupId) {
  const { data, error } = await supabase
    .from('gear_setup_items')
    .select(
      `
      id, order_show, comments, created_at, updated_at, id_product, id_user,
      added_by:profiles!gear_setup_items_id_user_fkey ( id, username, full_name, avatar ),
      products ( id, name, picture, slug, brands ( name ) )
    `,
    )
    .eq('id_setup', setupId)
    .order('order_show', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchSetupCollaborators(setupId) {
  const { data, error } = await supabase
    .from('gear_setup_collaborators')
    .select(
      `
      id, created_at, id_user,
      profiles!gear_setup_collaborators_id_user_fkey ( id, username, full_name, avatar )
    `,
    )
    .eq('id_setup', setupId)
    .order('created_at', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// Verificação de permissão feita no banco (mesma função usada pelas RLS policies),
// então a regra vive num único lugar e não corre risco de o front ficar dessincronizado.
export async function fetchCanEditSetup(setupId) {
  const { data, error } = await supabase.rpc('can_edit_setup', { p_setup_id: setupId })
  if (error) {
    throw new Error(error.message)
  }
  return !!data
}

export async function findProfileByUsername(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar')
    .ilike('username', username.trim())
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function searchProducts(query, limit = 8) {
  const trimmed = query?.trim()
  if (!trimmed || trimmed.length < 2) {
    return []
  }
  const { data, error } = await supabase
    .from('products')
    .select('id, name, picture, brands ( name )')
    .ilike('name', `%${trimmed}%`)
    .limit(limit)
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// ── Escrita ──────────────────────────────────────────────

export async function updateSetupMeta(
  setupId,
  { name, description, visibility, collab_mode },
) {
  const { error } = await supabase
    .from('gear_setups')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      visibility,
      collab_mode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', setupId)
  if (error) {
    throw new Error(error.message)
  }
}

export async function addSetupItem({ setupId, userId, productId, orderShow }) {
  const { error } = await supabase.from('gear_setup_items').insert({
    id_setup: setupId,
    id_user: userId,
    id_product: productId,
    order_show: orderShow,
  })
  if (error) {
    throw new Error(
      error.code === '23505' ? 'Este item já está no setup.' : error.message,
    )
  }
}

export async function updateSetupItem(itemId, { order_show, comments }) {
  const { error } = await supabase
    .from('gear_setup_items')
    .update({ order_show, comments })
    .eq('id', itemId)
  if (error) {
    throw new Error(error.message)
  }
}

export async function removeSetupItem(itemId) {
  const { error } = await supabase.from('gear_setup_items').delete().eq('id', itemId)
  if (error) {
    throw new Error(error.message)
  }
}

export async function addSetupCollaborator({ setupId, userId, invitedBy }) {
  const { error } = await supabase.from('gear_setup_collaborators').insert({
    id_setup: setupId,
    id_user: userId,
    invited_by: invitedBy,
  })
  if (error) {
    throw new Error(
      error.code === '23505'
        ? 'Este usuário já é colaborador deste setup.'
        : error.message,
    )
  }
}

export async function removeSetupCollaborator(collaboratorRowId) {
  const { error } = await supabase
    .from('gear_setup_collaborators')
    .delete()
    .eq('id', collaboratorRowId)
  if (error) {
    throw new Error(error.message)
  }
}

// ── Comentários ──────────────────────────────────────

export async function fetchSetupCommentsCount(setupId) {
  const { count, error } = await supabase
    .from('gear_setup_comments')
    .select('id', { count: 'exact', head: true })
    .eq('id_setup', setupId)
  if (error) {
    throw new Error(error.message)
  }
  return count ?? 0
}

export async function fetchSetupComments(setupId, page = 1, perPage = 10) {
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  const { data, error, count } = await supabase
    .from('gear_setup_comments')
    .select(
      `
      id, content, created_at, id_user,
      profiles!gear_setup_comments_id_user_fkey ( id, username, full_name, avatar )
    `,
      { count: 'exact' },
    )
    .eq('id_setup', setupId)
    .order('created_at', { ascending: false })
    .range(from, to)
  if (error) {
    throw new Error(error.message)
  }
  return { data, count }
}

export async function addSetupComment({ setupId, userId, content }) {
  const { data, error } = await supabase
    .from('gear_setup_comments')
    .insert({
      id_setup: setupId,
      id_user: userId,
      content,
    })
    .select('id')
    .single()
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function deleteSetupComment(commentId) {
  const { error } = await supabase
    .from('gear_setup_comments')
    .delete()
    .eq('id', commentId)
  if (error) {
    throw new Error(error.message)
  }
}

// ── Likes ──────────────────────────────────────────

export async function fetchSetupLikesCount(setupId) {
  const { count, error } = await supabase
    .from('gear_setup_likes')
    .select('id', { count: 'exact', head: true })
    .eq('id_setup', setupId)
  if (error) {
    throw new Error(error.message)
  }
  return count ?? 0
}

export async function fetchHasLiked(setupId, userId) {
  if (!userId) {
    return false
  }
  const { data, error } = await supabase
    .from('gear_setup_likes')
    .select('id')
    .eq('id_setup', setupId)
    .eq('id_user', userId)
    .maybeSingle()
  if (error) {
    throw new Error(error.message)
  }
  return !!data
}

export async function toggleSetupLike({ setupId, userId, currentlyLiked }) {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('gear_setup_likes')
      .delete()
      .eq('id_setup', setupId)
      .eq('id_user', userId)
    if (error) {
      throw new Error(error.message)
    }
    return false
  }
  const { error } = await supabase
    .from('gear_setup_likes')
    .insert({ id_setup: setupId, id_user: userId })
  if (error) {
    if (error.code === '23505') {
      return true
    } // já curtiu (race condition)
    throw new Error(error.message)
  }
  return true
}
