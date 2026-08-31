const AVATAR_PATH = 'https://ik.imagekit.io/mublin/users/avatars/'
// const BADGE_PATH_V1 = 'badges/open-to-gig-alpha.png'
const BADGE_PATH_V2 = 'badges/open-to-gig-v2-alpha.png'

export const getAvatarUrl = (filename, openToWork = false, size = 200) => {
  if (!filename) {
    return undefined
  }
  const base = `tr:w-${size},h-${size},r-max`
  const badge = `l-image,i-${BADGE_PATH_V2.replace(/\//g, '@@')},w-bw,h-bh,lx-0,ly-0,l-end`
  return `${AVATAR_PATH}${base}${openToWork ? `:${badge}` : ''}/${filename}`
}

export const formatPortfolioPeriod = (yearStart, yearEnd) => {
  if (!yearStart && !yearEnd) {
    return null
  }
  if (yearStart && !yearEnd) {
    const currentYear = new Date().getFullYear()
    const totalYears = currentYear - yearStart
    if (totalYears <= 0) {
      return `${yearStart} › Atualmente`
    }
    return `${yearStart} › Atualmente (${totalYears} ${totalYears === 1 ? 'ano' : 'anos'})`
  }
  if (!yearStart && yearEnd) {
    return `${yearEnd}`
  }
  if (yearStart === yearEnd) {
    return `${yearStart}`
  }
  const totalYears = yearEnd - yearStart
  return `${yearStart} › ${yearEnd} (${totalYears} ${totalYears === 1 ? 'ano' : 'anos'})`
}

export const formatMemberSince = (createdAt) => {
  if (!createdAt) {
    return null
  }
  const date = new Date(createdAt)

  // Formato longo: 18 de julho de 2025
  const long = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)

  // Formato curto: julho de 2025
  const short = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)

  // Tempo relativo: há 2 anos, há 3 meses, etc
  const now = new Date()
  const diffMonths =
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())

  let relative = ''
  if (diffMonths < 1) {
    relative = 'este mês'
  } else if (diffMonths === 1) {
    relative = 'há 1 mês'
  } else if (diffMonths < 12) {
    relative = `há ${diffMonths} meses`
  } else {
    const years = Math.floor(diffMonths / 12)
    relative = years === 1 ? 'há 1 ano' : `há ${years} anos`
  }

  return { long, short, relative, date }
}
