import { supabase } from '../lib/supabaseClient'

/**
 * Opção A - SEM RPC (funciona hoje, sem mexer no banco)
 * Busca até 1000 inspirações recentes e agrupa no JS.
 * Bom para MVP. Troque pela RPC quando passar de 10k linhas.
 */
export async function fetchTopInspiredArtistFallback(limitProfiles = 5) {
  const { data, error } = await supabase
    .from('profile_inspirations')
    .select(
      `
      artist_id,
      artists!inner ( id, name, slug, picture, is_verified ),
      profiles!inner ( id, username, full_name, avatar )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) {
    throw new Error(error.message)
  }
  if (!data?.length) {
    return null
  }

  // Agrupa por artista
  const grouped = data.reduce((acc, row) => {
    const aid = row.artist_id
    if (!acc[aid]) {
      acc[aid] = {
        artist: row.artists,
        profiles: [],
        profileIds: new Set(),
        count: 0,
      }
    }
    // Evita contar o mesmo profile 2x pro mesmo artista (unique já garante, mas safe)
    if (!acc[aid].profileIds.has(row.profiles.id)) {
      acc[aid].profiles.push(row.profiles)
      acc[aid].profileIds.add(row.profiles.id)
      acc[aid].count++
    }
    return acc
  }, {})

  // Pega o top
  const sorted = Object.values(grouped).sort((a, b) => b.count - a.count)
  const top = sorted[0]
  if (!top) {
    return null
  }

  // Para o total real, faz count separado (mais preciso)
  const { count: totalCount } = await supabase
    .from('profile_inspirations')
    .select('id', { count: 'exact', head: true })
    .eq('artist_id', top.artist.id)

  return {
    artist: top.artist,
    profiles: top.profiles.slice(0, limitProfiles),
    totalCount: totalCount ?? top.count,
  }
}

/**
 * Opção B - COM RPC (recomendada para produção)
 * Crie a função no Supabase SQL Editor antes (veja arquivo sql abaixo)
 */
export async function fetchTopInspiredArtist(limitProfiles = 5) {
  const { data, error } = await supabase.rpc('get_top_inspired_artist', {
    p_limit_profiles: limitProfiles,
  })

  if (error) {
    // Fallback automático se a RPC ainda não existe
    console.warn(
      'RPC get_top_inspired_artist não encontrada, usando fallback',
      error.message,
    )
    return fetchTopInspiredArtistFallback(limitProfiles)
  }

  if (!data || data.length === 0) {
    return null
  }

  const row = data[0]
  return {
    artist: {
      id: row.artist_id,
      name: row.artist_name,
      slug: row.artist_slug,
      picture: row.artist_picture,
      is_verified: row.artist_is_verified,
    },
    profiles: row.profiles, // já vem como JSON array
    totalCount: row.total_count,
  }
}

// Lista top 5 artistas mais inspiradores (para carrossel futuro)
export async function fetchTopInspiredArtists(limitArtists = 5) {
  const { data, error } = await supabase.rpc('get_top_inspired_artists', {
    p_limit_artists: limitArtists,
    p_limit_profiles: 3,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}
