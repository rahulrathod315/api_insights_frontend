# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 3000 (proxies /api → localhost:8000)
npm run build      # Production build (Vite)
npm run preview    # Preview production build
npm run lint       # ESLint (js,jsx)
```

No test runner is configured yet.

## Architecture

React 18 SPA with React Router v7, Axios for HTTP, Tailwind CSS v4 + ShadCN UI (Base Nova style, JSX).

### Entry flow
`main.jsx` → `App.jsx` (wraps `BrowserRouter` + `AuthProvider`) → `routes.jsx` (declarative route config)

### Route protection
- `AuthRoute` — wraps auth pages (login, register, etc.), redirects authenticated users to `/`
- `ProtectedRoute` — wraps dashboard pages, redirects unauthenticated users to `/login`
- Both read from `AuthContext` via `useAuth()`

### Directory layout
```
src/
├── app/              # App shell: App.jsx, routes.jsx
├── features/         # Feature modules (auth/, projects/, analytics/, settings/, payments/)
│   └── {feature}/
│       ├── components/   # Feature-specific UI (folder-per-component)
│       ├── hooks/        # Feature-specific hooks
│       ├── services/     # API call functions
│       └── index.js      # Public exports
├── pages/            # One page per route (orchestrates features, handles state)
├── layouts/          # AuthLayout (no sidebar), DashboardLayout (sidebar + topbar)
├── shared/           # Domain-agnostic: components/, hooks/, utils/, constants/
├── services/         # api.js (Axios instance with JWT interceptors)
├── components/ui/    # ShadCN components (added via `npx shadcn@latest add <name>`)
└── lib/              # utils.js (cn() helper)
```

### Key patterns

**Service layer**: All API calls go through service functions (never in components). Services unwrap the response envelope and throw on error.
```
apiClient.post('/v1/auth/login/', {...}) → returns res.data.data / throws res.error
```

**Components are presentational**: Receive data via props, emit events via callbacks. No API calls or business logic in components.

**Pages orchestrate**: Pages import feature components, call services (or feature hooks), manage state, and handle errors.

**Import boundaries**: Features import from `shared/` and `services/` only. Features must NOT import from other features. Pages may import from any feature.

### Auth flow
`AuthProvider` checks localStorage for tokens on mount → calls `getProfile()` to hydrate user. Axios request interceptor adds `Authorization: Bearer` header. Response interceptor catches 401 → clears tokens → redirects to `/login`.

### Styling
- **ShadCN components**: Use Tailwind utility classes. Add new components with `npx shadcn@latest add <name>`.
- **Legacy components**: Use co-located CSS files with `--app-*` CSS custom properties (e.g., `--app-bg-primary`, `--app-border`, `--app-accent`).
- **Theme**: Dark navy background (`#1e2535`), card surfaces (`#252d3d`), orange accent (`#ff6a42`). ShadCN vars in `:root` are pre-configured to match.
- **Font**: DM Sans (loaded via Google Fonts in index.html).
- **Path alias**: `@/` → `src/` (configured in vite.config.js, jsconfig.json, components.json).

## Backend repository

The backend source code is at `/Users/rahulrathod/Personal Work/API Insights/Back-end`.

## Environment variables

- `VITE_API_URL` — API base URL (default: `/api`)
- `VITE_GOOGLE_CLIENT_ID` — Google Sign-In client ID
- `VITE_APPLE_SERVICE_ID` — Apple Sign-In service ID
