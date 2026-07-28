import { createBrowserRouter, Navigate } from 'react-router-dom'
import PublicLayout from './components/layouts/PublicLayout'
import AppLayout from './components/layouts/AppLayout'
import AppProfileLayout from './components/layouts/AppProfileLayout'
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
import MySavedFavorites from './pages/Saved'
// -- Search pages
import Search from './pages/Search'
import SearchPeople from './pages/search/People'
// -- Profile pages
import ProfileRouter from './components/ProfileRouter'
import ProfileGear from './pages/ProfileGear'
import ProfileGearItem from './pages/ProfileGearItem'
import Setup from './pages/Setup'
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
import GearItemZoom from './pages/GearItemZoom'
import GearCategory from './pages/GearCategory'
import Brand from './pages/Brand'
import NewGear from './pages/NewGear'
// -- Events pages
import NewEvent from './pages/NewEvent'
import Event from './pages/Event'
import NewVenue from './pages/NewVenue'
import Venue from './pages/Venue'
// -- School pages
import Institution from './pages/Institution'
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
import Portfolio from './pages/settings/Portfolio'
import Education from './pages/settings/Education'
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
import AdminArtists from './pages/admin/AdminArtists'

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
      { path: 'search/people', element: <SearchPeople /> },
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
      { path: 'gear/:slug/zoom', element: <GearItemZoom /> },
      { path: 'gear/category/:slug', element: <GearCategory /> },
      { path: 'new/gear', element: <NewGear /> },
      { path: 'setup/:id', element: <Setup /> },
      { path: 'artist/:slug', element: <Artist /> },
      { path: 'new/event', element: <NewEvent /> },
      { path: 'event/:slug', element: <Event /> },
      { path: 'new/venue', element: <NewVenue /> },
      { path: 'venue/:slug', element: <Venue /> },
      { path: 'school/:slug', element: <Institution /> },
      { path: 'saved', element: <MySavedFavorites /> },
    ],
  },
  // ── Subpáginas de perfil ──────────────
  {
    element: <AppProfileLayout />,
    children: [
      { path: '/:username/gear', element: <ProfileGear /> },
      { path: '/:username/gear/:profileGearItemId', element: <ProfileGearItem /> }, // adicionando agora este aqui
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
          { path: 'portfolio', element: <Portfolio /> },
          { path: 'education', element: <Education /> },
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
          { path: 'artists', element: <AdminArtists /> },
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
