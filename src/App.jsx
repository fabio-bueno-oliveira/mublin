import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { 
  MantineProvider, createTheme, 
  localStorageColorSchemeManager,
  Badge, Button
} from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AuthProvider } from './contexts/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css';
import '@mantine/schedule/styles.css';
import './styles.scss'

const theme = createTheme({
  autoContrast: true,
  primaryColor: 'linkedin',
  primaryShade: { light: 6, dark: 5 },

  colors: {
    amber: [
      '#fff8eb', // 0 - fundo suave
      '#ffedc2', // 1
      '#ffd980', // 2
      '#ffc23d', // 3
      '#ffb01a', // 4
      '#e6a817', // 5 - principal
      '#c98f0e', // 6 - hover
      '#a87209', // 7 - pressed
      '#865907', // 8
      '#634104', // 9 - texto escuro
    ],
    linkedin: [
      '#E8F3FF', '#CDE5FF', '#99C7FF', '#66A9FF', '#338BFF', 
      '#0A66C2',
      '#08529C', '#063F76', '#042C51', '#02192B'
    ],
  },

  fontFamily: 'Geist, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'monospace',
  headings: {
    fontFamily: 'Geist, Helvetica, Arial, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',

  components: {
    Badge: Badge.extend({
      defaultProps: {
        fw: '500',
      },
    }),
    Button: Button.extend({
      defaultProps: {
        size: "md",
      },
    }),
  },
})

const resolver = () => ({
  variables: {},
  light: {},
  dark: {
    '--mantine-color-body':           '#121212',  // fundo principal — preto suave
    '--mantine-color-default':        '#1e1e1e',  // Paper, Card, inputs
    '--mantine-color-default-border': '#2e2e2e',  // bordas
  },
})

const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mublin-color-scheme',
})

const queryClient = new QueryClient()

function App() {
  return (
    <React.Fragment>
      <MantineProvider 
        theme={theme} 
        defaultColorScheme="light"
        colorSchemeManager={colorSchemeManager}
        cssVariablesResolver={resolver}
      >
        <Notifications />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </MantineProvider>
    </React.Fragment>
  )
}

export default App
