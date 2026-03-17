import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext'
import LoadingScreen from '../LoadingScreen/LoadingScreen'

export default function AuthRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}
