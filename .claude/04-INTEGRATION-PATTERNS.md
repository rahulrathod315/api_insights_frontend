# Frontend Integration Patterns

Concrete code patterns for integrating with the backend API.

---

## API Client Setup

The project has `src/api.js` with Axios + JWT interceptors already configured.

```javascript
import apiClient from '../services/api'

// All requests go through this client.
// It automatically:
//   - Adds Authorization: Bearer <token> from localStorage
//   - Redirects to /login on 401

// Usage in service files:
const response = await apiClient.get('/projects/')
const data = response.data.data  // unwrap standard envelope
```

---

## Authentication Flows

### Registration → Email Verification → Login

```javascript
// 1. Register
const res = await apiClient.post('/auth/register/', {
  email, password, password_confirm, first_name, last_name
})
const { user, tokens } = res.data.data
localStorage.setItem('access_token', tokens.access)
localStorage.setItem('refresh_token', tokens.refresh)
// User is now logged in but email is NOT verified.
// Show "check your email" notice.

// 2. User clicks email link → frontend extracts token from URL
// Route: /verify-email?token=xxx
const token = new URLSearchParams(window.location.search).get('token')
await apiClient.post('/auth/verify-email/', { token })

// 3. Standard login (for returning users)
const loginRes = await apiClient.post('/auth/login/', { email, password })

if (loginRes.data.data.requires_2fa) {
  // Store challenge token, navigate to 2FA page
  const challengeToken = loginRes.data.data.challenge_token
  // Show TOTP code input
} else {
  const { user, tokens } = loginRes.data.data
  localStorage.setItem('access_token', tokens.access)
  localStorage.setItem('refresh_token', tokens.refresh)
}
```

### 2FA Challenge (during login)

```javascript
const res = await apiClient.post('/auth/2fa/challenge/', {
  challenge_token: savedChallengeToken,
  code: userEnteredCode  // 6-digit TOTP or "XXXX-XXXX" recovery code
})
const { user, tokens } = res.data.data
localStorage.setItem('access_token', tokens.access)
localStorage.setItem('refresh_token', tokens.refresh)
```

### 2FA Setup (in settings)

```javascript
// 1. Initiate setup — shows QR code
const setup = await apiClient.post('/auth/2fa/setup/')
const { secret, provisioning_uri, qr_code } = setup.data.data
// Display qr_code (base64 PNG) for user to scan

// 2. User enters code from authenticator app
const verify = await apiClient.post('/auth/2fa/verify-setup/', { code: '123456' })
const { recovery_codes } = verify.data.data
// IMPORTANT: Display recovery_codes to user. They can only see them once.
```

### Token Refresh

```javascript
// When access token expires (401), refresh it:
const res = await apiClient.post('/auth/token/refresh/', {
  refresh: localStorage.getItem('refresh_token')
})
localStorage.setItem('access_token', res.data.data.access)
localStorage.setItem('refresh_token', res.data.data.refresh)
// Old refresh token is now blacklisted — must use the new one.
```

### Password Reset

```javascript
// 1. Request reset (always succeeds to prevent email enumeration)
await apiClient.post('/auth/password-reset/', { email })

// 2. User clicks email link → frontend route: /reset-password?token=xxx
const token = new URLSearchParams(window.location.search).get('token')
await apiClient.post('/auth/password-reset/confirm/', {
  token, new_password, new_password_confirm
})
```

### Social Auth (Google)

```javascript
// 1. Get Google id_token via Google Sign-In SDK
// 2. Send to backend
const res = await apiClient.post('/auth/social/google/', { id_token: googleIdToken })
const { user, tokens, is_new_user } = res.data.data
localStorage.setItem('access_token', tokens.access)
localStorage.setItem('refresh_token', tokens.refresh)
// is_new_user: true if account was just created
```

---

## Project Management

