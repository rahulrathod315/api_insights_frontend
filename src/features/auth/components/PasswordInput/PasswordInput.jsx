import { useState } from 'react'
import './PasswordInput.css'

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  )
}

export default function PasswordInput({
  label = 'Password',
  placeholder = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
  value,
  onChange,
  name,
  rightLabel,
  error,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={`form-field${error ? ' form-field--error' : ''}`}>
      <div className="form-field__label-row">
        <label className="form-field__label">{label}</label>
        {rightLabel}
      </div>
      <div className="form-field__input-wrap">
        <span className="form-field__icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
        <input
          className="form-field__input"
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
          autoComplete="off"
        />
        <button
          className="password-input__toggle"
          type="button"
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <p className="form-field__error">{error}</p>}
    </div>
  )
}
