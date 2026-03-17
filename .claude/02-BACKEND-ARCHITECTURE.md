# Backend Architecture & Data Models

Understanding how the backend works so we never need to re-read its source code.

---

## Stack

- Django 4.2 + Django REST Framework
- MySQL (utf8mb4)
- Redis (Celery broker, caching)
- Celery (async tasks: emails, data processing)
- Stripe (payments)
- drf-spectacular (OpenAPI schema at /api/docs/)

---

## Design Patterns

1. **Thin Views + Fat Services** — Views only handle HTTP; all logic lives in service classes.
2. **Membership-Based RBAC** — Access to projects is via `ProjectMembership`, not the project's `user` FK (which is just the creator reference).
3. **Raw Data In → Server Computes** — The tracking SDK sends raw HTTP request/response metadata; the server derives response_time_ms, status_category, user_agent, etc.
4. **Pre-Aggregated Analytics** — `TimeSeriesMetric` stores pre-computed hourly/daily/weekly/monthly aggregates for fast dashboard queries. The frontend never queries raw `APIRequest` data directly.
5. **Immutable Audit Trail** — Every mutation (create/update/delete/login/logout/etc.) writes to `AuditLog`. Never modified or deleted.
6. **Webhook-Driven Payments** — Payment status transitions only happen via Stripe webhooks, never from client-side. The frontend only creates checkout sessions and reads status.
7. **Thread-Local Request Context** — Correlation IDs (`X-Request-ID`), user ID, IP address are stored in thread-local storage and propagated across all function calls including audit logging.

---

## Data Models

### User (accounts.User)

The auth model. Email is the unique identifier (no username).

```
id                         int PK
email                      string UNIQUE (login identifier)
first_name                 string
last_name                  string
company_name               string
is_staff                   bool
is_active                  bool (false = deactivated)
is_email_verified          bool

-- Profile settings --
display_name               string
timezone                   string (default "UTC")
locale                     string (default "en-us")
default_landing_page       string (default "dashboard")
avatar_url                 string

-- 2FA --
is_two_factor_enabled      bool
two_factor_verified_at     datetime|null
two_factor_failed_count    int
two_factor_locked_until    datetime|null

-- Security --
failed_login_count         int (resets on success, locks at 5)
locked_until               datetime|null (30 min lockout)
last_password_change_at    datetime|null
last_email_verification_at datetime|null

-- Timestamps --
date_joined                datetime
updated_at                 datetime
```

Related models:
- `TwoFactorSecret` — 1:1, encrypted TOTP secret (PBKDF2 + Fernet)
- `RecoveryCode` — 1:N, hashed backup codes (HMAC-SHA256), 10 per user
- `EmailVerificationToken` — 1:N, expires 24h
- `PasswordResetToken` — 1:N, expires 1h
- `NotificationPreference` — 1:1, email/alert notification toggles
- `UserSession` — 1:N, JWT session tracking with jti/IP/UA
- `DangerZoneRequest` — 1:N, data export or account deletion requests

### Project (projects.Project)

```
id            int PK
user          FK → User (creator, NOT the access control authority)
name          string (unique per creator)
description   text
api_key       string UNIQUE (format: "ai_{base64}", 64 chars)
is_active     bool
created_at    datetime
updated_at    datetime
```

### APIEndpoint (projects.APIEndpoint)

```
id          int PK
project     FK → Project
path        string (e.g. "/api/users")
method      string ("GET"|"POST"|"PUT"|"PATCH"|"DELETE"|"HEAD"|"OPTIONS")
name        string (auto-generated from method+path if blank)
description text
is_active   bool
created_at  datetime
updated_at  datetime

UNIQUE (project, path, method)
```

Auto-created by tracking service when a new path+method combo is first seen.

### ProjectMembership (projects.ProjectMembership)

**This is the authority for access control.**

```
id          int PK
project     FK → Project
user        FK → User
role        "owner"|"admin"|"member"|"viewer"
invited_by  FK → User (nullable)
created_at  datetime
updated_at  datetime

UNIQUE (project, user)
```

### APIRequest (tracking.APIRequest)

