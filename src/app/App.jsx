import { BrowserRouter, useRoutes } from 'react-router-dom'
import { AuthProvider } from '../features/auth/context/AuthContext'
import ErrorBoundary from '../shared/components/ErrorBoundary/ErrorBoundary'
import ThemeProvider from '../shared/components/ThemeProvider/ThemeProvider'
import { Toaster } from '../components/ui/sonner'
import routes from './routes'

function AppRoutes() {
  return useRoutes(routes)
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
