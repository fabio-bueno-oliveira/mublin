import { supabase } from '../lib/supabaseClient'

// Habilidades que o usuário já adicionou ao perfil
export async function fetchUserSkills(profileId) {
  const { data, error } = await supabase
    .from('profile_skills')
    .select('id, skill_id, created_at, skills(id, slug, name_ptbr, skill_type)')
    .eq('user_id', profileId)
    .order('created_at', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

// Catálogo de habilidades disponíveis para as categorias informadas
// (categorias vêm das atividades do usuário: roles.category_id)
export async function fetchAvailableSkills(categoryIds) {
  if (!categoryIds?.length) {
    return []
  }
  const { data, error } = await supabase
    .from('skills')
    .select(
      'id, slug, name_ptbr, skill_type, sort_order, skill_categories!inner(category_id)',
    )
    .eq('is_active', true)
    .in('skill_categories.category_id', categoryIds)
    .order('sort_order', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data.sort((a, b) => a.name_ptbr.localeCompare(b.name_ptbr, 'pt-BR'))
}

export async function addProfileSkill(profileId, skillId) {
  const { data, error } = await supabase
    .from('profile_skills')
    .insert({ user_id: profileId, skill_id: skillId })
    .select('id')
    .single()
  // 23505 = unique_violation: a habilidade já estava no perfil, tratamos como sucesso
  if (error && error.code !== '23505') {
    throw new Error(error.message)
  }
  return data
}

export async function deleteProfileSkill(profileSkillId) {
  const { error } = await supabase
    .from('profile_skills')
    .delete()
    .eq('id', profileSkillId)
  if (error) {
    throw new Error(error.message)
  }
  return { success: true }
}
