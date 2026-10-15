export function getPortfolioGenreStats(portfolio = [], limit = 6) {
  const categories = new Map()

  portfolio.forEach((item) => {
    const projectGenres = item.project?.genres ?? []
    const countedCategories = new Set()

    projectGenres.forEach(({ genre }) => {
      const category = genre?.category

      if (!category?.id) return

      // Evita contar a mesma categoria duas vezes
      // dentro de uma única experiência.
      if (countedCategories.has(category.id)) return

      countedCategories.add(category.id)

      const current = categories.get(category.id) ?? {
        id: category.id,
        genre: category.name_ptbr || category.name,
        projects: 0,
        color: category.color_hex,
      }

      current.projects += 1

      categories.set(category.id, current)
    })
  })

  return [...categories.values()].sort((a, b) => b.projects - a.projects).slice(0, limit)
}

export function getPortfolioSubgenreStats(portfolio = [], limit = 8) {
  const subgenres = new Map()

  portfolio.forEach((item) => {
    const projectGenres = item.project?.genres ?? []
    const countedGenres = new Set()

    projectGenres.forEach(({ genre }) => {
      if (!genre?.id || countedGenres.has(genre.id)) return

      countedGenres.add(genre.id)

      const current = subgenres.get(genre.id) ?? {
        id: genre.id,
        genre: genre.name_ptbr
          ? genre.name_ptbr.length > 16
            ? genre.name_ptbr.slice(0, 16) + '...'
            : genre.name_ptbr
          : genre.name.length > 16
            ? genre.name.slice(0, 16) + '...'
            : genre.name,
        // genre: genre.name_ptbr || genre.name,
        projects: 0,
      }

      current.projects += 1
      subgenres.set(genre.id, current)
    })
  })

  return [...subgenres.values()]
    .sort((a, b) => b.projects - a.projects || a.genre.localeCompare(b.genre, 'pt-BR'))
    .slice(0, limit)
}