```javascript
// List projects (paginated)
const res = await apiClient.get('/projects/', { params: { page: 1, page_size: 20 } })
const projects = res.data.data        // array
const pageInfo = res.data.page_info   // { count, total_pages, current_page, page_size }

// Create project
const res = await apiClient.post('/projects/', { name: 'My API', description: '...' })
const project = res.data.data  // includes generated api_key

// Get project detail (includes endpoints array)
const res = await apiClient.get(`/projects/${projectId}/`)

// Update project
await apiClient.patch(`/projects/${projectId}/`, { name: 'New Name' })

// Delete project
await apiClient.delete(`/projects/${projectId}/`)

// Regenerate API key (requires confirmation)
const res = await apiClient.post(`/projects/${projectId}/regenerate-key/`, { confirm: true })
const newApiKey = res.data.data.api_key
```

### Endpoints (within a project)

```javascript
// List endpoints with filtering
const res = await apiClient.get(`/projects/${projectId}/endpoints/`, {
  params: { search: '/users', method: 'GET', page: 1 }
})

// Create endpoint
await apiClient.post(`/projects/${projectId}/endpoints/`, {
  path: '/api/users', method: 'GET', name: 'List Users'
})

// Note: Endpoints are also auto-created when the tracking API first sees a new path+method.
```

### Team Members

```javascript
// List members
const res = await apiClient.get(`/projects/${projectId}/members/`)

// Add member (user must already have an account)
await apiClient.post(`/projects/${projectId}/members/`, {
  email: 'colleague@example.com', role: 'member'
})

// Update role
await apiClient.patch(`/projects/${projectId}/members/${membershipId}/`, { role: 'admin' })

// Remove member
await apiClient.delete(`/projects/${projectId}/members/${membershipId}/`)

// Leave project (cannot if owner)
await apiClient.post(`/projects/${projectId}/leave/`)

// Transfer ownership (owner only, target must be existing member)
await apiClient.post(`/projects/${projectId}/transfer-ownership/`, { user_id: targetUserId })
```

---

## Analytics

```javascript
// Dashboard overview (all projects)
const res = await apiClient.get('/analytics/dashboard/', { params: { period: '24h' } })

// Project analytics
const res = await apiClient.get(`/analytics/projects/${projectId}/`, { params: { period: '7d' } })

// Time series (for charts)
const res = await apiClient.get(`/analytics/projects/${projectId}/time-series/`, {
  params: { period: '7d', granularity: 'hour', endpoint_id: optionalEndpointId }
})
// Returns array of { timestamp, request_count, error_count, avg_response_time, ... }

// Period comparison (for trend indicators)
const res = await apiClient.get(`/analytics/projects/${projectId}/comparison/`, {
  params: { period: '7d' }
})
// Returns { current: {...}, previous: {...}, changes: { total_requests_pct: 12.5, ... } }

// Slow endpoints
const res = await apiClient.get(`/analytics/projects/${projectId}/slow-endpoints/`, {
  params: { period: '7d', threshold: 500 }
})

// Error clusters
const res = await apiClient.get(`/analytics/projects/${projectId}/error-clusters/`, {
  params: { period: '7d' }
})

// Export data
window.open(`/api/v1/analytics/projects/${projectId}/export/?period=7d&format=csv`)
```

### Alerts

```javascript
// List alerts
const res = await apiClient.get(`/analytics/projects/${projectId}/alerts/`)

// Create alert
await apiClient.post(`/analytics/projects/${projectId}/alerts/`, {
  name: 'High Error Rate',
  metric: 'error_rate',
  comparison: 'gt',
  threshold: 5.0,          // 5% error rate
  endpoint_id: null,        // null = project-wide
  cooldown_minutes: 15
})

// Alert history (state changes)
const res = await apiClient.get(`/analytics/projects/${projectId}/alerts/${alertId}/history/`)
```

### SLA Monitoring

```javascript
// Create SLA
await apiClient.post(`/analytics/projects/${projectId}/sla/`, {
  name: 'Production API SLA',
  uptime_target_percent: 99.9,
  response_time_target_ms: 500,
  error_rate_target_percent: 1.0,
  evaluation_period: 'monthly',
  percentile: 'p95'
})

// SLA dashboard (all SLAs for project)
const res = await apiClient.get(`/analytics/projects/${projectId}/sla/dashboard/`)

// Uptime timeline (hourly)
const res = await apiClient.get(`/analytics/projects/${projectId}/sla/${slaId}/timeline/`)

// Downtime incidents
const res = await apiClient.get(`/analytics/projects/${projectId}/sla/${slaId}/incidents/`)
```

