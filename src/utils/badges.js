import dayjs from 'dayjs'

// Cadastros até 31/12/2026 (23:59:59 UTC) recebem o badge "Mublin OG"
const MUBLIN_OG_CUTOFF = '2026-12-31T23:59:59Z'

export function isMublinOG(createdAt) {
  if (!createdAt) {
    return false
  }
  return dayjs(createdAt).isBefore(dayjs(MUBLIN_OG_CUTOFF))
}
