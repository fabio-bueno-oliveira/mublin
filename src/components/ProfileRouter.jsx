import { useAuth } from '../hooks/useAuth'
import AppProfileLayout from '../components/layouts/AppProfileLayout'
import PublicLayout from '../components/layouts/PublicLayout'
import Profile from '../pages/Profile'
import ProfilePublic from '../pages/ProfilePublic'

export default function ProfileRouter() {
  const { user, loading } = useAuth()

  if (loading) {
    return null
  }

  if (user) {
    return (
      <AppProfileLayout>
        <Profile />
      </AppProfileLayout>
    )
  }

  return (
    <PublicLayout>
      <ProfilePublic />
    </PublicLayout>
  )
}
