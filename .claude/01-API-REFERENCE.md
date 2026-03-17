# API Reference

Base URL: `http://localhost:8000/api/v1/`
Content-Type: `application/json`
Auth: `Authorization: Bearer <access_token>` (unless marked Public)

---

## Response Format

Every response follows this shape:

```json
// Success (200, 201)
{ "success": true, "data": { ... }, "message": "..." }

// Paginated (200)
{ "success": true, "data": [ ... ], "page_info": { "count": 42, "total_pages": 3, "current_page": 1, "page_size": 20, "next": null, "previous": null } }

// No Content (204)
(empty body)

// Error (4xx, 5xx)
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message", "details": { "field_name": ["Error detail"] } } }
```

---

## 1. Authentication

### POST /auth/register/ — Public
Register a new user. Sends verification email.

```
Request:
  email*            string    "user@example.com"
  password*         string    "SecurePass123!" (Django password validators apply)
  password_confirm* string    Must match password
  first_name        string
  last_name         string
  company_name      string

Response 201:
  data.user.id              int
  data.user.email           string
  data.user.first_name      string
  data.user.last_name       string
  data.user.company_name    string
  data.user.is_email_verified  bool (false)
  data.user.date_joined     datetime
  data.tokens.access        string (JWT)
  data.tokens.refresh       string (JWT)

Throttle: 5/hour per IP (RegistrationRateThrottle)
```

```bash
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!","password_confirm":"SecurePass123!","first_name":"John","last_name":"Doe"}'
```

### POST /auth/login/ — Public
Authenticate user. Returns tokens OR 2FA challenge token.

```
Request:
  email*     string
  password*  string

Response 200 (no 2FA):
  data.user            { id, email, first_name, last_name, ... }
  data.tokens.access   string (JWT, 60 min)
  data.tokens.refresh  string (JWT, 7 days)

Response 200 (2FA enabled):
  data.requires_2fa      true
  data.challenge_token   string (pass to /auth/2fa/challenge/)

Errors:
  401  AUTHENTICATION_ERROR  "Invalid credentials"
  403  ACCOUNT_LOCKED        "Account locked until {datetime}" (after 5 failed attempts, 30 min lockout)

Throttle: 10/min per IP (AuthenticationRateThrottle)
```

```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!"}'
```

### POST /auth/logout/
Blacklists refresh token and revokes session.

```
Request:
  refresh*  string  (refresh token to blacklist)

Response 200: { "success": true, "message": "Successfully logged out." }
```

### POST /auth/token/refresh/ — Public
Get new access token using refresh token. Rotates refresh token.

```
Request:
  refresh*  string

Response 200:
  data.access   string (new access token)
  data.refresh  string (new refresh token — old one is blacklisted)
```

---

## 2. Profile & User Settings

### GET /auth/profile/
Returns full user profile including settings.

```
Response 200:
  data.id                    int
  data.email                 string
  data.first_name            string
  data.last_name             string
  data.company_name          string
  data.is_email_verified     bool
  data.display_name          string
  data.timezone              string  (e.g. "UTC", "America/New_York")
  data.locale                string  (e.g. "en-us")
  data.default_landing_page  string  (e.g. "dashboard")
  data.avatar_url            string
  data.date_joined           datetime
```

### PUT|PATCH /auth/profile/
Update profile fields. PUT and PATCH behave identically (partial update).

```
Request (all optional):
  first_name            string
  last_name             string
  company_name          string
  display_name          string
  timezone              string
  locale                string
  default_landing_page  string
  avatar_url            string

Response 200: updated profile object (same shape as GET)
```

### POST /auth/change-password/
```
Request:
  old_password*          string
  new_password*          string  (Django validators apply)
  new_password_confirm*  string

Response 200: { "success": true, "message": "Password changed successfully." }

Throttle: 5/hour per user (PasswordChangeThrottle)
```

---

## 3. Email Verification

### POST /auth/verify-email/ — Public
```
Request:
  token*  string  (from verification email link)

Response 200:
  data.is_email_verified  true
```

