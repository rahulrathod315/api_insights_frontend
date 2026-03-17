const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const COMMON_PASSWORDS = [
  'password', '12345678', '123456789', '1234567890', 'qwerty123',
  'abc12345', 'password1', 'iloveyou', 'admin123', 'welcome1',
]

export function validateLoginForm({ email, password }) {
  const errors = {}

  if (!email?.trim()) {
    errors.email = 'Email is required'
  } else if (!EMAIL_RE.test(email.trim())) {
    errors.email = 'Enter a valid email address'
  }

  if (!password) {
    errors.password = 'Password is required'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

const PHONE_RE = /^\+\d{1,4}\d{10}$/

export function validateRegisterForm({ firstName, lastName, email, phone, password, confirmPassword }) {
  const errors = {}

  if (!firstName?.trim()) {
    errors.firstName = 'First name is required'
  }

  if (!lastName?.trim()) {
    errors.lastName = 'Last name is required'
  }

  if (!email?.trim()) {
    errors.email = 'Email is required'
  } else if (!EMAIL_RE.test(email.trim())) {
    errors.email = 'Enter a valid email address'
  }

  if (phone && !PHONE_RE.test(phone)) {
    errors.phone = 'Enter a valid phone number with 10 digits'
  }

  if (!password) {
    errors.password = 'Password is required'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  } else if (/^\d+$/.test(password)) {
    errors.password = 'Password cannot be entirely numeric'
  } else if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.password = 'This password is too common'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateForgotPasswordForm({ email }) {
  const errors = {}

  if (!email?.trim()) {
    errors.email = 'Email is required'
  } else if (!EMAIL_RE.test(email.trim())) {
    errors.email = 'Enter a valid email address'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateResetPasswordForm({ password, confirmPassword }) {
  const errors = {}

  if (!password) {
    errors.password = 'Password is required'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  } else if (/^\d+$/.test(password)) {
    errors.password = 'Password cannot be entirely numeric'
  } else if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.password = 'This password is too common'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
