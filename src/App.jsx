import { RouterProvider } from 'react-router-dom'
import {
  MantineProvider,
  createTheme,
  localStorageColorSchemeManager,
  Title,
  Badge,
  Pill,
  Button,
  Paper,
  Card,
  Switch,
} from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { AuthProvider } from './contexts/AuthContext'
import { UIProvider } from './contexts/UIContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import 'dayjs/locale/pt-br'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
// charts e schedule serão importadas via lazy imports apenas nas páginas que usam
import './styles.scss'

const theme = createTheme({
  primaryColor: 'mublinColor',
  primaryShade: 6,
  autoContrast: false,
  colors: {
    mublinColor: [
      '#ecefff',
      '#d5dafb',
      '#a9b1f1',
      '#7a87e9',
      '#5362e1',
      '#3a4bdd',
      '#2c40dc',
      '#1f32c4',
      '#182cb0',
      '#0a259c',
    ],
    mublinSecondary: [
      '#fff7e6',
      '#f8eed5',
      '#ebd39b',
      '#e5c680',
      '#ddb55a',
      '#d8aa42',
      '#d6a534',
      '#bd9026',
      '#a87f1e',
      '#926d10',
    ],
    mublinGray: [
      '#f5f5f5',
      '#e7e7e7',
      '#cdcdcd',
      '#b2b2b2',
      '#9a9a9a',
      '#8b8b8b',
      '#848484',
      '#717171',
      '#656565',
      '#1c1c1c',
    ],
  },
  fontFamily: 'Google Sans Flex, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily: 'Google Sans Flex, Helvetica, Arial, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  components: {
    Title: Title.extend({ defaultProps: { lts: '-0.02em' } }),
    Badge: Badge.extend({ defaultProps: { fw: '500', radius: 'sm' } }),
    Button: Button.extend({ defaultProps: { size: 'md', radius: 'xl' } }),
    Card: Card.extend({
      styles: {
        root: {
          backgroundColor: 'light-dark(#ffffff, #1c1c1c)',
          borderColor: 'light-dark(#dde1e7, #101010)',
        },
      },
      defaultProps: { shadow: 'xs' },
    }),
    Paper: Paper.extend({
      styles: {
        root: {
          backgroundColor: 'light-dark(#ffffff, #1c1c1c)',
          borderColor: 'light-dark(#dde1e7, #1f1f1f)',
        },
      },
    }),
    Pill: Pill.extend({
      styles: { root: { backgroundColor: 'light-dark(#e4e4e4, #1c1c1c)' } },
      defaultProps: { tt: 'uppercase', fw: 500 },
    }),
    Switch: Switch.extend({ defaultProps: { color: 'mublinColor' } }),
  },
})

const resolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': '#f0f2f5',
    '--mantine-color-default': '#ffffff',
    '--mantine-color-default-border': '#dde1e7',
  },
  dark: {
    '--mantine-color-body': '#101010',
    '--mantine-color-default': '#1c1c1c',
    '--mantine-color-default-border': '#101010',
    '--mantine-color-anchor': '#c9c9c9',
    '--mantine-color-text': '#e9ecef',
  },
})

const colorSchemeManager = localStorageColorSchemeManager({ key: 'mublin-color-scheme' })

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="auto"
      colorSchemeManager={colorSchemeManager}
      cssVariablesResolver={resolver}
    >
      <ModalsProvider>
        <Notifications autoClose={2200} position="top-center" />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <UIProvider>
              <DatesProvider settings={{ locale: 'pt-br', firstDayOfWeek: 0 }}>
                <RouterProvider router={router} />
              </DatesProvider>
            </UIProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  )
}
