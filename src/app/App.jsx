import { BrowserRouter, useRoutes } from 'react-router-dom'
import { AuthProvider } from '../features/auth/context/AuthContext'
import routes from './routes'

function AppRoutes() {
  return useRoutes(routes)
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
