export function isProfileLive(profile) {
  if (!profile?.is_live) return false
  if (!profile?.live_expires_at) return false
  return new Date(profile.live_expires_at) > new Date()
}