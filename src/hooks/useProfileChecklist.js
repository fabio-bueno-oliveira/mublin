import { useQuery } from '@tanstack/react-query'
import {
  fetchUserRolesCount,
  fetchUserGenresCount,
  fetchUserGearCount,
  fetchUserPortfolioCount,
  fetchUserInspirationsCount,
} from '../queries/user'
import { useAuth } from './useAuth'

/**
 * Checklist de completude do perfil — agora 100% com HEAD counts
 * Todas as queries terminadas em *Count usam { head: true, count: 'exact' }
 * Retornam number, muito mais leve que trazer arrays completos.
 */
export function useProfileChecklist() {
  const { user, profile } = useAuth()

  const isProPlanUser = profile?.plan === 'Pro'

  const hasAvatar = !!profile?.avatar
  const hasBio = !!profile?.bio?.trim()

  // ── Queries HEAD ──────────────────────────────
  const { data: rolesCount = 0, isLoading: loadingRoles } = useQuery({
    queryKey: ['user-roles-count', user?.id],
    queryFn: () => fetchUserRolesCount(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })
  const hasRole = rolesCount > 0

  const { data: portfolioCount = 0, isLoading: loadingPortfolio } = useQuery({
    queryKey: ['user-portfolio-count', user?.id],
    queryFn: () => fetchUserPortfolioCount(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })
  const hasPortfolioItem = portfolioCount > 0

  const { data: gearCount = 0, isLoading: loadingGearCount } = useQuery({
    queryKey: ['user-gear-count', user?.id],
    queryFn: () => fetchUserGearCount(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })
  const hasGearItem = gearCount > 0

  const { data: genresCount = 0, isLoading: loadingUserGenres } = useQuery({
    queryKey: ['user-genres-count', user?.id],
    queryFn: () => fetchUserGenresCount(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })
  const hasGenre = genresCount > 0

  const { data: inspirationsCount = 0, isLoading: loadingUserInspirations } = useQuery({
    queryKey: ['user-inspirations-count', user?.id],
    queryFn: () => fetchUserInspirationsCount(user.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })
  const hasInspiration = inspirationsCount > 0

  const isLoading =
    loadingRoles ||
    loadingPortfolio ||
    loadingGearCount ||
    loadingUserGenres ||
    loadingUserInspirations

  const items = [
    {
      key: 'avatar',
      label: 'Adicione uma foto de perfil',
      completed: hasAvatar,
      href: '/settings/picture',
      count: hasAvatar ? 1 : 0,
    },
    {
      key: 'bio',
      label: 'Escreva sua bio',
      completed: hasBio,
      href: '/settings/profile',
      count: hasBio ? 1 : 0,
    },
    {
      key: 'role',
      label: 'Informe seus papéis (ex: guitarrista, etc...)',
      completed: hasRole,
      href: '/settings/musical-preferences',
      count: rolesCount,
    },
    {
      key: 'genre',
      label: 'Informe seus gêneros musicais',
      completed: hasGenre,
      href: '/settings/musical-preferences',
      count: genresCount,
    },
    {
      key: 'portfolio',
      label: 'Adicione um item ao seu portfólio',
      completed: hasPortfolioItem,
      href: '/settings/portfolio',
      count: portfolioCount,
    },
    {
      key: 'inspiration',
      label: 'Adicione uma inspiração musical',
      completed: hasInspiration,
      href: '/settings/musical-preferences',
      count: inspirationsCount,
    },
    {
      key: 'gear',
      label: 'Adicione um item ao seu equipamento',
      completed: hasGearItem,
      href: '/settings/gear',
      proOnly: true,
      count: gearCount,
    },
  ]

  const countedItems = items.filter((item) => !item.proOnly || isProPlanUser)
  const completedCount = countedItems.filter((item) => item.completed).length
  const totalCount = countedItems.length
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return {
    items,
    isProPlanUser,
    completedCount,
    totalCount,
    percent,
    isComplete: percent === 100,
    isLoading,
    // extras úteis pro card se quiser mostrar números
    counts: {
      roles: rolesCount,
      genres: genresCount,
      portfolio: portfolioCount,
      inspirations: inspirationsCount,
      gear: gearCount,
    },
  }
}
