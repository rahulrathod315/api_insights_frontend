import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import apiClient from '../../services/api'
import './VerifyEmailPage.css'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('verifying') // verifying | success | error | no-token
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('no-token')
      return
    }

    async function verify() {
      try {
        await apiClient.post('/v1/auth/verify-email/', { token })
        setStatus('success')
      } catch (err) {
        setStatus('error')
        const data = err?.response?.data
        setMessage(data?.message || 'Verification failed. The link may have expired.')
      }
    }

    verify()
  }, [token])

  return (
    <AuthLayout>
      <div className="verify-email">
        {status === 'verifying' && (
          <>
            <div className="verify-email__icon verify-email__icon--loading">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <h2 className="verify-email__title">Verifying your email...</h2>
            <p className="verify-email__desc">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verify-email__icon verify-email__icon--success">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--app-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="verify-email__title">Email Verified</h2>
            <p className="verify-email__desc">Your email has been successfully verified. You can now access all features.</p>
            <button className="verify-email__btn" onClick={() => navigate('/')}>
              Go to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verify-email__icon verify-email__icon--error">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--app-error)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="verify-email__title">Verification Failed</h2>
            <p className="verify-email__desc">{message}</p>
            <button className="verify-email__btn" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </>
        )}

        {status === 'no-token' && (
          <>
            <div className="verify-email__icon verify-email__icon--error">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--app-error)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="verify-email__title">Invalid Link</h2>
            <p className="verify-email__desc">This verification link is invalid. Please request a new verification email from your settings.</p>
            <button className="verify-email__btn" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
