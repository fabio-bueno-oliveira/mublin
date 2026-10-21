import { useAuth } from '../hooks/useAuth'
import AppLayout from '../components/layouts/AppLayout'
import PublicLayout from '../components/layouts/PublicLayout'
import GearItem from '../pages/GearItem'
import GearItemPublic from '../pages/GearItemPublic'

export default function GearRouter() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (user) {
    return (
      <AppLayout>
        <GearItem />
      </AppLayout>
    )
  }

  return (
    <PublicLayout>
      <GearItemPublic />
    </PublicLayout>
  )
}
