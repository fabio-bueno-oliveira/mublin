import { supabase } from '../lib/supabaseClient'

export async function fetchRandomBrands() {
  const { data, error } = await supabase.rpc('get_random_brands', { limit_count: 20 })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchBrandInfo(slug) {
  const { data, error } = await supabase
    .from('brands')
    .select(`
      id,
      name,
      slug,
      logo,
      cover,
      description,
      website,
      brands_categories (
        name_ptbr
      )
    `)
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function fetchBrandArtists(brandId) {
  const { data, error } = await supabase
    .from('profile_partners')
    .select(`
      id,
      type,
      since_year,
      featured,
      profiles (
        id,
        username,
        full_name,
        avatar
      )
    `)
    .eq('id_brand', brandId)
    .eq('active', true)
    .order('featured', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchProductCategories() {
  const { data, error } = await supabase
    .from('product_categories')
    .select('id, name_ptbr, macro_category')
    .order('name_ptbr', { ascending: true })

  if (error) throw new Error(error.message)

  return data
}