import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandHeader from '../BrandHeader/BrandHeader'
import SocialAuthButtons from '../SocialAuthButtons/SocialAuthButtons'
import AuthDivider from '../AuthDivider/AuthDivider'
import FormField from '../FormField/FormField'
import PasswordInput from '../PasswordInput/PasswordInput'
import { validateLoginForm } from '../../utils/validation'
import './LoginForm.css'

function EmailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

export default function LoginForm({ onSubmit, onGoogleAuth, onAppleAuth, error, serverErrors, loading }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  const mergedErrors = { ...serverErrors, ...fieldErrors }

  function handleChange(e) {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: undefined })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const { valid, errors } = validateLoginForm(form)
    if (!valid) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    onSubmit?.(form)
  }

  return (
    <div className="auth-card">
      <BrandHeader tagline="Sign in to your APIVUE dashboard" />

      <SocialAuthButtons onGoogleClick={onGoogleAuth} onAppleClick={onAppleAuth} />
      <AuthDivider />

      <form onSubmit={handleSubmit} noValidate>
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
            error={mergedErrors.email}
          />
          <PasswordInput
            label="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            error={mergedErrors.password}
            rightLabel={
              <Link to="/forgot-password" className="auth-card__forgot-link">
                Forgot password?
              </Link>
            }
          />
        </div>

        <button className="auth-card__cta" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'} <span className="auth-card__cta-arrow">{'\u2192'}</span>
        </button>
      </form>

      <p className="auth-card__switch">
        Don't have an account?{' '}
        <Link to="/register" className="auth-card__switch-link">Sign up</Link>
      </p>
    </div>
  )
}
