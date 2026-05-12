export const truncateString = (input, maxLength, showSeeMore) => {
  return input.length > maxLength
    ? `${input.substring(0, maxLength)}...${showSeeMore ? ' ver mais' : ''}`
    : input
}

export const nFormatter = (num) => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}G`
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`
  }
  return num
}

export const years = (yearSmallest, yearBiggest) => {
  const yearText = (yearSum) => {
    return yearSum === 1 ? ' ano' : ' anos'
  }
  const subtraction = yearBiggest - yearSmallest
  return subtraction === 0
    ? '(menos de 1 ano)'
    : `(${subtraction}${yearText(subtraction)})`
}

export const showYears = (years) => {
  if (years > 0) {
    return years === 1 ? '(1 ano)' : `(${years} anos)`
  }
  return '(menos de 1 ano)'
}
