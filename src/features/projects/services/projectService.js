import apiClient from '@/services/api'

export async function getProjects(page = 1, pageSize = 100) {
  const res = await apiClient.get('/v1/projects/', {
    params: { page, page_size: pageSize },
  })
  return res.data.data
}
