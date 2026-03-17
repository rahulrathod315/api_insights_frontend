import { useState } from 'react'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import { ForgotPasswordForm } from '../../features/auth'
import { requestPasswordReset } from '../../features/auth/services/authService'

export default function ForgotPasswordPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit({ email }) {
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSubmitted(true)
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <ForgotPasswordForm
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
        submitted={submitted}
      />
    </AuthLayout>
  )
}
