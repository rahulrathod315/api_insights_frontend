import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandHeader from '../BrandHeader/BrandHeader'
import FormField from '../FormField/FormField'
import { validateForgotPasswordForm } from '../../utils/validation'
import './ForgotPasswordForm.css'

function EmailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function ForgotPasswordForm({ onSubmit, error, loading, submitted }) {
  const [form, setForm] = useState({ email: '' })
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
    const { valid, errors } = validateForgotPasswordForm(form)
    if (!valid) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    onSubmit?.(form)
  }

  if (submitted) {
    return (
      <div className="auth-card">
        <BrandHeader tagline="Check your email" />
        <div className="forgot-password__success">
          <div className="forgot-password__success-icon">
            <CheckIcon />
          </div>
          <h2 className="forgot-password__success-title">Reset link sent</h2>
          <p className="forgot-password__success-text">
            If an account exists for <strong>{form.email}</strong>, you'll receive
            an email with instructions to reset your password.
          </p>
          <Link to="/login" className="forgot-password__back-link">
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <BrandHeader tagline="Reset your password" />

      <form onSubmit={handleSubmit}>
        {error && <p className="auth-card__error">{error}</p>}

        <div className="auth-card__fields">
          <FormField
            label="Email Address"
            icon={<EmailIcon />}
            type="email"
            placeholder="john@example.com"
            name="email"
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
          />
        </div>

        <button className="auth-card__cta" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'} <span className="auth-card__cta-arrow">{'\u2192'}</span>
        </button>
      </form>

      <p className="auth-card__switch">
        Remember your password?{' '}
        <Link to="/login" className="auth-card__switch-link">Sign in</Link>
      </p>
    </div>
  )
}
