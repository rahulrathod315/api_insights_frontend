import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import { ResetPasswordForm } from '../../features/auth'
import { confirmPasswordReset } from '../../features/auth/services/authService'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [tokenError, setTokenError] = useState(!token)

  async function handleSubmit({ password, confirmPassword }) {
    setError('')
    setLoading(true)
    try {
      await confirmPasswordReset({
        token,
        new_password: password,
        new_password_confirm: confirmPassword,
      })
      setSuccess(true)
    } catch (err) {
      if (err?.code === 'INVALID_TOKEN') {
        setTokenError(true)
      } else if (err?.code === 'VALIDATION_ERROR' && err?.details) {
        const msgs = Object.values(err.details).flat().join('. ')
        setError(msgs)
      } else {
        setError(err?.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <ResetPasswordForm
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
        success={success}
        tokenError={tokenError}
      />
    </AuthLayout>
  )
}
