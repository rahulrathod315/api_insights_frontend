import apiClient from '../../../services/api'

export async function getProfile() {
  const { data: res } = await apiClient.get('/v1/auth/profile/')
  if (!res.success) throw res.error
  return res.data
}

export async function updateProfile(data) {
  const res = await apiClient.patch('/v1/auth/profile/', data)
  return res.data.data
}

export async function changePassword({ current_password, new_password, new_password_confirm }) {
  const res = await apiClient.post('/v1/auth/change-password/', {
    current_password,
    new_password,
    new_password_confirm,
  })
  return res.data
}

export async function resendVerificationEmail() {
  const res = await apiClient.post('/v1/auth/verify-email/resend/')
  return res.data
}

export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)
  const res = await apiClient.post('/v1/auth/profile/avatar/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function deleteAvatar() {
  const res = await apiClient.delete('/v1/auth/profile/avatar/')
  return res.data
}
