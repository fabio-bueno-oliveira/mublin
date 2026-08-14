export function formatFullName(name = '') {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export function generateUsernameFromName(name = '') {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // tira acento
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 25)
}
