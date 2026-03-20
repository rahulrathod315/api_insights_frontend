import apiClient from '@/services/api'

export async function getProjects(page = 1, pageSize = 100) {
  const res = await apiClient.get('/v1/projects/', {
    params: { page, page_size: pageSize },
  })
  return res.data.data
}

export async function createProject({ name, description }) {
  const res = await apiClient.post('/v1/projects/', { name, description })
  return res.data.data
}

export async function updateProject(id, data) {
  const res = await apiClient.put(`/v1/projects/${id}/`, data)
  return res.data.data
}

export async function deleteProject(id) {
  await apiClient.delete(`/v1/projects/${id}/`)
}

export async function regenerateApiKey(id) {
  const res = await apiClient.post(`/v1/projects/${id}/regenerate-key/`)
  return res.data.data
}