### POST /auth/verify-email/resend/
Resends verification email. Invalidates previous tokens.

```
Request: (empty body)
Response 200: { "success": true, "message": "Verification email sent." }

Throttle: 3/hour (EmailVerificationThrottle)
```

---

## 4. Password Reset

### POST /auth/password-reset/ — Public
Always returns 200 to prevent email enumeration.

```
Request:
  email*  string

Response 200: { "message": "If an account with that email exists, a password reset link has been sent." }

Throttle: 5/hour per IP (PasswordResetThrottle)
```

### POST /auth/password-reset/confirm/ — Public
```
Request:
  token*                 string  (from reset email link, expires in 1 hour)
  new_password*          string
  new_password_confirm*  string

Response 200: { "message": "Password reset successfully." }
```

---

## 5. Two-Factor Authentication (TOTP)

### POST /auth/2fa/setup/
Generates TOTP secret and QR code. User must verify with a code to enable.

```
Response 200:
  data.secret            string  (base32 TOTP secret for manual entry)
  data.provisioning_uri  string  (otpauth:// URI)
  data.qr_code           string  (base64 PNG image)

Throttle: TwoFactorSetupThrottle
```

### POST /auth/2fa/verify-setup/
Confirm TOTP code to enable 2FA. Returns 10 recovery codes (show once).

```
Request:
  code*  string  (6-digit TOTP code)

Response 200:
  data.recovery_codes  string[]  (10 codes, format "XXXX-XXXX")
  data.message         "Two-factor authentication enabled."
```

### GET /auth/2fa/status/
```
Response 200:
  data.is_enabled               bool
  data.verified_at              datetime|null
  data.recovery_codes_remaining int
```

### POST /auth/2fa/challenge/ — Public
Complete login when 2FA is required.

```
Request:
  challenge_token*  string  (from login response)
  code*             string  (6-digit TOTP code OR recovery code "XXXX-XXXX")

Response 200:
  data.user            { id, email, ... }
  data.tokens.access   string
  data.tokens.refresh  string

Errors:
  400  2FA_INVALID_CODE      "Invalid verification code"
  403  2FA_LOCKED            "Too many failed attempts. Locked for 15 minutes."

Throttle: 10/min per IP (TwoFactorVerificationThrottle)
```

### POST /auth/2fa/disable/
```
Request:
  password*  string  (current password for confirmation)

Response 200: { "message": "Two-factor authentication disabled." }
```

### POST /auth/2fa/recovery-codes/regenerate/
Invalidates old codes, returns 10 new ones.

```
Request:
  password*  string

Response 200:
  data.recovery_codes  string[]  (10 new codes)
```

---

## 6. Sessions

### GET /auth/sessions/
List active (non-revoked, non-expired) sessions.

```
Response 200:
  data[]
    .jti         string  (session identifier)
    .ip_address  string
    .user_agent  string
    .created_at  datetime
    .expires_at  datetime
    .is_current  bool  (true if this session matches the request's JWT)
```

### DELETE /auth/sessions/{jti}/
Revoke a specific session. Blacklists the associated JWT.

```
Response 200: { "message": "Session revoked." }
```

### POST /auth/sessions/revoke-all/
Revoke all active sessions for the user.

```
Response 200:
  data.revoked_count  int
```

---

## 7. Security & Account

### GET /auth/security-events/
```
Response 200:
  data.last_login                  datetime|null
  data.last_password_change_at     datetime|null
  data.last_email_verification_at  datetime|null
  data.is_email_verified           bool
  data.failed_login_count          int
  data.is_locked                   bool
  data.locked_until                datetime|null
  data.active_session_count        int
  data.is_two_factor_enabled       bool
  data.two_factor_verified_at      datetime|null
```

### POST /auth/account/deactivate/
Soft-deactivates account (sets is_active=false).

```
Response 200: { "message": "Account deactivated successfully." }
```

### GET|PUT|PATCH /auth/notifications/
Notification preferences.

