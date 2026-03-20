import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../features/auth/context/AuthContext'
import { updateProfile, changePassword, resendVerificationEmail, uploadAvatar, deleteAvatar } from '../../features/auth/services/profileService'
import './SettingsPage.css'

function resolveAvatarUrl(avatarUrl) {
  if (!avatarUrl) return null
  return avatarUrl
}

const SECTIONS = [
  {
    id: 'account',
    label: 'Account Settings',
    desc: 'Personal Information, Email',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
  {
    id: 'security',
    label: 'Security',
    desc: 'Change Password',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
]

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const LOCALES = [
  { value: 'en-us', label: 'English (US)' },
  { value: 'en-gb', label: 'English (UK)' },
  { value: 'fr-fr', label: 'French' },
  { value: 'de-de', label: 'German' },
  { value: 'es-es', label: 'Spanish' },
  { value: 'pt-br', label: 'Portuguese (BR)' },
  { value: 'ja-jp', label: 'Japanese' },
  { value: 'zh-cn', label: 'Chinese (Simplified)' },
  { value: 'hi-in', label: 'Hindi' },
]

function computeProfileCompletion(user) {
  if (!user) return 0
  const fields = ['first_name', 'last_name', 'email', 'phone', 'company_name', 'display_name', 'timezone', 'is_email_verified']
  const filled = fields.filter(f => {
    if (f === 'is_email_verified') return user[f] === true
    return user[f] && String(user[f]).trim()
  }).length
  return Math.round((filled / fields.length) * 100)
}

function ProfileCompletionCard({ user }) {
  const pct = computeProfileCompletion(user)
  const r = 32
  const circumference = 2 * Math.PI * r
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="settings-nav__completion">
      <div className="settings-nav__completion-ring">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="var(--app-border)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r={r}
            fill="none"
            stroke="var(--app-accent)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 40 40)"
            className="settings-nav__completion-progress"
          />
        </svg>
        <span className="settings-nav__completion-pct">{pct}%</span>
      </div>
      <div className="settings-nav__completion-text">
        <span className="settings-nav__completion-title">Profile Information</span>
        <span className="settings-nav__completion-desc">Complete your profile to unlock all features</span>
      </div>
    </div>
  )
}

function AccountPanel({ user, onSaved }) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company_name: '',
    display_name: '',
    timezone: '',
    locale: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')
  const [verifyErr, setVerifyErr] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        company_name: user.company_name || '',
        display_name: user.display_name || '',
        timezone: user.timezone || 'UTC',
        locale: user.locale || 'en-us',
      })
      setDirty(false)
    }
  }, [user])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setMessage('')
    setError('')
    setDirty(true)
  }

  function handleDiscard() {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        company_name: user.company_name || '',
        display_name: user.display_name || '',
        timezone: user.timezone || 'UTC',
        locale: user.locale || 'en-us',
      })
    }
    setMessage('')
    setError('')
    setDirty(false)
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
      setDirty(false)
    } catch (err) {
      const data = err?.response?.data
      const fieldErrors = data?.errors
      if (fieldErrors) {
        const firstErr = Object.values(fieldErrors).flat()[0]
        setError(firstErr || data?.message || 'Failed to update profile')
      } else {
        setError(data?.message || 'Failed to update profile')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleResendVerification() {
    setVerifying(true)
    setVerifyMsg('')
    setVerifyErr('')
    try {
      await resendVerificationEmail()
      setVerifyMsg('Verification email sent. Check your inbox.')
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to send verification email'
      setVerifyErr(msg)
    } finally {
      setVerifying(false)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    setError('')
    try {
      await uploadAvatar(file)
      await onSaved()
    } catch {
      setError('Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  async function handleAvatarDelete() {
    setUploadingAvatar(true)
    setError('')
    try {
      await deleteAvatar()
      await onSaved()
    } catch {
      setError('Failed to remove avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const initials = user
    ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase() || user.email?.[0]?.toUpperCase() || '?'
    : '?'

  const avatarSrc = resolveAvatarUrl(user?.avatar_url)

  return (
    <div className="settings-panel">
      <h2 className="settings-panel__title">Account Settings</h2>

      {/* Avatar */}
      <div className="settings-panel__section">
        <h3 className="settings-panel__section-title">Profile Photo</h3>
        <p className="settings-panel__section-desc">Upload a photo to personalize your account</p>
        <div className="settings-panel__divider" />

        <div className="settings-avatar">
          <div className="settings-avatar__preview">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="settings-avatar__img" />
            ) : (
              <span className="settings-avatar__initials">{initials}</span>
            )}
          </div>
          <div className="settings-avatar__actions">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="settings-avatar__file-input"
            />
            <button
              type="button"
              className="settings-form__submit"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
            </button>
            {avatarSrc && (
              <button
                type="button"
                className="settings-form__discard"
                onClick={handleAvatarDelete}
                disabled={uploadingAvatar}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="settings-panel__section">
        <h3 className="settings-panel__section-title">Personal Information</h3>
        <p className="settings-panel__section-desc">Update your personal details</p>
        <div className="settings-panel__divider" />

        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="settings-form__row">
            <label className="settings-form__field">
              <span className="settings-form__label">First Name</span>
              <input className="settings-form__input" name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" />
            </label>
            <label className="settings-form__field">
              <span className="settings-form__label">Last Name</span>
              <input className="settings-form__input" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" />
            </label>
          </div>

          <label className="settings-form__field">
            <span className="settings-form__label">Email Address</span>
            <div className="settings-form__input-with-badge">
              <input className="settings-form__input settings-form__input--readonly" value={user?.email || ''} readOnly />
              <span className={`settings-form__badge ${user?.is_email_verified ? 'settings-form__badge--success' : 'settings-form__badge--warning'}`}>
                {user?.is_email_verified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
            {user && !user.is_email_verified && (
              <div className="settings-form__verify-row">
                <button
                  type="button"
                  className="settings-form__verify-btn"
                  onClick={handleResendVerification}
                  disabled={verifying}
                >
                  {verifying ? 'Sending...' : 'Send Verification Email'}
                </button>
                {verifyMsg && <span className="settings-form__success">{verifyMsg}</span>}
                {verifyErr && <span className="settings-form__error">{verifyErr}</span>}
              </div>
            )}
          </label>

          <div className="settings-form__row">
            <label className="settings-form__field">
              <span className="settings-form__label">Phone Number</span>
              <input className="settings-form__input" name="phone" value={form.phone} onChange={handleChange} placeholder="+1234567890" />
            </label>
            <label className="settings-form__field">
              <span className="settings-form__label">Display Name</span>
              <input className="settings-form__input" name="display_name" value={form.display_name} onChange={handleChange} placeholder="Display name" />
            </label>
          </div>

          <label className="settings-form__field">
            <span className="settings-form__label">Company</span>
            <input className="settings-form__input" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company name" />
          </label>

          <div className="settings-form__row">
            <label className="settings-form__field">
              <span className="settings-form__label">Timezone</span>
              <select className="settings-form__input settings-form__select" name="timezone" value={form.timezone} onChange={handleChange}>
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>
            <label className="settings-form__field">
              <span className="settings-form__label">Language</span>
              <select className="settings-form__input settings-form__select" name="locale" value={form.locale} onChange={handleChange}>
                {LOCALES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </label>
          </div>

          {message && <p className="settings-form__success">{message}</p>}
          {error && <p className="settings-form__error">{error}</p>}

          <div className="settings-panel__divider" />

          <div className="settings-form__footer">
            <button type="button" className="settings-form__discard" onClick={handleDiscard} disabled={!dirty || saving}>Discard Changes</button>
            <button type="submit" className="settings-form__submit" disabled={saving || !dirty}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SecurityPanel() {
  const [form, setForm] = useState({ current_password: '', new_password: '', new_password_confirm: '' })
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
      const msg = data?.errors?.current_password?.[0] || data?.errors?.new_password?.[0] || data?.message || 'Failed to change password'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-panel">
      <h2 className="settings-panel__title">Security</h2>

      <div className="settings-panel__section">
        <h3 className="settings-panel__section-title">Change Password</h3>
        <p className="settings-panel__section-desc">Update your password to keep your account secure</p>
        <div className="settings-panel__divider" />

        <form className="settings-form" onSubmit={handleSubmit}>
          <label className="settings-form__field">
            <span className="settings-form__label">Current Password</span>
            <input className="settings-form__input" type="password" name="current_password" value={form.current_password} onChange={handleChange} placeholder="Enter current password" />
          </label>
          <div className="settings-form__row">
            <label className="settings-form__field">
              <span className="settings-form__label">New Password</span>
              <input className="settings-form__input" type="password" name="new_password" value={form.new_password} onChange={handleChange} placeholder="Enter new password" />
            </label>
            <label className="settings-form__field">
              <span className="settings-form__label">Confirm Password</span>
              <input className="settings-form__input" type="password" name="new_password_confirm" value={form.new_password_confirm} onChange={handleChange} placeholder="Confirm new password" />
            </label>
          </div>

          {message && <p className="settings-form__success">{message}</p>}
          {error && <p className="settings-form__error">{error}</p>}

          <div className="settings-panel__divider" />

          <div className="settings-form__footer">
            <div />
            <button type="submit" className="settings-form__submit" disabled={saving || !form.current_password || !form.new_password}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [activeSection, setActiveSection] = useState('account')

  return (
    <div className="settings-page">
      <div className="settings-page__nav">
        <ProfileCompletionCard user={user} />

        <div className="settings-nav__list">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`settings-nav__item ${activeSection === s.id ? 'settings-nav__item--active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span className="settings-nav__item-icon">{s.icon}</span>
              <div className="settings-nav__item-text">
                <span className="settings-nav__item-label">{s.label}</span>
                <span className="settings-nav__item-desc">{s.desc}</span>
              </div>
              <svg className="settings-nav__item-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-page__content">
        {activeSection === 'account' && <AccountPanel user={user} onSaved={refreshUser} />}
        {activeSection === 'security' && <SecurityPanel />}
      </div>
    </div>
  )
}
