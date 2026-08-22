// hooks/useNews.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

const PAGE_SIZE = 15

export function useNews({ category = null, page = 0 } = {}) {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['news', category, page],
    queryFn: async () => {
      let query = supabase
        .from('news_cache')
        .select('*')
        .order('published_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1) // correto: 0-14 = 15 itens

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) {
        throw error
      }
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 min sem refetch
  })

  return {
    news: data ?? [],
    loading,
    error: error?.message ?? null,
    hasMore: (data?.length ?? 0) === PAGE_SIZE,
    refetch,
  }
}
