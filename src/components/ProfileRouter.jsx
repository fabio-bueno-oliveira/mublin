import { useAuth } from '../contexts/AuthContext'
import AppLayout from '../components/layouts/AppLayout'
import PublicLayout from '../components/layouts/PublicLayout'
import Profile from '../pages/Profile'
import ProfilePublic from '../pages/ProfilePublic'

export default function ProfileRouter() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (user) {
    return (
      <AppLayout>
        <Profile />
      </AppLayout>
    )
  }

  return <PublicLayout><ProfilePublic /></PublicLayout>
}