```
GET Response 200 / PUT|PATCH Request & Response:
  data.email_notifications_enabled           bool
  data.security_email_notifications_enabled  bool
  data.marketing_emails_opt_in               bool
  data.alert_trigger_notifications_enabled   bool
  data.alert_resolve_notifications_enabled   bool
  data.updated_at                            datetime (read-only)
```

### POST /auth/account/request-data-export/
```
Response 201:
  data.id            int
  data.request_type  "data_export"
  data.status        "pending"
  data.created_at    datetime

Throttle: DangerZoneThrottle
```

### POST /auth/account/request-deletion/
```
Response 201:
  data.id            int
  data.request_type  "account_deletion"
  data.status        "pending"
  data.created_at    datetime

Throttle: DangerZoneThrottle
```

---

## 8. Social Authentication

### POST /auth/social/google/ — Public
```
Request:
  id_token*  string  (Google OAuth2 id_token)

Response 200:
  data.user            { id, email, ... }
  data.tokens.access   string
  data.tokens.refresh  string
  data.is_new_user     bool

Throttle: SocialAuthRateThrottle
```

### POST /auth/social/apple/ — Public
```
Request:
  id_token*   string  (Apple Sign-In id_token)
  auth_code   string  (optional Apple authorization code)

Response 200: (same shape as Google)
```

---

## 9. Projects

### GET /projects/
List projects where user has membership. Paginated.

```
Query params:
  page       int  (default 1)
  page_size  int  (default 20, max 100)

Response 200 (paginated):
  data[]
    .id               int
    .name             string
    .description      string
    .api_key          string  (format: "ai_...")
    .is_active        bool
    .created_at       datetime
    .updated_at       datetime
    .endpoints_count  int
    .total_requests   int
    .my_role          string  ("owner"|"admin"|"member"|"viewer")
```

### POST /projects/
Create project. Creator automatically becomes owner.

```
Request:
  name*        string  (unique per user)
  description  string

Response 201:
  data  { id, name, description, api_key, is_active, created_at, ... }
```

### GET /projects/{id}/
```
Permission: project.view (any role)

Response 200:
  data  { ...project fields, endpoints: [ { id, path, method, name, ... } ] }
```

### PUT|PATCH /projects/{id}/
```
Permission: project.update (admin, owner)

Request:
  name         string
  description  string
  is_active    bool

Response 200: updated project
```

### DELETE /projects/{id}/
```
Permission: project.delete (owner only)

Response 200: { "message": "Project deleted successfully." }
```

### POST /projects/{id}/regenerate-key/
```
Permission: project.regenerate_key (owner only)

Request:
  confirm  bool  (must be true)

Response 200:
  data.api_key  string  (new key)

Throttle: 3/hour (APIKeyRegenerationThrottle)
```

---

## 10. API Endpoints (within Projects)

### GET /projects/{project_id}/endpoints/
Paginated list of endpoints.

```
Permission: endpoint.view

Query params:
  page       int
  page_size  int
  search     string  (filters by path)
  method     string  (e.g. "GET")

Response 200 (paginated):
  data[]
    .id          int
    .path        string
    .method      string
    .name        string
    .description string
    .is_active   bool
    .created_at  datetime
    .updated_at  datetime
```

### POST /projects/{project_id}/endpoints/
```
Permission: endpoint.create (member+)

Request:
  path*        string  (e.g. "/api/users")
  method*      string  ("GET"|"POST"|"PUT"|"PATCH"|"DELETE"|"HEAD"|"OPTIONS")
  name         string  (auto-generated from method+path if omitted)
  description  string

Response 201: endpoint object

Error: 409 if (project, path, method) already exists
```

### GET /projects/{project_id}/endpoints/{id}/
```
Permission: endpoint.view
Response 200: endpoint object
```

### PUT|PATCH /projects/{project_id}/endpoints/{id}/
```
Permission: endpoint.update (member+)
Request: { name, description, is_active }
Response 200: updated endpoint
```

### DELETE /projects/{project_id}/endpoints/{id}/
```
Permission: endpoint.delete (admin+)
Response 200: { "message": "Endpoint deleted successfully." }
```

