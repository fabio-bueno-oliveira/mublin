import React from 'react'
import { RouterProvider } from 'react-router-dom'
import {
  MantineProvider, createTheme,
  localStorageColorSchemeManager,
  Badge, Pill, Button, Paper, Divider, Switch
} from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AuthProvider } from './contexts/AuthContext'
import { UIProvider } from './contexts/UIContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/schedule/styles.css'
import './styles.scss'

const mublinGreen = [ // Petrol Green, Deep Teal
  '#e4f2ef',
  '#c0e4dd',
  '#8ed0c5',
  '#5ab8a8',
  '#1fa68e',
  '#198f79',
  '#127260',
  '#0d5a4c',
  '#084038',
  '#042820',
]

const theme = createTheme({
  autoContrast: true,
  primaryColor: 'mublinGreen',
  // primaryShade: { light: 4, dark: 5 },
  colors: {
    mublinGreen,
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
        size: 'md',
        variant: "filled",
      },
    }),
    Card: Paper.extend({
      styles: {
        root: {
          backgroundColor: 'light-dark(#ffffff, #1c1c1c)',
          borderColor: 'light-dark(#dde1e7, #101010)',
        },
      },
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
      styles: {
        root: {
          backgroundColor: 'light-dark(#e4e4e4, #1c1c1c)'
        },
      },
      defaultProps: {
        tt: "uppercase",
        fw: 500
      },
    }),
    Switch: Switch.extend({
      defaultProps: {
        color: "lime",
      },
    }),
    Divider: Divider.extend({
      defaultProps: {
        opacity: 0.5,
      },
    }),
  },
})

const resolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body':           '#f0f2f5',
    '--mantine-color-default':        '#ffffff',
    '--mantine-color-default-border': '#dde1e7',
  },
  dark: {
    '--mantine-color-body':           '#101010',
    '--mantine-color-default':        '#1c1c1c',
    '--mantine-color-default-border': '#101010',
    '--mantine-color-anchor':         '#c9c9c9',
    '--mantine-color-text':           '#e9ecef',
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
            <UIProvider>
              <RouterProvider router={router} />
            </UIProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MantineProvider>
    </React.Fragment>
  )
}

export default App