Raw tracked request data. High-volume table.

```
id                      int PK
endpoint                FK → APIEndpoint (indexed)
timestamp               datetime (indexed)
response_time_ms        int (computed server-side)
status_code             int (indexed)
status_category         "success"|"redirect"|"client_error"|"server_error"|"informational" (indexed)
response_time_category  "fast"|"normal"|"slow"|"very_slow" (indexed)
request_started_at      datetime|null
request_ended_at        datetime|null
request_content_type    string
response_content_type   string
ip_address              string|null
user_agent              text
request_headers         JSON
raw_request_headers     JSON
raw_response_headers    JSON
query_params            JSON
request_body_size       int
response_body_size      int
user_id                 string (client system's user ID, indexed)
error_message           text
custom_data             JSON
created_at              datetime
```

### TimeSeriesMetric (analytics.TimeSeriesMetric)

Pre-aggregated metrics. One row per (project, endpoint, timestamp, granularity).

```
id                  int PK
project             FK → Project
endpoint            FK → APIEndpoint (nullable — null = project-wide)
timestamp           datetime
granularity         "hour"|"day"|"week"|"month"
request_count       int
success_count       int
error_count         int
avg_response_time   float
min_response_time   float
max_response_time   float
p50_response_time   float
p95_response_time   float
p99_response_time   float
status_2xx          int
status_3xx          int
status_4xx          int
status_5xx          int
```

### Alert (analytics.Alert)

```
id                int PK
project           FK → Project
endpoint          FK → APIEndpoint (nullable — null = project-wide alert)
name              string
description       string
metric            "error_rate"|"avg_response_time"|"p95_response_time"|"p99_response_time"|"request_count"|"error_count"
comparison        "gt"|"lt"|"gte"|"lte"
threshold         float
status            "active"|"triggered"|"resolved"
is_active         bool
cooldown_minutes  int (default 15)
last_triggered_at datetime|null
created_at        datetime
updated_at        datetime
```

### AlertHistory (analytics.AlertHistory)

Immutable timeline of alert state changes.

```
id              int PK
alert           FK → Alert
event_type      "triggered"|"resolved"|"acknowledged"|"created"|"updated"|"disabled"|"enabled"
metric_value    float|null
threshold_value float|null
acknowledged_by FK → User (nullable)
context         JSON
created_at      datetime
```

### SLAConfig (analytics.SLAConfig)

```
id                              int PK
project                         FK → Project
endpoint                        FK → APIEndpoint (nullable)
name                            string
uptime_target_percent           float (e.g. 99.9)
response_time_target_ms         int
error_rate_target_percent       float
evaluation_period               "weekly"|"monthly"|"quarterly"
percentile                      "p50"|"p95"|"p99"
downtime_threshold_error_rate   float
downtime_threshold_no_traffic_minutes int
is_active                       bool
created_at                      datetime
updated_at                      datetime
```

### UptimeRecord (analytics.UptimeRecord)

One per SLA per hour.

```
sla_config          FK → SLAConfig
timestamp           datetime
is_up               bool
request_count       int
error_count         int
error_rate          float
avg_response_time   float
p95_response_time   float
p99_response_time   float
down_reason         "none"|"high_error_rate"|"no_traffic"
```

### DowntimeIncident (analytics.DowntimeIncident)

```
sla_config          FK → SLAConfig
started_at          datetime
ended_at            datetime|null
duration_seconds    int
root_cause          "high_error_rate"|"no_traffic"|"high_response_time"
affected_endpoints  JSON (string[])
error_codes         JSON (int[])
avg_error_rate      float
avg_response_time   float
is_resolved         bool
```

### Payment (payments.Payment)

```
id                          UUID PK
user                        FK → User
stripe_checkout_session_id  string UNIQUE (cs_...)
stripe_payment_intent_id    string|null (pi_...)
amount                      int (cents)
currency                    "usd"|"eur"|"gbp"|"inr"
description                 string
status                      "pending"|"succeeded"|"failed"|"cancelled"|"expired"
metadata                    JSON
created_at                  datetime
updated_at                  datetime
completed_at                datetime|null
```

