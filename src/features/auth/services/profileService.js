import apiClient from '../../../services/api'

export async function getProfile() {
  const { data: res } = await apiClient.get('/v1/auth/profile/')
  if (!res.success) throw res.error
  return res.data
}
