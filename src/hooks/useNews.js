/**
 * Mublin – Hook: useNews
 * Arquivo: /src/hooks/useNews.js
 *
 * Busca notícias da tabela news_cache no Supabase com suporte a:
 * - filtro por categoria
 * - paginação simples
 * - loading e error states
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const PAGE_SIZE = 20

/**
 * @param {Object} options
 * @param {string|null} options.category  - 'noticias' | 'artistas' | 'instrumentos' | 'eventos' | null (todas)
 * @param {number}      options.page      - página atual (começa em 0)
 */
export function useNews({ category = null, page = 0 } = {}) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('news_cache')
        .select('*')
        .order('published_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) // +1 para detectar hasMore

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error: sbError } = await query

      if (sbError) {
        throw sbError
      }

      setHasMore(data.length > PAGE_SIZE)
      setNews(data.slice(0, PAGE_SIZE)) // remove o item extra de detecção
    } catch (err) {
      setError(err.message ?? 'Erro ao carregar notícias')
    } finally {
      setLoading(false)
    }
  }, [category, page])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  return { news, loading, error, hasMore, refetch: fetchNews }
}