---

## 11. Team Members

### GET /projects/{project_id}/members/
```
Permission: member.view

Response 200 (paginated):
  data[]
    .id          int  (membership id)
    .user        { id, email, first_name, last_name }
    .role        "owner"|"admin"|"member"|"viewer"
    .invited_by  { id, email } | null
    .created_at  datetime
```

### POST /projects/{project_id}/members/
```
Permission: member.add (admin+)

Request:
  email*  string  (must be an existing user)
  role*   string  ("viewer"|"member"|"admin")

Response 201: membership object

Errors:
  400  User already a member
  404  User not found
```

### PUT|PATCH /projects/{project_id}/members/{membership_id}/
```
Permission: member.change_role (admin+ with role hierarchy)

Request:
  role*  string

Rules:
  - Owner can change anyone's role
  - Admin can change member/viewer roles
  - Cannot change own role
  - Cannot promote to owner (use transfer)

Response 200: updated membership
```

### DELETE /projects/{project_id}/members/{membership_id}/
```
Permission: member.remove (admin+)

Rules:
  - Cannot remove owner
  - Admin can only remove member/viewer

Response 204: (no content)
```

### POST /projects/{project_id}/leave/
```
Permission: project.view (any member)

Rules:
  - Owner cannot leave (must transfer first)

Response 200: { "message": "You have left the project." }
```

### POST /projects/{project_id}/transfer-ownership/
```
Permission: project.transfer_ownership (owner only)

Request:
  user_id*  int  (must be existing member)

Effect:
  - Target becomes owner
  - Previous owner becomes admin

Response 200: { "message": "Ownership transferred successfully." }
```

---

## 12. Tracking API

**Auth: X-API-Key header** (not JWT). Public endpoints.

### POST /track/
Track a single API request/response event.

```
Headers:
  X-API-Key: ai_xxxxx  (project API key)

Request:
  request*
    .method*       string  ("GET"|"POST"|...)
    .path*         string  ("/api/users/123")
    .query_params  object  (default {})
    .headers       object  (default {})
    .body_size     int     (bytes, default 0)
  response*
    .status_code*  int     (100-599)
    .headers       object  (default {})
    .body_size     int     (bytes, default 0)
  timing*
    .started_at*   datetime  (ISO 8601)
    .ended_at*     datetime  (ISO 8601, must be after started_at)
  client
    .ip_address    string  (optional)
  context
    .user_id       string  (optional, your system's user ID)
    .custom_data   object  (optional)

Response 201:
  data.id                     int
  data.endpoint_path          string
  data.endpoint_method        string
  data.timestamp              datetime
  data.response_time_ms       int  (computed from timing)
  data.status_code            int
  data.status_category        "success"|"redirect"|"client_error"|"server_error"|"informational"
  data.response_time_category "fast"|"normal"|"slow"|"very_slow"

Server computes:
  - response_time_ms from timing.ended_at - timing.started_at
  - user_agent from request.headers["User-Agent"]
  - content types from headers
  - status_category from status_code
  - response_time_category: fast (<100ms), normal (100-500ms), slow (500-1000ms), very_slow (>1000ms)

Throttle: 10M/hour per API key (TrackingRateThrottle)
```

```bash
curl -X POST http://localhost:8000/api/v1/track/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ai_your_project_api_key" \
  -d '{
    "request": { "method": "GET", "path": "/api/users", "headers": {"User-Agent": "MyApp/1.0"} },
    "response": { "status_code": 200, "body_size": 1234 },
    "timing": { "started_at": "2026-02-23T10:00:00Z", "ended_at": "2026-02-23T10:00:00.150Z" }
  }'
```

### POST /track/batch/
Track multiple events. Same payload structure as single, wrapped in array.

```
Request:
  requests*  array  (1-1000 items, each same shape as single track request)

Response 201:
  data.tracked_count  int
  data.results        array
```

---

## 13. Analytics

All analytics endpoints require JWT auth and project membership.

### GET /analytics/dashboard/
Dashboard overview across all user's projects.

