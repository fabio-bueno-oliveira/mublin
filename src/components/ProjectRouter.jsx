import { useAuth } from '../contexts/AuthContext'
import AppLayout from '../components/layouts/AppLayout'
import PublicLayout from '../components/layouts/PublicLayout'
import Project from '../pages/Project'
import ProjectPublic from '../pages/ProjectPublic'

export default function ProjectRouter() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (user) {
    return (
      <AppLayout>
        <Project />
      </AppLayout>
    )
  }

  return <PublicLayout><ProjectPublic /></PublicLayout>
}