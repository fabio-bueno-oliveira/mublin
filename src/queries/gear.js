import { supabase } from '../lib/supabaseClient'

export async function fetchRandomBrands() {
  const { data, error } = await supabase.rpc('get_random_brands', {
    limit_count: 20,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchBrandInfo(slug) {
  const { data, error } = await supabase
    .from('brands')
    .select(
      `
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
    `,
    )
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function fetchBrandArtists(brandId) {
  const { data, error } = await supabase
    .from('profile_partners')
    .select(
      `
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
    `,
    )
    .eq('id_brand', brandId)
    .eq('active', true)
    .order('featured', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProductCategories() {
  const { data, error } = await supabase
    .from('product_categories')
    .select('id, name_ptbr, macro_category')
    .order('name_ptbr', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function fetchTunings(instrumentType) {
  let query = supabase
    .from('tunings')
    .select('id, name_ptbr, description, instrument_type')
    .order('id')

  if (instrumentType) {
    query = query.eq('instrument_type', instrumentType)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchFeaturedProducts() {
  const { data, error } = await supabase.rpc('get_featured_products')
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProductColors(productId) {
  const { data, error } = await supabase
    .from('product_colors')
    .select(
      `
      id,
      picture,
      is_main,
      colors (
        id,
        name,
        name_ptbr,
        rgb,
        img_sample
      )
    `,
    )
    .eq('id_product', productId)
    .order('is_main', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchProductInfo(slug) {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      subtitle,
      description,
      description_source,
      description_source_url,
      year,
      is_discontinued,
      is_rare,
      is_featured,
      picture,
      brands (
        id,
        name,
        slug,
        logo
      ),
      product_categories (
        id,
        name_ptbr,
        macro_category
      ),
      product_series (
        id,
        name
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

export async function fetchProductOwners(productId) {
  const { data, error } = await supabase
    .from('profile_gear')
    .select(
      `
      id,
      is_currently_using,
      is_for_sale,
      price,
      photo,
      owner_comments,
      profiles (
        username,
        full_name,
        avatar,
        city_id,
        region_id,
        cities (
          name
        ),
        regions (
          name, uf
        )
      )
    `,
    )
    .eq('id_product', productId)
    .order('is_currently_using', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchBrandProducts(brandId) {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      subtitle,
      description,
      description_source,
      description_source_url,
      year,
      is_discontinued,
      is_rare,
      is_featured,
      picture,
      product_categories (
        id,
        name_ptbr,
        macro_category
      ),
      product_series (
        id,
        name
      )
    `,
    )
    .eq('id_brand', brandId)
    .order('name', { ascending: false })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function fetchBrandProductColors(brandId) {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      product_colors!inner (
        is_main,
        colors (
          name,
          rgb,
          img_sample
        )
      ),
      brands!inner (
        slug
      )
    `,
    )
    .eq('brands.id', brandId)
    .order('name', { foreignTable: 'product_colors.colors', ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getBrandOwners(brandId) {
  const { data, error } = await supabase
    .from('profile_gear')
    .select(
      `
      id,
      is_for_sale,
      profiles (
        id,
        full_name,
        username,
        avatar
      ),
      products!inner (
        id,
        name,
        picture,
        brands!inner (
          name
        )
      )
    `,
    )
    .eq('products.brands.id', brandId)
    .order('id', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function fetchCheckFavoriteProduct(productId, userId) {
  const { data, error } = await supabase
    .from('product_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function toggleFavoriteProduct(productId, userId, isFavorited) {
  if (isFavorited) {
    const { error } = await supabase
      .from('product_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, action: 'unfavorited' }
  }

  const { data, error } = await supabase
    .from('product_favorites')
    .insert({ user_id: userId, product_id: productId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      // Registro já existe: clique duplo ou cache
      return { success: true, action: 'favorited', alreadyExisted: true }
    }
    throw new Error(error.message)
  }

  return { success: true, action: 'favorited', data }
}