```
Query params:
  period  string  "24h"|"7d"|"30d"|"90d" (default "24h")

Response 200:
  data.projects[]
    .project          { id, name }
    .total_requests   int
    .error_rate       float
    .avg_response_time float (ms)
    .status_breakdown { "2xx": n, "3xx": n, "4xx": n, "5xx": n }
```

### GET /analytics/projects/{project_id}/
Project-level analytics.

```
Query params:
  period  string  "24h"|"7d"|"30d"|"90d"

Response 200:
  data.total_requests    int
  data.success_count     int
  data.error_count       int
  data.error_rate        float
  data.avg_response_time float
  data.p50_response_time float
  data.p95_response_time float
  data.p99_response_time float
  data.status_breakdown  { "2xx": n, "3xx": n, "4xx": n, "5xx": n }
```

### GET /analytics/projects/{project_id}/endpoints/{endpoint_id}/
Endpoint-level analytics (same shape as project-level).

### GET /analytics/projects/{project_id}/requests-per-endpoint/
```
Query params: period

Response 200:
  data[]
    .endpoint  { id, path, method }
    .count     int
```

### GET /analytics/projects/{project_id}/time-series/
Pre-aggregated time series with gap filling.

```
Query params:
  period       string  "24h"|"7d"|"30d"|"90d"
  granularity  string  "hour"|"day"|"week"|"month"
  endpoint_id  int     (optional, filter to one endpoint)

Response 200:
  data[]
    .timestamp          datetime
    .request_count      int
    .success_count      int
    .error_count        int
    .avg_response_time  float
    .p95_response_time  float
    .p99_response_time  float
    .error_rate         float
    .status_2xx         int
    .status_3xx         int
    .status_4xx         int
    .status_5xx         int
```

### GET /analytics/projects/{project_id}/comparison/
Period-over-period comparison.

```
Query params: period

Response 200:
  data.current   { total_requests, error_rate, avg_response_time, ... }
  data.previous  { total_requests, error_rate, avg_response_time, ... }
  data.changes   { total_requests_pct, error_rate_pct, avg_response_time_pct, ... }
```

### GET /analytics/projects/{project_id}/slow-endpoints/
```
Query params:
  period     string
  threshold  int  (ms, default 500)

Response 200:
  data[]
    .endpoint           { id, path, method }
    .avg_response_time  float
    .p95_response_time  float
    .request_count      int
```

### GET /analytics/projects/{project_id}/error-clusters/
```
Query params: period

Response 200:
  data[]
    .status_code  int
    .endpoint     { id, path, method }
    .count        int
    .percentage   float
```

### GET /analytics/projects/{project_id}/user-agents/
```
Query params: period

Response 200:
  data[]
    .user_agent  string
    .count       int
    .percentage  float
```

### GET /analytics/projects/{project_id}/export/
```
Query params:
  period  string
  format  "csv"|"json"

Response 200: file download
```

---

## 14. Alerts

### GET /analytics/projects/{project_id}/alerts/
```
Response 200:
  data[]
    .id           int
    .name         string
    .description  string
    .metric       "error_rate"|"avg_response_time"|"p95_response_time"|"p99_response_time"|"request_count"|"error_count"
    .comparison   "gt"|"lt"|"gte"|"lte"
    .threshold    float
    .endpoint     { id, path, method } | null  (null = project-wide)
    .status       "active"|"triggered"|"resolved"
    .is_active    bool
    .cooldown_minutes  int (default 15)
    .created_at   datetime
    .updated_at   datetime
```

### POST /analytics/projects/{project_id}/alerts/
```
Request:
  name*        string
  description  string
  metric*      string  (one of the metric choices above)
  comparison*  string  (one of the comparison choices above)
  threshold*   float
  endpoint_id  int     (optional)
  is_active    bool    (default true)
  cooldown_minutes  int (default 15)

Response 201: alert object
```

