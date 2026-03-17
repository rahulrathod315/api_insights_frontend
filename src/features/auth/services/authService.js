import apiClient from '../../../services/api'

function storeTokens(data) {
  const access = data.tokens?.access
  const refresh = data.tokens?.refresh
  if (access) localStorage.setItem('access_token', access)
  if (refresh) localStorage.setItem('refresh_token', refresh)
}

export async function login({ email, password }) {
  const { data: res } = await apiClient.post('/v1/auth/login/', { email, password })
  if (!res.success) throw res.error
  if (res.data.requires_2fa) {
    return res.data
  }
  storeTokens(res.data)
  return res.data
}

export async function register({ email, password, password_confirm, first_name, last_name, phone }) {
  const payload = { email, password, password_confirm, first_name, last_name }
  if (phone) payload.phone = phone
  const { data: res } = await apiClient.post('/v1/auth/register/', payload)
  if (!res.success) throw res.error
  if (res.data.tokens) {
    storeTokens(res.data)
  }
  return res.data
}

export async function googleAuth(idToken) {
  const { data: res } = await apiClient.post('/v1/auth/social/google/', {
    id_token: idToken,
  })
  if (!res.success) throw res.error
  storeTokens(res.data)
  return res.data
}

export async function appleAuth(idToken, authCode) {
  const payload = { id_token: idToken }
  if (authCode) payload.auth_code = authCode
  const { data: res } = await apiClient.post('/v1/auth/social/apple/', payload)
  if (!res.success) throw res.error
  storeTokens(res.data)
  return res.data
}

export async function requestPasswordReset(email) {
  const { data: res } = await apiClient.post('/v1/auth/password-reset/', { email })
  if (!res.success) throw res.error
  return res
}

export async function confirmPasswordReset({ token, new_password, new_password_confirm }) {
  const { data: res } = await apiClient.post('/v1/auth/password-reset/confirm/', {
    token, new_password, new_password_confirm,
  })
  if (!res.success) throw res.error
  return res
}
