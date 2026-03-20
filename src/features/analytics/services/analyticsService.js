import apiClient from '@/services/api'

/**
 * Map UI granularity to query params for endpoints that accept days/hours.
 * "hour" → hours=1 (last 1 hour), "day" → days=1 (last 24 hours).
 */
function lookbackParams(granularity) {
  switch (granularity) {
    case 'hour':
      return { hours: 1 }
    case 'day':
      return { days: 1 }
    case '7days':
      return { days: 7 }
    case 'month':
      return { days: 30 }
    default:
      return { days: 7 }
  }
}

/**
 * Map UI granularity to time-series API params (granularity + lookback).
 * "hour" uses hourly buckets with hours=1; "day" uses hourly buckets over 1 day.
 */
function timeSeriesParams(granularity) {
  switch (granularity) {
    case 'hour':
      return { granularity: 'hour', hours: 1 }
    case 'day':
      return { granularity: 'hour', days: 1 }
    case '7days':
      return { granularity: 'day', days: 7 }
    case 'month':
      return { granularity: 'day', days: 30 }
    default:
      return { granularity: 'day', days: 7 }
  }
}

export async function getDashboardOverview(granularity = '7days') {
  const params = lookbackParams(granularity)
  const res = await apiClient.get('/v1/analytics/dashboard/', { params })
  return res.data.data
}

export async function getTimeSeries(projectId, granularity = '7days') {
  const params = timeSeriesParams(granularity)
  const res = await apiClient.get(`/v1/analytics/projects/${projectId}/time-series/`, { params })
  return res.data.data
}

export async function getRequestsPerEndpoint(projectId, granularity = '7days') {
  const params = lookbackParams(granularity)
  const res = await apiClient.get(`/v1/analytics/projects/${projectId}/requests-per-endpoint/`, { params })
  return res.data.data
}

export async function getUserAgents(projectId, granularity = '7days') {
  const params = lookbackParams(granularity)
  const res = await apiClient.get(`/v1/analytics/projects/${projectId}/user-agents/`, { params })
  return res.data.data
}
