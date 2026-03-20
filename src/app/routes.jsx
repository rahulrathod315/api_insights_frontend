import { Navigate } from 'react-router-dom'
import AuthRoute from '../shared/components/AuthRoute/AuthRoute'
import ProtectedRoute from '../shared/components/ProtectedRoute/ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout/DashboardLayout'
import LoginPage from '../pages/Login/LoginPage'
import RegisterPage from '../pages/Register/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPassword/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPassword/ResetPasswordPage'
import DashboardPage from '../pages/Dashboard/DashboardPage'
import SettingsPage from '../pages/Settings/SettingsPage'
import ProjectsPage from '../pages/Projects/ProjectsPage'

const routes = [
  {
    path: '/login',
    element: <AuthRoute><LoginPage /></AuthRoute>,
  },
  {
    path: '/register',
    element: <AuthRoute><RegisterPage /></AuthRoute>,
  },
  {
    path: '/forgot-password',
    element: <AuthRoute><ForgotPasswordPage /></AuthRoute>,
  },
  {
    path: '/reset-password',
    element: <AuthRoute><ResetPasswordPage /></AuthRoute>,
  },
  {
    path: '/',
    element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]

export default routes
