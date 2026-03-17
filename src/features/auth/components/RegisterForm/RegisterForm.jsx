import { useState } from 'react'
import { Link } from 'react-router-dom'
import BrandHeader from '../BrandHeader/BrandHeader'
import SocialAuthButtons from '../SocialAuthButtons/SocialAuthButtons'
import AuthDivider from '../AuthDivider/AuthDivider'
import FormField from '../FormField/FormField'
import PasswordInput from '../PasswordInput/PasswordInput'
import PhoneInput from '../PhoneInput/PhoneInput'
import { validateRegisterForm } from '../../utils/validation'
import './RegisterForm.css'

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

export default function RegisterForm({ onSubmit, onGoogleAuth, onAppleAuth, error, serverErrors, loading }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
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
    const { valid, errors } = validateRegisterForm(form)
    if (!valid) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    onSubmit?.(form)
  }

  return (
    <div className="auth-card">
      <BrandHeader tagline="Monitor, analyse, and act on your API data" />

      <SocialAuthButtons onGoogleClick={onGoogleAuth} onAppleClick={onAppleAuth} />
      <AuthDivider />

      <form onSubmit={handleSubmit} noValidate>
        {error && <p className="auth-card__error">{error}</p>}

        <div className="auth-card__fields">
          <div className="register-form__name-row">
            <FormField
              label="First Name"
              icon={<UserIcon />}
              placeholder="John"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              error={mergedErrors.firstName}
            />
            <FormField
              label="Last Name"
              icon={<UserIcon />}
              placeholder="Doe"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              error={mergedErrors.lastName}
            />
          </div>

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

          <div className={`form-field${mergedErrors.phone ? ' form-field--error' : ''}`}>
            <div className="form-field__label-row">
              <label className="form-field__label">Phone Number</label>
            </div>
            <PhoneInput
              name="phone"
              value={form.phone}
              onChange={handleChange}
              error={mergedErrors.phone}
            />
          </div>

          <PasswordInput
            label="Password"
            name="password"
            value={form.password}
            onChange={handleChange}
            error={mergedErrors.password}
          />
          <PasswordInput
            label="Confirm Password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            error={mergedErrors.confirmPassword}
          />
        </div>

        <button className="auth-card__cta" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Get Started'} <span className="auth-card__cta-arrow">{'\u2192'}</span>
        </button>
      </form>

      <p className="auth-card__switch">
        Already have an account?{' '}
        <Link to="/login" className="auth-card__switch-link">Sign in</Link>
      </p>
    </div>
  )
}