### GET /analytics/projects/{project_id}/alerts/{alert_id}/
### PUT|PATCH /analytics/projects/{project_id}/alerts/{alert_id}/
### DELETE /analytics/projects/{project_id}/alerts/{alert_id}/

### GET /analytics/projects/{project_id}/alerts/{alert_id}/history/
```
Response 200:
  data[]
    .id              int
    .event_type      "triggered"|"resolved"|"acknowledged"|"created"|"updated"|"disabled"|"enabled"
    .metric_value    float|null
    .threshold_value float|null
    .context         object
    .created_at      datetime
```

---

## 15. SLA / Uptime Monitoring

### GET /analytics/projects/{project_id}/sla/
List SLA configurations.

```
Response 200:
  data[]
    .id                         int
    .name                       string
    .endpoint                   { id, path, method } | null
    .uptime_target_percent      float  (e.g. 99.9)
    .response_time_target_ms    int
    .error_rate_target_percent  float
    .evaluation_period          "weekly"|"monthly"|"quarterly"
    .percentile                 "p50"|"p95"|"p99"
    .is_active                  bool
```

### POST /analytics/projects/{project_id}/sla/
Create SLA configuration.

```
Request:
  name*                       string
  endpoint_id                 int (optional)
  uptime_target_percent*      float
  response_time_target_ms*    int
  error_rate_target_percent*  float
  evaluation_period           string (default "monthly")
  percentile                  string (default "p95")

Response 201: SLA object
```

### GET|PUT|PATCH|DELETE /analytics/projects/{project_id}/sla/{sla_id}/

### GET /analytics/projects/{project_id}/sla/dashboard/
SLA compliance dashboard for all SLAs in the project.

```
Response 200:
  data[]
    .sla              { id, name, ... }
    .current_uptime   float  (percent)
    .is_meeting_sla   bool
    .incidents_count  int
```

### GET /analytics/projects/{project_id}/sla/{sla_id}/compliance/
```
Response 200:
  data.uptime_percent       float
  data.avg_response_time    float
  data.error_rate           float
  data.is_meeting_uptime    bool
  data.is_meeting_response  bool
  data.is_meeting_errors    bool
```

### GET /analytics/projects/{project_id}/sla/{sla_id}/timeline/
Hourly uptime records.

```
Response 200:
  data[]
    .timestamp         datetime
    .is_up             bool
    .request_count     int
    .error_count       int
    .error_rate        float
    .avg_response_time float
    .down_reason       "none"|"high_error_rate"|"no_traffic"
```

### GET /analytics/projects/{project_id}/sla/{sla_id}/incidents/
```
Response 200:
  data[]
    .id                  int
    .started_at          datetime
    .ended_at            datetime|null
    .duration_seconds    int
    .root_cause          "high_error_rate"|"no_traffic"|"high_response_time"
    .affected_endpoints  string[]
    .error_codes         int[]
    .avg_error_rate      float
    .avg_response_time   float
    .is_resolved         bool
```

---

## 16. Geo-Analytics

### GET /analytics/projects/{project_id}/geo/
```
Query params: period

Response 200:
  data[]
    .country_code       string  ("US", "IN", ...)
    .country            string  ("United States", ...)
    .request_count      int
    .error_count        int
    .avg_response_time  float
    .unique_ips         int
```

### GET /analytics/projects/{project_id}/geo/map/
Heatmap data with coordinates.

```
Response 200:
  data[]
    .country_code  string
    .latitude      float
    .longitude     float
    .request_count int
    .avg_response_time float
```

### GET /analytics/projects/{project_id}/geo/countries/{country_code}/
Country-specific analytics.

### GET /analytics/projects/{project_id}/geo/time-series/
Geographic time series by country.

### GET /analytics/projects/{project_id}/geo/performance/
Performance comparison by country.

### GET /analytics/projects/{project_id}/geo/isps/
Top ISPs/ASNs.

```
Response 200:
  data[]
    .asn            string
    .isp            string
    .request_count  int
    .avg_response_time float
```

---

## 17. Payments (Stripe)

### POST /payments/checkout/
Create Stripe Checkout session.

