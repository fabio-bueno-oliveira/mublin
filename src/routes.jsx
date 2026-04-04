import { createBrowserRouter, Navigate } from 'react-router-dom'
import PublicLayout from './components/layouts/PublicLayout'
import AppLayout from './components/layouts/AppLayout'

// Public pages
import AuthCallback from './pages/AuthCallback'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// Authenticated pages
import Menu from './pages/Menu' // used only for mobile devices
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
// -- Search pages
import Search from './pages/Search'
// -- Profile pages
import ProfileRouter from './components/ProfileRouter'
import ProfileGear from './pages/ProfileGear'
// -- Project pages
import ProjectRouter from './components/ProjectRouter'
import Projects from './pages/Projects'
import NewProject from './pages/NewProject'
import Backstage from './pages/Backstage'
// -- Gigs pages
import Gigs from './pages/Gigs'
// -- Gear pages
import Gear from './pages/Gear'
import GearItem from './pages/GearItem'
import Brand from './pages/Brand'
import NewGear from './pages/NewGear'
// -- Feed pages
import Post from './pages/Post'
import NewPost from './pages/NewPost'
// -- Settings pages
import SettingsLayout from './pages/settings'
import EditMyProfile from './pages/settings/EditMyProfile'
import MusicalPreferences from './pages/settings/MusicalPreferences'
import Password from './pages/settings/Password'
import Endorsements from './pages/settings/Endorsements'
import MyGear from './pages/settings/MyGear'
import Availability from './pages/settings/Availability'

export const router = createBrowserRouter([
  // ── Rotas públicas ──────────────────────────────
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
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
      { path: 'menu', element: <Menu /> },
      { path: 'home', element: <Home /> },
      { path: 'search', element: <Search /> },
      { path: 'gigs', element: <Gigs /> },
      { path: 'projects', element: <Projects /> },
      { path: 'new/project', element: <NewProject /> },
      { path: 'brand/:slug', element: <Brand /> },
      { path: 'post/:id', element: <Post /> },
      { path: 'new/post', element: <NewPost /> },
      { path: 'gear', element: <Gear /> },
      { path: 'gear/:slug', element: <GearItem /> },
      { path: 'new/gear', element: <NewGear />},
      { path: 'backstage', element: <Backstage /> },
      { path: '/:username/gear', element: <ProfileGear /> },
      // ── Settings ──────────────────────────────────
      {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
          { index: true, element: <Navigate to="settings/profile" replace /> },
          { path: 'profile',               element: <EditMyProfile /> },
          { path: 'musical-preferences',   element: <MusicalPreferences /> },
          { path: 'password',              element: <Password /> },
          { path: 'endorsements',          element: <Endorsements /> },
          { path: 'gear',                  element: <MyGear /> },
          { path: 'availability',          element: <Availability /> },
        ],
      },
    ],
  },
  // ── Perfil ──────────────────────────────────────
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
