import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import PublicLayout from './components/layouts/PublicLayout'
import AppLayout from './components/layouts/AppLayout'
import AppProfileLayout from './components/layouts/AppProfileLayout'
import FullScreenLayout from './components/layouts/FullScreenLayout'
import BackstageLayout from './components/layouts/BackstageLayout'
import AppSettingsLayout from './components/layouts/AppSettingsLayout'
// Route guards / shells (mantidos eager)
import ProfileRouter from './components/ProfileRouter'
import ProjectRouter from './components/ProjectRouter'
import AdminRoute from './pages/admin/AdminRoute'
import AdminLayout from './pages/admin/AdminLayout'

// ── Public pages ──────────────────────────────────
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const Landing = lazy(() => import('./pages/Landing'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

// ── Authenticated pages ───────────────────────────
const Menu = lazy(() => import('./pages/Menu')) // for mobile devices
const NotificationsPage = lazy(() => import('./pages/NotificationsPage')) // for mobile devices
const CalendarPage = lazy(() => import('./pages/Calendar')) // for mobile devices
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Home = lazy(() => import('./pages/Home'))
const Feed = lazy(() => import('./pages/Feed'))
const MySavedFavorites = lazy(() => import('./pages/Saved'))
const SetlistEditor = lazy(() => import('./pages/SetlistEditor'))

// -- Search pages
const Search = lazy(() => import('./pages/Search'))
const SearchPeople = lazy(() => import('./pages/search/People'))
const SearchGenre = lazy(() => import('./pages/search/Genre'))

// -- Profile pages
const ProfileBio = lazy(() => import('./pages/ProfileBio'))
const ProfileGear = lazy(() => import('./pages/ProfileGear'))
const ProfileGearItem = lazy(() => import('./pages/ProfileGearItem'))
const Setup = lazy(() => import('./pages/Setup'))
// const Artist = lazy(() => import('./pages/Artist'))
const ProfileVisitors = lazy(() => import('./pages/ProfileVisitors'))

// -- Project pages
const Projects = lazy(() => import('./pages/Projects'))
const NewProject = lazy(() => import('./pages/NewProject'))
const Backstage = lazy(() => import('./pages/Backstage'))

// -- Gigs pages
const Gigs = lazy(() => import('./pages/Gigs'))
const Gig = lazy(() => import('./pages/Gig'))
const GigInvitations = lazy(() => import('./pages/GigInvitations'))
const GigInvitation = lazy(() => import('./pages/GigInvitation'))
const NewGig = lazy(() => import('./pages/NewGig'))

// -- Gear pages
const Gear = lazy(() => import('./pages/Gear'))
const GearItem = lazy(() => import('./pages/GearItem'))
const GearItemZoom = lazy(() => import('./pages/GearItemZoom'))
const GearCategory = lazy(() => import('./pages/GearCategory'))
const Brand = lazy(() => import('./pages/Brand'))
const NewGear = lazy(() => import('./pages/NewGear'))

// -- Events pages
const NewEvent = lazy(() => import('./pages/NewEvent'))
const Event = lazy(() => import('./pages/Event'))
const NewVenue = lazy(() => import('./pages/NewVenue'))
const Venue = lazy(() => import('./pages/Venue'))

// -- School pages
const Institution = lazy(() => import('./pages/Institution'))

// -- Feed pages
const Post = lazy(() => import('./pages/Post'))
const NewPost = lazy(() => import('./pages/NewPost'))

// -- Scene pages
const Scenes = lazy(() => import('./pages/Scenes'))
const NewScene = lazy(() => import('./pages/NewScene'))

// -- Pro page
const Pro = lazy(() => import('./pages/Pro'))

// -- Settings pages
const SettingsLayout = lazy(() => import('./pages/settings'))
const EditMyProfile = lazy(() => import('./pages/settings/EditMyProfile'))
const Plan = lazy(() => import('./pages/settings/Plan'))
const MusicalPreferences = lazy(() => import('./pages/settings/MusicalPreferences'))
const Password = lazy(() => import('./pages/settings/Password'))
const Endorsements = lazy(() => import('./pages/settings/Endorsements'))
const MyGear = lazy(() => import('./pages/settings/MyGear'))
const Availability = lazy(() => import('./pages/settings/Availability'))
const Picture = lazy(() => import('./pages/settings/Picture'))
const Portfolio = lazy(() => import('./pages/settings/Portfolio'))
const Education = lazy(() => import('./pages/settings/Education'))

// -- Admin pages
const AdminIndex = lazy(() => import('./pages/admin/index'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminBrands = lazy(() => import('./pages/admin/AdminBrands'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminVenues = lazy(() => import('./pages/admin/AdminVenues'))
const AdminPlans = lazy(() => import('./pages/admin/AdminPlans'))
const AdminColors = lazy(() => import('./pages/admin/AdminColors'))
const AdminArtists = lazy(() => import('./pages/admin/AdminArtists'))

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
  {
    path: 'artist/:slug',
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
      { path: 'genre/:genreId', element: <SearchGenre /> },
      { path: 'gigs', element: <Gigs /> },
      { path: 'gig/:id', element: <Gig /> },
      { path: 'gig-invitations', element: <GigInvitations /> },
      { path: 'gig-invitation/:id', element: <GigInvitation /> },
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
      // { path: 'artist/:slug', element: <Artist /> },
      { path: 'new/event', element: <NewEvent /> },
      { path: 'event/:slug', element: <Event /> },
      { path: 'new/venue', element: <NewVenue /> },
      { path: 'venue/:slug', element: <Venue /> },
      { path: 'school/:slug', element: <Institution /> },
      { path: 'new/scene', element: <NewScene /> },
      { path: 'saved', element: <MySavedFavorites /> },
      { path: 'setlists', element: <SetlistEditor /> },
      { path: 'setlists/:projectId', element: <SetlistEditor /> },
      { path: 'setlists/:projectId/:setlistId', element: <SetlistEditor /> },
      { path: 'profile-visitors', element: <ProfileVisitors /> },
      { path: 'pro', element: <Pro /> },
    ],
  },
  // ── Subpáginas de perfil ──────────────
  {
    element: <AppProfileLayout />,
    children: [
      { path: '/:username/bio', element: <ProfileBio /> },
      { path: '/:username/gear', element: <ProfileGear /> },
      { path: '/:username/gear/:profileGearItemId', element: <ProfileGearItem /> },
    ],
  },
  // ── Cenas (FullScreen) ──────────────
  {
    element: <FullScreenLayout />,
    children: [{ path: 'scenes', element: <Scenes /> }],
  },
  // ── Backstage ──────────────────────────
  {
    element: <BackstageLayout />,
    children: [{ path: 'backstage/:projectId', element: <Backstage /> }],
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
          { path: 'plan', element: <Plan /> },
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