Lifecycle: `pending` → `succeeded`|`failed`|`cancelled`|`expired` (only via webhooks)

### AuditLog (audit.AuditLog)

```
id              int PK
actor           FK → User (SET_NULL)
actor_email     string (denormalized — survives user deletion)
action          string (28 action types)
resource_type   string (12 resource types)
resource_id     string
description     string
project         FK → Project (nullable)
changes         JSON ({ field: { old, new } })
ip_address      string|null
user_agent      string
correlation_id  string
created_at      datetime
```

---

## RBAC: Role Hierarchy & Permissions

Roles ranked by power level:

```
owner  (40)  > admin (30) > member (20) > viewer (10)
```

Permission map (minimum role required):

| Action | Min Role |
|--------|----------|
| project.view | viewer |
| project.update | admin |
| project.delete | owner |
| project.regenerate_key | owner |
| project.transfer_ownership | owner |
| endpoint.view | viewer |
| endpoint.create | member |
| endpoint.update | member |
| endpoint.delete | admin |
| member.view | viewer |
| member.add | admin |
| member.change_role | admin |
| member.remove | admin |
| alert.view | viewer |
| alert.create | member |
| alert.update | member |
| alert.delete | admin |

Role management hierarchy:
- Owner can manage anyone
- Admin can manage member and viewer (not other admins or owner)
- No one can change their own role
- Ownership transfer: owner → target becomes owner, old owner → admin

---

## Authentication Flow

### Standard Login
```
Client                              Server
  |                                   |
  |-- POST /auth/login/ ------------->|
  |   { email, password }             |
  |                                   |-- Check credentials
  |                                   |-- Check account not locked
  |                                   |-- Check 2FA status
  |                                   |
  |<-- 200 { tokens } ---------------|  (no 2FA)
  |                                   |
  |<-- 200 { requires_2fa,           |  (2FA enabled)
  |          challenge_token } -------|
  |                                   |
  |-- POST /auth/2fa/challenge/ ----->|  (if 2FA)
  |   { challenge_token, code }       |
  |                                   |
  |<-- 200 { tokens } ---------------|
```

### Token Refresh
```
Client                              Server
  |                                   |
  |-- POST /auth/token/refresh/ ----->|
  |   { refresh: "old_token" }        |
  |                                   |-- Validate old refresh
  |                                   |-- Blacklist old refresh
  |                                   |-- Issue new pair
  |<-- 200 { access, refresh } ------|
```

Access token: 60 min. Refresh token: 7 days. Old refresh is blacklisted on rotation.

### Account Lockout
- After 5 consecutive failed logins → locked for 30 minutes
- After 5 consecutive failed 2FA attempts → 2FA locked for 15 minutes

---

## Email Templates

The backend sends these emails (via Celery async tasks):

| Template | Trigger | Contains |
|----------|---------|----------|
| email_verification | Registration, resend verification | Verification link with token |
| password_reset | Password reset request | Reset link with token (1h expiry) |
| welcome | Social auth first-time registration | Welcome message |

The frontend needs to handle the token URLs. Tokens arrive as query params in the email links — the frontend routes must extract them and call the appropriate API.

---

## Caching

- Project API key lookups: 5 min cache (key: `project:api_key:{key[:16]}`)
- Cache invalidation on: project delete, API key regeneration
- Analytics queries use pre-aggregated TimeSeriesMetric (not raw APIRequest)

---

## Tracking SDK Pattern

The backend provides a Python SDK (`sdk/tracker.py`) that shows the expected integration pattern:

```python
tracker = APIInsightsTracker(api_key="ai_...", endpoint="http://localhost:8000/api/v1/track/")
tracker.track({
    "request":  { "method": "GET", "path": "/api/users", "headers": {...} },
    "response": { "status_code": 200, "headers": {...}, "body_size": 1234 },
    "timing":   { "started_at": "...", "ended_at": "..." },
    "client":   { "ip_address": "1.2.3.4" },
    "context":  { "user_id": "u123", "custom_data": {...} }
})
```

Features: async batching (100 items or 5s flush), background thread, retry on failure.
