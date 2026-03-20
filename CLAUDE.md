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
`main.jsx` → `App.jsx` (wraps `BrowserRouter` + `ThemeProvider` + `AuthProvider`) → `routes.jsx` (declarative route config)

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

### Styling & Theme

**Monochromatic design system** — the UI is entirely black & white. Color is reserved exclusively for charts, graphs, and data visualizations.

- **Theme mode**: Dark-first, with light mode support. Managed by `next-themes` via `ThemeProvider` (wraps entire app in `App.jsx`). Dark mode applies `.dark` class to `<html>`, light mode applies `.light`.
- **Theme toggle**: `ThemeToggle` component in the TopBar. Uses `useTheme()` from `next-themes`.
- **TopBar icons**: Icons in the navigation/top bar must be borderless and backgroundless — plain icon buttons that change color on hover only.
- **ShadCN components**: Use Tailwind utility classes. Add new components with `npx shadcn@latest add <name>`.
- **Legacy components**: Use co-located CSS files with `--app-*` CSS custom properties.
- **Font**: DM Sans (loaded via Google Fonts in index.html).
- **Path alias**: `@/` → `src/` (configured in vite.config.js, jsconfig.json, components.json).

#### Color philosophy
- **UI elements**: Black/white/gray only. No colored accents on buttons, links, borders, or text.
  - Dark mode: near-black backgrounds (`#0c0c10`), dark cards (`#16161c`), white text (`#f0f0f5`), white accent.
  - Light mode: light gray backgrounds (`#f5f5f7`), white cards, dark text (`#111118`), black accent.
- **Charts & graphs**: Use vibrant `--chart-1` through `--chart-8` CSS variables (indigo, cyan, pink, purple, emerald, orange, yellow, red). These are the ONLY colored elements in the UI.
- **3D charts**: Use 3D/perspective effects on data visualizations where appropriate.

#### CSS custom properties
- **Backgrounds**: `--app-bg-primary`, `--app-bg-card`, `--app-bg-input`
- **Text**: `--app-text-primary`, `--app-text-secondary`, `--app-text-muted`, `--app-text-dim`, `--app-text-subtle`
- **Borders**: `--app-border`, `--app-border-hover`, `--app-border-subtle`
- **Accent** (monochrome): `--app-accent` (white in dark, black in light), `--app-accent-hover`
- **Overlays**: `--app-hover-overlay`, `--app-active-overlay` — use instead of hardcoded `rgba()` for hover/active states
- **Focus**: `--app-focus-ring` — use for focus ring `box-shadow`
- **Semantic**: `--app-danger`, `--app-error`, `--app-error-bg`, `--app-success`, `--app-success-bg`
- **Charts**: `--chart-1` through `--chart-8` — vibrant palette for data viz only

### Design tokens
- **Radius**: Base `--radius: 1rem` (16px). Cascaded: sm=9.6px, md=12.8px, lg=16px, xl=22.4px.
- **Shadows**: `--app-shadow-sm`, `--app-shadow-md`, `--app-shadow-lg`, `--app-shadow-xl` — progressively deeper.
- **Card surface**: `.card-surface` utility class — applies card bg, xl radius, lg shadow, and border.
- **Buttons**: `rounded-xl`, `font-semibold`, default height h-9, lg height h-10.
- **Inputs**: 1px border, `--radius-md` corners, focus ring uses `--app-focus-ring`.
- **Auth card**: `--radius-xl` corners, `--app-shadow-xl`, 1px border, CTA uses `--radius-md`.

### UI/UX Rules

- **No dummy data**: Never use placeholder or static data in components. Always connect to real backend APIs. If the backend doesn't support a feature yet, show an empty state (e.g., "No notifications yet") instead of fake entries.
- **Project-scoped data**: The user selects a project via the ProjectSwitcher in the navigation bar. All dashboard pages, analytics, and data displays must show data specific to the selected project only — never aggregated across all projects.
- **Sidebar icons**: Stroke-only by default, filled on hover and active state. Use the `SidebarIcon` component with stroke/filled SVG pairs.
- **TopBar icons**: Must be borderless and backgroundless — plain icon buttons with color change on hover only.
- **Consistent heights**: Never increase vertical height of UI elements to make them bigger. Only increase horizontal width/padding. Heights must remain standard across the application.

## Backend repository

The backend source code is at `/Users/rahulrathod/Personal Work/API Insights/Back-end`.

**IMPORTANT:** Always use `DJANGO_SETTINGS_MODULE=api_insights.settings.production` for all backend `manage.py` commands.

## Environment variables

- `VITE_API_URL` — API base URL (default: `/api`)
- `VITE_GOOGLE_CLIENT_ID` — Google Sign-In client ID
- `VITE_APPLE_SERVICE_ID` — Apple Sign-In service ID