### Geo-Analytics

```javascript
// Country overview
const res = await apiClient.get(`/analytics/projects/${projectId}/geo/`, {
  params: { period: '7d' }
})

// Map data (for heatmap visualization)
const res = await apiClient.get(`/analytics/projects/${projectId}/geo/map/`)

// Country detail
const res = await apiClient.get(`/analytics/projects/${projectId}/geo/countries/US/`)

// Top ISPs
const res = await apiClient.get(`/analytics/projects/${projectId}/geo/isps/`)
```

---

## Payments

```javascript
// Create checkout session
const res = await apiClient.post('/payments/checkout/', {
  amount: 2999,           // $29.99 in cents
  currency: 'usd',
  description: 'Pro Plan - Monthly',
  success_url: window.location.origin + '/payments/success',
  cancel_url: window.location.origin + '/payments/cancel',
  metadata: { plan: 'pro' }
})
// Redirect user to Stripe:
window.location.href = res.data.data.checkout_url

// After payment, Stripe redirects to success_url.
// Payment status is updated via webhook (not client-side).

// List payment history
const res = await apiClient.get('/payments/')

// Get payment detail
const res = await apiClient.get(`/payments/${paymentUuid}/`)
```

---

## Error Handling Pattern

```javascript
try {
  const res = await apiClient.post('/auth/login/', { email, password })
  // Handle success
} catch (error) {
  if (error.response) {
    const { code, message, details } = error.response.data.error

    switch (code) {
      case 'VALIDATION_ERROR':
        // details contains field-level errors: { email: ["..."], password: ["..."] }
        setFieldErrors(details)
        break
      case 'AUTHENTICATION_ERROR':
        setError('Invalid email or password')
        break
      case 'ACCOUNT_LOCKED':
        setError(message)  // "Account locked until ..."
        break
      case '2FA_REQUIRED':
        // Navigate to 2FA challenge page
        break
      case 'THROTTLED':
        setError('Too many attempts. Please wait.')
        break
      default:
        setError(message)
    }
  } else {
    setError('Network error. Please try again.')
  }
}
```

---

## Pagination Pattern

All list endpoints use the same pagination shape:

```javascript
const fetchPage = async (page = 1, pageSize = 20) => {
  const res = await apiClient.get('/projects/', { params: { page, page_size: pageSize } })
  return {
    items: res.data.data,
    pageInfo: res.data.page_info  // { count, total_pages, current_page, page_size }
  }
}
```

---

## Frontend Routes the Backend Expects

These routes must exist in the frontend because the backend sends email links pointing to them:

| Route | Purpose | Token Source |
|-------|---------|-------------|
| `/verify-email?token=xxx` | Email verification | Query param from email link |
| `/reset-password?token=xxx` | Password reset | Query param from email link |
| `/payments/success` | Post-payment redirect | success_url sent to Stripe |
| `/payments/cancel` | Payment cancelled | cancel_url sent to Stripe |

---

## Key Constants

### Roles
```javascript
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
}

export const ROLE_HIERARCHY = { owner: 40, admin: 30, member: 20, viewer: 10 }
```

### Time Periods (for analytics)
```javascript
export const PERIODS = ['24h', '7d', '30d', '90d']
export const GRANULARITIES = ['hour', 'day', 'week', 'month']
```

### Alert Metrics
```javascript
export const ALERT_METRICS = [
  'error_rate', 'avg_response_time', 'p95_response_time',
  'p99_response_time', 'request_count', 'error_count'
]
export const ALERT_COMPARISONS = ['gt', 'lt', 'gte', 'lte']
```

### Payment Currencies
```javascript
export const CURRENCIES = ['usd', 'eur', 'gbp', 'inr']
```

### SLA Options
```javascript
export const SLA_PERIODS = ['weekly', 'monthly', 'quarterly']
export const SLA_PERCENTILES = ['p50', 'p95', 'p99']
```
