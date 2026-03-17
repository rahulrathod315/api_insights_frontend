# API Insights Frontend — Claude Reference

This is the authoritative reference for building the API Insights frontend.
All backend knowledge is captured in these 4 documents so the backend source
code never needs to be re-read during frontend development.

## Documentation Index

### 01-API-REFERENCE.md
Complete API reference for all 66 endpoints across 6 domains.
Every endpoint has: HTTP method, URL, auth requirement, request fields,
response shape, error codes, rate limits, and cURL examples.

**Use when:** You need the exact request/response contract for any endpoint.

### 02-BACKEND-ARCHITECTURE.md
Backend architecture, all data models with every field, RBAC rules,
authentication flows, email templates, caching strategy, and design patterns.

**Use when:** You need to understand how data is structured, how access
control works, or how the backend processes data.

### 03-FRONTEND-STANDARDS.md
Non-negotiable frontend code organization rules: directory structure,
component patterns, service layer conventions, naming, and import rules.

**Use when:** Creating new files, components, or features. Check placement
and naming before writing code.

### 04-INTEGRATION-PATTERNS.md
Concrete JavaScript code examples for every major integration scenario:
authentication flows, CRUD operations, analytics queries, payments,
error handling, pagination, and constants.

**Use when:** Implementing a feature and need working code patterns.

## Quick Answers

- **Base URL:** `http://localhost:8000/api/v1/`
- **Auth header:** `Authorization: Bearer <access_token>`
- **Tracking auth:** `X-API-Key: ai_xxx` header (no JWT)
- **Token lifetime:** Access 60 min, Refresh 7 days
- **Pagination:** `?page=1&page_size=20` (max 100)
- **Time periods:** `24h`, `7d`, `30d`, `90d`
- **Roles:** owner > admin > member > viewer
- **API key format:** `ai_` + 32-char base64
- **Response envelope:** `{ success, data, message }` or `{ success, error: { code, message, details } }`

## Frontend Routes Required by Backend

| Route | Why |
|-------|-----|
| `/verify-email?token=xxx` | Email verification links |
| `/reset-password?token=xxx` | Password reset links |
| `/payments/success` | Stripe post-payment redirect |
| `/payments/cancel` | Stripe cancellation redirect |

## Error Code Quick Reference

| Code | HTTP | Meaning |
|------|------|---------|
| VALIDATION_ERROR | 400 | Bad input (details has field errors) |
| AUTHENTICATION_ERROR | 401 | Wrong credentials |
| INVALID_TOKEN | 401 | Expired/invalid JWT |
| ACCOUNT_LOCKED | 403 | Too many failed logins (30 min) |
| 2FA_REQUIRED | 403 | Must complete 2FA |
| 2FA_INVALID_CODE | 400 | Wrong TOTP/recovery code |
| 2FA_LOCKED | 403 | Too many failed 2FA (15 min) |
| PERMISSION_DENIED | 403 | Insufficient role |
| NOT_FOUND | 404 | Resource not found |
| THROTTLED | 429 | Rate limited |
| PAYMENT_ERROR | 400 | Payment failed |
