const AVATAR_PATH = 'https://ik.imagekit.io/mublin/users/avatars/'

export const getAvatarUrl = (filename, openToWork = false, size = 200) => {
  if (!filename) {
    return undefined
  }

  const openToWorkText = 'OPEN%20TO%20GIG'
  const base = `tr:w-${size},h-${size},r-max`
  const badge = `l-image,i-ik_canvas,w-${size},h-20,bg-16A34A,lfo-bottom,ly-N10,l-text,ff-Montserrat,i-${openToWorkText},fs-10,co-FFFFFF,tg-b,lfo-center,l-end,l-end`

  return `${AVATAR_PATH}${base}${openToWork ? `:${badge}` : ''}/${filename}`
}
