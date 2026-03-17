import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandHeader from '../BrandHeader/BrandHeader'
import PasswordInput from '../PasswordInput/PasswordInput'
import { validateResetPasswordForm } from '../../utils/validation'
import './ResetPasswordForm.css'

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

export default function ResetPasswordForm({ onSubmit, error, loading, success, tokenError }) {
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: undefined })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const { valid, errors } = validateResetPasswordForm(form)
    if (!valid) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    onSubmit?.(form)
  }

  if (tokenError) {
    return (
      <div className="auth-card">
        <BrandHeader tagline="Reset your password" />
        <div className="reset-password__error-view">
          <div className="reset-password__error-icon">
            <AlertIcon />
          </div>
          <h2 className="reset-password__error-title">Invalid or expired link</h2>
          <p className="reset-password__error-text">
            This password reset link is no longer valid. Please request a new one.
          </p>
          <Link to="/forgot-password" className="reset-password__link">
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="auth-card">
        <BrandHeader tagline="Reset your password" />
        <div className="reset-password__success">
          <div className="reset-password__success-icon">
            <CheckIcon />
          </div>
          <h2 className="reset-password__success-title">Password reset successful</h2>
          <p className="reset-password__success-text">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Link to="/login" className="reset-password__link">
            &larr; Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <BrandHeader tagline="Set your new password" />

      <form onSubmit={handleSubmit}>
        {error && <p className="auth-card__error">{error}</p>}

        <div className="auth-card__fields">
          <PasswordInput
            label="New Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
          />
          <PasswordInput
            label="Confirm New Password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
          />
        </div>

        <button className="auth-card__cta" type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'} <span className="auth-card__cta-arrow">{'\u2192'}</span>
        </button>
      </form>

      <p className="auth-card__switch">
        Remember your password?{' '}
        <Link to="/login" className="auth-card__switch-link">Sign in</Link>
      </p>
    </div>
  )
}