```
Request:
  amount*       int     (in cents, minimum 50)
  currency      string  ("usd"|"eur"|"gbp"|"inr", default "usd")
  description   string
  metadata      object  (custom data)
  success_url*  string  (redirect after payment)
  cancel_url*   string  (redirect on cancel)

Response 201:
  data.id                  uuid
  data.checkout_url        string  (Stripe hosted checkout page URL)
  data.status              "pending"
  data.amount              int
  data.currency            string
```

### GET /payments/
List user's payments. Ordered by newest first.

```
Response 200:
  data[]
    .id                        uuid
    .stripe_checkout_session_id string
    .stripe_payment_intent_id   string|null
    .amount                    int  (cents)
    .currency                  string
    .description               string
    .status                    "pending"|"succeeded"|"failed"|"cancelled"|"expired"
    .metadata                  object
    .created_at                datetime
    .completed_at              datetime|null
```

### GET /payments/{uuid}/
Get single payment detail.

### POST /payments/webhook/ — Public (Stripe signature verified)
Stripe webhook endpoint. Do not call from frontend.

Events handled:
  - `checkout.session.completed` → updates payment to succeeded
  - `payment_intent.succeeded` → updates payment intent ID

---

## 18. Audit Logs

### GET /projects/{project_id}/audit-logs/
List audit logs for a project. Paginated.

```
Permission: must be project member

Response 200 (paginated):
  data[]
    .id              int
    .actor_email     string
    .action          string  (see action list below)
    .resource_type   string  (see resource types below)
    .resource_id     string
    .description     string
    .changes         object  (old→new field values)
    .ip_address      string
    .created_at      datetime

Actions: create, update, delete, regenerate, login, logout, register,
  password_change, transfer, leave, email_verify, password_reset_req,
  password_reset, account_lock, account_unlock, account_deactivate,
  account_activate, session_revoke, session_revoke_all, data_export_req,
  deletion_req, 2fa_setup_init, 2fa_enable, 2fa_disable,
  2fa_recovery_use, 2fa_recovery_regen, 2fa_lock, social_login, social_register

Resource types: project, endpoint, member, alert, api_key, user, auth,
  session, verification, account, 2fa, social_auth
```

---

## Error Codes Reference

| Code | HTTP | Meaning |
|------|------|---------|
| VALIDATION_ERROR | 400 | Invalid request data |
| AUTHENTICATION_ERROR | 401 | Invalid credentials |
| INVALID_TOKEN | 401 | Token expired or invalid |
| 2FA_REQUIRED | 403 | Must complete 2FA challenge |
| 2FA_ALREADY_ENABLED | 400 | 2FA is already set up |
| 2FA_NOT_ENABLED | 400 | 2FA is not set up |
| 2FA_INVALID_CODE | 400 | Wrong TOTP/recovery code |
| 2FA_LOCKED | 403 | Too many failed 2FA attempts |
| ACCOUNT_LOCKED | 403 | Account locked after failed logins |
| PERMISSION_DENIED | 403 | Insufficient role for action |
| API_KEY_ERROR | 401 | Invalid or missing API key |
| NOT_FOUND | 404 | Resource not found |
| PAYMENT_ERROR | 400 | Payment processing failed |
| STRIPE_API_ERROR | 502 | Stripe API failure |
| WEBHOOK_VERIFICATION_ERROR | 400 | Invalid webhook signature |
| THROTTLED | 429 | Rate limit exceeded |

---

## Rate Limits Summary

| Endpoint Category | Limit | Scope |
|---|---|---|
| Tracking API | 10,000,000/hour | Per API key |
| Authentication (login/register) | 10/min | Per IP |
| Registration | 5/hour | Per IP |
| Password change | 5/hour | Per user |
| Password reset | 5/hour | Per IP |
| Email verification resend | 3/hour | Per user |
| API key regeneration | 3/hour | Per user |
| 2FA verification | 10/min | Per IP |
| Analytics | 10,000/hour | Per user |
| General burst | 100/min | Per user |
| General sustained | 1,000/hour | Per user |
