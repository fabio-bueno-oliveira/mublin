import { useDebouncedValue } from '@mantine/hooks'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { searchProfiles, searchProjects, searchGear } from '../queries/search'

const MIN_CHARS = 2
const DEBOUNCE_MS = 300
const PREVIEW_LIMIT = 3 // precisa ser igual ao pageSize de searchProfiles no Search.jsx
const STALE_TIME = 1000 * 60 * 5

export function useSearchPreview(rawQuery, { enabled = true } = {}) {
  const trimmed = rawQuery.trim()
  const [debounced] = useDebouncedValue(trimmed, DEBOUNCE_MS)
  const active = enabled && debounced.length >= MIN_CHARS

  // Mesmas chaves e parâmetros do Search.jsx → cache compartilhado
  const profilesQ = useQuery({
    queryKey: ['searched-profiles', debounced],
    queryFn: () => searchProfiles(debounced, { pageSize: PREVIEW_LIMIT }),
    enabled: active,
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  })

  const projectsQ = useQuery({
    queryKey: ['searched-projects', debounced],
    queryFn: () => searchProjects(debounced),
    select: (data) => data.slice(0, PREVIEW_LIMIT), // não altera o cache
    enabled: active,
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  })

  const gearQ = useQuery({
    queryKey: ['searched-gear', debounced],
    queryFn: () => searchGear(debounced),
    select: (data) => data.slice(0, PREVIEW_LIMIT),
    enabled: active,
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  })

  const people = profilesQ.data?.results ?? []
  const projects = projectsQ.data ?? []
  const gear = gearQ.data ?? []

  const isPreviewMode = trimmed.length >= MIN_CHARS
  const isLoading =
    isPreviewMode &&
    (trimmed !== debounced ||
      profilesQ.isFetching ||
      projectsQ.isFetching ||
      gearQ.isFetching)

  return {
    people,
    projects,
    gear,
    isPreviewMode,
    isLoading,
    hasResults: people.length + projects.length + gear.length > 0,
  }
}
