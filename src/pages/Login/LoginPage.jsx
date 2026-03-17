import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import { LoginForm } from '../../features/auth'
import { login, googleAuth, appleAuth } from '../../features/auth/services/authService'
import { useAuth } from '../../features/auth/context/AuthContext'

function getGoogleIdToken() {
  return new Promise((resolve, reject) => {
    const google = window.google
    if (!google?.accounts?.id) {
      reject(new Error('Google Sign-In SDK not loaded.'))
      return
    }

    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response.credential) {
          resolve(response.credential)
        } else {
          reject(new Error('No credential received from Google.'))
        }
      },
      cancel_on_tap_outside: false,
    })

    // Render a hidden button and click it to trigger the popup
    let container = document.getElementById('g_id_signin_hidden')
    if (!container) {
      container = document.createElement('div')
      container.id = 'g_id_signin_hidden'
      container.style.position = 'fixed'
      container.style.top = '-9999px'
      container.style.left = '-9999px'
      document.body.appendChild(container)
    }

    google.accounts.id.renderButton(container, {
      type: 'standard',
      size: 'large',
    })

    // Give the button time to render, then click it
    setTimeout(() => {
      const btn = container.querySelector('div[role="button"]')
      if (btn) {
        btn.click()
      } else {
        reject(new Error('Failed to open Google Sign-In popup.'))
      }
    }, 100)
  })
}

function getAppleAuthResponse() {
  const AppleID = window.AppleID
  if (!AppleID?.auth) {
    return Promise.reject(new Error('Apple Sign-In SDK not loaded.'))
  }

  AppleID.auth.init({
    clientId: import.meta.env.VITE_APPLE_SERVICE_ID,
    scope: 'name email',
    redirectURI: window.location.origin,
    usePopup: true,
  })

  return AppleID.auth.signIn()
}

const ERROR_MESSAGES = {
  ACCOUNT_LOCKED: 'Your account has been locked due to too many failed attempts. Please try again in 30 minutes.',
  '2FA_REQUIRED': 'Two-factor authentication is required.',
  AUTHENTICATION_ERROR: 'Invalid email or password.',
  INVALID_TOKEN: 'Your session has expired. Please sign in again.',
  THROTTLED: 'Too many login attempts. Please wait a moment and try again.',
}

function mapBackendFieldErrors(details) {
  if (!details || typeof details !== 'object') return {}
  const mapped = {}
  const fieldMap = { email: 'email', password: 'password' }
  for (const [key, value] of Object.entries(details)) {
    const frontendKey = fieldMap[key] || key
    mapped[frontendKey] = Array.isArray(value) ? value[0] : value
  }
  return mapped
}

export default function LoginPage() {
  const [error, setError] = useState('')
  const [serverErrors, setServerErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  async function handleLogin(formData) {
    setError('')
    setServerErrors({})
    setLoading(true)
    try {
      await login(formData)
      await refreshUser()
      navigate('/')
    } catch (err) {
      const apiError = err?.response?.data?.error || err
      if (apiError?.code === 'VALIDATION_ERROR' && apiError?.details) {
        setServerErrors(mapBackendFieldErrors(apiError.details))
      } else {
        setError(ERROR_MESSAGES[apiError?.code] || apiError?.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = useCallback(async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      setError('Google Sign-In is not configured.')
      return
    }

    setError('')
    try {
      const idToken = await getGoogleIdToken()
      setLoading(true)
      await googleAuth(idToken)
      await refreshUser()
      navigate('/')
    } catch (err) {
      if (err?.type !== 'dismissedByUser') {
        setError(err?.message || 'Google sign-in failed.')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate, refreshUser])

  const handleAppleAuth = useCallback(async () => {
    const serviceId = import.meta.env.VITE_APPLE_SERVICE_ID
    if (!serviceId) {
      setError('Apple Sign-In is not configured.')
      return
    }

    setError('')
    try {
      const res = await getAppleAuthResponse()
      setLoading(true)
      await appleAuth(res.authorization.id_token, res.authorization.code)
      await refreshUser()
      navigate('/')
    } catch (err) {
      if (err?.error !== 'popup_closed_by_user') {
        setError(err?.message || 'Apple sign-in failed.')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate, refreshUser])

  return (
    <AuthLayout>
      <LoginForm
        onSubmit={handleLogin}
        onGoogleAuth={handleGoogleAuth}
        onAppleAuth={handleAppleAuth}
        error={error}
        serverErrors={serverErrors}
        loading={loading}
      />
    </AuthLayout>
  )
}
