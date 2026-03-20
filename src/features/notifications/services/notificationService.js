import apiClient from '../../../services/api'

export async function getNotifications() {
  const { data: res } = await apiClient.get('/v1/auth/notifications/inbox/')
  return res.data
}

export async function getUnreadCount() {
  const { data: res } = await apiClient.get('/v1/auth/notifications/inbox/unread-count/')
  return res.data
}

export async function markNotificationRead(notificationId) {
  const { data: res } = await apiClient.post(`/v1/auth/notifications/inbox/${notificationId}/read/`)
  return res.data
}

export async function markAllNotificationsRead() {
  const { data: res } = await apiClient.post('/v1/auth/notifications/inbox/read-all/')
  return res.data
}
