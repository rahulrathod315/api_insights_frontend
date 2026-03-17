# Frontend Architecture Standards

Non-negotiable rules for code organization in this project.

---

## Principles

1. **Directory discipline** — No flat dumping directories. Sub-organize by responsibility, domain, or feature when a directory grows.
2. **Ownership boundaries** — Feature-specific code stays scoped to its feature. Shared code must be intentionally promoted.
3. **Folder-based components** — One component (or closely related group) per folder, co-located with its styles, types, and helpers.
4. **Layered responsibility** — UI components are presentational. Business logic and data access live outside UI layers. No API calls in components.
5. **Consistency over creativity** — Extend existing patterns. Do not invent new structural conventions.
6. **Intentional placement** — Every file has a justified location. Ask for clarification rather than guessing.

---

## Directory Structure

```
src/
├── app/                        # App shell
│   ├── App.jsx
│   ├── App.css
│   └── routes.jsx              # Route definitions
│
├── features/                   # Feature modules (one per domain)
│   ├── auth/
│   │   ├── components/         # Auth-specific UI
│   │   │   ├── LoginForm/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── LoginForm.css
│   │   │   ├── RegisterForm/
│   │   │   ├── TwoFactorSetup/
│   │   │   └── ...
│   │   ├── hooks/              # Auth-specific hooks
│   │   │   └── useAuth.js
│   │   ├── services/           # Auth API calls
│   │   │   └── authService.js
│   │   └── index.js            # Public exports
│   │
│   ├── projects/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── index.js
│   │
│   ├── analytics/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── index.js
│   │
│   ├── settings/               # Profile, notifications, sessions, danger zone
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── index.js
│   │
│   └── payments/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── index.js
│
├── shared/                     # Truly reusable, domain-agnostic code
│   ├── components/             # UI primitives (Button, Modal, Card, Table, ...)
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   └── Button.css
│   │   └── ...
│   ├── hooks/                  # Shared hooks (useLocalStorage, useDebounce, ...)
│   ├── utils/                  # Pure utilities (formatDate, formatCurrency, ...)
│   └── constants/              # App-wide constants and enums
│
├── services/                   # Shared service layer
│   └── api.js                  # Axios instance with JWT interceptors
│
├── pages/                      # Page components (one per route)
│   ├── Dashboard/
│   │   └── DashboardPage.jsx
│   ├── Login/
│   │   └── LoginPage.jsx
│   └── ...
│
├── layouts/                    # Layout shells
│   ├── AuthLayout.jsx          # For login/register (no sidebar)
│   └── AppLayout.jsx           # For authenticated pages (sidebar + header)
│
├── main.jsx                    # Entry point
└── index.css                   # Global styles
```

---

## Rules

### Components
- One component per folder.
- Co-locate: `ComponentName.jsx`, `ComponentName.css`, `ComponentName.test.jsx`.
- Components receive data via props. They do not call APIs or contain business logic.
- Components do not import from other features. If shared, promote to `shared/components/`.

### Services
- Each feature has its own `services/` directory with functions that call the API.
- Service functions return the `data` field from the response (unwrap the standard envelope).
- Service functions throw on error (let the caller handle it).
- Never put API calls in components or hooks directly — always go through a service.

### Hooks
- Feature hooks orchestrate service calls with loading/error state.
- Shared hooks go in `shared/hooks/` only if used by 2+ features.
- Hook naming: `useXxx`.

### Pages
- One page per route.
- Pages compose feature components and pass data via props.
- Pages may use feature hooks directly.

### Imports
- Features may import from `shared/` and `services/`.
- Features must NOT import from other features (if needed, promote to shared).
- Pages may import from any feature.

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Component file | PascalCase | `LoginForm.jsx` |
| Component folder | PascalCase | `LoginForm/` |
| Hook file | camelCase | `useAuth.js` |
| Service file | camelCase | `authService.js` |
| Utility file | camelCase | `formatDate.js` |
| CSS file | Same as component | `LoginForm.css` |
| Constant file | camelCase | `roles.js` |
| Page component | PascalCase + "Page" | `DashboardPage.jsx` |

---

## Before Writing Code

1. Which feature does this belong to?
2. Is this UI, business logic, or data access?
3. Does it already exist somewhere?
4. If shared, is it used by 2+ features?
5. Does the file placement match the rules above?

If unclear, ask before placing.
