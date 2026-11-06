import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layouts/AppLayout'
import PublicLayout from '../components/layouts/PublicLayout'
import SongPage from '../pages/song/Song'
import SongPagePublic from '../pages/song/SongPublic'

export default function SongRouter() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (user) {
    return (
      <AppLayout>
        <SongPage />
      </AppLayout>
    )
  }

  return (
    <PublicLayout>
      <SongPagePublic />
    </PublicLayout>
  )
}
