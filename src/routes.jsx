import { createBrowserRouter } from 'react-router-dom'
import PublicLayout from './components/layouts/PublicLayout'
import AppLayout from './components/layouts/AppLayout'

// Public pages
import AuthCallback from './pages/AuthCallback'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Signup from './pages/Signup'

// Authenticated pages
import Home from './pages/Home'
import ProfileRouter from './components/ProfileRouter'
import ProjectRouter from './components/ProjectRouter'
import Gigs from './pages/Gigs'
import NewProject from './pages/NewProject'
import Onboarding from './pages/Onboarding'

export const router = createBrowserRouter([
  // ── Rotas públicas ──────────────────────────────
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'auth/callback', element: <AuthCallback /> },
    ],
  },
  // ── Projeto ────────────────────────────────────
  {
    path: 'project/:slug',
    element: <ProjectRouter />,
  },
  // ── Onboarding ──────────────────────────────────
  { path: 'onboarding', element: <Onboarding /> },
  // ── Rotas autenticadas ──────────────────────────
  {
    element: <AppLayout />,
    children: [
      { path: 'home', element: <Home /> },
      { path: 'gigs', element: <Gigs /> },
      { path: 'new/project', element: <NewProject /> },
    ],
  },
  // ── Perfil — deve vir ANTES do 404, DEPOIS de tudo ──
  {
    path: '/:username',
    element: <ProfileRouter />,
  },
  // ── Rota 404 ────────────────────────────────────
  {
    path: '*',
    element: <NotFound />,
  },
])
