import axios from 'axios'
import { toast } from 'sonner'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Auth endpoints that should never trigger a 401 redirect or token refresh
const AUTH_ENDPOINTS = [
  '/v1/auth/login/',
  '/v1/auth/register/',
  '/v1/auth/social/google/',
  '/v1/auth/social/apple/',
  '/v1/auth/password-reset/',
  '/v1/auth/password-reset/confirm/',
  '/v1/auth/verify-email/',
  '/v1/auth/token/refresh/',
  '/v1/auth/2fa/challenge/',
]

function isAuthEndpoint(url) {
  return AUTH_ENDPOINTS.some((ep) => url?.includes(ep))
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Track whether a token refresh is already in progress
let isRefreshing = false
let refreshSubscribers = []

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb)
}

// Handle responses and errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Don't intercept auth endpoints — let the calling code handle errors
    if (isAuthEndpoint(originalRequest?.url)) {
      return Promise.reject(error)
    }

    // If 401 and we haven't already retried, attempt a silent token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        // No refresh token — force logout
        forceLogout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Another refresh is in progress — queue this request
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data: res } = await axios.post(`${API_URL}/v1/auth/token/refresh/`, {
          refresh: refreshToken,
        })

        const newAccess = res.data.access
        const newRefresh = res.data.refresh

        localStorage.setItem('access_token', newAccess)
        if (newRefresh) {
          localStorage.setItem('refresh_token', newRefresh)
        }

        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        onRefreshed(newAccess)

        return apiClient(originalRequest)
      } catch {
        // Refresh failed — force logout
        forceLogout()
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

function forceLogout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  toast.error('Your session has expired. Please sign in again.')
  window.location.href = '/login'
}

export default apiClient
