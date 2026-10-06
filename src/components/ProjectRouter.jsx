import { useAuth } from '../hooks/useAuth'
import AppProjectLayout from '../components/layouts/AppProjectLayout'
import PublicLayout from '../components/layouts/PublicLayout'
import Project from '../pages/Project'
import ProjectPublic from '../pages/ProjectPublic'

export default function ProjectRouter() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (user) {
    return (
      <AppProjectLayout>
        <Project />
      </AppProjectLayout>
    )
  }

  return (
    <PublicLayout>
      <ProjectPublic />
    </PublicLayout>
  )
}
