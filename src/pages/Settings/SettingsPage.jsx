import { useState, useEffect } from 'react'
import { useAuth } from '../../features/auth/context/AuthContext'
import { updateProfile, changePassword } from '../../features/auth/services/profileService'
import './SettingsPage.css'

function ProfileSection({ user, onSaved }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    display_name: '',
    timezone: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        company_name: user.company_name || '',
        display_name: user.display_name || '',
        timezone: user.timezone || '',
      })
    }
  }, [user])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setMessage('')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await updateProfile(form)
      await onSaved()
      setMessage('Profile updated successfully')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-section card-surface">
      <h2 className="settings-section__title">Profile</h2>
      <p className="settings-section__desc">Update your personal information</p>
      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="settings-form__row">
          <label className="settings-form__field">
            <span className="settings-form__label">First Name</span>
            <input
              className="settings-form__input"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="First name"
            />
          </label>
          <label className="settings-form__field">
            <span className="settings-form__label">Last Name</span>
            <input
              className="settings-form__input"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder="Last name"
            />
          </label>
        </div>
        <label className="settings-form__field">
          <span className="settings-form__label">Display Name</span>
          <input
            className="settings-form__input"
            name="display_name"
            value={form.display_name}
            onChange={handleChange}
            placeholder="Display name"
          />
        </label>
        <label className="settings-form__field">
          <span className="settings-form__label">Company</span>
          <input
            className="settings-form__input"
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            placeholder="Company name"
          />
        </label>
        <label className="settings-form__field">
          <span className="settings-form__label">Timezone</span>
          <input
            className="settings-form__input"
            name="timezone"
            value={form.timezone}
            onChange={handleChange}
            placeholder="e.g. Asia/Kolkata"
          />
        </label>
        {message && <p className="settings-form__success">{message}</p>}
        {error && <p className="settings-form__error">{error}</p>}
        <div className="settings-form__actions">
          <button type="submit" className="settings-form__submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

function PasswordSection() {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setMessage('')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.new_password !== form.new_password_confirm) {
      setError('Passwords do not match')
      return
    }
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await changePassword(form)
      setMessage('Password changed successfully')
      setForm({ current_password: '', new_password: '', new_password_confirm: '' })
    } catch (err) {
      const data = err?.response?.data
      const msg = data?.errors?.current_password?.[0]
        || data?.errors?.new_password?.[0]
        || data?.message
        || 'Failed to change password'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-section card-surface">
      <h2 className="settings-section__title">Change Password</h2>
      <p className="settings-section__desc">Update your password to keep your account secure</p>
      <form className="settings-form" onSubmit={handleSubmit}>
        <label className="settings-form__field">
          <span className="settings-form__label">Current Password</span>
          <input
            className="settings-form__input"
            type="password"
            name="current_password"
            value={form.current_password}
            onChange={handleChange}
            placeholder="Enter current password"
          />
        </label>
        <div className="settings-form__row">
          <label className="settings-form__field">
            <span className="settings-form__label">New Password</span>
            <input
              className="settings-form__input"
              type="password"
              name="new_password"
              value={form.new_password}
              onChange={handleChange}
              placeholder="Enter new password"
            />
          </label>
          <label className="settings-form__field">
            <span className="settings-form__label">Confirm Password</span>
            <input
              className="settings-form__input"
              type="password"
              name="new_password_confirm"
              value={form.new_password_confirm}
              onChange={handleChange}
              placeholder="Confirm new password"
            />
          </label>
        </div>
        {message && <p className="settings-form__success">{message}</p>}
        {error && <p className="settings-form__error">{error}</p>}
        <div className="settings-form__actions">
          <button
            type="submit"
            className="settings-form__submit"
            disabled={saving || !form.current_password || !form.new_password}
          >
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

function AccountInfoSection({ user }) {
  return (
    <div className="settings-section card-surface">
      <h2 className="settings-section__title">Account</h2>
      <div className="settings-info">
        <div className="settings-info__row">
          <span className="settings-info__label">Email</span>
          <span className="settings-info__value">{user?.email}</span>
        </div>
        <div className="settings-info__row">
          <span className="settings-info__label">Email Verified</span>
          <span className={`settings-info__badge ${user?.is_email_verified ? 'settings-info__badge--success' : 'settings-info__badge--warning'}`}>
            {user?.is_email_verified ? 'Verified' : 'Not Verified'}
          </span>
        </div>
        <div className="settings-info__row">
          <span className="settings-info__label">Member Since</span>
          <span className="settings-info__value">
            {user?.date_joined
              ? new Date(user.date_joined).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
              : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1 className="settings-page__title">Settings</h1>
        <p className="settings-page__subtitle">Manage your account and preferences</p>
      </div>
      <div className="settings-page__sections">
        <ProfileSection user={user} onSaved={refreshUser} />
        <AccountInfoSection user={user} />
        <PasswordSection />
      </div>
    </div>
  )
}
