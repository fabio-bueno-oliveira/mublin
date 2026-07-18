const AVATAR_PATH = 'https://ik.imagekit.io/mublin/users/avatars/'
const BADGE_PATH = 'badges/open-to-gig-alpha.png'

export const getAvatarUrl = (filename, openToWork = false, size = 200) => {
  if (!filename) {
    return undefined
  }
  const base = `tr:w-${size},h-${size},r-max`
  const badge = `l-image,i-${BADGE_PATH.replace(/\//g, '@@')},w-bw,h-bh,lx-0,ly-0,l-end`
  return `${AVATAR_PATH}${base}${openToWork ? `:${badge}` : ''}/${filename}`
}
