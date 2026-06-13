import { createBrowserRouter, Navigate } from 'react-router-dom'
import PublicLayout from './components/layouts/PublicLayout'
import AppLayout from './components/layouts/AppLayout'
import BackstageLayout from './components/layouts/BackstageLayout'
import AppSettingsLayout from './components/layouts/AppSettingsLayout'
// Public pages
import AuthCallback from './pages/AuthCallback'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
// Authenticated pages
import Menu from './pages/Menu' // for mobile devices
import NotificationsPage from './pages/NotificationsPage' // for mobile devices
import CalendarPage from './pages/Calendar' // for mobile devices
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Feed from './pages/Feed'
// -- Search pages
import Search from './pages/Search'
// -- Profile pages
import ProfileRouter from './components/ProfileRouter'
import ProfileGear from './pages/ProfileGear'
import Artist from './pages/Artist'
// -- Project pages
import ProjectRouter from './components/ProjectRouter'
import Projects from './pages/Projects'
import NewProject from './pages/NewProject'
import Backstage from './pages/Backstage'
// -- Gigs pages
import Gigs from './pages/Gigs'
import Gig from './pages/Gig'
import GigInvitations from './pages/GigInvitations'
import NewGig from './pages/NewGig'
// -- Gear pages
import Gear from './pages/Gear'
import GearItem from './pages/GearItem'
import Brand from './pages/Brand'
import NewGear from './pages/NewGear'
// -- Events pages
import NewEvent from './pages/NewEvent'
import NewVenue from './pages/NewVenue'
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
import Picture from './pages/settings/Picture'
// -- Admin pages
import AdminRoute from './pages/admin/AdminRoute'
import AdminLayout from './pages/admin/AdminLayout'
import AdminIndex from './pages/admin/index'
import AdminUsers from './pages/admin/AdminUsers'
import AdminBrands from './pages/admin/AdminBrands'
import AdminProducts from './pages/admin/AdminProducts'
import AdminVenues from './pages/admin/AdminVenues'
import AdminPlans from './pages/admin/AdminPlans'
import AdminColors from './pages/admin/AdminColors'

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
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'home', element: <Home /> },
      { path: 'feed', element: <Feed /> },
      { path: 'search', element: <Search /> },
      { path: 'gigs', element: <Gigs /> },
      { path: 'gig/:id', element: <Gig /> },
      { path: 'gig-invitations', element: <GigInvitations /> },
      { path: 'new/gig', element: <NewGig /> },
      { path: 'projects', element: <Projects /> },
      { path: 'new/project', element: <NewProject /> },
      { path: 'brand/:slug', element: <Brand /> },
      { path: 'post/:id', element: <Post /> },
      { path: 'new/post', element: <NewPost /> },
      { path: 'gear', element: <Gear /> },
      { path: 'gear/:slug', element: <GearItem /> },
      { path: 'new/gear', element: <NewGear /> },
      { path: 'artist/:slug', element: <Artist /> },
      { path: 'new/event', element: <NewEvent /> },
      { path: 'new/venue', element: <NewVenue /> },
      { path: '/:username/gear', element: <ProfileGear /> },
    ],
  },
  // ── Backstage ──────────────────────────
  {
    element: <BackstageLayout />,
    children: [{ path: 'backstage/:slug', element: <Backstage /> }],
  },
  // ── Settings ──────────────────────────
  {
    element: <AppSettingsLayout />,
    children: [
      {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
          { index: true, element: <Navigate to="settings/profile" replace /> },
          { path: 'profile', element: <EditMyProfile /> },
          { path: 'musical-preferences', element: <MusicalPreferences /> },
          { path: 'password', element: <Password /> },
          { path: 'endorsements', element: <Endorsements /> },
          { path: 'gear', element: <MyGear /> },
          { path: 'availability', element: <Availability /> },
          { path: 'picture', element: <Picture /> },
        ],
      },
    ],
  },
  // ── Admin ───────────────────────────────────────
  {
    path: 'admin',
    element: <AdminRoute />, // guard: verifica sessão + is_admin
    children: [
      {
        element: <AdminLayout />, // sidebar + shell compartilhados
        children: [
          { index: true, element: <AdminIndex /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'brands', element: <AdminBrands /> },
          { path: 'products', element: <AdminProducts /> },
          { path: 'venues', element: <AdminVenues /> },
          { path: 'plans', element: <AdminPlans /> },
          { path: 'colors', element: <AdminColors /> },
        ],
      },
    ],
  },
  // ── Perfil (público ou autenticado) ─────────────
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
